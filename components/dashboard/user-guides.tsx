"use client"

import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, ExternalLink, FileText, HelpCircle, VideoIcon } from "lucide-react"

// Tipe data untuk panduan pengguna
interface GuideItem {
  id: number
  title: string
  description: string
  type: "article" | "video" | "doc"
  link: string
}

const guides: GuideItem[] = [
  {
    id: 1,
    title: "Panduan Menggunakan Query Builder",
    description: "Belajar cara membuat tabel dinamis dari dataset",
    type: "article",
    link: "/guides/query-builder",
  },
  {
    id: 2,
    title: "Membuat Visualisasi Data",
    description: "Cara membuat grafik yang informatif",
    type: "video",
    link: "/guides/data-visualization",
  },
  {
    id: 3,
    title: "Mengekspor dan Berbagi Data",
    description: "Cara mengunduh dan membagikan hasil analisis",
    type: "doc",
    link: "/guides/export-share",
  },
]

// Tipe data untuk FAQ
interface FAQItem {
  id: number
  question: string
  answer: string
}

const faqs: FAQItem[] = [
  {
    id: 1,
    question: "Bagaimana cara membuat akun di Portal Satu Data?",
    answer: "Klik tombol 'Daftar' di pojok kanan atas, isi formulir pendaftaran dengan informasi yang diperlukan, kemudian ikuti instruksi verifikasi email yang dikirimkan ke alamat email Anda.",
  },
  {
    id: 2,
    question: "Apakah saya bisa mengunduh data dari portal?",
    answer: "Ya, Anda bisa mengunduh data dalam format CSV, Excel, atau JSON dari halaman Query Builder atau Chart Generator setelah Anda membuat tabel atau visualisasi.",
  },
  {
    id: 3,
    question: "Bagaimana cara menghubungi admin jika ada masalah?",
    answer: "Anda bisa mengirim email ke support@portaldata.go.id atau menggunakan formulir kontak yang tersedia di halaman Bantuan.",
  },
]

// Komponen ikon untuk tipe panduan
function GuideTypeIcon({ type }: { type: string }) {
  if (type === "video") {
    return <VideoIcon className="h-4 w-4 text-primary" />
  } else if (type === "doc") {
    return <FileText className="h-4 w-4 text-primary" />
  } else {
    return <BookOpen className="h-4 w-4 text-primary" />
  }
}

export function UserGuides() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BookOpen className="mr-2 h-5 w-5 text-primary" />
          Panduan Pengguna
        </CardTitle>
        <CardDescription>Bantuan untuk menggunakan platform</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {guides.map((guide) => (
            <div key={guide.id} className="flex items-start space-x-4 border-b pb-4 last:border-0 last:pb-0">
              <div className="rounded-full bg-primary/10 p-2">
                <GuideTypeIcon type={guide.type} />
              </div>
              <div className="space-y-1">
                <h4 className="font-medium">{guide.title}</h4>
                <p className="text-sm text-muted-foreground">{guide.description}</p>
                <Link href={guide.link}>
                  <Button variant="link" size="sm" className="px-0">
                    Baca Selengkapnya
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          Lihat Semua Panduan
        </Button>
      </CardFooter>
    </Card>
  )
}

export function FAQ() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <HelpCircle className="mr-2 h-5 w-5 text-primary" />
          Pertanyaan Umum
        </CardTitle>
        <CardDescription>Jawaban untuk pertanyaan yang sering diajukan</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.id} className="space-y-2">
              <h4 className="font-medium">{faq.question}</h4>
              <p className="text-sm text-muted-foreground">{faq.answer}</p>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full">
          Lihat Semua FAQ
        </Button>
      </CardFooter>
    </Card>
  )
}
