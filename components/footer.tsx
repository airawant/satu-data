"use client"

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Facebook, Instagram, Twitter, Youtube, Mail, Phone, MapPin, ArrowUp } from 'lucide-react'

export default function Footer() {
  const [showBackToTop, setShowBackToTop] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true)
      } else {
        setShowBackToTop(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <footer className="bg-slate-900 text-white">
      {/* Back To Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed right-4 bottom-4 bg-primary text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 ${
          showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        aria-label="Kembali ke atas"
      >
        <ArrowUp className="w-5 h-5" />
      </button>

      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Informasi Kantor */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Image src="/logo.png" alt="Satu Data Logo" width={40} height={40} className="w-10 h-10" />
              <h2 className="text-xl font-bold">Satu Data Kemenag</h2>
            </div>
            <p className="text-slate-300 mb-4">
              Portal Satu Data Kementerian Agama Kota Tanjungpinang
            </p>
            <div className="space-y-2">
              <div className="flex items-start space-x-2">
                <MapPin className="w-5 h-5 text-slate-400 mt-1 flex-shrink-0" />
                <p className="text-slate-300">
                  Jl. Daeng Kamboja KM.24 Kel. Kampung Bugis, Tanjungpinang, Kepulauan Riau, 29123
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-slate-400" />
                <p className="text-slate-300">0821 72 801 123</p>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-slate-400" />
                <p className="text-slate-300">tanjungpinang@kemenag.go.id</p>
              </div>
            </div>
          </div>

          {/* Tautan Cepat */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">Tautan Terkait</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/" className="text-slate-300 hover:text-white transition">
                  Beranda
                </Link>
              </li>
               <li>
                <Link href="https://tanjungpinang.kemenag.go.id/ptsp/permohonan/baru/3b6e87bef11efb96498f" className="text-slate-300 hover:text-white transition">
                  Permohonan Data dan Informasi Publik
                </Link>
              </li>
              <li>
                <Link href="https://data.go.id/" className="text-slate-300 hover:text-white transition">
                  Portal Satu Data Indonesia
                </Link>
              </li>
              <li>
                <Link href="https://satudata.kemenag.go.id/" className="text-slate-300 hover:text-white transition">
                  Satu Data Kementerian Agama RI
                </Link>
              </li>
              <li>
                <Link href="/pengembang" className="text-slate-300 hover:text-white transition">
                  Pengembang
                </Link>
              </li>
            </ul>
          </div>

          {/* Dokumen & Panduan */}
          {/* <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">Dokumen & Panduan</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/panduan-pengguna" className="text-slate-300 hover:text-white transition">
                  Panduan Pengguna
                </Link>
              </li>
              <li>
                <Link href="/kebijakan-privasi" className="text-slate-300 hover:text-white transition">
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link href="/laporan-tahunan" className="text-slate-300 hover:text-white transition">
                  Laporan Tahunan
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-slate-300 hover:text-white transition">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/download" className="text-slate-300 hover:text-white transition">
                  Download API
                </Link>
              </li>
            </ul>
          </div> */}

          {/* Hubungi Kami & Media Sosial */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-slate-700 pb-2">Media Sosial</h3>
            <p className="text-slate-300 mb-4">
              Ikuti kami di media sosial untuk mendapatkan informasi terbaru
            </p>
            <div className="flex space-x-3 mb-6">
              <a href="https://facebook.com/kemenagtpi" target="_blank" rel="noreferrer"
                className="bg-slate-800 hover:bg-slate-700 transition p-2 rounded-full">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://twitter.com/kemenagtpi" target="_blank" rel="noreferrer"
                className="bg-slate-800 hover:bg-slate-700 transition p-2 rounded-full">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/kemenag_tpi/" target="_blank" rel="noreferrer"
                className="bg-slate-800 hover:bg-slate-700 transition p-2 rounded-full">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@kemenagtpi" target="_blank" rel="noreferrer"
                className="bg-slate-800 hover:bg-slate-700 transition p-2 rounded-full">
                <Youtube className="w-5 h-5" />
              </a>
            </div>

            {/* Newsletter */}
            <h3 className="text-lg font-semibold mb-3">Berlangganan Update</h3>
            <p className="text-slate-300 mb-3 text-sm">
              Dapatkan informasi terbaru langsung ke email Anda
            </p>
            <form className="mb-4" onSubmit={(e) => { e.preventDefault(); alert('Terima kasih telah berlangganan!'); }}>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  placeholder="Alamat email Anda"
                  className="px-3 py-2 bg-slate-800 text-white border border-slate-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition whitespace-nowrap"
                >
                  Langganan
                </button>
              </div>
            </form>

            <h3 className="text-lg font-semibold mb-3">Layanan Pengaduan</h3>
            <a href="https://www.lapor.go.id/instansi/kantor-kementerian-agama-kota-tanjungpinang" target="_blank" rel="noreferrer"
              className="inline-block bg-yellow-600 hover:bg-yellow-700 transition text-white py-2 px-4 rounded-md">
              LAPOR!
            </a>
          </div>
        </div>

        {/* Garis Pemisah */}
        <div className="border-t border-slate-700 my-8"></div>

        {/* Copyright & Disclaimer */}
        <div className="flex flex-col lg:flex-row justify-center items-center">
          <p className="text-slate-400 text-sm mb-4 lg:mb-0 text-center lg:text-center">
            &copy; {new Date().getFullYear()} Kantor Kementerian Agama Kota Tanjungpinang. Hak Cipta Dilindungi.
          </p>
        </div>

        {/* Mobile Optimizations */}
        <div className="mt-6 text-center text-xs text-slate-500 md:hidden">
          <p>Versi 1.0.0 - Dioptimalkan untuk Mobile</p>
          <p className="mt-1">Unduh Aplikasi Satu Data di Play Store</p>
        </div>
      </div>
    </footer>
  )
}
