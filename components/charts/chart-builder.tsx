"use client"

import { useState, useMemo, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ChartDisplay } from "@/components/charts/chart-display"
import {
  BarChart3,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  LineChart,
  PieChart,
  ScatterChartIcon as ScatterPlot,
  AreaChart,
  BarChartHorizontal,
  Lightbulb,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { Separator } from "@/components/ui/separator"
import { useDatasets } from "@/contexts/dataset-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Definisi jenis grafik yang didukung
const chartTypes = [
  {
    id: "bar",
    name: "Grafik Batang",
    icon: BarChart3,
    description: "Membandingkan nilai antar kategori",
    minDimensions: 1,
    maxDimensions: 2,
    minMeasures: 1,
    maxMeasures: 5,
    supportsGrouping: false,
    supportsLabels: false,
    recommendedFor: "Perbandingan nilai antar kategori dengan jumlah kategori yang tidak terlalu banyak (< 20)",
  },
  {
    id: "grouped-bar",
    name: "Grafik Batang Kelompok",
    icon: BarChart3,
    description: "Membandingkan nilai antar kategori dan kelompok",
    minDimensions: 1,
    maxDimensions: 2,
    minMeasures: 1,
    maxMeasures: 5,
    supportsGrouping: true,
    supportsLabels: true,
    recommendedFor: "Perbandingan nilai antar kategori dan kelompok",
  },
  {
    id: "line",
    name: "Grafik Garis",
    icon: LineChart,
    description: "Menampilkan tren dari waktu ke waktu atau data kontinu",
    minDimensions: 1,
    maxDimensions: 2,
    minMeasures: 1,
    maxMeasures: 5,
    supportsGrouping: false,
    supportsLabels: false,
    recommendedFor: "Data deret waktu atau tren yang berubah secara kontinu",
  },
  {
    id: "pie",
    name: "Grafik Lingkaran",
    icon: PieChart,
    description: "Menampilkan proporsi dari keseluruhan",
    minDimensions: 1,
    maxDimensions: 1,
    minMeasures: 1,
    maxMeasures: 1,
    supportsGrouping: false,
    supportsLabels: false,
    recommendedFor: "Proporsi dari keseluruhan dengan jumlah kategori sedikit (< 7)",
  },
  {
    id: "stacked-bar",
    name: "Grafik Batang Bertumpuk",
    icon: Layers,
    description: "Membandingkan bagian dari keseluruhan antar kategori",
    minDimensions: 1,
    maxDimensions: 1,
    minMeasures: 1,
    maxMeasures: 5,
    supportsGrouping: true,
    supportsLabels: true,
    recommendedFor: "Perbandingan komposisi antar kategori",
  },
  {
    id: "multi-axis-bar",
    name: "Grafik Batang Multi-Axis",
    icon: BarChart3,
    description: "Membandingkan nilai dengan skala berbeda",
    minDimensions: 1,
    maxDimensions: 1,
    minMeasures: 2,
    maxMeasures: 2,
    supportsGrouping: true,
    supportsLabels: true,
    recommendedFor: "Perbandingan nilai dengan skala yang berbeda",
  },
  {
    id: "area",
    name: "Grafik Area",
    icon: AreaChart,
    description: "Menampilkan total kumulatif dari waktu ke waktu",
    minDimensions: 1,
    maxDimensions: 2,
    minMeasures: 1,
    maxMeasures: 5,
    supportsGrouping: false,
    supportsLabels: false,
    recommendedFor: "Data deret waktu dengan penekanan pada volume total",
  },
  {
    id: "scatter",
    name: "Diagram Pencar",
    icon: ScatterPlot,
    description: "Menampilkan korelasi antara dua variabel",
    minDimensions: 0,
    maxDimensions: 1,
    minMeasures: 2,
    maxMeasures: 3,
    supportsGrouping: false,
    supportsLabels: false,
    recommendedFor: "Analisis korelasi antara dua variabel numerik",
  },
  {
    id: "horizontal-bar",
    name: "Grafik Batang Horizontal",
    icon: BarChartHorizontal,
    description: "Membandingkan nilai antar kategori dengan label panjang",
    minDimensions: 1,
    maxDimensions: 2,
    minMeasures: 1,
    maxMeasures: 5,
    supportsGrouping: false,
    supportsLabels: false,
    recommendedFor: "Perbandingan nilai dengan label kategori yang panjang",
  },
]

export function ChartBuilder() {
  const searchParams = useSearchParams()
  const { datasets, loading } = useDatasets()
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("")
  const [selectedXAxisVariables, setSelectedXAxisVariables] = useState<string[]>([])
  const [selectedYAxisVariables, setSelectedYAxisVariables] = useState<string[]>([])
  const [selectedGroupVariable, setSelectedGroupVariable] = useState<string | null>(null)
  const [selectedLabelVariable, setSelectedLabelVariable] = useState<string | null>(null)
  const [chartData, setChartData] = useState<any>({ data: [], xAxisName: "", yAxisNames: [], groupName: "" })
  const [showChart, setShowChart] = useState(false)
  const [activeTab, setActiveTab] = useState("variables")
  const [selectedChartType, setSelectedChartType] = useState<string>("")
  const [currentStep, setCurrentStep] = useState<"variables" | "chartType">("variables")

  const { toast } = useToast()

  // Check if there's a dataset ID in the URL
  useEffect(() => {
    const datasetId = searchParams.get("dataset")
    if (datasetId && !loading) {
      setSelectedDatasetId(datasetId)
    }
  }, [searchParams, loading])

  // Get the selected dataset
  const selectedDataset = useMemo(() => {
    return datasets.find((d) => d.id === selectedDatasetId)
  }, [datasets, selectedDatasetId])

  // Get available dimensions and measures from the selected dataset
  const dimensions = useMemo(() => {
    return selectedDataset?.variables.filter((v) => v.type === "dimension" && v.selected) || []
  }, [selectedDataset])

  const measures = useMemo(() => {
    return selectedDataset?.variables.filter((v) => v.type === "measure" && v.selected) || []
  }, [selectedDataset])

  // Get the selected chart type definition
  const selectedChartTypeDefinition = useMemo(() => {
    return chartTypes.find((c) => c.id === selectedChartType)
  }, [selectedChartType])

  // Filter available dimensions for group variable (exclude X and Y variables)
  const availableGroupDimensions = useMemo(() => {
    return dimensions.filter(
      (dim) => !selectedXAxisVariables.includes(dim.id) && !selectedYAxisVariables.includes(dim.id),
    )
  }, [dimensions, selectedXAxisVariables, selectedYAxisVariables])

  // Filter available measures for label variable (exclude X and Y variables)
  const availableLabelMeasures = useMemo(() => {
    return measures.filter(
      (measure) => !selectedXAxisVariables.includes(measure.id) && !selectedYAxisVariables.includes(measure.id),
    )
  }, [measures, selectedXAxisVariables, selectedYAxisVariables])

  // Determine recommended chart types based on selected variables
  const recommendedChartTypes = useMemo(() => {
    if (!selectedXAxisVariables.length) {
      return []
    }

    const numDimensions = selectedXAxisVariables.length
    const numMeasures = selectedYAxisVariables.length > 0 ? selectedYAxisVariables.length : 1 // Count as 1 measure if no Y selected

    // If group or label variable is selected, only show supported chart types
    if (selectedGroupVariable || selectedLabelVariable) {
      return chartTypes.filter(
        (chartType) =>
          chartType.supportsGrouping &&
          chartType.supportsLabels &&
          numDimensions >= chartType.minDimensions &&
          numDimensions <= chartType.maxDimensions &&
          numMeasures >= chartType.minMeasures &&
          numMeasures <= chartType.maxMeasures,
      )
    }

    return chartTypes.filter(
      (chartType) =>
        numDimensions >= chartType.minDimensions &&
        numDimensions <= chartType.maxDimensions &&
        numMeasures >= chartType.minMeasures &&
        numMeasures <= chartType.maxMeasures,
    )
  }, [selectedXAxisVariables, selectedYAxisVariables, selectedGroupVariable, selectedLabelVariable])

  // Check if variables are selected to proceed to chart type selection
  const canProceedToChartType = useMemo(() => {
    return selectedXAxisVariables.length > 0
  }, [selectedXAxisVariables])

  // Filter chart types based on X-axis variables count
  const availableChartTypes = useMemo(() => {
    const xAxisCount = selectedXAxisVariables.length;

    // Jika ada 2 variabel X, hanya tampilkan grafik yang mendukung 2 variabel X (tidak ada saat ini)
    if (xAxisCount === 2) {
      return [];
    }

    return recommendedChartTypes;
  }, [selectedXAxisVariables.length, recommendedChartTypes]);

  // Handle dataset selection
  const handleSelectDataset = (datasetId: string) => {
    setSelectedDatasetId(datasetId);
    // Reset semua pemilihan variabel
    setSelectedXAxisVariables([]);
    setSelectedYAxisVariables([]);
    setSelectedGroupVariable(null);
    setSelectedLabelVariable(null);
    setSelectedChartType("");
    setShowChart(false);
    setCurrentStep("variables");

    // Tampilkan informasi tentang batasan variabel X
    toast({
      title: "Info",
      description: "Saat ini grafik hanya mendukung 1 variabel sumbu X",
    });
  }

  // Handle X-axis variable selection
  const handleXAxisVariableToggle = (variableId: string) => {
    if (selectedXAxisVariables.includes(variableId)) {
      // Jika variabel sudah dipilih, hapus dari pilihan
      setSelectedXAxisVariables(selectedXAxisVariables.filter((id) => id !== variableId));
    } else {
      // Batasi hanya 1 dimensi untuk sumbu X
      if (selectedXAxisVariables.length < 1) {
        setSelectedXAxisVariables([...selectedXAxisVariables, variableId]);

        // Jika variabel ini dipilih sebagai grup atau label, hapus pilihan tersebut
        if (selectedGroupVariable === variableId) {
          setSelectedGroupVariable(null);
        }
        if (selectedLabelVariable === variableId) {
          setSelectedLabelVariable(null);
        }
      } else {
        toast({
          title: "Peringatan",
          description: "Grafik hanya mendukung 1 variabel untuk sumbu X saat ini",
          variant: "destructive",
        });
      }
    }
  }

  // Handle Y-axis variable selection
  const handleYAxisVariableToggle = (variableId: string) => {
    if (selectedYAxisVariables.includes(variableId)) {
      setSelectedYAxisVariables(selectedYAxisVariables.filter((id) => id !== variableId))
    } else {
      // Limit to 5 measures for Y-axis
      if (selectedYAxisVariables.length < 5) {
        setSelectedYAxisVariables([...selectedYAxisVariables, variableId])

        // If this variable was selected as group or label, deselect it
        if (selectedGroupVariable === variableId) {
          setSelectedGroupVariable(null)
        }
        if (selectedLabelVariable === variableId) {
          setSelectedLabelVariable(null)
        }
      } else {
        toast({
          title: "Peringatan",
          description: "Maksimal 5 variabel dapat dipilih untuk sumbu Y",
          variant: "destructive",
        })
      }
    }
  }

  // Handle group variable selection
  const handleGroupVariableChange = (variableId: string | null) => {
    setSelectedGroupVariable(variableId)
  }

  // Handle label variable selection
  const handleLabelVariableChange = (variableId: string | null) => {
    setSelectedLabelVariable(variableId)
  }

  // Handle chart type selection
  const handleChartTypeSelect = (chartType: string) => {
    setSelectedChartType(chartType);

    // Kosongkan chart data saat memilih jenis grafik untuk menghindari tampilan chart yang tidak valid
    if (chartType === "pie" || chartType === "grouped-bar") {
      // Untuk pie chart dan grouped-bar, jangan tampilkan chart sampai tombol "Buat Grafik" ditekan
      setShowChart(false);
      setChartData({ data: [], xAxisName: "", yAxisNames: [], groupName: "" });
    } else {
      // Untuk grafik lainnya, otomatis generate chart
    setTimeout(() => {
        handleGenerateChart();
      }, 100);
  }
  };

  // Handle proceeding to chart type selection
  const handleProceedToChartType = () => {
    if (canProceedToChartType) {
      // Reset chart visibility saat berpindah ke pemilihan jenis grafik
      setShowChart(false);

      // Periksa jika ada 2 variabel X terpilih
      if (selectedXAxisVariables.length === 2) {
        toast({
          title: "Peringatan",
          description: "Grafik dengan 2 variabel sumbu X belum didukung. Silakan pilih hanya 1 variabel sumbu X.",
          variant: "destructive",
        });
        return;
      }

      setCurrentStep("chartType");

      // If there's only one available chart type, select it automatically
      if (availableChartTypes.length === 1) {
        setSelectedChartType(availableChartTypes[0].id);
        // Jangan langsung generate chart, biarkan pengguna klik tombol "Buat Grafik"
      } else if (availableChartTypes.length > 0 && !selectedChartType) {
        // Select the first available chart type if none is selected
        setSelectedChartType(availableChartTypes[0].id);
        // Jangan langsung generate chart, biarkan pengguna klik tombol "Buat Grafik"
      }
    } else {
      toast({
        title: "Peringatan",
        description: "Silakan pilih minimal satu variabel untuk sumbu X",
        variant: "destructive",
      });
    }
  }

  // Handle going back to variable selection
  const handleBackToVariables = () => {
    setCurrentStep("variables")
  }

  // Generate chart data from the actual dataset
  const generateChartData = () => {
    if (!selectedDataset || !selectedXAxisVariables.length || !selectedChartType) {
      return { data: [], xAxisName: "", yAxisNames: [], groupName: "" };
    }

    // Validasi: jika ada 2 variabel X, tampilkan pesan error dan kembalikan data kosong
    if (selectedXAxisVariables.length > 1) {
      console.error("Grafik dengan 2 variabel sumbu X belum didukung");
      toast({
        title: "Error",
        description: "Grafik dengan 2 variabel sumbu X belum didukung saat ini",
        variant: "destructive",
      });
      return { data: [], xAxisName: "", yAxisNames: [], groupName: "" };
    }

    try {
      // Get variable names from IDs
      const xAxisVariables = selectedXAxisVariables
        .map((id) => dimensions.find((d) => d.id === id)?.name || "")
        .filter((name) => name !== "");

      const yAxisVariables = selectedYAxisVariables
        .map((id) => measures.find((m) => m.id === id)?.name || "")
        .filter((name) => name !== "");

      // Get group variable name if selected
      const groupVariableName = selectedGroupVariable
        ? dimensions.find((d) => d.id === selectedGroupVariable)?.name
        : null;

      // Get label variable name if selected
      const labelVariableName = selectedLabelVariable ? measures.find((m) => m.id === selectedLabelVariable)?.name : null;

      if (!xAxisVariables.length) {
        return { data: [], xAxisName: "", yAxisNames: [], groupName: "" };
      }

      // Primary X-axis variable
      const primaryXAxis = xAxisVariables[0];

      // Secondary X-axis variable (if exists)
      const secondaryXAxis = xAxisVariables.length > 1 ? xAxisVariables[1] : null;

      // Normalize dataset - handle both 'data' (old) and 'content' (new) property names
      const dataArray = Array.isArray(selectedDataset.content)
        ? selectedDataset.content
        : Array.isArray((selectedDataset as any).data)
          ? (selectedDataset as any).data
          : [];

      if (!Array.isArray(dataArray) || dataArray.length === 0) {
        return { data: [], xAxisName: primaryXAxis || "", yAxisNames: [], groupName: groupVariableName || "" };
      }

      // Filter out header rows or metadata - ensure we only count actual data rows
      const actualData = dataArray.filter((row) => {
        // Pastikan row adalah objek dan bukan null atau undefined
        if (!row || typeof row !== 'object') {
          return false;
        }

        // Periksa apakah ini adalah header kolom (biasanya header tidak memiliki nilai numerik)
        const isPossiblyHeader = yAxisVariables.length > 0 && yAxisVariables.every(yVar => {
          const val = row[yVar];
          // Header biasanya berisi string seperti nama kolom atau description
          return val === undefined || val === null || (typeof val === 'string' && isNaN(Number(val)));
        });

        // Tolak row jika tidak memiliki nilai x yang valid ATAU terdeteksi sebagai header
        const hasValidX = row[primaryXAxis] !== undefined && row[primaryXAxis] !== null;

        return hasValidX && !isPossiblyHeader;
      });

      if (!actualData || actualData.length === 0) {
        return { data: [], xAxisName: primaryXAxis || "", yAxisNames: [], groupName: groupVariableName || "" };
      }

      // Prepare empty return value in case of error
      const emptyReturn = {
        data: [],
        xAxisName: primaryXAxis || "",
        yAxisNames: [],
        groupName: groupVariableName || ""
      };

      // Ekstrak nilai unik dari grup variabel (jika ada)
      let groupValues: string[] = [];

      if (groupVariableName) {
        groupValues = Array.from(new Set(
          actualData
            .filter(row => row[groupVariableName] !== undefined && row[groupVariableName] !== null)
            .map(row => String(row[groupVariableName]))
        )).filter(val => val && val.trim() !== "");

        // Sort nilai grup
        groupValues.sort();
      }

      // Process data based on chart type
      try {
        // Untuk grafik yang memerlukan data agregat
        if (["bar", "line", "pie", "stacked-bar", "grouped-bar", "area", "horizontal-bar"].includes(selectedChartType)) {
          // Jika ada variabel grup yang dipilih, agregasi berdasarkan sumbu X dan grup
          if (groupVariableName && groupValues.length > 0) {
            // Untuk stacked dan grouped bar chart, proses data secara berbeda
            if (["stacked-bar", "grouped-bar"].includes(selectedChartType)) {
              // Agregasi data berdasarkan sumbu X dan nilai grup
              const aggregatedByGroupData: Record<string, Record<string, any>> = {};

              actualData.forEach(row => {
                const xValue = row[primaryXAxis];
                const groupValue = row[groupVariableName];

                // Skip jika nilai x atau group tidak valid
                if (xValue === undefined || xValue === null || xValue === "" ||
                    groupValue === undefined || groupValue === null) {
                  return;
                }

                const xKey = String(xValue);
                const groupKey = String(groupValue);

                // Inisialisasi objek untuk nilai x jika belum ada
                if (!aggregatedByGroupData[xKey]) {
                  aggregatedByGroupData[xKey] = {
                    [primaryXAxis]: xKey,
                  };

                  // Inisialisasi count untuk setiap nilai grup
                  groupValues.forEach(gValue => {
                    aggregatedByGroupData[xKey][`count_${gValue}`] = 0;
                  });

                  // Inisialisasi nilai y untuk setiap nilai grup
                  if (yAxisVariables.length > 0) {
                    yAxisVariables.forEach(yVar => {
                      groupValues.forEach(gValue => {
                        aggregatedByGroupData[xKey][`${yVar}_${gValue}`] = 0;
                      });
                    });
                  }
                }

                // Increment count untuk nilai grup ini
                aggregatedByGroupData[xKey][`count_${groupKey}`] += 1;

                // Sum nilai Y untuk nilai grup ini
                if (yAxisVariables.length > 0) {
                  yAxisVariables.forEach(yVar => {
                    const yValue = row[yVar];
                    if (yValue !== undefined && yValue !== null) {
                      const numValue = Number(yValue);
                      if (!isNaN(numValue)) {
                        aggregatedByGroupData[xKey][`${yVar}_${groupKey}`] += numValue;
                      }
                    }
                  });
                }
              });

              // Convert ke array
              const result = Object.values(aggregatedByGroupData);

              // Sort the result by X-axis values if they are dates or numbers
              const sortedResult = [...result].sort((a, b) => {
                const aValue = a[primaryXAxis];
                const bValue = b[primaryXAxis];

                // If both values can be parsed as dates
                if (!isNaN(Date.parse(aValue)) && !isNaN(Date.parse(bValue))) {
                  return new Date(aValue).getTime() - new Date(bValue).getTime();
                }

                // If both values can be parsed as numbers
                if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
                  return Number(aValue) - Number(bValue);
                }

                // Default to string comparison
                return String(aValue).localeCompare(String(bValue));
              });

              // Batasi jumlah data untuk visualisasi yang lebih baik
              let finalResult = sortedResult;

              // Untuk grafik batang/garis, batasi jumlah data jika terlalu banyak
              if (finalResult.length > 30) {
                const maxItems = selectedChartType === "horizontal-bar" ? 15 : 30;

                if (["bar", "stacked-bar", "grouped-bar", "horizontal-bar"].includes(selectedChartType)) {
                  // Untuk grafik batang, ambil data dengan nilai tertinggi
                  const sortField = yAxisVariables.length > 0 ?
                    `${yAxisVariables[0]}_${groupValues[0]}` :
                    `${groupValues[0]}`;

                  finalResult = [...finalResult]
                    .sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0))
                    .slice(0, maxItems);
          } else {
                  // Untuk line/area, ambil data dengan interval yang sesuai
                  const interval = Math.ceil(finalResult.length / maxItems);
                  finalResult = finalResult.filter((_, index) => index % interval === 0);

                  // Pastikan data terakhir selalu dimasukkan
                  if (finalResult.length > 0 && finalResult[finalResult.length - 1] !== sortedResult[sortedResult.length - 1]) {
                    finalResult.push(sortedResult[sortedResult.length - 1]);
                  }
                }
              }

              // Generate yAxisNames based on groupValues
              const generatedYAxisNames: string[] = [];

              if (yAxisVariables.length > 0) {
            yAxisVariables.forEach(yVar => {
                  groupValues.forEach(gValue => {
                    generatedYAxisNames.push(`${yVar}_${gValue}`);
                  });
                });
              } else {
                groupValues.forEach(gValue => {
                  generatedYAxisNames.push(`count_${gValue}`);
                });
              }

              return {
                data: finalResult,
                xAxisName: primaryXAxis,
                yAxisNames: generatedYAxisNames,
                groupName: groupVariableName,
                groupValues: groupValues,
                labelName: labelVariableName || ""
              };
            } else {
              // Untuk chart lain dengan fitur grouping
              const aggregatedData: Record<string, any>[] = [];

              // Lakukan agregasi per nilai grup
              groupValues.forEach(groupVal => {
                // Filter data hanya untuk nilai grup ini
                const groupData = actualData.filter(row =>
                  row[groupVariableName] !== undefined &&
                  String(row[groupVariableName]) === groupVal
                );

                // Agregasi data berdasarkan sumbu X untuk nilai grup ini
                const aggregatedByX: Record<string, any> = {};

                groupData.forEach(row => {
                  const xValue = row[primaryXAxis];

                  // Skip nilai x yang tidak valid
                  if (xValue === undefined || xValue === null || xValue === "") {
                    return;
                  }

                  const xKey = String(xValue);

                  if (!aggregatedByX[xKey]) {
                    aggregatedByX[xKey] = {
                      [primaryXAxis]: xKey,
                      [groupVariableName]: groupVal,
                      count: 0
                    };

                    // Initialize all y-axis values to 0
                    if (yAxisVariables.length > 0) {
                      yAxisVariables.forEach(yVar => {
                        aggregatedByX[xKey][yVar] = 0;
                      });
                    }
                  }

                  // Increment count
                  aggregatedByX[xKey].count += 1;

                  // Sum numeric values
                  if (yAxisVariables.length > 0) {
                    yAxisVariables.forEach(yVar => {
                      const yValue = row[yVar];
                      if (yValue !== undefined && yValue !== null) {
                        const numValue = Number(yValue);
                        if (!isNaN(numValue)) {
                          aggregatedByX[xKey][yVar] += numValue;
                        }
                      }
                    });
                  }
                });

                // Tambahkan data agregasi grup ini ke hasil
                Object.values(aggregatedByX).forEach(item => {
                  aggregatedData.push(item);
                });
              });

              // Sort data jika diperlukan
              if (selectedChartType === "line" || selectedChartType === "area") {
                aggregatedData.sort((a, b) => {
                  // Group by groupVariable first
                  if (a[groupVariableName] !== b[groupVariableName]) {
                    return String(a[groupVariableName]).localeCompare(String(b[groupVariableName]));
                  }

                  // Then sort by x-axis
                  const aValue = a[primaryXAxis];
                  const bValue = b[primaryXAxis];

                  // If both values can be parsed as dates
                  if (!isNaN(Date.parse(aValue)) && !isNaN(Date.parse(bValue))) {
                    return new Date(aValue).getTime() - new Date(bValue).getTime();
                  }

                  // If both values can be parsed as numbers
                  if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
                    return Number(aValue) - Number(bValue);
                  }

                  // Default to string comparison
                  return String(aValue).localeCompare(String(bValue));
                });
              }

              // Batasi jumlah data jika terlalu banyak
              let finalResult = aggregatedData;

        return {
                data: finalResult,
          xAxisName: primaryXAxis,
          yAxisNames: yAxisVariables.length ? yAxisVariables : ["count"],
                groupName: groupVariableName,
                groupValues: groupValues,
                labelName: labelVariableName || ""
              };
            }
          } else {
            // Tanpa variabel grup - implementasi yang sudah ada
            const aggregatedData: Record<string, any> = {};

            actualData.forEach(row => {
              const xValue = row[primaryXAxis];

              // Skip nilai x yang tidak valid
              if (xValue === undefined || xValue === null || xValue === "") {
                return; // Lanjut ke row berikutnya
              }

              const xKey = String(xValue);

              if (!aggregatedData[xKey]) {
                aggregatedData[xKey] = {
                  [primaryXAxis]: xKey,
                  count: 0
                };

                // Initialize all y-axis values to 0
                if (yAxisVariables.length > 0) {
                  yAxisVariables.forEach(yVar => {
                    aggregatedData[xKey][yVar] = 0;
                  });
                }
              }

              // Increment count
              aggregatedData[xKey].count += 1;

              // Sum numeric values
              if (yAxisVariables.length > 0) {
                yAxisVariables.forEach(yVar => {
                  const yValue = row[yVar];
                  if (yValue !== undefined && yValue !== null) {
                    // Convert to number first
                    const numValue = Number(yValue);
                    if (!isNaN(numValue)) {
                      aggregatedData[xKey][yVar] += numValue;
                    }
                  }
                });
              }
            });

            // Convert to array
            const result = Object.values(aggregatedData);

            // Sort the result by X-axis values if they are dates or numbers
            const sortedResult = [...result].sort((a, b) => {
              const aValue = a[primaryXAxis];
              const bValue = b[primaryXAxis];

              // If both values can be parsed as dates
              if (!isNaN(Date.parse(aValue)) && !isNaN(Date.parse(bValue))) {
                return new Date(aValue).getTime() - new Date(bValue).getTime();
              }

              // If both values can be parsed as numbers
              if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
                return Number(aValue) - Number(bValue);
              }

              // Default to string comparison
              return String(aValue).localeCompare(String(bValue));
            });

            // Batasi jumlah data untuk visualisasi yang lebih baik
            let finalResult = sortedResult;

            // Untuk grafik pie, batasi jumlah data
            if (selectedChartType === "pie" && finalResult.length > 15) {
              // Ambil top 14 value tertinggi berdasarkan y value atau count
              const sortField = yAxisVariables.length > 0 ? yAxisVariables[0] : "count";

              // Pastikan data sudah diurutkan dengan benar sebelum dipotong
              const topItems = [...finalResult]
                .sort((a, b) => {
                  // Pastikan nilai valid untuk perbandingan
                  const valueA = Number(a[sortField]) || 0;
                  const valueB = Number(b[sortField]) || 0;
                  return valueB - valueA; // Sort descending
                })
                .slice(0, 14);

              // Gabungkan sisanya menjadi "Lainnya"
              const otherItems = finalResult.filter(item => !topItems.includes(item));
              if (otherItems.length > 0) {
                const otherItem: Record<string, any> = {
                  [primaryXAxis]: "Lainnya",
                  count: 0
                };

                // Tambahkan semua nilai lainnya
                yAxisVariables.forEach(yVar => {
                  otherItem[yVar] = otherItems.reduce((sum, item) => {
                    const val = Number(item[yVar]) || 0;
                    return sum + val;
                  }, 0);
                });

                // Hitung jumlah total
                otherItem.count = otherItems.reduce((sum, item) => {
                  const val = Number(item.count) || 0;
                  return sum + val;
                }, 0);

                // Tambahkan kategori "Lainnya" hanya jika nilainya > 0
                if (otherItem.count > 0 || (yAxisVariables.length > 0 && otherItem[yAxisVariables[0]] > 0)) {
                  topItems.push(otherItem);
                }
              }

              finalResult = topItems;
            }
            // Untuk grafik batang/garis, batasi jumlah data jika terlalu banyak
            else if (["bar", "line", "stacked-bar", "grouped-bar", "area", "horizontal-bar"].includes(selectedChartType) && finalResult.length > 30) {
              // Untuk grafik batang horizontal, batasi lebih ketat untuk keterbacaan
              const maxItems = selectedChartType === "horizontal-bar" ? 15 : 30;

              // Ambil data sesuai dengan jenis grafik (bar: tertinggi, line/area: berurutan)
              if (["bar", "stacked-bar", "grouped-bar", "horizontal-bar"].includes(selectedChartType)) {
                const sortField = yAxisVariables.length > 0 ? yAxisVariables[0] : "count";
                finalResult = [...finalResult].sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0)).slice(0, maxItems);
              } else {
                // Untuk time series, ambil data dengan interval yang sesuai
                const interval = Math.ceil(finalResult.length / maxItems);
                finalResult = finalResult.filter((_, index) => index % interval === 0);

                // Pastikan data terakhir selalu dimasukkan
                if (finalResult.length > 0 && finalResult[finalResult.length - 1] !== sortedResult[sortedResult.length - 1]) {
                  finalResult.push(sortedResult[sortedResult.length - 1]);
                }
              }
            }

            return {
              data: finalResult,
              xAxisName: primaryXAxis,
              yAxisNames: yAxisVariables.length ? yAxisVariables : ["count"],
              groupName: groupVariableName || "",
              groupValues: groupValues,
              labelName: labelVariableName || ""
            };
          }
        }
        // Untuk grafik yang memerlukan data mentah (seperti scatter)
        else {
          // Process sesuai kebutuhan untuk scatter charts atau jenis lainnya.
          // Implementation sama dengan yang sudah ada, dengan penambahan grouping jika diperlukan.

          // Untuk scatter chart dengan grup
          if (selectedChartType === "scatter" && groupVariableName) {
            // Clean the data for scatter plot with grouping
            const scatterData = actualData
              .filter(row => {
                // Pastikan row memiliki nilai x, grup, dan y yang valid
                if (row[primaryXAxis] === undefined || row[primaryXAxis] === null || row[primaryXAxis] === "") {
                  return false;
                }

                if (row[groupVariableName] === undefined || row[groupVariableName] === null) {
                  return false;
                }

                // Pastikan row memiliki semua nilai y yang diperlukan
                return yAxisVariables.every(yVar => {
                  const val = row[yVar];
                  return val !== undefined && val !== null && !isNaN(Number(val));
                });
              })
              .map(row => {
                const item: Record<string, any> = {};

                // Add X-axis identifier
                item[primaryXAxis] = row[primaryXAxis];

                // Add group identifier
                item[groupVariableName] = row[groupVariableName];

                // Add Y variables as numeric values
                yAxisVariables.forEach(yVar => {
                  const numValue = Number(row[yVar]);
                  item[yVar] = !isNaN(numValue) ? numValue : 0;
                });

                return item;
              });

            return {
              data: scatterData,
              xAxisName: primaryXAxis,
              yAxisNames: yAxisVariables,
              groupName: groupVariableName,
              groupValues: groupValues,
              labelName: labelVariableName || ""
            };
          } else {
            // Implementasi scatter chart yang sudah ada tanpa grup
            const scatterData = actualData
              .filter(row => {
                // Pastikan row memiliki nilai x yang valid
                if (row[primaryXAxis] === undefined || row[primaryXAxis] === null || row[primaryXAxis] === "") {
                  return false;
                }

                // Pastikan row memiliki semua nilai y yang diperlukan
                return yAxisVariables.every(yVar => {
                  const val = row[yVar];
                  return val !== undefined && val !== null && !isNaN(Number(val));
                });
              })
              .map(row => {
                const item: Record<string, any> = {};

                // Add X-axis identifier
                item[primaryXAxis] = row[primaryXAxis];

                // Add Y variables as numeric values
                yAxisVariables.forEach(yVar => {
                  const numValue = Number(row[yVar]);
                  item[yVar] = !isNaN(numValue) ? numValue : 0;
                });

                return item;
              });

            return {
              data: scatterData,
              xAxisName: primaryXAxis || "",
              yAxisNames: yAxisVariables,
              groupName: groupVariableName || "",
              groupValues: groupValues,
              labelName: labelVariableName || ""
            };
          }
        }
      } catch (err) {
        console.error("Error processing chart data:", err);
        return emptyReturn;
      }
    } catch (err) {
      console.error("Error in generateChartData:", err);
      return { data: [], xAxisName: "", yAxisNames: [], groupName: "" };
    }
  }

  // Handle generate chart
  const handleGenerateChart = () => {
    try {
      if (!selectedDataset) {
        toast({
          title: "Error",
          description: "Silakan pilih dataset terlebih dahulu",
          variant: "destructive",
        });
        return;
      }

      if (!selectedXAxisVariables.length) {
        toast({
          title: "Error",
          description: "Silakan pilih minimal satu variabel untuk sumbu X",
          variant: "destructive",
        });
        return;
      }

      if (!selectedChartType) {
        toast({
          title: "Error",
          description: "Silakan pilih jenis grafik",
          variant: "destructive",
        });
        return;
      }

      // Generate chart data
      const data = generateChartData();

      // Validasi khusus untuk grafik lingkaran
      if (selectedChartType === "pie") {
        // Pastikan data memiliki setidaknya 1 item valid untuk chart pie
        const hasValidData = data.data && Array.isArray(data.data) && data.data.length > 0 &&
          data.data.some(item => {
            const fieldName = data.yAxisNames[0] || "count";
            return item[fieldName] > 0;
          });

        if (!hasValidData) {
          toast({
            title: "Peringatan",
            description: "Data tidak cocok untuk grafik lingkaran. Pilih data yang memiliki nilai positif.",
            variant: "destructive",
          });
          return;
        }
      }

      if (data && data.data && Array.isArray(data.data)) {

        // Pastikan state diperbarui dengan benar
        setChartData(data);
        setShowChart(true);
        setActiveTab("chart");

        // Log untuk memastikan componen akan dirender ulang dengan benar
        setTimeout(() => {
          console.log("Current state after update:", {
            showChart,
            activeTab,
            chartType: selectedChartType,
            dataLength: chartData.data?.length || 0
          });
        }, 10);

        toast({
          title: "Berhasil",
          description: `Grafik ${selectedChartType === "grouped-bar" ? "batang berkelompok" : "berhasil"} dibuat`,
        });
      } else {
        console.error("Failed to generate chart data:", data);
        toast({
          title: "Error",
          description: "Gagal membuat grafik. Data tidak valid atau kosong.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error generating chart:", error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat membuat grafik",
        variant: "destructive",
      });
    }
  };

  // Handle download
  const handleDownload = (format: string) => {
    toast({
      title: "Unduh Dimulai",
      description: `Mengunduh grafik sebagai ${format.toUpperCase()}`,
    })
  }

  // Get variable names for display
  const getVariableName = (id: string) => {
    const dimension = dimensions.find((d) => d.id === id)
    if (dimension) return dimension.name

    const measure = measures.find((m) => m.id === id)
    if (measure) return measure.name

    return id
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat dataset...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar - chart options */}
          <div className="w-full lg:w-1/3">
            <div className="sticky top-20">
              <Card>
                <CardHeader>
                  <CardTitle>Pembuat Grafik</CardTitle>
                  <CardDescription>Pilih dataset, variabel, dan jenis grafik untuk visualisasi data</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  {/* Dataset Selection */}
                  <div className="mb-6">
                    <Label htmlFor="dataset-select" className="block text-sm font-medium mb-2">
                      Dataset
                    </Label>
                    <Select value={selectedDatasetId} onValueChange={handleSelectDataset}>
                      <SelectTrigger id="dataset-select" className="w-full">
                        <SelectValue placeholder="Pilih dataset" />
                      </SelectTrigger>
                      <SelectContent>
                        {datasets.map((dataset) => (
                          <SelectItem key={dataset.id} value={dataset.id}>
                            {dataset.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {selectedDataset && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Kategori: {selectedDataset.category.charAt(0).toUpperCase() + selectedDataset.category.slice(1)}
                      </p>
                    )}
                  </div>

                  {selectedDataset && (
                    <div className="space-y-6">
                      <Separator />

                      {/* Step 1: Variable Selection */}
                      {currentStep === "variables" && (
                        <>
                          {/* X-Axis Variable Selection */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <Label className="text-sm font-medium">Variabel Sumbu X (Dimensi)</Label>
                              <Badge
                                variant={selectedXAxisVariables.length === 2 ? "destructive" : "outline"}
                                className="text-xs"
                              >
                                {selectedXAxisVariables.length}/1 dipilih
                                {selectedXAxisVariables.length > 1 && " (tidak didukung)"}
                              </Badge>
                            </div>
                            {selectedXAxisVariables.length > 1 && (
                              <p className="text-xs text-destructive mb-2">
                                Grafik dengan 2 variabel sumbu X belum didukung. Pilih hanya 1 variabel.
                              </p>
                            )}
                            <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto space-y-2">
                              {dimensions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center">Tidak ada dimensi tersedia</p>
                              ) : (
                                dimensions.map((dimension) => (
                                  <div key={dimension.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`x-${dimension.id}`}
                                      checked={selectedXAxisVariables.includes(dimension.id)}
                                      onCheckedChange={() => {
                                        // Jika sudah ada 1 variabel terpilih dan ini variabel baru, tampilkan peringatan
                                        if (!selectedXAxisVariables.includes(dimension.id) && selectedXAxisVariables.length >= 1) {
                                          toast({
                                            title: "Peringatan",
                                            description: "Grafik dengan 2 variabel sumbu X belum didukung. Silakan pilih hanya 1 variabel.",
                                            variant: "destructive",
                                          });
                                        }
                                        handleXAxisVariableToggle(dimension.id);
                                      }}
                                    />
                                    <Label htmlFor={`x-${dimension.id}`} className="text-sm cursor-pointer">
                                      {dimension.name}
                                    </Label>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Y-Axis Variable Selection */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <Label className="text-sm font-medium">Variabel Sumbu Y (Ukuran)</Label>
                              <Badge variant="outline" className="text-xs">
                                {selectedYAxisVariables.length}/5 dipilih
                              </Badge>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-muted-foreground mb-2 flex items-center">
                                    <Info className="h-3 w-3 mr-1" />
                                    Kosongkan untuk menggunakan jumlah data sebagai nilai Y
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-xs">
                                    Jika tidak ada variabel Y yang dipilih, grafik akan menampilkan jumlah data untuk
                                    setiap kategori X
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto space-y-2">
                              {measures.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center">Tidak ada ukuran tersedia</p>
                              ) : (
                                measures.map((measure) => (
                                  <div key={measure.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`y-${measure.id}`}
                                      checked={selectedYAxisVariables.includes(measure.id)}
                                      onCheckedChange={() => handleYAxisVariableToggle(measure.id)}
                                    />
                                    <Label htmlFor={`y-${measure.id}`} className="text-sm cursor-pointer">
                                      {measure.name}
                                    </Label>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Variabel Grup / Warna Selection */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <Label className="text-sm font-medium">Variabel Grup / Warna (Dimensi)</Label>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-muted-foreground mb-2 flex items-center">
                                    <Info className="h-3 w-3 mr-1" />
                                    Pilih variabel dimensi untuk pengelompokan dan pewarnaan dalam grafik
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-xs">
                                    Fitur ini hanya berlaku untuk tipe grafik batang tertentu
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <div className="border rounded-md p-3 max-h-[150px] overflow-y-auto space-y-2">
                              {availableGroupDimensions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center">
                                  Tidak ada dimensi tersedia. Variabel yang sudah dipilih untuk sumbu X atau Y tidak
                                  ditampilkan.
                                </p>
                              ) : (
                                availableGroupDimensions.map((dimension) => (
                                  <div key={dimension.id} className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`group-${dimension.id}`}
                                      checked={selectedGroupVariable === dimension.id}
                                      onCheckedChange={(checked) => {
                                        handleGroupVariableChange(checked ? dimension.id : null)
                                      }}
                                    />
                                    <Label htmlFor={`group-${dimension.id}`} className="text-sm cursor-pointer">
                                      {dimension.name}
                                    </Label>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                          {/* Label di Atas Batang Selection */}
                          <div>
                            <div className="flex justify-between items-center mb-2">
                              <Label className="text-sm font-medium">Label di Atas Batang (Ukuran)</Label>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <p className="text-xs text-muted-foreground mb-2 flex items-center">
                                    <Info className="h-3 w-3 mr-1" />
                                    Pilih variabel ukuran untuk menampilkan nilai di atas batang
                                  </p>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="max-w-xs text-xs">
                                    Fitur ini hanya berlaku untuk tipe grafik batang tertentu
                                  </p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <Select
                              value={selectedLabelVariable || "none"}
                              onValueChange={(value) => handleLabelVariableChange(value === "none" ? null : value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih variabel untuk label" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Tidak ada</SelectItem>
                                {availableLabelMeasures.map((measure) => (
                                  <SelectItem key={measure.id} value={measure.id}>
                                    {measure.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {availableLabelMeasures.length === 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Tidak ada ukuran tersedia. Variabel yang sudah dipilih untuk sumbu X atau Y tidak
                                ditampilkan.
                              </p>
                            )}
                          </div>

                          {/* Proceed to Chart Type Selection Button */}
                          <div>
                            <Button
                              className="w-full bg-primary hover:bg-primary/90"
                              onClick={handleProceedToChartType}
                              disabled={!canProceedToChartType}
                            >
                              Lanjut ke Pemilihan Grafik
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}

                      {/* Step 2: Chart Type Selection */}
                      {currentStep === "chartType" && (
                        <>
                          <div className="mb-4">
                            <Button variant="outline" size="sm" onClick={handleBackToVariables} className="mb-4">
                              &larr; Kembali ke Pemilihan Variabel
                            </Button>

                            <div className="flex items-center justify-between mb-2">
                              <Label className="text-sm font-medium">Jenis Grafik</Label>
                              {recommendedChartTypes.length < chartTypes.length && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <div className="flex items-center text-amber-500">
                                        <Lightbulb className="h-4 w-4 mr-1" />
                                        <span className="text-xs">Rekomendasi</span>
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p className="max-w-xs text-sm">
                                        Jenis grafik yang direkomendasikan berdasarkan variabel yang Anda pilih
                                      </p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                          </div>

                          {/* Chart Type Selection */}
                          {selectedXAxisVariables.length === 2 ? (
                            <div className="p-4 border rounded-md bg-amber-50 text-amber-700">
                              <p className="text-sm">
                                Grafik dengan 2 variabel sumbu X belum didukung saat ini. Silakan kembali dan pilih hanya 1 variabel untuk sumbu X.
                              </p>
                            </div>
                          ) : availableChartTypes.length === 0 ? (
                            <div className="p-4 border rounded-md bg-amber-50 text-amber-700">
                              <p className="text-sm">
                                Tidak ada jenis grafik yang sesuai dengan variabel yang dipilih. Silakan kembali dan
                                sesuaikan pemilihan variabel.
                              </p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-2">
                              {availableChartTypes.map((chartType) => (
                                <div key={chartType.id} className="relative">
                                  <button
                                    type="button"
                                    onClick={() => handleChartTypeSelect(chartType.id)}
                                    className={`w-full p-3 border rounded-md flex flex-col items-center justify-center text-center transition-colors ${
                                      selectedChartType === chartType.id
                                        ? "border-primary bg-primary/5"
                                        : "border-gray-200 hover:border-gray-300"
                                    }`}
                                  >
                                    <chartType.icon className="h-6 w-6 mb-1" />
                                    <span className="text-sm font-medium">{chartType.name}</span>
                                  </button>
                                  {chartType.supportsGrouping && (
                                    <div className="absolute -top-1 -left-1">
                                      <Badge className="bg-blue-500">
                                        <Layers className="h-3 w-3 mr-1" />
                                      </Badge>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {selectedChartType && (
                            <div className="mt-4">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                      <Info className="h-4 w-4 mr-1" />
                                      <span>{chartTypes.find((c) => c.id === selectedChartType)?.description}</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="max-w-xs text-sm">
                                      {chartTypes.find((c) => c.id === selectedChartType)?.recommendedFor}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )}

                          {/* Generate Chart Button */}
                          <div className="mt-6">
                            <Button
                              className="w-full bg-primary hover:bg-primary/90"
                              onClick={handleGenerateChart}
                              disabled={!selectedChartType || selectedXAxisVariables.length === 2}
                            >
                              Buat Grafik
                            </Button>
                            {selectedXAxisVariables.length === 2 && (
                              <p className="text-xs text-destructive mt-2 text-center">
                                Grafik dengan 2 variabel sumbu X belum didukung
                              </p>
                            )}
                          </div>
                        </>
                      )}

                      {/* Selected Variables Summary */}
                      {selectedXAxisVariables.length > 0 && (
                        <div>
                          <h3 className="text-sm font-medium mb-2">Variabel Terpilih</h3>
                          <div className="space-y-2">
                            {selectedXAxisVariables.length > 0 && (
                              <div>
                                <Badge variant="outline" className="mr-2">
                                  Sumbu X
                                </Badge>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedXAxisVariables.map((id) => (
                                    <Badge key={id} variant="secondary" className="text-xs">
                                      {getVariableName(id)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div>
                              <Badge variant="outline" className="mr-2">
                                Sumbu Y
                              </Badge>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {selectedYAxisVariables.length > 0 ? (
                                  selectedYAxisVariables.map((id) => (
                                    <Badge key={id} variant="secondary" className="text-xs">
                                      {getVariableName(id)}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge variant="secondary" className="text-xs">
                                    Jumlah Data (Count)
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {selectedGroupVariable && (
                              <div>
                                <Badge variant="outline" className="mr-2">
                                  Grup / Warna
                                </Badge>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {getVariableName(selectedGroupVariable)}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {selectedLabelVariable && (
                              <div>
                                <Badge variant="outline" className="mr-2">
                                  Label di Atas Batang
                                </Badge>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {getVariableName(selectedLabelVariable)}
                                  </Badge>
                                </div>
                              </div>
                            )}

                            {selectedChartType && (
                              <div>
                                <Badge variant="outline" className="mr-2">
                                  Jenis Grafik
                                </Badge>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {chartTypes.find((c) => c.id === selectedChartType)?.name}
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main content area - chart display */}
          <div className="w-full lg:w-2/3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Visualisasi Data</CardTitle>
                  <CardDescription>
                    {selectedDataset
                      ? `Visualisasi data dari ${selectedDataset.name}`
                      : "Pilih dataset untuk memvisualisasikan data"}
                  </CardDescription>
                </div>

                {showChart && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="border-green-500 text-green-500 hover:bg-green-50">
                        Unduh
                        <ChevronDown className="ml-1 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleDownload("excel")}>
                        <FileSpreadsheet className="mr-2 h-4 w-4" />
                        <span>Excel (CSV)</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload("pdf")}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>PDF</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDownload("image")}>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        <span>Gambar (PNG)</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </CardHeader>
              <CardContent className="p-6">
                {showChart ? (
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                      <TabsTrigger value="chart">Grafik</TabsTrigger>
                      <TabsTrigger value="data">Data</TabsTrigger>
                      <TabsTrigger value="variables">Variabel</TabsTrigger>
                    </TabsList>

                    <TabsContent value="chart">
                      <ChartDisplay
                        data={chartData.data}
                        chartType={selectedChartType}
                        xAxisField={chartData.xAxisName}
                        yAxisFields={chartData.yAxisNames}
                        xAxisLabel={chartData.xAxisName}
                        yAxisLabel="Nilai"
                        groupName={chartData.groupName}
                        groupValues={chartData.groupValues}
                      />
                    </TabsContent>

                    <TabsContent value="data">
                      <div className="border rounded-md overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {selectedXAxisVariables.length > 1
                                  ? "Kombinasi Dimensi"
                                  : getVariableName(selectedXAxisVariables[0])}
                              </th>
                              {chartData.yAxisNames.map((name: string) => (
                                <th
                                  key={name}
                                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                >
                                  {name === "count"
                                    ? "Jumlah Data"
                                    : name.includes("_")
                                      ? `${name.split("_")[0] === "count" ? "Jumlah Data" : name.split("_")[0]} (${name.split("_")[1]})`
                                      : name}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {chartData.data.map((row: any, index: number) => (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                  {row[chartData.xAxisName]}
                                </td>
                                {chartData.yAxisNames.map((name: string) => (
                                  <td key={name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {row[name]?.toLocaleString() || 0}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </TabsContent>

                    <TabsContent value="variables">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium mb-2">Variabel Sumbu X</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedXAxisVariables.map((id) => {
                              const variable = dimensions.find((d) => d.id === id)
                              if (!variable) return null
                              return (
                                <div key={id} className="border rounded-md p-3">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium">{variable.name}</p>
                                    <Badge variant="outline">Dimensi</Badge>
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Tipe Data:{" "}
                                    {variable.dataType === "string"
                                      ? "Teks"
                                      : variable.dataType === "number"
                                        ? "Angka"
                                        : "Tanggal"}
                                  </p>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        <div>
                          <h3 className="text-sm font-medium mb-2">Variabel Sumbu Y</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {selectedYAxisVariables.length > 0 ? (
                              selectedYAxisVariables.map((id) => {
                                const variable = measures.find((m) => m.id === id)
                                if (!variable) return null
                                return (
                                  <div key={id} className="border rounded-md p-3">
                                    <div className="flex items-center justify-between">
                                      <p className="font-medium">{variable.name}</p>
                                      <Badge variant="outline">Ukuran</Badge>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Tipe Data:{" "}
                                      {variable.dataType === "string"
                                        ? "Teks"
                                        : variable.dataType === "number"
                                          ? "Angka"
                                          : "Tanggal"}
                                    </p>
                                  </div>
                                )
                              })
                            ) : (
                              <div className="border rounded-md p-3">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">Jumlah Data (Count)</p>
                                  <Badge variant="outline">Ukuran</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">Tipe Data: Angka</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Menghitung jumlah data untuk setiap kategori pada sumbu X
                                </p>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedGroupVariable && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">Variabel Grup / Warna</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="border rounded-md p-3">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">{getVariableName(selectedGroupVariable)}</p>
                                  <Badge variant="outline">Dimensi</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Digunakan untuk pengelompokan dan pewarnaan dalam grafik
                                </p>
                              </div>
                            </div>
                          </div>
                        )}

                        {selectedLabelVariable && (
                          <div>
                            <h3 className="text-sm font-medium mb-2">Label di Atas Batang</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="border rounded-md p-3">
                                <div className="flex items-center justify-between">
                                  <p className="font-medium">{getVariableName(selectedLabelVariable)}</p>
                                  <Badge variant="outline">Ukuran</Badge>
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                  Digunakan untuk menampilkan nilai di atas batang
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                ) : (
                  <div className="h-[500px] flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Tidak Ada Grafik untuk Ditampilkan</h3>
                      <p className="text-muted-foreground max-w-md">
                        Pilih dataset, variabel sumbu X dan Y, lalu pilih jenis grafik dari panel samping untuk membuat
                        visualisasi.
                      </p>
                    </div>
                  </div>
                )}

                {showChart && selectedDataset && (
                  <div className="text-sm text-muted-foreground mt-4">
                    <p>
                      <strong>Catatan:</strong> Data berasal dari {selectedDataset.name}. Sumber:{" "}
                      {selectedDataset.source || "Tidak diketahui"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
