"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Info,
  Search,
  Filter,
  Plus,
  Eye,
  EyeOff,
  Calendar,
  User,
  FileText,
  Hash,
  Clock,
  Check,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"
import {
  createForecastFileDoc,
  uploadForecastFileToStorage,
  hashFileSHA256,
  type NormalizedRow,
} from "@/lib/services/forecast-persistence"
import { getClientesDatabase, buscarClientePorCustId } from "@/data/clientes-database"

type FlowStep = "upload" | "summary" | "comparison" | "confirmation" | "success"

interface FlowState {
  step: FlowStep
  clientId: string
  clientName: string
  forecastType: string
  nature: "new" | "correction"
  file: File | null
  previewData: any[]
  normalizedData: NormalizedRow[]
  detectedFormat: "weekly" | "monthly" | null
  notes: string
  fileId: string | null
  isProcessing: boolean
  comparisonData: any[]
  historicalData: any[]
  showHistorical: boolean
}

// Datos mock para comparación y histórico
const mockComparisonData = [
  {
    noParteEvco: "965313",
    custId: "-",
    noParteCliente: "A12345",
    periodo: "undefined",
    forecastAnterior: 250,
    forecastActual: 291,
    cambio: 16.4,
    variacion: "Normal",
    tipo: "Normal",
  },
  {
    noParteEvco: "965328",
    custId: "-",
    noParteCliente: "B67890",
    periodo: "undefined",
    forecastAnterior: 200,
    forecastActual: 250,
    cambio: 25.0,
    variacion: "Moderada",
    tipo: "Moderada",
  },
  {
    noParteEvco: "965327",
    custId: "-",
    noParteCliente: "C13579",
    periodo: "undefined",
    forecastAnterior: 80,
    forecastActual: 100,
    cambio: 25.0,
    variacion: "Moderada",
    tipo: "Moderada",
  },
  {
    noParteEvco: "965325",
    custId: "-",
    noParteCliente: "D24680",
    periodo: "undefined",
    forecastAnterior: 320,
    forecastActual: 300,
    cambio: -6.3,
    variacion: "Normal",
    tipo: "Normal",
  },
  {
    noParteEvco: "965339",
    custId: "EV-5339",
    noParteCliente: "E35791",
    periodo: "undefined",
    forecastAnterior: 5000,
    forecastActual: 6000,
    cambio: 20.0,
    variacion: "Moderada",
    tipo: "Moderada",
  },
  {
    noParteEvco: "965316",
    custId: "-",
    noParteCliente: "F46802",
    periodo: "undefined",
    forecastAnterior: 100,
    forecastActual: 80,
    cambio: -20.0,
    variacion: "Moderada",
    tipo: "Moderada",
  },
  {
    noParteEvco: "965337",
    custId: "-",
    noParteCliente: "G57913",
    periodo: "undefined",
    forecastAnterior: 750,
    forecastActual: 800,
    cambio: 6.7,
    variacion: "Normal",
    tipo: "Normal",
  },
]

const mockHistoricalData = [
  {
    custId: "20149",
    partNumber: "957104",
    may25: 0,
    jun25: 0,
    jul25: 0,
    aug25: 0,
    sep25: 0,
    oct25: 0,
    nov25: 0,
    dec25: 0,
    jan: 0,
  },
  {
    custId: "20149",
    partNumber: "957105",
    may25: 0,
    jun25: 0,
    jul25: 0,
    aug25: 0,
    sep25: 0,
    oct25: 0,
    nov25: 0,
    dec25: 0,
    jan: 0,
  },
  {
    custId: "20149",
    partNumber: "957106",
    may25: 0,
    jun25: 0,
    jul25: 0,
    aug25: 0,
    sep25: 0,
    oct25: 0,
    nov25: 0,
    dec25: 0,
    jan: 0,
  },
  {
    custId: "20149",
    partNumber: "957107",
    may25: 0,
    jun25: 0,
    jul25: 0,
    aug25: 0,
    sep25: 0,
    oct25: 0,
    nov25: 0,
    dec25: 0,
    jan: 0,
  },
  {
    custId: "20149",
    partNumber: "957108",
    may25: 30000,
    jun25: 88000,
    jul25: 100000,
    aug25: 130000,
    sep25: 124000,
    oct25: 118000,
    nov25: 94000,
    dec25: 134000,
    jan: 156000,
  },
  {
    custId: "20149",
    partNumber: "957109",
    may25: 0,
    jun25: 0,
    jul25: 0,
    aug25: 8000,
    sep25: 10000,
    oct25: 12000,
    nov25: 12000,
    dec25: 0,
    jan: 0,
  },
]

export default function ClientForecastFlow() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [state, setState] = useState<FlowState>({
    step: "upload",
    clientId: "",
    clientName: "",
    forecastType: "",
    nature: "new",
    file: null,
    previewData: [],
    normalizedData: [],
    detectedFormat: null,
    notes: "",
    fileId: null,
    isProcessing: false,
    comparisonData: mockComparisonData,
    historicalData: mockHistoricalData,
    showHistorical: true,
  })

  // Estados para búsqueda de cliente (igual que en órdenes de compra)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredClientes, setFilteredClientes] = useState<Array<{ custId: string; name: string }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedCliente, setSelectedCliente] = useState<{ custId: string; name: string } | null>(null)

  const handleSearchChange = async (value: string) => {
    setSearchTerm(value)
    setState((prev) => ({ ...prev, clientId: value, clientName: "" }))
    setSelectedCliente(null)

    if (value.trim().length > 0) {
      try {
        const clientesDb = await getClientesDatabase()
        const filtered = clientesDb
          .filter((cliente) => {
            const custIdMatch = cliente.custId && String(cliente.custId).toLowerCase().includes(value.toLowerCase())
            const nameMatch = cliente.name && String(cliente.name).toLowerCase().includes(value.toLowerCase())
            return custIdMatch || nameMatch
          })
          .slice(0, 10) // Limitar a 10 resultados

        setFilteredClientes(filtered)
        setShowSuggestions(true)
      } catch (error) {
        console.error("Error buscando clientes:", error)
        setFilteredClientes([])
        setShowSuggestions(false)
      }
    } else {
      setFilteredClientes([])
      setShowSuggestions(false)
    }
  }

  const handleSelectCliente = (cliente: { custId: string; name: string }) => {
    setSelectedCliente(cliente)
    setState((prev) => ({ ...prev, clientId: String(cliente.custId), clientName: String(cliente.name) }))
    setSearchTerm(`${cliente.custId} - ${cliente.name}`)
    setShowSuggestions(false)
    setFilteredClientes([])
  }

  const handleBuscarCliente = async () => {
    if (!state.clientId.trim()) {
      toast({
        title: "Cust ID requerido",
        description: "Por favor, ingresa un Cust ID para buscar",
        variant: "destructive",
      })
      return
    }
    try {
      const nombreCliente = await buscarClientePorCustId(state.clientId)
      setState((prev) => ({ ...prev, clientName: nombreCliente || "" }))
      if (!nombreCliente) {
        toast({
          title: "Cliente no encontrado",
          description: `No se encontró un cliente con Cust ID: ${state.clientId}. Verifica la información.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Cliente encontrado",
          description: `Cliente: ${nombreCliente}`,
        })
      }
    } catch (error) {
      console.error("Error buscando cliente:", error)
      toast({
        title: "Error",
        description: "Error al buscar el cliente",
        variant: "destructive",
      })
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setState((prev) => ({ ...prev, file, isProcessing: true }))

    try {
      // Leer archivo Excel
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const jsonData = XLSX.utils.sheet_to_json(worksheet)

      // Detectar formato
      const detectedFormat = detectFormat(jsonData)

      setState((prev) => ({
        ...prev,
        previewData: jsonData.slice(0, 10), // Primeras 10 filas para preview
        detectedFormat,
        isProcessing: false,
      }))

      toast({
        title: "Archivo cargado",
        description: `Se detectó formato ${detectedFormat}. ${jsonData.length} filas procesadas.`,
      })
    } catch (error) {
      console.error("Error processing file:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar el archivo. Verifica el formato.",
        variant: "destructive",
      })
      setState((prev) => ({ ...prev, isProcessing: false }))
    }
  }

  const detectFormat = (data: any[]): "weekly" | "monthly" => {
    if (!data.length) return "monthly"

    const firstRow = data[0]
    const keys = Object.keys(firstRow)

    // Buscar patrones de semanas ISO (YYYY-Www)
    const weekPattern = /^\d{4}-W\d{2}$/
    const hasWeekColumns = keys.some((key) => weekPattern.test(key))

    if (hasWeekColumns) return "weekly"

    // Buscar patrones mensuales
    const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/
    const hasMonthColumns = keys.some((key) => monthPattern.test(key))

    return hasMonthColumns ? "monthly" : "monthly" // Default a monthly
  }

  const handleProcessForecast = async () => {
    if (!state.file || !state.clientId || !state.forecastType) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      })
      return
    }

    setState((prev) => ({ ...prev, step: "summary" }))
  }

  const handleContinueFromSummary = () => {
    setState((prev) => ({ ...prev, step: "comparison" }))
  }

  const handleContinueFromComparison = () => {
    setState((prev) => ({ ...prev, step: "confirmation" }))
  }

  const handleSendForecast = async () => {
    setState((prev) => ({ ...prev, isProcessing: true }))

    try {
      // Simular procesamiento
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Subir archivo a Firebase Storage
      if (state.file) {
        const { storagePath, downloadURL } = await uploadForecastFileToStorage(state.file, state.clientId)

        // Crear hash del archivo
        const hash = await hashFileSHA256(state.file)

        // Crear documento en Firebase
        const fileDoc = await createForecastFileDoc({
          source: "client",
          clientId: state.clientId,
          format: state.detectedFormat || "monthly",
          nature: state.nature,
          hash,
          storagePath,
          downloadURL,
          status: "processed",
          modelParams: null,
          rowsCount: state.previewData.length,
        })

        setState((prev) => ({
          ...prev,
          fileId: fileDoc.id,
          isProcessing: false,
          step: "success",
        }))

        toast({
          title: "Forecast procesado",
          description: "El forecast se ha procesado exitosamente.",
        })
      }
    } catch (error) {
      console.error("Error processing forecast:", error)
      toast({
        title: "Error",
        description: "No se pudo procesar el forecast.",
        variant: "destructive",
      })
      setState((prev) => ({ ...prev, isProcessing: false }))
    }
  }

  const renderProgressSteps = () => {
    const steps = [
      { key: "upload", label: "Carga de Archivo", icon: Upload },
      { key: "summary", label: "Resumen", icon: FileText },
      { key: "comparison", label: "Comparación", icon: ArrowRight },
      { key: "confirmation", label: "Confirmación", icon: CheckCircle },
    ]

    return (
      <div className="flex items-center justify-center mb-8">
        {steps.map((step, index) => {
          const Icon = step.icon
          const isActive = state.step === step.key
          const isCompleted = steps.findIndex((s) => s.key === state.step) > index

          return (
            <div key={step.key} className="flex items-center">
              <div
                className={`flex items-center gap-2 ${
                  isActive ? "text-blue-600" : isCompleted ? "text-green-600" : "text-gray-400"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isActive
                      ? "bg-blue-600 text-white"
                      : isCompleted
                        ? "bg-green-600 text-white"
                        : "bg-gray-200 text-gray-400"
                  }`}
                >
                  {isCompleted ? <CheckCircle className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                </div>
                <span className="font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${isCompleted ? "bg-green-600" : "bg-gray-200"}`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  const renderUploadForm = () => (
    <div className="max-w-4xl mx-auto">
      {renderProgressSteps()}

      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Subir Forecast</TabsTrigger>
          <TabsTrigger value="history">Historial de Actividad</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Forecast</CardTitle>
              <p className="text-sm text-muted-foreground">
                Completa todos los campos requeridos para procesar el archivo de forecast.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-900">Información importante</p>
                    <p className="text-sm text-blue-700">
                      Este módulo procesa únicamente archivos Excel (.xlsx). El sistema detectará automáticamente el
                      formato y período del archivo subido.
                    </p>
                  </div>
                </div>
              </div>

              {/* Campo de búsqueda de cliente (igual que en órdenes de compra) */}
              <div className="space-y-2 relative">
                <Label htmlFor="custId" className="text-sm font-medium text-gray-700">
                  Cliente <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="custId"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                      placeholder="Busca por Cust ID o nombre del cliente..."
                      className="text-sm"
                      required
                      onFocus={() => {
                        if (filteredClientes.length > 0) {
                          setShowSuggestions(true)
                        }
                      }}
                      onBlur={() => {
                        // Delay para permitir click en sugerencias
                        setTimeout(() => setShowSuggestions(false), 200)
                      }}
                    />

                    {/* Sugerencias dropdown */}
                    {showSuggestions && filteredClientes.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto mt-1">
                        {filteredClientes.map((cliente) => (
                          <div
                            key={`${cliente.custId}-${cliente.name}`}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSelectCliente(cliente)}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="font-medium text-sm text-blue-600">{cliente.custId}</span>
                                <p className="text-xs text-gray-600 truncate">{cliente.name}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleBuscarCliente}
                    className="flex items-center bg-transparent"
                    disabled={!state.clientId.trim()}
                  >
                    <Search className="w-4 h-4 mr-1" />
                    Verificar
                  </Button>
                </div>

                {selectedCliente && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <div className="flex-1">
                      <span className="text-sm font-medium text-green-700">Cliente seleccionado:</span>
                      <p className="text-xs text-green-600">
                        {selectedCliente.custId} - {selectedCliente.name}
                      </p>
                    </div>
                  </div>
                )}

                {state.clientName && !selectedCliente && (
                  <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                    <Check className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-green-700">Cliente encontrado: {state.clientName}</span>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Escribe para buscar por Cust ID o nombre del cliente. Este ID se utilizará para identificar
                  automáticamente la información del cliente.
                </p>
              </div>

              <div>
                <Label htmlFor="forecast-type">Tipo de Forecast *</Label>
                <Select
                  value={state.forecastType}
                  onValueChange={(value) => setState((prev) => ({ ...prev, forecastType: value }))}
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
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="nature"
                      value="new"
                      checked={state.nature === "new"}
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, nature: e.target.value as "new" | "correction" }))
                      }
                      className="text-blue-600"
                    />
                    <span>Nuevo Forecast</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="nature"
                      value="correction"
                      checked={state.nature === "correction"}
                      onChange={(e) =>
                        setState((prev) => ({ ...prev, nature: e.target.value as "new" | "correction" }))
                      }
                      className="text-blue-600"
                    />
                    <span>Corrección de Forecast previo</span>
                  </label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label htmlFor="file-upload">Archivo de Forecast *</Label>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Descargar Plantilla
                  </Button>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">Arrastra y suelta tu archivo aquí, o</p>
                  <Button onClick={() => fileInputRef.current?.click()} disabled={state.isProcessing}>
                    Seleccionar Archivo
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <p className="text-sm text-gray-500 mt-2">Solo archivos Excel (.xlsx) • Máximo 5MB</p>
                </div>

                {state.file && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-8 h-8 text-green-600" />
                      <div>
                        <p className="font-medium">{state.file.name}</p>
                        <p className="text-sm text-gray-600">{(state.file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  </div>
                )}

                {state.file && (
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-blue-600">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm">Columnas requeridas:</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        • <strong>Formato Mensual:</strong> Cust ID, No Parte EVCO, No Parte Cliente, MOQ, STD Pack,
                        MM-YYYY (ej. 01-2025)
                      </p>
                      <p>
                        • <strong>Formato Semanal:</strong> Cust ID, No Parte EVCO, No Parte Cliente, MOQ, STD Pack,
                        WK-01, WK-02...
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Para asegurar la lectura correcta, utiliza la plantilla oficial o asegúrate de incluir estas
                      columnas.
                    </p>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="notes">Notas adicionales (opcional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Agrega comentarios relevantes sobre este forecast (máx. 300 caracteres)"
                  value={state.notes}
                  onChange={(e) => setState((prev) => ({ ...prev, notes: e.target.value }))}
                  maxLength={300}
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-1">{state.notes.length}/300 caracteres</p>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleProcessForecast}
                  disabled={!state.file || !state.clientId || !state.forecastType || state.isProcessing}
                  className="px-8"
                >
                  {state.isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Procesando...
                    </>
                  ) : (
                    "Procesar Forecast"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-gray-500">Historial de actividad en desarrollo...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderSummary = () => (
    <div className="max-w-4xl mx-auto">
      {renderProgressSteps()}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Resumen del Archivo</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium">Archivo:</p>
                  <p className="text-sm text-gray-600">{state.file?.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-blue-600" />
                <div>
                  <p className="font-medium">Tamaño:</p>
                  <p className="text-sm text-gray-600">{state.file ? (state.file.size / 1024).toFixed(2) : 0} KB</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 space-y-4">
              <div>
                <p className="font-medium">Cliente:</p>
                <p className="text-sm text-gray-600">{state.clientName || state.clientId}</p>
              </div>

              <div>
                <p className="font-medium">Tipo de Forecast:</p>
                <p className="text-sm text-gray-600">
                  {state.forecastType === "monthly" ? "Forecast Mensual" : "Forecast Semanal"}
                </p>
              </div>

              <div>
                <p className="font-medium">Período:</p>
                <p className="text-sm text-gray-600">Forecast Mensual 2025</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Previsualización del contenido</CardTitle>
            <p className="text-sm text-muted-foreground">
              En el siguiente paso podrás comparar estos datos con el histórico.
            </p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">CUST ID</th>
                    <th className="text-left p-3 font-medium">NO PARTE EVCO</th>
                    <th className="text-left p-3 font-medium">NO PARTE CLIENTE</th>
                    <th className="text-left p-3 font-medium">05-2025</th>
                    <th className="text-left p-3 font-medium">06-2025</th>
                    <th className="text-left p-3 font-medium">07-2025</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-3">30011</td>
                    <td className="p-3">960571</td>
                    <td className="p-3">CAP FOR PIVOT ELBOW 7095470</td>
                    <td className="p-3">0</td>
                    <td className="p-3">6,272</td>
                    <td className="p-3">6,272</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">30011</td>
                    <td className="p-3">960572</td>
                    <td className="p-3">BALL JOINT CAP 7094560</td>
                    <td className="p-3">0</td>
                    <td className="p-3">0</td>
                    <td className="p-3">10,000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">30011</td>
                    <td className="p-3">960573</td>
                    <td className="p-3">BALL JOINT SWIVEL 7094550</td>
                    <td className="p-3">0</td>
                    <td className="p-3">0</td>
                    <td className="p-3">10,000</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-3">30011</td>
                    <td className="p-3">960579</td>
                    <td className="p-3">7108100 UPR ARM-38N AUX RH BLK TX GFN</td>
                    <td className="p-3">0</td>
                    <td className="p-3">5,000</td>
                    <td className="p-3">6,651</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-4">Mostrando 10 de 24 filas del archivo.</p>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: "upload" }))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button onClick={handleContinueFromSummary}>
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )

  const renderComparison = () => (
    <div className="max-w-7xl mx-auto">
      {renderProgressSteps()}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Comparación de Forecast</h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setState((prev) => ({ ...prev, showHistorical: !prev.showHistorical }))}
          >
            {state.showHistorical ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
            {state.showHistorical ? "Ocultar datos históricos" : "Mostrar datos históricos"}
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input placeholder="Buscar por número de parte..." className="pl-10" />
          </div>
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Nuevos (1)
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filtrar por variación
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">NO PARTE EVCO</th>
                    <th className="text-left p-3 font-medium">CUST ID</th>
                    <th className="text-left p-3 font-medium">NO PARTE CLIENTE</th>
                    <th className="text-left p-3 font-medium">Período</th>
                    <th className="text-left p-3 font-medium">Forecast anterior</th>
                    <th className="text-left p-3 font-medium">Forecast actual</th>
                    <th className="text-left p-3 font-medium">% Cambio</th>
                    <th className="text-left p-3 font-medium">Variación</th>
                    <th className="text-left p-3 font-medium">Tipo</th>
                  </tr>
                </thead>
                <tbody>
                  {state.comparisonData.map((row, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-3">{row.noParteEvco}</td>
                      <td className="p-3">{row.custId}</td>
                      <td className="p-3">{row.noParteCliente}</td>
                      <td className="p-3 text-gray-500">
                        <div>undefined</div>
                        <div>undefined</div>
                      </td>
                      <td className="p-3">{row.forecastAnterior.toLocaleString()}</td>
                      <td className="p-3">{row.forecastActual.toLocaleString()}</td>
                      <td className="p-3">
                        <span
                          className={`flex items-center gap-1 ${
                            row.cambio > 0 ? "text-green-600" : row.cambio < 0 ? "text-red-600" : "text-gray-600"
                          }`}
                        >
                          {row.cambio > 0 ? "↑" : row.cambio < 0 ? "↓" : ""}
                          {row.cambio > 0 ? "+" : ""}
                          {row.cambio}%
                        </span>
                      </td>
                      <td className="p-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            row.variacion === "Normal" ? "bg-green-500" : "bg-orange-500"
                          }`}
                        />
                      </td>
                      <td className="p-3">
                        <Badge variant={row.tipo === "Normal" ? "default" : "secondary"}>{row.tipo}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 p-4">Mostrando 10 de 10 registros (1 producto nuevo)</p>
          </CardContent>
        </Card>

        {state.showHistorical && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Datos Históricos de Forecast</CardTitle>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Contraer
                </Button>
                <Button variant="outline" size="sm">
                  Cerrar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input placeholder="Buscar por número de parte..." className="pl-10" />
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">{state.clientName || state.clientId}</h3>
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3 font-medium">Cust ID</th>
                      <th className="text-left p-3 font-medium">Part #</th>
                      <th className="text-left p-3 font-medium">May-25</th>
                      <th className="text-left p-3 font-medium">Jun-25</th>
                      <th className="text-left p-3 font-medium">Jul-25</th>
                      <th className="text-left p-3 font-medium">Aug-25</th>
                      <th className="text-left p-3 font-medium">Sep-25</th>
                      <th className="text-left p-3 font-medium">Oct-25</th>
                      <th className="text-left p-3 font-medium">Nov-25</th>
                      <th className="text-left p-3 font-medium">Dec-25</th>
                      <th className="text-left p-3 font-medium">Jan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.historicalData.map((row, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="p-3">{row.custId}</td>
                        <td className="p-3">{row.partNumber}</td>
                        <td className="p-3">{row.may25.toLocaleString()}</td>
                        <td className="p-3">{row.jun25.toLocaleString()}</td>
                        <td className="p-3">{row.jul25.toLocaleString()}</td>
                        <td className="p-3">{row.aug25.toLocaleString()}</td>
                        <td className="p-3">{row.sep25.toLocaleString()}</td>
                        <td className="p-3">{row.oct25.toLocaleString()}</td>
                        <td className="p-3">{row.nov25.toLocaleString()}</td>
                        <td className="p-3">{row.dec25.toLocaleString()}</td>
                        <td className="p-3">{row.jan.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: "summary" }))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button onClick={handleContinueFromComparison}>
            Continuar
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  )

  const renderConfirmation = () => (
    <div className="max-w-4xl mx-auto">
      {renderProgressSteps()}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Confirmación de Forecast</h1>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-6 h-6 text-green-600" />
            <div>
              <p className="font-medium text-green-900">Forecast validado correctamente</p>
              <p className="text-sm text-green-700">
                El archivo ha sido procesado y está listo para ser enviado al sistema.
              </p>
            </div>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resumen del Forecast</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="font-medium mb-1">Cliente:</p>
                <p className="text-gray-600">{state.clientName || state.clientId}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Tipo de Forecast:</p>
                <p className="text-gray-600">
                  {state.forecastType === "monthly" ? "Forecast Mensual" : "Forecast Semanal"}
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Archivo:</p>
                <p className="text-gray-600">{state.file?.name}</p>
              </div>
              <div>
                <p className="font-medium mb-1">Tamaño:</p>
                <p className="text-gray-600">{state.file ? (state.file.size / 1024).toFixed(2) : 0} KB</p>
              </div>
            </div>

            <div>
              <p className="font-medium mb-1">Períodos incluidos:</p>
              <p className="text-gray-600">mayo 2025, junio 2025, julio 2025, agosto 2025</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notas adicionales</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Agregue notas adicionales aquí..."
              value={state.notes}
              onChange={(e) => setState((prev) => ({ ...prev, notes: e.target.value }))}
              rows={4}
            />
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            Al hacer clic en "Enviar Forecast", los datos serán procesados y almacenados en el sistema. Esta acción no
            se puede deshacer.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: "comparison" }))}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Anterior
          </Button>
          <Button onClick={handleSendForecast} disabled={state.isProcessing}>
            {state.isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enviando...
              </>
            ) : (
              "Enviar Forecast"
            )}
          </Button>
        </div>
      </div>
    </div>
  )

  const renderSuccess = () => (
    <div className="max-w-4xl mx-auto text-center space-y-8">
      <div className="flex justify-center mb-6">
        <img src="/images/evco-logo-horizontal.png" alt="EVCO Logo" className="h-12" />
      </div>

      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold mb-4">Forecast procesado exitosamente</h1>
        <p className="text-gray-600">El archivo ha sido analizado y procesado correctamente.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen de la operación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Cliente</p>
                <p className="text-gray-600">{state.clientName || state.clientId}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Archivo</p>
                <p className="text-gray-600">{state.file?.name}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Tipo de Forecast</p>
                <p className="text-gray-600">
                  {state.forecastType === "monthly" ? "Forecast Mensual" : "Forecast Semanal"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Hash className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Líneas procesadas</p>
                <p className="text-gray-600">{state.previewData.length}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Período</p>
                <p className="text-gray-600">mayo 2025, junio 2025, julio 2025, agosto 2025</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium">Fecha y hora de carga</p>
                <p className="text-gray-600">{new Date().toLocaleString("es-ES")}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <p className="text-gray-600">El forecast ha sido validado y está listo para su descarga.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Button size="lg" className="w-full">
          <Download className="w-5 h-5 mr-2" />
          Descargar Excel
        </Button>
        <Button variant="outline" size="lg" className="w-full bg-transparent">
          <Download className="w-5 h-5 mr-2" />
          Descargar CSV
        </Button>
      </div>

      <Button size="lg" className="w-full">
        <FileSpreadsheet className="w-5 h-5 mr-2" />
        Exportar para Epicor
      </Button>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          variant="outline"
          onClick={() =>
            setState({
              step: "upload",
              clientId: "",
              clientName: "",
              forecastType: "",
              nature: "new",
              file: null,
              previewData: [],
              normalizedData: [],
              detectedFormat: null,
              notes: "",
              fileId: null,
              isProcessing: false,
              comparisonData: mockComparisonData,
              historicalData: mockHistoricalData,
              showHistorical: true,
            })
          }
        >
          <Upload className="w-4 h-4 mr-2" />
          Cargar Otro Forecast
        </Button>
        <Button variant="outline" onClick={() => router.push("/dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al Dashboard
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto py-8 px-4">
      {state.step === "upload" && renderUploadForm()}
      {state.step === "summary" && renderSummary()}
      {state.step === "comparison" && renderComparison()}
      {state.step === "confirmation" && renderConfirmation()}
      {state.step === "success" && renderSuccess()}
    </div>
  )
}
