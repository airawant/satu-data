"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FileIcon, UploadCloudIcon, XIcon, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose
} from "@/components/ui/dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface DatasetContentUploaderProps {
  onContentReplace: (newContent: Record<string, any>[], headers: string[]) => Promise<void>
  isLoading: boolean
  datasetName: string
}

export function DatasetContentUploader({ onContentReplace, isLoading, datasetName }: DatasetContentUploaderProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [parsedData, setParsedData] = useState<{ headers: string[], data: Record<string, any>[] } | null>(null)
  const [isParsingFile, setIsParsingFile] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const closeDialogRef = useRef<HTMLButtonElement>(null)
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
    setParsedData(null)

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

  const handleParse = async () => {
    if (!selectedFile) return

    try {
      setIsParsingFile(true)
      if (selectedFile.type === "text/csv" || selectedFile.name.endsWith(".csv")) {
        const text = await selectedFile.text()
        const result = parseCSV(text)

        if (result.data.length === 0) {
          setParseError("File tidak memiliki data baris. Pastikan file CSV Anda memiliki setidaknya satu baris data.")
          return
        }

        setParsedData(result)
        setShowConfirmDialog(true)
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
    } finally {
      setIsParsingFile(false)
    }
  }

  const handleReplaceContent = async () => {
    if (!parsedData) return

    try {
      await onContentReplace(parsedData.data, parsedData.headers)

      // Reset state
      setSelectedFile(null)
      setParsedData(null)
      setShowConfirmDialog(false)

      // Close dialog if open
      closeDialogRef.current?.click()

      if (inputRef.current) {
        inputRef.current.value = ""
      }
    } catch (error) {
      console.error("Error replacing content:", error)
      toast({
        variant: "destructive",
        title: "Kesalahan mengganti konten",
        description: "Terjadi kesalahan saat mengganti konten dataset.",
      })
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setParsedData(null)
    setParseError(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Ganti Konten Dataset</Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Ganti Konten Dataset</DialogTitle>
            <DialogDescription>
              Unggah file CSV baru untuk mengganti konten dataset "{datasetName}".
              Tindakan ini akan mengganti semua data yang ada dalam dataset.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Perhatian</AlertTitle>
              <AlertDescription>
                Mengganti konten dataset akan menimpa semua data yang ada,
                tindakan ini tidak dapat dibatalkan. Pastikan struktur CSV
                cocok dengan dataset yang ada.
              </AlertDescription>
            </Alert>

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
              <h3 className="text-lg font-medium">Seret dan lepas file CSV Anda di sini</h3>
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
                    <Button variant="outline" size="icon" onClick={handleRemoveFile} disabled={isLoading || isParsingFile}>
                      <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {parseError && <div className="text-sm text-red-500 mt-2">{parseError}</div>}
          </div>

          <DialogFooter>
            <DialogClose ref={closeDialogRef} asChild>
              <Button variant="outline">Batal</Button>
            </DialogClose>
            <Button
              onClick={handleParse}
              disabled={!selectedFile || isLoading || isParsingFile}
            >
              {isParsingFile ? "Memproses..." : "Periksa File"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog konfirmasi penggantian konten */}
      {parsedData && (
        <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Konfirmasi Penggantian Konten</DialogTitle>
              <DialogDescription>
                File CSV telah dianalisis. Konten dataset akan diganti dengan data berikut:
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Jumlah kolom:</p>
                  <p className="text-base">{parsedData?.headers.length}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Jumlah baris:</p>
                  <p className="text-base">{parsedData?.data.length}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Kolom yang terdeteksi:</p>
                <div className="text-sm mt-1 p-2 bg-gray-50 rounded max-h-32 overflow-y-auto">
                  {parsedData?.headers.join(", ")}
                </div>
              </div>

              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Peringatan</AlertTitle>
                <AlertDescription>
                  Tindakan ini akan mengganti seluruh konten dataset dan tidak dapat dibatalkan.
                  Pastikan data yang Anda unggah sudah sesuai.
                </AlertDescription>
              </Alert>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleReplaceContent}
                disabled={isLoading}
              >
                {isLoading ? "Memproses..." : "Ganti Konten Dataset"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
