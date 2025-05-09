"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Header } from "@/components/header"
import { useDatasets, type Dataset } from "@/contexts/dataset-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Download, BarChart3, TableProperties } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"

// Fungsi untuk memastikan backward compatibility
const normalizeDatasetProperties = (dataset: Dataset): Dataset => {
  return {
    ...dataset,
    // Pastikan content ada (gunakan data jika content tidak ada)
    content: dataset.content || (dataset as any).data || [],
    // Pastikan updated_at ada (gunakan updatedAt jika updated_at tidak ada)
    updated_at: dataset.updated_at || (dataset as any).updatedAt || new Date().toISOString()
  };
};

export default function DatasetDetailPage() {
  const { id } = useParams()
  const { getDataset, loading } = useDatasets()
  const [dataset, setDataset] = useState<Dataset | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (!loading && id) {
      const fetchDataset = async () => {
        try {
          const foundDataset = await getDataset(id as string);
          if (foundDataset) {
            // Normalize data structure untuk backward compatibility
            const normalizedDataset = normalizeDatasetProperties(foundDataset);
            setDataset(normalizedDataset);
          } else {
            // Dataset not found, redirect to data explorer
            router.push("/data-explorer");
          }
        } catch (error) {
          console.error("Error fetching dataset:", error);
          router.push("/data-explorer");
        }
      };

      fetchDataset();
    }
  }, [id, loading, getDataset, router]);

  if (loading || !dataset) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 container py-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading dataset...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-6">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/data-explorer">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Datasets
              </Link>
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{dataset.name}</h1>
              {dataset.description && <p className="text-muted-foreground mt-1">{dataset.description}</p>}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={`/charts?dataset=${dataset.id}`}>
                  <BarChart3 className="h-4 w-4 mr-2" /> Create Chart
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={`/query-builder?dataset=${dataset.id}`}>
                  <TableProperties className="h-4 w-4 mr-2" /> Query Builder
                </Link>
              </Button>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" /> Download
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Category</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline">
                  {dataset.category ?
                    dataset.category.charAt(0).toUpperCase() + dataset.category.slice(1) :
                    'Uncategorized'}
                </Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Source</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{dataset.source || 'Unknown'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Last Updated</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{dataset.updated_at ? format(new Date(dataset.updated_at), "MMMM d, yyyy") : 'Not available'}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="data">
            <TabsList>
              <TabsTrigger value="data">Data Preview</TabsTrigger>
              <TabsTrigger value="variables">Variables</TabsTrigger>
            </TabsList>
            <TabsContent value="data" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Data Preview</CardTitle>
                  <CardDescription>Showing first 10 rows of {dataset.content?.length || 0} total rows</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {(dataset.variables || [])
                            .filter((variable) => variable.selected)
                            .map((variable) => (
                              <TableHead key={variable.id}>{variable.name}</TableHead>
                            ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {(dataset.content || []).slice(0, 10).map((row, index) => (
                          <TableRow key={index}>
                            {(dataset.variables || [])
                              .filter((variable) => variable.selected)
                              .map((variable) => (
                                <TableCell key={variable.id}>{row[variable.name]?.toString() || ''}</TableCell>
                              ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="variables" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Available Variables</CardTitle>
                  <CardDescription>
                    {(dataset.variables || []).filter((v) => v.selected).length} variables available for analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {(dataset.variables || [])
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
                              {variable.type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Data Type: {variable.dataType}</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}
