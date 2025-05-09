# Setup Environment Variables untuk Supabase

Untuk menggunakan aplikasi dengan benar, Anda perlu mengatur variabel lingkungan yang tepat untuk Supabase. Ini termasuk Service Role Key yang diperlukan untuk operasi database yang memerlukan hak akses admin.

## Variabel Lingkungan yang Diperlukan

Buat file `.env.local` di root proyek dengan variabel lingkungan berikut:

```
# URL Supabase project Anda
NEXT_PUBLIC_SUPABASE_URL=https://yourapiid.supabase.co

# Kunci Anon yang aman untuk penggunaan publik
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Mode debug untuk Supabase - hapus di production
NEXT_PUBLIC_SUPABASE_DEBUG=true

# SERVICE ROLE KEY - JANGAN PERNAH TAMPILKAN KE PUBLIK
# Key ini memberikan akses penuh ke database Anda
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Cara Mendapatkan Service Role Key

1. Login ke [Dashboard Supabase](https://app.supabase.io)
2. Pilih proyek Anda
3. Pergi ke Pengaturan (Settings) > API
4. Di bagian "Project API keys", Anda akan menemukan `service_role key`
5. Salin nilai ini dan letakkan di file `.env.local` Anda

⚠️ **PERINGATAN**: Service role key memberikan akses penuh ke database Anda dan dapat melewati Row Level Security (RLS). **JANGAN PERNAH** bagikan key ini atau letakkan di front-end kode.

## Penggunaan

Setelah Anda menyiapkan variabel lingkungan ini, aplikasi akan dapat melakukan operasi administrasi seperti menambahkan dataset tanpa perlu login sebagai admin.
