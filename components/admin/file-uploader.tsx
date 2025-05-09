"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileIcon, UploadCloudIcon, XIcon } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface FileUploaderProps {
  onFileUpload: (file: File, parsedData: any) => void
  isLoading: boolean
}

export function FileUploader({ onFileUpload, isLoading }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      validateAndSetFile(file)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault()

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      validateAndSetFile(file)
    }
  }

  const validateAndSetFile = (file: File) => {
    const fileExtension = file.name.split(".").pop()?.toLowerCase()
    setParseError(null)

    if (fileExtension === "csv") {
      setSelectedFile(file)
    } else if (fileExtension === "xlsx") {
      toast({
        variant: "destructive",
        title: "Format Excel tidak didukung",
        description: "Silakan konversi file Excel Anda ke format CSV dan coba lagi.",
      })
    } else {
      toast({
        variant: "destructive",
        title: "Format file tidak valid",
        description: "Silakan unggah file CSV.",
      })
    }
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        const text = await selectedFile.text()
        const parsedData = parseCSV(text)
        onFileUpload(selectedFile, parsedData)
      } else {
        toast({
          variant: "destructive",
          title: "Format file tidak didukung",
          description: "Silakan gunakan format CSV.",
        })
      }
    } catch (error) {
      console.error("Error parsing file:", error)
      setParseError("Kesalahan saat mengurai file. Silakan periksa format file dan coba lagi.")
      toast({
        variant: "destructive",
        title: "Kesalahan mengurai file",
        description: "Silakan periksa format file dan coba lagi.",
      })
    }
  }

  const parseCSV = (csvText: string) => {
    // Detect the delimiter (comma, semicolon, tab)
    const firstLine = csvText.split(/\r\n|\n/)[0]
    let delimiter = ","

    // Count occurrences of potential delimiters
    const commaCount = (firstLine.match(/,/g) || []).length
    const semicolonCount = (firstLine.match(/;/g) || []).length
    const tabCount = (firstLine.match(/\t/g) || []).length

    // Choose the delimiter with the most occurrences
    if (semicolonCount > commaCount && semicolonCount > tabCount) {
      delimiter = ";"
    } else if (tabCount > commaCount && tabCount > semicolonCount) {
      delimiter = "\t"
    }

    // Split the CSV text into lines
    const lines = csvText.split(/\r\n|\n/).filter((line) => line.trim() !== "")
    if (lines.length === 0) throw new Error("File kosong")

    // Parse header
    const headers = parseCSVLine(lines[0], delimiter)

    // Parse data rows
    const data = []
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i], delimiter)

      // Create row object if the number of values matches the number of headers
      if (values.length === headers.length) {
        const row: Record<string, any> = {}
        headers.forEach((header, index) => {
          // Try to convert to number if possible
          const value = values[index]
          if (!isNaN(Number(value)) && value.trim() !== "") {
            row[header] = Number(value)
          } else {
            row[header] = value
          }
        })
        data.push(row)
      }
    }

    return { headers, data }
  }

  // Helper function to parse a CSV line with proper handling of quoted values
  const parseCSVLine = (line: string, delimiter: string) => {
    const values: string[] = []
    let currentValue = ""
    let insideQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]

      if (char === '"') {
        insideQuotes = !insideQuotes
      } else if (char === delimiter && !insideQuotes) {
        values.push(currentValue.trim().replace(/^"|"$/g, ""))
        currentValue = ""
      } else {
        currentValue += char
      }
    }

    // Add the last value
    values.push(currentValue.trim().replace(/^"|"$/g, ""))

    return values
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setParseError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-6 ${
          dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
        } transition-colors duration-200 flex flex-col items-center justify-center text-center`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" className="hidden" accept=".csv" onChange={handleChange} />

        <UploadCloudIcon className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">Seret dan lepas file Anda di sini</h3>
        <p className="text-sm text-muted-foreground mb-4">Format yang didukung: CSV</p>
        <Button type="button" onClick={handleButtonClick} variant="outline">
          Pilih File
        </Button>
      </div>

      {selectedFile && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileIcon className="h-8 w-8 text-primary" />
              <div>
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={handleRemoveFile} disabled={isLoading}>
                <XIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}

      {parseError && <div className="text-sm text-red-500 mt-2">{parseError}</div>}

      <div className="flex justify-end">
        <Button onClick={handleUpload} disabled={!selectedFile || isLoading}>
          {isLoading ? "Memproses..." : "Unggah & Pratinjau"}
        </Button>
      </div>
    </div>
  )
}
