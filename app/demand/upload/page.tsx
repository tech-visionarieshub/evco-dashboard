"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Bot, Database, FileSpreadsheet, TrendingUp, AlertTriangle } from "lucide-react"
import Link from "next/link"
import { DemandUploadWizard } from "@/components/demand/demand-upload-wizard"
import { DemandProcessingStatus } from "@/components/demand/demand-processing-status"
import { useDemandAutoProcessing } from "@/hooks/useDemandAutoProcessing"

type UploadState = "upload" | "processing" | "complete"

export default function DemandUploadPage() {
  const [uploadState, setUploadState] = useState<UploadState>("upload")
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [analysisConfig, setAnalysisConfig] = useState<{
    name: string
    description: string
  }>({ name: "", description: "" })

  const processing = useDemandAutoProcessing()

  const handleFileUpload = (file: File, config: { name: string; description: string }) => {
    setUploadedFile(file)
    setAnalysisConfig(config)
    setUploadState("processing")

    // Iniciar procesamiento automático
    processing
      .startProcessing(file, config.name, config.description)
      .then(() => {
        setUploadState("complete")
      })
      .catch((error) => {
        console.error("Error en procesamiento:", error)
        // El estado de error se maneja en el hook
      })
  }

  const handleReset = () => {
    setUploadState("upload")
    setUploadedFile(null)
    setAnalysisConfig({ name: "", description: "" })
    processing.reset()
  }

  const handleRetry = () => {
    if (uploadedFile) {
      setUploadState("processing")
      processing
        .retry(uploadedFile, analysisConfig.name, analysisConfig.description)
        .then(() => {
          setUploadState("complete")
        })
        .catch((error) => {
          console.error("Error en retry:", error)
        })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/demand">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver al Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Subir Datos de Demanda</h1>
              <p className="text-gray-600 mt-1">Procesamiento automático con IA integrada</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Bot className="h-3 w-3 mr-1" />
              Auto-procesamiento
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Database className="h-3 w-3 mr-1" />
              IA Activa
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contenido principal */}
          <div className="lg:col-span-2">
            {uploadState === "upload" && <DemandUploadWizard onFileUpload={handleFileUpload} />}

            {uploadState === "processing" && (
              <DemandProcessingStatus
                isProcessing={processing.isProcessing}
                step={processing.step}
                progress={processing.progress}
                error={processing.error}
                onRetry={handleRetry}
                onReset={handleReset}
              />
            )}

            {uploadState === "complete" && processing.result && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Análisis Completado
                  </CardTitle>
                  <CardDescription>Tu análisis de demanda ha sido procesado exitosamente</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Resumen del análisis */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{processing.result.analysis.totalPartes}</div>
                      <div className="text-sm text-gray-600">Partes analizadas</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {processing.result.analysis.totalRegistros.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-600">Registros procesados</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">{processing.result.analysis.senalesIA}</div>
                      <div className="text-sm text-gray-600">Señales IA</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">
                        {processing.result.analysis.alertasCriticas}
                      </div>
                      <div className="text-sm text-gray-600">Alertas críticas</div>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href={`/demand/analysis/${processing.result.analysisId}`} className="flex-1">
                      <Button className="w-full">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Ver Análisis Completo
                      </Button>
                    </Link>
                    <Button variant="outline" onClick={handleReset} className="flex-1 bg-transparent">
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Subir Otro Archivo
                    </Button>
                  </div>

                  {/* Alertas críticas preview */}
                  {processing.result.alerts.filter((a) => a.priority === "alta").length > 0 && (
                    <div className="border-l-4 border-red-500 bg-red-50 p-4 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <h4 className="font-semibold text-red-800">Alertas Críticas Detectadas</h4>
                      </div>
                      <div className="space-y-1">
                        {processing.result.alerts
                          .filter((a) => a.priority === "alta")
                          .slice(0, 3)
                          .map((alert, index) => (
                            <div key={index} className="text-sm text-red-700">
                              • {alert.titulo}
                            </div>
                          ))}
                        {processing.result.alerts.filter((a) => a.priority === "alta").length > 3 && (
                          <div className="text-sm text-red-600 font-medium">
                            +{processing.result.alerts.filter((a) => a.priority === "alta").length - 3} alertas más
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Panel lateral informativo */}
          <div className="space-y-6">
            {/* Proceso automático */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-600" />
                  Proceso Automático
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">1</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Validación</div>
                    <div className="text-xs text-gray-600">Estructura y columnas requeridas</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">2</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Normalización</div>
                    <div className="text-xs text-gray-600">Conversión a formato semanal</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">3</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Análisis</div>
                    <div className="text-xs text-gray-600">Estadísticas y volatilidad</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">4</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">IA</div>
                    <div className="text-xs text-gray-600">Predicciones y anomalías</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-blue-600">5</span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">Guardado</div>
                    <div className="text-xs text-gray-600">Persistencia en Firebase</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Requisitos */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                  Requisitos del Archivo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Formato Excel (.xlsx)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Máximo 50MB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Columnas: fecha, cliente, parte, cantidad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Datos históricos (mín. 4 semanas)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estadísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  Estadísticas del Módulo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Análisis totales</span>
                  <span className="font-semibold">127</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Esta semana</span>
                  <span className="font-semibold">8</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Precisión IA</span>
                  <span className="font-semibold text-green-600">94.2%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Tiempo promedio</span>
                  <span className="font-semibold">2.3 min</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
