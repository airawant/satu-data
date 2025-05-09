import Link from "next/link"
import Image from "next/image"
import { ChevronRight, Download, Share2, Calendar, FileText } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Dummy data untuk detail infografis
const infografisDetail = {
  id: 1,
  title: "Indeks Pembangunan Manusia (IPM) 2024",
  description:
    "Infografis ini menampilkan data Indeks Pembangunan Manusia (IPM) Indonesia tahun 2024 yang mencakup berbagai indikator seperti pendidikan, kesehatan, dan ekonomi.",
  category: "Statistik Demografi dan Sosial",
  imageUrl: "/placeholder.svg?height=800&width=600",
  publishDate: "15 April 2024",
  source: "Badan Pusat Statistik",
  fileSize: "2.4 MB",
  fileType: "JPG",
  tags: ["IPM", "Pembangunan Manusia", "Pendidikan", "Kesehatan", "Ekonomi"],
  relatedInfografis: [
    {
      id: 2,
      title: "Keadaan Ketenagakerjaan Indonesia Agustus 2024",
      imageUrl: "/placeholder.svg?height=300&width=220",
    },
    {
      id: 3,
      title: "Rata-Rata Upah Buruh per Bulan Agustus 2024",
      imageUrl: "/placeholder.svg?height=300&width=220",
    },
    {
      id: 4,
      title: "Profil Kemiskinan di Indonesia Maret 2024",
      imageUrl: "/placeholder.svg?height=300&width=220",
    },
  ],
}

export default async function InfografisDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;

  return (
    <div className="container mx-auto py-8">
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
        <span className="truncate max-w-[200px]">{infografisDetail.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Konten Utama */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{infografisDetail.title}</h1>
            <div className="flex items-center text-sm text-muted-foreground mb-4">
              <Calendar className="h-4 w-4 mr-1" />
              <span>Dipublikasikan: {infografisDetail.publishDate}</span>
            </div>
            <p className="text-muted-foreground">{infografisDetail.description}</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="relative w-full h-[500px] md:h-[600px]">
              <Image
                src={infografisDetail.imageUrl || "/placeholder.svg"}
                alt={infografisDetail.title}
                fill
                className="object-contain"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {infografisDetail.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Unduh Infografis
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
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
                  <p>{infografisDetail.category}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sumber Data</p>
                  <p>{infografisDetail.source}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tanggal Publikasi</p>
                  <p>{infografisDetail.publishDate}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">Format File</p>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span>
                      {infografisDetail.fileType} ({infografisDetail.fileSize})
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div>
            <h2 className="text-lg font-semibold mb-4">Infografis Terkait</h2>
            <div className="space-y-4">
              {infografisDetail.relatedInfografis.map((item) => (
                <Link key={item.id} href={`/infografis/${item.id}`}>
                  <Card className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex">
                      <div className="relative h-20 w-20 flex-shrink-0">
                        <Image
                          src={item.imageUrl || "/placeholder.svg"}
                          alt={item.title}
                          fill
                          className="object-cover"
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
        </div>
      </div>
    </div>
  )
}
