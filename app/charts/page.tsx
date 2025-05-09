import { Header } from "@/components/header"
import { ChartBuilder } from "@/components/charts/chart-builder"
import { Suspense } from "react"

// Gunakan force-dynamic untuk menghindari prerender error
export const dynamic = "force-dynamic";
// Nonaktifkan prerendering untuk halaman ini
export const generateStaticParams = () => [];
// Tunda rendering hingga runtime
export const fetchCache = 'force-no-store';

export default function ChartsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<div className="p-8 text-center">Memuat penampil chart...</div>}>
          <ChartBuilder />
        </Suspense>
      </main>
    </div>
  )
}
