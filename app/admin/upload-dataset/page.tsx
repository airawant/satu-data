"use client"

import { Header } from "@/components/header"
import { DatasetUploader } from "@/components/admin/dataset-uploader"
import { AdminProtectedPage } from "@/components/admin/admin-protected-page"

export default function UploadDatasetPage() {
  return (
    <AdminProtectedPage redirectPath="/admin/upload-dataset">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Unggah Dataset</h1>
            <p className="text-muted-foreground mt-2">
              Unggah dataset baru dan konfigurasikan variabel mana yang akan tersedia untuk analisis.
            </p>
          </div>
          <DatasetUploader />
        </main>
      </div>
    </AdminProtectedPage>
  )
}
