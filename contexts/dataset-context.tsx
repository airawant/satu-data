"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type DatasetVariable = {
  id: string
  name: string
  type: "dimension" | "measure"
  dataType: "string" | "number" | "date"
  selected: boolean
}

// Ubah tipe TableConfig untuk mendukung multiple configurations
export type TableConfig = {
  id: string // ID unik untuk konfigurasi
  titleField: string // Field untuk judul tabel/indikator
  rowField: string // Field untuk judul baris
  characteristicFields: string[] // Field untuk karakteristik kolom
  aggregationMethod: "sum" | "count" | "average" // Metode agregasi data
}

// Tambahkan properti tableConfigs pada tipe Dataset
export type Dataset = {
  id: string
  name: string
  description: string
  category: string
  source: string
  created_at?: string
  updated_at?: string
  variables: DatasetVariable[]
  content: Record<string, any>[]
  groupVariable?: string // Variabel yang digunakan untuk pengelompokan
  tableConfig?: TableConfig // Untuk backward compatibility
  tableConfigs?: TableConfig[] // Array untuk menyimpan multiple configurations
}

// Tambahkan fungsi untuk mengelola multiple configurations
type DatasetContextType = {
  datasets: Dataset[]
  addDataset: (dataset: Omit<Dataset, "id" | "created_at" | "updated_at" | "tableConfigs">) => Promise<string>
  updateDataset: (id: string, dataset: Partial<Dataset>) => Promise<void>
  deleteDataset: (id: string) => Promise<void>
  getDataset: (id: string) => Promise<Dataset | undefined>
  clearAllDatasets: () => void
  loading: boolean
  updateTableConfig: (id: string, config: TableConfig) => Promise<void>
  addTableConfig: (datasetId: string, config: Omit<TableConfig, "id">) => Promise<string>
  deleteTableConfig: (datasetId: string, configId: string) => Promise<void>
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined)

export function DatasetProvider({ children }: { children: React.ReactNode }) {
  const [datasets, setDatasets] = useState<Dataset[]>([])
  const [loading, setLoading] = useState(true)

  // Load datasets from API on mount
  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/datasets')
        if (!response.ok) {
          throw new Error(`Error fetching datasets: ${response.statusText}`)
        }

        const data = await response.json()

          // Ensure tableConfigs exists for backward compatibility
        const datasetsWithTableConfigs = data.map((dataset: Dataset) => {
          const newDataset = { ...dataset };
          if (!newDataset.tableConfigs) {
            newDataset.tableConfigs = newDataset.tableConfig
              ? [{ ...newDataset.tableConfig, id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }]
              : [];
          }
          return newDataset;
        });

        // Untuk setiap dataset, ambil konfigurasi tabel terkait dari API baru
        const datasetsWithConfigs = await Promise.all(
          datasetsWithTableConfigs.map(async (dataset: Dataset) => {
            try {
              const tableConfigsResponse = await fetch(`/api/table-configs/dataset/${dataset.id}`);
              if (!tableConfigsResponse.ok) {
                console.warn(`Could not fetch table configs for dataset ${dataset.id}`);
                return dataset;
              }

              const tableConfigs = await tableConfigsResponse.json();

              // Konversi format API baru ke format yang digunakan oleh aplikasi
              const formattedTableConfigs = tableConfigs.map((config: any) => ({
                id: config.id,
                titleField: config.title_field,
                rowField: config.row_field,
                characteristicFields: config.characteristic_fields,
                aggregationMethod: config.aggregation_method
              }));

              // Jika ada konfigurasi baru, gunakan itu
              if (formattedTableConfigs.length > 0) {
                return {
                  ...dataset,
                  tableConfigs: formattedTableConfigs,
                  tableConfig: formattedTableConfigs[0] // Set tableConfig ke konfigurasi pertama
                };
              }

              return dataset;
            } catch (error) {
              console.error(`Error fetching table configs for dataset ${dataset.id}:`, error);
              return dataset;
            }
          })
        );

        setDatasets(datasetsWithConfigs)
      } catch (error) {
        console.error('Error loading datasets:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchDatasets()
  }, [])

  const addDataset = async (dataset: Omit<Dataset, "id" | "created_at" | "updated_at" | "tableConfigs">) => {
    try {
      setLoading(true)
      const response = await fetch('/api/datasets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataset),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Error creating dataset: ${errorData.error || response.statusText}`);
      }

      const newDataset = await response.json()

      // Ensure tableConfigs exists
      if (!newDataset.tableConfigs) {
        newDataset.tableConfigs = []
    }

    setDatasets((prev) => [...prev, newDataset])

      return newDataset.id
    } catch (error) {
      console.error('Error creating dataset:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const updateDataset = async (id: string, updates: Partial<Dataset>) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/datasets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Error updating dataset: ${response.statusText}`)
      }

      const updatedDataset = await response.json()

    setDatasets((prev) =>
        prev.map((dataset) => (dataset.id === id ? updatedDataset : dataset))
      )
    } catch (error) {
      console.error(`Error updating dataset with id ${id}:`, error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const deleteDataset = async (id: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/datasets/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Error deleting dataset: ${response.statusText}`)
      }

    setDatasets((prev) => prev.filter((dataset) => dataset.id !== id))
    } catch (error) {
      console.error(`Error deleting dataset with id ${id}:`, error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const getDataset = async (id: string) => {
    try {
      setLoading(true);

      // Cek apakah dataset ada di state terlebih dahulu
      const existingDataset = datasets.find(d => d.id === id);
      if (existingDataset) {
        return existingDataset;
      }

      // Jika tidak ada di state, ambil dari API
      const response = await fetch(`/api/datasets/${id}`);
      if (!response.ok) {
        throw new Error(`Error fetching dataset: ${response.statusText}`);
      }

      const dataset = await response.json();

      // Ensure tableConfigs exists for backward compatibility
      const datasetWithConfigs = { ...dataset };
      if (!datasetWithConfigs.tableConfigs) {
        datasetWithConfigs.tableConfigs = datasetWithConfigs.tableConfig
          ? [{ ...datasetWithConfigs.tableConfig, id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}` }]
          : [];
      }

      // Ambil table configs dari API
      try {
        const tableConfigsResponse = await fetch(`/api/table-configs/dataset/${id}`);
        if (tableConfigsResponse.ok) {
          const tableConfigs = await tableConfigsResponse.json();

          // Konversi format API baru ke format yang digunakan oleh aplikasi
          const formattedTableConfigs = tableConfigs.map((config: any) => ({
            id: config.id,
            titleField: config.title_field,
            rowField: config.row_field,
            characteristicFields: config.characteristic_fields,
            aggregationMethod: config.aggregation_method
          }));

          // Jika ada konfigurasi baru, gunakan itu
          if (formattedTableConfigs.length > 0) {
            datasetWithConfigs.tableConfigs = formattedTableConfigs;
            datasetWithConfigs.tableConfig = formattedTableConfigs[0]; // Set tableConfig ke konfigurasi pertama
          }
        }
      } catch (error) {
        console.error(`Error fetching table configs for dataset ${id}:`, error);
      }

      // Update state datasets untuk menyimpan dataset yang baru diambil
      setDatasets(prev => {
        // Jika dataset sudah ada di state, ganti dengan yang baru
        const exists = prev.some(d => d.id === id);
        if (exists) {
          return prev.map(d => d.id === id ? datasetWithConfigs : d);
        }
        // Jika belum ada, tambahkan ke array
        return [...prev, datasetWithConfigs];
      });

      return datasetWithConfigs;
    } catch (error) {
      console.error(`Error getting dataset with id ${id}:`, error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const clearAllDatasets = () => {
    // This is now a dangerous operation and should probably be disabled or require confirmation
    console.warn('clearAllDatasets is not implemented with API integration')
  }

  // For backward compatibility - akan menggunakan API baru
  const updateTableConfig = async (id: string, config: TableConfig) => {
    try {
      // Pertama, cek apakah dataset dengan ID ini ada
      const dataset = datasets.find((d) => d.id === id);
      if (!dataset) {
        throw new Error(`Dataset with id ${id} not found`);
      }

      // Siapkan data untuk API baru
      const apiConfig = {
        dataset_id: id,
        title: config.titleField || "Konfigurasi Tabel",
        description: dataset.description || "",
        title_field: config.titleField,
        row_field: config.rowField,
        characteristic_fields: config.characteristicFields,
        aggregation_method: config.aggregationMethod
      };

      if (config.id && config.id.startsWith('config_')) {
        // Gunakan API untuk memperbarui konfigurasi tabel yang sudah ada di tabel baru
        // Jika menggunakan format ID lama, kita perlu buat konfigurasi baru
        await fetch('/api/table-configs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiConfig),
        });
      } else {
        // Perbarui menggunakan API
        await fetch(`/api/table-configs/${config.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(apiConfig),
        });
      }

      // Refresh data
      const updatedDataset = await getDataset(id);
      if (updatedDataset) {
        setDatasets((prev) =>
          prev.map((d) => (d.id === id ? updatedDataset : d))
        );
      }
    } catch (error) {
      console.error(`Error updating table config for dataset ${id}:`, error);
      throw error;
    }
  };

  // Add a new table configuration menggunakan API baru
  const addTableConfig = async (datasetId: string, config: Omit<TableConfig, "id">) => {
    try {
      // Cek apakah dataset ada
      const dataset = datasets.find((d) => d.id === datasetId);
      if (!dataset) {
        throw new Error(`Dataset with id ${datasetId} not found`);
      }

      // Format data untuk API baru
      const apiConfig = {
        dataset_id: datasetId,
        title: config.titleField || "Konfigurasi Tabel",
        description: dataset.description || "",
        title_field: config.titleField,
        row_field: config.rowField,
        characteristic_fields: config.characteristicFields,
        aggregation_method: config.aggregationMethod
      };

      // Buat konfigurasi baru menggunakan API
      const response = await fetch('/api/table-configs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiConfig),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: response.statusText }));
        throw new Error(`Error creating table config: ${errorData.error || response.statusText}`);
      }

      const newConfig = await response.json();

      // Refresh data
      const updatedDataset = await getDataset(datasetId);
      if (updatedDataset) {
    setDatasets((prev) =>
          prev.map((d) => (d.id === datasetId ? updatedDataset : d))
        );
      }

      return newConfig.id;
    } catch (error) {
      console.error(`Error adding table config to dataset ${datasetId}:`, error);
      throw error;
    }
  };

  // Delete a table configuration menggunakan API baru
  const deleteTableConfig = async (datasetId: string, configId: string) => {
    try {
      // Cek apakah dataset ada
      const dataset = datasets.find((d) => d.id === datasetId);
      if (!dataset) {
        throw new Error(`Dataset with id ${datasetId} not found`);
      }

      // Hapus konfigurasi menggunakan API
      const response = await fetch(`/api/table-configs/${configId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Error deleting table config: ${response.statusText}`);
      }

      // Refresh data
      const updatedDataset = await getDataset(datasetId);
      if (updatedDataset) {
        setDatasets((prev) =>
          prev.map((d) => (d.id === datasetId ? updatedDataset : d))
        );
      }
    } catch (error) {
      console.error(`Error deleting table config from dataset ${datasetId}:`, error);
      throw error;
    }
  };

  return (
    <DatasetContext.Provider
      value={{
        datasets,
        addDataset,
        updateDataset,
        deleteDataset,
        getDataset,
        clearAllDatasets,
        loading,
        updateTableConfig,
        addTableConfig,
        deleteTableConfig,
      }}
    >
      {children}
    </DatasetContext.Provider>
  )
}

export function useDatasets() {
  const context = useContext(DatasetContext)
  if (context === undefined) {
    throw new Error("useDatasets must be used within a DatasetProvider")
  }
  return context
}
