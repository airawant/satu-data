"use client"

import { useState } from "react"
import { useDatasets } from "@/contexts/dataset-context"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, SlidersHorizontal, Eye, Trash2, Edit, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import Link from "next/link"
import { format, isValid } from "date-fns"
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

// Helper untuk format tanggal yang aman
const formatSafeDate = (dateString: string | undefined | null, formatStr: string = "MMM d, yyyy"): string => {
  if (!dateString) return "Not available";

  try {
    const date = new Date(dateString);
    if (!isValid(date)) return "Invalid date";
    return format(date, formatStr);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return "Invalid date";
  }
};

export function DatasetList() {
  const { datasets, deleteDataset, clearAllDatasets, loading } = useDatasets()
  const { user } = useAuth()
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const { toast } = useToast()

  // Cek apakah pengguna terautentikasi (admin)
  const isAuthenticated = !!user

  // Filter datasets based on search term and filters
  const filteredDatasets = datasets.filter((dataset) => {
    const matchesSearch =
      dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (dataset.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false)

    const matchesCategory = categoryFilter === "all" || dataset.category === categoryFilter

    return matchesSearch && matchesCategory
  })

  // Get unique categories for filter
  const categories = ["all", ...new Set(datasets.map((dataset) => dataset.category).filter(Boolean))]

  const handleDeleteDataset = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete the dataset "${name}"?`)) {
      deleteDataset(id)
      toast({
        title: "Dataset deleted",
        description: `The dataset "${name}" has been deleted.`,
      })
    }
  }

  const handleClearAllDatasets = () => {
    clearAllDatasets()
    toast({
      title: "All datasets cleared",
      description: "All datasets have been removed from the system.",
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading datasets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Available Datasets</CardTitle>
              <CardDescription>Browse, filter, and analyze available datasets from various categories</CardDescription>
            </div>
            {isAuthenticated && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" /> Clear All Datasets
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action will permanently delete all datasets from the system. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClearAllDatasets}>Yes, delete all datasets</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search datasets..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category === "all" ? "All Categories" : category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>

              <Button variant="outline" size="icon">
                <SlidersHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Variables</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDatasets.length > 0 ? (
                  filteredDatasets.map((dataset) => (
                    <TableRow key={dataset.id}>
                      <TableCell className="font-medium">
                        <div>
                          {dataset.name}
                          {dataset.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                              {dataset.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {dataset.category ?
                            dataset.category.charAt(0).toUpperCase() + dataset.category.slice(1) :
                            'Uncategorized'}
                        </Badge>
                      </TableCell>
                      <TableCell>{dataset.source || 'Unknown'}</TableCell>
                      <TableCell>
                        <div className="flex space-x-1">
                          <Badge variant="secondary" className="text-xs">
                            {(dataset.variables || []).filter((v) => v.selected && v.type === "dimension").length} Dimensions
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {(dataset.variables || []).filter((v) => v.selected && v.type === "measure").length} Measures
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {formatSafeDate(dataset.updated_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button variant="ghost" size="icon" asChild>
                            <Link href={`/data-explorer/${dataset.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>

                          {isAuthenticated ? (
                            <>
                              <Button variant="ghost" size="icon" asChild>
                                <Link href={`/admin/edit-dataset/${dataset.id}`}>
                                  <Edit className="h-4 w-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteDataset(dataset.id, dataset.name)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Login untuk mengedit dataset"
                              onClick={() => {
                                toast({
                                  title: "Login diperlukan",
                                  description: "Silakan login terlebih dahulu untuk mengedit dataset",
                                })
                              }}
                            >
                              <Edit className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {datasets.length === 0 ? (
                        <div className="flex flex-col items-center">
                          <AlertTriangle className="h-8 w-8 text-muted-foreground mb-2" />
                          <p>No datasets available. Upload a dataset to get started.</p>
                          {isAuthenticated && (
                            <Link href="/admin/upload-dataset" className="mt-4">
                              <Button>Upload Dataset</Button>
                            </Link>
                          )}
                        </div>
                      ) : (
                        <p>No datasets found matching your search criteria</p>
                      )}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing {filteredDatasets.length} of {datasets.length} datasets
            </p>
            {isAuthenticated && (
              <Link href="/admin/upload-dataset">
                <Button>Upload New Dataset</Button>
              </Link>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
