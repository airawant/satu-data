import { Suspense } from "react";
import { Header } from "@/components/header";
import { DatasetUploaderClient } from "@/components/admin/dataset-uploader-client";

// Nonaktifkan prerendering untuk halaman upload-dataset
export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const generateStaticParams = () => [];

export default function UploadDatasetPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Unggah Dataset</h1>
          <p className="text-muted-foreground mt-2">
            Unggah dataset baru dan konfigurasikan variabel mana yang akan tersedia untuk analisis.
          </p>
        </div>
        <Suspense fallback={
          <div className="flex items-center justify-center h-24">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Memuat uploader dataset...</p>
            </div>
          </div>
        }>
          <DatasetUploaderClient />
        </Suspense>
      </main>
    </div>
  );
}
