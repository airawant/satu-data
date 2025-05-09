import { Suspense } from "react";
import { Header } from "@/components/header";
import { DynamicTableConfigClient } from "@/components/admin/dynamic-table-config-client";

// Nonaktifkan prerendering untuk halaman dynamic-table-config
export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const generateStaticParams = () => [];

export default function DynamicTableConfigPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-10">
        <h1 className="text-3xl font-bold mb-6">Konfigurasi Tabel Dinamis</h1>
        <p className="text-muted-foreground mb-8">
          Konfigurasikan dataset untuk digunakan dalam tabel dinamis dengan menentukan judul
          tabel, judul baris, dan karakteristik kolom. Anda dapat membuat beberapa konfigurasi
          untuk satu dataset.
        </p>

        <Suspense fallback={
          <div className="flex items-center justify-center h-24">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Memuat konfigurasi tabel...</p>
            </div>
          </div>
        }>
          <DynamicTableConfigClient />
        </Suspense>
      </main>
    </div>
  );
}
