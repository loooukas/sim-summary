"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Upload, FileText, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface FileUploadProps {
  onFileUpload: (data: any[]) => void
  hasData: boolean
}

export function FileUpload({ onFileUpload, hasData }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [fileName, setFileName] = useState<string>("")

  const processFile = useCallback(
    async (file: File) => {
      if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
        alert("Please upload a CSV file")
        return
      }

      setIsProcessing(true)
      setFileName(file.name)

      try {
        const text = await file.text()
        const lines = text.split("\n").filter((line) => line.trim())

        if (lines.length === 0) {
          alert("No data found in the CSV file")
          setIsProcessing(false)
          return
        }

        const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
        const data = []

        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""))
          const row: any = {}

          headers.forEach((header, index) => {
            row[header] = values[index] || ""
          })

          data.push(row)
        }

        console.log("CSV parsed successfully:", data.length, "rows")
        console.log("Headers found:", headers)
        console.log("Sample row:", data[0])

        onFileUpload(data)
      } catch (error) {
        console.error("Error processing CSV file:", error)
        alert("Error processing the CSV file. Please check the file format.")
      } finally {
        setIsProcessing(false)
      }
    },
    [onFileUpload],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragActive(false)

      const file = e.dataTransfer.files[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragActive(false)
  }, [])

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        processFile(file)
      }
    },
    [processFile],
  )

  // Collapsed state when data is loaded
  if (hasData && !isProcessing) {
    return (
      <Card className="mb-6 transition-all duration-500 ease-in-out transform scale-95">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600" />
              <div>
                <p className="font-medium text-sm">{fileName || "CSV File Loaded"}</p>
                <p className="text-xs text-muted-foreground">Data analysis complete</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById("csvFile")?.click()}
                className="text-xs"
              >
                <RefreshCw className="mr-1 h-3 w-3" />
                Replace
              </Button>
            </div>
          </div>
          <input id="csvFile" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
        </CardContent>
      </Card>
    )
  }

  // Full upload state
  return (
    <Card className="mb-8 transition-all duration-500 ease-in-out">
      <CardContent className="p-0">
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 cursor-pointer
            ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
            ${isProcessing ? "opacity-50 pointer-events-none" : ""}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !isProcessing && document.getElementById("csvFile")?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            ) : (
              <Upload className="h-12 w-12 text-muted-foreground" />
            )}

            <div className="space-y-2">
              <h3 className="text-xl font-semibold">{isProcessing ? "Processing CSV..." : "Upload CSV File"}</h3>
              <p className="text-muted-foreground">Drag and drop your ticket data CSV file here, or click to select</p>
            </div>

            {!isProcessing && (
              <Button variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                Select File
              </Button>
            )}
          </div>

          <input id="csvFile" type="file" accept=".csv" className="hidden" onChange={handleFileSelect} />
        </div>
      </CardContent>
    </Card>
  )
}
