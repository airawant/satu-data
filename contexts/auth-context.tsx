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
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [adminData, setAdminData] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [sessionChecked, setSessionChecked] = useState(false)
  const mountedRef = useRef(true)
  const router = useRouter()
  const pathname = usePathname()

  console.log('Auth state:', {
    user: !!user,
    userId: user?.id?.substring(0, 5),
    adminData: !!adminData,
    isLoading,
    sessionChecked,
    pathname,
    mounted: mountedRef.current
  })

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
      console.log('Fetching admin data for user:', user.id)
      const { data, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("id", user.id)
        .single()

      if (error) {
        console.error("Error fetching admin data:", error)
        return null
      }

      console.log('Admin data fetched:', data)
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
      console.log('Redirecting to login from auth context - no user found')
      // Gunakan window.location.replace alih-alih window.location.href untuk navigasi yang lebih reliable
      window.location.replace('/login?bypass=true')
    }
  }, [user, isLoading, pathname, sessionChecked])

  useEffect(() => {
    console.log('Setting up auth state listener')

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, !!session)

      if (!mountedRef.current) return

      setIsLoading(true)

      if (session?.user) {
        setUser(session.user)
        const adminData = await fetchUserData(session.user)
        if (mountedRef.current) {
          setAdminData(adminData)
          setSessionChecked(true)
          setIsLoading(false)
        }
      } else {
        if (mountedRef.current) {
          setUser(null)
          setAdminData(null)
          setSessionChecked(true)
          setIsLoading(false)
        }
      }
    })

    // Check for session on initial load
    const checkSession = async () => {
      console.log('Checking initial session')
      try {
        if (!mountedRef.current) return

        const { data: { session } } = await supabase.auth.getSession()
        console.log('Initial session check:', !!session)

        if (!mountedRef.current) return

        if (session?.user) {
          setUser(session.user)
          const adminData = await fetchUserData(session.user)
          if (mountedRef.current) {
            setAdminData(adminData)

            // Deteksi jika di halaman login dan sudah login, redirect ke dashboard
            if (pathname === '/login') {
              setTimeout(() => {
                if (mountedRef.current) {
                  console.log('Already logged in on login page, redirecting to dashboard')
                  window.location.replace('/dashboard')
                }
              }, 100)
            }
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      } finally {
        if (mountedRef.current) {
          setSessionChecked(true)
          setIsLoading(false)
        }
      }
    }

    // Buat timeout untuk memastikan state tidak stuck loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading && mountedRef.current) {
        console.log('Loading timeout triggered - resetting loading state')
        setIsLoading(false)
        setSessionChecked(true)
      }
    }, 5000)

    checkSession()

    return () => {
      mountedRef.current = false
      subscription?.unsubscribe()
      clearTimeout(loadingTimeout)
    }
  }, [fetchUserData])

  const signIn = async (email: string, password: string) => {
    if (!mountedRef.current) return { error: { message: "Component unmounted" } }

    console.log('Signing in with email:', email)
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

      console.log('Sign in result:', { success: !!data?.user, error: !!error })

      if (error) {
        return { error }
      }

      if (data?.user) {
        // Check if user is an admin
        const adminData = await fetchUserData(data.user)

        if (!mountedRef.current) return { error: null }

        if (!adminData) {
          console.log('User not found in admin_users table')
          await supabase.auth.signOut()
          return { error: { message: "Akun tidak memiliki akses admin" } }
        }

        setUser(data.user)
        setAdminData(adminData)
        setSessionChecked(true)

        toast({
          title: "Login berhasil",
          description: `Selamat datang, ${adminData.full_name || email}`,
        })

        // Redirect ke dashboard admin
        window.location.replace('/dashboard')
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

    console.log('Signing out')
    setIsLoading(true)

    try {
      await supabase.auth.signOut()

      if (!mountedRef.current) return

      setUser(null)
      setAdminData(null)

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
