"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Download, Filter, SlidersHorizontal } from "lucide-react"

// Sample data
const datasets = [
  {
    id: 1,
    name: "Population Census 2020",
    category: "Demographics",
    records: 250000,
    lastUpdated: "2023-12-15",
    status: "Active",
  },
  {
    id: 2,
    name: "Economic Indicators",
    category: "Economy",
    records: 15000,
    lastUpdated: "2024-02-20",
    status: "Active",
  },
  {
    id: 3,
    name: "Healthcare Statistics",
    category: "Health",
    records: 45000,
    lastUpdated: "2024-01-10",
    status: "Active",
  },
  {
    id: 4,
    name: "Education Data",
    category: "Education",
    records: 32000,
    lastUpdated: "2023-11-05",
    status: "Archived",
  },
  {
    id: 5,
    name: "Transportation Metrics",
    category: "Infrastructure",
    records: 18500,
    lastUpdated: "2024-03-01",
    status: "Active",
  },
  {
    id: 6,
    name: "Agricultural Production",
    category: "Agriculture",
    records: 27300,
    lastUpdated: "2024-01-25",
    status: "Active",
  },
  {
    id: 7,
    name: "Energy Consumption",
    category: "Energy",
    records: 12800,
    lastUpdated: "2023-12-05",
    status: "Active",
  },
  {
    id: 8,
    name: "Tourism Statistics",
    category: "Tourism",
    records: 9500,
    lastUpdated: "2024-02-10",
    status: "Active",
  },
]

export function DataExplorer() {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")

  // Filter datasets based on search term and filters
  const filteredDatasets = datasets.filter((dataset) => {
    const matchesSearch =
      dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dataset.category.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === "all" || dataset.category === categoryFilter
    const matchesStatus = statusFilter === "all" || dataset.status === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  // Get unique categories for filter
  const categories = ["all", ...new Set(datasets.map((dataset) => dataset.category))]

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Explore Available Datasets</CardTitle>
          <CardDescription>Browse, filter, and analyze available datasets from various categories</CardDescription>
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
                      {category === "all" ? "All Categories" : category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Archived">Archived</SelectItem>
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
                  <TableHead className="text-right">Records</TableHead>
                  <TableHead>Last Updated</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDatasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell className="font-medium">{dataset.name}</TableCell>
                    <TableCell>{dataset.category}</TableCell>
                    <TableCell className="text-right">{dataset.records.toLocaleString()}</TableCell>
                    <TableCell>{new Date(dataset.lastUpdated).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={dataset.status === "Active" ? "default" : "secondary"}>{dataset.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Export
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredDatasets.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No datasets found matching your search criteria
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
