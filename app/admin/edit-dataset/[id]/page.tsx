"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { DatasetForm } from "@/components/admin/dataset-form"
import { DatasetContentUploader } from "@/components/admin/dataset-content-uploader"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2, Database } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useDatasets } from "@/contexts/dataset-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EditDatasetPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { datasets, loading, updateDataset, getDataset } = useDatasets()

  const [dataset, setDataset] = useState<any>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [localLoading, setLocalLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [activeTab, setActiveTab] = useState("metadata")

  useEffect(() => {
    let isMounted = true;
    const timeoutId = setTimeout(() => {
      if (isMounted && localLoading) {
        setHasError(true);
        toast({
          title: "Waktu pengambilan data habis",
          description: "Coba muat ulang halaman atau kembali ke halaman admin.",
          variant: "destructive"
        });
      }
    }, 15000); // 15 detik timeout

    const fetchDataset = async () => {
      if (!params?.id) return;

      try {
        setLocalLoading(true);

        // Coba cari di daftar dataset yang sudah dimuat
        const foundDataset = datasets.find(d => d.id === params.id);

        if (foundDataset) {
          if (isMounted) setDataset(foundDataset);
        } else {
          // Jika tidak ditemukan di state, coba ambil langsung dari API
          try {
            const fetchedDataset = await getDataset(params.id as string);
            if (isMounted && fetchedDataset) {
              setDataset(fetchedDataset);
            } else if (isMounted) {
              throw new Error("Dataset tidak ditemukan");
            }
          } catch (error) {
            if (isMounted) {
              toast({
                title: "Dataset tidak ditemukan",
                description: "Dataset dengan ID tersebut tidak dapat ditemukan.",
                variant: "destructive"
              });
              router.push("/admin");
            }
          }
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching dataset:", error);
          setHasError(true);
          toast({
            title: "Gagal memuat dataset",
            description: "Terjadi kesalahan saat mengambil data dataset.",
            variant: "destructive"
          });
        }
      } finally {
        if (isMounted) setLocalLoading(false);
      }
    };

    fetchDataset();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [params, datasets, router, toast, getDataset]);

  const handleSubmit = async (formData: any) => {
    if (!dataset) return

    try {
      setIsSubmitting(true)

      // Perbarui hanya metadata dataset (nama, kategori, deskripsi, dll.)
      await updateDataset(dataset.id, {
        name: formData.name,
        description: formData.description,
        category: formData.category,
        source: formData.source
      })

      toast({
        title: "Dataset berhasil diperbarui",
        description: "Perubahan pada metadata dataset telah disimpan."
      })

      // Segarkan data dataset
      const refreshedDataset = await getDataset(dataset.id);
      if (refreshedDataset) {
        setDataset(refreshedDataset);
      }
    } catch (error) {
      console.error("Error updating dataset:", error)
      toast({
        title: "Gagal memperbarui dataset",
        description: "Terjadi kesalahan saat menyimpan perubahan.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleContentReplace = async (newContent: Record<string, any>[], headers: string[]) => {
    if (!dataset) return;

    try {
      setIsSubmitting(true);

      // Memeriksa apakah kolom-kolom baru cocok dengan variabel yang ada
      const existingVarNames = dataset.variables.map((v: any) => v.name);
      const missingColumns = existingVarNames.filter((name: string) => !headers.includes(name));

      if (missingColumns.length > 0) {
        // Ada beberapa kolom yang diperlukan tetapi tidak ada dalam CSV
        toast({
          title: "Kolom tidak cocok",
          description: `Dataset memerlukan kolom berikut yang tidak ada dalam CSV: ${missingColumns.join(", ")}`,
          variant: "destructive"
        });
        return;
      }

      // Perbarui konten dataset
      await updateDataset(dataset.id, {
        content: newContent
      });

      toast({
        title: "Konten dataset berhasil diperbarui",
        description: `${newContent.length} baris data telah ditambahkan ke dataset.`
      });

      // Segarkan data dataset
      const refreshedDataset = await getDataset(dataset.id);
      if (refreshedDataset) {
        setDataset(refreshedDataset);
      }
    } catch (error) {
      console.error("Error replacing dataset content:", error);
      toast({
        title: "Gagal memperbarui konten dataset",
        description: "Terjadi kesalahan saat mengganti konten dataset.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (localLoading && !hasError) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-6 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
            <h2 className="text-xl font-medium">Memuat dataset...</h2>
          </div>
        </main>
      </div>
    )
  }

  if (hasError || !dataset) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container mx-auto py-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-xl font-medium mb-2">Dataset tidak ditemukan</h2>
            <p className="text-muted-foreground mb-4">Dataset yang Anda cari tidak dapat ditemukan atau terjadi kesalahan saat memuat data.</p>
            <Button onClick={() => router.push("/admin")}>
              Kembali ke halaman admin
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container mx-auto py-6">
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => router.push("/admin")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Edit Dataset</h1>
          <p className="text-muted-foreground mt-2">
            Perbarui informasi dan konten dataset yang ada.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="metadata">Metadata</TabsTrigger>
            <TabsTrigger value="content">Konten Dataset</TabsTrigger>
          </TabsList>

          <TabsContent value="metadata" className="space-y-6">
            <DatasetForm
              initialData={{
                name: dataset.name || "",
                description: dataset.description || "",
                category: dataset.category || "",
                source: dataset.source || ""
              }}
              onSubmit={handleSubmit}
            />
          </TabsContent>

          <TabsContent value="content" className="space-y-6">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Database className="h-5 w-5 mr-2" />
                  Konten Dataset
                </CardTitle>
                <CardDescription>
                  Unggah file CSV baru untuk mengganti konten dataset ini.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Jumlah Baris</p>
                      <p className="text-base">{dataset.content?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Jumlah Variabel</p>
                      <p className="text-base">{dataset.variables?.length || 0}</p>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <div className="mb-4">
                      <h3 className="text-lg font-medium">Ganti Konten Dataset</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Unggah file CSV baru untuk mengganti konten dataset ini. Struktur CSV harus
                        sesuai dengan struktur dataset yang ada.
                      </p>
                    </div>

                    <DatasetContentUploader
                      onContentReplace={handleContentReplace}
                      isLoading={isSubmitting}
                      datasetName={dataset.name}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preview data in table format */}
            <Card>
              <CardHeader>
                <CardTitle>Pratinjau Data</CardTitle>
                <CardDescription>
                  Menampilkan {Math.min(5, dataset.content?.length || 0)} baris pertama dari dataset
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {dataset.variables &&
                          dataset.variables
                            .filter((v: any) => v.selected !== false)
                            .slice(0, 10)
                            .map((variable: any, index: number) => (
                              <th
                                key={index}
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {variable.name}
                              </th>
                            ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {dataset.content &&
                        dataset.content.slice(0, 5).map((row: any, rowIndex: number) => (
                          <tr key={rowIndex}>
                            {dataset.variables &&
                              dataset.variables
                                .filter((v: any) => v.selected !== false)
                                .slice(0, 10)
                                .map((variable: any, colIndex: number) => (
                                  <td
                                    key={colIndex}
                                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                  >
                                    {row[variable.name]?.toString()}
                                  </td>
                                ))}
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
                {dataset.content && dataset.content.length > 5 && (
                  <p className="text-xs text-muted-foreground mt-2 text-right">
                    ... dan {dataset.content.length - 5} baris lainnya
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {isSubmitting && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg flex items-center">
              <Loader2 className="h-6 w-6 animate-spin mr-2 text-primary" />
              <p>Memproses...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
