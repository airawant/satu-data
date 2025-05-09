"use client"

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Field = {
  id: string
  name: string
  type: "dimension" | "measure"
  dataType: "string" | "number" | "date"
}

interface PieChartComponentProps {
  data: Record<string, any>[]
  nameKey: string
  dataKey: string
  fields: Field[]
}

const COLORS = ["#E53E3E", "#38B2F8", "#805AD5", "#DD6B20", "#38A169", "#D69E2E", "#3182CE", "#D53F8C"]

export function PieChartComponent({ data, nameKey, dataKey, fields }: PieChartComponentProps) {
  const nameKeyField = fields.find((f) => f.id === nameKey)
  const dataKeyField = fields.find((f) => f.id === dataKey)

  return (
    <ChartContainer
      config={{
        [dataKey]: {
          label: dataKeyField?.name || dataKey,
          color: "hsl(var(--primary))",
        },
      }}
      className="h-[400px]"
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={150}
            fill="#8884d8"
            dataKey={dataKey}
            nameKey={nameKey}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
