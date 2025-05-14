"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface AdminProtectedPageProps {
  children: React.ReactNode
  redirectPath?: string
}

export function AdminProtectedPage({ children, redirectPath = "/admin/dashboard" }: AdminProtectedPageProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  // Pengecekan otentikasi untuk mengarahkan pengguna yang belum login
  useEffect(() => {
    if (!isLoading && !user) {
      console.log("Unauthorized access to admin page, redirecting to login...")
      router.push(`/login?redirectTo=${redirectPath}`)
    }
  }, [user, isLoading, router, redirectPath])

  // Jika masih memuat status otentikasi, tampilkan loading
  if (isLoading) {
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
            Anda harus login terlebih dahulu untuk mengakses halaman admin.
          </AlertDescription>
        </Alert>
        <div className="mt-6 flex justify-center">
          <Button onClick={() => router.push(`/login?redirectTo=${redirectPath}`)}>
            Login ke Akun
          </Button>
        </div>
      </div>
    )
  }

  // Jika user terautentikasi, tampilkan konten halaman
  return <>{children}</>
}
