"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SaveIcon } from "lucide-react"
import { SaveItemDialog } from "@/components/save-item-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface ChartBuilderSaveButtonProps {
  disabled: boolean
  chartType: string
  chartData: any
  datasetId: string
  datasetName: string
  xAxisVariables: string[]
  yAxisVariables: string[]
  groupVariable?: string | null
  labelVariable?: string | null
}

export function ChartBuilderSaveButton({
  disabled,
  chartType,
  chartData,
  datasetId,
  datasetName,
  xAxisVariables,
  yAxisVariables,
  groupVariable,
  labelVariable,
}: ChartBuilderSaveButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSaveClick = () => {
    if (disabled) {
      toast({
        title: "Tidak dapat menyimpan",
        description: "Silakan buat grafik terlebih dahulu sebelum menyimpan.",
        variant: "destructive",
      })
      return
    }

    setDialogOpen(true)
  }

  const handleSaveSuccess = (id: string) => {
    toast({
      title: "Grafik disimpan",
      description: "Grafik telah berhasil disimpan. Anda dapat melihatnya di halaman Statistik.",
      action: (
        <Button variant="outline" size="sm" onClick={() => router.push("/statistik")}>
          Lihat
        </Button>
      ),
    })
  }

  // Create a title based on the chart configuration
  const generateTitle = () => {
    const xAxisNames = xAxisVariables.join(", ")
    const yAxisNames = yAxisVariables.length > 0 ? yAxisVariables.join(", ") : "Jumlah"

    return `Grafik ${chartType} - ${xAxisNames} vs ${yAxisNames}`
  }

  return (
    <>
      <Button variant="outline" className="flex items-center gap-1" onClick={handleSaveClick} disabled={disabled}>
        <SaveIcon className="h-4 w-4" />
        <span>Simpan</span>
      </Button>

      <SaveItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        type="graph"
        title={generateTitle()}
        datasetId={datasetId}
        datasetName={datasetName}
        configuration={{
          chartType,
          chartData,
          xAxisVariables,
          yAxisVariables,
          groupVariable,
          labelVariable,
        }}
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  )
}
