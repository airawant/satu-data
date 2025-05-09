"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"

// Tambahkan prop untuk variabel grup
interface DatasetFormProps {
  initialData: {
    name: string
    description: string
    category: string
    source: string
  }
  onSubmit: (data: {
    name: string
    description: string
    category: string
    source: string
  }) => void
}

export function DatasetForm({ initialData, onSubmit }: DatasetFormProps) {
  const [formData, setFormData] = useState({
    ...initialData,
  })

  const handleChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      ...formData,
    })
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Informasi Dataset</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Dataset</Label>
            <Input id="name" value={formData.name} onChange={(e) => handleChange("name", e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)} required>
              <SelectTrigger id="category">
                <SelectValue placeholder="Pilih kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="demographics">Demografi</SelectItem>
                <SelectItem value="economy">Ekonomi</SelectItem>
                <SelectItem value="education">Pendidikan</SelectItem>
                <SelectItem value="health">Kesehatan</SelectItem>
                <SelectItem value="environment">Lingkungan</SelectItem>
                <SelectItem value="infrastructure">Infrastruktur</SelectItem>
                <SelectItem value="other">Lainnya</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Sumber Data</Label>
            <Input
              id="source"
              value={formData.source}
              onChange={(e) => handleChange("source", e.target.value)}
              placeholder="contoh: BPS, Kementerian Kesehatan, dll."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Berikan deskripsi singkat tentang dataset ini"
              rows={4}
            />
          </div>

          <Button type="submit" className="w-full">
            Simpan dan Lanjutkan
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
