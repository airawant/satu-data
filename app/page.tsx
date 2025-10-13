import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, BarChart3, Database, FileSpreadsheet, LineChart, Share2, TableProperties } from "lucide-react"
import { RecentActivities } from "@/components/dashboard/recent-activities"
import { Announcements } from "@/components/dashboard/announcements"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-16 lg:py-20 bg-gradient-to-b from-white to-gray-100 dark:from-background dark:to-background/80">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 xl:grid-cols-2">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    <span className="text-primary">Portal Satu Data Kemenag Kota Tanjungpinang</span>
                    <br />
                    Platform Analitik Data Modern
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    Temukan wawasan, buat visualisasi, dan bagikan data dengan platform analitik kami yang Valid dan Akurat.
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  alt="Dashboard Portal Satu Data"
                  className="aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                  src="/kantor.jpg?height=400&width=800"
                />
              </div>
            </div>
          </div>
        </section>

        <section id="dashboard-section" className="w-full py-12 md:py-16">
          <div className="container px-4 md:px-6">
            {/* Welcome, Activities, and Announcements */}
            <div className="grid gap-6 mb-8">
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
                        Tabel Dinamis
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/charts">
                      <Button className="w-full" variant="outline">
                        Pembuat Grafik
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/data-explorer">
                      <Button className="w-full" variant="outline">
                        Penjelajah Data
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="w-full py-12 md:py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Fitur Utama</h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Semua yang Anda butuhkan untuk menganalisis, memvisualisasikan, dan membagikan data
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/query-builder" className="block">
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm transition-all hover:border-primary hover:shadow-md">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <TableProperties className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Tabel Dinamis</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Buat tabel dinamis dengan tabel dinamis yang intuitif
                  </p>
                </div>
              </Link>
              <Link href="/charts" className="block">
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm transition-all hover:border-primary hover:shadow-md">
                  <div className="p-2 bg-secondary/10 rounded-full">
                    <BarChart3 className="h-6 w-6 text-secondary" />
                  </div>
                  <h3 className="text-xl font-bold">Pembuat Grafik</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Visualisasikan data Anda dengan grafik dan diagram yang menarik
                  </p>
                </div>
              </Link>
              <Link href="/data-explorer" className="block">
                <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm transition-all hover:border-primary hover:shadow-md">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Database className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold">Penjelajah Data</h3>
                  <p className="text-sm text-center text-muted-foreground">
                    Impor, kelola, dan organisasikan dataset Anda dengan mudah
                  </p>
                </div>
              </Link>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="p-2 bg-secondary/10 rounded-full">
                  <Share2 className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold">Bagikan & Ekspor</h3>
                <p className="text-sm text-center text-muted-foreground">
                  Bagikan wawasan Anda melalui WhatsApp, Telegram, atau ekspor ke PDF
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="p-2 bg-primary/10 rounded-full">
                  <LineChart className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Analitik Lanjutan</h3>
                <p className="text-sm text-center text-muted-foreground">
                  Lakukan analisis data lanjutan dengan alat yang canggih
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="p-2 bg-secondary/10 rounded-full">
                  <FileSpreadsheet className="h-6 w-6 text-secondary" />
                </div>
                <h3 className="text-xl font-bold">Integrasi Data</h3>
                <p className="text-sm text-center text-muted-foreground">
                  Hubungkan ke berbagai sumber data dan integrasikan data Anda
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Dashboard Section */}
        <section id="dashboard-section" className="w-full py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 md:grid-cols-2 mb-8">
              <RecentActivities />
              <Announcements />
            </div>
          </div>
        </section>


        {/* CTA Section */}
        <section className="w-full py-12 md:py-16">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Siap untuk memulai?</h2>
                <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Daftar hari ini dan mulai eksplorasi data Anda
                </p>
              </div>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/data-explorer">
                  <Button size="lg" className="bg-primary hover:bg-primary/90">
                    Jelajahi Data <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/query-builder">
                  <Button size="lg" variant="outline">
                    Coba Tabel Dinamis
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="w-full border-t bg-background py-6">
        <div className="container flex flex-col items-center justify-center gap-4 md:flex-row md:gap-8">
          <p className="text-center text-sm leading-loose text-muted-foreground">
            © 2025 Portal Satu Data Kemenag Kota Tanjungpinang. Hak cipta dilindungi.
          </p>
          <div className="flex gap-4">
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Ketentuan Layanan
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Kebijakan Privasi
            </Link>
            <Link href="#" className="text-sm text-muted-foreground hover:underline">
              Hubungi Kami
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
