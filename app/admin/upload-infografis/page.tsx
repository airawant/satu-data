import { Suspense } from "react";
import { UploadInfografisClient } from "@/components/admin/upload-infografis-client";

// Nonaktifkan prerendering untuk halaman upload-infografis
export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const generateStaticParams = () => [];

export default function UploadInfografisPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1">
        <div className="container mx-auto py-8">
          <h1 className="text-3xl font-bold mb-8">Unggah Infografis</h1>

          <Suspense fallback={
            <div className="flex items-center justify-center h-24">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <p className="text-sm text-muted-foreground">Memuat form unggah infografis...</p>
              </div>
            </div>
          }>
            <UploadInfografisClient />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
