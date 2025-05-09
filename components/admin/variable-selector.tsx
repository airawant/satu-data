"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type DatasetVariable = {
  name: string
  type: "dimension" | "measure"
  dataType: "string" | "number" | "date"
  selected: boolean
}

interface VariableSelectorProps {
  variables: DatasetVariable[]
  onVariablesChange: (variables: DatasetVariable[]) => void
}

export function VariableSelector({ variables, onVariablesChange }: VariableSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const handleVariableChange = (index: number, field: keyof DatasetVariable, value: any) => {
    const updatedVariables = [...variables]
    updatedVariables[index] = {
      ...updatedVariables[index],
      [field]: value,
    }
    onVariablesChange(updatedVariables)
  }

  const handleSelectAll = () => {
    const updatedVariables = variables.map((variable) => ({
      ...variable,
      selected: true,
    }))
    onVariablesChange(updatedVariables)
  }

  const handleDeselectAll = () => {
    const updatedVariables = variables.map((variable) => ({
      ...variable,
      selected: false,
    }))
    onVariablesChange(updatedVariables)
  }

  const filteredVariables = variables.filter((variable) =>
    variable.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Konfigurasi Variabel</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari variabel..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Pilih Semua
            </Button>
            <Button variant="outline" size="sm" onClick={handleDeselectAll}>
              Batalkan Semua
            </Button>
          </div>

          <div className="border rounded-md">
            <div className="p-3 bg-muted border-b grid grid-cols-12 gap-2">
              <div className="col-span-1"></div>
              <div className="col-span-5 font-medium">Nama Variabel</div>
              <div className="col-span-3 font-medium">Tipe</div>
              <div className="col-span-3 font-medium">Tipe Data</div>
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {filteredVariables.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  Tidak ada variabel yang cocok dengan pencarian Anda.
                </div>
              ) : (
                filteredVariables.map((variable, index) => (
                  <div
                    key={variable.name}
                    className="p-3 border-b last:border-b-0 grid grid-cols-12 gap-2 items-center hover:bg-muted/50"
                  >
                    <div className="col-span-1">
                      <Checkbox
                        id={`variable-${index}`}
                        checked={variable.selected}
                        onCheckedChange={(checked) => handleVariableChange(index, "selected", checked === true)}
                      />
                    </div>
                    <Label htmlFor={`variable-${index}`} className="col-span-5 cursor-pointer">
                      {variable.name}
                    </Label>
                    <div className="col-span-3">
                      <Select
                        value={variable.type}
                        onValueChange={(value) => handleVariableChange(index, "type", value as "dimension" | "measure")}
                        disabled={!variable.selected}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dimension">Dimensi</SelectItem>
                          <SelectItem value="measure">Ukuran</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-3">
                      <Select
                        value={variable.dataType}
                        onValueChange={(value) =>
                          handleVariableChange(index, "dataType", value as "string" | "number" | "date")
                        }
                        disabled={!variable.selected}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="string">Teks</SelectItem>
                          <SelectItem value="number">Angka</SelectItem>
                          <SelectItem value="date">Tanggal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              {variables.filter((v) => v.selected).length} dari {variables.length} variabel dipilih
            </div>
            <div className="flex space-x-2">
              <Badge variant="outline">
                Dimensi: {variables.filter((v) => v.selected && v.type === "dimension").length}
              </Badge>
              <Badge variant="outline">
                Ukuran: {variables.filter((v) => v.selected && v.type === "measure").length}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
