"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

export type SavedItemType = "graph" | "table"

export interface SavedItem {
  id: string
  type: SavedItemType
  title: string
  description: string
  createdAt: Date
  datasetId: string
  datasetName: string
  configuration: any // Configuration data specific to the type
  previewImageUrl?: string
}

interface SavedItemsContextType {
  savedItems: SavedItem[]
  addSavedItem: (item: Omit<SavedItem, "id" | "createdAt">) => string
  updateSavedItem: (id: string, updates: Partial<Omit<SavedItem, "id" | "createdAt">>) => void
  deleteSavedItem: (id: string) => void
  getSavedItem: (id: string) => SavedItem | undefined
  loading: boolean
}

const SavedItemsContext = createContext<SavedItemsContextType | undefined>(undefined)

export function SavedItemsProvider({ children }: { children: React.ReactNode }) {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([])
  const [loading, setLoading] = useState(true)

  // Load saved items from localStorage on mount
  useEffect(() => {
    const loadSavedItems = () => {
      try {
        const storedItems = localStorage.getItem("savedItems")
        if (storedItems) {
          // Parse dates properly
          const parsed = JSON.parse(storedItems, (key, value) => {
            if (key === "createdAt") {
              return new Date(value)
            }
            return value
          })
          setSavedItems(parsed)
        }
      } catch (error) {
        console.error("Error loading saved items:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSavedItems()
  }, [])

  // Save items to localStorage whenever they change
  useEffect(() => {
    if (!loading) {
      localStorage.setItem("savedItems", JSON.stringify(savedItems))
    }
  }, [savedItems, loading])

  const addSavedItem = (item: Omit<SavedItem, "id" | "createdAt">) => {
    const id = `item_${Date.now()}`
    const newItem: SavedItem = {
      ...item,
      id,
      createdAt: new Date(),
    }

    setSavedItems((prev) => [...prev, newItem])
    return id
  }

  const updateSavedItem = (id: string, updates: Partial<Omit<SavedItem, "id" | "createdAt">>) => {
    setSavedItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
            }
          : item,
      ),
    )
  }

  const deleteSavedItem = (id: string) => {
    setSavedItems((prev) => prev.filter((item) => item.id !== id))
  }

  const getSavedItem = (id: string) => {
    return savedItems.find((item) => item.id === id)
  }

  return (
    <SavedItemsContext.Provider
      value={{
        savedItems,
        addSavedItem,
        updateSavedItem,
        deleteSavedItem,
        getSavedItem,
        loading,
      }}
    >
      {children}
    </SavedItemsContext.Provider>
  )
}

export function useSavedItems() {
  const context = useContext(SavedItemsContext)
  if (context === undefined) {
    throw new Error("useSavedItems must be used within a SavedItemsProvider")
  }
  return context
}
