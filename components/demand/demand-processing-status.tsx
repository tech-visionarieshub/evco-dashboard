"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Clock,
  Database,
  Brain,
  FileCheck,
  Save,
} from "lucide-react"

interface ProcessingStep {
  id: string
  label: string
  status: "pending" | "processing" | "completed" | "error"
  progress?: number
  message?: string
}

interface ProcessingStatusProps {
  isProcessing: boolean
  step: string
  progress: number
  error: string | null
  steps?: ProcessingStep[]
  onRetry?: () => void
  onReset?: () => void
}

export function DemandProcessingStatus({
  isProcessing,
  step,
  progress,
  error,
  steps = [],
  onRetry,
  onReset,
}: ProcessingStatusProps) {
  const getStepIcon = (stepId: string, status: ProcessingStep["status"]) => {
    const iconProps = { className: "h-5 w-5" }

    if (status === "completed") {
      return <CheckCircle {...iconProps} className="h-5 w-5 text-green-600" />
    } else if (status === "error") {
      return <AlertCircle {...iconProps} className="h-5 w-5 text-red-600" />
    } else if (status === "processing") {
      return <Loader2 {...iconProps} className="h-5 w-5 text-blue-600 animate-spin" />
    }

    // Default icons by step
    switch (stepId) {
      case "validating":
        return <FileCheck {...iconProps} className="h-5 w-5 text-gray-400" />
      case "normalizing":
        return <Database {...iconProps} className="h-5 w-5 text-gray-400" />
      case "analyzing":
        return <Clock {...iconProps} className="h-5 w-5 text-gray-400" />
      case "ai-processing":
        return <Brain {...iconProps} className="h-5 w-5 text-gray-400" />
      case "saving":
        return <Save {...iconProps} className="h-5 w-5 text-gray-400" />
      default:
        return <Clock {...iconProps} className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "processing":
        return "bg-blue-100 text-blue-800"
      case "error":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-600"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isProcessing ? (
            <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
          ) : error ? (
            <AlertCircle className="h-5 w-5 text-red-600" />
          ) : (
            <CheckCircle className="h-5 w-5 text-green-600" />
          )}
          {isProcessing ? "Procesando Análisis" : error ? "Error en Procesamiento" : "Procesamiento Completado"}
        </CardTitle>
        <CardDescription>
          {isProcessing
            ? "Tu archivo está siendo procesado automáticamente"
            : error
              ? "Ocurrió un error durante el procesamiento"
              : "El análisis se completó exitosamente"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">{step || "Iniciando..."}</span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps list */}
        <div className="space-y-3">
          {steps.map((stepItem, index) => (
            <div key={stepItem.id} className="flex items-center gap-3 p-3 rounded-lg border">
              <div className="flex-shrink-0">{getStepIcon(stepItem.id, stepItem.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{stepItem.label}</span>
                  <Badge variant="secondary" className={getStatusColor(stepItem.status)}>
                    {stepItem.status === "pending" && "Pendiente"}
                    {stepItem.status === "processing" && "Procesando"}
                    {stepItem.status === "completed" && "Completado"}
                    {stepItem.status === "error" && "Error"}
                  </Badge>
                </div>
                {stepItem.message && <p className="text-xs text-gray-600 mt-1">{stepItem.message}</p>}
              </div>
              <div className="text-xs text-gray-500">
                {index + 1}/{steps.length}
              </div>
            </div>
          ))}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800 mb-1">Error de procesamiento</h4>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {error && onRetry && (
            <Button onClick={onRetry} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          )}
          {onReset && (
            <Button variant="outline" onClick={onReset} className="flex-1 bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a subir
            </Button>
          )}
        </div>

        {/* Processing info */}
        {isProcessing && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-white">i</span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">Procesamiento en curso</p>
                <p className="text-blue-700">
                  El análisis puede tomar entre 1-3 minutos dependiendo del tamaño del archivo. No cierres esta ventana
                  hasta que se complete.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
