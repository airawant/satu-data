"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card } from "@/components/ui/card"
import { FileUploader } from "@/components/admin/file-uploader"
import { DatasetPreview } from "@/components/admin/dataset-preview"
import { VariableSelector } from "@/components/admin/variable-selector"
import { DatasetForm } from "@/components/admin/dataset-form"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, ArrowRight, Save } from "lucide-react"
import { useDatasets, type DatasetVariable as ContextDatasetVariable } from "@/contexts/dataset-context"
import { useRouter } from "next/navigation"

// Menggunakan tipe dari context untuk konsistensi
type DatasetVariable = ContextDatasetVariable;

type Dataset = {
  id?: string
  name: string
  description: string
  category: string
  source: string
  variables: DatasetVariable[]
  content: Record<string, any>[]
}

export function DatasetUploader() {
  const [activeTab, setActiveTab] = useState("upload")
  const [file, setFile] = useState<File | null>(null)
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const { addDataset } = useDatasets()
  const router = useRouter()

  // Mendapatkan dimensi dari dataset untuk pemilihan variabel grup

  const handleFileUpload = async (uploadedFile: File, parsedData: any) => {
    setFile(uploadedFile)
    setIsLoading(true)

    try {
      // Process the parsed data
      const { headers, data } = parsedData

      // Create variables from headers
      const variables: DatasetVariable[] = headers.map((header: string) => {
        // Try to determine if it's a measure or dimension
        let type: "dimension" | "measure" = "dimension"
        let dataType: "string" | "number" | "date" = "string"

        // Check the first few rows to determine type
        const sampleSize = Math.min(5, data.length)
        let numericCount = 0
        let dateCount = 0

        for (let i = 0; i < sampleSize; i++) {
          const value = data[i][header]

          // Check if it's a number
          if (typeof value === "number") {
            numericCount++
          }

          // Check if it might be a date (simple check)
          if (
            typeof value === "string" &&
            (value.match(/^\d{4}-\d{2}-\d{2}/) || // YYYY-MM-DD
              value.match(/^\d{2}\/\d{2}\/\d{4}/) || // MM/DD/YYYY
              value.match(/^\d{1,2}\s+[a-zA-Z]+\s+\d{4}/))
          ) {
            // DD Month YYYY
            dateCount++
          }
        }

        // If most values are numeric, it's likely a measure
        if (numericCount >= sampleSize / 2) {
          type = "measure"
          dataType = "number"
        }
        // If most values look like dates, set dataType to date
        else if (dateCount >= sampleSize / 2) {
          dataType = "date"
        }

        // Special case for common dimension names
        const dimensionKeywords = [
          "id",
          "name",
          "region",
          "province",
          "city",
          "district",
          "category",
          "type",
          "year",
          "month",
          "quarter",
          "provinsi",
          "kota",
          "kabupaten",
          "kecamatan",
          "tahun",
          "bulan",
          "kuartal",
        ]
        if (dimensionKeywords.some((keyword) => header.toLowerCase().includes(keyword))) {
          type = "dimension"

          // Year, month, quarter are likely dates
          if (
            ["year", "month", "quarter", "tahun", "bulan", "kuartal"].some((keyword) =>
              header.toLowerCase().includes(keyword),
            )
          ) {
            dataType = "date"
          }
        }

        // Special case for common measure names
        const measureKeywords = [
          "count",
          "total",
          "sum",
          "average",
          "avg",
          "mean",
          "median",
          "min",
          "max",
          "rate",
          "percentage",
          "amount",
          "value",
          "price",
          "cost",
          "revenue",
          "profit",
          "gdp",
          "population",
          "jumlah",
          "total",
          "rata-rata",
          "nilai",
          "harga",
          "biaya",
          "pendapatan",
          "keuntungan",
          "populasi",
        ]
        if (measureKeywords.some((keyword) => header.toLowerCase().includes(keyword))) {
          type = "measure"
          dataType = "number"
        }

        return {
          id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: header,
          type,
          dataType,
          selected: true,
        }
      })

      // Create dataset
      const newDataset: Dataset = {
        name: uploadedFile.name.split(".")[0],
        description: "",
        category: "",
        source: "",
        variables,
        content: data,
      }

      setDataset(newDataset)
      setActiveTab("preview")

      toast({
        title: "File berhasil diunggah",
        description: `${uploadedFile.name} telah diproses dengan ${data.length} baris dan ${headers.length} kolom.`,
      })
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        variant: "destructive",
        title: "Kesalahan memproses file",
        description: "Terjadi kesalahan saat memproses file Anda. Silakan periksa format dan coba lagi.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleVariableSelection = (variables: any[]) => {
    if (dataset) {
      // Pastikan semua variabel memiliki ID yang diperlukan
      const updatedVariables = variables.map(v => {
        if (!v.id) {
          return {
            ...v,
            id: `var_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          };
        }
        return v;
      });

      setDataset({
        ...dataset,
        variables: updatedVariables,
      });
    }
  }

  const handleDatasetFormSubmit = (formData: {
    name: string
    description: string
    category: string
    source: string
  }) => {
    if (dataset) {
      const updatedDataset = {
        ...dataset,
        ...formData,
      }
      setDataset(updatedDataset)
      setActiveTab("review")
    }
  }

  const handleSaveDataset = async () => {
    setIsLoading(true)

    try {
      if (dataset) {
        console.log('Mencoba menyimpan dataset:', {
          name: dataset.name,
          description: dataset.description,
          category: dataset.category,
          source: dataset.source,
          variables_length: dataset.variables?.length,
          content_length: dataset.content?.length
        });

        // Periksa apakah dataset valid sebelum menyimpan
        if (!dataset.name || !dataset.category || !dataset.source) {
          throw new Error('Data dataset tidak lengkap. Name, category, dan source diperlukan.');
        }

        if (!Array.isArray(dataset.content) || dataset.content.length === 0) {
          throw new Error('Data content harus berupa array dan tidak boleh kosong.');
        }

        if (!Array.isArray(dataset.variables) || dataset.variables.length === 0) {
          throw new Error('Data variables harus berupa array dan tidak boleh kosong.');
        }

        // Filter hanya variabel yang terpilih
        const selectedVariables = dataset.variables.filter(v => v.selected);

        // Add the dataset to our context - sekarang async dengan integrasi API
        const datasetId = await addDataset({
          name: dataset.name,
          description: dataset.description,
          category: dataset.category,
          source: dataset.source,
          variables: selectedVariables,
          content: dataset.content,
        })

        toast({
          title: "Dataset berhasil disimpan",
          description: `${dataset.name} telah ditambahkan ke database.`,
        })

        // Redirect to the dataset detail page after a short delay
        setTimeout(() => {
          router.push(`/data-explorer/${datasetId}`)
        }, 1500)
      }
    } catch (error: any) {
      console.error("Error saving dataset:", error)
      toast({
        variant: "destructive",
        title: "Kesalahan menyimpan dataset",
        description: error.message || "Terjadi kesalahan saat menyimpan dataset Anda. Silakan coba lagi.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const navigateToTab = (tab: string) => {
    setActiveTab(tab)
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" disabled={activeTab !== "upload"}>
            Unggah File
          </TabsTrigger>
          <TabsTrigger value="preview" disabled={!file || activeTab === "upload"}>
            Pratinjau Data
          </TabsTrigger>
          <TabsTrigger value="configure" disabled={!dataset || activeTab === "upload" || activeTab === "preview"}>
            Konfigurasi Dataset
          </TabsTrigger>
          <TabsTrigger value="review" disabled={!dataset || activeTab !== "review"}>
            Tinjau & Simpan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <Card className="p-6">
            <FileUploader onFileUpload={handleFileUpload} isLoading={isLoading} />
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="mt-6">
          {dataset && (
            <>
              <DatasetPreview dataset={dataset} />
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => navigateToTab("upload")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                <Button onClick={() => navigateToTab("configure")}>
                  Konfigurasi Variabel <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="configure" className="mt-6">
          {dataset && (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <VariableSelector variables={dataset.variables} onVariablesChange={handleVariableSelection} />
                </div>
                <div>
                  <DatasetForm
                    initialData={{
                      name: dataset.name,
                      description: dataset.description || "",
                      category: dataset.category || "",
                      source: dataset.source || "",
                    }}
                    onSubmit={handleDatasetFormSubmit}
                  />
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => navigateToTab("preview")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Pratinjau
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          {dataset && (
            <>
              <div className="space-y-6">
                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Ringkasan Dataset</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nama</p>
                      <p className="text-base">{dataset.name}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Kategori</p>
                      <p className="text-base">{dataset.category}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Sumber</p>
                      <p className="text-base">{dataset.source}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Variabel</p>
                      <p className="text-base">
                        {dataset.variables.filter((v) => v.selected).length} dipilih dari {dataset.variables.length}{" "}
                        total
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Baris</p>
                      <p className="text-base">{dataset.content.length}</p>
                    </div>
                  </div>

                  {dataset.description && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-muted-foreground">Deskripsi</p>
                      <p className="text-base">{dataset.description}</p>
                    </div>
                  )}
                </Card>

                <Card className="p-6">
                  <h3 className="text-lg font-medium mb-4">Variabel Terpilih</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {dataset.variables
                      .filter((variable) => variable.selected)
                      .map((variable) => (
                        <div key={variable.id} className="border rounded-md p-3">
                          <div className="flex items-center justify-between">
                            <p className="font-medium">{variable.name}</p>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                variable.type === "dimension"
                                  ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                              }`}
                            >
                              {variable.type === "dimension" ? "Dimensi" : "Ukuran"}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Tipe Data:{" "}
                            {variable.dataType === "string"
                              ? "Teks"
                              : variable.dataType === "number"
                                ? "Angka"
                                : "Tanggal"}
                          </p>
                        </div>
                      ))}
                  </div>
                </Card>

                <DatasetPreview dataset={dataset} />
              </div>

              <div className="flex justify-between mt-6">
                <Button variant="outline" onClick={() => navigateToTab("configure")}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Konfigurasi
                </Button>
                <Button onClick={handleSaveDataset} disabled={isLoading}>
                  {isLoading ? (
                    "Menyimpan..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> Simpan Dataset
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
