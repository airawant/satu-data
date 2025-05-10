"use client"

import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Field = {
  id: string
  name: string
  type: "dimension" | "measure"
  dataType: "string" | "number" | "date"
}

interface BarChartComponentProps {
  data: Record<string, any>[]
  xAxis: string
  yAxis: string
  fields: Field[]
}

export function BarChartComponent({ data, xAxis, yAxis, fields }: BarChartComponentProps) {
  const xAxisField = fields.find((f) => f.id === xAxis)
  const yAxisField = fields.find((f) => f.id === yAxis)

  return (
    <ChartContainer
      config={{
        [yAxis]: {
          label: yAxisField?.name || yAxis,
          color: "hsl(var(--primary))",
        },
      }}
      className="h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxis} label={{ value: xAxisField?.name || xAxis, position: "insideBottom", offset: -5 }} />
          <YAxis label={{ value: yAxisField?.name || yAxis, angle: -90, position: "insideLeft" }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar dataKey={yAxis} fill="var(--color-yAxis)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
