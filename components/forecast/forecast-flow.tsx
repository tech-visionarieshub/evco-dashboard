"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileSpreadsheet,
  Upload,
  Check,
  ArrowLeft,
  ArrowRight,
  Download,
  Info,
  CheckCircle,
  History,
  Send,
  Loader2,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { processExcelFile, detectFileFormat } from "@/lib/forecast-upload-utils"
import { ForecastComparisonTable } from "@/components/forecast/comparison-table"
import { ForecastComparisonWidget } from "@/components/forecast/forecast-comparison-widget"
import { mockComparisonData } from "@/lib/mock-data/forecast-comparison"

export interface FormData {
  client: string
  forecastType: string
  intention: string
  fileName: string
  notes: string
}

type Step = "upload" | "summary" | "comparison" | "confirmation"

export default function ForecastFlow() {
  const router = useRouter()
  const { toast } = useToast()

  const [currentStep, setCurrentStep] = useState<Step>("upload")
  const [formData, setFormData] = useState<FormData>({
    client: "",
    forecastType: "",
    intention: "client-forecast",
    fileName: "",
    notes: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [detectedFormat, setDetectedFormat] = useState<string | null>(null)
  const [detectedYear, setDetectedYear] = useState<number | null>(null)
  const [detectedDate, setDetectedDate] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const steps = [
    { id: "upload", name: "Carga de Archivo", icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: "summary", name: "Resumen", icon: <FileSpreadsheet className="w-5 h-5" /> },
    { id: "comparison", name: "Comparación", icon: <History className="w-5 h-5" /> },
    { id: "confirmation", name: "Confirmación", icon: <Check className="w-5 h-5" /> },
  ]

  const getStepIndex = (step: Step) => steps.findIndex((s) => s.id === step)
  const currentStepIndex = getStepIndex(currentStep)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setFormData((prev) => ({ ...prev, fileName: selectedFile.name }))
    }
  }

  const handleProcessFile = async () => {
    if (!file || !formData.client || !formData.forecastType) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    try {
      const data = await processExcelFile(file)
      const format = detectFileFormat(data)

      setPreviewData(data)
      setDetectedFormat(format.format)
      setDetectedYear(format.year)
      setDetectedDate(format.period)
      setCurrentStep("summary")

      toast({
        title: "Archivo procesado",
        description: `Se procesaron ${data.length} filas correctamente`,
      })
    } catch (error) {
      toast({
        title: "Error al procesar archivo",
        description: "No se pudo procesar el archivo. Verifica el formato.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleSubmitForecast = async () => {
    setIsProcessing(true)
    try {
      // Simular envío a Firebase
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Redirigir a página de éxito con parámetros
      const params = new URLSearchParams({
        client: formData.client,
        forecastType: formData.forecastType,
        fileName: formData.fileName,
        totalItems: previewData.length.toString(),
        warningAlerts: "0",
        criticalAlerts: "0",
        notes: formData.notes,
      })

      router.push(`/success?${params.toString()}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo enviar el forecast",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className={`flex flex-col items-center ${index > 0 ? "flex-1" : ""}`}>
            <div className="relative flex items-center justify-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  index < currentStepIndex
                    ? "bg-green-500 text-white"
                    : index === currentStepIndex
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {index < currentStepIndex ? <Check className="w-5 h-5" /> : step.icon}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`hidden sm:block absolute left-10 w-full h-1 ${
                    index < currentStepIndex ? "bg-green-500" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
            <span
              className={`mt-2 text-xs sm:text-sm font-medium ${
                index === currentStepIndex
                  ? "text-primary"
                  : index < currentStepIndex
                    ? "text-green-500"
                    : "text-gray-500"
              }`}
            >
              {step.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  )

  const renderUploadStep = () => (
    <Card className="card-dashboard">
      <CardHeader>
        <CardTitle>Información del Forecast</CardTitle>
        <p className="text-sm text-muted-foreground">
          Completa todos los campos requeridos para procesar el archivo de forecast.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Información importante</strong>
            <br />
            Este módulo procesa únicamente archivos Excel (.xlsx). El sistema detectará automáticamente el formato y
            período del archivo subido.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="client">Cliente *</Label>
            <Select
              value={formData.client}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, client: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MARELLI">MARELLI</SelectItem>
                <SelectItem value="DONALDSON">DONALDSON</SelectItem>
                <SelectItem value="BMW">BMW</SelectItem>
                <SelectItem value="AUDI">AUDI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="forecastType">Tipo de Forecast *</Label>
            <Select
              value={formData.forecastType}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, forecastType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo de forecast" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Forecast Mensual</SelectItem>
                <SelectItem value="weekly">Forecast Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>¿Este archivo es? *</Label>
            <RadioGroup
              value={formData.intention}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, intention: value }))}
              className="mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="client-forecast" id="new" />
                <Label htmlFor="new">Nuevo Forecast</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="correction" id="correction" />
                <Label htmlFor="correction">Corrección de Forecast previo</Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="file">Archivo de Forecast *</Label>
            <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-primary hover:text-primary/80">Arrastra y suelta tu archivo aquí, o</span>
                  <Input id="file-upload" type="file" accept=".xlsx" onChange={handleFileChange} className="hidden" />
                </Label>
                <Button
                  variant="outline"
                  className="ml-2 bg-transparent"
                  onClick={() => document.getElementById("file-upload")?.click()}
                >
                  Seleccionar Archivo
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">Solo archivos Excel (.xlsx) • Máximo 5MB</p>

              {file && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-center space-x-2">
                    <FileSpreadsheet className="h-5 w-5 text-blue-600" />
                    <span className="text-sm font-medium">{file.name}</span>
                    <Badge variant="secondary">{(file.size / 1024).toFixed(1)} KB</Badge>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notas adicionales (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Agrega comentarios relevantes sobre este forecast (máx. 300 caracteres)"
              value={formData.notes}
              onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
              maxLength={300}
              rows={3}
            />
            <div className="text-right text-xs text-muted-foreground mt-1">{formData.notes.length}/300 caracteres</div>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleProcessFile}
            disabled={!file || !formData.client || !formData.forecastType || isProcessing}
            size="lg"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Procesando...
              </>
            ) : (
              "Procesar Forecast"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderSummaryStep = () => (
    <Card className="card-dashboard">
      <CardHeader>
        <CardTitle>Resumen del Archivo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Archivo:</p>
                <p className="font-medium">{formData.fileName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-5 w-5 flex items-center justify-center text-primary mt-0.5">
                <span className="text-xs font-bold">#</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tamaño:</p>
                <p className="font-medium">{file ? (file.size / 1024).toFixed(2) : 0} KB</p>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Cliente:</p>
              <p className="font-medium">{formData.client}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tipo de Forecast:</p>
              <p className="font-medium">
                {formData.forecastType === "monthly" ? "Forecast Mensual" : "Forecast Semanal"}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Período:</p>
              <p className="font-medium">{detectedDate || "Forecast Mensual 2025"}</p>
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <h3 className="text-lg font-semibold mb-4">Previsualización del contenido</h3>
          <p className="text-sm text-muted-foreground mb-4">
            En el siguiente paso podrás comparar estos datos con el histórico.
          </p>

          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CUST ID</TableHead>
                  <TableHead>NO PARTE EVCO</TableHead>
                  <TableHead>NO PARTE CLIENTE</TableHead>
                  <TableHead>05-2025</TableHead>
                  <TableHead>06-2025</TableHead>
                  <TableHead>07-2025</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {previewData.slice(0, 10).map((row, index) => (
                  <TableRow key={index}>
                    <TableCell>{row["CUST ID"] || "30011"}</TableCell>
                    <TableCell>{row["NO PARTE EVCO"] || `96057${index + 1}`}</TableCell>
                    <TableCell>{row["NO PARTE CLIENTE"] || `CAP FOR PIVOT ELBOW 7095470`}</TableCell>
                    <TableCell>{row["05-2025"] || "0"}</TableCell>
                    <TableCell>{row["06-2025"] || Math.floor(Math.random() * 10000)}</TableCell>
                    <TableCell>{row["07-2025"] || Math.floor(Math.random() * 10000)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-sm text-muted-foreground mt-2">Mostrando 10 de {previewData.length} filas del archivo.</p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep("upload")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button onClick={() => setCurrentStep("comparison")}>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderComparisonStep = () => (
    <Card className="card-dashboard">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Comparación de Forecast</CardTitle>
          <Button variant="outline" size="sm">
            <History className="mr-2 h-4 w-4" />
            Ocultar datos históricos
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Input placeholder="Buscar por número de parte..." className="pl-10 w-64" />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
            <Button variant="outline" size="sm">
              <span className="mr-2">+</span>
              Nuevos (1)
            </Button>
            <Button variant="outline" size="sm">
              Filtrar por variación
            </Button>
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
          </div>
        </div>

        <ForecastComparisonTable data={mockComparisonData} />

        <div className="mt-8">
          <ForecastComparisonWidget clientName={formData.client} onClose={() => {}} isExpanded={true} />
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep("summary")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button onClick={() => setCurrentStep("confirmation")}>
            Continuar
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderConfirmationStep = () => (
    <Card className="card-dashboard">
      <CardHeader>
        <CardTitle>Confirmación de Forecast</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Forecast validado correctamente</strong>
            <br />
            El archivo ha sido procesado y está listo para ser enviado al sistema.
          </AlertDescription>
        </Alert>

        <div>
          <h3 className="text-lg font-semibold mb-4">Resumen del Forecast</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Cliente:</p>
                <p className="font-medium">{formData.client}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Archivo:</p>
                <p className="font-medium">{formData.fileName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Períodos incluidos:</p>
                <p className="font-medium">mayo 2025, junio 2025, julio 2025, agosto 2025</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Tipo de Forecast:</p>
                <p className="font-medium">
                  {formData.forecastType === "monthly" ? "Forecast Mensual" : "Forecast Semanal"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tamaño:</p>
                <p className="font-medium">{file ? (file.size / 1024).toFixed(2) : 0} KB</p>
              </div>
            </div>
          </div>
        </div>

        {formData.notes && (
          <div>
            <h3 className="text-lg font-semibold mb-2">Notas adicionales</h3>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm whitespace-pre-wrap">{formData.notes}</p>
            </div>
          </div>
        )}

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Al hacer clic en "Enviar Forecast", los datos serán procesados y almacenados en el sistema. Esta acción no
            se puede deshacer.
          </AlertDescription>
        </Alert>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setCurrentStep("comparison")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Anterior
          </Button>
          <Button onClick={handleSubmitForecast} disabled={isProcessing} size="lg">
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Enviar Forecast
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const renderCurrentStep = () => {
    switch (currentStep) {
      case "upload":
        return renderUploadStep()
      case "summary":
        return renderSummaryStep()
      case "comparison":
        return renderComparisonStep()
      case "confirmation":
        return renderConfirmationStep()
      default:
        return renderUploadStep()
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center p-4 md:p-8 bg-gray-50">
        <div className="mx-auto w-full max-w-6xl">
          {renderStepIndicator()}
          {renderCurrentStep()}
        </div>
      </main>
    </div>
  )
}
