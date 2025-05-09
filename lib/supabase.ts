import { createClient } from '@supabase/supabase-js'

// Ambil URL dan Anon Key dari variable environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Verifikasi variabel environment ada
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables missing:',
    !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL is missing' : '',
    !supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY is missing' : '');
}

if (process.env.NEXT_PUBLIC_SUPABASE_DEBUG === 'true') {
  console.log('Supabase URL configured:', supabaseUrl);
  console.log('Supabase Anon Key configured:', supabaseAnonKey ? '[KEY CONFIGURED]' : '[KEY MISSING]');
}

// Konfigurasi klien untuk browser/client-side
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Konfigurasi klien untuk server API yang menggunakan service role key
// Service role key memberikan akses penuh untuk bypassing RLS
let supabaseAdmin: ReturnType<typeof createClient> | null = null;

// Hanya gunakan serviceRole di server-side
if (typeof window === 'undefined' && process.env.SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}

export { supabaseAdmin };
