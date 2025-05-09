"use client"

import { Header } from "@/components/header"
import { DatasetList } from "@/components/data-explorer/dataset-list"
import { AdminProtectedPage } from "@/components/admin/admin-protected-page"

export default function DataExplorerPage() {
  return (
    <AdminProtectedPage redirectPath="/data-explorer">
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-6">
          <div className="flex flex-col gap-4 md:gap-8">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold">Eksplorasi Data</h1>
            </div>
            <DatasetList />
          </div>
        </main>
      </div>
    </AdminProtectedPage>
  )
}
