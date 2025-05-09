"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { useDatasets, type Dataset, type TableConfig } from "@/contexts/dataset-context"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Check, Info, Plus, Trash2 } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const formSchema = z.object({
  tableTitle: z.string().min(1, {
    message: "Judul tabel harus diisi",
  }),
  variables: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      type: z.enum(["Karakteristik", "Judul Baris", ""]),
      aggregationMethod: z.enum(["sum", "count", "average", ""]).optional(),
    }),
  ),
})

type FormValues = z.infer<typeof formSchema>

interface DynamicTableConfigFormProps {
  dataset: Dataset
}

export function DynamicTableConfigForm({ dataset }: DynamicTableConfigFormProps) {
  const { updateTableConfig, addTableConfig, deleteTableConfig } = useDatasets()
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null)
  const [configs, setConfigs] = useState<TableConfig[]>([])

  // Load existing configurations
  useEffect(() => {
    if (dataset.tableConfigs && dataset.tableConfigs.length > 0) {
      setConfigs(dataset.tableConfigs)
      // Select the first config by default
      setSelectedConfigId(dataset.tableConfigs[0].id)
    } else if (dataset.tableConfig) {
      // For backward compatibility
      const config = {
        ...dataset.tableConfig,
        id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      }
      setConfigs([config])
      setSelectedConfigId(config.id)
    } else {
      setConfigs([])
      setSelectedConfigId(null)
    }
  }, [dataset])

  // Transform dataset variables to form variables
  const transformVariablesToFormValues = (configId: string | null) => {
    if (!configId) return dataset.variables.map((v) => ({
      id: v.id,
      name: v.name,
      type: "" as "" | "Karakteristik" | "Judul Baris",
      aggregationMethod: "" as "" | "sum" | "count" | "average"
    }));

    const tableConfig = configs.find((c) => c.id === configId);
    if (!tableConfig) return dataset.variables.map((v) => ({
      id: v.id,
      name: v.name,
      type: "" as "" | "Karakteristik" | "Judul Baris",
      aggregationMethod: "" as "" | "sum" | "count" | "average"
    }));

    // Map existing variables to form values
    return dataset.variables.map((variable) => {
      let type: "" | "Karakteristik" | "Judul Baris" = "";
      let aggregationMethod: "" | "sum" | "count" | "average" = "";

      // Check if this variable is the row field
      if (tableConfig.rowField === variable.name) {
        type = "Judul Baris";
      }
      // Check if this variable is in characteristic fields
      else if (tableConfig.characteristicFields?.includes(variable.name)) {
        type = "Karakteristik";
        aggregationMethod = (tableConfig.aggregationMethod || "") as "" | "sum" | "count" | "average";
      }

      return {
        id: variable.id,
        name: variable.name,
        type,
        aggregationMethod,
      };
    });
  }

  // Get default values from existing config or set empty defaults
  const getDefaultValues = (configId: string | null): FormValues => {
    if (!configId) {
      return {
        tableTitle: "",
        variables: transformVariablesToFormValues(null),
      }
    }

    const tableConfig = configs.find((c) => c.id === configId)

    return {
      tableTitle: tableConfig?.titleField || "",
      variables: transformVariablesToFormValues(configId),
    }
  }

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: getDefaultValues(selectedConfigId),
  })

  // Reset form when selected config changes
  useEffect(() => {
    form.reset(getDefaultValues(selectedConfigId))
  }, [selectedConfigId, form])

  // Watch for changes in the variables array to update the form
  const variables = form.watch("variables")

  function onSubmit(values: FormValues) {
    // Find the row field (should be only one)
    const rowField = values.variables.find((v) => v.type === "Judul Baris")?.name || ""

    // Find all characteristic fields
    const characteristicFields = values.variables.filter((v) => v.type === "Karakteristik").map((v) => v.name)

    // Find the aggregation method (should be the same for all characteristics)
    const aggregationMethod =
      (values.variables.find((v) => v.type === "Karakteristik")?.aggregationMethod as "sum" | "count" | "average") ||
      "sum"

    const config: TableConfig = {
      id: selectedConfigId || `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      titleField: values.tableTitle,
      rowField,
      characteristicFields,
      aggregationMethod,
    }

    if (selectedConfigId) {
      // Update existing config
      updateTableConfig(dataset.id, config)

      // Update local state
      setConfigs((prev) => prev.map((c) => (c.id === selectedConfigId ? config : c)))
    } else {
      // Add new config
      addTableConfig(dataset.id, config).then(newConfigId => {
        setSelectedConfigId(newConfigId)

        // Update local state
        setConfigs((prev) => [...prev, { ...config, id: newConfigId }])
      })
    }

    setIsSuccess(true)
    toast({
      title: "Konfigurasi berhasil disimpan",
      description: "Konfigurasi tabel dinamis telah berhasil disimpan.",
    })
  }

  const handleNewConfig = () => {
    setSelectedConfigId(null)
    form.reset(getDefaultValues(null))
  }

  const handleDeleteConfig = (configId: string) => {
    if (configs.length <= 1) {
      toast({
        title: "Tidak dapat menghapus",
        description: "Minimal harus ada satu konfigurasi tabel.",
        variant: "destructive",
      })
      return
    }

    deleteTableConfig(dataset.id, configId)

    // Update local state
    const updatedConfigs = configs.filter((c) => c.id !== configId)
    setConfigs(updatedConfigs)

    // Select another config if the deleted one was selected
    if (selectedConfigId === configId) {
      setSelectedConfigId(updatedConfigs[0]?.id || null)
    }

    toast({
      title: "Konfigurasi dihapus",
      description: "Konfigurasi tabel dinamis telah berhasil dihapus.",
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {isSuccess && (
          <Alert className="bg-green-50 border-green-200 mb-6">
            <Check className="h-4 w-4 text-green-600" />
            <AlertTitle className="text-green-800">Konfigurasi berhasil disimpan</AlertTitle>
            <AlertDescription className="text-green-700">
              Konfigurasi tabel dinamis telah berhasil disimpan dan akan digunakan saat menampilkan data di halaman
              Tabel Dinamis.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Konfigurasi Variabel</h3>
                  </div>

                  <div className="border rounded-md">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="p-2 text-left font-medium">Nama Variabel</th>
                          <th className="p-2 text-left font-medium">Tipe Data</th>
                          <th className="p-2 text-left font-medium">Tipe</th>
                          <th className="p-2 text-left font-medium">Opsi Nilai</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dataset.variables.map((variable, index) => (
                          <tr key={variable.id} className="border-b">
                            <td className="p-2">{variable.name}</td>
                            <td className="p-2">{variable.dataType}</td>
                            <td className="p-2">
                              <FormField
                                control={form.control}
                                name={`variables.${index}.type`}
                                render={({ field }) => (
                                  <FormItem>
                                    <Select
                                      value={field.value}
                                      onValueChange={(value) => {
                                        // If changing to "Judul Baris", ensure only one row is selected
                                        if (value === "Judul Baris") {
                                          // Reset all other variables that were previously "Judul Baris"
                                          const updatedVariables = [...variables]
                                          updatedVariables.forEach((v, i) => {
                                            if (i !== index && v.type === "Judul Baris") {
                                              form.setValue(`variables.${i}.type`, "")
                                            }
                                          })
                                        }
                                        field.onChange(value)
                                      }}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Pilih tipe" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="-">-</SelectItem>
                                        <SelectItem value="Karakteristik">Karakteristik</SelectItem>
                                        <SelectItem value="Judul Baris">Judul Baris</SelectItem>
                                      </SelectContent>
                                    </Select>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </td>
                            <td className="p-2">
                              {variables[index]?.type === "Karakteristik" && (
                                <FormField
                                  control={form.control}
                                  name={`variables.${index}.aggregationMethod`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select
                                        value={field.value || ""}
                                        onValueChange={(value) => {
                                          // Update all Karakteristik variables to have the same aggregation method
                                          const updatedVariables = [...variables]
                                          updatedVariables.forEach((v, i) => {
                                            if (v.type === "Karakteristik") {
                                              form.setValue(`variables.${i}.aggregationMethod`, value as "" | "sum" | "count" | "average")
                                            }
                                          })
                                        }}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Pilih opsi nilai" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="sum">Sum</SelectItem>
                                          <SelectItem value="count">Count</SelectItem>
                                          <SelectItem value="average">Average</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Daftar Konfigurasi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="border rounded-md overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Judul Tabel</TableHead>
                          <TableHead className="w-[100px]">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {configs.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center py-4 text-muted-foreground">
                              Belum ada konfigurasi
                            </TableCell>
                          </TableRow>
                        ) : (
                          configs.map((config) => (
                            <TableRow key={config.id} className={selectedConfigId === config.id ? "bg-primary/10" : ""}>
                              <TableCell className="cursor-pointer" onClick={() => setSelectedConfigId(config.id)}>
                                {config.titleField || "Tanpa judul"}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteConfig(config.id)}>
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full flex items-center gap-2"
                    onClick={handleNewConfig}
                  >
                    <Plus className="h-4 w-4" />
                    <span>Tambah Konfigurasi Baru</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Pengaturan Tabel</h3>

                  <FormField
                    control={form.control}
                    name="tableTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Judul Tabel/Indikator</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan judul tabel" {...field} />
                        </FormControl>
                        <FormDescription>Judul ini akan ditampilkan sebagai judul tabel</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Alert className="mt-6">
                    <Info className="h-4 w-4" />
                    <AlertTitle>Petunjuk Konfigurasi</AlertTitle>
                    <AlertDescription className="text-sm">
                      <ul className="list-disc pl-4 space-y-1 mt-2">
                        <li>
                          Pilih satu variabel sebagai <strong>Judul Baris</strong>
                        </li>
                        <li>
                          Pilih satu atau lebih variabel sebagai <strong>Karakteristik</strong>
                        </li>
                        <li>Pilih metode agregasi untuk nilai karakteristik</li>
                        <li>Masukkan judul tabel/indikator</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="pt-4">
                    <Button type="submit" className="w-full">
                      Simpan Konfigurasi
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  )
}
