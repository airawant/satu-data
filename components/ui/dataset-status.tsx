"use client"

import { useDatasets } from "@/contexts/dataset-context"
import { Badge } from "@/components/ui/badge"
import { Database } from "lucide-react"

export function DatasetStatus() {
  const { datasets, loading } = useDatasets()

  if (loading) {
    return (
      <Badge variant="outline" className="ml-2">
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
        Memuat dataset...
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="ml-2">
      <Database className="h-3 w-3 mr-1" />
      {datasets.length} dataset tersedia
    </Badge>
  )
}
