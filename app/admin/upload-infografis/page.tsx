"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AdminLayout } from "@/components/admin/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import * as LucideIcons from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

interface Tag {
  id: string
  text: string
}

// Komponen utama yang menggunakan useSearchParams
function UploadInfografisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const supabase = createClientComponentClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const authCheckedRef = useRef(false)
  const sessionRetryCountRef = useRef(0)
  const maxRetries = 3
  const hasBypass = searchParams?.has('bypass')

  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [title, setTitle] = useState("")
  const [category, setCategory] = useState("")
  const [description, setDescription] = useState("")
  const [dataSource, setDataSource] = useState("")
  const [tagInput, setTagInput] = useState("")
  const [tags, setTags] = useState<Tag[]>([])
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [imageWidth, setImageWidth] = useState<number>(0)
  const [imageHeight, setImageHeight] = useState<number>(0)
  const [published, setPublished] = useState(false)
  const [categories, setCategories] = useState<string[]>([])
  const [suggestedTags, setSuggestedTags] = useState<string[]>([])
  const [aspectRatioValid, setAspectRatioValid] = useState<boolean | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(true) // Mulai dengan asumsi sudah terautentikasi

  // Fetch categories and tags on component mount
  useEffect(() => {
    const fetchCategoriesAndTags = async () => {
      try {
        // Fetch categories
        const categoriesRes = await fetch("/api/infografis/categories")
        const categoriesData = await categoriesRes.json()

        if (categoriesData.data) {
          setCategories(categoriesData.data)
        }

        // Fetch tags
        const tagsRes = await fetch("/api/infografis/tags")
        const tagsData = await tagsRes.json()

        if (tagsData.data) {
          setSuggestedTags(tagsData.data)
        }
      } catch (error) {
        console.error("Error fetching categories or tags:", error)
      }
    }

    fetchCategoriesAndTags()
  }, [])

  // Logger untuk debugging
  const logAuthStatus = (action: string, details: any) => {
    console.log(`[AUTH:${action}]`, {
      ...details,
      timestamp: new Date().toISOString(),
      bypass: hasBypass
    });
  }

  // Periksa status autentikasi saat komponen dimuat dengan mekanisme retry
  useEffect(() => {
    // Hindari pemeriksaan berulang
    if (authCheckedRef.current) return;

    const checkAuth = async () => {
      try {
        logAuthStatus("CHECK_START", { retry: sessionRetryCountRef.current });
        const { data: { session } } = await supabase.auth.getSession()

        // Debug output
        logAuthStatus("CHECK_RESULT", {
          sessionExists: !!session,
          userId: session?.user?.id?.substring(0, 8) || "none",
          userEmail: session?.user?.email || "none",
        });

        // Tandai bahwa pemeriksaan autentikasi sudah dilakukan
        authCheckedRef.current = true;

        if (session) {
          setIsAuthenticated(true);
          sessionRetryCountRef.current = 0; // Reset counter jika berhasil
        } else {
          // Jika punya parameter bypass, tetap tampilkan halaman
          if (hasBypass) {
            logAuthStatus("BYPASS_ACTIVE", { message: "Menampilkan halaman meskipun tidak terautentikasi" });
            setIsAuthenticated(true); // Tetap set true agar UI berfungsi
            return;
          }

          // Retry beberapa kali jika gagal
          if (sessionRetryCountRef.current < maxRetries) {
            sessionRetryCountRef.current++;
            logAuthStatus("RETRY", {
              count: sessionRetryCountRef.current,
              maxRetries,
              willRetry: true
            });

            // Jeda sebelum mencoba lagi
            setTimeout(checkAuth, 1000);
            return;
          }

          logAuthStatus("AUTHENTICATION_FAILED", { message: "Redirecting to login" });
          setIsAuthenticated(false);

          toast({
            title: "Tidak terautentikasi",
            description: "Silakan login terlebih dahulu",
            variant: "destructive",
          });

          router.push(`/login?bypass=true&redirectTo=${encodeURIComponent("/admin/upload-infografis")}`);
        }
      } catch (error) {
        console.error("Error checking auth:", error);

        // Coba lagi jika belum mencapai batas retry
        if (sessionRetryCountRef.current < maxRetries) {
          sessionRetryCountRef.current++;
          logAuthStatus("ERROR_RETRY", {
            error: String(error).substring(0, 100),
            count: sessionRetryCountRef.current,
            willRetry: true
          });
          setTimeout(checkAuth, 1000);
          return;
        }

        logAuthStatus("ERROR_MAX_RETRIES", { message: "Failed after max retries" });
        setIsAuthenticated(false);
      }
    }

    checkAuth();
  }, [supabase, toast, router, hasBypass]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImageFile(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const preview = event.target?.result as string
      setImagePreview(preview)

      // Check image dimensions
      const imgElement = new window.Image()
      imgElement.onload = () => {
        setImageWidth(imgElement.width)
        setImageHeight(imgElement.height)

        // Check aspect ratio (9:16)
        const aspectRatio = imgElement.width / imgElement.height
        const targetRatio = 9 / 16 // 0.5625
        const tolerance = 0.03 // Allowing 3% tolerance

        setAspectRatioValid(Math.abs(aspectRatio - targetRatio) <= tolerance)
      }
      imgElement.src = preview
    }
    reader.readAsDataURL(file)
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      addTag()
    }
  }

  const addTag = () => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.find(tag => tag.text.toLowerCase() === trimmedTag.toLowerCase())) {
      setTags([...tags, { id: Date.now().toString(), text: trimmedTag }])
      setTagInput("")
    }
  }

  const removeTag = (id: string) => {
    setTags(tags.filter(tag => tag.id !== id))
  }

  const addSuggestedTag = (tag: string) => {
    if (!tags.find(t => t.text.toLowerCase() === tag.toLowerCase())) {
      setTags([...tags, { id: Date.now().toString(), text: tag }])
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.files = files
        const changeEvent = new Event("change", { bubbles: true })
        fileInputRef.current.dispatchEvent(changeEvent)
      }
    }
  }

  const uploadImage = async () => {
    if (!imageFile) return null

    // Re-cek autentikasi secara real-time sebelum upload
    let currentSession;
    try {
      logAuthStatus("PRE_UPLOAD_CHECK", { starting: true });
      const { data } = await supabase.auth.getSession();
      currentSession = data.session;

      logAuthStatus("PRE_UPLOAD_SESSION", {
        sessionExists: !!currentSession,
        expiresAt: currentSession?.expires_at ? new Date(currentSession.expires_at * 1000).toISOString() : null,
      });
    } catch (error) {
      logAuthStatus("PRE_UPLOAD_ERROR", { error: String(error).substring(0, 100) });
    }

    // Bypass autentikasi jika parameter hasBypass aktif
    if (!currentSession && hasBypass) {
      logAuthStatus("BYPASS_UPLOAD", { message: "Allowing upload without session due to bypass" });
      toast({
        title: "Mode bypass aktif",
        description: "Melanjutkan upload dalam mode bypass",
        variant: "default",
      });
    }
    // Hanya gunakan kondisi !currentSession, bukan isAuthenticated state
    else if (!currentSession) {
      logAuthStatus("UPLOAD_AUTH_FAILED", { message: "Session expired" });
      toast({
        title: "Sesi login berakhir",
        description: "Silakan login kembali untuk melanjutkan",
        variant: "destructive",
      });
      router.push("/login?bypass=true&redirectTo=/admin/upload-infografis");
      return null;
    }

    setIsUploading(true)
    try {
      logAuthStatus("UPLOAD_START", { fileSize: imageFile.size, fileName: imageFile.name });

      const formData = new FormData()
      formData.append("file", imageFile)

      // Buat URL dengan parameter bypass jika dalam mode bypass
      const uploadUrl = hasBypass
        ? "/api/infografis/upload?bypass=true"
        : "/api/infografis/upload";

      logAuthStatus("FETCH_REQUEST", { url: uploadUrl });

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        credentials: "include", // Pastikan cookies dikirim
      })

      logAuthStatus("UPLOAD_RESPONSE", {
        status: response.status,
        statusText: response.statusText
      });

      if (!response.ok) {
        const result = await response.json().catch(() => ({ error: "Unknown error" }))
        logAuthStatus("UPLOAD_FAILED", { error: result.error || "Unknown error" });

        if (response.status === 401) {
          toast({
            title: "Sesi berakhir",
            description: "Sesi login Anda telah berakhir. Silakan login kembali.",
            variant: "destructive",
          })
          router.push("/login?bypass=true&redirectTo=/admin/upload-infografis")
          return null
        }

        toast({
          title: "Error",
          description: result.error || "Gagal mengupload gambar",
          variant: "destructive",
        })
        return null
      }

      const result = await response.json()
      logAuthStatus("UPLOAD_SUCCESS", { url: result.url?.substring(0, 50) });

      return {
        url: result.url,
        width: imageWidth,
        height: imageHeight,
      }
    } catch (error) {
      logAuthStatus("UPLOAD_EXCEPTION", { error: String(error).substring(0, 100) });
      toast({
        title: "Error",
        description: "Terjadi masalah saat mengupload gambar",
        variant: "destructive",
      })
      return null
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate form
    if (!title || !category || !imageFile) {
      toast({
        title: "Form tidak lengkap",
        description: "Judul, kategori, dan gambar wajib diisi",
        variant: "destructive",
      })
      return
    }

    // Validate aspect ratio
    if (aspectRatioValid === false) {
      toast({
        title: "Rasio gambar tidak valid",
        description: "Gambar harus memiliki rasio 9:16 (Portrait)",
        variant: "destructive",
      })
      return
    }

    // Double check auth sebelum mulai proses saving
    try {
      logAuthStatus("PRE_SAVE_CHECK", { starting: true });
      const { data } = await supabase.auth.getSession();

      logAuthStatus("PRE_SAVE_RESULT", {
        sessionExists: !!data.session,
        expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toISOString() : null,
      });

      // Bypass jika parameter aktif
      if (!data.session && !hasBypass) {
        toast({
          title: "Sesi berakhir",
          description: "Sesi login Anda telah berakhir. Silakan login kembali.",
          variant: "destructive",
        })
        router.push("/login?bypass=true&redirectTo=/admin/upload-infografis")
        return
      }
    } catch (error) {
      logAuthStatus("PRE_SAVE_ERROR", { error: String(error).substring(0, 100) });
      // Lanjutkan jika punya bypass
      if (!hasBypass) {
        toast({
          title: "Error autentikasi",
          description: "Terjadi masalah saat memeriksa status login. Silakan coba lagi.",
          variant: "destructive",
        });
        return;
      }
    }

    setIsSaving(true)

    try {
      // First upload the image
      const imageData = await uploadImage()
      if (!imageData) {
        setIsSaving(false)
        return
      }

      // Then save the infografis data
      const infografisData = {
        title,
        category,
        description,
        tags: tags.map(tag => tag.text),
        data_source: dataSource,
        image_url: imageData.url,
        image_width: imageData.width,
        image_height: imageData.height,
        published,
      }

      logAuthStatus("SAVING_DATA", { title, category });

      // Tambahkan parameter bypass jika perlu
      const apiUrl = hasBypass
        ? "/api/infografis?bypass=true"
        : "/api/infografis";

      logAuthStatus("SAVE_REQUEST", { url: apiUrl });

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(infografisData),
        credentials: "include", // Pastikan cookies dikirim
      })

      const result = await response.json()

      if (!response.ok) {
        logAuthStatus("SAVE_FAILED", {
          status: response.status,
          error: result.error || "Unknown error"
        });

        toast({
          title: "Error",
          description: result.error || "Gagal menyimpan infografis",
          variant: "destructive",
        })
        return
      }

      logAuthStatus("SAVE_SUCCESS", { infografisId: result.id });

      toast({
        title: "Berhasil",
        description: "Infografis telah berhasil disimpan",
      })

      // Reset form
      setTitle("")
      setCategory("")
      setDescription("")
      setDataSource("")
      setTagInput("")
      setTags([])
      setImageFile(null)
      setImagePreview(null)
      setPublished(false)
      setAspectRatioValid(null)

      // Redirect to management page
      router.push("/admin/infografis")
    } catch (error) {
      logAuthStatus("SAVE_EXCEPTION", { error: String(error).substring(0, 100) });

      toast({
        title: "Error",
        description: "Terjadi masalah saat menyimpan infografis",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <AdminLayout
      title="Upload Infografis"
      description="Upload infografis baru untuk ditampilkan di website"
    >
      <div className="container py-6">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Form Fields */}
            <div className="md:col-span-2 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title">Judul Infografis</Label>
                <Input
                  id="title"
                  placeholder="Masukkan judul infografis"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Kategori</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  placeholder="Deskripsi singkat tentang infografis ini"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-32"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataSource">Sumber Data</Label>
                <Input
                  id="dataSource"
                  placeholder="Masukkan sumber data (contoh: BPS, 2022)"
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags / Kata Kunci</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    placeholder="Ketik tag dan tekan Enter"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleTagInputKeyDown}
                    onBlur={addTag}
                  />
                  <Button type="button" onClick={addTag} variant="outline">
                    Tambah
                  </Button>
                </div>

                {/* Display tags */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary" className="flex items-center gap-1">
                      {tag.text}
                      <button
                        type="button"
                        onClick={() => removeTag(tag.id)}
                        className="ml-1 rounded-full hover:bg-muted p-0.5"
                      >
                        <LucideIcons.X size={14} />
                      </button>
                    </Badge>
                  ))}
                </div>

                {/* Suggested tags */}
                {suggestedTags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground mb-1">Tag yang disarankan:</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestedTags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="cursor-pointer hover:bg-secondary"
                          onClick={() => addSuggestedTag(tag)}
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="published"
                  checked={published}
                  onCheckedChange={setPublished}
                />
                <Label htmlFor="published">Publikasikan sekarang</Label>
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label>Gambar Infografis</Label>
                <div
                  className="border-2 border-dashed rounded-lg p-4 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="space-y-4">
                      <div className="relative aspect-[9/16] w-full max-w-[400px] mx-auto border overflow-hidden rounded">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />

                        {aspectRatioValid !== null && (
                          <div className={`absolute top-2 right-2 p-1 rounded-full ${
                            aspectRatioValid ? 'bg-green-500' : 'bg-red-500'
                          }`}>
                            {aspectRatioValid ? (
                              <LucideIcons.Check className="h-5 w-5 text-white" />
                            ) : (
                              <LucideIcons.X className="h-5 w-5 text-white" />
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <p className="text-sm">{imageFile?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {imageWidth} × {imageHeight} px
                          {aspectRatioValid === false && (
                            <span className="text-red-500 block mt-1">
                              Rasio gambar harus 9:16
                            </span>
                          )}
                        </p>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setImageFile(null)
                            setImagePreview(null)
                            setAspectRatioValid(null)
                          }}
                        >
                          Ganti Gambar
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6">
                      <div className="mx-auto bg-muted rounded-full p-3 mb-3">
                        <LucideIcons.Upload className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">
                          Klik atau drag & drop untuk upload
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Format: JPEG, PNG, atau WebP (Maks. 5MB)
                        </p>
                        <div className="flex items-center justify-center">
                          <LucideIcons.Info className="h-4 w-4 text-blue-500 mr-1" />
                          <p className="text-xs text-blue-500">
                            Rasio 9:16 (Portrait)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Card>
                <CardContent className="p-4">
                  <h3 className="font-medium mb-2">Panduan Upload Infografis</h3>
                  <Separator className="my-2" />
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-1">
                      <LucideIcons.Check className="h-4 w-4 text-green-500" />
                      Gunakan gambar dengan rasio 9:16 (Portrait)
                    </li>
                    <li className="flex items-center gap-1">
                      <LucideIcons.Check className="h-4 w-4 text-green-500" />
                      Resolusi disarankan minimal 1080 × 1920 px
                    </li>
                    <li className="flex items-center gap-1">
                      <LucideIcons.Check className="h-4 w-4 text-green-500" />
                      Format file: JPG, PNG, atau WebP
                    </li>
                    <li className="flex items-center gap-1">
                      <LucideIcons.Check className="h-4 w-4 text-green-500" />
                      Ukuran maksimal file: 5MB
                    </li>
                    <li className="flex items-center gap-1">
                      <LucideIcons.Check className="h-4 w-4 text-green-500" />
                      Pastikan teks dalam gambar terbaca jelas
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/infografis")}
              disabled={isUploading || isSaving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isUploading || isSaving}>
              {isUploading || isSaving ? (
                <>
                  <LucideIcons.Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUploading ? "Mengupload..." : "Menyimpan..."}
                </>
              ) : (
                "Simpan Infografis"
              )}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  )
}

// Wrapper dengan Suspense boundary
export default function UploadInfografisPage() {
  return (
    <Suspense fallback={
      <AdminLayout
        title="Upload Infografis"
        description="Unggah infografis baru atau edit infografis yang sudah ada"
      >
        <div className="container py-6 flex justify-center items-center min-h-[50vh]">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-3"></div>
            <p className="text-sm text-muted-foreground">Memuat halaman upload infografis...</p>
          </div>
        </div>
      </AdminLayout>
    }>
      <UploadInfografisContent />
    </Suspense>
  )
}
