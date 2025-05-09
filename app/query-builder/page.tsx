import { Header } from "@/components/header"
import { QueryBuilderDataTable } from "@/components/query-builder/query-builder-datatable"
import { Suspense } from "react"

// Nonaktifkan prerendering untuk halaman query-builder
export const dynamic = "force-dynamic";
export const fetchCache = 'force-no-store';
export const generateStaticParams = () => [];

export default function QueryBuilderPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Memuat pembuat query...</p>
            </div>
          </div>
        }>
          <QueryBuilderDataTable />
        </Suspense>
      </main>
    </div>
  )
}
