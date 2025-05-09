import Link from "next/link"
import Image from "next/image"
import { ChevronRight, ChevronLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Dummy data untuk infografis
const infografisData = [
  {
    id: 1,
    title: "Rata-Rata Upah Buruh per Bulan Agustus 2024",
    category: "Statistik Demografi dan Sosial",
    imageUrl: "/placeholder.svg?height=300&width=220",
  },
  {
    id: 2,
    title: "Keadaan Ketenagakerjaan Indonesia Agustus 2024",
    category: "Statistik Demografi dan Sosial",
    imageUrl: "/placeholder.svg?height=300&width=220",
  },
  {
    id: 3,
    title: "Indeks Pembangunan Manusia (IPM) 2024",
    category: "Statistik Demografi dan Sosial",
    imageUrl: "/placeholder.svg?height=300&width=220",
  },
  {
    id: 4,
    title: "Keadaan Ketenagakerjaan Indonesia Agustus 2024",
    category: "Statistik Demografi dan Sosial",
    imageUrl: "/placeholder.svg?height=300&width=220",
  },
  {
    id: 5,
    title: "Rata-Rata Upah Buruh per Bulan Agustus 2024",
    category: "Statistik Demografi dan Sosial",
    imageUrl: "/placeholder.svg?height=300&width=220",
  },
  {
    id: 6,
    title: "Profil Kemiskinan di Indonesia Maret 2024",
    category: "Statistik Ekonomi",
    imageUrl: "/placeholder.svg?height=300&width=220",
  },
  {
    id: 7,
    title: "Tingkat Ketimpangan Pengeluaran Penduduk Indonesia 2024",
    category: "Statistik Ekonomi",
    imageUrl: "/placeholder.svg?height=300&width=220",
  },
  {
    id: 8,
    title: "Rata-Rata Upah Buruh per Bulan Februari 2024",
    category: "Statistik Ekonomi",
    imageUrl: "/placeholder.svg?height=300&width=220",
  },
  {
    id: 9,
    title: "Keadaan Ketenagakerjaan Indonesia Februari 2024",
    category: "Statistik Ekonomi",
    imageUrl: "/placeholder.svg?height=300&width=220",
  },
  {
    id: 10,
    title: "Indeks Ketimpangan Gender (IKG) 2023",
    category: "Statistik Lingkungan Hidup dan Multidomain",
    imageUrl: "/placeholder.svg?height=300&width=220",
  },
]

// Kategori infografis
const categories = ["Statistik Demografi dan Sosial", "Statistik Ekonomi", "Statistik Lingkungan Hidup dan Multidomain"]

export default function InfografisPage() {
  return (
    <div className="container mx-auto py-8">
      {/* Breadcrumb */}
      <div className="flex items-center text-sm mb-6">
        <Link href="/" className="text-blue-500 hover:underline">
          Beranda
        </Link>
        <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
        <span>Produk - Infografis</span>
      </div>

      {/* Judul dan Deskripsi */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Infografis</h1>
        <p className="text-muted-foreground">
          Bentuk visualisasi data statistik yang disajikan dengan menggunakan ilustrasi, grafik, dan teks.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Kategori */}
        <div className="w-full md:w-1/4">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-xl font-bold mb-4">Subjek</h2>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <Link
                  key={index}
                  href={`/infografis?category=${encodeURIComponent(category)}`}
                  className={`block p-3 rounded-md hover:bg-blue-50 ${
                    index === 0 ? "bg-blue-500 text-white hover:bg-blue-600" : ""
                  }`}
                >
                  {category}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Konten Utama */}
        <div className="w-full md:w-3/4">
          <div className="mb-4 text-sm text-muted-foreground">Menampilkan 1-10 dari 98 Infografis</div>

          {/* Grid Infografis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {infografisData.map((infografis) => (
              <Card key={infografis.id} className="overflow-hidden border hover:shadow-md transition-shadow">
                <Link href={`/infografis/${infografis.id}`}>
                  <div className="relative h-[220px] w-full">
                    <Image
                      src={infografis.imageUrl || "/placeholder.svg"}
                      alt={infografis.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="font-medium text-sm line-clamp-2">{infografis.title}</h3>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-center mt-8">
            <div className="flex items-center border rounded-md overflow-hidden">
              <Button variant="ghost" size="icon" className="rounded-none border-r h-10 w-10">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-none border-r bg-blue-500 text-white hover:bg-blue-600 h-10 w-10"
              >
                1
              </Button>
              <Button variant="ghost" size="sm" className="rounded-none border-r h-10 w-10">
                2
              </Button>
              <Button variant="ghost" size="sm" className="rounded-none border-r h-10 w-10">
                3
              </Button>
              <Button variant="ghost" size="sm" className="rounded-none border-r h-10 w-10">
                4
              </Button>
              <Button variant="ghost" size="sm" className="rounded-none border-r h-10 w-10">
                5
              </Button>
              <Button variant="ghost" size="sm" className="rounded-none border-r h-10 w-10">
                ...
              </Button>
              <Button variant="ghost" size="sm" className="rounded-none border-r h-10 w-10">
                10
              </Button>
              <Button variant="ghost" size="icon" className="rounded-none h-10 w-10">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
