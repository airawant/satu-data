"use client"

import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { BarChartComponent } from "@/components/charts/bar-chart"
import { LineChartComponent } from "@/components/charts/line-chart"
import { PieChartComponent } from "@/components/charts/pie-chart"

type Field = {
  id: string
  name: string
  type: "dimension" | "measure"
  dataType: "string" | "number" | "date"
}

interface ChartGeneratorProps {
  data: Record<string, any>[]
  fields: Field[]
}

export function ChartGenerator({ data, fields }: ChartGeneratorProps) {
  const [chartType, setChartType] = React.useState("bar")
  const [xAxis, setXAxis] = React.useState<string | undefined>(fields.find((f) => f.type === "dimension")?.id)
  const [yAxis, setYAxis] = React.useState<string | undefined>(fields.find((f) => f.type === "measure")?.id)

  const dimensionFields = fields.filter((f) => f.type === "dimension")
  const measureFields = fields.filter((f) => f.type === "measure")

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="chart-type">Chart Type</Label>
          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger id="chart-type">
              <SelectValue placeholder="Select chart type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bar">Bar Chart</SelectItem>
              <SelectItem value="line">Line Chart</SelectItem>
              <SelectItem value="pie">Pie Chart</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="x-axis">X-Axis (Dimension)</Label>
          <Select value={xAxis} onValueChange={setXAxis}>
            <SelectTrigger id="x-axis">
              <SelectValue placeholder="Select dimension" />
            </SelectTrigger>
            <SelectContent>
              {dimensionFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="y-axis">Y-Axis (Measure)</Label>
          <Select value={yAxis} onValueChange={setYAxis}>
            <SelectTrigger id="y-axis">
              <SelectValue placeholder="Select measure" />
            </SelectTrigger>
            <SelectContent>
              {measureFields.map((field) => (
                <SelectItem key={field.id} value={field.id}>
                  {field.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          {chartType === "bar" && xAxis && yAxis && (
            <BarChartComponent data={data} xAxis={xAxis} yAxis={yAxis} fields={fields} />
          )}

          {chartType === "line" && xAxis && yAxis && (
            <LineChartComponent data={data} xAxis={xAxis} yAxis={yAxis} fields={fields} />
          )}

          {chartType === "pie" && xAxis && yAxis && (
            <PieChartComponent data={data} nameKey={xAxis} dataKey={yAxis} fields={fields} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
