import { Header } from "@/components/header"
import { QueryBuilderDataTable } from "@/components/query-builder/query-builder-datatable"

export default function QueryBuilderPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <QueryBuilderDataTable />
      </main>
    </div>
  )
}
