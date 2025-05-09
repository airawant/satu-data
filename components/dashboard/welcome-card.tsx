"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

export function WelcomeCard() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="bg-gradient-to-r from-primary/10 to-secondary/10">
        <CardHeader>
          <CardTitle>Selamat Datang di Portal Satu Data</CardTitle>
          <CardDescription>Platform modern untuk analisis dan visualisasi data</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Gunakan fitur-fitur berikut untuk mengeksplorasi data:</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/query-builder">
              <Button className="w-full">
                Query Builder
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/charts">
              <Button className="w-full" variant="outline">
                Chart Generator
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/data-explorer">
              <Button className="w-full" variant="outline">
                Data Explorer
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Aktivitas terbaru di Portal Satu Data</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Belum ada aktivitas terbaru. Mulai eksplorasi data untuk melihat aktivitas Anda di sini.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pengumuman</CardTitle>
            <CardDescription>Pengumuman dan berita terbaru</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium">Pembaruan Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Portal Satu Data telah diperbarui dengan fitur-fitur baru. Jelajahi Query Builder dan Chart Generator
                  yang telah ditingkatkan.
                </p>
              </div>
              <div>
                <h3 className="font-medium">Dataset Baru</h3>
                <p className="text-sm text-muted-foreground">
                  Dataset terbaru telah ditambahkan ke kategori Ekonomi dan Kesehatan.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
