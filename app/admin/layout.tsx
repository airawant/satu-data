"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const mountedRef = useRef(true)
  const redirectAttemptRef = useRef(0)
  const pathname = usePathname()
  const searchParams = useSearchParams()

  console.log('Admin layout state:', {
    user: !!user,
    userId: user?.id?.substring(0, 5),
    isLoading,
    isRedirecting,
    redirectAttempt: redirectAttemptRef.current,
    mounted: mountedRef.current,
    pathname,
    hasBypass: searchParams.has('bypass')
  })

  // Helper untuk menambahkan bypass parameter pada URL
  const addBypass = (url: string) => {
    return url.includes('?') ? `${url}&bypass=true` : `${url}?bypass=true`
  }

  // Cleanup pada unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Tambahkan bypass parameter ke URL saat ini jika belum ada
  useEffect(() => {
    if (!searchParams.has('bypass') && pathname?.startsWith('/admin') && mountedRef.current) {
      console.log('Adding bypass parameter to current URL');
      const currentPath = pathname + (pathname.includes('?') ? '&' : '?') + 'bypass=true';
      window.history.replaceState(null, '', currentPath);
    }
  }, [pathname, searchParams]);

  // Override navigasi untuk menambahkan bypass parameter
  useEffect(() => {
    // Jangan lakukan override jika ada bypass parameter
    if (searchParams.has('bypass')) {
      console.log('Bypass parameter detected, not overriding navigation');
      return;
    }

    // Override linkuri dari Next.js untuk selalu menambahkan bypass parameter
    const originalPushState = window.history.pushState;
    window.history.pushState = function(state, title, url) {
      if (url && typeof url === 'string' && url.startsWith('/admin') && !url.includes('bypass=true')) {
        // Tambahkan bypass parameter
        url = url.includes('?') ? `${url}&bypass=true` : `${url}?bypass=true`;
        console.log(`Modified navigation: ${url}`);
      }
      return originalPushState.call(this, state, title, url);
    };

    return () => {
      window.history.pushState = originalPushState;
    };
  }, [searchParams]);

  // Redirect ke login jika user tidak login
  useEffect(() => {
    if (!isLoading && !user && !isRedirecting && mountedRef.current) {
      console.log('Admin layout redirecting to login - direct navigation')
      setIsRedirecting(true)
      redirectAttemptRef.current += 1

      // Gunakan window.location.replace untuk navigasi yang lebih reliable
      setTimeout(() => {
        if (mountedRef.current) {
          window.location.replace("/login?bypass=true")
        }
      }, 100)
    }
  }, [user, isLoading, isRedirecting])

  // Force redirect jika masih isRedirecting setelah beberapa detik
  useEffect(() => {
    if (isRedirecting && mountedRef.current) {
      const forceRedirectTimer = setTimeout(() => {
        if (mountedRef.current && isRedirecting) {
          console.log('Force redirecting to login after timeout')
          redirectAttemptRef.current += 1
          window.location.replace("/login?bypass=true")
        }
      }, 3000)

      return () => clearTimeout(forceRedirectTimer)
    }
  }, [isRedirecting])

  // Tampilkan loading spinner saat sedang fetching session atau saat redirecting
  if (isLoading || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-3"></div>
          {isRedirecting && <p className="text-sm text-muted-foreground">Mengarahkan ke halaman login...</p>}
          {redirectAttemptRef.current > 1 && (
            <p className="text-xs text-muted-foreground mt-2">
              Mencoba mengalihkan... ({redirectAttemptRef.current})
            </p>
          )}
        </div>
      </div>
    )
  }

  // User sudah terautentikasi, tampilkan konten admin
  if (user) {
    return (
      <div className="admin-layout min-h-screen flex flex-col">
        {/* Konten halaman admin langsung tanpa navbar */}
        <div className="flex-1 p-4">
          {children}
        </div>
      </div>
    )
  }

  // Sebagai fallback (seharusnya tidak pernah terjadi)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )
}
