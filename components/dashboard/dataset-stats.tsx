"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

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
]

export function DatasetStats() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dataset Statistics</CardTitle>
        <CardDescription>Overview of available datasets and their statistics.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Records</TableHead>
              <TableHead>Last Updated</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datasets.map((dataset) => (
              <TableRow key={dataset.id}>
                <TableCell className="font-medium">{dataset.name}</TableCell>
                <TableCell>{dataset.category}</TableCell>
                <TableCell className="text-right">{dataset.records.toLocaleString()}</TableCell>
                <TableCell>{new Date(dataset.lastUpdated).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={dataset.status === "Active" ? "default" : "secondary"}>{dataset.status}</Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
