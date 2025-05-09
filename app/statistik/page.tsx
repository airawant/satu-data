"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useSavedItems, type SavedItem } from "@/contexts/saved-items-context"
import { BarChart3, Table, Search, Trash2, Calendar, Database, Clock } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ChartDisplay } from "@/components/charts/chart-display"
import { useDatasets } from "@/contexts/dataset-context"

export default function StatistikPage() {
  const { savedItems, deleteSavedItem } = useSavedItems()
  const { datasets } = useDatasets()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedItem, setSelectedItem] = useState<SavedItem | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Filter items based on search term and active tab
  const filteredItems = savedItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.datasetName.toLowerCase().includes(searchTerm.toLowerCase())

    if (activeTab === "all") return matchesSearch
    return item.type === activeTab && matchesSearch
  })

  // Sort items by creation date (newest first)
  const sortedItems = [...filteredItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())

  const handleItemClick = (item: SavedItem) => {
    setSelectedItem(item)
  }

  const handleDeleteItem = (id: string) => {
    deleteSavedItem(id)

    if (selectedItem && selectedItem.id === id) {
      setSelectedItem(null)
    }

    toast({
      title: "Item dihapus",
      description: "Item telah berhasil dihapus dari daftar statistik Anda.",
    })
  }

  const handleEditItem = (item: SavedItem) => {
    if (item.type === "graph") {
      // Navigate to chart builder with the saved configuration
      router.push(`/charts?edit=${item.id}`)
    } else {
      // Navigate to table builder with the saved configuration
      router.push(`/query-builder?edit=${item.id}`)
    }
  }

  const renderItemIcon = (type: string) => {
    if (type === "graph") {
      return <BarChart3 className="h-5 w-5 text-primary" />
    } else {
      return <Table className="h-5 w-5 text-primary" />
    }
  }

  const renderDetailView = () => {
    if (!selectedItem) {
      return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <BarChart3 className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mb-2 text-lg font-medium">Tidak ada item yang dipilih</h3>
            <p className="text-muted-foreground">Pilih item dari daftar di sebelah kiri untuk melihat detailnya.</p>
          </div>
        </div>
      )
    }

    if (selectedItem.type === "graph") {
      const config = selectedItem.configuration
      return (
        <div className="h-full overflow-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">{selectedItem.title}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEditItem(selectedItem)}>
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1 h-4 w-4" />
                    Hapus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Grafik</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus grafik ini? Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteItem(selectedItem.id)}>Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {selectedItem.description && <p className="mb-4 text-muted-foreground">{selectedItem.description}</p>}

          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {format(selectedItem.createdAt, "dd MMMM yyyy", { locale: id })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{selectedItem.datasetName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {format(selectedItem.createdAt, "HH:mm", { locale: id })}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="rounded-lg border p-4">
            <ChartDisplay
              data={config.chartData.data}
              chartType={config.chartType}
              xAxisField={config.chartData.xAxisName}
              yAxisFields={config.chartData.yAxisNames}
              xAxisLabel={config.xAxisVariables.join(", ")}
              yAxisLabel={config.yAxisVariables.length > 0 ? config.yAxisVariables.join(", ") : "Jumlah"}
              groupName={config.chartData.groupName}
              groupValues={config.chartData.groupValues}
              labelVarName={config.chartData.labelName}
            />
          </div>
        </div>
      )
    } else {
      // Table view
      const config = selectedItem.configuration
      return (
        <div className="h-full overflow-auto">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold">{selectedItem.title}</h2>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handleEditItem(selectedItem)}>
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="mr-1 h-4 w-4" />
                    Hapus
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Tabel</AlertDialogTitle>
                    <AlertDialogDescription>
                      Apakah Anda yakin ingin menghapus tabel ini? Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction onClick={() => handleDeleteItem(selectedItem.id)}>Hapus</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          {selectedItem.description && <p className="mb-4 text-muted-foreground">{selectedItem.description}</p>}

          <div className="mb-4 grid grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {format(selectedItem.createdAt, "dd MMMM yyyy", { locale: id })}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{selectedItem.datasetName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {format(selectedItem.createdAt, "HH:mm", { locale: id })}
              </span>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="rounded-lg border">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {/* Render table headers based on configuration */}
                    {config.rowTitles.map((rowTitle: string, index: number) => (
                      <th
                        key={`header-${index}`}
                        className="border bg-blue-900 p-2 text-left text-sm font-medium text-white"
                      >
                        {rowTitle}
                      </th>
                    ))}

                    {/* Render year headers */}
                    {config.years.map((year: string) => (
                      <th
                        key={`year-${year}`}
                        colSpan={config.characteristics.length}
                        className="border bg-blue-900 p-2 text-center text-sm font-medium text-white"
                      >
                        {year}
                      </th>
                    ))}
                  </tr>
                  <tr>
                    {/* Empty cells for row titles */}
                    {config.rowTitles.map((_: string, index: number) => (
                      <th
                        key={`subheader-${index}`}
                        className="border bg-blue-900 p-2 text-left text-sm font-medium text-white"
                      >
                        {index === 0 ? "Tahun" : ""}
                      </th>
                    ))}

                    {/* Render characteristic headers for each year */}
                    {config.years.map((year: string) =>
                      config.characteristics.map((characteristic: string, charIndex: number) => (
                        <th
                          key={`char-${year}-${charIndex}`}
                          className="border bg-blue-800 p-2 text-center text-sm font-medium text-white"
                        >
                          {characteristic}
                        </th>
                      )),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {config.tableData.map((row: any, rowIndex: number) => (
                    <tr key={`row-${rowIndex}`} className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      {/* Render row title cells */}
                      {config.rowTitles.map((title: string, titleIndex: number) => (
                        <td key={`cell-${rowIndex}-${titleIndex}`} className="border p-2 text-sm font-medium">
                          {row[title]}
                        </td>
                      ))}

                      {/* Render data cells */}
                      {config.years.map((year: string) =>
                        config.characteristics.map((characteristic: string, charIndex: number) => {
                          const key = `${year}_${characteristic}`
                          return (
                            <td key={`data-${rowIndex}-${year}-${charIndex}`} className="border p-2 text-right text-sm">
                              {row[key]?.toLocaleString() || "0.00"}
                            </td>
                          )
                        }),
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )
    }
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Statistik Saya</h1>
        <p className="text-muted-foreground">Kelola grafik dan tabel dinamis yang telah Anda simpan.</p>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all">Semua</TabsTrigger>
            <TabsTrigger value="graph">Grafik</TabsTrigger>
            <TabsTrigger value="table">Tabel</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative ml-4 w-64">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari statistik..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <div className="h-[calc(100vh-220px)] overflow-y-auto rounded-lg border">
            {sortedItems.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-6 text-center">
                <div className="mb-4 rounded-full bg-muted p-3">
                  <BarChart3 className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="mb-2 text-lg font-medium">Tidak ada statistik</h3>
                <p className="mb-4 text-sm text-muted-foreground">
                  Anda belum menyimpan grafik atau tabel apa pun. Buat dan simpan grafik atau tabel untuk melihatnya di
                  sini.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => router.push("/charts")}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Buat Grafik
                  </Button>
                  <Button variant="outline" onClick={() => router.push("/query-builder")}>
                    <Table className="mr-2 h-4 w-4" />
                    Buat Tabel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y">
                {sortedItems.map((item) => (
                  <div
                    key={item.id}
                    className={`cursor-pointer p-4 transition-colors hover:bg-muted/50 ${
                      selectedItem?.id === item.id ? "bg-muted" : ""
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {renderItemIcon(item.type)}
                        <h3 className="font-medium">{item.title}</h3>
                      </div>
                      <Badge variant={item.type === "graph" ? "default" : "secondary"}>
                        {item.type === "graph" ? "Grafik" : "Tabel"}
                      </Badge>
                    </div>
                    {item.description && (
                      <p className="mb-2 line-clamp-2 text-sm text-muted-foreground">{item.description}</p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{format(item.createdAt, "dd MMM yyyy", { locale: id })}</span>
                      <span>{item.datasetName}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-[calc(100vh-220px)]">
            <CardContent className="p-6">{renderDetailView()}</CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
