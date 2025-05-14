"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter } from "next/navigation"
import { AdminLayout } from "@/components/admin/layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import {
  Image as ImageIcon,
  Search,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Filter,
  Loader2
} from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"

interface Infografis {
  id: string
  title: string
  category: string
  description: string
  tags: string[]
  data_source: string
  image_url: string
  image_width: number
  image_height: number
  created_by: string
  created_at: string
  updated_at: string | null
  published: boolean
  published_at: string | null
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

// Komponen utama untuk konten halaman infografis
function InfografisPageContent() {
  const router = useRouter()
  const { toast } = useToast()

  const [infografis, setInfografis] = useState<Infografis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [categories, setCategories] = useState<string[]>([])
  const [publishedFilter, setPublishedFilter] = useState("all")
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0
  })
  const [selectedInfografis, setSelectedInfografis] = useState<Infografis | null>(null)
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Fetch infografis data
  useEffect(() => {
    fetchInfografis()
    fetchCategories()
  }, [pagination.page, selectedCategory, publishedFilter])

  const fetchInfografis = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
      })

      if (selectedCategory !== "all") {
        queryParams.append("category", selectedCategory)
      }

      if (publishedFilter !== "all") {
        queryParams.append("publishedOnly", publishedFilter === "published" ? "true" : "false")
      }

      if (searchTerm) {
        queryParams.append("search", searchTerm)
      }

      const response = await fetch(`/api/infografis?${queryParams.toString()}`)
      const result = await response.json()

      if (response.ok) {
        setInfografis(result.data)
        setPagination(result.pagination)
      } else {
        toast({
          title: "Error",
          description: result.error || "Gagal memuat data infografis",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error fetching infografis:", error)
      toast({
        title: "Error",
        description: "Terjadi masalah saat memuat data infografis",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/infografis/categories")
      const result = await response.json()

      if (response.ok && result.data) {
        setCategories(["all", ...result.data])
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    pagination.page = 1 // Reset to first page
    fetchInfografis()
  }

  const handlePageChange = (newPage: number) => {
    setPagination({
      ...pagination,
      page: newPage
    })
  }

  const handleDeleteInfografis = async () => {
    if (!selectedInfografis) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/infografis/${selectedInfografis.id}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: "Infografis telah berhasil dihapus",
        })
        fetchInfografis() // Refresh data
      } else {
        const result = await response.json()
        toast({
          title: "Error",
          description: result.error || "Gagal menghapus infografis",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting infografis:", error)
      toast({
        title: "Error",
        description: "Terjadi masalah saat menghapus infografis",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
      setOpenDeleteDialog(false)
      setSelectedInfografis(null)
    }
  }

  const handleUpdatePublishStatus = async (id: string, published: boolean) => {
    setIsUpdatingStatus(true)
    try {
      const response = await fetch(`/api/infografis/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ published }),
      })

      if (response.ok) {
        toast({
          title: "Berhasil",
          description: `Infografis telah ${published ? "dipublikasikan" : "diarsipkan"}`,
        })
        fetchInfografis() // Refresh data
      } else {
        const result = await response.json()
        toast({
          title: "Error",
          description: result.error || `Gagal ${published ? "mempublikasikan" : "mengarsipkan"} infografis`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating publish status:", error)
      toast({
        title: "Error",
        description: "Terjadi masalah saat mengubah status publikasi",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleEditInfografis = (id: string) => {
    router.push(`/admin/upload-infografis?edit=${id}`)
  }

  const renderSkeletonRows = () => {
    return Array(5).fill(0).map((_, index) => (
      <TableRow key={`skeleton-${index}`}>
        <TableCell>
          <Skeleton className="h-12 w-12 rounded" />
        </TableCell>
        <TableCell>
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-20" />
        </TableCell>
        <TableCell>
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </TableCell>
        <TableCell>
          <Skeleton className="h-4 w-24" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-8 w-8 rounded" />
        </TableCell>
      </TableRow>
    ))
  }

  const renderPagination = () => {
    const { page, totalPages } = pagination

    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-center space-x-2 mt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1 || loading}
        >
          Sebelumnya
        </Button>

        <div className="flex items-center">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum = page

            // Adjust page numbers based on current page
            if (page <= 3) {
              pageNum = i + 1
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = page - 2 + i
            }

            // Skip pages that are out of range
            if (pageNum < 1 || pageNum > totalPages) return null

            return (
              <Button
                key={`page-${pageNum}`}
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => handlePageChange(pageNum)}
                className="mx-1 h-8 w-8 p-0"
                disabled={loading}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page + 1)}
          disabled={page === totalPages || loading}
        >
          Selanjutnya
        </Button>
      </div>
    )
  }

  return (
    <AdminLayout
      title="Kelola Infografis"
      description="Kelola semua infografis yang telah diunggah"
    >
      <div className="container py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <Button
              onClick={() => router.push("/admin/upload-infografis")}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" />
              Upload Infografis Baru
            </Button>

            <div className="flex items-center gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat === "all" ? "Semua Kategori" : cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={publishedFilter} onValueChange={setPublishedFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="published">Dipublikasikan</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <form onSubmit={handleSearch} className="flex items-center w-full md:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari infografis..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-full"
              />
            </div>
            <Button type="submit" variant="ghost" size="sm" className="ml-2">
              <Filter className="h-4 w-4" />
            </Button>
          </form>
        </div>

        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead style={{ width: 80 }}>Gambar</TableHead>
                <TableHead>Judul</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead style={{ width: 60 }}>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                renderSkeletonRows()
              ) : infografis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-32">
                    <div className="flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="h-8 w-8 mb-2" />
                      <p>Tidak ada infografis yang ditemukan</p>
                      <Button
                        variant="link"
                        onClick={() => router.push("/admin/upload-infografis")}
                        className="mt-2"
                      >
                        Upload Infografis Baru
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                infografis.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="align-middle">
                      <div className="relative aspect-[9/16] h-16 w-9 bg-gray-100 rounded overflow-hidden">
                        <img
                          src={item.image_url}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                        <div className={`absolute top-0 right-0 w-2 h-2 rounded-full m-0.5 ${
                          item.published ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium line-clamp-1">{item.title}</div>
                      <div className="text-sm text-muted-foreground line-clamp-1">{item.description}</div>
                    </TableCell>
                    <TableCell>{item.category}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {item.tags.slice(0, 2).map((tag, index) => (
                          <Badge key={`${item.id}-tag-${index}`} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {item.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{item.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.created_at ? (
                        <div className="text-sm">
                          {format(new Date(item.created_at), "dd MMM yyyy", { locale: id })}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(item.image_url, "_blank")}>
                            <Eye className="mr-2 h-4 w-4" />
                            Lihat Gambar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditInfografis(item.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {item.published ? (
                            <DropdownMenuItem
                              onClick={() => handleUpdatePublishStatus(item.id, false)}
                              disabled={isUpdatingStatus}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Batalkan Publikasi
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleUpdatePublishStatus(item.id, true)}
                              disabled={isUpdatingStatus}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Publikasikan
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedInfografis(item)
                              setOpenDeleteDialog(true)
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {renderPagination()}
        </div>

        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="text-sm">
              <span className="font-medium">Total Infografis:</span> {pagination.total}
              <div className="flex gap-4 mt-2">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2" />
                  <span>Dipublikasikan</span>
                </div>
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-gray-400 mr-2" />
                  <span>Draft</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Infografis</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus infografis ini? Tindakan ini tidak dapat dibatalkan.
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="font-medium">{selectedInfografis?.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedInfografis?.description}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteInfografis()
              }}
              disabled={isDeleting}
              className="bg-red-500 hover:bg-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  )
}

// Wrapper dengan Suspense boundary untuk mengatasi hydration error
export default function InfografisPage() {
  return (
    <Suspense fallback={
      <AdminLayout
        title="Kelola Infografis"
        description="Kelola semua infografis yang telah diunggah"
      >
        <div className="container py-6">
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
            <p className="text-sm text-muted-foreground ml-3">Memuat data infografis...</p>
          </div>
        </div>
      </AdminLayout>
    }>
      <InfografisPageContent />
    </Suspense>
  )
}
