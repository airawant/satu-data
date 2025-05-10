"use client"

import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Field = {
  id: string
  name: string
  type: "dimension" | "measure"
  dataType: "string" | "number" | "date"
}

interface LineChartComponentProps {
  data: Record<string, any>[]
  xAxis: string
  yAxis: string
  fields: Field[]
}

export function LineChartComponent({ data, xAxis, yAxis, fields }: LineChartComponentProps) {
  const xAxisField = fields.find((f) => f.id === xAxis)
  const yAxisField = fields.find((f) => f.id === yAxis)

  return (
    <ChartContainer
      config={{
        [yAxis]: {
          label: yAxisField?.name || yAxis,
          color: "hsl(var(--secondary))",
        },
      }}
      className="h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xAxis} label={{ value: xAxisField?.name || xAxis, position: "insideBottom", offset: -5 }} />
          <YAxis label={{ value: yAxisField?.name || yAxis, angle: -90, position: "insideLeft" }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          {/* <Legend /> */}
          <Line type="monotone" dataKey={yAxis} stroke="var(--color-yAxis)" activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
