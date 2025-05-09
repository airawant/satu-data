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
}

type RowTitleValue = {
  id: string
  name: string
  variableId: string
  variableName: string
}

// Tipe untuk kolom pivot tabel
type PivotColumn = {
  id: string
  name: string
  type: string
  year?: string
  characteristicName?: string
  characteristicValue?: string
  aggregationMethod?: string
}

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
    setSelectedConfigId(config.id)
    setSelectedDatasetId(config.datasetId)
    setSelectedTableConfigId(config.configId)
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

    // Get unique values for year derivatives
    if (yearDerivativeVariable) {
      const uniqueDerivatives = new Set<string>();
      dataArray.forEach((row) => {
        if (row[yearDerivativeVariable.name] !== undefined && row[yearDerivativeVariable.name] !== null) {
          uniqueDerivatives.add(row[yearDerivativeVariable.name].toString());
        }
      });

      const formattedDerivatives = Array.from(uniqueDerivatives).sort().map((val) => ({
        id: val,
        name: val
      }));

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
          dimensionValues[variable.name] = Array.from(uniqueYearDerivatives).sort()
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

    // Convert string[] to { id: string, name: string }[] for availableYearDerivatives
    const derivativeFieldName = selectedDataset.variables.find((v) => v.name.toLowerCase().includes("triwulan") || v.name.toLowerCase().includes("semester") || v.name.toLowerCase().includes("bulan"))?.name || ""

    const derivativeValues = dimensionValues[derivativeFieldName] || [];
    const formattedDerivatives = derivativeValues.map((val, idx) => ({
      id: val,
      name: val
    }));

    setAvailableYearDerivatives(formattedDerivatives)
  };

  // Handle year selection
  const handleYearSelect = (year: string) => {
    if (selectedYears.includes(year)) {
      setSelectedYears(selectedYears.filter((y) => y !== year))
    } else {
      setSelectedYears([...selectedYears, year])
    }
  }

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
      setSelectedCharacteristics(availableCharacteristics.map((c) => c.id))
    }
  }

  // Handle select all row titles
  const handleSelectAllRowTitles = () => {
    if (selectedRowTitles.length === availableRowTitles.length) {
      setSelectedRowTitles([])
    } else {
      setSelectedRowTitles(availableRowTitles.map((r) => r.id))
    }
  }

  // Handle year derivative selection
  const handleYearDerivativeSelect = (derivativeId: string) => {
    if (selectedYearDerivatives.includes(derivativeId)) {
      setSelectedYearDerivatives(selectedYearDerivatives.filter((id) => id !== derivativeId))
    } else {
      setSelectedYearDerivatives([...selectedYearDerivatives, derivativeId])
    }
  }

  // Handle characteristic selection
  const handleCharacteristicSelect = (characteristicId: string) => {
    if (selectedCharacteristics.includes(characteristicId)) {
      setSelectedCharacteristics(selectedCharacteristics.filter((id) => id !== characteristicId))
    } else {
      setSelectedCharacteristics([...selectedCharacteristics, characteristicId])
    }
  }

  // Handle row title selection
  const handleRowTitleSelect = (rowTitleId: string) => {
    if (selectedRowTitles.includes(rowTitleId)) {
      setSelectedRowTitles(selectedRowTitles.filter((id) => id !== rowTitleId))
    } else {
      setSelectedRowTitles([...selectedRowTitles, rowTitleId])
    }
  }

  // Ubah generatePivotTableData untuk menggunakan konfigurasi tabel dari API dengan penanganan error yang lebih baik
  const generatePivotTableData = () => {
    if (!selectedDataset) return { data: [], columns: [] };

    // Get data and filter
    const yearVariable = selectedDataset.variables.find((v) => v.name.toLowerCase() === "tahun");
    if (!yearVariable) return { data: [], columns: [] };

    // Normalize dataset - handle both 'data' (old) and 'content' (new) property names
    const dataArray = selectedDataset.content || (selectedDataset as any).data || [];

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
      console.log("Falling back to legacy pivot table generation");
      return generatePivotTableLegacy(dataArray, yearVariable);
    };

    return fetchTableConfigAndGenerateData();
  };

  // Fungsi untuk menghasilkan data pivot tabel dengan konfigurasi dari API dengan penanganan error yang lebih baik
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

    // Filter data based on selected years - pastikan setiap row valid sebelum memfilter
    const filteredData = dataArray.filter((row) =>
      row && // pastikan row tidak null/undefined
      row[yearVariable.name] !== undefined &&
      row[yearVariable.name] !== null &&
      row[yearVariable.name] !== "" &&
      selectedYears.includes(String(row[yearVariable.name])) &&
      String(row[yearVariable.name]) !== "null" &&
      String(row[yearVariable.name]) !== "undefined"
    );

    if (filteredData.length === 0) {
      console.warn("No data after filtering by selected years");
      return { data: [], columns: [] };
    }

    // Get aggregation method from dataset configuration
    const aggregationMethod = tableConfig.aggregation_method || 'sum';

    // Buat struktur data untuk judul baris dari konfigurasi
    const rowField = tableConfig.row_field;
    if (!rowField) {
      console.error("No row field specified in table config");
      return { data: [], columns: [] };
    }

    const rowVariable = selectedDataset?.variables.find((v) => v.name === rowField);
    if (!rowVariable) {
      console.error(`Row field '${rowField}' not found in dataset variables`);
      return { data: [], columns: [] };
    }

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
      rowTitlesByVariable[rowVariable.name].push({
        id: `${rowVariable.id}_value_${index}`,
        name: value,
        variableId: rowVariable.id,
        variableName: rowVariable.name,
      });
    });

    // Buat struktur data untuk karakteristik dari konfigurasi
    const characteristicFields = Array.isArray(tableConfig.characteristic_fields) ?
      tableConfig.characteristic_fields : [];

    if (characteristicFields.length === 0) {
      console.warn("No characteristic fields found in table config");
    }

    const characteristicVariables = selectedDataset?.variables.filter((v) =>
      characteristicFields.includes(v.name)
    ) || [];

    const characteristicsByVariable: Record<string, CharacteristicValue[]> = {};

    characteristicVariables.forEach((variable) => {
      characteristicsByVariable[variable.name] = [];

      // Get unique characteristic values
      const uniqueValues = new Set<string>();
      filteredData.forEach((row) => {
        if (row && row[variable.name] !== undefined && row[variable.name] !== null && row[variable.name] !== "") {
          uniqueValues.add(String(row[variable.name]));
        }
      });

      // Format characteristic values - hanya karakteristik yang dipilih oleh pengguna
      Array.from(uniqueValues).sort().forEach((value, index) => {
        // Hanya tambahkan jika nilai karakteristik dipilih pengguna
        // Atau jika selectedCharacteristics berisi variableName
        if (selectedCharacteristics.includes(`${variable.id}_value_${index}`) ||
            selectedCharacteristics.includes(variable.name)) {
          characteristicsByVariable[variable.name].push({
            id: `${variable.id}_value_${index}`,
            name: value,
            variableId: variable.id,
            variableName: variable.name,
            type: variable.type === "measure" ? "measure" : "count",
          });
        }
      });
    });

    // Periksa apakah ada karakteristik yang ditemukan
    if (Object.keys(characteristicsByVariable).length === 0) {
      console.warn("No characteristic values found in filtered data");
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

    // Add characteristic columns for each year
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
        const { year, characteristicName, characteristicValue } = column;

        if (!year || !characteristicName || !characteristicValue) {
          console.warn("Missing column properties", column);
          dataRow[column.id] = 0;
          return;
        }

        // Filter data for this year and row combination - dengan penanganan null/undefined
        const filteredRows = filteredData.filter((row) => {
          if (!row) return false; // Skip invalid rows

          // Skip if row doesn't have year data
          const yearVal = row[yearVariable.name];
          if (yearVal === undefined || yearVal === null || String(yearVal) !== year) return false;

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

    return { data: pivotData, columns: pivotColumns };
  };

  // Fungsi untuk menghasilkan data pivot tabel dengan cara lama (backward compatibility)
  const generatePivotTableLegacy = (dataArray: any[], yearVariable: DatasetVariable) => {
    // Filter data based on selected years - pastikan setiap row valid sebelum memfilter
    const filteredData = dataArray.filter((row) =>
      row && // pastikan row tidak null/undefined
      row[yearVariable.name] !== undefined &&
      row[yearVariable.name] !== null &&
      row[yearVariable.name] !== "" &&
      selectedYears.includes(String(row[yearVariable.name])) &&
      String(row[yearVariable.name]) !== "null" &&
      String(row[yearVariable.name]) !== "undefined"
    );

    if (filteredData.length === 0) {
      console.warn("No data after filtering by selected years in legacy mode");
      return { data: [], columns: [] };
    }

    // Get aggregation method from dataset configuration
    const aggregationMethod = selectedDataset?.tableConfig?.aggregationMethod || "sum";

    // Get row titles by variable
    const rowTitlesByVariable: Record<string, RowTitleValue[]> = {};
    selectedRowTitles.forEach((variableName) => {
      const rowValues = availableRowTitles.filter((row) => row.variableName === variableName);
      if (rowValues.length > 0) {
        rowTitlesByVariable[variableName] = rowValues;
      }
    });

    if (Object.keys(rowTitlesByVariable).length === 0) {
      console.warn("No row titles selected in legacy mode");
      return { data: [], columns: [] };
    }

    // Get characteristic values by variable
    const characteristicsByVariable: Record<string, CharacteristicValue[]> = {};
    selectedCharacteristics.forEach((variableName) => {
      const characteristicValues = availableCharacteristics.filter((c) => c.variableName === variableName);
      if (characteristicValues.length > 0) {
        characteristicsByVariable[variableName] = characteristicValues;
      }
    });

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

    // Add characteristic columns for each year
    const characteristicValueColumns: PivotColumn[] = [];

    selectedYears.forEach((year) => {
      // Skip null or undefined years
      if (!year || year === "null" || year === "undefined") return;

      Object.keys(characteristicsByVariable).forEach((variableName) => {
        const characteristicValues = characteristicsByVariable[variableName];

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
        const { year, characteristicName, characteristicValue } = column;

        if (!year || !characteristicName || !characteristicValue) {
          console.warn("Missing column properties", column);
          dataRow[column.id] = 0;
          return;
        }

        // Filter data for this year and row combination - dengan penanganan null/undefined
        const filteredRows = filteredData.filter((row) => {
          if (!row) return false; // Skip invalid rows

          // Skip if row doesn't have year data
          const yearVal = row[yearVariable.name];
          if (yearVal === undefined || yearVal === null || String(yearVal) !== year) return false;

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

    return { data: pivotData, columns: pivotColumns };
  };

  // Tambahkan fungsi untuk menambahkan data yang dipilih
  const handleAddSelection = () => {
    setSelectedData({
      years: selectedYears,
      yearDerivatives: selectedYearDerivatives,
      characteristics: selectedCharacteristics,
      rowTitles: selectedRowTitles,
    })

    toast({
      title: "Data Terpilih",
      description: "Data telah ditambahkan ke daftar pilihan. Klik 'Submit' untuk menampilkan tabel.",
    })
  }

  const handleSubmit = async () => {
    if (selectedData) {
      try {
        // Tampilkan pesan loading
        toast({
          title: "Memproses Data",
          description: "Sedang menghasilkan tabel pivot, harap tunggu...",
        });

        // Tunggu hingga hasil generatePivotTableData tersedia
        const result = await generatePivotTableData();

        // Periksa apakah result berisi data dan columns
        if (result && typeof result === 'object') {
          const { data = [], columns = [] } = result;

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
          description: "Terjadi kesalahan saat membuat tabel pivot.",
          variant: "destructive",
        });
      }
    }
  }

  const handleReset = () => {
    setSelectedYears([])
    setSelectedYearDerivatives([])
    setSelectedCharacteristics([])
    setSelectedRowTitles([])
    setSelectedData(null)
    setTableData([])
    setPivotTableData([])
    setPivotColumns([])
    setShowTable(false)
  }

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

  // Fungsi untuk mendapatkan header tahun
  const getYearHeaders = () => {
    const yearHeaders: Record<string, { year: string; columns: PivotColumn[] }> = {}

    pivotColumns
      .filter(col => col.type !== "rowTitle" && col.type !== "total")
      .forEach((column) => {
        if (column.year) {
        if (!yearHeaders[column.year]) {
          yearHeaders[column.year] = { year: column.year, columns: [] }
        }
        yearHeaders[column.year].columns.push(column)
      }
    })

    return Object.values(yearHeaders)
  }

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

              <Card className="h-[400px] overflow-hidden">
                <CardContent className="p-0">
                  <div className="h-full overflow-y-auto">
                    {loading ? (
                      <div className="flex items-center justify-center h-full text-center p-4">
                        <p className="text-muted-foreground">Memuat tabel...</p>
                      </div>
                    ) : displayedConfigurations.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-center p-4">
                        <p className="text-muted-foreground">Tidak ada tabel yang tersedia</p>
                      </div>
                    ) : (
                      displayedConfigurations.map((config) => (
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
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
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
                selectedCharacteristics.length === 0 ||
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
                          rowSpan={2}
                          className="border p-2 bg-blue-900 text-white font-medium text-sm sticky left-0 z-20"
                        >
                          {column.name}
                        </th>
                      ))}

                    {/* Kolom untuk tahun (merged cells) */}
                    {getYearHeaders().map((yearHeader) => (
                      <th
                        key={`header-year-${yearHeader.year}`}
                        colSpan={yearHeader.columns.length}
                        className="border p-2 bg-blue-900 text-white font-medium text-sm text-center"
                      >
                        {yearHeader.year}
                      </th>
                    ))}

                    {/* Kolom untuk total */}
                    <th rowSpan={2} className="border p-2 bg-blue-700 text-white font-medium text-sm text-center">
                      Total
                    </th>
                  </tr>

                  {/* Header baris kedua - Karakteristik */}
                  <tr>
                    {/* Kolom untuk karakteristik - Pastikan urutan sama dengan data */}
                    {pivotColumns
                      .filter((col) => col.type !== "rowTitle" && col.type !== "total")
                      .map((column) => (
                        <th
                          key={`subheader-${column.id}`}
                          className="border p-2 bg-blue-800 text-white font-medium text-sm text-center"
                        >
                          {column.characteristicValue}
                        </th>
                      ))}
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
