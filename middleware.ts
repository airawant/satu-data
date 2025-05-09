import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // Jika ada query parameter bypass, biarkan navigasi berjalan normal
  if (req.nextUrl.searchParams.has('bypass')) {
    console.log('Bypass activated, allowing navigation to', req.nextUrl.pathname)
    return NextResponse.next()
  }

  // Membuat response untuk menangani cookie
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  try {
    // Periksa apakah user sudah login
    const { data: { session }, error } = await supabase.auth.getSession()

    // Log session status (hanya di development)
    console.log(`Middleware checking ${req.nextUrl.pathname} - session:`, !!session)

    if (error) {
      console.error('Middleware session error:', error.message)
      // Jika terjadi error pada session, biarkan navigasi berjalan
      return res
    }

    // Daftar rute yang dilindungi (memerlukan login)
    const protectedRoutes = [
      '/dashboard',
      '/admin',
      '/admin/upload-dataset',
      '/admin/upload-infografis',
      '/admin/dynamic-table-config',
      '/data-explorer' // Data-explorer hanya dapat diakses oleh admin yang login
    ]

    // Cek apakah path saat ini termasuk dalam rute yang dilindungi
    const isProtectedRoute = protectedRoutes.some(route =>
      req.nextUrl.pathname === route ||
      (route === '/admin' && req.nextUrl.pathname.startsWith('/admin/'))
    )

    // Jika user mengakses halaman yang dilindungi tanpa login, redirect ke login
    if (!session && isProtectedRoute) {
      console.log('Middleware redirecting to login - no session found for protected route')

      // Encode URL tujuan asli untuk diteruskan ke halaman login
      const encodedUrl = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
      return NextResponse.redirect(new URL(`/login?bypass=true&redirectTo=${encodedUrl}`, req.url))
    }

    // Jika user mengakses halaman login tapi sudah login
    if (session && req.nextUrl.pathname === '/login') {
      console.log('Middleware redirecting from login - user already logged in')

      // Jika ada parameter redirectTo, gunakan itu sebagai tujuan redirect
      const redirectTo = req.nextUrl.searchParams.get('redirectTo');
      if (redirectTo) {
        return NextResponse.redirect(new URL(decodeURIComponent(redirectTo), req.url))
      }

      // Jika tidak ada redirectTo, default ke dashboard
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Jika user mengakses halaman login tanpa parameter bypass, tambahkan parameter bypass
    // Ini untuk memastikan halaman login selalu memiliki bypass=true
    if (req.nextUrl.pathname === '/login' && !req.nextUrl.searchParams.has('bypass')) {
      console.log('Middleware adding bypass parameter to login page')

      // Preserve parameter redirectTo jika ada
      const redirectTo = req.nextUrl.searchParams.get('redirectTo');
      const loginUrl = new URL('/login?bypass=true', req.url);

      if (redirectTo) {
        loginUrl.searchParams.set('redirectTo', redirectTo);
      }

      return NextResponse.redirect(loginUrl)
    }

    // Tangani rute khusus dengan lebih baik
    if (req.nextUrl.pathname === '/charts' ||
        req.nextUrl.pathname === '/login' ||
        req.nextUrl.pathname === '/query-builder') {
      // Pastikan bahwa rute bermasalah selalu dirender dengan stabil, menghindari error prerender
      return NextResponse.next();
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Jika terjadi error, biarkan navigasi berjalan
    return res
  }
}

export const config = {
  // Daftar rute yang harus melalui middleware untuk pengecekan otentikasi
  matcher: [
    '/admin/:path*',
    '/login',
    '/data-explorer',
    '/dashboard',
    '/charts/:path*',
    '/query-builder'
  ],
}
