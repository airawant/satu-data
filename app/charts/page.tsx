import { Header } from "@/components/header"
import { ChartBuilder } from "@/components/charts/chart-builder"

export default function ChartsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <ChartBuilder />
      </main>
    </div>
  )
}
