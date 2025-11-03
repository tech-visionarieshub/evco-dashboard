"use client"

import { Label } from "@/components/ui/label"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { FileSpreadsheet, TrendingUp, BarChart3, ArrowRight } from "lucide-react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { normalizeToIsoWeeks } from "@/lib/normalize/normalizeToIsoWeeks"
import {
  createForecastFileDoc,
  uploadForecastFileToStorage,
  writeNormalizedForecasts,
  finalizeForecastFileDoc,
  hashFileSHA256,
  type NormalizedRow,
} from "@/lib/services/forecast-persistence"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from "xlsx"

export type FlowIntention = "client-forecast" | "internal-forecast" | "demand-analysis"
export type FlowStep = "intention" | "upload" | "validate" | "comparison" | "confirm" | "complete"

interface FlowState {
  step: FlowStep
  intention: FlowIntention | null
  clientId: string
  nature: "new" | "correction"
  file: File | null
  previewData: any[]
  normalizedData: NormalizedRow[]
  detectedFormat: "weekly" | "monthly" | null
  modelParams: {
    name?: string
    version?: string
    comments?: string
  } | null
  fileId: string | null
  isProcessing: boolean
}

export default function ForecastFlow() {
  const router = useRouter()
  const { toast } = useToast()

  const [state, setState] = useState<FlowState>({
    step: "intention",
    intention: null,
    clientId: "",
    nature: "new",
    file: null,
    previewData: [],
    normalizedData: [],
    detectedFormat: null,
    modelParams: null,
    fileId: null,
    isProcessing: false,
  })

  const handleClientForecast = () => {
    router.push("/upload-forecast")
  }

  const handleInternalForecast = () => {
    // Redirigir a flujo interno (por implementar)
    console.log("Internal forecast flow")
  }

  const handleDemandAnalysis = () => {
    // Redirigir a análisis de demanda (por implementar)
    console.log("Demand analysis flow")
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
        step: "validate",
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

  const handleValidation = async () => {
    if (!state.file || !state.previewData.length) return

    setState((prev) => ({ ...prev, isProcessing: true }))

    try {
      // Subir archivo a Firebase Storage
      const { storagePath, downloadURL } = await uploadForecastFileToStorage(state.file, state.clientId)

      // Crear hash del archivo
      const hash = await hashFileSHA256(state.file)

      // Crear documento en Firebase
      const fileDoc = await createForecastFileDoc({
        source: state.intention === "client-forecast" ? "client" : "internal",
        clientId: state.clientId,
        format: state.detectedFormat || "monthly",
        nature: state.nature,
        hash,
        storagePath,
        downloadURL,
        status: "uploaded",
        modelParams: state.modelParams,
        rowsCount: state.previewData.length,
      })

      // Normalizar datos
      const buffer = await state.file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: "array" })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      const fullData = XLSX.utils.sheet_to_json(worksheet)

      const normalizedData = await normalizeToIsoWeeks(fullData, state.detectedFormat || "monthly")

      setState((prev) => ({
        ...prev,
        normalizedData,
        fileId: fileDoc.id,
        isProcessing: false,
        step: state.intention === "demand-analysis" ? "comparison" : "confirm",
      }))

      toast({
        title: "Validación completada",
        description: `${normalizedData.length} registros normalizados a semanas ISO.`,
      })
    } catch (error) {
      console.error("Error during validation:", error)
      toast({
        title: "Error en validación",
        description: "No se pudo validar el archivo.",
        variant: "destructive",
      })
      setState((prev) => ({ ...prev, isProcessing: false }))
    }
  }

  const handleConfirm = async () => {
    if (!state.fileId || !state.normalizedData.length) return

    setState((prev) => ({ ...prev, isProcessing: true }))

    try {
      // Escribir datos normalizados a Firebase
      await writeNormalizedForecasts(state.normalizedData, {
        sourceFileId: state.fileId,
        source: state.intention === "client-forecast" ? "client" : "internal",
        version: "1.0",
      })

      // Finalizar documento
      await finalizeForecastFileDoc(state.fileId, {
        status: "processed",
        rowsCount: state.normalizedData.length,
      })

      setState((prev) => ({
        ...prev,
        isProcessing: false,
        step: "complete",
      }))

      toast({
        title: "Forecast guardado",
        description: "Los datos se han guardado correctamente en Firebase.",
      })
    } catch (error) {
      console.error("Error saving forecast:", error)
      toast({
        title: "Error al guardar",
        description: "No se pudo guardar el forecast.",
        variant: "destructive",
      })
      setState((prev) => ({ ...prev, isProcessing: false }))
    }
  }

  const renderIntentionSelector = () => (
    <div className="w-full max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">¿Qué quieres hacer?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona el flujo que necesitas. Todos los datos se normalizan a semanas ISO y se guardan en Firebase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="border-blue-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleClientForecast}
        >
          <CardHeader>
            <div className="flex items-center gap-2 justify-center">
              <FileSpreadsheet className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Analizar Forecast del Cliente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Carga un Excel del cliente (mensual o semanal), normaliza a semanas ISO y compáralo contra histórico.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">Origen: Cliente</Badge>
              <Badge variant="outline">Comparación histórica</Badge>
            </div>
            <Button className="w-full" onClick={handleClientForecast}>
              Comenzar análisis
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>

        <Card
          className="border-emerald-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleInternalForecast}
        >
          <CardHeader>
            <div className="flex items-center gap-2 justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Cargar Pronóstico Interno</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Carga un pronóstico interno ya semanal (YYYY-Www) o mensual para normalizar. Sin comparación con cliente.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">Origen: Interno</Badge>
              <Badge variant="outline">Validación semanal</Badge>
            </div>
            <Button variant="outline" className="w-full bg-transparent" disabled>
              En desarrollo
            </Button>
          </CardContent>
        </Card>

        <Card
          className="border-purple-200 cursor-pointer hover:shadow-md transition-shadow"
          onClick={handleDemandAnalysis}
        >
          <CardHeader>
            <div className="flex items-center gap-2 justify-center">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">Análisis de Demanda</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-center">
            <p className="text-sm text-muted-foreground">
              Compara lado a lado el forecast del cliente contra el pronóstico interno, por semana ISO.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <Badge variant="outline">Cliente vs Interno</Badge>
              <Badge variant="outline">Variaciones y deltas</Badge>
            </div>
            <Button variant="outline" className="w-full bg-transparent" disabled>
              En desarrollo
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-12 text-center">
        <h2 className="text-xl font-semibold mb-4">¿Necesitas ayuda?</h2>
        <p className="text-gray-600 mb-6">
          Consulta nuestra documentación o contacta al equipo de soporte para obtener asistencia.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline">Ver Documentación</Button>
          <Button variant="outline">Contactar Soporte</Button>
        </div>
      </div>
    </div>
  )

  const renderUploadForm = () => (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          Subir Forecast {state.intention === "client-forecast" ? "de Cliente" : "Interno"}
        </h2>
        <p className="text-gray-600">
          {state.intention === "client-forecast"
            ? "Sube el archivo de forecast proporcionado por el cliente"
            : "Sube el archivo de forecast generado por el modelo interno"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Información del Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clientId">ID del Cliente</Label>
            <Input
              id="clientId"
              placeholder="ej. BMW, AUDI, FORD..."
              value={state.clientId}
              onChange={(e) => setState((prev) => ({ ...prev, clientId: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="nature">Naturaleza del Forecast</Label>
            <Select
              value={state.nature}
              onValueChange={(value: "new" | "correction") => setState((prev) => ({ ...prev, nature: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">Nuevo</SelectItem>
                <SelectItem value="correction">Corrección</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {state.intention === "internal-forecast" && (
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
                value={state.modelParams?.name || ""}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    modelParams: { ...prev.modelParams, name: e.target.value },
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="model-version">Versión del Modelo</Label>
              <Input
                id="model-version"
                placeholder="ej. 2.1.0, v1.3.2, etc."
                value={state.modelParams?.version || ""}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    modelParams: { ...prev.modelParams, version: e.target.value },
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="comments">Comentarios</Label>
              <Textarea
                id="comments"
                placeholder="Notas adicionales sobre este forecast..."
                value={state.modelParams?.comments || ""}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    modelParams: { ...prev.modelParams, comments: e.target.value },
                  }))
                }
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Archivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Archivo Excel (.xlsx)</Label>
            <Input
              id="file-upload"
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              disabled={state.isProcessing || !state.clientId}
            />
          </div>

          {state.file && (
            <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">{state.file.name}</span>
              <span className="text-sm text-gray-500">({(state.file.size / 1024).toFixed(1)} KB)</span>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: "intention" }))}>
          <ArrowRight className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>
    </div>
  )

  const renderValidation = () => (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Validación del Archivo</h2>
        <p className="text-gray-600">Revisa los datos detectados antes de continuar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">Formato Detectado</p>
                <p className="text-sm text-gray-600">{state.detectedFormat === "weekly" ? "Semanal" : "Mensual"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">Filas Detectadas</p>
                <p className="text-sm text-gray-600">{state.previewData.length}+ registros</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 justify-center">
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-medium">Cliente</p>
                <p className="text-sm text-gray-600">{state.clientId}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vista Previa de Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {state.previewData[0] &&
                    Object.keys(state.previewData[0])
                      .slice(0, 6)
                      .map((key) => (
                        <th key={key} className="text-left p-2 font-medium">
                          {key}
                        </th>
                      ))}
                </tr>
              </thead>
              <tbody>
                {state.previewData.slice(0, 5).map((row, index) => (
                  <tr key={index} className="border-b">
                    {Object.values(row)
                      .slice(0, 6)
                      .map((value, cellIndex) => (
                        <td key={cellIndex} className="p-2">
                          {String(value)}
                        </td>
                      ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: "upload" }))}>
          <ArrowRight className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <Button onClick={handleValidation} disabled={state.isProcessing}>
          {state.isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Validando...
            </>
          ) : (
            <>
              Continuar
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderConfirmation = () => (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">Confirmar Guardado</h2>
        <p className="text-gray-600">Los datos están listos para ser guardados en Firebase</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumen del Proceso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-medium">Cliente:</p>
              <p className="text-gray-600">{state.clientId}</p>
            </div>
            <div>
              <p className="font-medium">Formato:</p>
              <p className="text-gray-600">{state.detectedFormat === "weekly" ? "Semanal" : "Mensual"}</p>
            </div>
            <div>
              <p className="font-medium">Registros normalizados:</p>
              <p className="text-gray-600">{state.normalizedData.length}</p>
            </div>
            <div>
              <p className="font-medium">Tipo:</p>
              <p className="text-gray-600">{state.intention === "client-forecast" ? "Cliente" : "Interno"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setState((prev) => ({ ...prev, step: "validate" }))}>
          <ArrowRight className="w-4 h-4 mr-2" />
          Volver
        </Button>
        <Button onClick={handleConfirm} disabled={state.isProcessing}>
          {state.isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Guardando...
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Confirmar y Guardar
            </>
          )}
        </Button>
      </div>
    </div>
  )

  const renderComplete = () => (
    <div className="w-full max-w-2xl mx-auto text-center space-y-6">
      <div className="flex justify-center">
        <FileSpreadsheet className="w-16 h-16 text-green-600" />
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-2">¡Proceso Completado!</h2>
        <p className="text-gray-600">
          El forecast se ha guardado correctamente en Firebase y está disponible para análisis.
        </p>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium">Cliente:</p>
              <p className="text-gray-600">{state.clientId}</p>
            </div>
            <div>
              <p className="font-medium">Registros guardados:</p>
              <p className="text-gray-600">{state.normalizedData.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button onClick={() => router.push("/dashboard")}>Ver Dashboard</Button>
        <Button
          variant="outline"
          onClick={() =>
            setState({
              step: "intention",
              intention: null,
              clientId: "",
              nature: "new",
              file: null,
              previewData: [],
              normalizedData: [],
              detectedFormat: null,
              modelParams: null,
              fileId: null,
              isProcessing: false,
            })
          }
        >
          Subir Otro Archivo
        </Button>
      </div>
    </div>
  )

  return (
    <div className="container mx-auto py-8 px-4">
      {state.step === "intention" && renderIntentionSelector()}
      {state.step === "upload" && renderUploadForm()}
      {state.step === "validate" && renderValidation()}
      {/* {state.step === "comparison" && (
        <div className="text-center">
          <p>Pantalla de comparación en desarrollo...</p>
        </div>
      )} */}
      {state.step === "confirm" && renderConfirmation()}
      {state.step === "complete" && renderComplete()}
    </div>
  )
}
