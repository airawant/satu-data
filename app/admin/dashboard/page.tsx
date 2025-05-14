"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/contexts/auth-context"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

// Import komponen dashboard
import { QuickStats, RecentActivities, Announcements } from "@/components/dashboard/overview"
import { QuickAccess, AdminMenu } from "@/components/dashboard/quick-access"
import { UserGuides, FAQ } from "@/components/dashboard/user-guides"

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  // Pengecekan otentikasi tambahan untuk mengarahkan pengguna yang belum login
  useEffect(() => {
    // Hanya redirect jika tidak ada user dan loading auth sudah selesai
    if (!authLoading && !user) {
      console.log("Unauthorized access to dashboard, redirecting to login...")
      router.push("/login?bypass=true&redirectTo=/admin/dashboard")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Simulasi loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  // Jika masih memuat status otentikasi, tampilkan loading
  if (authLoading) {
    return (
      <div className="container py-10">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Jika tidak ada user, tampilkan pesan tidak diizinkan
  if (!user) {
    return (
      <div className="container py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Akses Ditolak</AlertTitle>
          <AlertDescription>
            Anda harus login terlebih dahulu untuk mengakses halaman dashboard.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => router.push("/login?bypass=true&redirectTo=/admin/dashboard")}>
            Login ke Akun
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container space-y-6 py-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array(4)
            .fill(null)
            .map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="mb-2 h-8 w-16" />
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2 h-1 w-full" />
                </CardContent>
              </Card>
            ))}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(3)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array(3)
                  .fill(null)
                  .map((_, i) => (
                    <div key={i} className="flex items-start space-x-4">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-9 w-full" />
            </CardFooter>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container space-y-6 py-6">
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Ringkasan</TabsTrigger>
          <TabsTrigger value="analytics">Analitik</TabsTrigger>
          <TabsTrigger value="reports">Laporan</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <QuickStats />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <QuickAccess />
              <UserGuides />
            </div>
            <div className="space-y-6">
              <Announcements />
              <RecentActivities />
              {user && <AdminMenu />}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Analitik Data</CardTitle>
              <CardDescription>
                Statistik penggunaan portal dan dataset populer
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Konten analitik akan segera hadir</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Laporan</CardTitle>
              <CardDescription>
                Laporan dan dokumen yang dapat diunduh
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">Konten laporan akan segera hadir</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
