"use client"

import { useAuth } from "@/contexts/auth-context"
import { useEffect, useState, useRef } from "react"
import { usePathname, useSearchParams, useRouter } from "next/navigation"

// Storage keys untuk UI state
const LAYOUT_LOADED_KEY = "psd_admin_layout_loaded";
const LAST_AUTH_STATUS_KEY = "psd_last_auth_status";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading, refreshSession } = useAuth()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [layoutLoaded, setLayoutLoaded] = useState(false)
  const [layoutInitialized, setLayoutInitialized] = useState(false)
  const mountedRef = useRef(true)
  const redirectAttemptRef = useRef(0)
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const hasBypass = searchParams?.has('bypass')

  // Log status komponen dan autentikasi untuk debugging
  console.log('Admin layout status:', {
    user: !!user,
    userId: user?.id?.substring(0, 5) || 'none',
    isLoading,
    isRedirecting,
    layoutLoaded,
    layoutInitialized,
    redirectAttempt: redirectAttemptRef.current,
    mounted: mountedRef.current,
    pathname,
    hasBypass,
    timestamp: new Date().toISOString(),
  })

  // Inisialisasi layout yang hanya berjalan sekali
  useEffect(() => {
    if (layoutInitialized) return;

    try {
      // Coba dapatkan status layout dari localStorage
      const lastLoadState = localStorage.getItem(LAYOUT_LOADED_KEY) === 'true';
      const lastAuthStatus = localStorage.getItem(LAST_AUTH_STATUS_KEY);

      console.log('Layout initial state:', { lastLoadState, lastAuthStatus });

      // Jika layout pernah dimuat dan status auth sama, gunakan cache
      if (lastLoadState && lastAuthStatus === String(!!user)) {
        console.log('Using cached layout state');
        setLayoutLoaded(true);
      }
    } catch (error) {
      console.error('Error reading layout cache:', error);
    }

    setLayoutInitialized(true);
  }, [user, layoutInitialized]);

  // Cleanup pada unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      // Hentikan semua timeout saat komponen unmount
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current)
      }
    }
  }, [])

  // Efek untuk menyimpan status layout di localStorage
  useEffect(() => {
    if (!layoutInitialized) return;

    try {
      localStorage.setItem(LAYOUT_LOADED_KEY, String(layoutLoaded));
      localStorage.setItem(LAST_AUTH_STATUS_KEY, String(!!user));
    } catch (error) {
      console.error('Error caching layout state:', error);
    }
  }, [layoutLoaded, user, layoutInitialized]);

  // Tambahkan bypass parameter ke URL saat ini jika belum ada (hanya lakukan sekali)
  useEffect(() => {
    const addBypassOnce = () => {
      if (!searchParams?.has('bypass') && pathname?.startsWith('/admin') && mountedRef.current) {
        console.log('Adding bypass parameter to URL');
        const currentPath = pathname + (searchParams?.toString() ? '?' + searchParams.toString() + '&bypass=true' : '?bypass=true');
        window.history.replaceState(null, '', currentPath);
        return true;
      }
      return false;
    }

    // Coba tambahkan bypass parameter, jika berhasil jangan lakukan apapun lagi
    if (addBypassOnce()) {
      return;
    }
  }, [pathname, searchParams]);

  // Memperbarui status layout saat autentikasi selesai
  useEffect(() => {
    if (!isLoading && layoutInitialized && !layoutLoaded) {
      console.log('Authentication check complete, updating layout state');
      setLayoutLoaded(true);
    }
  }, [isLoading, layoutInitialized, layoutLoaded]);

  // Menangani tab visibility change - perbarui sesi ketika tab kembali aktif
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && user) {
        console.log('Tab became visible, refreshing session silently');
        // Refresh sesi tanpa mengubah UI loading state
        refreshSession().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, refreshSession]);

  // Redirect ke login jika user tidak login dan tidak ada bypass
  useEffect(() => {
    if (!mountedRef.current) return

    // Hanya redirect jika kondisi berikut terpenuhi:
    // 1. Session sudah dicek
    // 2. Tidak sedang loading
    // 3. Tidak ada user terautentikasi
    // 4. Path dimulai dengan /admin
    // 5. Tidak ada parameter bypass (biarkan middleware menangani jika ada bypass)
    if (layoutInitialized && !isLoading && !user && pathname?.includes('/admin') && !hasBypass) {
      console.log('Redirecting to login from admin layout - no user found')
      setIsRedirecting(true);
      redirectAttemptRef.current += 1;

      // Gunakan timeout untuk memastikan UI update terlebih dahulu
      redirectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          window.location.replace(`/login?bypass=true&redirectTo=${encodeURIComponent(pathname || '/admin')}`);
        }
      }, 100);
    }
  }, [user, isLoading, pathname, layoutInitialized, hasBypass])

  // Tampilkan loading spinner saat sedang fetching session atau saat redirecting
  if ((isLoading && !layoutLoaded) || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-3"></div>
          <p className="text-sm text-muted-foreground">
            {isRedirecting
              ? "Mengarahkan ke halaman login..."
              : "Memeriksa status autentikasi..."}
          </p>
          {redirectAttemptRef.current > 1 && (
            <p className="text-xs text-muted-foreground mt-2">
              Mencoba mengalihkan... ({redirectAttemptRef.current})
            </p>
          )}
        </div>
      </div>
    )
  }

  // Sebagai komponen alternatif saat tidak ada user tetapi ada bypass parameter
  if (!user && hasBypass) {
    return (
      <div className="admin-layout min-h-screen flex flex-col" data-bypass-active="true">
        <div className="bg-yellow-100 dark:bg-yellow-900 px-4 py-1 text-xs text-center">
          Mode bypass aktif - Anda belum terautentikasi
        </div>
        <div className="flex-1 p-4">
          {children}
        </div>
      </div>
    );
  }

  // User sudah terautentikasi, tampilkan konten admin
  if (user) {
    return (
      <div className="admin-layout min-h-screen flex flex-col">
        <div className="flex-1 p-4">
          {children}
        </div>
      </div>
    )
  }

  // Fallback (seharusnya tidak pernah terjadi)
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-3"></div>
        <p className="text-sm text-muted-foreground">Memuat halaman admin...</p>
      </div>
    </div>
  )
}
