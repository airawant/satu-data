"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useSavedItems, type SavedItemType } from "@/contexts/saved-items-context"
import { useToast } from "@/components/ui/use-toast"

interface SaveItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: SavedItemType
  title: string
  datasetId: string
  datasetName: string
  configuration: any
  previewImageUrl?: string
  onSaveSuccess?: (id: string) => void
}

export function SaveItemDialog({
  open,
  onOpenChange,
  type,
  title: initialTitle,
  datasetId,
  datasetName,
  configuration,
  previewImageUrl,
  onSaveSuccess,
}: SaveItemDialogProps) {
  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const { addSavedItem } = useSavedItems()
  const { toast } = useToast()

  const handleSave = () => {
    if (!title.trim()) {
      toast({
        title: "Judul diperlukan",
        description: "Silakan masukkan judul untuk item yang disimpan.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      const id = addSavedItem({
        type,
        title,
        description,
        datasetId,
        datasetName,
        configuration,
        previewImageUrl,
      })

      toast({
        title: "Berhasil disimpan",
        description: `${type === "graph" ? "Grafik" : "Tabel"} telah berhasil disimpan.`,
      })

      if (onSaveSuccess) {
        onSaveSuccess(id)
      }

      onOpenChange(false)
    } catch (error) {
      console.error("Error saving item:", error)
      toast({
        title: "Gagal menyimpan",
        description: "Terjadi kesalahan saat menyimpan. Silakan coba lagi.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Simpan {type === "graph" ? "Grafik" : "Tabel"}</DialogTitle>
          <DialogDescription>
            Simpan {type === "graph" ? "grafik" : "tabel"} ini untuk diakses nanti di halaman Statistik.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-right">
              Judul
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="col-span-3"
              placeholder="Masukkan judul"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Deskripsi
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
              placeholder="Masukkan deskripsi (opsional)"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Dataset</Label>
            <div className="col-span-3 text-sm text-muted-foreground">{datasetName}</div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Menyimpan..." : "Simpan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
