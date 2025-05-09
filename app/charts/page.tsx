import { Header } from "@/components/header"
import { ChartBuilder } from "@/components/charts/chart-builder"
import { Suspense } from "react"

export const dynamic = "force-dynamic";

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
