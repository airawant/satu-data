"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { ChevronRight, Download, Share2, Calendar, FileText, Database, Link as LinkIcon, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Header } from "@/components/header"

interface Infografis {
  id: string
  title: string
  category: string
  description: string
  tags: string[]
  data_source: string
  image_url: string
  image_width: number
  image_height: number
  created_at: string
  published_at: string | null
}

export default function InfografisDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()

  const [infografis, setInfografis] = useState<Infografis | null>(null)
  const [relatedInfografis, setRelatedInfografis] = useState<Infografis[]>([])
  const [loading, setLoading] = useState(true)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [shareUrl, setShareUrl] = useState("")

  useEffect(() => {
    fetchInfografis()
  }, [params.id])

  useEffect(() => {
    // Set share URL when component mounts
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.href)
    }
  }, [])

  const fetchInfografis = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/infografis/${params.id}`)

      if (!response.ok) {
        if (response.status === 404) {
          router.push('/infografis')
          return
        }
        throw new Error("Gagal memuat data infografis")
      }

      const { data } = await response.json()
      setInfografis(data)

      // Setelah berhasil mengambil infografis, ambil infografis terkait
      fetchRelatedInfografis(data.category, data.id)
    } catch (error) {
      console.error("Error fetching infografis:", error)
      toast({
        title: "Error",
        description: "Terjadi masalah saat memuat data infografis",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchRelatedInfografis = async (category: string, currentId: string) => {
    try {
      // Ambil infografis dengan kategori yang sama, kecuali infografis yang sedang dilihat
      const response = await fetch(`/api/infografis?category=${category}&publishedOnly=true`)

      if (!response.ok) {
        throw new Error("Gagal memuat infografis terkait")
      }

      const { data } = await response.json()

      // Filter out current infografis and limit to 3
      const filtered = data
        .filter((item: Infografis) => item.id !== currentId)
        .slice(0, 3)

      setRelatedInfografis(filtered)
    } catch (error) {
      console.error("Error fetching related infografis:", error)
    }
  }

  const handleDownload = async () => {
    if (!infografis) return

    try {
      // Create a temporary link element
      const link = document.createElement('a')
      link.href = infografis.image_url
      link.download = `${infografis.title.replace(/\s+/g, '-')}.jpg`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Berhasil",
        description: "Infografis berhasil diunduh",
      })
    } catch (error) {
      console.error("Error downloading infografis:", error)
      toast({
        title: "Error",
        description: "Gagal mengunduh infografis",
        variant: "destructive",
      })
    }
  }

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Tautan disalin",
      description: "Tautan telah disalin ke clipboard",
    })
    setShareDialogOpen(false)
  }

  const getFileSize = (url: string): string => {
    // Estimasi ukuran file berdasarkan dimensi
    if (infografis?.image_width && infografis?.image_height) {
      // Rough estimation: width * height * 3 bytes (RGB) / 1024^2 (to MB)
      const estimatedSizeMB = (infografis.image_width * infografis.image_height * 3) / (1024 * 1024)
      return `~${estimatedSizeMB.toFixed(1)} MB`
    }
    return "Tidak diketahui"
  }

  const getFileType = (url: string): string => {
    const extension = url.split('.').pop()?.split('?')[0].toUpperCase()
    return extension || "JPG"
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="flex items-center text-sm mb-6">
            <Link href="/" className="text-blue-500 hover:underline">
              Beranda
            </Link>
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
            <Link href="/infografis" className="text-blue-500 hover:underline">
              Infografis
            </Link>
            <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
            <Skeleton className="h-4 w-32" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <Skeleton className="h-8 w-3/4 mb-2" />
                <Skeleton className="h-4 w-40 mb-4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3 mt-2" />
              </div>

              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="relative w-full h-[500px] md:h-[600px] bg-gray-100">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-lg font-semibold mb-4">Informasi Infografis</h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Kategori</p>
                      <Skeleton className="h-5 w-40 mt-1" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sumber Data</p>
                      <Skeleton className="h-5 w-32 mt-1" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Tanggal Publikasi</p>
                      <Skeleton className="h-5 w-24 mt-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <h2 className="text-lg font-semibold mb-4">Infografis Terkait</h2>
                <div className="space-y-4">
                  {[1, 2, 3].map((item) => (
                    <Card key={item} className="overflow-hidden">
                      <div className="flex">
                        <Skeleton className="h-20 w-20" />
                        <CardContent className="p-3 flex-1">
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-3/4" />
                        </CardContent>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!infografis) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Infografis tidak ditemukan</h1>
            <p className="text-muted-foreground mb-6">Maaf, infografis yang Anda cari tidak ditemukan atau telah dihapus.</p>
            <Button onClick={() => router.push('/infografis')}>Kembali ke Infografis</Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm mb-6">
        <Link href="/" className="text-blue-500 hover:underline">
          Beranda
        </Link>
        <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
        <Link href="/infografis" className="text-blue-500 hover:underline">
          Infografis
        </Link>
        <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
          <span className="truncate max-w-[200px]">{infografis.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">{infografis.title}</h1>
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4 mr-1" />
                <span>
                  Dipublikasikan: {
                    infografis.published_at ?
                    format(new Date(infografis.published_at), "dd MMMM yyyy", { locale: id }) :
                    format(new Date(infografis.created_at), "dd MMMM yyyy", { locale: id })
                  }
                </span>
            </div>
              {infografis.description && <p className="text-muted-foreground">{infografis.description}</p>}
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
              <div className="relative w-full h-auto">
                <img
                  src={infografis.image_url}
                  alt={infografis.title}
                  className="w-full h-auto object-contain max-h-[800px]"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
              {infografis.tags.map((tag, index) => (
                <Link href={`/infografis?tag=${tag}`} key={index}>
                  <Badge variant="secondary" className="cursor-pointer">
                {tag}
              </Badge>
                </Link>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
              <Button className="flex items-center gap-2" onClick={handleDownload}>
              <Download className="h-4 w-4" />
              Unduh Infografis
            </Button>
              <Button variant="outline" className="flex items-center gap-2" onClick={() => setShareDialogOpen(true)}>
              <Share2 className="h-4 w-4" />
              Bagikan
            </Button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-lg font-semibold mb-4">Informasi Infografis</h2>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Kategori</p>
                    <Link href={`/infografis?category=${infografis.category}`}>
                      <p className="hover:text-primary cursor-pointer">{infografis.category}</p>
                    </Link>
                </div>

                  {infografis.data_source && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sumber Data</p>
                      <div className="flex items-center gap-1">
                        <Database className="h-4 w-4 text-muted-foreground" />
                        <p>{infografis.data_source}</p>
                      </div>
                </div>
                  )}

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tanggal Publikasi</p>
                    <p>
                      {infografis.published_at
                        ? format(new Date(infografis.published_at), "dd MMMM yyyy", { locale: id })
                        : format(new Date(infografis.created_at), "dd MMMM yyyy", { locale: id })}
                    </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Format File</p>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>
                        {getFileType(infografis.image_url)} ({getFileSize(infografis.image_url)})
                    </span>
                  </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Ukuran Gambar</p>
                    <p>{infografis.image_width} × {infografis.image_height} px</p>
                </div>
              </div>
            </CardContent>
          </Card>

            {relatedInfografis.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">Infografis Terkait</h2>
            <div className="space-y-4">
                  {relatedInfografis.map((item) => (
                <Link key={item.id} href={`/infografis/${item.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex">
                          <div className="relative h-20 w-20 flex-shrink-0 bg-gray-100">
                            <img
                              src={item.image_url}
                          alt={item.title}
                              className="h-full w-full object-cover"
                        />
                      </div>
                      <CardContent className="p-3">
                        <p className="text-sm font-medium line-clamp-2">{item.title}</p>
                      </CardContent>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <AlertDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bagikan Infografis</AlertDialogTitle>
            <AlertDialogDescription>
              Salin tautan infografis ini untuk dibagikan
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex items-center gap-2 mt-2 bg-muted p-2 rounded-md">
            <LinkIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <p className="text-sm truncate">{shareUrl}</p>
      </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleCopyShareLink}>Salin Tautan</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
