"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"

export default function LogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cleanupSession = async () => {
    try {
      // Clear local storage
      localStorage.clear()
      sessionStorage.clear()

      // Clear all cookies
      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim()
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })

      // Explicit signout from Supabase
      await supabase.auth.signOut()

      // Add a delay to ensure everything is cleaned up
      return new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error("Error cleaning up session:", error)
      throw error
    }
  }

  // Fungsi untuk logout
  const handleLogout = async () => {
    setIsLoggingOut(true)
    setError(null)

    try {
      await cleanupSession()

      // Redirect ke halaman login dengan parameter bypass dan reset
      window.location.replace("/login?bypass=true&reset=" + Date.now())
    } catch (error) {
      console.error("Error during logout:", error)
      setError("Terjadi kesalahan saat keluar. Coba muat ulang halaman.")
      setIsLoggingOut(false)
    }
  }

  // Fungsi untuk kembali ke halaman sebelumnya
  const handleBack = () => {
    // Kembali ke dashboard alih-alih halaman sebelumnya
    window.location.replace('/dashboard')
  }

  // Auto-logout ketika halaman dibuka
  useEffect(() => {
    const autoLogout = async () => {
      try {
        await handleLogout()
      } catch (error) {
        console.error("Auto-logout error:", error)
        setError("Terjadi kesalahan saat keluar. Silakan coba lagi.")
        setIsLoggingOut(false)
      }
    }

    autoLogout()
  }, [])

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Keluar dari Sistem</CardTitle>
        </CardHeader>

        <CardContent className="flex flex-col items-center space-y-4">
          {isLoggingOut ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Mengeluarkan Anda dari sistem...</p>
            </div>
          ) : (
            <p>Apakah Anda yakin ingin keluar?</p>
          )}

          {error && (
            <div className="bg-red-50 p-4 rounded-md w-full text-sm text-red-800">
              {error}
            </div>
          )}
        </CardContent>

        {!isLoggingOut && (
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={isLoggingOut}
            >
              Kembali
            </Button>
            <Button
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              Keluar
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}
