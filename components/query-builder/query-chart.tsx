"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Download, Share2, BarChart3, LineChart, PieChart, AreaChart, BarChartHorizontal, Info } from "lucide-react"
import {
  BarChart,
  Bar,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart as RechartsAreaChart,
  Area,
} from "recharts"
import { Tooltip as UITooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type ChartProps = {
  data: any[]
  characteristics: string[]
  years: string[]
}

const COLORS = ["#E53E3E", "#38B2F8", "#805AD5", "#DD6B20", "#38A169", "#D69E2E", "#3182CE", "#D53F8C"]

// Definisi jenis grafik yang didukung
const chartTypes = [
  {
    id: "bar",
    name: "Grafik Batang",
    icon: BarChart3,
    description: "Membandingkan nilai antar kategori",
  },
  {
    id: "line",
    name: "Grafik Garis",
    icon: LineChart,
    description: "Menampilkan tren dari waktu ke waktu",
  },
  {
    id: "pie",
    name: "Grafik Lingkaran",
    icon: PieChart,
    description: "Menampilkan proporsi dari keseluruhan",
  },
  {
    id: "stacked-bar",
    name: "Grafik Batang Bertumpuk",
    icon: BarChart3,
    description: "Membandingkan bagian dari keseluruhan antar kategori",
  },
  {
    id: "area",
    name: "Grafik Area",
    icon: AreaChart,
    description: "Menampilkan total kumulatif dari waktu ke waktu",
  },
  {
    id: "horizontal-bar",
    name: "Grafik Batang Horizontal",
    icon: BarChartHorizontal,
    description: "Membandingkan nilai dengan label kategori yang panjang",
  },
]

export function QueryChart({ data, characteristics, years }: ChartProps) {
  const [chartType, setChartType] = useState<string>("bar")
  const [selectedCharacteristic, setSelectedCharacteristic] = useState<string>(characteristics[0] || "")
  const [selectedYear, setSelectedYear] = useState<string>(years[0] || "")

  // Prepare data for charts
  const chartData = useMemo(() => {
    if (!data.length || !selectedCharacteristic || !selectedYear) return []

    return data
      .map((item) => ({
        name: item.region,
        value: item[`${selectedCharacteristic}_${selectedYear}`],
      }))
      .filter((item) => item.name !== "INDONESIA") // Exclude total row for better visualization
  }, [data, selectedCharacteristic, selectedYear])

  // Prepare data for multi-year charts
  const multiYearChartData = useMemo(() => {
    if (!data.length || !selectedCharacteristic) return []

    return data
      .filter((item) => item.region !== "INDONESIA") // Exclude total row for better visualization
      .map((item) => {
        const dataPoint: any = {
          name: item.region,
        }

        // Add all years as separate fields
        years.forEach((year) => {
          dataPoint[year] = item[`${selectedCharacteristic}_${year}`]
        })

        return dataPoint
      })
  }, [data, selectedCharacteristic, years])

  // Prepare data for multi-characteristic charts
  const multiCharacteristicChartData = useMemo(() => {
    if (!data.length || !selectedYear) return []

    return data
      .filter((item) => item.region !== "INDONESIA") // Exclude total row for better visualization
      .map((item) => {
        const dataPoint: any = {
          name: item.region,
        }

        // Add all characteristics as separate fields
        characteristics.forEach((characteristic) => {
          dataPoint[characteristic] = item[`${characteristic}_${selectedYear}`]
        })

        return dataPoint
      })
  }, [data, characteristics, selectedYear])

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium">Visualisasi Data</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Download className="h-4 w-4" />
            <span>Unduh</span>
          </Button>
          <Button variant="outline" size="sm" className="flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            <span>Bagikan</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <Label htmlFor="chart-type">Jenis Grafik</Label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger id="chart-type">
                <SelectValue placeholder="Pilih jenis grafik" />
              </SelectTrigger>
              <SelectContent>
                {chartTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="flex items-center">
                    <div className="flex items-center">
                      <type.icon className="h-4 w-4 mr-2" />
                      <span>{type.name}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="mt-1">
              <TooltipProvider>
                <UITooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Info className="h-3 w-3 mr-1" />
                      <span>{chartTypes.find((t) => t.id === chartType)?.description}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs text-sm">
                      {chartType === "bar" &&
                        "Ideal untuk membandingkan nilai antar kategori. Gunakan ketika Anda ingin melihat perbedaan nilai dengan jelas."}
                      {chartType === "line" &&
                        "Ideal untuk menampilkan tren dari waktu ke waktu. Gunakan ketika Anda ingin melihat perubahan nilai seiring waktu."}
                      {chartType === "pie" &&
                        "Ideal untuk menampilkan proporsi dari keseluruhan. Gunakan ketika Anda ingin melihat bagian dari total."}
                      {chartType === "stacked-bar" &&
                        "Ideal untuk membandingkan bagian dari keseluruhan antar kategori. Gunakan ketika Anda ingin melihat komposisi nilai."}
                      {chartType === "area" &&
                        "Ideal untuk menampilkan total kumulatif dari waktu ke waktu. Gunakan ketika Anda ingin menekankan volume total."}
                      {chartType === "horizontal-bar" &&
                        "Ideal untuk membandingkan nilai dengan label kategori yang panjang. Gunakan ketika label kategori Anda panjang."}
                    </p>
                  </TooltipContent>
                </UITooltip>
              </TooltipProvider>
            </div>
          </div>

          <div>
            <Label htmlFor="characteristic">Karakteristik</Label>
            <Select
              value={selectedCharacteristic}
              onValueChange={setSelectedCharacteristic}
              disabled={characteristics.length === 0}
            >
              <SelectTrigger id="characteristic">
                <SelectValue placeholder="Pilih karakteristik" />
              </SelectTrigger>
              <SelectContent>
                {characteristics.map((characteristic) => (
                  <SelectItem key={characteristic} value={characteristic}>
                    {characteristic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="year">Tahun</Label>
            <Select value={selectedYear} onValueChange={setSelectedYear} disabled={years.length === 0}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Pilih tahun" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="h-[400px] w-full">
          {chartData.length > 0 ? (
            <>
              {chartType === "bar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    {/* <Legend /> */}
                    <Bar dataKey="value" name={`${selectedCharacteristic} (${selectedYear})`} fill="#E53E3E" />
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === "line" && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    {/* <Legend /> */}
                    <Line
                      type="monotone"
                      dataKey="value"
                      name={`${selectedCharacteristic} (${selectedYear})`}
                      stroke="#38B2F8"
                      strokeWidth={2}
                      activeDot={{ r: 8 }}
                    />
                  </RechartsLineChart>
                </ResponsiveContainer>
              )}

              {chartType === "pie" && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={150}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    {/* <Legend /> */}
                  </RechartsPieChart>
                </ResponsiveContainer>
              )}

              {chartType === "stacked-bar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={multiCharacteristicChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    {/* <Legend /> */}
                    {characteristics.map((characteristic, index) => (
                      <Bar
                        key={characteristic}
                        dataKey={characteristic}
                        name={`${characteristic} (${selectedYear})`}
                        stackId="a"
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              )}

              {chartType === "area" && (
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsAreaChart
                    data={multiYearChartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 20,
                      bottom: 60,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    {/* <Legend /> */}
                    {years.map((year, index) => (
                      <Area
                        key={year}
                        type="monotone"
                        dataKey={year}
                        name={`${selectedCharacteristic} (${year})`}
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.3}
                      />
                    ))}
                  </RechartsAreaChart>
                </ResponsiveContainer>
              )}

              {chartType === "horizontal-bar" && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={chartData}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 100,
                      bottom: 20,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip formatter={(value) => value.toLocaleString()} />
                    {/* <Legend /> */}
                    <Bar
                      dataKey="value"
                      name={`${selectedCharacteristic} (${selectedYear})`}
                      fill="#E53E3E"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500">Pilih karakteristik dan tahun untuk menampilkan grafik</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
