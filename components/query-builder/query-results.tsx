"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Download, FileDown, Share2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChartGenerator } from "@/components/charts/chart-generator"
import type { Dataset } from "@/contexts/dataset-context"

type Field = {
  id: string
  name: string
  type: "dimension" | "measure"
  dataType: "string" | "number" | "date"
}

interface QueryResultsProps {
  fields: Field[]
  dataset: Dataset
}

export function QueryResults({ fields, dataset }: QueryResultsProps) {
  const [currentPage, setCurrentPage] = React.useState(1)
  const rowsPerPage = 10

  // Filter data to only include selected fields
  const filteredData = React.useMemo(() => {
    // Normalize dataset - handle both 'data' (old) and 'content' (new) property names
    const dataArray = dataset.content || (dataset as any).data || [];

    return dataArray.map((row) => {
      const filteredRow: Record<string, any> = {}
      fields.forEach((field) => {
        filteredRow[field.name] = row[field.name]
      })
      return filteredRow
    })
  }, [dataset.content, fields])

  const totalPages = Math.ceil(filteredData.length / rowsPerPage)
  const startIndex = (currentPage - 1) * rowsPerPage
  const endIndex = Math.min(startIndex + rowsPerPage, filteredData.length)
  const currentData = filteredData.slice(startIndex, endIndex)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Query Results</CardTitle>
          <CardDescription>
            Showing {startIndex + 1}-{endIndex} of {filteredData.length} rows
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <FileDown className="h-4 w-4 mr-1" />
            Export PDF
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-1" />
            Share
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="table">
          <TabsList className="mb-4">
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="chart">Chart</TabsTrigger>
          </TabsList>

          <TabsContent value="table">
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {fields.map((field) => (
                      <TableHead key={field.id}>{field.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentData.map((row, index) => (
                    <TableRow key={index}>
                      {fields.map((field) => (
                        <TableCell key={field.id}>{row[field.name]?.toString()}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="chart">
            <ChartGenerator data={filteredData} fields={fields} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
