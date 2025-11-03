"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, FileSpreadsheet } from "lucide-react"
import type { ForecastSource } from "@/hooks/useForecastFlowState"

interface UploadFormProps {
  source: ForecastSource
  onFileUploaded: (file: File, data: any[]) => void
  onModelMetadata?: (metadata: { modelName?: string; modelVersion?: string; notes?: string }) => void
}

export function UploadForm({ source, onFileUploaded, onModelMetadata }: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)

  // Internal-specific fields
  const [modelName, setModelName] = useState("")
  const [modelVersion, setModelVersion] = useState("")
  const [notes, setNotes] = useState("")

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) return

    setUploading(true)

    try {
      // Simulate file processing
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock processed data
      const mockData = [
        { clientId: "BMW", partId: "P001", periodKey: "2025-W01", qty: 1000 },
        { clientId: "BMW", partId: "P001", periodKey: "2025-W02", qty: 1200 },
        { clientId: "AUDI", partId: "P003", periodKey: "2025-W01", qty: 800 },
      ]

      // Save model metadata for internal source
      if (source === "internal" && onModelMetadata) {
        onModelMetadata({ modelName, modelVersion, notes })
      }

      onFileUploaded(file, mockData)
    } catch (error) {
      console.error("Error processing file:", error)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Subir Forecast {source === "client" ? "de Cliente" : "Interno"}</h2>
        <p className="text-gray-600">
          {source === "client"
            ? "Sube el archivo de forecast proporcionado por el cliente"
            : "Sube el archivo de forecast generado por el modelo interno"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Archivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Archivo Excel (.xlsx)</Label>
            <div className="mt-2">
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={uploading}
              />
            </div>
          </div>

          {file && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{file.name}</span>
              <span className="text-sm text-gray-500">({(file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Internal-specific metadata fields */}
      {source === "internal" && (
        <Card>
          <CardHeader>
            <CardTitle>Metadatos del Modelo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="model-name">Nombre del Modelo</Label>
              <Input
                id="model-name"
                placeholder="ej. ARIMA-v2, LSTM-Forecast, etc."
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="model-version">Versión del Modelo</Label>
              <Input
                id="model-version"
                placeholder="ej. 2.1.0, v1.3.2, etc."
                value={modelVersion}
                onChange={(e) => setModelVersion(e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                placeholder="Notas adicionales sobre este forecast..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button onClick={handleUpload} disabled={!file || uploading} className="min-w-32">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Procesando...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Subir y Procesar
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
