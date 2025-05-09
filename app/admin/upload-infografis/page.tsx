"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Upload, FileText, ImageIcon, CheckCircle, AlertCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function UploadInfografisPage() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setSelectedFile(file)

    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedFile) {
      setUploadError("Silakan pilih file infografis terlebih dahulu")
      return
    }

    setIsUploading(true)
    setUploadError(null)

    // Simulasi upload
    try {
      // Simulasi delay network
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simulasi sukses
      setUploadSuccess(true)
      setIsUploading(false)

      // Reset form setelah beberapa detik
      setTimeout(() => {
        setUploadSuccess(false)
        setSelectedFile(null)
        setPreviewUrl(null)

        // Redirect ke halaman infografis
        // router.push("/infografis")
      }, 3000)
    } catch (error) {
      setUploadError("Terjadi kesalahan saat mengunggah infografis")
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Unggah Infografis</h1>

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="upload">Unggah Infografis</TabsTrigger>
          <TabsTrigger value="manage">Kelola Infografis</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Detail Infografis</CardTitle>
                  <CardDescription>Masukkan informasi tentang infografis yang akan diunggah</CardDescription>
                </CardHeader>
                <CardContent>
                  <form id="uploadForm" onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="title">Judul Infografis</Label>
                      <Input id="title" placeholder="Masukkan judul infografis" required />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Kategori</Label>
                      <Select required>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="demografi">Statistik Demografi dan Sosial</SelectItem>
                          <SelectItem value="ekonomi">Statistik Ekonomi</SelectItem>
                          <SelectItem value="lingkungan">Statistik Lingkungan Hidup dan Multidomain</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        id="description"
                        placeholder="Masukkan deskripsi singkat tentang infografis ini"
                        rows={4}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tags">Tag (pisahkan dengan koma)</Label>
                      <Input id="tags" placeholder="ekonomi, penduduk, kemiskinan" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="source">Sumber Data</Label>
                      <Input id="source" placeholder="Contoh: Survei Sosial Ekonomi Nasional 2024" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="file">File Infografis</Label>
                      <div className="border-2 border-dashed rounded-lg p-6 text-center hover:bg-muted/50 transition-colors">
                        <Input
                          id="file"
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,application/pdf"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Label htmlFor="file" className="cursor-pointer flex flex-col items-center gap-2">
                          <Upload className="h-10 w-10 text-muted-foreground" />
                          <span className="font-medium">Klik untuk memilih file</span>
                          <span className="text-sm text-muted-foreground">PNG, JPG, atau PDF (Maks. 10MB)</span>
                          {selectedFile && (
                            <div className="flex items-center gap-2 mt-2 text-sm font-medium text-green-600">
                              <FileText className="h-4 w-4" />
                              {selectedFile.name}
                            </div>
                          )}
                        </Label>
                      </div>
                    </div>
                  </form>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button variant="outline" onClick={() => router.push("/infografis")}>
                    Batal
                  </Button>
                  <Button type="submit" form="uploadForm" disabled={isUploading || !selectedFile}>
                    {isUploading ? "Mengunggah..." : "Unggah Infografis"}
                  </Button>
                </CardFooter>
              </Card>

              {uploadSuccess && (
                <Alert className="mt-4 bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Berhasil!</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Infografis berhasil diunggah dan akan segera ditampilkan.
                  </AlertDescription>
                </Alert>
              )}

              {uploadError && (
                <Alert className="mt-4 bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertTitle className="text-red-800">Gagal!</AlertTitle>
                  <AlertDescription className="text-red-700">{uploadError}</AlertDescription>
                </Alert>
              )}
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Pratinjau</CardTitle>
                  <CardDescription>Pratinjau infografis yang akan diunggah</CardDescription>
                </CardHeader>
                <CardContent>
                  {previewUrl ? (
                    <div className="rounded-lg overflow-hidden border">
                      <img src={previewUrl || "/placeholder.svg"} alt="Preview" className="w-full h-auto" />
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 bg-muted/30 rounded-lg border border-dashed">
                      <ImageIcon className="h-16 w-16 text-muted-foreground/50" />
                      <p className="mt-4 text-sm text-muted-foreground text-center">
                        Pratinjau akan muncul di sini setelah Anda memilih file
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="manage">
          <Card>
            <CardHeader>
              <CardTitle>Kelola Infografis</CardTitle>
              <CardDescription>Lihat dan kelola infografis yang telah diunggah</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fitur ini akan segera tersedia. Anda akan dapat mengedit, menghapus, dan mengatur infografis yang telah
                diunggah.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
