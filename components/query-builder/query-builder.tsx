"use client"

import { useState } from "react"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { DndContext, type DragEndEvent, closestCenter } from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, ArrowDown, ArrowUp, FileSpreadsheet, GripVertical, Plus, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { QueryResults } from "@/components/query-builder/query-results"
import { useDatasets } from "@/contexts/dataset-context"
import { useToast } from "@/components/ui/use-toast"

type Field = {
  id: string
  name: string
  type: "dimension" | "measure"
  dataType: "string" | "number" | "date"
}

type Filter = {
  id: string
  field: string
  operator: string
  value: string
}

export function QueryBuilder() {
  const searchParams = useSearchParams()
  const { datasets, loading } = useDatasets()
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("")
  const [selectedFields, setSelectedFields] = React.useState<Field[]>([])
  const [filters, setFilters] = React.useState<Filter[]>([])
  const [showResults, setShowResults] = React.useState(false)
  const { toast } = useToast()

  // Check if there's a dataset ID in the URL
  React.useEffect(() => {
    const datasetId = searchParams.get("dataset")
    if (datasetId && !loading) {
      setSelectedDatasetId(datasetId)
    }
  }, [searchParams, loading])

  // Get the selected dataset
  const selectedDataset = React.useMemo(() => {
    return datasets.find((d) => d.id === selectedDatasetId)
  }, [datasets, selectedDatasetId])

  // Get available fields from the selected dataset
  const availableFields = React.useMemo(() => {
    if (!selectedDataset) return []

    return selectedDataset.variables
      .filter((variable) => variable.selected)
      .map((variable) => ({
        id: variable.id,
        name: variable.name,
        type: variable.type,
        dataType: variable.dataType,
      }))
  }, [selectedDataset])

  const handleAddField = (field: Field) => {
    if (!selectedFields.find((f) => f.id === field.id)) {
      setSelectedFields([...selectedFields, field])
    }
  }

  const handleRemoveField = (fieldId: string) => {
    setSelectedFields(selectedFields.filter((field) => field.id !== fieldId))
  }

  const handleAddFilter = () => {
    if (availableFields.length === 0) {
      toast({
        title: "No fields available",
        description: "Please select a dataset first",
        variant: "destructive",
      })
      return
    }

    const newFilter: Filter = {
      id: `filter-${Date.now()}`,
      field: availableFields[0].id,
      operator: "equals",
      value: "",
    }
    setFilters([...filters, newFilter])
  }

  const handleRemoveFilter = (filterId: string) => {
    setFilters(filters.filter((filter) => filter.id !== filterId))
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id) {
      setSelectedFields((fields) => {
        const oldIndex = fields.findIndex((field) => field.id === active.id)
        const newIndex = fields.findIndex((field) => field.id === over.id)

        return arrayMove(fields, oldIndex, newIndex)
      })
    }
  }

  const handleSelectDataset = (datasetId: string) => {
    setSelectedDatasetId(datasetId)
    setSelectedFields([])
    setFilters([])
    setShowResults(false)
  }

  const handleReset = () => {
    setSelectedFields([])
    setFilters([])
    setShowResults(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading datasets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Build Your Query</CardTitle>
          <CardDescription>Select fields, add filters, and arrange your data to create a custom query.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label htmlFor="dataset-select" className="block text-sm font-medium mb-2">
              Dataset
            </Label>
            <Select value={selectedDatasetId} onValueChange={handleSelectDataset}>
              <SelectTrigger id="dataset-select" className="w-full">
                <SelectValue placeholder="Select a dataset" />
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
                Category: {selectedDataset.category.charAt(0).toUpperCase() + selectedDataset.category.slice(1)}
              </p>
            )}
          </div>

          {selectedDataset && (
            <Tabs defaultValue="fields">
              <TabsList className="mb-4">
                <TabsTrigger value="fields">Fields</TabsTrigger>
                <TabsTrigger value="filters">Filters</TabsTrigger>
                <TabsTrigger value="sort">Sort</TabsTrigger>
              </TabsList>

              <TabsContent value="fields" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Available Fields</h3>
                    <div className="border rounded-md p-4 h-[300px] overflow-y-auto">
                      <div className="space-y-2">
                        {availableFields.map((field) => (
                          <div
                            key={field.id}
                            className="flex items-center justify-between p-2 hover:bg-muted rounded-md cursor-pointer"
                            onClick={() => handleAddField(field)}
                          >
                            <div className="flex items-center">
                              <Badge variant={field.type === "dimension" ? "default" : "secondary"} className="mr-2">
                                {field.type === "dimension" ? "D" : "M"}
                              </Badge>
                              <span>{field.name}</span>
                            </div>
                            <Plus className="h-4 w-4 text-muted-foreground" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium mb-2">Selected Fields</h3>
                    <div className="border rounded-md p-4 h-[300px] overflow-y-auto">
                      <DndContext
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                        modifiers={[restrictToVerticalAxis]}
                      >
                        <SortableContext items={selectedFields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
                          <div className="space-y-2">
                            {selectedFields.length === 0 ? (
                              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-4">
                                <FileSpreadsheet className="h-8 w-8 mb-2" />
                                <p>Drag fields here or click on fields from the available list</p>
                              </div>
                            ) : (
                              selectedFields.map((field) => (
                                <SortableField key={field.id} field={field} onRemove={handleRemoveField} />
                              ))
                            )}
                          </div>
                        </SortableContext>
                      </DndContext>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="filters" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-medium">Filters</h3>
                    <Button variant="outline" size="sm" onClick={handleAddFilter}>
                      <Plus className="h-4 w-4 mr-1" /> Add Filter
                    </Button>
                  </div>

                  <div className="border rounded-md p-4">
                    {filters.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground p-4">
                        <AlertTriangle className="h-8 w-8 mb-2" />
                        <p>No filters added yet. Add a filter to narrow down your results.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {filters.map((filter) => (
                          <div key={filter.id} className="flex items-center gap-2">
                            <Select defaultValue={filter.field}>
                              <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Select field" />
                              </SelectTrigger>
                              <SelectContent>
                                {availableFields.map((field) => (
                                  <SelectItem key={field.id} value={field.id}>
                                    {field.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select defaultValue="equals">
                              <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Operator" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="equals">Equals</SelectItem>
                                <SelectItem value="contains">Contains</SelectItem>
                                <SelectItem value="greater_than">Greater than</SelectItem>
                                <SelectItem value="less_than">Less than</SelectItem>
                              </SelectContent>
                            </Select>

                            <Input placeholder="Value" className="flex-1" />

                            <Button variant="ghost" size="icon" onClick={() => handleRemoveFilter(filter.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sort" className="space-y-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium">Sort Options</h3>
                  <div className="border rounded-md p-4">
                    <div className="space-y-4">
                      {selectedFields.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-center text-muted-foreground p-4">
                          <p>Add fields first to enable sorting options</p>
                        </div>
                      ) : (
                        selectedFields.map((field) => (
                          <div key={field.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Checkbox id={`sort-${field.id}`} />
                              <Label htmlFor={`sort-${field.id}`}>{field.name}</Label>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon">
                                <ArrowUp className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <ArrowDown className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end mt-6 gap-2">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={() => setShowResults(true)} disabled={selectedFields.length === 0}>
              Run Query
            </Button>
          </div>
        </CardContent>
      </Card>

      {showResults && selectedDataset && <QueryResults fields={selectedFields} dataset={selectedDataset} />}
    </div>
  )
}

interface SortableFieldProps {
  field: Field
  onRemove: (id: string) => void
}

function SortableField({ field, onRemove }: SortableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: field.id })

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
  }

  return (
    <div ref={setNodeRef} style={style} className="flex items-center justify-between p-2 bg-muted rounded-md">
      <div className="flex items-center">
        <div {...attributes} {...listeners} className="cursor-grab mr-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        <Badge variant={field.type === "dimension" ? "default" : "secondary"} className="mr-2">
          {field.type === "dimension" ? "D" : "M"}
        </Badge>
        <span>{field.name}</span>
      </div>
      <Button variant="ghost" size="icon" onClick={() => onRemove(field.id)}>
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}
