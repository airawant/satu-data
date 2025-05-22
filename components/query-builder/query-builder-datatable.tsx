"use client"

import { useState, useMemo, useEffect } from "react"
import {
  AlertTriangle,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  ImageIcon,
  Search,
  Check,
  Filter,
  SlidersHorizontal,
  Info,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import type { SortingState } from "@tanstack/react-table"
import { useDatasets, type DatasetVariable } from "@/contexts/dataset-context"
import { useSearchParams } from "next/navigation"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

// Definisikan tipe untuk item konfigurasi tabel
type TableConfigItem = {
  id: string // ID unik untuk konfigurasi
  datasetId: string // ID dataset
  configId?: string // ID konfigurasi tabel
  title: string // Judul tabel/indikator
  description: string // Deskripsi dataset
  category: string // Kategori dataset
  source: string // Sumber dataset
}

// Tipe untuk nilai karakteristik
type CharacteristicValue = {
  id: string
  name: string
  variableId: string
  variableName: string
  type?: string
  values?: string[] // Tambahan property values untuk mengatasi linter error
}

type RowTitleValue = {
  id: string
  name: string
  variableId: string
  variableName: string
  values?: string[] // Tambahan property values untuk mengatasi linter error
}

// Tipe untuk kolom pivot tabel
type PivotColumn = {
  id: string
  name: string
  type: string
  year?: string
  yearDerivative?: string
  characteristicName?: string
  characteristicValue?: string
  aggregationMethod?: string
}

// Tambahkan fungsi helper untuk pengurutan bulan dalam bahasa Indonesia
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

// Tambahkan fungsi untuk memformat turunan tahun dengan pengurutan bulan
const formatYearDerivatives = (uniqueDerivatives: Set<string>): { id: string; name: string }[] => {
  const derivativeArray = Array.from(uniqueDerivatives);

  // Cek apakah ini adalah daftar bulan dalam bahasa Indonesia
  const isIndonesianMonths = derivativeArray.some(val => {
    const lowerVal = val.toLowerCase();
    return ['januari', 'februari', 'maret', 'april', 'mei', 'juni',
           'juli', 'agustus', 'september', 'oktober', 'november', 'desember'].includes(lowerVal);
  });

  // Terapkan pengurutan khusus jika berisi bulan dalam bahasa Indonesia
  const sortedDerivatives = isIndonesianMonths ?
    sortIndonesianMonths(derivativeArray) :
    derivativeArray.sort();

  return sortedDerivatives.map((val) => ({
    id: val,
    name: val
  }));
};

export function QueryBuilderDataTable() {
  const searchParams = useSearchParams()
  const { datasets, loading } = useDatasets()
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("")
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [selectedDataSource, setSelectedDataSource] = useState<string>("all")

  // Variabel untuk field-field yang diperlukan
  const [selectedYears, setSelectedYears] = useState<string[]>([])
  const [availableYears, setAvailableYears] = useState<string[]>([])

  const [selectedYearDerivatives, setSelectedYearDerivatives] = useState<string[]>([])
  const [availableYearDerivatives, setAvailableYearDerivatives] = useState<{ id: string; name: string }[]>([])

  const [availableCharacteristics, setAvailableCharacteristics] = useState<CharacteristicValue[]>([])
  const [selectedCharacteristics, setSelectedCharacteristics] = useState<string[]>([])

  const [availableRowTitles, setAvailableRowTitles] = useState<RowTitleValue[]>([])
  const [selectedRowTitles, setSelectedRowTitles] = useState<string[]>([])

  const [showTable, setShowTable] = useState<boolean>(false)
  const [freezeHeader, setFreezeHeader] = useState<boolean>(true)
  const [sorting, setSorting] = useState<SortingState>([])
  const [tableData, setTableData] = useState<any[]>([])
  const [pivotTableData, setPivotTableData] = useState<any[]>([])
  const [pivotColumns, setPivotColumns] = useState<PivotColumn[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [dataSources, setDataSources] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState<string>("")

  // State untuk menyimpan data yang dipilih
  const [selectedData, setSelectedData] = useState<{
    years: string[]
    yearDerivatives: string[]
    characteristics: string[]
    rowTitles: string[]
  } | null>(null)

  // State untuk menyimpan konfigurasi tabel
  const [tableConfigurations, setTableConfigurations] = useState<TableConfigItem[]>([])
  const [filteredConfigurations, setFilteredConfigurations] = useState<TableConfigItem[]>([])
  const [selectedConfigId, setSelectedConfigId] = useState<string>("")
  // Tambahkan state untuk menyimpan ID konfigurasi tabel yang dipilih
  const [selectedTableConfigId, setSelectedTableConfigId] = useState<string>("")

  const { toast } = useToast()

  // Get the selected dataset
  const selectedDataset = useMemo(() => {
    return datasets.find((d) => d.id === selectedDatasetId)
  }, [datasets, selectedDatasetId])

  // Check if there's a dataset ID in the URL
  useEffect(() => {
    const datasetId = searchParams.get("dataset")
    if (datasetId && !loading) {
      setSelectedDatasetId(datasetId)
    }
  }, [searchParams, loading])

  // Ubah bagian yang menampilkan konfigurasi tabel
  useEffect(() => {
    if (!loading) {
      // Buat daftar konfigurasi tabel dari dataset yang memiliki tableConfigs
      const configs: TableConfigItem[] = []

      datasets.forEach((dataset) => {
        if (dataset.tableConfigs && dataset.tableConfigs.length > 0) {
          // Tambahkan semua konfigurasi dari dataset
          dataset.tableConfigs.forEach((config) => {
            configs.push({
              id: `${dataset.id}_${config.id}`,
              datasetId: dataset.id,
              configId: config.id,
              title: config.titleField || dataset.name,
              description: dataset.description,
              category: dataset.category,
              source: dataset.source,
            })
          })
        } else if (dataset.tableConfig) {
          // Untuk backward compatibility
          configs.push({
            id: `${dataset.id}_config`,
            datasetId: dataset.id,
            configId: dataset.tableConfig.id || "default",
            title: dataset.tableConfig.titleField || dataset.name,
            description: dataset.description,
            category: dataset.category,
            source: dataset.source,
          })
        }
      })

      setTableConfigurations(configs)
    }
  }, [datasets, loading])

  // Extract unique categories from configurations
  useEffect(() => {
    if (tableConfigurations.length > 0) {
      const uniqueCategories = Array.from(new Set(tableConfigurations.map((config) => config.category)))
        .filter((category) => category) // Filter empty categories
        .sort()
      setCategories(["all", ...uniqueCategories])
    } else {
      setCategories(["all"])
    }
  }, [tableConfigurations])

  // Filter data sources based on selected category
  useEffect(() => {
    if (selectedCategory === "all") {
      // Jika kategori "All", tampilkan semua sumber data unik
      const uniqueSources = Array.from(new Set(tableConfigurations.map((config) => config.source)))
        .filter((source) => source) // Filter empty sources
        .sort()
      setDataSources(["all", ...uniqueSources])
    } else if (selectedCategory) {
      // Filter configurations by category
      const configsInCategory = tableConfigurations.filter((config) => config.category === selectedCategory)

      // Extract unique data sources
      const uniqueSources = Array.from(new Set(configsInCategory.map((config) => config.source)))
        .filter((source) => source) // Filter empty sources
        .sort()

      setDataSources(["all", ...uniqueSources])
    } else {
      setDataSources([])
      setFilteredConfigurations([])
    }
  }, [selectedCategory, tableConfigurations])

  // Filter configurations based on category and data source
  useEffect(() => {
    if (tableConfigurations.length > 0) {
      let filtered = [...tableConfigurations]

      // Filter berdasarkan kategori jika bukan "all"
      if (selectedCategory !== "all") {
        filtered = filtered.filter((config) => config.category === selectedCategory)
      }

      // Filter berdasarkan sumber data jika bukan "all"
      if (selectedDataSource !== "all") {
        filtered = filtered.filter((config) => config.source === selectedDataSource)
      }

      setFilteredConfigurations(filtered)
    } else {
      setFilteredConfigurations([])
    }
  }, [selectedCategory, selectedDataSource, tableConfigurations])

  // Filter configurations based on search term
  const displayedConfigurations = useMemo(() => {
    if (!filteredConfigurations.length) return []

    return filteredConfigurations.filter((config) => config.title.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [filteredConfigurations, searchTerm])

  // Ubah handleConfigSelect untuk menyimpan configId
  const handleConfigSelect = (config: TableConfigItem) => {
    // Jika pengguna memilih tabel/indikator yang berbeda, reset semua pilihan
    if (config.id !== selectedConfigId) {
      // Reset nilai tahun, turunan tahun, karakteristik, dan judul baris
      setSelectedYears([])
      setSelectedYearDerivatives([])
      setSelectedCharacteristics([])
      setSelectedRowTitles([])
      // Reset juga table view
      setShowTable(false)
      setPivotTableData([])
      setPivotColumns([])
      // Reset data yang dipilih
      setSelectedData(null)

      // Reset list opsi yang tersedia
      setAvailableYears([])
      setAvailableYearDerivatives([])
      setAvailableCharacteristics([])
      setAvailableRowTitles([])
    }

    setSelectedConfigId(config.id)
    setSelectedDatasetId(config.datasetId)
    setSelectedTableConfigId(config.configId || "") // Tambahkan fallback ke string kosong jika configId undefined
  }

  // Ubah useEffect untuk menggunakan konfigurasi tabel yang dipilih
  useEffect(() => {
    if (selectedDataset && selectedTableConfigId) {
      // Reset semua pilihan
      setSelectedYears([])
      setSelectedYearDerivatives([])
      setSelectedCharacteristics([])
      setSelectedRowTitles([])
      setShowTable(false)

      // Ambil konfigurasi tabel dari API baru
      const fetchTableConfig = async () => {
        try {
          const response = await fetch(`/api/table-configs/${selectedTableConfigId}`);
          if (!response.ok) {
            throw new Error(`Error fetching table config: ${response.statusText}`);
          }

          const tableConfig = await response.json();

          // Sekarang kita memiliki konfigurasi tabel, kita dapat memproses data
          processDataWithTableConfig(tableConfig);
        } catch (error) {
          console.error('Error fetching table config:', error);
          // Jika gagal mengambil konfigurasi tabel, gunakan cara lama
          processDataWithLegacyConfig();
        }
      };

      // Jika ada ID konfigurasi tabel, ambil dari API
      if (selectedTableConfigId) {
        fetchTableConfig();
      } else {
        // Jika tidak ada ID konfigurasi tabel, gunakan cara lama
        processDataWithLegacyConfig();
      }
    } else if (selectedDataset) {
      // Jika tidak ada konfigurasi tabel yang dipilih tapi ada dataset, gunakan cara lama
      processDataWithLegacyConfig();
    } else {
      // Reset semua jika tidak ada dataset yang dipilih
        setAvailableYears([])
      setAvailableYearDerivatives([])
      setAvailableCharacteristics([])
      setAvailableRowTitles([])
    }
  }, [selectedDataset, selectedTableConfigId]);

  // Fungsi untuk memproses data dengan konfigurasi tabel dari API baru
  const processDataWithTableConfig = (tableConfig: any) => {
    // Pastikan dataset ada
    if (!selectedDataset) return;

    // Normalize dataset - handle both 'data' (old) and 'content' (new) property names
    const dataArray = selectedDataset.content || (selectedDataset as any).data || [];

    // Ambil field judul baris dari konfigurasi tabel
    const rowField = tableConfig.row_field;
    // Ambil field karakteristik dari konfigurasi tabel
    const characteristicFields = tableConfig.characteristic_fields || [];

    // Ambil variabel tahun (jika ada)
    const yearVariable = selectedDataset.variables.find((v) => v.name.toLowerCase() === "tahun");
    const yearDerivativeVariable = selectedDataset.variables.find(
      (v) => v.name.toLowerCase().includes("triwulan") ||
             v.name.toLowerCase().includes("semester") ||
             v.name.toLowerCase().includes("bulan")
    );

    // Get unique values for tahun
    if (yearVariable) {
      const uniqueYears = new Set<string>();
      dataArray.forEach((row) => {
        if (row[yearVariable.name] !== undefined &&
            row[yearVariable.name] !== null &&
            row[yearVariable.name] !== "" &&
            String(row[yearVariable.name]) !== "null" &&
            String(row[yearVariable.name]) !== "undefined") {
          uniqueYears.add(row[yearVariable.name].toString());
        }
      });
      setAvailableYears(Array.from(uniqueYears).sort());
    }

    // Get unique values for year derivatives with proper sorting for Indonesian months
    if (yearDerivativeVariable) {
      const uniqueDerivatives = new Set<string>();
      dataArray.forEach((row) => {
        if (row[yearDerivativeVariable.name] !== undefined && row[yearDerivativeVariable.name] !== null) {
          uniqueDerivatives.add(row[yearDerivativeVariable.name].toString());
        }
      });

      // Format untuk UI dengan pengurutan khusus untuk bulan
      const formattedDerivatives = formatYearDerivatives(uniqueDerivatives);

      setAvailableYearDerivatives(formattedDerivatives);
    }

    // Set selected row titles based on the configuration
    const rowVariable = selectedDataset.variables.find((v) => v.name === rowField);
        if (rowVariable) {
      setSelectedRowTitles([rowVariable.name]);

      // Get unique values for this row title
      const uniqueRowValues = new Set<string>();
      dataArray.forEach((row) => {
            if (row[rowVariable.name] !== undefined && row[rowVariable.name] !== null && row[rowVariable.name] !== "") {
          uniqueRowValues.add(row[rowVariable.name].toString());
            }
      });

      const rowValues = Array.from(uniqueRowValues).sort().map((value, index) => ({
              id: `${rowVariable.id}_value_${index}`,
              name: value,
              variableId: rowVariable.id,
        variableName: rowVariable.name
      }));

      setAvailableRowTitles(rowValues);
    }

    // Set selected characteristics based on the configuration
    const characteristicVariables = selectedDataset.variables.filter(
      (v) => characteristicFields.includes(v.name)
    );

    if (characteristicVariables.length > 0) {
      setSelectedCharacteristics(characteristicVariables.map(v => v.name));

      // Get unique values for these characteristics
      const characteristicValues: CharacteristicValue[] = [];

      characteristicVariables.forEach((variable) => {
        const uniqueValues = new Set<string>();
        dataArray.forEach((row) => {
                if (row[variable.name] !== undefined && row[variable.name] !== null && row[variable.name] !== "") {
            uniqueValues.add(row[variable.name].toString());
                }
        });

        const values = Array.from(uniqueValues).sort().map((value, index) => ({
                  id: `${variable.id}_value_${index}`,
                  name: value,
                  variableId: variable.id,
                  variableName: variable.name,
          type: variable.type === "measure" ? "measure" : "count"
        }));

        characteristicValues.push(...values);
      });

      setAvailableCharacteristics(characteristicValues);
    }
  };

  // Fungsi untuk memproses data dengan cara lama (backward compatibility)
  const processDataWithLegacyConfig = () => {
    // Pastikan dataset ada
    if (!selectedDataset) return;

    // Normalize dataset - handle both 'data' (old) and 'content' (new) property names
    const dataArray = selectedDataset.content || (selectedDataset as any).data || [];

    // Get unique values for each dimension
    const dimensionValues: Record<string, string[]> = {}
    const measures: string[] = []
    const measureRanges: Record<string, { min: number; max: number }> = {}

    if (selectedDataset.variables.length > 0) {
      selectedDataset.variables.forEach((variable) => {
        if (variable.selected && variable.name.toLowerCase() === "tahun") {
          const uniqueYears = new Set<string>()
          dataArray.forEach((row) => {
            if (row[variable.name] !== undefined && row[variable.name] !== null) {
              uniqueYears.add(row[variable.name].toString())
            }
          })
          dimensionValues["tahun"] = Array.from(uniqueYears).sort()
        } else if (variable.selected && (variable.name.toLowerCase().includes("triwulan") || variable.name.toLowerCase().includes("semester") || variable.name.toLowerCase().includes("bulan"))) {
          const uniqueYearDerivatives = new Set<string>()
          dataArray.forEach((row) => {
            if (row[variable.name] !== undefined && row[variable.name] !== null) {
              uniqueYearDerivatives.add(row[variable.name].toString())
            }
          })

          // Tentukan apakah ini adalah bulan bahasa Indonesia dan urutkan sesuai
          const derivativeArray = Array.from(uniqueYearDerivatives);
          const isIndonesianMonths = derivativeArray.some(val => {
            const lowerVal = val.toLowerCase();
            return ['januari', 'februari', 'maret', 'april', 'mei', 'juni',
                   'juli', 'agustus', 'september', 'oktober', 'november', 'desember'].includes(lowerVal);
          });

          dimensionValues[variable.name] = isIndonesianMonths ?
            sortIndonesianMonths(derivativeArray) :
            derivativeArray.sort();
        } else if (variable.selected && variable.type === "measure") {
          measures.push(variable.name)
        }
      })
    }

    // Get min/max values for each measure
    if (measures.length > 0) {
      measures.forEach((measure) => {
        let min: number | null = null
        let max: number | null = null

        dataArray.forEach((row) => {
          if (row[measure] !== undefined && row[measure] !== null) {
            const value = Number(row[measure])
            if (!isNaN(value)) {
              if (min === null || value < min) min = value
              if (max === null || value > max) max = value
            }
          }
        })

        measureRanges[measure] = { min: min ?? 0, max: max ?? 0 }
      })
    }

    // Set available years
    const validYears = dimensionValues["tahun"]?.filter(year =>
      year !== null &&
      year !== undefined &&
      year !== "" &&
      year !== "null" &&
      year !== "undefined"
    ) || [];
    setAvailableYears(validYears);

    // Convert string[] to { id: string, name: string }[] for availableYearDerivatives with proper month sorting
    const derivativeFieldName = selectedDataset.variables.find((v) => v.name.toLowerCase().includes("triwulan") || v.name.toLowerCase().includes("semester") || v.name.toLowerCase().includes("bulan"))?.name || ""

    const derivativeValues = dimensionValues[derivativeFieldName] || [];
    const formattedDerivatives = derivativeValues.map((val, idx) => ({
      id: val,
      name: val
    }));

    setAvailableYearDerivatives(formattedDerivatives)
  };

  // Modifikasi handleYearSelect untuk memfilter ulang turunan tahun, karakteristik, dan judul baris
  const handleYearSelect = (year: string) => {
    // Simpan perubahan tahun yang dipilih
    let newSelectedYears: string[];

    if (selectedYears.includes(year)) {
      newSelectedYears = selectedYears.filter((y) => y !== year);
      setSelectedYears(newSelectedYears);
    } else {
      newSelectedYears = [...selectedYears, year];
      setSelectedYears(newSelectedYears);
    }

    // Reset tabel jika sudah ditampilkan
    if (showTable) {
      setShowTable(false);
      setPivotTableData([]);
      setPivotColumns([]);
    }
  }

  // Modifikasi handleYearDerivativeSelect untuk memfilter ulang karakteristik dan judul baris
  const handleYearDerivativeSelect = (derivativeId: string) => {
    // Simpan perubahan turunan tahun yang dipilih
    let newSelectedYearDerivatives: string[];

    if (selectedYearDerivatives.includes(derivativeId)) {
      newSelectedYearDerivatives = selectedYearDerivatives.filter((id) => id !== derivativeId);
      setSelectedYearDerivatives(newSelectedYearDerivatives);
    } else {
      newSelectedYearDerivatives = [...selectedYearDerivatives, derivativeId];
      setSelectedYearDerivatives(newSelectedYearDerivatives);
    }

    // Reset tabel jika sudah ditampilkan
    if (showTable) {
      setShowTable(false);
      setPivotTableData([]);
      setPivotColumns([]);
    }
  }

  // Tambahkan useEffect baru untuk memfilter nilai turunan tahun berdasarkan tahun yang dipilih
  useEffect(() => {
    if (!selectedDataset) return;

    // Normalize dataset - handle both 'data' (old) and 'content' (new) property names
    const dataArray = selectedDataset.content || (selectedDataset as any).data || [];

    // Temukan variabel tahun dan turunan tahun
    const yearVariable = selectedDataset.variables.find((v) => v.name.toLowerCase() === "tahun");
    const yearDerivativeVariable = selectedDataset.variables.find(
      (v) => v.name.toLowerCase().includes("triwulan") ||
             v.name.toLowerCase().includes("semester") ||
             v.name.toLowerCase().includes("bulan")
    );

    if (yearDerivativeVariable && yearVariable) {
      // Filter data berdasarkan tahun yang dipilih
      let filteredData = [...dataArray];

      // Hanya filter jika ada tahun yang dipilih
      if (selectedYears.length > 0) {
        filteredData = filteredData.filter((row) =>
          row &&
          row[yearVariable.name] !== undefined &&
          row[yearVariable.name] !== null &&
          selectedYears.includes(String(row[yearVariable.name]))
        );
      }

      // Dapatkan nilai turunan tahun yang unik dari data yang difilter
      const uniqueDerivatives = new Set<string>();
      filteredData.forEach((row) => {
        if (row && row[yearDerivativeVariable.name] !== undefined && row[yearDerivativeVariable.name] !== null) {
          uniqueDerivatives.add(row[yearDerivativeVariable.name].toString());
        }
      });

      // Format untuk UI dengan pengurutan khusus untuk bulan
      const formattedDerivatives = formatYearDerivatives(uniqueDerivatives);

      setAvailableYearDerivatives(formattedDerivatives);

      // Jika ada pilihan turunan tahun yang tidak lagi tersedia, bersihkan dari pilihan
      if (selectedYearDerivatives.length > 0) {
        const validDerivativeIds = formattedDerivatives.map(d => d.id);
        const newSelectedDerivatives = selectedYearDerivatives.filter(id =>
          validDerivativeIds.includes(id)
        );

        if (newSelectedDerivatives.length !== selectedYearDerivatives.length) {
          setSelectedYearDerivatives(newSelectedDerivatives);

          // Reset tabel jika sudah ditampilkan
          if (showTable) {
            setShowTable(false);
            setPivotTableData([]);
            setPivotColumns([]);
          }
        }
      }
    }
  }, [selectedDataset, selectedYears]);

  // Tambahkan useEffect untuk memfilter karakteristik dan judul baris berdasarkan tahun dan turunan tahun yang dipilih
  useEffect(() => {
    if (!selectedDataset) return;

    // Hanya jalankan jika ada dataset yang dipilih dan setidaknya satu dari tahun atau turunan tahun yang dipilih
    if (selectedYears.length === 0 && selectedYearDerivatives.length === 0) return;

    // Normalize dataset
    const dataArray = selectedDataset.content || (selectedDataset as any).data || [];

    // Temukan variabel tahun dan turunan tahun
    const yearVariable = selectedDataset.variables.find((v) => v.name.toLowerCase() === "tahun");
    const yearDerivativeVariable = selectedDataset.variables.find(
      (v) => v.name.toLowerCase().includes("triwulan") ||
             v.name.toLowerCase().includes("semester") ||
             v.name.toLowerCase().includes("bulan")
    );

    // Filter data berdasarkan tahun dan turunan tahun yang dipilih
    let filteredData = [...dataArray];

    // Filter berdasarkan tahun jika ada yang dipilih
    if (selectedYears.length > 0 && yearVariable) {
      filteredData = filteredData.filter((row) =>
        row &&
        row[yearVariable.name] !== undefined &&
        row[yearVariable.name] !== null &&
        selectedYears.includes(String(row[yearVariable.name]))
      );
    }

    // Filter berdasarkan turunan tahun jika ada yang dipilih
    if (selectedYearDerivatives.length > 0 && yearDerivativeVariable) {
      filteredData = filteredData.filter((row) =>
        row &&
        row[yearDerivativeVariable.name] !== undefined &&
        row[yearDerivativeVariable.name] !== null &&
        selectedYearDerivatives.includes(String(row[yearDerivativeVariable.name]))
      );
    }

    // Proses untuk mendapatkan karakteristik dan judul baris berdasarkan data yang difilter
    if (selectedTableConfigId) {
      // Gunakan konfigurasi tabel untuk mendapatkan karakteristik dan judul baris
      fetch(`/api/table-configs/${selectedTableConfigId}`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Error fetching table config: ${response.statusText}`);
          }
          return response.json();
        })
        .then(tableConfig => {
          updateFilteredCharacteristicsAndRowTitles(filteredData, tableConfig);
        })
        .catch(error => {
          console.error('Error fetching table config for filtering:', error);
          // Jika gagal mengambil konfigurasi, update dengan cara lama
          updateFilteredCharacteristicsAndRowTitlesLegacy(filteredData);
        });
    } else {
      // Jika tidak ada konfigurasi tabel, update dengan cara lama
      updateFilteredCharacteristicsAndRowTitlesLegacy(filteredData);
    }
  }, [selectedDataset, selectedYears, selectedYearDerivatives, selectedTableConfigId]);

  // Tambahkan fungsi helper untuk memperbarui karakteristik dan judul baris berdasarkan konfigurasi tabel
  const updateFilteredCharacteristicsAndRowTitles = (filteredData: any[], tableConfig: any) => {
    if (!selectedDataset) return;

    // Ambil field judul baris dari konfigurasi tabel
    const rowField = tableConfig.row_field;

    // Ambil field karakteristik dari konfigurasi tabel
    const characteristicFields = tableConfig.characteristic_fields || [];

    // Proses judul baris
    const rowVariable = selectedDataset.variables.find((v) => v.name === rowField);
    if (rowVariable) {
      const uniqueRowValues = new Set<string>();

      filteredData.forEach((row) => {
        if (row && row[rowVariable.name] !== undefined && row[rowVariable.name] !== null && row[rowVariable.name] !== "") {
          uniqueRowValues.add(row[rowVariable.name].toString());
        }
      });

      const rowValues = Array.from(uniqueRowValues).sort().map((value, index) => ({
        id: `${rowVariable.id}_value_${index}`,
        name: value,
        variableId: rowVariable.id,
        variableName: rowVariable.name
      }));

      setAvailableRowTitles(rowValues);

      // Perbarui selected row titles jika nilai yang dipilih tidak lagi tersedia
      if (selectedRowTitles.length > 0) {
        const validRowIds = rowValues.map(r => r.id);
        const newSelectedRowTitles = selectedRowTitles.filter(id =>
          !id.includes('_value_') || validRowIds.includes(id)
        );

        if (newSelectedRowTitles.length !== selectedRowTitles.length) {
          setSelectedRowTitles(newSelectedRowTitles);

          // Reset tabel jika sudah ditampilkan
          if (showTable) {
            setShowTable(false);
            setPivotTableData([]);
            setPivotColumns([]);
          }
        }
      }
    }

    // Proses karakteristik
    const characteristicVariables = selectedDataset.variables.filter(
      (v) => characteristicFields.includes(v.name)
    );

    if (characteristicVariables.length > 0) {
      const characteristicValues: CharacteristicValue[] = [];

      characteristicVariables.forEach((variable) => {
        const uniqueValues = new Set<string>();

        filteredData.forEach((row) => {
          if (row && row[variable.name] !== undefined && row[variable.name] !== null && row[variable.name] !== "") {
            uniqueValues.add(row[variable.name].toString());
          }
        });

        const values = Array.from(uniqueValues).sort().map((value, index) => ({
          id: `${variable.id}_value_${index}`,
          name: value,
          variableId: variable.id,
          variableName: variable.name,
          type: variable.type === "measure" ? "measure" : "count"
        }));

        characteristicValues.push(...values);
      });

      setAvailableCharacteristics(characteristicValues);

      // Perbarui selected characteristics jika nilai yang dipilih tidak lagi tersedia
      if (selectedCharacteristics.length > 0) {
        const validCharIds = characteristicValues.map(c => c.id);
        const newSelectedCharacteristics = selectedCharacteristics.filter(id =>
          !id.includes('_value_') || validCharIds.includes(id)
        );

        if (newSelectedCharacteristics.length !== selectedCharacteristics.length) {
          setSelectedCharacteristics(newSelectedCharacteristics);

          // Reset tabel jika sudah ditampilkan
          if (showTable) {
            setShowTable(false);
            setPivotTableData([]);
            setPivotColumns([]);
          }
        }
      }
    }
  };

  // Tambahkan fungsi helper untuk memperbarui karakteristik dan judul baris dengan cara lama
  const updateFilteredCharacteristicsAndRowTitlesLegacy = (filteredData: any[]) => {
    if (!selectedDataset) return;

    // Kumpulkan nilai unik untuk setiap variabel dari data yang difilter
    const uniqueValuesByVariable: Record<string, Set<string>> = {};

    selectedDataset.variables.forEach((variable) => {
      if (variable.selected &&
          variable.name.toLowerCase() !== "tahun" &&
          !variable.name.toLowerCase().includes("triwulan") &&
          !variable.name.toLowerCase().includes("semester") &&
          !variable.name.toLowerCase().includes("bulan")) {

        uniqueValuesByVariable[variable.name] = new Set<string>();

        filteredData.forEach((row) => {
          if (row && row[variable.name] !== undefined && row[variable.name] !== null && row[variable.name] !== "") {
            uniqueValuesByVariable[variable.name].add(row[variable.name].toString());
          }
        });
      }
    });

    // Perbarui karakteristik
    const characteristicValues: CharacteristicValue[] = [];

    selectedDataset.variables.forEach((variable) => {
      if (uniqueValuesByVariable[variable.name]) {
        const values = Array.from(uniqueValuesByVariable[variable.name]).sort();

        values.forEach((value, index) => {
          characteristicValues.push({
            id: `${variable.id}_value_${index}`,
            name: value,
            variableId: variable.id,
            variableName: variable.name,
            type: variable.type === "measure" ? "measure" : "count"
          });
        });
      }
    });

    setAvailableCharacteristics(characteristicValues);

    // Perbarui judul baris
    const rowTitleValues: RowTitleValue[] = [];

    selectedDataset.variables.forEach((variable) => {
      if (uniqueValuesByVariable[variable.name]) {
        const values = Array.from(uniqueValuesByVariable[variable.name]).sort();

        values.forEach((value, index) => {
          rowTitleValues.push({
            id: `${variable.id}_value_${index}`,
            name: value,
            variableId: variable.id,
            variableName: variable.name
          });
        });
      }
    });

    setAvailableRowTitles(rowTitleValues);

    // Perbarui selected values yang tidak lagi tersedia
    if (selectedCharacteristics.length > 0) {
      const validCharIds = characteristicValues.map(c => c.id);
      const newSelectedCharacteristics = selectedCharacteristics.filter(id =>
        !id.includes('_value_') || validCharIds.includes(id)
      );

      if (newSelectedCharacteristics.length !== selectedCharacteristics.length) {
        setSelectedCharacteristics(newSelectedCharacteristics);

        // Reset tabel jika sudah ditampilkan
        if (showTable) {
          setShowTable(false);
          setPivotTableData([]);
          setPivotColumns([]);
        }
      }
    }

    if (selectedRowTitles.length > 0) {
      const validRowIds = rowTitleValues.map(r => r.id);
      const newSelectedRowTitles = selectedRowTitles.filter(id =>
        !id.includes('_value_') || validRowIds.includes(id)
      );

      if (newSelectedRowTitles.length !== selectedRowTitles.length) {
        setSelectedRowTitles(newSelectedRowTitles);

        // Reset tabel jika sudah ditampilkan
        if (showTable) {
          setShowTable(false);
          setPivotTableData([]);
          setPivotColumns([]);
        }
      }
    }
  };

  // Handle select all years
  const handleSelectAllYears = () => {
    if (selectedYears.length === availableYears.length) {
      setSelectedYears([])
    } else {
      setSelectedYears([...availableYears])
    }
  }

  // Handle select all year derivatives
  const handleSelectAllYearDerivatives = () => {
    if (selectedYearDerivatives.length === availableYearDerivatives.length) {
      setSelectedYearDerivatives([])
    } else {
      setSelectedYearDerivatives(availableYearDerivatives.map((d) => d.id))
    }
  }

  // Handle select all characteristics
  const handleSelectAllCharacteristics = () => {
    if (selectedCharacteristics.length === availableCharacteristics.length) {
      setSelectedCharacteristics([])
    } else {
      // Pilih semua ID karakteristik yang tersedia
      const allCharacteristicIds = availableCharacteristics.map(c => c.id);
      setSelectedCharacteristics(allCharacteristicIds);
    }

    // Reset tabel jika sudah ditampilkan
    if (showTable) {
      setShowTable(false);
      setPivotTableData([]);
      setPivotColumns([]);
    }
  }

  // Handle select all row titles
  const handleSelectAllRowTitles = () => {
    if (selectedRowTitles.length === availableRowTitles.length) {
      setSelectedRowTitles([])
    } else {
      // Pilih semua ID judul baris yang tersedia
      const allRowTitleIds = availableRowTitles.map(r => r.id);
      setSelectedRowTitles(allRowTitleIds);
    }

    // Reset tabel jika sudah ditampilkan
    if (showTable) {
      setShowTable(false);
      setPivotTableData([]);
      setPivotColumns([]);
    }
  }

  // Handle characteristic selection
  const handleCharacteristicSelect = (characteristicId: string) => {
    // Cek apakah ID sudah ada dalam seleksi
    if (selectedCharacteristics.includes(characteristicId)) {
      // Jika sudah ada, hapus dari seleksi
      setSelectedCharacteristics(selectedCharacteristics.filter((id) => id !== characteristicId));

      // Reset state tabel jika ada
      if (showTable) {
        setShowTable(false);
        setPivotTableData([]);
        setPivotColumns([]);
      }
    } else {
      // Jika belum ada, tambahkan ke seleksi

      // Periksa apakah ini adalah karakteristik variabel atau nilai
      const isVariableCharacteristic = !characteristicId.includes('_value_');

      if (isVariableCharacteristic) {
        // Jika ini adalah variabel (bukan nilai spesifik), pilih variabel dan hapus semua nilai spesifik dari variabel tersebut
        const characteristic = availableCharacteristics.find(c => c.id === characteristicId);
        if (characteristic) {
          // Cari dan hapus semua nilai spesifik dari variabel yang sama dari seleksi yang ada
          const variableName = characteristic.variableName;
          const newSelectedCharacteristics = selectedCharacteristics.filter(id => {
            const charValue = availableCharacteristics.find(c => c.id === id);
            return !charValue || charValue.variableName !== variableName;
          });

          // Tambahkan variabel ke seleksi
          setSelectedCharacteristics([...newSelectedCharacteristics, characteristicId]);
        } else {
          setSelectedCharacteristics([...selectedCharacteristics, characteristicId]);
        }
      } else {
        // Ini adalah nilai spesifik, tambahkan ke seleksi
        setSelectedCharacteristics([...selectedCharacteristics, characteristicId]);
      }

      // Reset state tabel jika ada
      if (showTable) {
        setShowTable(false);
        setPivotTableData([]);
        setPivotColumns([]);
      }
    }
  }

  // Handle row title selection
  const handleRowTitleSelect = (rowTitleId: string) => {
    // Cek apakah ID sudah ada dalam seleksi
    if (selectedRowTitles.includes(rowTitleId)) {
      // Jika sudah ada, hapus dari seleksi
      setSelectedRowTitles(selectedRowTitles.filter((id) => id !== rowTitleId));

      // Reset state tabel jika ada
      if (showTable) {
        setShowTable(false);
        setPivotTableData([]);
        setPivotColumns([]);
      }
    } else {
      // Jika belum ada, tambahkan ke seleksi

      // Periksa apakah ini adalah judul baris variabel atau nilai
      const isVariableRowTitle = !rowTitleId.includes('_value_');

      if (isVariableRowTitle) {
        // Jika ini adalah variabel (bukan nilai spesifik), pilih variabel dan hapus semua nilai spesifik dari variabel tersebut
        const rowTitle = availableRowTitles.find(r => r.id === rowTitleId);
        if (rowTitle) {
          // Cari dan hapus semua nilai spesifik dari variabel yang sama dari seleksi yang ada
          const variableName = rowTitle.variableName;
          const newSelectedRowTitles = selectedRowTitles.filter(id => {
            const rowValue = availableRowTitles.find(r => r.id === id);
            return !rowValue || rowValue.variableName !== variableName;
          });

          // Tambahkan variabel ke seleksi
          setSelectedRowTitles([...newSelectedRowTitles, rowTitleId]);
        } else {
          setSelectedRowTitles([...selectedRowTitles, rowTitleId]);
        }
      } else {
        // Ini adalah nilai spesifik, tambahkan ke seleksi
        setSelectedRowTitles([...selectedRowTitles, rowTitleId]);
      }

      // Reset state tabel jika ada
      if (showTable) {
        setShowTable(false);
        setPivotTableData([]);
        setPivotColumns([]);
      }
    }
  }

  // Tambahkan fungsi untuk memastikan pengguna telah memilih nilai dengan benar
  const validateSelections = () => {
    // Validasi pilihan judul baris
    if (selectedRowTitles.length === 0) {
      toast({
        title: "Perhatian",
        description: "Silakan pilih minimal satu Judul Baris",
        variant: "destructive",
      });
      return false;
    }

    // Validasi pilihan karakteristik - hanya jika ada karakteristik yang tersedia
    if (availableCharacteristics.length > 0 && selectedCharacteristics.length === 0) {
      toast({
        title: "Perhatian",
        description: "Silakan pilih minimal satu Karakteristik",
        variant: "destructive",
      });
      return false;
    }

    // Validasi pilihan tahun
    if (selectedYears.length === 0) {
      toast({
        title: "Perhatian",
        description: "Silakan pilih minimal satu Tahun",
        variant: "destructive",
      });
      return false;
    }

    // Validasi nilai yang dipilih tersedia dalam dataset
    if (!selectedDataset || !selectedDataset.content || (selectedDataset.content as any[]).length === 0) {
      toast({
        title: "Data Kosong",
        description: "Dataset tidak memiliki data. Pilih dataset lain.",
        variant: "destructive",
      });
      return false;
    }

    // Verifikasi bahwa kombinasi data menghasilkan baris data yang valid
    const dataArray = selectedDataset.content || (selectedDataset as any).data || [];
    const yearVariable = selectedDataset.variables.find((v) => v.name.toLowerCase() === "tahun");

    if (!yearVariable) {
      toast({
        title: "Perhatian",
        description: "Dataset tidak memiliki variabel tahun yang valid.",
        variant: "destructive",
      });
      return false;
    }

    // Filter data berdasarkan tahun yang dipilih
    const filteredByYear = dataArray.filter((row) =>
      row &&
      row[yearVariable.name] !== undefined &&
      row[yearVariable.name] !== null &&
      row[yearVariable.name] !== "" &&
      selectedYears.includes(String(row[yearVariable.name])) &&
      String(row[yearVariable.name]) !== "null" &&
      String(row[yearVariable.name]) !== "undefined"
    );

    if (filteredByYear.length === 0) {
      toast({
        title: "Perhatian",
        description: "Tidak ada data yang tersedia untuk tahun yang dipilih.",
        variant: "destructive",
      });
      return false;
    }

    // Periksa apakah setidaknya satu karakteristik memiliki nilai - hanya jika ada karakteristik yang dipilih
    if (selectedCharacteristics.length > 0) {
    const hasCharacteristicValues = selectedCharacteristics.some(charId => {
      // Cari karakteristik berdasarkan ID
      const characteristic = availableCharacteristics.find(c => c.id === charId);
      return !!characteristic; // Pastikan karakteristik ditemukan
    });

    if (!hasCharacteristicValues) {
      toast({
        title: "Perhatian",
        description: "Tidak ada nilai karakteristik yang tersedia untuk pilihan yang dipilih. Silakan pilih karakteristik lain.",
        variant: "destructive",
      });
      return false;
      }
    }

    // Verifikasi apakah setidaknya satu judul baris memiliki nilai
    const hasRowTitleValues = selectedRowTitles.some(rowId => {
      // Cari judul baris berdasarkan ID
      const rowTitle = availableRowTitles.find(r => r.id === rowId);
      return !!rowTitle; // Pastikan judul baris ditemukan
    });

    if (!hasRowTitleValues) {
      toast({
        title: "Perhatian",
        description: "Tidak ada nilai judul baris yang tersedia untuk pilihan yang dipilih. Silakan pilih judul baris lain.",
        variant: "destructive",
      });
      return false;
    }

    // Verifikasi lebih lanjut bahwa ada data yang dapat ditampilkan
    // berdasarkan kombinasi pilihan karakteristik dan judul baris
    let hasMatchingData = false;
    const selectedCharacteristicNames = new Set<string>();
    const selectedRowTitleNames = new Set<string>();

    // Kumpulkan nama variabel karakteristik dan judul baris yang dipilih
    availableCharacteristics.forEach(char => {
      if (selectedCharacteristics.includes(char.id)) {
        selectedCharacteristicNames.add(char.variableName);
      }
    });

    availableRowTitles.forEach(row => {
      if (selectedRowTitles.includes(row.id)) {
        selectedRowTitleNames.add(row.variableName);
      }
    });

    // Verifikasi setidaknya satu baris memiliki data untuk semua variabel yang dipilih
    for (const row of filteredByYear) {
      let rowMatches = true;

      // Verifikasi karakteristik - hanya jika ada karakteristik yang dipilih
      if (selectedCharacteristicNames.size > 0) {
      for (const charName of selectedCharacteristicNames) {
        // Gunakan type casting untuk mengatasi TypeScript error
        const rowObj = row as Record<string, any>;
        if (rowObj[charName] === undefined || rowObj[charName] === null || rowObj[charName] === "" ||
            String(rowObj[charName]) === "null" || String(rowObj[charName]) === "undefined") {
          rowMatches = false;
          break;
          }
        }
      }

      if (!rowMatches) continue;

      // Verifikasi judul baris
      for (const rowName of selectedRowTitleNames) {
        // Gunakan type casting untuk mengatasi TypeScript error
        const rowObj = row as Record<string, any>;
        if (rowObj[rowName] === undefined || rowObj[rowName] === null || rowObj[rowName] === "" ||
            String(rowObj[rowName]) === "null" || String(rowObj[rowName]) === "undefined") {
          rowMatches = false;
          break;
        }
      }

      if (rowMatches) {
        hasMatchingData = true;
        break;
      }
    }

    if (!hasMatchingData) {
      toast({
        title: "Perhatian",
        description: "Tidak ada data yang tersedia untuk kombinasi tahun, karakteristik, dan judul baris yang dipilih.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  }

  // Tambahkan efek untuk menangani ketika konfigurasi tabel berubah
  useEffect(() => {
    // Ketika pengguna memilih kembali nilai setelah reset
    if (selectedDataset &&
        selectedRowTitles.length > 0 &&
        (availableCharacteristics.length === 0 || selectedCharacteristics.length > 0) &&
        selectedYears.length > 0) {
      // Clear data tabel lama
      setPivotTableData([]);
      setPivotColumns([]);
      setShowTable(false);

      // Hapus pemanggilan setSelectedData karena ini mengakibatkan "Data Terpilih" muncul
      // tanpa perlu klik tombol "Tambah"

      console.log("Data selection updated after configuration change:", {
        years: selectedYears,
        characteristics: selectedCharacteristics,
        rowTitles: selectedRowTitles
      });
    }
  }, [selectedRowTitles, selectedCharacteristics, selectedYears, selectedDataset, availableCharacteristics]);

  // Ubah cara handleAddSelection untuk validasi ulang data
  const handleAddSelection = () => {
    // Validasi pilihan terlebih dahulu
    if (!validateSelections()) {
      return;
    }

    // Log untuk debugging
    console.log("Adding selection with values:", {
      years: selectedYears,
      yearDerivatives: selectedYearDerivatives,
      characteristics: selectedCharacteristics,
      rowTitles: selectedRowTitles,
    });

    // Validasi dataset kosong dipindahkan ke validateSelections()

    setSelectedData({
      years: selectedYears,
      yearDerivatives: selectedYearDerivatives,
      characteristics: selectedCharacteristics,
      rowTitles: selectedRowTitles,
    });

    toast({
      title: "Data Terpilih",
      description: "Data telah ditambahkan ke daftar pilihan. Klik 'Submit' untuk menampilkan tabel.",
    });
  }

  // Ubah fungsi handleReset untuk melakukan reset lebih menyeluruh
  const handleReset = () => {

    // Simpan dataset terlebih dahulu
    const currentDataset = selectedDataset;
    const currentTableConfigId = selectedTableConfigId;

    // Reset semua pilihan dan data
    setSelectedYears([])
    setSelectedYearDerivatives([])
    setSelectedCharacteristics([])
    setSelectedRowTitles([])
    setSelectedData(null)
    setTableData([])
    setPivotTableData([])
    setPivotColumns([])
    setShowTable(false)

    // Delay reload untuk memastikan state sudah ter-reset
    setTimeout(() => {
      // Jangan reset dataset yang dipilih
      if (currentDataset) {

        // Ambil ulang data karakteristik dan judul baris
        try {
          if (currentTableConfigId) {
            // Jika ada konfigurasi tabel, gunakan API
            fetch(`/api/table-configs/${currentTableConfigId}`)
              .then(response => {
          if (!response.ok) {
            throw new Error(`Error fetching table config: ${response.statusText}`);
                }
                return response.json();
              })
              .then(tableConfig => {
                if (tableConfig) {
                  processDataWithTableConfig(tableConfig);
                } else {
                  console.warn("Empty table config, falling back to legacy mode");
                  processDataWithLegacyConfig();
                }
              })
              .catch(error => {
                console.error('Error fetching table config after reset:', error);
                processDataWithLegacyConfig();
              });
          } else {
            processDataWithLegacyConfig();
          }

          // Tampilkan pesan konfirmasi reset
          toast({
            title: "Reset Berhasil",
            description: "Semua pilihan telah direset. Silakan pilih karakteristik dan judul baris lagi.",
          });
        } catch (error) {
          console.error("Error during reset:", error);
          toast({
            title: "Error",
            description: "Terjadi kesalahan saat mereset pilihan. Silakan muat ulang halaman.",
            variant: "destructive",
          });
        }
      }
    }, 100);
  }

  // Tambahkan fungsi untuk menyegarkan data
  const regenerateTableData = async () => {
    if (!selectedDataset) return;

    console.log("Regenerating table data...");
    console.log("Selected Years:", selectedYears);
    console.log("Selected Characteristics:", selectedCharacteristics);
    console.log("Selected Row Titles:", selectedRowTitles);

    // Kosongkan data tabel yang ada
    setPivotTableData([]);
    setPivotColumns([]);

    // Jika tidak ada pilihan yang cukup, hentikan
    if (selectedYears.length === 0 ||
        (availableCharacteristics.length > 0 && selectedCharacteristics.length === 0) ||
        selectedRowTitles.length === 0) {
        return;
      }

    try {
      // Ambil konfigurasi tabel kembali jika perlu
      if (selectedTableConfigId) {
        await fetchSelectedTableConfig();
      }

      // Hapus pemanggilan setSelectedData karena ini mengakibatkan "Data Terpilih" muncul
      // tanpa perlu klik tombol "Tambah"
      } catch (error) {
      console.error("Error regenerating table data:", error);
    }
  };

  // Tambahkan efek untuk menyegarkan data saat pilihan berubah
  useEffect(() => {
    // Jangan jalankan saat pertama kali render atau tidak ada dataset
    if (!selectedDataset) return;

    // Jika sudah ada data yang ditampilkan dan kemudian pilihan berubah
    if (showTable) {
      // Sembunyikan tabel saat ini karena data akan berubah
      setShowTable(false);
    }
  }, [selectedYears, selectedCharacteristics, selectedRowTitles]);

  // Fungsi untuk menghasilkan data pivot tabel dengan konfigurasi dari API
  const generatePivotTableWithConfig = (
    tableConfig: any,
    dataArray: any[],
    yearVariable: DatasetVariable
  ) => {

    // Periksa konfigurasi tabel valid
    if (!tableConfig) {
      console.error("Invalid table config");
      return { data: [], columns: [] };
    }

    // Temukan variabel turunan tahun
    const yearDerivativeVariable = selectedDataset?.variables.find(
      (v) => v.name.toLowerCase().includes("triwulan") ||
             v.name.toLowerCase().includes("semester") ||
             v.name.toLowerCase().includes("bulan")
    );

    // Filter data based on selected years - pastikan setiap row valid sebelum memfilter
    let filteredData = dataArray.filter((row) =>
      row && // pastikan row tidak null/undefined
      row[yearVariable.name] !== undefined &&
      row[yearVariable.name] !== null &&
      row[yearVariable.name] !== "" &&
      selectedYears.includes(String(row[yearVariable.name])) &&
      String(row[yearVariable.name]) !== "null" &&
      String(row[yearVariable.name]) !== "undefined"
    );

    // Filter berdasarkan turunan tahun jika dipilih
    if (yearDerivativeVariable && selectedYearDerivatives.length > 0) {
      filteredData = filteredData.filter((row) =>
        row &&
        row[yearDerivativeVariable.name] !== undefined &&
        row[yearDerivativeVariable.name] !== null &&
        row[yearDerivativeVariable.name] !== "" &&
        selectedYearDerivatives.includes(String(row[yearDerivativeVariable.name]))
      );
    }

    if (filteredData.length === 0) {
      console.warn("No data after filtering by selected years and/or year derivatives");
      toast({
        title: "Tidak Ada Data",
        description: "Tidak ada data yang sesuai dengan tahun dan turunan tahun yang dipilih.",
        variant: "destructive",
      });
      return { data: [], columns: [] };
    }

    // Get aggregation method from dataset configuration
    const aggregationMethod = tableConfig.aggregation_method || 'sum';

    // Buat struktur data untuk judul baris dari konfigurasi
    const rowField = tableConfig.row_field;
    if (!rowField) {
      console.error("No row field specified in table config");
      toast({
        title: "Konfigurasi Tidak Valid",
        description: "Tidak ada field judul baris yang ditentukan dalam konfigurasi tabel.",
        variant: "destructive",
      });
      return { data: [], columns: [] };
    }

    const rowVariable = selectedDataset?.variables.find((v) => v.name === rowField);
    if (!rowVariable) {
      console.error(`Row field '${rowField}' not found in dataset variables`);
      toast({
        title: "Konfigurasi Tidak Valid",
        description: `Field judul baris '${rowField}' tidak ditemukan dalam variabel dataset.`,
        variant: "destructive",
      });
      return { data: [], columns: [] };
    }

    // Membuat pemetaan antara ID judul baris yang dipilih dan nilai aktualnya
    const selectedRowTitleMap = new Map<string, boolean>();
    selectedRowTitles.forEach(selectedId => {
      selectedRowTitleMap.set(selectedId, true);
    });

    // Membuat array dengan nama variabel judul baris yang sudah dipilih
    const selectedRowVariableNames = selectedRowTitles
      .filter(id => !id.includes('_value_')) // Ambil hanya variabel, bukan nilai spesifik
      .map(id => {
        const variable = selectedDataset?.variables.find(v => v.id === id || v.name === id);
        return variable?.name;
      })
      .filter(Boolean) as string[];

    const rowTitlesByVariable: Record<string, RowTitleValue[]> = {};
    rowTitlesByVariable[rowVariable.name] = [];

    // Get unique row title values - dengan penanganan null/undefined
    const uniqueRowValues = new Set<string>();
    filteredData.forEach((row) => {
      if (row && row[rowVariable.name] !== undefined && row[rowVariable.name] !== null && row[rowVariable.name] !== "") {
        uniqueRowValues.add(String(row[rowVariable.name]));
      }
    });

    // Format row title values
    Array.from(uniqueRowValues).sort().forEach((value, index) => {
      const rowTitleId = `${rowVariable.id}_value_${index}`;

      // Periksa apakah nilai judul baris ini dipilih pengguna
      // Jika tidak ada nilai judul baris yang dipilih secara spesifik, tampilkan semua nilai untuk variabel yang dipilih
      const specificValueSelected = selectedRowTitleMap.has(rowTitleId);
      const isVariableSelected = selectedRowVariableNames.includes(rowVariable.name) ||
                               selectedRowTitles.includes(rowVariable.id) ||
                               selectedRowTitles.includes(rowVariable.name);
      const showAllValues = isVariableSelected &&
                          selectedRowTitles.filter(id => id.includes('_value_') &&
                                                id.startsWith(`${rowVariable.id}_value_`)).length === 0;

      if (specificValueSelected || showAllValues) {
      rowTitlesByVariable[rowVariable.name].push({
          id: rowTitleId,
        name: value,
        variableId: rowVariable.id,
        variableName: rowVariable.name,
      });
      }
    });

    // Periksa apakah ada judul baris yang ditemukan
    if (Object.keys(rowTitlesByVariable).length === 0 ||
        Object.values(rowTitlesByVariable).every(values => values.length === 0)) {
      console.warn("No row title values found in filtered data");
      toast({
        title: "Tidak Ada Data",
        description: "Tidak ada nilai judul baris yang cocok dengan filter yang dipilih.",
        variant: "destructive",
      });
      return { data: [], columns: [] };
    }

    // Buat struktur data untuk karakteristik dari konfigurasi
    const characteristicFields = Array.isArray(tableConfig.characteristic_fields) ?
      tableConfig.characteristic_fields : [];

    // Jika tidak ada field karakteristik, buat kolom kosong untuk karakteristik
    // agar tabel tetap bisa ditampilkan
    const characteristicsByVariable: Record<string, CharacteristicValue[]> = {};

    if (characteristicFields.length === 0) {
      console.warn("No characteristic fields found in table config");
      // Buat karakteristik dummy jika tidak ada karakteristik yang dikonfigurasi
      characteristicsByVariable["_dummy_characteristic"] = [{
        id: "_dummy_characteristic_value",
        name: "Nilai",
        variableId: "_dummy",
        variableName: "_dummy_characteristic",
        type: "count"
      }];
    } else {
    const characteristicVariables = selectedDataset?.variables.filter((v) =>
      characteristicFields.includes(v.name)
    ) || [];

    // Membuat pemetaan antara ID karakteristik yang dipilih dan nilai aktualnya
    const selectedCharacteristicMap = new Map<string, boolean>();
    selectedCharacteristics.forEach(selectedId => {
      selectedCharacteristicMap.set(selectedId, true);
    });

    // Membuat array dengan nama variabel yang sudah dipilih
    const selectedVariableNames = selectedCharacteristics
      .filter(id => !id.includes('_value_')) // Ambil hanya variabel, bukan nilai spesifik
      .map(id => {
        const variable = characteristicVariables.find(v => v.id === id || v.name === id);
        return variable?.name;
      })
      .filter(Boolean) as string[];

    // Jika tidak ada variabel karakteristik yang dipilih secara eksplisit, gunakan semua variabel yang tersedia
    if (selectedVariableNames.length === 0 && characteristicVariables.length > 0) {

      // Periksa apakah ada id yang mungkin cocok dengan format nilai karakteristik
      const valueSelections = selectedCharacteristics.filter(id => id.includes('_value_'));

      if (valueSelections.length > 0) {
        // Ambil variabel dari karakteristik nilai yang dipilih
        const valueVariables = new Set<string>();

        for (const valueId of valueSelections) {
          // Coba cocokkan dengan karakteristik dalam availableCharacteristics
          const characteristic = availableCharacteristics.find(c => c.id === valueId);
          if (characteristic?.variableName) {
            valueVariables.add(characteristic.variableName);
          }
        }

        // Tambahkan variabel tersebut ke selectedVariableNames
        characteristicVariables
          .filter(v => valueVariables.has(v.name))
          .forEach(v => {
            if (!selectedVariableNames.includes(v.name)) {
              selectedVariableNames.push(v.name);
            }
          });
      }

      // Jika masih kosong, gunakan semua variabel karakteristik
      if (selectedVariableNames.length === 0) {
        characteristicVariables.forEach(v => {
          selectedVariableNames.push(v.name);
        });
      }
    }

    characteristicVariables.forEach((variable) => {
      // Periksa apakah variabel ini dipilih pengguna
      const isVariableSelected = selectedVariableNames.includes(variable.name) ||
                               selectedCharacteristics.includes(variable.id) ||
                               selectedCharacteristics.includes(variable.name);

      if (!isVariableSelected) {
        return; // Skip variabel yang tidak dipilih
      }

      characteristicsByVariable[variable.name] = [];

      // Get unique characteristic values
      const uniqueValues = new Set<string>();
      filteredData.forEach((row) => {
        if (row && row[variable.name] !== undefined && row[variable.name] !== null && row[variable.name] !== "") {
          uniqueValues.add(String(row[variable.name]));
        }
      });

      // Jika tidak ada nilai unik, tampilkan pesan warning tapi tetap lanjutkan
      if (uniqueValues.size === 0) {
        console.warn(`No unique values found for characteristic variable: ${variable.name}`);
        // Tambahkan placeholder untuk menghindari array kosong
        characteristicsByVariable[variable.name].push({
          id: `${variable.id}_placeholder`,
          name: "Tidak ada nilai",
          variableId: variable.id,
          variableName: variable.name,
          type: variable.type === "measure" ? "measure" : "count",
        });
        return;
      }

      // Format characteristic values
      Array.from(uniqueValues).sort().forEach((value, index) => {
        const characteristicId = `${variable.id}_value_${index}`;

        // Periksa apakah nilai karakteristik ini dipilih pengguna
        // Jika tidak ada nilai karakteristik yang dipilih secara spesifik, tampilkan semua nilai untuk variabel yang dipilih
        const specificValueSelected = selectedCharacteristicMap.has(characteristicId);
        const showAllValues = isVariableSelected &&
                            selectedCharacteristics.filter(id => id.includes('_value_') &&
                                                      id.startsWith(`${variable.id}_value_`)).length === 0;

        if (specificValueSelected || showAllValues) {
          characteristicsByVariable[variable.name].push({
            id: characteristicId,
            name: value,
            variableId: variable.id,
            variableName: variable.name,
            type: variable.type === "measure" ? "measure" : "count",
          });
        }
      });

      // Jika setelah filter tidak ada nilai yang sesuai, tambahkan semua nilai
      if (characteristicsByVariable[variable.name].length === 0) {
        console.warn(`No matching values found for characteristic variable: ${variable.name}, adding all values`);
        Array.from(uniqueValues).sort().forEach((value, index) => {
          characteristicsByVariable[variable.name].push({
            id: `${variable.id}_value_${index}`,
            name: value,
            variableId: variable.id,
            variableName: variable.name,
            type: variable.type === "measure" ? "measure" : "count",
          });
        });
      }
    });

    // Periksa apakah ada karakteristik yang ditemukan
    if (Object.keys(characteristicsByVariable).length === 0) {
      console.warn("No characteristic values found in filtered data");

      // Jika tidak ada karakteristik yang ditemukan, tetapi ada variabel karakteristik, coba gunakan semua
      if (characteristicVariables.length > 0) {

        characteristicVariables.forEach((variable) => {
          characteristicsByVariable[variable.name] = [];

          // Get unique characteristic values
          const uniqueValues = new Set<string>();
          filteredData.forEach((row) => {
            if (row && row[variable.name] !== undefined && row[variable.name] !== null && row[variable.name] !== "") {
              uniqueValues.add(String(row[variable.name]));
            }
          });

          // Format characteristic values
          Array.from(uniqueValues).sort().forEach((value, index) => {
            characteristicsByVariable[variable.name].push({
              id: `${variable.id}_value_${index}`,
              name: value,
              variableId: variable.id,
              variableName: variable.name,
              type: variable.type === "measure" ? "measure" : "count",
            });
          });
        });

        console.log("After fallback to all characteristics:", characteristicsByVariable);

          // Jika masih kosong, kembalikan error
          if (Object.keys(characteristicsByVariable).length === 0) {
            console.warn("No characteristics found, creating dummy characteristic");
            // Buat karakteristik dummy jika tidak ada karakteristik yang tersedia
            characteristicsByVariable["_dummy_characteristic"] = [{
              id: "_dummy_characteristic_value",
              name: "Nilai",
              variableId: "_dummy",
              variableName: "_dummy_characteristic",
              type: "count"
            }];
        }
      } else {
          // Buat karakteristik dummy jika tidak ada karakteristik yang tersedia
          characteristicsByVariable["_dummy_characteristic"] = [{
            id: "_dummy_characteristic_value",
            name: "Nilai",
            variableId: "_dummy",
            variableName: "_dummy_characteristic",
            type: "count"
          }];
        }
      }
    }

    // Create pivot table columns
    const pivotColumns: PivotColumn[] = [];

    // Add row title columns
    Object.keys(rowTitlesByVariable).forEach((variableName) => {
      pivotColumns.push({
        id: variableName,
        name: variableName,
        type: "rowTitle",
      });
    });

    // Add characteristic columns for each year and year derivative
    const characteristicValueColumns: PivotColumn[] = [];

    // Temukan semua turunan tahun yang telah difilter
    const yearDerivativeValues = yearDerivativeVariable && selectedYearDerivatives.length > 0 ?
      selectedYearDerivatives :
      [""];  // Gunakan array dengan string kosong jika tidak ada turunan tahun

    selectedYears.forEach((year) => {
      // Skip null or undefined years
      if (!year || year === "null" || year === "undefined") return;

      yearDerivativeValues.forEach((derivative) => {
      Object.keys(characteristicsByVariable).forEach((variableName) => {
        const characteristicValues = characteristicsByVariable[variableName];

        if (!characteristicValues || characteristicValues.length === 0) {
          return; // Skip if no characteristic values
        }

        characteristicValues.forEach((characteristic) => {
            const columnId = derivative ?
              `${year}_${derivative}_${variableName}_${characteristic.name}` :
              `${year}_${variableName}_${characteristic.name}`;

          characteristicValueColumns.push({
              id: columnId,
            name: characteristic.name,
            year,
              yearDerivative: derivative || undefined,
            characteristicName: variableName,
            characteristicValue: characteristic.name,
            type: characteristic.type || "count",
            aggregationMethod,
            });
          });
        });
      });
    });

    // Sort characteristic columns by year and name
    characteristicValueColumns.sort((a, b) => {
      if (a.year !== b.year) {
        return (a.year || '').localeCompare(b.year || '');
      }
      if (a.characteristicName !== b.characteristicName) {
        return (a.characteristicName || '').localeCompare(b.characteristicName || '');
      }
      return (a.characteristicValue || '').localeCompare(b.characteristicValue || '');
    });

    // Add characteristic columns to pivot columns
    pivotColumns.push(...characteristicValueColumns);

    // Generate pivot table data
    const pivotData: any[] = [];

    // Generate all possible combinations of row title values
    const rowCombinations: Record<string, string>[] = [];

    const generateCombinations = (
      variables: string[],
      currentIndex: number,
      currentCombination: Record<string, string>,
    ) => {
      if (currentIndex === variables.length) {
        rowCombinations.push({ ...currentCombination });
        return;
      }

      const variableName = variables[currentIndex];
      const values = rowTitlesByVariable[variableName];

      if (!values || values.length === 0) {
        // Skip if no values for this variable
        generateCombinations(variables, currentIndex + 1, currentCombination);
        return;
      }

      values.forEach((value) => {
        currentCombination[variableName] = value.name;
        generateCombinations(variables, currentIndex + 1, currentCombination);
      });
    };

    // Generate combinations for row titles
    generateCombinations(Object.keys(rowTitlesByVariable), 0, {});

    if (rowCombinations.length === 0) {
      console.warn("No row combinations generated");
      return { data: [], columns: [] };
    }

    // For each row combination, calculate cell values
    rowCombinations.forEach((combination) => {
      const dataRow: Record<string, any> = { ...combination };
      let rowTotal = 0; // Inisialisasi total baris

      // For each characteristic column, calculate the value
      characteristicValueColumns.forEach((column) => {
        const { year, yearDerivative, characteristicName, characteristicValue } = column;

        if (!year || !characteristicName || !characteristicValue) {
          console.warn("Missing column properties", column);
          dataRow[column.id] = 0;
          return;
        }

        // Jika ini adalah karakteristik dummy, gunakan nilai default
        if (characteristicName === "_dummy_characteristic") {
          // Hitung jumlah baris yang cocok dengan kombinasi baris saat ini
          // dan tahun yang dipilih
          const matchingRows = filteredData.filter((row) => {
            if (!row) return false; // Skip invalid rows

            // Skip if row doesn't have year data
            const yearVal = row[yearVariable.name];
            if (yearVal === undefined || yearVal === null || String(yearVal) !== year) return false;

            // Filter by year derivative if specified
            if (yearDerivative && yearDerivativeVariable) {
              const derivativeVal = row[yearDerivativeVariable.name];
              if (derivativeVal === undefined || derivativeVal === null || String(derivativeVal) !== yearDerivative) return false;
            }

            // Check if row matches the current combination
            return Object.keys(combination).every((variable) => {
              const rowVal = row[variable];
              return rowVal !== undefined && rowVal !== null && String(rowVal) === combination[variable];
            });
          });

          if (aggregationMethod === "count") {
            dataRow[column.id] = matchingRows.length;
          } else if (aggregationMethod === "sum" || aggregationMethod === "average") {
            // Untuk sum dan average, gunakan jumlah baris sebagai nilai
            dataRow[column.id] = matchingRows.length;
          }

          rowTotal += dataRow[column.id];
          return;
        }

        // Filter data for this year, year derivative, and row combination - dengan penanganan null/undefined
        const filteredRows = filteredData.filter((row) => {
          if (!row) return false; // Skip invalid rows

          // Skip if row doesn't have year data
          const yearVal = row[yearVariable.name];
          if (yearVal === undefined || yearVal === null || String(yearVal) !== year) return false;

          // Filter by year derivative if specified
          if (yearDerivative && yearDerivativeVariable) {
            const derivativeVal = row[yearDerivativeVariable.name];
            if (derivativeVal === undefined || derivativeVal === null || String(derivativeVal) !== yearDerivative) return false;
          }

          // Check if row matches the current combination
          if (!Object.keys(combination).every((variable) => {
            const rowVal = row[variable];
            return rowVal !== undefined && rowVal !== null && String(rowVal) === combination[variable];
          })) {
            return false;
          }

          // Check if row matches the characteristic value
          const characteristicVal = row[characteristicName];
          return characteristicVal !== undefined && characteristicVal !== null &&
                 String(characteristicVal) === characteristicValue;
        });

        let cellValue = 0;

        if (aggregationMethod === "count") {
          // Count rows
          cellValue = filteredRows.length;
        } else if (aggregationMethod === "sum") {
          // Sum values - pastikan hanya nilai numerik yang dijumlahkan
          cellValue = filteredRows.reduce((acc, row) => {
            if (!row) return acc; // Skip invalid rows

            // Get value safely
            const rawValue = row[characteristicName];
            let value = 0;

            if (rawValue !== undefined && rawValue !== null) {
              const parsed = Number.parseFloat(String(rawValue));
              value = isNaN(parsed) ? 0 : parsed;
            }

            return acc + value;
          }, 0);
        } else if (aggregationMethod === "average") {
          // Average values - pastikan hanya nilai numerik yang dihitung
          const values = filteredRows
            .map((row) => {
              if (!row) return NaN; // Skip invalid rows

              const rawValue = row[characteristicName];
              if (rawValue === undefined || rawValue === null) return NaN;

              const parsed = Number.parseFloat(String(rawValue));
              return isNaN(parsed) ? NaN : parsed;
            })
            .filter((val) => !isNaN(val));

          cellValue = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        }

        // Add cell value to data row
        dataRow[column.id] = cellValue;

        // Tambahkan nilai ke total baris
        rowTotal += cellValue;
      });

      // Tambahkan total baris ke data row
      dataRow["row_total"] = rowTotal;

      // Add data row to pivot data
      pivotData.push(dataRow);
    });

    // Tambahkan baris total kolom
    if (pivotData.length > 0) {
      const totalRow: Record<string, any> = {};

      // Set nilai untuk kolom judul baris
      pivotColumns
        .filter(col => col.type === "rowTitle")
        .forEach(column => {
          totalRow[column.name] = "Total";
        });

      // Hitung total untuk setiap kolom karakteristik
      characteristicValueColumns.forEach(column => {
        const columnTotal = pivotData.reduce((sum, row) => {
          const value = row[column.id];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);

        totalRow[column.id] = columnTotal;
      });

      // Hitung total keseluruhan
      const grandTotal = pivotData.reduce((sum, row) => {
        const rowTotal = row["row_total"];
        return sum + (typeof rowTotal === 'number' ? rowTotal : 0);
      }, 0);

      totalRow["row_total"] = grandTotal;

      // Tambahkan baris total ke data pivot
      pivotData.push(totalRow);
    }

    // Tambahkan kolom total ke pivotColumns jika belum ada
    if (!pivotColumns.some(col => col.type === "total")) {
    pivotColumns.push({
      id: "row_total",
      name: "Total",
        type: "total"
      });
    }

    console.log("Generated pivot data:", pivotData.length, "rows with", pivotColumns.length, "columns");
    return { data: pivotData, columns: pivotColumns };
  };

  // Fungsi untuk menghasilkan data pivot tabel dengan cara lama (backward compatibility)
  const generatePivotTableLegacy = (dataArray: any[], yearVariable: DatasetVariable) => {

    // Temukan variabel turunan tahun
    const yearDerivativeVariable = selectedDataset?.variables.find(
      (v) => v.name.toLowerCase().includes("triwulan") ||
             v.name.toLowerCase().includes("semester") ||
             v.name.toLowerCase().includes("bulan")
    );

    // Filter data based on selected years - pastikan setiap row valid sebelum memfilter
    let filteredData = dataArray.filter((row) =>
      row && // pastikan row tidak null/undefined
      row[yearVariable.name] !== undefined &&
      row[yearVariable.name] !== null &&
      row[yearVariable.name] !== "" &&
      selectedYears.includes(String(row[yearVariable.name])) &&
      String(row[yearVariable.name]) !== "null" &&
      String(row[yearVariable.name]) !== "undefined"
    );

    // Filter berdasarkan turunan tahun jika dipilih
    if (yearDerivativeVariable && selectedYearDerivatives.length > 0) {
      filteredData = filteredData.filter((row) =>
        row &&
        row[yearDerivativeVariable.name] !== undefined &&
        row[yearDerivativeVariable.name] !== null &&
        row[yearDerivativeVariable.name] !== "" &&
        selectedYearDerivatives.includes(String(row[yearDerivativeVariable.name]))
      );
    }

    if (filteredData.length === 0) {
      console.warn("No data after filtering by selected years and/or year derivatives in legacy mode");
      toast({
        title: "Tidak Ada Data",
        description: "Tidak ada data yang sesuai dengan tahun dan turunan tahun yang dipilih.",
        variant: "destructive",
      });
      return { data: [], columns: [] };
    }

    // Get aggregation method from dataset configuration
    const aggregationMethod = selectedDataset?.tableConfig?.aggregationMethod || "sum";

    // Membuat pemetaan antara ID judul baris yang dipilih dan nilai aktualnya
    const selectedRowTitleMap = new Map<string, boolean>();
    selectedRowTitles.forEach(selectedId => {
      selectedRowTitleMap.set(selectedId, true);
    });

    // Membuat array dengan nama variabel judul baris yang sudah dipilih
    const selectedRowVariableNames = selectedRowTitles
      .filter(id => !id.includes('_value_')) // Ambil hanya variabel, bukan nilai spesifik
      .map(id => {
        const variable = availableRowTitles.find(r => r.id === id);
        return variable?.variableName;
      })
      .filter(Boolean) as string[];

    // Get row titles by variable
    const rowTitlesByVariable: Record<string, RowTitleValue[]> = {};
    selectedRowTitles.forEach((rowTitleId) => {
      // Periksa apakah ini adalah ID variabel atau ID nilai judul baris
      if (rowTitleId.includes('_value_')) {
        // Ini adalah ID nilai judul baris spesifik
        const rowTitleValue = availableRowTitles.find(r => r.id === rowTitleId);
        if (rowTitleValue) {
          const varName = rowTitleValue.variableName;
          if (!rowTitlesByVariable[varName]) {
            rowTitlesByVariable[varName] = [];
          }
          rowTitlesByVariable[varName].push(rowTitleValue);
        }
      } else {
        // Ini adalah nama variabel - ambil semua nilai untuk variabel ini
        const variableValues = availableRowTitles.filter(r =>
          r.variableName === rowTitleId || r.variableId === rowTitleId);

        if (variableValues.length > 0) {
          const varName = variableValues[0].variableName;
          rowTitlesByVariable[varName] = variableValues;
        } else {
          // Bisa jadi ini adalah variableId daripada variableName
          const matchingValues = availableRowTitles.filter(r => r.variableId === rowTitleId);
          if (matchingValues.length > 0) {
            const varName = matchingValues[0].variableName;
            rowTitlesByVariable[varName] = matchingValues;
          }
        }
      }
    });

    // Jika tidak ada judul baris yang ditemukan, coba gunakan semua yang tersedia
    if (Object.keys(rowTitlesByVariable).length === 0) {
      console.warn("No row titles selected in legacy mode, trying to use all available row titles");

      // Pilih variabel judul baris pertama dan gunakan semua nilainya
      const allRowVariables = [...new Set(availableRowTitles.map(r => r.variableName))];
      if (allRowVariables.length > 0) {
        const primaryRowVariable = allRowVariables[0];
        const rowValues = availableRowTitles.filter(r => r.variableName === primaryRowVariable);
        if (rowValues.length > 0) {
          rowTitlesByVariable[primaryRowVariable] = rowValues;
        }
      }

      // Jika masih kosong, kembalikan error
      if (Object.keys(rowTitlesByVariable).length === 0) {
        toast({
          title: "Tidak Ada Data",
          description: "Tidak ada judul baris yang tersedia.",
          variant: "destructive",
        });
      return { data: [], columns: [] };
      }
    }

    // Get characteristic values by variable
    const characteristicsByVariable: Record<string, CharacteristicValue[]> = {};

    // Membuat pemetaan antara ID karakteristik yang dipilih dan nilai aktualnya
    const selectedCharacteristicMap = new Map<string, boolean>();
    selectedCharacteristics.forEach(selectedId => {
      selectedCharacteristicMap.set(selectedId, true);
    });

    // Membuat array dengan nama variabel yang sudah dipilih
    const selectedVariableNames = selectedCharacteristics
      .filter(id => !id.includes('_value_')) // Ambil hanya variabel, bukan nilai spesifik
      .map(id => {
        const variable = availableCharacteristics.find(c => c.id === id);
        return variable?.variableName;
      })
      .filter(Boolean) as string[];

    // Jika tidak ada variabel karakteristik yang dipilih secara eksplisit, gunakan semua variabel yang tersedia
    if (selectedVariableNames.length === 0 && availableCharacteristics.length > 0) {
      // Ambil semua nama variabel karakteristik yang unik
      const allCharVariables = [...new Set(availableCharacteristics.map(c => c.variableName))];
      allCharVariables.forEach(varName => {
        if (!selectedVariableNames.includes(varName)) {
          selectedVariableNames.push(varName);
        }
      });
    }

    selectedCharacteristics.forEach((characteristicId) => {
      // Periksa apakah ini adalah ID variabel atau ID nilai karakteristik
      if (characteristicId.includes('_value_')) {
        // Ini adalah ID nilai karakteristik spesifik
        const characteristicValue = availableCharacteristics.find(c => c.id === characteristicId);
        if (characteristicValue) {
          const varName = characteristicValue.variableName;
          if (!characteristicsByVariable[varName]) {
            characteristicsByVariable[varName] = [];
          }
          characteristicsByVariable[varName].push(characteristicValue);
        }
      } else {
        // Ini adalah nama variabel - ambil semua nilai untuk variabel ini
        const variableValues = availableCharacteristics.filter(c =>
          c.variableName === characteristicId || c.variableId === characteristicId);

        if (variableValues.length > 0) {
          characteristicsByVariable[characteristicId] = variableValues;
        } else {
          // Bisa jadi ini adalah variableId daripada variableName
          const matchingValues = availableCharacteristics.filter(c => c.variableId === characteristicId);
          if (matchingValues.length > 0) {
            const varName = matchingValues[0].variableName;
            characteristicsByVariable[varName] = matchingValues;
          }
        }
      }
    });

    // Jika tidak ada karakteristik yang ditemukan, coba gunakan semua yang tersedia
    if (Object.keys(characteristicsByVariable).length === 0) {
      console.warn("No characteristics selected in legacy mode, trying to use all available characteristics");

      // Coba dapatkan karakteristik dari nama variabel yang dipilih
      for (const varName of selectedVariableNames) {
        const variableValues = availableCharacteristics.filter(c => c.variableName === varName);
        if (variableValues.length > 0) {
          characteristicsByVariable[varName] = variableValues;
        }
      }

      // Jika masih kosong, gunakan semua karakteristik yang tersedia
      if (Object.keys(characteristicsByVariable).length === 0) {
        const allCharVariables = [...new Set(availableCharacteristics.map(c => c.variableName))];
        if (allCharVariables.length > 0) {
          const primaryCharVariable = allCharVariables[0];
          const charValues = availableCharacteristics.filter(c => c.variableName === primaryCharVariable);
          if (charValues.length > 0) {
            characteristicsByVariable[primaryCharVariable] = charValues;
          }
        }

        // Jika masih kosong, kembalikan error
        if (Object.keys(characteristicsByVariable).length === 0) {
          toast({
            title: "Tidak Ada Data",
            description: "Tidak ada karakteristik yang tersedia.",
            variant: "destructive",
          });
          return { data: [], columns: [] };
        }
      }
    }

    // Create pivot table columns
    const pivotColumns: PivotColumn[] = [];

    // Add row title columns
    Object.keys(rowTitlesByVariable).forEach((variableName) => {
      pivotColumns.push({
        id: variableName,
        name: variableName,
        type: "rowTitle",
      });
    });

    // Add characteristic columns for each year and year derivative
    const characteristicValueColumns: PivotColumn[] = [];

    selectedYears.forEach((year) => {
      // Skip null or undefined years
      if (!year || year === "null" || year === "undefined") return;

      Object.keys(characteristicsByVariable).forEach((variableName) => {
        const characteristicValues = characteristicsByVariable[variableName];

        if (!characteristicValues || characteristicValues.length === 0) {
          return; // Skip if no characteristic values
        }

        characteristicValues.forEach((characteristic) => {
          characteristicValueColumns.push({
            id: `${year}_${variableName}_${characteristic.name}`,
            name: characteristic.name,
            year,
            characteristicName: variableName,
            characteristicValue: characteristic.name,
            type: characteristic.type || "count",
            aggregationMethod,
          });
        });
      });
    });

    // Sort characteristic columns by year and name
    characteristicValueColumns.sort((a, b) => {
      if (a.year !== b.year) {
        return (a.year || '').localeCompare(b.year || '');
      }
      if (a.characteristicName !== b.characteristicName) {
        return (a.characteristicName || '').localeCompare(b.characteristicName || '');
      }
      return (a.characteristicValue || '').localeCompare(b.characteristicValue || '');
    });

    // Add characteristic columns to pivot columns
    pivotColumns.push(...characteristicValueColumns);

    // Periksa jika tidak ada kolom yang dihasilkan
    if (pivotColumns.length === 0) {
      console.warn("No pivot columns generated in legacy mode");
      return { data: [], columns: [] };
    }

    // Generate pivot table data
    const pivotData: any[] = [];

    // Generate all possible combinations of row title values
    const rowCombinations: Record<string, string>[] = [];

    const generateCombinations = (
      variables: string[],
      currentIndex: number,
      currentCombination: Record<string, string>,
    ) => {
      if (currentIndex === variables.length) {
        rowCombinations.push({ ...currentCombination });
        return;
      }

      const variableName = variables[currentIndex];
      const values = rowTitlesByVariable[variableName];

      if (!values || values.length === 0) {
        // Skip if no values for this variable
        generateCombinations(variables, currentIndex + 1, currentCombination);
        return;
      }

      values.forEach((value) => {
        currentCombination[variableName] = value.name;
        generateCombinations(variables, currentIndex + 1, currentCombination);
      });
    };

    // Generate combinations for row titles
    generateCombinations(Object.keys(rowTitlesByVariable), 0, {});

    if (rowCombinations.length === 0) {
      console.warn("No row combinations generated in legacy mode");
      return { data: [], columns: [] };
    }

    // For each row combination, calculate cell values
    rowCombinations.forEach((combination) => {
      const dataRow: Record<string, any> = { ...combination };
      let rowTotal = 0; // Inisialisasi total baris

      // For each characteristic column, calculate the value
      characteristicValueColumns.forEach((column) => {
        const { year, yearDerivative, characteristicName, characteristicValue } = column;

        if (!year || !characteristicName || !characteristicValue) {
          console.warn("Missing column properties", column);
          dataRow[column.id] = 0;
          return;
        }

        // Jika ini adalah karakteristik dummy, gunakan nilai yang sesuai dengan jumlah data
        if (characteristicName === "_dummy_characteristic") {
          // Hitung jumlah baris yang cocok dengan kombinasi baris saat ini
          // dan tahun yang dipilih
          const matchingRows = filteredData.filter((row) => {
            if (!row) return false; // Skip invalid rows

            // Skip if row doesn't have year data
            const yearVal = row[yearVariable.name];
            if (yearVal === undefined || yearVal === null || String(yearVal) !== year) return false;

            // Filter by year derivative if specified
            if (yearDerivative && yearDerivativeVariable) {
              const derivativeVal = row[yearDerivativeVariable.name];
              if (derivativeVal === undefined || derivativeVal === null || String(derivativeVal) !== yearDerivative) return false;
            }

            // Check if row matches the current combination
            return Object.keys(combination).every((variable) => {
              const rowVal = row[variable];
              return rowVal !== undefined && rowVal !== null && String(rowVal) === combination[variable];
            });
          });

          if (aggregationMethod === "count") {
            dataRow[column.id] = matchingRows.length;
          } else if (aggregationMethod === "sum" || aggregationMethod === "average") {
            // Untuk sum dan average, gunakan jumlah baris sebagai nilai
            dataRow[column.id] = matchingRows.length;
          }

          rowTotal += dataRow[column.id];
          return;
        }

        // Filter data for this year, year derivative, and row combination - dengan penanganan null/undefined
        const filteredRows = filteredData.filter((row) => {
          if (!row) return false; // Skip invalid rows

          // Skip if row doesn't have year data
          const yearVal = row[yearVariable.name];
          if (yearVal === undefined || yearVal === null || String(yearVal) !== year) return false;

          // Filter by year derivative if specified
          if (yearDerivative && yearDerivativeVariable) {
            const derivativeVal = row[yearDerivativeVariable.name];
            if (derivativeVal === undefined || derivativeVal === null || String(derivativeVal) !== yearDerivative) return false;
          }

          // Check if row matches the current combination
          if (!Object.keys(combination).every((variable) => {
            const rowVal = row[variable];
            return rowVal !== undefined && rowVal !== null && String(rowVal) === combination[variable];
          })) {
            return false;
          }

          // Check if row matches the characteristic value
          const characteristicVal = row[characteristicName];
          return characteristicVal !== undefined && characteristicVal !== null &&
                 String(characteristicVal) === characteristicValue;
        });

        let cellValue = 0;

        if (aggregationMethod === "count") {
          // Count rows
          cellValue = filteredRows.length;
        } else if (aggregationMethod === "sum") {
          // Sum values - pastikan hanya nilai numerik yang dijumlahkan
          cellValue = filteredRows.reduce((acc, row) => {
            if (!row) return acc; // Skip invalid rows

            // Get value safely
            const rawValue = row[characteristicName];
            let value = 0;

            if (rawValue !== undefined && rawValue !== null) {
              const parsed = Number.parseFloat(String(rawValue));
              value = isNaN(parsed) ? 0 : parsed;
            }

            return acc + value;
          }, 0);
        } else if (aggregationMethod === "average") {
          // Average values - pastikan hanya nilai numerik yang dihitung
          const values = filteredRows
            .map((row) => {
              if (!row) return NaN; // Skip invalid rows

              const rawValue = row[characteristicName];
              if (rawValue === undefined || rawValue === null) return NaN;

              const parsed = Number.parseFloat(String(rawValue));
              return isNaN(parsed) ? NaN : parsed;
            })
            .filter((val) => !isNaN(val));

          cellValue = values.length > 0 ? values.reduce((sum, val) => sum + val, 0) / values.length : 0;
        }

        // Add cell value to data row
        dataRow[column.id] = cellValue;

        // Tambahkan nilai ke total baris
        rowTotal += cellValue;
      });

      // Tambahkan total baris ke data row
      dataRow["row_total"] = rowTotal;

      // Add data row to pivot data
      pivotData.push(dataRow);
    });

    // Tambahkan baris total kolom
    if (pivotData.length > 0) {
      const totalRow: Record<string, any> = {};

      // Set nilai untuk kolom judul baris
      pivotColumns
        .filter(col => col.type === "rowTitle")
        .forEach(column => {
          totalRow[column.name] = "Total";
        });

      // Hitung total untuk setiap kolom karakteristik
      characteristicValueColumns.forEach(column => {
      const columnTotal = pivotData.reduce((sum, row) => {
          const value = row[column.id];
          return sum + (typeof value === 'number' ? value : 0);
        }, 0);

        totalRow[column.id] = columnTotal;
      });

      // Hitung total keseluruhan
      const grandTotal = pivotData.reduce((sum, row) => {
        const rowTotal = row["row_total"];
        return sum + (typeof rowTotal === 'number' ? rowTotal : 0);
      }, 0);

      totalRow["row_total"] = grandTotal;

      // Tambahkan baris total ke data pivot
      pivotData.push(totalRow);
    }

    // Tambahkan kolom total ke pivotColumns jika belum ada
    if (!pivotColumns.some(col => col.type === "total")) {
      pivotColumns.push({
        id: "row_total",
        name: "Total",
        type: "total"
      });
    }

    console.log("Generated pivot data (legacy):", pivotData.length, "rows with", pivotColumns.length, "columns");
    return { data: pivotData, columns: pivotColumns };
  };

  // Ubah fungsi untuk menghasilkan data pivot tabel
  const generatePivotTableData = () => {
    if (!selectedDataset) {
      console.error("Cannot generate pivot table: No dataset selected");
      return { data: [], columns: [] };
    }

    // Get data and filter
    const yearVariable = selectedDataset.variables.find((v) => v.name.toLowerCase() === "tahun");
    if (!yearVariable) {
      console.error("Cannot generate pivot table: No year variable found");
      return { data: [], columns: [] };
    }

    // Normalize dataset - handle both 'data' (old) and 'content' (new) property names
    const dataArray = selectedDataset.content || (selectedDataset as any).data || [];

    // Log diagnostic information
    console.log("Generating pivot table with data array length:", dataArray.length);
    console.log("Selected years:", selectedYears);
    console.log("Selected characteristics:", selectedCharacteristics);
    console.log("Selected row titles:", selectedRowTitles);

    // Periksa jika dataArray valid (array dan tidak kosong)
    if (!Array.isArray(dataArray) || dataArray.length === 0) {
      console.warn("Dataset does not contain any data");
      return { data: [], columns: [] };
    }

    // Ambil konfigurasi tabel jika ada selectedTableConfigId
    const fetchTableConfigAndGenerateData = async () => {
      try {
        // Jika ada selectedTableConfigId, ambil dari API
        if (selectedTableConfigId) {

          const response = await fetch(`/api/table-configs/${selectedTableConfigId}`);
          if (!response.ok) {
            throw new Error(`Error fetching table config: ${response.statusText}`);
          }

          const tableConfig = await response.json();
          console.log("Fetched table config:", tableConfig);

          if (!tableConfig) {
            console.error("Empty table config response");
            return generatePivotTableLegacy(dataArray, yearVariable);
          }

          // Gunakan konfigurasi tabel untuk menghasilkan data pivot
          return generatePivotTableWithConfig(tableConfig, dataArray, yearVariable);
        }
      } catch (error) {
        console.error('Error fetching table config for pivot table:', error);
      }

      // Jika tidak ada selectedTableConfigId atau terjadi error, gunakan cara lama
      return generatePivotTableLegacy(dataArray, yearVariable);
    };

    return fetchTableConfigAndGenerateData();
  };

  // Fungsi handleSubmit untuk memproses dan menampilkan data
  const handleSubmit = async () => {
    if (selectedData) {
      try {

        // Validasi lagi apakah data yang dipilih valid
        if (selectedData.years.length === 0) {
          toast({
            title: "Perhatian",
            description: "Silakan pilih minimal satu Tahun",
            variant: "destructive",
          });
          return;
        }

        // Validasi karakteristik hanya jika tersedia
        if (availableCharacteristics.length > 0 && selectedData.characteristics.length === 0) {
          toast({
            title: "Perhatian",
            description: "Silakan pilih minimal satu Karakteristik",
            variant: "destructive",
          });
          return;
        }

        if (selectedData.rowTitles.length === 0) {
          toast({
            title: "Perhatian",
            description: "Silakan pilih minimal satu Judul Baris",
            variant: "destructive",
          });
          return;
        }

        // Tampilkan pesan loading
        toast({
          title: "Memproses Data",
          description: "Sedang menghasilkan tabel pivot, harap tunggu...",
        });

        // Tunggu hingga hasil generatePivotTableData tersedia
        const result = await generatePivotTableData();
        console.log("Generated pivot table result:", result);

        // Periksa apakah result berisi data dan columns
        if (result && typeof result === 'object') {
          const { data = [], columns = [] } = result;

          if (data.length === 0 || columns.length === 0) {
            console.warn("No data or columns in pivot table result");
            toast({
              title: "Tidak Ada Data",
              description: "Tidak ada data yang sesuai dengan kriteria filter yang dipilih. Silakan pilih filter lain.",
              variant: "destructive",
            });
            return;
          }

          // Tambahkan periksa apakah data kosong atau tidak mengandung baris selain total
          if (data.length === 1 && Object.values(data[0]).some(val => val === "Total")) {
            toast({
              title: "Data Tidak Lengkap",
              description: "Tabel hanya berisi data total, tidak ada data detail. Silakan periksa filter yang dipilih.",
              variant: "destructive",
            });
            return;
          }

          setPivotTableData(data);
          setPivotColumns(columns);
          setShowTable(true);

      // Scroll ke bagian tabel
      setTimeout(() => {
        const tableElement = document.querySelector(".table-section")
        if (tableElement) {
          tableElement.scrollIntoView({ behavior: "smooth" })
        }
          }, 100);
        } else {
          throw new Error('Hasil tidak valid dari generatePivotTableData');
        }
      } catch (error) {
        console.error('Error generating pivot table:', error);
        toast({
          title: "Error",
          description: "Terjadi kesalahan saat membuat tabel pivot. " + (error instanceof Error ? error.message : ""),
          variant: "destructive",
        });
      }
    }
  }

  // Fungsi untuk memuat ulang konfigurasi tabel yang dipilih
  const fetchSelectedTableConfig = async () => {
    try {
      const response = await fetch(`/api/table-configs/${selectedTableConfigId}`);
      if (!response.ok) {
        throw new Error(`Error fetching table config: ${response.statusText}`);
      }

      const tableConfig = await response.json();
      processDataWithTableConfig(tableConfig);
    } catch (error) {
      console.error('Error fetching table config:', error);
      // Jika gagal, gunakan cara lama
      processDataWithLegacyConfig();
    }
  };

  const handleDownload = (type: string) => {
    toast({
      title: "Unduh Data",
      description: `Fitur unduh ${type} belum tersedia.`,
    })
  }

  // Fungsi untuk mendapatkan label kolom
  const getColumnLabel = (column: PivotColumn) => {
    if (column.type === "rowTitle") {
      return column.name
    } else {
      return `${column.characteristicValue}`
    }
  }

  // Fungsi untuk mendapatkan header tahun dengan turunan tahun
  const getYearHeaders = () => {
    // Kumpulkan semua tahun unik
    const uniqueYears = new Set<string>();

    pivotColumns
      .filter(col => col.type !== "rowTitle" && col.type !== "total")
      .forEach(column => {
        if (column.year) {
          uniqueYears.add(column.year);
        }
      });

    // Buat struktur untuk header tahun
    const yearHeaders: Record<string, {
      year: string;
      derivativeColumns: Record<string, PivotColumn[]>;
      totalColumns: number;
    }> = {};

    // Isi struktur header dengan kolom-kolom yang sesuai
    uniqueYears.forEach(year => {
      const yearColumns = pivotColumns.filter(col =>
        col.type !== "rowTitle" &&
        col.type !== "total" &&
        col.year === year
      );

      const derivativeColumns: Record<string, PivotColumn[]> = {};

      // Kelompokkan kolom berdasarkan turunan tahun
      yearColumns.forEach(column => {
        const derivativeKey = column.yearDerivative || "none";

        if (!derivativeColumns[derivativeKey]) {
          derivativeColumns[derivativeKey] = [];
        }

        derivativeColumns[derivativeKey].push(column);
      });

      // Hitung total kolom untuk tahun ini
      const totalColumns = yearColumns.length;

      yearHeaders[year] = {
        year,
        derivativeColumns,
        totalColumns,
      };
    });

    return yearHeaders;
  };

  // Fungsi untuk mendapatkan semua turunan tahun unik yang digunakan
  const getUniqueDerivatives = () => {
    const uniqueDerivatives = new Set<string>();

    pivotColumns
      .filter(col => col.type !== "rowTitle" && col.type !== "total")
      .forEach(column => {
        if (column.yearDerivative) {
          uniqueDerivatives.add(column.yearDerivative);
        } else {
          uniqueDerivatives.add("none");
        }
      });

    return Array.from(uniqueDerivatives);
  };

  // Fungsi untuk mendapatkan kolom karakteristik berdasarkan tahun dan turunan tahun
  const getCharacteristicColumns = (year: string, derivative: string) => {
    return pivotColumns.filter(col =>
      col.type !== "rowTitle" &&
      col.type !== "total" &&
      col.year === year &&
      (derivative === "none" ? !col.yearDerivative : col.yearDerivative === derivative)
    );
  };

  // Fungsi untuk mendapatkan header karakteristik
  const getCharacteristicHeaders = () => {
    const characteristicHeaders: Record<string, { name: string; columns: PivotColumn[] }> = {}

    pivotColumns
      .filter(col => col.type !== "rowTitle" && col.type !== "total")
      .forEach((column) => {
        if (column.year && column.characteristicName) {
        const key = `${column.year}_${column.characteristicName}`
        if (!characteristicHeaders[key]) {
          characteristicHeaders[key] = { name: column.characteristicName, columns: [] }
        }
        characteristicHeaders[key].columns.push(column)
      }
    })

    return Object.values(characteristicHeaders)
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

  // Ubah kondisi pesan error jika tidak ada konfigurasi tabel
  if (tableConfigurations.length === 0) {
    return (
      <div className="bg-gray-50 min-h-screen p-4">
        <div className="max-w-7xl mx-auto bg-white shadow-sm rounded-lg p-6">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">Tidak Ada Tabel Terkonfigurasi</h3>
              <p className="text-muted-foreground mb-4">
                Silakan konfigurasi tabel terlebih dahulu di halaman Konfigurasi Tabel Dinamis.
              </p>
              <Button asChild>
                <a href="/admin/dynamic-table-config">Konfigurasi Tabel Dinamis</a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-7xl mx-auto bg-white shadow-sm rounded-lg p-6">
        {/* Tambahkan style untuk navbar di bagian breadcrumb (sekitar baris 600) */}
        <div className="flex items-center text-sm text-primary mb-4">
          <span className="cursor-pointer hover:underline">Beranda</span>
          <span className="mx-1">&gt;</span>
          <span className="cursor-pointer hover:underline">Produk - Tabel Dinamis</span>
        </div>

        {/* Form section */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium mb-1">Kategori</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories
                    .filter((category) => category !== "all")
                    .map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium mb-1">Sumber Data</Label>
              <Select value={selectedDataSource} onValueChange={setSelectedDataSource}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih sumber data" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Sumber Data</SelectItem>
                  {dataSources
                    .filter((source) => source !== "all")
                    .map((source) => (
                      <SelectItem key={source} value={source}>
                        {source}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {selectedDataSource && (
                <p className="mt-1 text-xs text-muted-foreground">{filteredConfigurations.length} tabel tersedia</p>
              )}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium">Tabel / Indikator</Label>
                <div className="relative w-full max-w-xs ml-2">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Cari Judul Tabel"
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    disabled={!selectedDataSource}
                  />
                </div>
              </div>

              <Card className="h-[400px] overflow-hidden border-2 border-gray-200">
                <CardContent className="p-0 h-full">
                  <div className="h-full overflow-y-auto custom-scrollbar">
                    {loading ? (
                      <div className="flex items-center justify-center h-full text-center p-4">
                        <p className="text-muted-foreground">Memuat tabel...</p>
                      </div>
                    ) : displayedConfigurations.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center p-4">
                        <p className="text-muted-foreground">Tidak ada tabel yang tersedia</p>
                      </div>
                    ) : (
                      <div className="h-full">
                        {displayedConfigurations.map((config) => (
                        <div
                          key={config.id}
                          className={`p-3 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedConfigId === config.id ? "bg-primary/10" : ""
                          }`}
                          onClick={() => handleConfigSelect(config)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="font-medium text-sm">{config.title}</div>
                            {selectedConfigId === config.id && <Check className="h-4 w-4 text-primary" />}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {config.description || "Tidak ada deskripsi"}
                          </div>
                        </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Tambahkan style untuk scrollbar yang lebih terlihat jelas */}
              <style jsx global>{`
                /* Style untuk scrollbar di Chrome, Edge, dan Safari */
                .custom-scrollbar::-webkit-scrollbar {
                  width: 10px;
                }

                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #f1f1f1;
                  border-radius: 5px;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #c1c1c1;
                  border-radius: 5px;
                  border: 2px solid #f1f1f1;
                }

                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #a1a1a1;
                }

                /* Style untuk Firefox */
                .custom-scrollbar {
                  scrollbar-width: thin;
                  scrollbar-color: #c1c1c1 #f1f1f1;
                }
              `}</style>
            </div>

            <div className="w-full lg:w-96">
              <div className="space-y-6">
                {/* Tahun selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Tahun</Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary h-auto p-0"
                      onClick={handleSelectAllYears}
                      disabled={!selectedDataset || availableYears.length === 0}
                    >
                      {selectedYears.length === availableYears.length ? "Batal Pilih" : "Pilih Semua"}
                    </Button>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center mb-2">
                          <Info className="h-4 w-4 text-muted-foreground mr-1" />
                          <p className="text-xs text-muted-foreground">Wajib dipilih minimal satu tahun</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Tahun dideteksi otomatis dari kolom bernama "tahun" dalam dataset</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Card className="h-[120px]">
                    <CardContent className="p-2 h-full overflow-y-auto">
                      {!selectedDataset ? (
                        <div className="flex items-center justify-center h-full text-center p-4">
                          <p className="text-muted-foreground">Pilih tabel terlebih dahulu</p>
                        </div>
                      ) : availableYears.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center p-4">
                          <p className="text-muted-foreground">Tidak ada data tahun yang tersedia</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableYears.map((year) => (
                            <div key={year} className="flex items-center space-x-2">
                              <Checkbox
                                id={`year-${year}`}
                                checked={selectedYears.includes(year)}
                                onCheckedChange={() => handleYearSelect(year)}
                              />
                              <Label htmlFor={`year-${year}`} className="text-sm cursor-pointer">
                                {year && year !== "null" && year !== "undefined" ? year : "-"}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Turunan Tahun selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Turunan Tahun</Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary h-auto p-0"
                      onClick={handleSelectAllYearDerivatives}
                      disabled={!selectedDataset || availableYearDerivatives.length === 0}
                    >
                      {selectedYearDerivatives.length === availableYearDerivatives.length
                        ? "Batal Pilih"
                        : "Pilih Semua"}
                    </Button>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center mb-2">
                          <Info className="h-4 w-4 text-muted-foreground mr-1" />
                          <p className="text-xs text-muted-foreground">Opsional, boleh dikosongkan</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Turunan tahun dideteksi dari kolom yang mengandung "Triwulan", "Semester", atau "Bulan"</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Card className="h-[120px]">
                    <CardContent className="p-2 h-full overflow-y-auto">
                      {!selectedDataset ? (
                        <div className="flex items-center justify-center h-full text-center p-4">
                          <p className="text-muted-foreground">Pilih tabel terlebih dahulu</p>
                        </div>
                      ) : availableYearDerivatives.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center p-4">
                          <p className="text-muted-foreground">Tidak ada turunan tahun yang tersedia</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {availableYearDerivatives.map((derivative) => (
                            <div key={derivative.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`derivative-${derivative.id}`}
                                checked={selectedYearDerivatives.includes(derivative.id)}
                                onCheckedChange={() => handleYearDerivativeSelect(derivative.id)}
                              />
                              <Label htmlFor={`derivative-${derivative.id}`} className="text-sm cursor-pointer">
                                {derivative.name}
                              </Label>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Karakteristik selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Karakteristik</Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary h-auto p-0"
                      onClick={handleSelectAllCharacteristics}
                      disabled={!selectedDataset || availableCharacteristics.length === 0}
                    >
                      {selectedCharacteristics.length === availableCharacteristics.length
                        ? "Batal Pilih"
                        : "Pilih Semua"}
                    </Button>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center mb-2">
                          <Info className="h-4 w-4 text-muted-foreground mr-1" />
                          <p className="text-xs text-muted-foreground">Pilih minimal satu karakteristik</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Karakteristik diambil dari konfigurasi tabel yang telah disimpan</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Card className="h-[150px]">
                    <CardContent className="p-2 h-full overflow-y-auto">
                      {!selectedDataset ? (
                        <div className="flex items-center justify-center h-full text-center p-4">
                          <p className="text-muted-foreground">Pilih tabel terlebih dahulu</p>
                        </div>
                      ) : availableCharacteristics.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center p-4">
                          <p className="text-muted-foreground">Tidak ada karakteristik yang tersedia</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {availableCharacteristics.map((characteristic) => (
                            <div key={characteristic.id} className="mb-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`characteristic-${characteristic.id}`}
                                  checked={selectedCharacteristics.includes(characteristic.id)}
                                  onCheckedChange={() => handleCharacteristicSelect(characteristic.id)}
                                />
                                <Label
                                  htmlFor={`characteristic-${characteristic.id}`}
                                  className="text-sm cursor-pointer"
                                >
                                  {characteristic.name}
                                  <Badge
                                    className="ml-2"
                                    variant={characteristic.type === "count" ? "outline" : "secondary"}
                                  >
                                    {characteristic.type === "count" ? "Count" : "Measure"}
                                  </Badge>
                                </Label>
                              </div>
                              {characteristic.values && characteristic.values.length > 0 && (
                                <div className="ml-6 mt-1 text-xs text-muted-foreground">
                                  <span>Nilai: </span>
                                  {characteristic.values.length > 5
                                    ? `${characteristic.values.slice(0, 5).join(", ")}... (${characteristic.values.length} nilai)`
                                    : characteristic.values.join(", ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Judul Baris selection */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-medium">Judul Baris</Label>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-primary h-auto p-0"
                      onClick={handleSelectAllRowTitles}
                      disabled={!selectedDataset || availableRowTitles.length === 0}
                    >
                      {selectedRowTitles.length === availableRowTitles.length ? "Batal Pilih" : "Pilih Semua"}
                    </Button>
                  </div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center mb-2">
                          <Info className="h-4 w-4 text-muted-foreground mr-1" />
                          <p className="text-xs text-muted-foreground">Pilih minimal satu judul baris</p>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Judul baris diambil dari konfigurasi tabel yang telah disimpan</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Card className="h-[120px]">
                    <CardContent className="p-2 h-full overflow-y-auto">
                      {!selectedDataset ? (
                        <div className="flex items-center justify-center h-full text-center p-4">
                          <p className="text-muted-foreground">Pilih tabel terlebih dahulu</p>
                        </div>
                      ) : availableRowTitles.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-center p-4">
                          <p className="text-muted-foreground">Tidak ada judul baris yang tersedia</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {availableRowTitles.map((rowTitle) => (
                            <div key={rowTitle.id} className="mb-2">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`rowTitle-${rowTitle.id}`}
                                  checked={selectedRowTitles.includes(rowTitle.id)}
                                  onCheckedChange={() => handleRowTitleSelect(rowTitle.id)}
                                />
                                <Label htmlFor={`rowTitle-${rowTitle.id}`} className="text-sm cursor-pointer">
                                  {rowTitle.name}
                                </Label>
                              </div>
                              {rowTitle.values && rowTitle.values.length > 0 && (
                                <div className="ml-6 mt-1 text-xs text-muted-foreground">
                                  <span>Nilai: </span>
                                  {rowTitle.values.length > 5
                                    ? `${rowTitle.values.slice(0, 5).join(", ")}... (${rowTitle.values.length} nilai)`
                                    : rowTitle.values.join(", ")}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-3 mt-6">
            <Button
              className="bg-primary hover:bg-primary/90 text-white"
              onClick={handleAddSelection}
              disabled={
                !selectedDataset ||
                selectedYears.length === 0 ||
                (availableCharacteristics.length > 0 && selectedCharacteristics.length === 0) ||
                selectedRowTitles.length === 0
              }
            >
              Tambah
            </Button>
            <Button variant="outline" className="border-gray-300" onClick={handleReset}>
              Atur Ulang
            </Button>
          </div>
        </div>

        {selectedData && (
          <div className="mt-6 border rounded-md p-4 bg-blue-50">
            <h3 className="text-lg font-medium mb-2">Data Terpilih</h3>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                <span className="font-medium">Tahun:</span>
                {selectedData.years.map((year) => (
                  <Badge key={year} variant="outline">
                    {year}
                  </Badge>
                ))}
              </div>

              {selectedData.yearDerivatives.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="font-medium">Turunan Tahun:</span>
                  {selectedData.yearDerivatives.map((id) => {
                    const derivative = availableYearDerivatives.find((d) => d.id === id)
                    return derivative ? (
                      <Badge key={id} variant="outline">
                        {derivative.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <span className="font-medium">Karakteristik:</span>
                {selectedData.characteristics.map((id) => {
                  const characteristic = availableCharacteristics.find((c) => c.id === id)
                  return characteristic ? (
                    <Badge key={id} variant="outline">
                      {characteristic.name}
                    </Badge>
                  ) : null
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="font-medium">Judul Baris:</span>
                {selectedData.rowTitles.map((id) => {
                  const rowTitle = availableRowTitles.find((r) => r.id === id)
                  return rowTitle ? (
                    <Badge key={id} variant="outline">
                      {rowTitle.name}
                    </Badge>
                  ) : null
                })}
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <Button className="bg-primary hover:bg-primary/90 text-white" onClick={handleSubmit}>
                Submit
              </Button>
            </div>
          </div>
        )}

        {/* Table controls */}
        {showTable && (
          <div className="mt-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center mr-4">
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-2">
                        ?
                      </div>
                      <div className="flex items-center">
                        <span className="text-sm text-gray-500 mr-2">Kunci judul kolom</span>
                        <Switch checked={freezeHeader} onCheckedChange={setFreezeHeader} />
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Mengunci judul kolom saat menggulir tabel</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <Button variant="outline" size="sm" className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>Filter</span>
              </Button>

              <Button variant="outline" size="sm" className="ml-2 flex items-center gap-1">
                <SlidersHorizontal className="h-4 w-4" />
                <span>Opsi</span>
              </Button>
            </div>

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
          </div>
        )}

        {/* Pivot Table Display */}
        {showTable && pivotTableData.length > 0 && (
          <div className={`mt-4 table-section`}>
            <div className="rounded-md border overflow-auto">
              <table className="w-full border-collapse">
                <thead className={`${freezeHeader ? "sticky top-0 z-10" : ""}`}>
                  {/* Header baris pertama - Tahun */}
                  <tr>
                    {/* Kolom untuk judul baris */}
                    {pivotColumns
                      .filter((col) => col.type === "rowTitle")
                      .map((column) => (
                        <th
                          key={`header-row-${column.id}`}
                          rowSpan={3}
                          className="border p-2 bg-blue-900 text-white font-medium text-sm sticky left-0 z-20"
                        >
                          {column.name}
                        </th>
                      ))}

                    {/* Kolom untuk tahun (merged cells) */}
                    {Object.values(getYearHeaders()).map((yearHeader) => (
                      <th
                        key={`header-year-${yearHeader.year}`}
                        colSpan={yearHeader.totalColumns}
                        className="border p-2 bg-blue-900 text-white font-medium text-sm text-center"
                      >
                        {yearHeader.year}
                      </th>
                    ))}

                    {/* Kolom untuk total */}
                    <th rowSpan={3} className="border p-2 bg-blue-700 text-white font-medium text-sm text-center">
                      Total
                    </th>
                  </tr>

                  {/* Header baris kedua - Turunan Tahun */}
                  <tr>
                    {Object.entries(getYearHeaders()).map(([year, yearHeader]) => {
                      return Object.entries(yearHeader.derivativeColumns).map(([derivative, columns]) => (
                        <th
                          key={`header-derivative-${year}-${derivative}`}
                          colSpan={columns.length}
                          className="border p-2 bg-blue-800 text-white font-medium text-sm text-center"
                        >
                          {derivative === "none" ? "Semua" : derivative}
                        </th>
                      ));
                    })}
                  </tr>

                  {/* Header baris ketiga - Karakteristik */}
                  <tr>
                    {Object.entries(getYearHeaders()).map(([year, yearHeader]) => {
                      return Object.entries(yearHeader.derivativeColumns).flatMap(([derivative, columns]) => {
                        return columns.map(column => (
                          <th
                            key={`subheader-${column.id}`}
                            className="border p-2 bg-blue-700 text-white font-medium text-xs text-center"
                        >
                          {column.characteristicValue}
                        </th>
                        ));
                      });
                    })}
                  </tr>
                </thead>
                <tbody>
                  {pivotTableData.map((row, rowIndex) => {
                    const isLastRow = rowIndex === pivotTableData.length - 1
                    return (
                      <tr
                        key={`row-${rowIndex}`}
                        className={
                          isLastRow ? "bg-blue-100 font-medium" : rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50"
                        }
                      >
                        {/* Kolom untuk judul baris */}
                        {pivotColumns
                          .filter((col) => col.type === "rowTitle")
                          .map((column) => (
                            <td
                              key={`cell-row-${rowIndex}-${column.id}`}
                              className={`border p-2 text-sm sticky left-0 z-10 bg-inherit ${isLastRow ? "font-medium" : ""}`}
                            >
                              {row[column.name]}
                            </td>
                          ))}

                        {/* Kolom untuk data */}
                        {pivotColumns
                          .filter((col) => col.type !== "rowTitle" && col.type !== "total")
                          .map((column) => (
                            <td
                              key={`cell-${rowIndex}-${column.id}`}
                              className={`border p-2 text-right text-sm ${isLastRow ? "font-medium" : ""}`}
                            >
                              {typeof row[column.id] === "number"
                                ? row[column.id].toLocaleString(undefined, {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                  })
                                : row[column.id] || "0"}
                            </td>
                          ))}

                        {/* Kolom untuk total baris */}
                        <td
                          key={`cell-total-${rowIndex}`}
                          className={`border p-2 text-right text-sm bg-blue-50 ${isLastRow ? "font-medium bg-blue-200" : ""}`}
                        >
                          {typeof row["row_total"] === "number"
                            ? row["row_total"].toLocaleString(undefined, {
                                minimumFractionDigits: 0,
                                maximumFractionDigits: 2,
                              })
                            : row["row_total"] || "0"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 text-sm">
              <p>
                <strong>Keterangan:</strong>
              </p>
              <p>Data diolah dari dataset: {selectedDataset?.name}</p>
              <p>Sumber: {selectedDataset?.source || "Tidak diketahui"}</p>
              <p>
                Metode agregasi:{" "}
                {selectedDataset?.tableConfig?.aggregationMethod === "sum"
                  ? "Jumlah"
                  : selectedDataset?.tableConfig?.aggregationMethod === "average"
                    ? "Rata-rata"
                    : selectedDataset?.tableConfig?.aggregationMethod === "count"
                      ? "Jumlah Data"
                      : "Jumlah"}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
