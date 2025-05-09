"use client"

import { useState, useEffect } from "react"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts"

type ChartDisplayProps = {
  data: any[]
  chartType: string
  xAxisField: string
  yAxisFields: string[]
  xAxisLabel: string
  yAxisLabel: string
  groupName?: string
  groupValues?: string[]
  labelVarName?: string
}

const COLORS = ["#E53E3E", "#38B2F8", "#805AD5", "#DD6B20", "#38A169", "#D69E2E", "#3182CE", "#D53F8C"]

export function ChartDisplay({
  data,
  chartType,
  xAxisField,
  yAxisFields,
  xAxisLabel,
  yAxisLabel,
  groupName,
  groupValues,
  labelVarName,
}: ChartDisplayProps) {
  const [isVisible, setIsVisible] = useState(false)

  // Animation effect when chart changes
  useEffect(() => {
    setIsVisible(false)
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [data, chartType, xAxisField, yAxisFields])

  if (!data.length || !yAxisFields.length) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Tidak ada data yang tersedia untuk visualisasi</p>
      </div>
    )
  }

  // Untuk grafik pie, kita hanya menggunakan field Y-axis pertama
  const pieChartData = data.map((item) => ({
    name: item[xAxisField],
    value: Number(yAxisFields[0] === "count" ? item["count"] : item[yAxisFields[0]] || 0),
  }))

  // Untuk grafik scatter, kita membutuhkan minimal 2 field Y-axis
  const scatterChartData = data.map((item) => ({
    name: item[xAxisField],
    x: Number(yAxisFields[0] === "count" ? item["count"] : item[yAxisFields[0]] || 0),
    y: Number(yAxisFields.length > 1 ? (yAxisFields[1] === "count" ? item["count"] : item[yAxisFields[1]]) : 0),
    z: yAxisFields.length > 2 ? Number(yAxisFields[2] === "count" ? item["count"] : item[yAxisFields[2]] || 10) : 10, // Dimensi ketiga opsional untuk ukuran bubble
  }))

  // Pastikan semua nilai numerik
  const formattedData = data.map((item) => {
    const newItem = { ...item }
    yAxisFields.forEach((field) => {
      newItem[field] = Number(field === "count" ? item["count"] : item[field] || 0)
    })
    return newItem
  })

  return (
    <div
      className="h-[500px] w-full transition-opacity duration-500 ease-in-out"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {chartType === "bar" && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisField}
              angle={-45}
              textAnchor="end"
              height={80}
              label={{ value: xAxisLabel, position: "insideBottom", offset: -40 }}
            />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }} />
            <Tooltip
              formatter={(value, name) => {
                // Handle grouped data
                if (name.includes("_")) {
                  const [baseName, groupValue] = name.split("_")
                  return [value.toLocaleString(), `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`]
                }
                // Handle regular data
                return [value.toLocaleString(), name === "count" ? "Jumlah Data" : name]
              }}
            />
            <Legend
              formatter={(value) => {
                if (value.includes("_")) {
                  const [baseName, groupValue] = value.split("_")
                  return `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`
                }
                return value === "count" ? "Jumlah Data" : value
              }}
            />
            {yAxisFields.map((field, index) => (
              <Bar
                key={field}
                dataKey={field}
                name={field}
                fill={COLORS[index % COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {chartType === "horizontal-bar" && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart layout="vertical" data={formattedData} margin={{ top: 20, right: 30, left: 100, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" label={{ value: yAxisLabel, position: "insideBottom", offset: -10 }} />
            <YAxis
              dataKey={xAxisField}
              type="category"
              width={80}
              label={{ value: xAxisLabel, angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              formatter={(value, name) => {
                // Handle grouped data
                if (name.includes("_")) {
                  const [baseName, groupValue] = name.split("_")
                  return [value.toLocaleString(), `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`]
                }
                // Handle regular data
                return [value.toLocaleString(), name === "count" ? "Jumlah Data" : name]
              }}
            />
            <Legend
              formatter={(value) => {
                if (value.includes("_")) {
                  const [baseName, groupValue] = value.split("_")
                  return `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`
                }
                return value === "count" ? "Jumlah Data" : value
              }}
            />
            {yAxisFields.map((field, index) => (
              <Bar
                key={field}
                dataKey={field}
                name={field}
                fill={COLORS[index % COLORS.length]}
                radius={[0, 4, 4, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {chartType === "line" && (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisField}
              angle={-45}
              textAnchor="end"
              height={80}
              label={{ value: xAxisLabel, position: "insideBottom", offset: -40 }}
            />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }} />
            <Tooltip
              formatter={(value, name) => {
                // Handle grouped data
                if (name.includes("_")) {
                  const [baseName, groupValue] = name.split("_")
                  return [value.toLocaleString(), `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`]
                }
                // Handle regular data
                return [value.toLocaleString(), name === "count" ? "Jumlah Data" : name]
              }}
            />
            <Legend
              formatter={(value) => {
                if (value.includes("_")) {
                  const [baseName, groupValue] = value.split("_")
                  return `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`
                }
                return value === "count" ? "Jumlah Data" : value
              }}
            />
            {yAxisFields.map((field, index) => (
              <Line
                key={field}
                type="monotone"
                dataKey={field}
                name={field}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                activeDot={{ r: 8 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}

      {chartType === "pie" && (
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieChartData}
              cx="50%"
              cy="50%"
              labelLine={true}
              outerRadius={150}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            >
              {pieChartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                // Handle grouped data
                if (name.includes("_")) {
                  const [baseName, groupValue] = name.split("_")
                  return [value.toLocaleString(), `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`]
                }
                // Handle regular data
                return [value.toLocaleString(), name === "count" ? "Jumlah Data" : name]
              }}
            />
            <Legend
              formatter={(value) => {
                if (value.includes("_")) {
                  const [baseName, groupValue] = value.split("_")
                  return `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`
                }
                return value === "count" ? "Jumlah Data" : value
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      )}

      {chartType === "stacked-bar" && (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisField}
              angle={-45}
              textAnchor="end"
              height={80}
              label={{ value: xAxisLabel, position: "insideBottom", offset: -40 }}
            />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }} />
            <Tooltip
              formatter={(value, name) => {
                // Handle grouped data
                if (name.includes("_")) {
                  const [baseName, groupValue] = name.split("_")
                  return [value.toLocaleString(), `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`]
                }
                // Handle regular data
                return [value.toLocaleString(), name === "count" ? "Jumlah Data" : name]
              }}
            />
            <Legend
              formatter={(value) => {
                if (value.includes("_")) {
                  const [baseName, groupValue] = value.split("_")
                  return `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`
                }
                return value === "count" ? "Jumlah Data" : value
              }}
            />
            {yAxisFields.map((field, index) => (
              <Bar key={field} dataKey={field} name={field} stackId="a" fill={COLORS[index % COLORS.length]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}

      {chartType === "area" && (
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey={xAxisField}
              angle={-45}
              textAnchor="end"
              height={80}
              label={{ value: xAxisLabel, position: "insideBottom", offset: -40 }}
            />
            <YAxis label={{ value: yAxisLabel, angle: -90, position: "insideLeft" }} />
            <Tooltip
              formatter={(value, name) => {
                // Handle grouped data
                if (name.includes("_")) {
                  const [baseName, groupValue] = name.split("_")
                  return [value.toLocaleString(), `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`]
                }
                // Handle regular data
                return [value.toLocaleString(), name === "count" ? "Jumlah Data" : name]
              }}
            />
            <Legend
              formatter={(value) => {
                if (value.includes("_")) {
                  const [baseName, groupValue] = value.split("_")
                  return `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`
                }
                return value === "count" ? "Jumlah Data" : value
              }}
            />
            {yAxisFields.map((field, index) => (
              <Area
                key={field}
                type="monotone"
                dataKey={field}
                name={field}
                stroke={COLORS[index % COLORS.length]}
                fill={COLORS[index % COLORS.length]}
                fillOpacity={0.3}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {chartType === "scatter" && yAxisFields.length >= 2 && (
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              name={yAxisFields[0]}
              label={{ value: yAxisFields[0], position: "insideBottom", offset: -10 }}
            />
            <YAxis
              dataKey="y"
              name={yAxisFields[1]}
              label={{ value: yAxisFields[1], angle: -90, position: "insideLeft" }}
            />
            {yAxisFields.length > 2 && <ZAxis dataKey="z" range={[50, 500]} name={yAxisFields[2]} />}
            <Tooltip
              formatter={(value) => value.toLocaleString()}
              cursor={{ strokeDasharray: "3 3" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-white p-2 border rounded shadow-sm">
                      <p className="font-medium">{payload[0].payload.name}</p>
                      <p>{`${yAxisFields[0]}: ${payload[0].value.toLocaleString()}`}</p>
                      <p>{`${yAxisFields[1]}: ${payload[1].value.toLocaleString()}`}</p>
                      {yAxisFields.length > 2 && <p>{`${yAxisFields[2]}: ${payload[0].payload.z.toLocaleString()}`}</p>}
                    </div>
                  )
                }
                return null
              }}
            />
            <Legend
              formatter={(value) => {
                if (value.includes("_")) {
                  const [baseName, groupValue] = value.split("_")
                  return `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`
                }
                return value === "count" ? "Jumlah Data" : value
              }}
            />
            <Scatter
              name={`${yAxisFields[0]} vs ${yAxisFields[1]}`}
              data={scatterChartData}
              fill={COLORS[0]}
              shape="circle"
            />
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
