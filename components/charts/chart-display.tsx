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
import { PieChart as PieChartIcon } from "lucide-react"

type ChartDisplayProps = {
  data: any[]
  chartType: string
  xAxisField: string
  yAxisFields: string[]
  xAxisLabel: string
  yAxisLabel: string
  groupName?: string
  groupValues?: string[]
  labelName?: string
}

const COLORS = ["#E53E3E", "#38B2F8", "#805AD5", "#DD6B20", "#38A169", "#D69E2E", "#3182CE", "#D53F8C"]

// CustomTooltip component to replace the default tooltip
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-md shadow-md">
        <p className="font-semibold mb-1 text-sm">{label || 'Tidak Diketahui'}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={`tooltip-item-${index}`} className="flex items-center">
              <div
                className="w-3 h-3 mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm">{entry.name === "count" ? "Jumlah Data" : entry.name}: </span>
              <span className="text-sm font-semibold ml-1">
                {typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value || 0}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

// Di bagian atas file, tambahkan tampilan untuk total data
const TotalDataInfo = ({ data, chartType, yAxisFields }: { data: any[]; chartType: string; yAxisFields: string[] }) => {
  // Hitung total data
  const getTotalData = () => {
    if (!data || data.length === 0) return { total: 0, totalItems: 0 };

    try {
      // Untuk pie chart, jumlahkan semua nilai
      if (chartType === "pie") {
        const total = data.reduce((total, item) => {
          return total + (item.value || 0);
        }, 0);
        return { total, totalItems: data.length };
      }

      // Untuk scatter chart
      if (chartType === "scatter") {
        const total = data.length; // Jumlah total titik data
        return { total: total, totalItems: total };
      }

      // Untuk chart lain, gunakan field Y pertama atau count
      const fieldToSum = yAxisFields[0] || "count";
      const total = data.reduce((total, item) => {
        return total + (Number(item[fieldToSum]) || 0);
      }, 0);

      return { total, totalItems: data.length };
    } catch (err) {
      console.error("Error calculating total:", err);
      return { total: 0, totalItems: 0 };
    }
  };

  const { total, totalItems } = getTotalData();

  return (
    <div className="text-center mt-4 text-sm text-muted-foreground">
      <div className="flex justify-center gap-6">
        <p>Total Data: <span className="font-semibold">{total.toLocaleString()}</span></p>
        <p>Jumlah Item: <span className="font-semibold">{totalItems.toLocaleString()}</span></p>
      </div>
    </div>
  );
};

// Tambahkan formatter label untuk pie chart
const getPieChartLabel = ({ name, value, percent }: { name: string; value: number; percent: number }) => {
  // Pastikan tampilan label tidak terlalu panjang
  let displayName = name;
  if (name.length > 15) {
    displayName = `${name.substring(0, 12)}...`;
  }

  // Format label berdasarkan panjang teks
  if (percent < 0.05) {
    return `${displayName}: ${(percent * 100).toFixed(0)}%`;
  }

  return `${displayName}: ${(percent * 100).toFixed(0)}% (${value.toLocaleString()})`;
};

// Tambahkan fungsi helper untuk pengurutan bulan bahasa Indonesia
const sortIndonesianMonths = (months: string[]): string[] => {
  const monthOrder: Record<string, number> = {
    'januari': 1,
    'februari': 2,
    'maret': 3,
    'april': 4,
    'mei': 5,
    'juni': 6,
    'juli': 7,
    'agustus': 8,
    'september': 9,
    'oktober': 10,
    'november': 11,
    'desember': 12
  };

  return [...months].sort((a, b) => {
    // Ubah ke lowercase untuk memastikan case-insensitive matching
    const aLower = a.toLowerCase();
    const bLower = b.toLowerCase();

    // Cek apakah keduanya adalah nama bulan
    const isAMonth = Object.keys(monthOrder).includes(aLower);
    const isBMonth = Object.keys(monthOrder).includes(bLower);

    if (isAMonth && isBMonth) {
      // Jika keduanya bulan, urutkan berdasarkan urutan bulan
      return monthOrder[aLower] - monthOrder[bLower];
    } else if (isAMonth) {
      // Jika hanya a yang bulan, a didahulukan
      return -1;
    } else if (isBMonth) {
      // Jika hanya b yang bulan, b didahulukan
      return 1;
    } else {
      // Jika keduanya bukan bulan, gunakan pengurutan alfabet biasa
      return aLower.localeCompare(bLower);
    }
  });
};

// Fungsi untuk memeriksa apakah array berisi nama bulan bahasa Indonesia
const containsIndonesianMonths = (items: string[]): boolean => {
  const indonesianMonths = ['januari', 'februari', 'maret', 'april', 'mei', 'juni',
                           'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];
  return items.some(item =>
    indonesianMonths.includes(item.toLowerCase())
  );
};

// Fungsi untuk memastikan data diurutkan dengan benar jika mengandung bulan
const sortDataWithIndonesianMonths = (data: any[], xAxisField: string): any[] => {
  if (!data || !Array.isArray(data) || data.length === 0) return data;

  // Ekstrak nilai X-axis untuk pengecekan
  const xValues = data.map(item => String(item[xAxisField] || ""));

  // Cek apakah nilai mengandung bulan bahasa Indonesia
  if (containsIndonesianMonths(xValues)) {
    // Buat map untuk menerjemahkan bulan ke angka untuk pengurutan
    const monthOrder: Record<string, number> = {
      'januari': 1, 'februari': 2, 'maret': 3, 'april': 4,
      'mei': 5, 'juni': 6, 'juli': 7, 'agustus': 8,
      'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
    };

    return [...data].sort((a, b) => {
      const aValue = String(a[xAxisField] || "").toLowerCase();
      const bValue = String(b[xAxisField] || "").toLowerCase();

      const isAMonth = Object.keys(monthOrder).includes(aValue);
      const isBMonth = Object.keys(monthOrder).includes(bValue);

      if (isAMonth && isBMonth) {
        return monthOrder[aValue] - monthOrder[bValue];
      }
      return 0; // Jika salah satu bukan bulan, pertahankan urutan
    });
  }

  return data; // Kembalikan data asli jika tidak mengandung bulan
};

export function ChartDisplay({
  data,
  chartType,
  xAxisField,
  yAxisFields,
  xAxisLabel,
  yAxisLabel,
  groupName,
  groupValues,
  labelName
}: ChartDisplayProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [hasError, setHasError] = useState(false)

  // Animation effect when chart changes
  useEffect(() => {
    setIsVisible(false)
    setHasError(false)
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 300)

    return () => clearTimeout(timer)
  }, [data, chartType, xAxisField, yAxisFields])

  // Log untuk debugging
  useEffect(() => {
    if (groupName && groupValues) {
      console.log(`Menampilkan grafik dengan pengelompokan berdasarkan ${groupName}:`, groupValues);
      console.log("Field pada Y axis:", yAxisFields);
    }
  }, [groupName, groupValues, yAxisFields]);

  // Validasi data
  if (!data || !Array.isArray(data) || data.length === 0 || !yAxisFields || !yAxisFields.length) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <div className="text-center">
        <p className="text-muted-foreground">Tidak ada data yang tersedia untuk visualisasi</p>
          <p className="text-xs text-muted-foreground mt-2">
            {(!data || !Array.isArray(data) || data.length === 0) ?
              "Dataset tidak memiliki data yang dapat divisualisasikan" :
              "Tidak ada variabel yang dipilih untuk sumbu Y"}
          </p>
        </div>
      </div>
    )
  }

  try {
    // Pastikan data dalam format yang benar untuk visualisasi
    const cleanData = data.map(item => {
      // Pastikan setiap item memiliki properti xAxisField
      const newItem = { ...item }

      // Jika nilai x-axis tidak valid, gunakan label yang jelas atau skip
      // Ubah penanganan untuk menghindari label "Tidak Diketahui" yang tidak informatif
      if (newItem[xAxisField] === undefined || newItem[xAxisField] === null || newItem[xAxisField] === "") {
        if (chartType === "pie") {
          // Untuk pie chart, kita tidak ingin menampilkan kategori "Tidak Diketahui"
          newItem.__skipRow = true; // Tandai untuk difilter nanti
        } else {
          // Untuk chart lain, beri label yang jelas agar mudah diidentifikasi
          newItem[xAxisField] = "(Kosong)";
        }
      }

      // Pastikan semua nilai y-axis adalah angka
      yAxisFields.forEach(field => {
        if (field === "count") {
          newItem[field] = typeof item["count"] === 'number' ? item["count"] : 0
        } else {
          // Coba konversi nilai ke angka, jika gagal gunakan 0
          const numValue = Number(item[field])
          newItem[field] = !isNaN(numValue) ? numValue : 0
        }
      })

      return newItem
    }).filter(item => !item.__skipRow); // Hapus item yang ditandai untuk dilewati

    // Urutkan data jika mengandung bulan bahasa Indonesia
    const sortedCleanData = sortDataWithIndonesianMonths(cleanData, xAxisField);

    // Untuk grafik pie, kita hanya menggunakan field Y-axis pertama
    const pieChartData = sortedCleanData
      .filter(item => {
        // Pastikan nama/label kategori valid
        const name = item[xAxisField];
        if (name === undefined || name === null || name === "" || name === "(Kosong)") {
          return false;
        }

        // Pastikan nilai untuk kategori ini positif
        const fieldName = yAxisFields[0] === "count" ? "count" : yAxisFields[0];
        const value = Number(item[fieldName] || 0);
        return value > 0;
      })
      .map((item) => {
        // Pastikan nilai value adalah angka yang valid dan positif
        const fieldName = yAxisFields[0] === "count" ? "count" : yAxisFields[0];
        const value = Number(item[fieldName] || 0);

        return {
          name: String(item[xAxisField]),
          value: value,
        };
      });

    // Untuk grafik scatter, kita membutuhkan minimal 2 field Y-axis
    const scatterChartData = sortedCleanData.map((item) => ({
      name: String(item[xAxisField] || "Tidak diketahui"),
      x: Number(yAxisFields[0] === "count" ? (item["count"] || 0) : (item[yAxisFields[0]] || 0)),
      y: Number(yAxisFields.length > 1 ? (yAxisFields[1] === "count" ? (item["count"] || 0) : (item[yAxisFields[1]] || 0)) : 0),
      z: yAxisFields.length > 2 ? Number(yAxisFields[2] === "count" ? (item["count"] || 0) : (item[yAxisFields[2]] || 10)) : 10,
    }))

    // Pastikan semua nilai numerik
    const formattedData = sortedCleanData

    // Fungsi untuk mendapatkan domain untuk sumbu X (penting untuk mempertahankan urutan bulan)
    const getXAxisDomain = (): (string | number)[] => {
      if (!formattedData || formattedData.length === 0) return [];

      // Ekstrak nilai X axis
      const xValues = formattedData.map(item => String(item[xAxisField] || ""));

      // Jika mengandung bulan bahasa Indonesia, buatkan urutan domain khusus
      if (containsIndonesianMonths(xValues)) {
        // Filter hanya bulan yang ada dalam data
        const monthOrder = ['januari', 'februari', 'maret', 'april', 'mei', 'juni',
                            'juli', 'agustus', 'september', 'oktober', 'november', 'desember'];

        // Ambil bulan yang ada dalam data dengan mempertahankan urutan kalender
        return monthOrder.filter(month =>
          xValues.some(val => val.toLowerCase() === month)
        );
      }

      return []; // Kosong berarti Recharts akan menentukan domain secara otomatis
    };

    // Handler format untuk tooltip
    const safeFormatter = (value: any, name: string) => {
      try {
        // Handle grouped data
        if (name && name.includes("_")) {
          const [baseName, groupValue] = name.split("_")
          return [
            typeof value === 'number' ? value.toLocaleString() : '0',
            `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`
          ]
        }
        // Handle regular data
        return [
          typeof value === 'number' ? value.toLocaleString() : '0',
          name === "count" ? "Jumlah Data" : name
        ]
      } catch (error) {
        return ['0', 'Tidak diketahui']
      }
    }

    // Handler format untuk legend
    const safeLegendFormatter = (value: string) => {
      try {
        if (value && value.includes("_")) {
          const [baseName, groupValue] = value.split("_")
          return `${baseName === "count" ? "Jumlah Data" : baseName} (${groupValue})`
        }
        return value === "count" ? "Jumlah Data" : value
      } catch (error) {
        return value || 'Tidak diketahui'
      }
    }

    // Fungsi untuk membuat label sumbu x lebih pendek jika terlalu panjang
    const formatXAxisTick = (value: any) => {
      // Tangani nilai kosong atau tidak valid
      if (value === undefined || value === null || value === "") {
        return "(Kosong)";
      }

      // Deteksi jika nilai adalah tanggal dan format dengan rapi
      if (typeof value === 'string') {
        // Coba deteksi format tanggal
        const datePattern = /^\d{4}-\d{2}-\d{2}|^\d{2}[/.-]\d{2}[/.-]\d{4}/;
        if (datePattern.test(value) && !isNaN(Date.parse(value))) {
          try {
            const date = new Date(value);
            return `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth()+1).toString().padStart(2, '0')}-${date.getFullYear()}`;
          } catch (e) {
            // Jika gagal memformat tanggal, lanjutkan dengan format string normal
          }
        }

        // Potong string yang terlalu panjang
        if (value.length > 15) {
          return `${value.substring(0, 15)}...`;
        }
      }

      return value;
    }

    // Tentukan margin berdasarkan jenis grafik
    const getMargin = (chartType: string) => {

      switch (chartType) {
        case 'horizontal-bar':
          return { top: 20, right: 30, left: 130, bottom: 30 }
        case 'bar':
        case 'stacked-bar':
        case 'grouped-bar':
        case 'line':
        case 'area':
          return { top: 20, right: 30, left: 60, bottom: 80 }
        case 'scatter':
          return { top: 20, right: 30, left: 60, bottom: 40 }
        case 'pie':
          return { top: 20, right: 30, left: 30, bottom: 20 }
        default:
          console.log("Using default margin for unknown chart type:", chartType);
          return { top: 20, right: 30, left: 60, bottom: 80 }
      }
    }

    // Mendapatkan tick formatter yang benar untuk sumbu Y
    const getYAxisTickFormatter = () => {
      return (value: number) => {
        if (Math.abs(value) >= 1000000) {
          return `${(value / 1000000).toFixed(1)}M`
        } else if (Math.abs(value) >= 1000) {
          return `${(value / 1000).toFixed(1)}K`
        }
        return value.toLocaleString()
      }
    }

    return (
      <div
        className="h-[500px] w-full transition-opacity duration-500 ease-in-out overflow-hidden"
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        {chartType === "bar" && (
          <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="90%" debounce={50}>
              <BarChart data={formattedData} margin={getMargin(chartType)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisField}
                angle={-35}
                textAnchor="end"
                height={80}
                label={{
                  value: xAxisLabel,
                  position: "insideBottom",
                  offset: -30,
                  style: { fontSize: 13, fontWeight: 500 }
                }}
                tick={{ fontSize: 11 }}
                tickFormatter={formatXAxisTick}
                interval={formattedData.length > 8 ? (formattedData.length > 20 ? 'preserveStartEnd' : 'equidistantPreserveStart') : 0}
                padding={{ left: 10, right: 10 }}
                domain={getXAxisDomain()}
              />
                <YAxis
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    offset: -45,
                    style: { fontSize: 13, fontWeight: 500 }
                  }}
                  width={60}
                  tickFormatter={getYAxisTickFormatter()}
                  domain={['auto', 'auto']}
                  padding={{ top: 10, bottom: 0 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={safeLegendFormatter} wrapperStyle={{ paddingTop: 10 }} />

                {/* Jika ada groupName dan groupValues, tampilkan grouped bar chart */}
                {groupName && groupValues && groupValues.length > 0 && yAxisFields.some(field => field.includes('_')) ? (
                  // Render grouped bars berdasarkan nilai grup
                  groupValues.map((groupVal, index) => {
                    // Cari field yang sesuai dengan nilai grup ini
                    const groupFields = yAxisFields.filter(field => {
                      if (field.includes('_')) {
                        const parts = field.split('_');
                        return parts[parts.length - 1] === groupVal;
                      }
                      return false;
                    });

                    return groupFields.map((field, fieldIndex) => (
                      <Bar
                        key={field}
                        dataKey={field}
                        name={field}
                        fill={COLORS[index % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    ));
                  })
                ) : (
                  // Render bar chart biasa
                  yAxisFields.map((field, index) => (
                <Bar
                  key={field}
                  dataKey={field}
                  name={field}
                  fill={COLORS[index % COLORS.length]}
                  radius={[4, 4, 0, 0]}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                />
                  ))
                )}
            </BarChart>
          </ResponsiveContainer>
              <TotalDataInfo data={formattedData} chartType={chartType} yAxisFields={yAxisFields} />
            </div>
        )}

        {chartType === "horizontal-bar" && (
          <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="90%" debounce={50}>
              <BarChart layout="vertical" data={formattedData} margin={getMargin(chartType)}>
              <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  label={{ value: yAxisLabel, position: "insideBottom", offset: -10 }}
                  tickFormatter={getYAxisTickFormatter()}
                  domain={['auto', 'auto']}
                />
              <YAxis
                dataKey={xAxisField}
                type="category"
                  width={120}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxisTick}
                  interval={formattedData.length > 10 ? "preserveStartEnd" : 0}
                />
                <Tooltip content={<CustomTooltip />} />
                {/* <Legend formatter={safeLegendFormatter} wrapperStyle={{ paddingTop: 10 }} /> */}
              {yAxisFields.map((field, index) => (
                <Bar
                  key={field}
                  dataKey={field}
                  name={field}
                  fill={COLORS[index % COLORS.length]}
                  radius={[0, 4, 4, 0]}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-out"
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
            <TotalDataInfo data={formattedData} chartType={chartType} yAxisFields={yAxisFields} />
          </div>
        )}

        {chartType === "line" && (
          <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="90%" debounce={50}>
              <LineChart data={formattedData} margin={getMargin(chartType)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisField}
                angle={-45}
                textAnchor="end"
                height={80}
                label={{ value: xAxisLabel, position: "insideBottom", offset: -40 }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxisTick}
                  interval={formattedData.length > 10 ? "preserveStartEnd" : 0}
                />
                <YAxis
                  label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -40 }}
                  width={60}
                  tickFormatter={getYAxisTickFormatter()}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={safeLegendFormatter} wrapperStyle={{ paddingTop: 10 }} />

                {/* Jika ada groupName dan groupValues, gunakan pengelompokan */}
                {groupName && groupValues && groupValues.length > 0 && yAxisFields.some(field => field.includes('_')) ? (
                  // Render lines berdasarkan nilai grup
                  groupValues.map((groupVal, index) => {
                    // Cari field yang sesuai dengan nilai grup ini
                    const groupFields = yAxisFields.filter(field => {
                      if (field.includes('_')) {
                        const parts = field.split('_');
                        return parts[parts.length - 1] === groupVal;
                      }
                      return false;
                    });

                    return groupFields.map((field, fieldIndex) => (
                      <Line
                        key={field}
                        type="monotone"
                        dataKey={field}
                        name={field}
                        stroke={COLORS[index % COLORS.length]}
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        dot={{ r: 4 }}
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-out"
                        connectNulls={true}
                      />
                    ));
                  })
                ) : (
                  // Jika ada groupName tetapi tidak ada di yAxisFields, gunakan groupName sebagai pembeda
                  groupName && !yAxisFields.some(field => field.includes('_')) ? (
                    // Grup data array berdasarkan nilai groupName
                    Array.isArray(data) && data.length > 0 && typeof data[0][groupName] !== 'undefined' ? (
                      // Untuk setiap yAxisField, buat multiple lines berdasarkan groupName
                      yAxisFields.map((field) => (
                        <Line
                          key={`${field}`}
                          type="monotone"
                          dataKey={field}
                          name={field}
                          stroke={COLORS[yAxisFields.indexOf(field) % COLORS.length]}
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                          dot={{ r: 4 }}
                          isAnimationActive={true}
                          animationDuration={1500}
                          animationEasing="ease-out"
                          connectNulls={true}
                        />
                      ))
                    ) : (
                      // Fallback jika tidak bisa mengakses groupName di data
                      yAxisFields.map((field, index) => (
                        <Line
                          key={field}
                          type="monotone"
                          dataKey={field}
                          name={field}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={2}
                          activeDot={{ r: 8 }}
                          dot={{ r: 4 }}
                          isAnimationActive={true}
                          animationDuration={1500}
                          animationEasing="ease-out"
                          connectNulls={true}
                        />
                      ))
                    )
                  ) : (
                    // Render line chart biasa
                    yAxisFields.map((field, index) => (
                <Line
                  key={field}
                  type="monotone"
                  dataKey={field}
                  name={field}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  activeDot={{ r: 8 }}
                        dot={{ r: 4 }}
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-out"
                        connectNulls={true}
                />
                    ))
                  )
                )}
            </LineChart>
          </ResponsiveContainer>
            <TotalDataInfo data={formattedData} chartType={chartType} yAxisFields={yAxisFields} />
          </div>
        )}

        {chartType === "pie" && (
          pieChartData.length > 0 ? (
            <div className="w-full h-full flex flex-col">
              <ResponsiveContainer width="100%" height="90%" debounce={50}>
            <PieChart>
              <Pie
                data={pieChartData}
                cx="50%"
                cy="50%"
                labelLine={true}
                    outerRadius={pieChartData.length > 10 ? 120 : 150}
                fill="#8884d8"
                dataKey="value"
                nameKey="name"
                    label={getPieChartLabel}
                    isAnimationActive={true}
                    animationDuration={1000}
                    animationEasing="ease-out"
                    minAngle={1.5} // Minimal sudut untuk slice yang sangat kecil
              >
                {pieChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    formatter={safeLegendFormatter}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                    wrapperStyle={{ paddingTop: 10 }}
                    iconSize={10}
                    iconType="circle"
                  />
            </PieChart>
          </ResponsiveContainer>
              <TotalDataInfo data={pieChartData} chartType={chartType} yAxisFields={yAxisFields} />
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <PieChartIcon className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">Tidak ada data yang cocok untuk grafik lingkaran</p>
                <p className="text-xs text-muted-foreground">Nilai pada variabel harus positif dan tidak kosong</p>
              </div>
            </div>
          )
        )}

        {chartType === "stacked-bar" && (
          <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="90%" debounce={50}>
              <BarChart data={formattedData} margin={getMargin(chartType)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisField}
                angle={-45}
                textAnchor="end"
                height={80}
                label={{ value: xAxisLabel, position: "insideBottom", offset: -40 }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxisTick}
                  interval={formattedData.length > 10 ? "preserveStartEnd" : 0}
                />
                <YAxis
                  label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -40 }}
                  width={60}
                  tickFormatter={getYAxisTickFormatter()}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={safeLegendFormatter} wrapperStyle={{ paddingTop: 10 }} />

                {/* Jika ada groupName dan groupValues, gunakan pengelompokan */}
                {groupName && groupValues && groupValues.length > 0 && yAxisFields.some(field => field.includes('_')) ? (
                  // Render stacked bars berdasarkan nilai grup
                  groupValues.map((groupVal, index) => {
                    // Cari field yang sesuai dengan nilai grup ini
                    const groupFields = yAxisFields.filter(field => {
                      if (field.includes('_')) {
                        const parts = field.split('_');
                        return parts[parts.length - 1] === groupVal;
                      }
                      return false;
                    });

                    return groupFields.map((field) => (
                      <Bar
                        key={field}
                        dataKey={field}
                        name={field}
                        stackId="a"
                        fill={COLORS[index % COLORS.length]}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    ));
                  })
                ) : (
                  // Render stacked bar chart biasa
                  yAxisFields.map((field, index) => (
                    <Bar
                      key={field}
                      dataKey={field}
                      name={field}
                      stackId="a"
                      fill={COLORS[index % COLORS.length]}
                      isAnimationActive={true}
                      animationDuration={1000}
                      animationEasing="ease-out"
                    />
                  ))
                )}
            </BarChart>
          </ResponsiveContainer>
            <TotalDataInfo data={formattedData} chartType={chartType} yAxisFields={yAxisFields} />
          </div>
        )}

        {chartType === "area" && (
          <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="90%" debounce={50}>
              <AreaChart data={formattedData} margin={getMargin(chartType)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey={xAxisField}
                angle={-45}
                textAnchor="end"
                height={80}
                label={{ value: xAxisLabel, position: "insideBottom", offset: -40 }}
                  tick={{ fontSize: 12 }}
                  tickFormatter={formatXAxisTick}
                  interval={formattedData.length > 10 ? "preserveStartEnd" : 0}
                />
                <YAxis
                  label={{ value: yAxisLabel, angle: -90, position: "insideLeft", offset: -40 }}
                  width={60}
                  tickFormatter={getYAxisTickFormatter()}
                  domain={['auto', 'auto']}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={safeLegendFormatter} wrapperStyle={{ paddingTop: 10 }} />

                {/* Jika ada groupName dan groupValues, gunakan pengelompokan */}
                {groupName && groupValues && groupValues.length > 0 && yAxisFields.some(field => field.includes('_')) ? (
                  // Render area charts berdasarkan nilai grup
                  groupValues.map((groupVal, index) => {
                    // Cari field yang sesuai dengan nilai grup ini
                    const groupFields = yAxisFields.filter(field => {
                      if (field.includes('_')) {
                        const parts = field.split('_');
                        return parts[parts.length - 1] === groupVal;
                      }
                      return false;
                    });

                    return groupFields.map((field) => (
                      <Area
                        key={field}
                        type="monotone"
                        dataKey={field}
                        name={field}
                        stroke={COLORS[index % COLORS.length]}
                        fill={COLORS[index % COLORS.length]}
                        fillOpacity={0.3}
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-out"
                        connectNulls={true}
                      />
                    ));
                  })
                ) : (
                  // Render area chart biasa
                  yAxisFields.map((field, index) => (
                <Area
                  key={field}
                  type="monotone"
                  dataKey={field}
                  name={field}
                  stroke={COLORS[index % COLORS.length]}
                  fill={COLORS[index % COLORS.length]}
                  fillOpacity={0.3}
                      isAnimationActive={true}
                      animationDuration={1500}
                      animationEasing="ease-out"
                      connectNulls={true}
                />
                  ))
                )}
            </AreaChart>
          </ResponsiveContainer>
            <TotalDataInfo data={formattedData} chartType={chartType} yAxisFields={yAxisFields} />
          </div>
        )}

        {chartType === "scatter" && yAxisFields.length >= 2 && (
          <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="90%" debounce={50}>
              <ScatterChart margin={getMargin(chartType)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="x"
                name={yAxisFields[0]}
                label={{ value: yAxisFields[0], position: "insideBottom", offset: -10 }}
                  tickFormatter={getYAxisTickFormatter()}
                  domain={['auto', 'auto']}
              />
              <YAxis
                dataKey="y"
                name={yAxisFields[1]}
                label={{ value: yAxisFields[1], angle: -90, position: "insideLeft" }}
                  tickFormatter={getYAxisTickFormatter()}
                  domain={['auto', 'auto']}
              />
              {yAxisFields.length > 2 && <ZAxis dataKey="z" range={[50, 500]} name={yAxisFields[2]} />}
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                        <div className="bg-white p-3 border rounded-md shadow-md">
                          <p className="font-semibold mb-1 text-sm">{payload[0]?.payload?.name || "Tidak diketahui"}</p>
                          {groupName && (
                            <p className="text-xs text-muted-foreground mb-1">
                              {groupName}: <strong>{payload[0]?.payload?.[groupName] || "Tidak ada"}</strong>
                            </p>
                          )}
                          <div className="space-y-1">
                            <div className="flex items-center">
                              <div
                                className="w-3 h-3 mr-2"
                                style={{
                                  backgroundColor: groupName && payload[0]?.payload?.[groupName] ?
                                    COLORS[groupValues?.indexOf(payload[0]?.payload?.[groupName]) % COLORS.length] :
                                    COLORS[0]
                                }}
                              />
                              <span className="text-sm">{yAxisFields[0]}: </span>
                              <span className="text-sm font-semibold ml-1">
                                {(payload[0]?.value || 0).toLocaleString()}
                              </span>
                            </div>
                            <div className="flex items-center">
                              <div className="w-3 h-3 mr-2" style={{ backgroundColor: COLORS[1] }} />
                              <span className="text-sm">{yAxisFields[1]}: </span>
                              <span className="text-sm font-semibold ml-1">
                                {(payload[1]?.value || 0).toLocaleString()}
                              </span>
                            </div>
                            {yAxisFields.length > 2 && (
                              <div className="flex items-center">
                                <div className="w-3 h-3 mr-2" style={{ backgroundColor: COLORS[2] }} />
                                <span className="text-sm">{yAxisFields[2]}: </span>
                                <span className="text-sm font-semibold ml-1">
                                  {(payload[0]?.payload?.z || 0).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                      </div>
                      );
                  }
                    return null;
                }}
              />
              <Legend formatter={safeLegendFormatter} />

                {/* Jika ada groupName dan groupValues, kelompokkan scatter points berdasarkan grup */}
                {groupName && groupValues && groupValues.length > 0 ? (
                  // Buat Scatter plot terpisah untuk setiap nilai grup
                  groupValues.map((groupVal, index) => {
                    // Filter data untuk nilai grup ini
                    const groupData = scatterChartData.filter(item => item[groupName] === groupVal);

                    return (
                      <Scatter
                        key={`scatter-${groupVal}`}
                        name={`${groupVal}`}
                        data={groupData}
                        fill={COLORS[index % COLORS.length]}
                        shape="circle"
                        isAnimationActive={true}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    );
                  })
                ) : (
                  // Render scatter plot biasa
              <Scatter
                name={`${yAxisFields[0]} vs ${yAxisFields[1]}`}
                data={scatterChartData}
                fill={COLORS[0]}
                shape="circle"
                    isAnimationActive={true}
                    animationDuration={1500}
                    animationEasing="ease-out"
              />
                )}
            </ScatterChart>
          </ResponsiveContainer>
            <TotalDataInfo data={scatterChartData} chartType={chartType} yAxisFields={yAxisFields} />
          </div>
        )}

        {/* Grafik Batang Kelompok */}
        {chartType === "grouped-bar" && (
          <div className="w-full h-full flex flex-col">
            <ResponsiveContainer width="100%" height="90%" debounce={50}>
              <BarChart data={formattedData} margin={getMargin(chartType)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey={xAxisField}
                  angle={-35}
                  textAnchor="end"
                  height={80}
                  label={{
                    value: xAxisLabel,
                    position: "insideBottom",
                    offset: -30,
                    style: { fontSize: 13, fontWeight: 500 }
                  }}
                  tick={{ fontSize: 11 }}
                  tickFormatter={formatXAxisTick}
                  interval={formattedData.length > 8 ? (formattedData.length > 20 ? 'preserveStartEnd' : 'equidistantPreserveStart') : 0}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  label={{
                    value: yAxisLabel,
                    angle: -90,
                    position: "insideLeft",
                    offset: -45,
                    style: { fontSize: 13, fontWeight: 500 }
                  }}
                  width={60}
                  tickFormatter={getYAxisTickFormatter()}
                  domain={['auto', 'auto']}
                  padding={{ top: 10, bottom: 0 }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={safeLegendFormatter} wrapperStyle={{ paddingTop: 10 }} />

                {/* Jika ada groupName dan groupValues, tampilkan grouped bar chart */}
                {groupName && groupValues && groupValues.length > 0 && yAxisFields.some(field => field.includes('_')) ? (
                  // Render grouped bars berdasarkan nilai grup
                  groupValues.map((groupVal, index) => {
                    // Cari field yang sesuai dengan nilai grup ini
                    const groupFields = yAxisFields.filter(field => {
                      if (field.includes('_')) {
                        const parts = field.split('_');
                        return parts[parts.length - 1] === groupVal;
                      }
                      return false;
                    });

                    return groupFields.map((field, fieldIndex) => (
                      <Bar
                        key={field}
                        dataKey={field}
                        name={field}
                        fill={COLORS[index % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    ));
                  })
                ) : (
                  // Jika ada groupName tetapi tidak ada di yAxisFields, gunakan groupName sebagai pembeda
                  groupName && !yAxisFields.some(field => field.includes('_')) ? (
                    // Untuk setiap yAxisField, buat multiple bars berdasarkan groupName
                    yAxisFields.map((field, index) => (
                      <Bar
                        key={field}
                        dataKey={field}
                        name={field}
                        fill={COLORS[index % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    ))
                  ) : (
                    // Fallback ke bar chart biasa
                    yAxisFields.map((field, index) => (
                      <Bar
                        key={field}
                        dataKey={field}
                        name={field}
                        fill={COLORS[index % COLORS.length]}
                        radius={[4, 4, 0, 0]}
                        isAnimationActive={true}
                        animationDuration={1000}
                        animationEasing="ease-out"
                      />
                    ))
                  )
                )}
              </BarChart>
            </ResponsiveContainer>
            <TotalDataInfo data={formattedData} chartType={chartType} yAxisFields={yAxisFields} />
          </div>
        )}
      </div>
    )
  } catch (err) {
    console.error("Error rendering chart:", err)
    return (
      <div className="h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Terjadi kesalahan saat memproses data visualisasi</p>
      </div>
    )
  }
}
