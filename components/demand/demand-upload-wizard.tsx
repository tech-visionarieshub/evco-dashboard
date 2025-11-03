"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, ArrowRight, ArrowLeft } from "lucide-react"
import { useDropzone } from "react-dropzone"

interface UploadWizardProps {
  onFileUpload: (file: File, config: { name: string; description: string }) => void
}

type WizardStep = "upload" | "config" | "confirm"

export function DemandUploadWizard({ onFileUpload }: UploadWizardProps) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [config, setConfig] = useState({
    name: "",
    description: "",
    autoProcess: true,
    includeAI: true,
    includeInventory: true,
  })
  const [validationError, setValidationError] = useState<string | null>(null)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (file) {
        // Validar archivo
        if (file.size > 50 * 1024 * 1024) {
          // 50MB
          setValidationError("El archivo es demasiado grande (máximo 50MB)")
          return
        }

        if (!file.name.toLowerCase().endsWith(".xlsx")) {
          setValidationError("Solo se permiten archivos Excel (.xlsx)")
          return
        }

        setSelectedFile(file)
        setValidationError(null)

        // Auto-generar nombre si está vacío
        if (!config.name) {
          const baseName = file.name.replace(".xlsx", "")
          setConfig((prev) => ({
            ...prev,
            name: `Análisis ${baseName} - ${new Date().toLocaleDateString()}`,
          }))
        }
      }
    },
    [config.name],
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: false,
  })

  const handleNext = () => {
    if (currentStep === "upload" && selectedFile) {
      setCurrentStep("config")
    } else if (currentStep === "config" && config.name.trim()) {
      setCurrentStep("confirm")
    }
  }

  const handleBack = () => {
    if (currentStep === "config") {
      setCurrentStep("upload")
    } else if (currentStep === "confirm") {
      setCurrentStep("config")
    }
  }

  const handleConfirm = () => {
    if (selectedFile && config.name.trim()) {
      onFileUpload(selectedFile, {
        name: config.name,
        description: config.description,
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Subir Archivo de Demanda
        </CardTitle>
        <CardDescription>Sigue los pasos para cargar y configurar tu análisis de demanda</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress indicator */}
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 ${currentStep === "upload" ? "text-blue-600" : "text-gray-400"}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === "upload"
                  ? "bg-blue-100 text-blue-600"
                  : selectedFile
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {selectedFile && currentStep !== "upload" ? <CheckCircle className="h-4 w-4" /> : "1"}
            </div>
            <span className="text-sm font-medium">Subir</span>
          </div>
          <div className={`flex items-center gap-2 ${currentStep === "config" ? "text-blue-600" : "text-gray-400"}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === "config"
                  ? "bg-blue-100 text-blue-600"
                  : config.name.trim() && currentStep === "confirm"
                    ? "bg-green-100 text-green-600"
                    : "bg-gray-100 text-gray-400"
              }`}
            >
              {config.name.trim() && currentStep === "confirm" ? <CheckCircle className="h-4 w-4" /> : "2"}
            </div>
            <span className="text-sm font-medium">Configurar</span>
          </div>
          <div className={`flex items-center gap-2 ${currentStep === "confirm" ? "text-blue-600" : "text-gray-400"}`}>
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === "confirm" ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"
              }`}
            >
              3
            </div>
            <span className="text-sm font-medium">Confirmar</span>
          </div>
        </div>

        {/* Step 1: Upload */}
        {currentStep === "upload" && (
          <div className="space-y-4">
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-blue-500 bg-blue-50"
                  : selectedFile
                    ? "border-green-500 bg-green-50"
                    : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-4">
                {selectedFile ? (
                  <>
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
                    <div>
                      <p className="text-lg font-medium text-green-800">Archivo seleccionado</p>
                      <p className="text-sm text-gray-600 mt-1">{selectedFile.name}</p>
                      <p className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-lg font-medium">
                        {isDragActive ? "Suelta el archivo aquí" : "Arrastra tu archivo Excel aquí"}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">o haz clic para seleccionar un archivo</p>
                      <p className="text-xs text-gray-500 mt-2">Solo archivos .xlsx, máximo 50MB</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {validationError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">{validationError}</span>
              </div>
            )}

            {selectedFile && (
              <div className="flex justify-end">
                <Button onClick={handleNext}>
                  Siguiente
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Config */}
        {currentStep === "config" && (
          <div className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del análisis *</Label>
                <Input
                  id="name"
                  value={config.name}
                  onChange={(e) => setConfig((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Ej: Análisis Q1 2024 - Cliente ABC"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={config.description}
                  onChange={(e) => setConfig((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe el propósito de este análisis..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label>Opciones de procesamiento</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoProcess"
                      checked={config.autoProcess}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, autoProcess: !!checked }))}
                    />
                    <Label htmlFor="autoProcess" className="text-sm">
                      Procesamiento automático completo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeAI"
                      checked={config.includeAI}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, includeAI: !!checked }))}
                    />
                    <Label htmlFor="includeAI" className="text-sm">
                      Incluir análisis con IA (predicciones y anomalías)
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="includeInventory"
                      checked={config.includeInventory}
                      onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, includeInventory: !!checked }))}
                    />
                    <Label htmlFor="includeInventory" className="text-sm">
                      Integrar con datos de inventario
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={handleNext} disabled={!config.name.trim()}>
                Siguiente
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {currentStep === "confirm" && selectedFile && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium">Resumen del análisis</h4>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Archivo:</span>
                  <div className="font-medium">{selectedFile.name}</div>
                  <div className="text-xs text-gray-500">{formatFileSize(selectedFile.size)}</div>
                </div>
                <div>
                  <span className="text-gray-600">Nombre:</span>
                  <div className="font-medium">{config.name}</div>
                </div>
              </div>

              {config.description && (
                <div>
                  <span className="text-gray-600 text-sm">Descripción:</span>
                  <div className="text-sm">{config.description}</div>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {config.autoProcess && <Badge variant="secondary">Auto-procesamiento</Badge>}
                {config.includeAI && <Badge variant="secondary">IA incluida</Badge>}
                {config.includeInventory && <Badge variant="secondary">Inventario integrado</Badge>}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-bold text-white">i</span>
                </div>
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">Procesamiento automático</p>
                  <p className="text-blue-700">
                    El análisis se ejecutará automáticamente y podrás ver los resultados en tiempo real. El proceso
                    incluye normalización, análisis estadístico, predicciones IA y guardado en Firebase.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={handleBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={handleConfirm} className="bg-green-600 hover:bg-green-700">
                <Upload className="h-4 w-4 mr-2" />
                Iniciar Análisis
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
