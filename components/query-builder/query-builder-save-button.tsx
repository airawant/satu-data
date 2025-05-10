"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { SaveIcon } from "lucide-react"
import { SaveItemDialog } from "@/components/save-item-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

interface QueryBuilderSaveButtonProps {
  disabled: boolean
  tableData: any[]
  datasetId: string
  datasetName: string
  years: string[]
  yearDerivatives: string[]
  characteristics: string[]
  rowTitles: string[]
}

export function QueryBuilderSaveButton({
  disabled,
  tableData,
  datasetId,
  datasetName,
  years,
  yearDerivatives,
  characteristics,
  rowTitles,
}: QueryBuilderSaveButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  const handleSaveClick = () => {
    if (disabled) {
      toast({
        title: "Tidak dapat menyimpan",
        description: "Silakan buat tabel terlebih dahulu sebelum menyimpan.",
        variant: "destructive",
      })
      return
    }

    setDialogOpen(true)
  }

  const handleSaveSuccess = (id: string) => {
    toast({
      title: "Tabel disimpan",
      description: "Tabel dinamis telah berhasil disimpan. Anda dapat melihatnya di halaman Statistik.",
      action: (
        <Button variant="outline" size="sm" onClick={() => router.push("/statistik")}>
          Lihat
        </Button>
      ),
    })
  }

  // Create a title based on the table configuration
  const generateTitle = () => {
    const yearText = years.join(", ")
    const rowTitleText = rowTitles.length > 0 ? "berdasarkan " + rowTitles.join(", ") : ""

    return `Tabel Dinamis - ${yearText} ${rowTitleText}`
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
        type="table"
        title={generateTitle()}
        datasetId={datasetId}
        datasetName={datasetName}
        configuration={{
          tableData,
          years: years.filter(year => year && year !== "null" && year !== "undefined"),
          yearDerivatives,
          characteristics,
          rowTitles,
        }}
        onSaveSuccess={handleSaveSuccess}
      />
    </>
  )
}
