"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [isStuck, setIsStuck] = useState(false)
  const { signIn, user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTimerRef = useRef<NodeJS.Timeout | null>(null)
  const stuckTimerRef = useRef<NodeJS.Timeout | null>(null)
  const redirectAttemptRef = useRef(0)
  const mountedRef = useRef(true)

  // Status debugging
  console.log('Login page state:', {
    user: !!user,
    userId: user?.id?.substring(0, 5),
    isLoading,
    isSubmitting,
    isRedirecting,
    isStuck,
    redirectAttempt: redirectAttemptRef.current,
    bypass: searchParams.get('bypass'),
    reset: searchParams.get('reset'),
    redirectTo: searchParams.get('redirectTo')
  })

  // Get the redirectTo parameter if it exists
  const redirectTo = searchParams.get('redirectTo')
    ? decodeURIComponent(searchParams.get('redirectTo') || '')
    : '/dashboard';

  // Pastikan selalu ada parameter bypass
  useEffect(() => {
    // Jika tidak ada parameter bypass, tambahkan
    if (!searchParams.has('bypass') && !isRedirecting && mountedRef.current) {
      console.log('Adding bypass parameter to URL');
      window.location.replace('/login?bypass=true');
    }
  }, [searchParams, isRedirecting]);

  // Reset jika ada parameter reset
  useEffect(() => {
    const reset = searchParams.get('reset')

    if (reset) {
      console.log('Reset parameter detected, cleaning up local storage')

      // Hapus semua storage dan cookie untuk reset
      try {
        localStorage.clear()
        sessionStorage.clear()

        document.cookie.split(";").forEach((cookie) => {
          const name = cookie.split("=")[0].trim()
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
        })
      } catch (error) {
        console.error('Error clearing storage:', error)
      }
    }
  }, [searchParams])

  // Timer untuk mendeteksi halaman yang stuck
  useEffect(() => {
    // Tambahkan timer untuk mendeteksi halaman yang stuck loading
    stuckTimerRef.current = setTimeout(() => {
      if ((isLoading || isRedirecting) && mountedRef.current) {
        console.log('Page stuck in loading state, showing manual action buttons')
        setIsStuck(true)
      }
    }, 7000) // Jika loading lebih dari 7 detik, anggap stuck

    return () => {
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current)
      }
    }
  }, [isLoading, isRedirecting])

  // Set mounted flag on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      // Bersihkan timer pada unmount
      if (redirectTimerRef.current) {
        clearTimeout(redirectTimerRef.current)
      }
      if (stuckTimerRef.current) {
        clearTimeout(stuckTimerRef.current)
      }
    }
  }, [])

  // Emergency redirect jika page ini terus diakses dengan user
  useEffect(() => {
    // Jika ada user langsung redirect agresif (paksa)
    if (user && user.id && !isRedirecting) {
      const destination = redirectTo ? `${redirectTo}?bypass=true` : "/dashboard?bypass=true";
      console.log('Emergency direct redirect to', destination);

      // Gunakan timeout kecil untuk menghindari race condition
      setTimeout(() => {
        if (mountedRef.current) {
          window.location.replace(destination);
        }
      }, 100);
    }
  }, [user, redirectTo]);

  // Pendekatan kedua: redirect normal jika user terdeteksi
  useEffect(() => {
    if (user && !isRedirecting && mountedRef.current) {
      console.log('Login page: user is logged in, setting redirect state');
      setIsRedirecting(true);
      redirectAttemptRef.current += 1;

      if (user.id) {
        // Tambahkan timeout untuk memberi waktu pada browser
        redirectTimerRef.current = setTimeout(() => {
          if (mountedRef.current) {
            const destination = redirectTo ? `${redirectTo}?bypass=true` : "/dashboard?bypass=true";
            console.log('Executing redirect to', destination);
            window.location.href = destination;
          }
        }, 100);
      }
    }
  }, [user, isRedirecting, redirectTo]);

  // Tambahkan timer untuk mengatasi "stuck loading" lebih dari 3 detik
  useEffect(() => {
    if (isRedirecting && mountedRef.current) {
      // Jika masih dalam status redirecting setelah 3 detik, paksa redirect
      const forceRedirectTimer = setTimeout(() => {
        if (mountedRef.current) {
          console.log('Force redirecting after timeout');
          redirectAttemptRef.current += 1;
          const destination = redirectTo ? `${redirectTo}?bypass=true` : "/dashboard?bypass=true";
          window.location.replace(destination);
        }
      }, 3000); // 3 detik timeout

      return () => clearTimeout(forceRedirectTimer);
    }
  }, [isRedirecting, redirectTo]);

  // Jika terlalu banyak upaya redirect yang gagal, coba clear cookie
  useEffect(() => {
    if (redirectAttemptRef.current >= 3 && !isLoading) {
      console.log('Too many redirect attempts, trying to reset state');
      // Tambahkan dummy query parameter untuk memaksa refresh halaman
      window.location.href = '/login?reset=' + Date.now();
    }
  }, [isRedirecting, isLoading]);

  // Fungsi untuk paksa reset session
  const handleForceReset = async () => {
    console.log("Force resetting session state...")

    try {
      // Sign out dari Supabase
      await supabase.auth.signOut()

      // Clear storage dan cookies
      localStorage.clear()
      sessionStorage.clear()

      document.cookie.split(";").forEach((cookie) => {
        const name = cookie.split("=")[0].trim()
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`
      })

      // Reload dengan parameter bypass untuk skip middleware
      window.location.href = "/login?reset=" + Date.now() + "&bypass=true"
    } catch (error) {
      console.error("Error during force reset:", error)
      // Jika gagal, coba reload page langsung
      window.location.reload()
    }
  }

  // Fungsi untuk paksa ke halaman admin
  const handleForceAdmin = () => {
    console.log("Force navigating to admin page...");
    const destination = redirectTo ? `${redirectTo}?bypass=true` : "/dashboard?bypass=true";
    window.location.href = destination;
  }

  // Jika masih loading atau sedang redirect, tampilkan animasi loading
  if (isLoading || isRedirecting) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">
            {isRedirecting ? 'Mengalihkan ke halaman admin...' : 'Memuat...'}
          </p>
          {redirectAttemptRef.current > 1 && (
            <p className="text-xs text-muted-foreground mt-2">
              Mencoba mengalihkan... ({redirectAttemptRef.current})
            </p>
          )}

          {/* Tambahkan tombol tindakan jika terdeteksi stuck */}
          {isStuck && (
            <div className="mt-8 space-y-2">
              <p className="text-sm text-amber-600 text-center">
                Sepertinya terjadi masalah dengan loading.
              </p>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleForceReset}
                  className="flex items-center"
                >
                  <RefreshCw className="h-4 w-4 mr-1" /> Reset Session
                </Button>
                <Button
                  size="sm"
                  onClick={handleForceAdmin}
                >
                  Ke Admin
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    if (!email || !password) {
      setError("Email dan password wajib diisi")
      setIsSubmitting(false)
      return
    }

    console.log('Attempting login with email:', email)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        console.log('Login error:', error.message)
        let message = "Terjadi kesalahan saat login"
        if (error.message === "Invalid login credentials") {
          message = "Email atau password tidak valid"
        } else if (error.message) {
          message = error.message
        }
        setError(message)
      } else {
        console.log('Login successful, setting redirect state')
        // Jika berhasil login, langsung tandai sedang melakukan redirecting
        setIsRedirecting(true)
        redirectAttemptRef.current += 1

        // Langsung redirect tanpa menunggu state update - pastikan ada bypass=true
        setTimeout(() => {
          if (mountedRef.current) {
            const destination = redirectTo ? `${redirectTo}?bypass=true` : "/dashboard?bypass=true";
            window.location.replace(destination);
          }
        }, 100);
      }
    } catch (error: any) {
      console.error('Login exception:', error)
      setError(error?.message || "Terjadi kesalahan saat login")
    } finally {
      if (mountedRef.current) {
        setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="flex justify-center items-center min-h-screen p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Login Admin</CardTitle>
          <CardDescription className="text-center">
            Masuk ke Panel Admin Portal Satu Data
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@kemenag.go.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Loading..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-border">
            <div className="flex flex-col gap-2 text-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleForceReset}
                className="text-xs text-muted-foreground"
              >
                Reset Session
              </Button>

              {/* Tambahkan tombol langsung ke admin jika pengguna sudah login tetapi terjebak */}
              <div className="text-xs text-muted-foreground">
                <span className="block mb-1">Jika Anda sudah login tetapi mengalami masalah loading:</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleForceAdmin}
                  className="text-xs"
                >
                  Langsung ke Admin
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col">
          <p className="text-center text-sm text-muted-foreground mt-2">
            Kembali ke <Link href="/" className="underline text-primary">Beranda</Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
