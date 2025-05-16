# Portal Satu Data Kemenag Kota Tanjungpinang

Aplikasi Portal Satu Data untuk Kantor Kementerian Agama Kota Tanjungpinang.

## Tema Warna

Aplikasi ini menggunakan skema warna yang diambil dari logo Kementerian Agama:

- **Merah** (`--primary: 354 70% 54%`) - Warna utama, diambil dari warna merah pada logo Kemenag
- **Hijau** (`--secondary: 142 76% 36%`) - Warna sekunder, diambil dari warna hijau pada logo Kemenag
- **Kuning** (`--accent: 45 93% 47%`) - Warna aksen, diambil dari warna kuning pada logo Kemenag

Warna-warna ini telah disesuaikan untuk mode terang (light mode) dan mode gelap (dark mode).

## Logo

File logo yang digunakan:

- `/public/logo.png` - Logo Kementerian Agama yang ditampilkan di navbar

## Teknologi yang Digunakan

- **Next.js 14** - Framework React untuk aplikasi web
- **Tailwind CSS** - Framework CSS untuk styling
- **Supabase** - Backend untuk autentikasi dan database
- **shadcn/ui** - Komponen UI yang dapat disesuaikan

## Fitur

- Autentikasi dan kontrol akses
- Visualisasi data dengan berbagai jenis grafik
- Pembuat kueri data interaktif
- Dashboard analitik
- Pengelolaan dataset
- Eksplorasi data
- Footer responsif dengan informasi instansi dan media sosial

## Komponen Footer

Footer aplikasi diimplementasikan sebagai client component (`"use client"`) dan memiliki fitur-fitur berikut:

- **Informasi Kantor** - Menampilkan alamat, kontak telepon, dan email Kemenag Kota Tanjungpinang
- **Link Terkait** - Tautan ke portal terkait seperti Portal Satu Data Indonesia dan Satu Data Kementerian Agama RI
- **Media Sosial** - Tautan ke akun media sosial resmi (Facebook, Twitter, Instagram, YouTube)
- **Newsletter** - Form berlangganan untuk mendapatkan update terbaru via email
- **Layanan Pengaduan** - Tautan ke platform LAPOR! untuk pengaduan masyarakat
- **Tombol Back-to-Top** - Tombol interaktif yang muncul saat pengguna men-scroll ke bawah
- **Desain Responsif** - Tampilan yang optimal pada berbagai ukuran layar (desktop dan mobile)

Footer ini menggunakan React Hooks (`useState` dan `useEffect`) untuk mengelola status tampilan tombol back-to-top dan event listener scroll.

## Pengembangan

Untuk menjalankan aplikasi dalam mode pengembangan:

```bash
npm run dev
# atau
yarn dev
# atau
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

## Penerapan (Deployment)

Aplikasi ini dapat di-deploy ke berbagai platform hosting, seperti Vercel, Netlify, atau server khusus.

```bash
npm run build
npm run start
```
