"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, ArrowLeft, Send, Users, Cpu } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  createForecastFileDoc,
  hashFileSHA256,
  uploadForecastFileToStorage,
  writeNormalizedForecasts,
  type ForecastFileDoc,
} from "@/lib/services/forecast-persistence"
import type { ForecastSource, ModelParams, FormData } from "@/components/forecast/forecast-flow"
import { normalizeWeeklyRows, normalizeMonthlyRows } from "@/lib/forecast-normalization"

interface Props {
  formData: FormData
  previewData: any[]
  detectedFormat: string | null
  detectedYear: number | null
  detectedDate: string | null
  onBack: () => void
  onFinish: () => void
}

export function ConfirmationScreen({
  formData,
  previewData,
  detectedFormat,
  detectedYear,
  detectedDate,
  onBack,
  onFinish,
}: Props) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)
  const [resultId, setResultId] = useState<string | null>(null)

  // Determinar valores basados en la intención
  const isClientForecast = formData.intention === "client-forecast"
  const isInternalForecast = formData.intention === "internal-forecast"
  const source: ForecastSource = isClientForecast ? "client" : "internal"
  const clientId = formData.client || "unknown"
  const nature = formData.forecastNature as "new" | "correction"
  const format = (detectedFormat as "weekly" | "monthly") || "weekly"

  // Crear parámetros del modelo si es interno
  const modelParams: ModelParams | undefined = isInternalForecast
    ? {
        name: formData.internalModelName,
        version: formData.internalModelVersion,
        comments: formData.internalComments,
      }
    : undefined

  // Normalizar datos según el formato detectado
  const normalizedRows = useState(() => {
    if (!previewData || previewData.length === 0) return []

    try {
      if (format === "weekly") {
        return normalizeWeeklyRows(previewData, detectedYear || undefined)
      } else if (format === "monthly") {
        return normalizeMonthlyRows(previewData)
      }
      return []
    } catch (error) {
      console.error("Error normalizando datos:", error)
      return []
    }
  })[0]

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // 1) Subir archivo (si existe) y calcular hash
      let storagePath: string | undefined
      let downloadURL: string | undefined
      let hash = "no-file"

      if (formData.file) {
        hash = await hashFileSHA256(formData.file)
        const up = await uploadForecastFileToStorage(formData.file, clientId)
        storagePath = up.storagePath
        downloadURL = up.downloadURL
      }

      // 2) Crear doc en forecast_files
      const payload: ForecastFileDoc = {
        source,
        clientId,
        format,
        nature,
        hash,
        storagePath,
        downloadURL,
        status: "uploaded",
        modelParams: isInternalForecast ? (modelParams ?? null) : null,
      }
      const ref = await createForecastFileDoc(payload)
      setResultId(ref.id)

      // 3) Escribir filas normalizadas en /forecasts
      await writeNormalizedForecasts(normalizedRows, {
        source,
        sourceFileId: ref.id,
        version: modelParams?.version || "1",
      })

      toast({
        title: "Forecast enviado exitosamente",
        description: `${normalizedRows.length} filas guardadas en Firebase.`,
      })
      onFinish()
    } catch (err: any) {
      console.error(err)
      toast({
        title: "Error al enviar",
        description: err?.message || "Revisa la conexión a Firebase y vuelve a intentar.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {isClientForecast && <Users className="h-6 w-6 text-blue-600" />}
            {isInternalForecast && <Cpu className="h-6 w-6 text-green-600" />}
            <CardTitle>
              {isClientForecast && "Confirmación - Forecast del Cliente"}
              {isInternalForecast && "Confirmación - Pronóstico Interno"}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Resumen de la intención */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium mb-3">Resumen del proceso</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Tipo:</span>
                <div className="font-medium">
                  {isClientForecast && "Análisis de Forecast del Cliente"}
                  {isInternalForecast && "Carga de Pronóstico Interno"}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Cliente:</span>
                <div className="font-medium">{clientId}</div>
              </div>
              <div>
                <span className="text-gray-600">Formato detectado:</span>
                <div className="font-medium capitalize">{format}</div>
              </div>
              <div>
                <span className="text-gray-600">Período:</span>
                <div className="font-medium">{detectedDate || "No detectado"}</div>
              </div>
            </div>
          </div>

          {/* Badges informativos */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Origen: {isClientForecast ? "Cliente" : "Interno"}</Badge>
            <Badge variant="outline">Formato: {format}</Badge>
            <Badge variant="outline">Naturaleza: {nature}</Badge>
            <Badge variant="secondary">Filas a guardar: {normalizedRows.length}</Badge>
          </div>

          {/* Información específica según el tipo */}
          {isClientForecast && (
            <Alert>
              <Users className="h-4 w-4" />
              <AlertTitle>Forecast del Cliente</AlertTitle>
              <AlertDescription className="text-sm">
                Se procesará el archivo del cliente, se normalizará a semanas ISO y se guardará para análisis de cambios
                y comparación con histórico. Se generarán alertas automáticas según las variaciones detectadas.
              </AlertDescription>
            </Alert>
          )}

          {isInternalForecast && (
            <Alert>
              <Cpu className="h-4 w-4" />
              <AlertTitle>Pronóstico Interno</AlertTitle>
              <AlertDescription className="text-sm">
                Se cargará el pronóstico interno normalizado por semanas ISO para planning y producción.
                {modelParams?.name && ` Modelo: ${modelParams.name}`}
                {modelParams?.version && ` v${modelParams.version}`}
              </AlertDescription>
            </Alert>
          )}

          {/* Información del archivo */}
          {formData.file && (
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <div className="font-medium mb-1">Archivo a procesar:</div>
              <div>
                {formData.fileName} ({formData.fileSize})
              </div>
              {resultId && (
                <div className="mt-2 text-xs">
                  ID de referencia: <code className="bg-white px-1 rounded">{resultId}</code>
                </div>
              )}
            </div>
          )}

          {/* Confirmación final */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>Revisión final</AlertTitle>
            <AlertDescription className="text-sm">
              Al confirmar, se subirá el archivo a Firebase Storage y se guardarán las {normalizedRows.length} filas
              normalizadas por semana ISO en Firestore. Esta acción puede tardar unos segundos.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2 bg-transparent"
          disabled={submitting}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <Button onClick={handleSubmit} disabled={submitting} className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          {submitting ? "Enviando..." : "Enviar Forecast"}
        </Button>
      </div>
    </div>
  )
}
