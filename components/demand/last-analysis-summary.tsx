"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, TrendingUp, AlertTriangle, Eye, Download } from "lucide-react"

export function LastAnalysisSummary() {
  // Mock data - en Fase 2 se conectará con Firebase
  const lastAnalysis = {
    id: "analysis_2024_01_15",
    date: "2024-01-15T10:30:00Z",
    totalParts: 1247,
    totalRecords: 15680,
    aiSignals: 89,
    criticalAlerts: 12,
    status: "completed",
    processingTime: "4.2 min",
    accuracy: 94.2,
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-900">Último Análisis Generado</CardTitle>
          </div>
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
            Completado
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Fecha y tiempo */}
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Fecha de Análisis</p>
            <p className="font-semibold text-gray-900">{formatDate(lastAnalysis.date)}</p>
            <p className="text-xs text-gray-500">Procesado en {lastAnalysis.processingTime}</p>
          </div>

          {/* Datos procesados */}
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Datos Procesados</p>
            <p className="font-semibold text-gray-900">{lastAnalysis.totalParts.toLocaleString()} partes</p>
            <p className="text-xs text-gray-500">{lastAnalysis.totalRecords.toLocaleString()} registros</p>
          </div>

          {/* Señales IA */}
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Señales IA</p>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <p className="font-semibold text-gray-900">{lastAnalysis.aiSignals} detectadas</p>
            </div>
            <p className="text-xs text-gray-500">Precisión: {lastAnalysis.accuracy}%</p>
          </div>

          {/* Alertas críticas */}
          <div className="space-y-1">
            <p className="text-sm text-gray-600">Alertas Críticas</p>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="font-semibold text-red-700">{lastAnalysis.criticalAlerts} alertas</p>
            </div>
            <p className="text-xs text-gray-500">Requieren atención inmediata</p>
          </div>
        </div>

        {/* Acciones rápidas */}
        <div className="flex flex-wrap gap-3">
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={() => (window.location.href = `/demand/analysis/${lastAnalysis.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Análisis Completo
          </Button>

          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Reporte
          </Button>

          <Button variant="outline" onClick={() => (window.location.href = "/demand/upload")}>
            Nuevo Análisis
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
