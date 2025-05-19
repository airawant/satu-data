"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react"
import { useRouter, usePathname } from "next/navigation"
import { supabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"
import { toast } from "@/components/ui/use-toast"

type AdminUser = {
  id: string
  email: string
  full_name: string | null
  role: string
}

interface AuthContextType {
  user: User | null
  adminData: AdminUser | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any | null }>
  signOut: () => Promise<void>
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Storage keys untuk cache
const AUTH_STATE_KEY = 'psd_auth_state';
const AUTH_STATE_TIMESTAMP_KEY = 'psd_auth_state_timestamp';
const SESSION_CHECK_KEY = 'psd_session_checked';
const USER_DETAILS_KEY = 'psd_user_details';
const ADMIN_DETAILS_KEY = 'psd_admin_details';

// Waktu kedaluwarsa untuk cache (30 menit dalam milidetik)
const CACHE_EXPIRY_TIME = 30 * 60 * 1000;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [adminData, setAdminData] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionChecked, setSessionChecked] = useState(false)
  const initialLoadDoneRef = useRef(false)
  const mountedRef = useRef(true)
  const router = useRouter()
  const pathname = usePathname()


  // Fungsi untuk menyimpan status auth ke localStorage
  const cacheAuthState = useCallback((userData: User | null, adminUserData: AdminUser | null) => {
    try {
      localStorage.setItem(AUTH_STATE_KEY, userData ? 'true' : 'false');
      localStorage.setItem(AUTH_STATE_TIMESTAMP_KEY, Date.now().toString());
      localStorage.setItem(SESSION_CHECK_KEY, 'true');

      if (userData) {
        localStorage.setItem(USER_DETAILS_KEY, JSON.stringify(userData));
        if (adminUserData) {
          localStorage.setItem(ADMIN_DETAILS_KEY, JSON.stringify(adminUserData));
        } else {
          localStorage.removeItem(ADMIN_DETAILS_KEY);
        }
      } else {
        localStorage.removeItem(USER_DETAILS_KEY);
        localStorage.removeItem(ADMIN_DETAILS_KEY);
      }
    } catch (error) {
      console.error('Error caching auth state:', error);
    }
  }, []);

  // Fungsi untuk memuat status auth dari localStorage
  const loadCachedAuthState = useCallback(() => {
    try {
      const authState = localStorage.getItem(AUTH_STATE_KEY);
      const timestamp = localStorage.getItem(AUTH_STATE_TIMESTAMP_KEY);
      const isSessionChecked = localStorage.getItem(SESSION_CHECK_KEY) === 'true';

      // Periksa apakah cache masih valid
      if (authState && timestamp && isSessionChecked) {
        const cacheTime = parseInt(timestamp, 10);
        const isExpired = Date.now() - cacheTime > CACHE_EXPIRY_TIME;

        if (!isExpired) {

          // Atur state sessionChecked dari cache
          setSessionChecked(isSessionChecked);

          // Coba muat detail user jika status auth adalah true
          if (authState === 'true') {
            const cachedUserDetails = localStorage.getItem(USER_DETAILS_KEY);
            const cachedAdminDetails = localStorage.getItem(ADMIN_DETAILS_KEY);

            if (cachedUserDetails) {
              const userData = JSON.parse(cachedUserDetails);
              setUser(userData);

              if (cachedAdminDetails) {
                const adminUserData = JSON.parse(cachedAdminDetails);
                setAdminData(adminUserData);
              }

              return true; // Cache berhasil dimuat
            }
          } else {
            // Atur user dan adminData menjadi null jika status auth adalah false
            setUser(null);
            setAdminData(null);
            return true; // Cache berhasil dimuat
          }
        } else {
          // Hapus cache yang sudah kedaluwarsa
          localStorage.removeItem(AUTH_STATE_KEY);
          localStorage.removeItem(AUTH_STATE_TIMESTAMP_KEY);
          localStorage.removeItem(SESSION_CHECK_KEY);
          localStorage.removeItem(USER_DETAILS_KEY);
          localStorage.removeItem(ADMIN_DETAILS_KEY);
        }
      }

      return false; // Cache tidak tersedia atau tidak valid
    } catch (error) {
      console.error('Error loading cached auth state:', error);
      return false;
    }
  }, []);

  // Bersihkan mountedRef ketika komponen unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Buat fetchUserData sebagai useCallback
  const fetchUserData = useCallback(async (user: User) => {
    if (!mountedRef.current) return null

    try {
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error fetching admin data:", error)
        return null
      }
      return data as AdminUser
    } catch (error) {
      console.error("Error fetching admin data:", error)
      return null
    }
  }, [])

  // Redirect logic untuk redirecting ke login jika akses halaman admin tanpa login
  useEffect(() => {
    if (!mountedRef.current) return

    if (sessionChecked && !isLoading && !user && pathname?.includes('/admin')) {
      // Gunakan window.location.replace alih-alih window.location.href untuk navigasi yang lebih reliable
      window.location.replace('/login?bypass=true')
    }
  }, [user, isLoading, pathname, sessionChecked])

  useEffect(() => {

    // Coba muat status auth dari cache terlebih dahulu
    const cacheLoaded = loadCachedAuthState();

    if (cacheLoaded) {
      setIsLoading(false);
      initialLoadDoneRef.current = true;
    }

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {

      if (!mountedRef.current) return;

      // Jangan set loading lagi jika initial load sudah selesai, kecuali untuk sign out/sign in
      if (!initialLoadDoneRef.current || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        setIsLoading(true);
      }

      if (session?.user) {
        setUser(session.user);
        const adminData = await fetchUserData(session.user);
        if (mountedRef.current) {
          setAdminData(adminData);
          setSessionChecked(true);
          setIsLoading(false);
          initialLoadDoneRef.current = true;

          // Cache status autentikasi
          cacheAuthState(session.user, adminData);
        }
      } else {
        if (mountedRef.current) {
          setUser(null);
          setAdminData(null);
          setSessionChecked(true);
          setIsLoading(false);
          initialLoadDoneRef.current = true;

          // Cache status autentikasi
          cacheAuthState(null, null);
        }
      }
    });

    // Check for session on initial load
    const checkSession = async () => {
      // Jika cache sudah dimuat, skip pemeriksaan session awal
      if (cacheLoaded && initialLoadDoneRef.current) {
        return;
      }

      try {
        if (!mountedRef.current) return

        const { data: { session } } = await supabase.auth.getSession()

        if (!mountedRef.current) return

        if (session?.user) {
          setUser(session.user)
          const adminData = await fetchUserData(session.user)
          if (mountedRef.current) {
            setAdminData(adminData)

            // Cache status autentikasi
            cacheAuthState(session.user, adminData);

            // Deteksi jika di halaman login dan sudah login, redirect ke dashboard
            if (pathname === '/login') {
              setTimeout(() => {
                if (mountedRef.current) {
                  window.location.replace('/admin/dashboard')
                }
              }, 100)
            }
          }
        } else {
          // Jika tidak ada sesi, hapus cache
          cacheAuthState(null, null);
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        if (mountedRef.current) {
          setSessionChecked(true)
          setIsLoading(false)
          initialLoadDoneRef.current = true
        }
      }
    }

    // Buat timeout untuk memastikan state tidak stuck loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading && mountedRef.current) {
        setIsLoading(false)
        setSessionChecked(true)
        initialLoadDoneRef.current = true
      }
    }, 5000)

    // Jalankan pemeriksaan sesi hanya jika cache tidak dimuat
    if (!cacheLoaded) {
    checkSession()
    }

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [fetchUserData, loadCachedAuthState, cacheAuthState, pathname])

  // Metode untuk refresh sesi secara manual
  const refreshSession = useCallback(async () => {
    if (!mountedRef.current) return;

    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        console.error('Error refreshing session:', error);
        // Jika gagal refresh, hapus cache dan reset state
        cacheAuthState(null, null);
        setUser(null);
        setAdminData(null);
      } else if (data?.session?.user) {
        setUser(data.session.user);
        const adminData = await fetchUserData(data.session.user);
        if (mountedRef.current) {
          setAdminData(adminData);
          // Update cache
          cacheAuthState(data.session.user, adminData);
        }
      } else {
        // Jika tidak ada sesi, hapus cache dan reset state
        cacheAuthState(null, null);
        setUser(null);
        setAdminData(null);
      }
    } catch (error) {
      console.error('Exception during refresh session:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
        setSessionChecked(true);
      }
    }
  }, [fetchUserData, cacheAuthState]);

  const signIn = async (email: string, password: string) => {
    if (!mountedRef.current) return { error: { message: "Component unmounted" } }
    setIsLoading(true)

    try {
      // Tambahkan timeout untuk signIn
      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      })

      // Race dengan timeout 10 detik
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Login timeout exceeded")), 10000);
      });

      // Gunakan Promise.race untuk menghindari stuck
      const { data, error } = await Promise.race([
        loginPromise,
        timeoutPromise
      ]) as any;

      if (!mountedRef.current) return { error: null }


      if (error) {
        return { error }
      }

      if (data?.user) {
        // Check if user is an admin
        const adminData = await fetchUserData(data.user)

        if (!mountedRef.current) return { error: null }

        if (!adminData) {
          await supabase.auth.signOut()
          cacheAuthState(null, null); // Reset cache
          return { error: { message: "Akun tidak memiliki akses admin" } }
        }

        setUser(data.user)
        setAdminData(adminData)
        setSessionChecked(true)

        // Update cache with new session data
        cacheAuthState(data.user, adminData);

        toast({
          title: "Login berhasil",
          description: `Selamat datang, ${adminData.full_name || email}`,
        })

        // Redirect ke dashboard admin
        window.location.replace('/admin/dashboard')
        return { error: null }
      }

      return { error: { message: "Terjadi kesalahan saat login" } }
    } catch (error: any) {
      console.error('Error during sign in:', error)
      // Jika timeout, berikan pesan yang tepat
      if (error.message === "Login timeout exceeded") {
        return { error: { message: "Timeout saat login, silakan coba lagi" } }
      }
      return { error }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const signOut = async () => {
    if (!mountedRef.current) return
    setIsLoading(true)

    try {
      await supabase.auth.signOut()

      if (!mountedRef.current) return

      setUser(null)
      setAdminData(null)

      // Reset cache on signout
      cacheAuthState(null, null);

      toast({
        title: "Logout berhasil",
        description: "Anda telah keluar dari sistem",
      })

      // Gunakan window.location.replace untuk navigasi yang lebih reliable
      window.location.replace('/login?bypass=true')
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      if (mountedRef.current) {
        setIsLoading(false)
      }
    }
  }

  const value = {
    user,
    adminData,
    isLoading,
    signIn,
    signOut,
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
