"use client"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { useToast } from "@/components/ui/use-toast"
import { Search, Filter, Calendar, Tag, X, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { id } from "date-fns/locale"
import { Header } from "@/components/header"

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
  created_at: string
  published_at: string | null
}

interface Pagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export default function InfografisPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const [infografis, setInfografis] = useState<Infografis[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [allTags, setAllTags] = useState<string[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    pageSize: 12,
    total: 0,
    totalPages: 0
  })

  // Initialize from search params
  useEffect(() => {
    const page = searchParams.get("page")
    const category = searchParams.get("category")
    const tag = searchParams.get("tag")
    const search = searchParams.get("search")

    if (page) {
      setPagination(prev => ({ ...prev, page: parseInt(page) }))
    }

    if (category) {
      setSelectedCategory(category)
    }

    if (tag) {
      setSelectedTag(tag)
    }

    if (search) {
      setSearchTerm(search)
    }
  }, [searchParams])

  // Fetch infografis data
  useEffect(() => {
    fetchInfografis()
  }, [pagination.page, selectedCategory, selectedTag, searchTerm])

  // Fetch categories and tags
  useEffect(() => {
    fetchCategories()
    fetchTags()
  }, [])

  const fetchInfografis = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        pageSize: pagination.pageSize.toString(),
        publishedOnly: "true"
      })

      if (selectedCategory) {
        queryParams.append("category", selectedCategory)
      }

      if (selectedTag) {
        queryParams.append("tag", selectedTag)
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
          description: result.error || "Gagal memuat infografis",
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
        setCategories(result.data)
      }
    } catch (error) {
      console.error("Error fetching categories:", error)
    }
  }

  const fetchTags = async () => {
    try {
      const response = await fetch("/api/infografis/tags")
      const result = await response.json()

      if (response.ok && result.data) {
        setAllTags(result.data)
      }
    } catch (error) {
      console.error("Error fetching tags:", error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPagination({ ...pagination, page: 1 })
    updateSearchParams()
  }

  const handleCategoryClick = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null)
    } else {
      setSelectedCategory(category)
    }
    setPagination({ ...pagination, page: 1 })
  }

  const handleTagClick = (tag: string) => {
    if (selectedTag === tag) {
      setSelectedTag(null)
    } else {
      setSelectedTag(tag)
    }
    setPagination({ ...pagination, page: 1 })
  }

  const handlePageChange = (newPage: number) => {
    setPagination({ ...pagination, page: newPage })
    updateSearchParams(newPage)
  }

  const handleClearFilters = () => {
    setSelectedCategory(null)
    setSelectedTag(null)
    setSearchTerm("")
    setPagination({ ...pagination, page: 1 })
    updateSearchParams(1, null, null, "")
  }

  const updateSearchParams = (
    page = pagination.page,
    category = selectedCategory,
    tag = selectedTag,
    search = searchTerm
  ) => {
    const params = new URLSearchParams()

    if (page && page > 1) {
      params.set("page", page.toString())
    }

    if (category) {
      params.set("category", category)
    }

    if (tag) {
      params.set("tag", tag)
    }

    if (search) {
      params.set("search", search)
    }

    const query = params.toString()
    const url = query ? `/infografis?${query}` : "/infografis"
    router.push(url, { scroll: false })
  }

  const renderSkeletonCards = () => {
    return Array(pagination.pageSize).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="flex flex-col">
        <div className="relative aspect-[9/16] w-full bg-gray-200 rounded-t-md overflow-hidden">
          <Skeleton className="h-full w-full" />
        </div>
        <div className="p-4 space-y-3 border border-t-0 rounded-b-md">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex flex-wrap gap-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-12 rounded-full" />
          </div>
        </div>
      </div>
    ))
  }

  const renderPagination = () => {
    const { page, totalPages } = pagination

    if (totalPages <= 1) return null

    return (
      <div className="flex items-center justify-center space-x-2 mt-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(page - 1)}
          disabled={page === 1 || loading}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
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
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Infografis</h1>
          <p className="text-muted-foreground mt-1">
            Koleksi infografis visual dengan data terbaru
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar Filters */}
          <aside className="w-full md:w-64 space-y-6">
            <form onSubmit={handleSearch} className="flex items-center">
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

            {/* Categories */}
            <div>
              <h3 className="text-sm font-medium mb-3">Kategori</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <Badge
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleCategoryClick(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Popular Tags */}
            <div>
              <h3 className="text-sm font-medium mb-3">Tag Populer</h3>
              <div className="flex flex-wrap gap-2">
                {allTags.slice(0, 10).map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "secondary" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleTagClick(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Active Filters */}
            {(selectedCategory || selectedTag || searchTerm) && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium">Filter Aktif</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-8 text-xs"
                  >
                    Hapus Semua
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory && (
                    <Badge
                      variant="default"
                      className="flex items-center gap-1"
                    >
                      {selectedCategory}
                      <button onClick={() => handleCategoryClick(selectedCategory)} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {selectedTag && (
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {selectedTag}
                      <button onClick={() => handleTagClick(selectedTag)} className="ml-1">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                  {searchTerm && (
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      "{searchTerm}"
                      <button
                        onClick={() => {
                          setSearchTerm("")
                          updateSearchParams(pagination.page, selectedCategory, selectedTag, "")
                        }}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Result Count */}
            <div className="mb-4 text-sm text-muted-foreground">
              {!loading && (
                <p>
                  Menampilkan {infografis.length} dari {pagination.total} infografis
                  {selectedCategory && ` dalam kategori "${selectedCategory}"`}
                  {selectedTag && ` dengan tag "${selectedTag}"`}
                  {searchTerm && ` dengan kata kunci "${searchTerm}"`}
                </p>
              )}
            </div>

            {/* Infografis Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {loading ? (
                renderSkeletonCards()
              ) : infografis.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                  <div className="bg-muted rounded-full p-3 mb-4">
                    <Search className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">Tidak ada infografis ditemukan</h3>
                  <p className="text-muted-foreground max-w-md mb-4">
                    Tidak ada infografis yang sesuai dengan filter Anda. Coba kriteria pencarian yang berbeda atau hapus beberapa filter.
                  </p>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Hapus Semua Filter
                  </Button>
                </div>
              ) : (
                infografis.map((item) => (
                  <Card key={item.id} className="overflow-hidden flex flex-col h-full">
                    <div
                      className="relative aspect-[9/16] w-full bg-gray-100 cursor-pointer"
                      onClick={() => router.push(`/infografis/${item.id}`)}
                    >
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <h3
                        className="font-medium line-clamp-2 hover:text-primary cursor-pointer"
                        onClick={() => router.push(`/infografis/${item.id}`)}
                      >
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <div className="mt-auto pt-3 space-y-2">
                        <div className="flex flex-wrap gap-1">
                          {item.tags.slice(0, 3).map((tag, index) => (
                            <Badge
                              key={`${item.id}-tag-${index}`}
                              variant="outline"
                              className="text-xs cursor-pointer"
                              onClick={() => handleTagClick(tag)}
                            >
                              {tag}
                            </Badge>
                          ))}
                          {item.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{item.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {item.published_at ?
                              format(new Date(item.published_at), "dd MMM yyyy", { locale: id }) :
                              format(new Date(item.created_at), "dd MMM yyyy", { locale: id })}
                          </div>
                          <div
                            className="cursor-pointer hover:text-primary"
                            onClick={() => handleCategoryClick(item.category)}
                          >
                            {item.category}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {renderPagination()}
          </div>
        </div>
      </main>
    </div>
  )
}
