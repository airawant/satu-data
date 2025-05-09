"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error ke sistem analitik atau penanganan error
    console.error("Application error:", error)
  }, [error])

  const handleReset = () => {
    // Reset state error
    try {
      // Coba hapus cookie potensial yang menyebabkan masalah
      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim()
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })

      reset()
    } catch (err) {
      console.error("Failed to reset app state:", err)
      // Jika gagal, coba refresh halaman
      window.location.href = "/"
    }
  }

  const handleLogout = async () => {
    try {
      // Hapus semua data lokal dan refresh halaman
      localStorage.clear()
      sessionStorage.clear()

      // Cookie clear
      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim()
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })

      window.location.href = "/login?clear=true"
    } catch (err) {
      console.error("Failed to logout:", err)
      window.location.reload()
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Terjadi Kesalahan</CardTitle>
          <CardDescription className="text-center">
            Mohon maaf, terjadi kesalahan dalam aplikasi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 p-4 rounded-md mb-4 border border-red-200">
            <p className="text-sm text-red-800 font-medium">
              {error.message || "Kesalahan tidak diketahui"}
            </p>
            {error.digest && (
              <p className="text-xs text-red-600 mt-1">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button onClick={handleReset} className="w-full">
            Coba Lagi
          </Button>
          <Button variant="outline" onClick={handleLogout} className="w-full">
            Keluar dan Hapus Sesi
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
