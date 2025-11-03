"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ArrowLeft,
  TrendingUp,
  AlertTriangle,
  Users,
  Package,
  Download,
  RefreshCw,
  BarChart3,
  Brain,
  Target,
} from "lucide-react"
import Link from "next/link"
import { getDemandAnalysis, type SaveDemandAnalysisResult } from "@/lib/services/demand-storage"

export default function DemandAnalysisPage() {
  const params = useParams()
  const router = useRouter()
  const analysisId = params.id as string

  const [analysisData, setAnalysisData] = useState<SaveDemandAnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadAnalysis()
  }, [analysisId])

  const loadAnalysis = async () => {
    try {
      setLoading(true)
      const data = await getDemandAnalysis(analysisId)

      if (!data) {
        setError("Análisis no encontrado")
        return
      }

      setAnalysisData(data)
    } catch (err) {
      setError("Error cargando el análisis")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Cargando análisis...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">{error}</p>
              <Link href="/demand">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Volver al Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const { analysis, forecasts, alerts } = analysisData

  const highPriorityAlerts = alerts.filter((a) => a.priority === "alta")
  const mediumPriorityAlerts = alerts.filter((a) => a.priority === "media")

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
              <h1 className="text-3xl font-bold text-gray-900">{analysis.nombre}</h1>
              <p className="text-gray-600 mt-1">
                Creado el {new Date(analysis.fechaCreacion).toLocaleDateString()} •{analysis.archivoOriginal}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              <Target className="h-3 w-3 mr-1" />
              {analysis.status}
            </Badge>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{analysis.totalPartes}</div>
              <div className="text-sm text-gray-600">Partes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{analysis.totalClientes}</div>
              <div className="text-sm text-gray-600">Clientes</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{analysis.totalRegistros.toLocaleString()}</div>
              <div className="text-sm text-gray-600">Registros</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <Brain className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-indigo-600">{analysis.senalesIA}</div>
              <div className="text-sm text-gray-600">Señales IA</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-red-600">{analysis.alertasCriticas}</div>
              <div className="text-sm text-gray-600">Alertas críticas</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs de contenido */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="volatility">Volatilidad</TabsTrigger>
            <TabsTrigger value="forecasts">Pronósticos</TabsTrigger>
            <TabsTrigger value="alerts">Alertas</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
          </TabsList>

          {/* Tab: Resumen */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Tendencia general */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Tendencia General
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <div
                      className={`text-4xl font-bold mb-2 ${
                        analysis.tendenciaGeneral > 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {analysis.tendenciaGeneral > 0 ? "+" : ""}
                      {analysis.tendenciaGeneral.toFixed(1)}%
                    </div>
                    <p className="text-gray-600">
                      {analysis.tendenciaGeneral > 0 ? "Crecimiento" : "Decrecimiento"} en demanda
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Top clientes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Top Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysis.topClientes.slice(0, 5).map((cliente, index) => (
                      <div key={cliente} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-semibold text-blue-600">
                            {index + 1}
                          </div>
                          <span className="font-medium">{cliente}</span>
                        </div>
                        <Badge variant="secondary">Alta actividad</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertas críticas preview */}
            {highPriorityAlerts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-800">
                    <AlertTriangle className="h-5 w-5" />
                    Alertas Críticas ({highPriorityAlerts.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {highPriorityAlerts.slice(0, 3).map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200"
                      >
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-red-800">{alert.titulo}</h4>
                          <p className="text-sm text-red-700 mt-1">{alert.descripcion}</p>
                          {alert.recomendacion && (
                            <p className="text-xs text-red-600 mt-2 font-medium">💡 {alert.recomendacion}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    {highPriorityAlerts.length > 3 && (
                      <div className="text-center">
                        <Button variant="outline" size="sm">
                          Ver todas las alertas críticas
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Tab: Volatilidad */}
          <TabsContent value="volatility" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ranking de Volatilidad</CardTitle>
                <CardDescription>Partes ordenadas por nivel de volatilidad en la demanda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.volatilidad.slice(0, 10).map((item, index) => (
                    <div
                      key={`${item.partNum}_${item.customerCode}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index < 3
                              ? "bg-red-100 text-red-600"
                              : index < 6
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-green-100 text-green-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{item.partNum}</div>
                          <div className="text-sm text-gray-600">{item.customerCode}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-lg">{(item.volatilityScore * 100).toFixed(1)}%</div>
                        <div className="text-sm text-gray-600">Promedio: {item.avgQty.toFixed(0)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Pronósticos */}
          <TabsContent value="forecasts" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pronósticos IA</CardTitle>
                <CardDescription>Predicciones para las próximas 12 semanas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {forecasts.slice(0, 10).map((forecast) => (
                    <div key={forecast.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{forecast.partNum}</div>
                        <div className="text-sm text-gray-600">
                          {forecast.customerCode} • {forecast.week}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{forecast.forecastQty.toLocaleString()}</div>
                        <div className="text-sm text-gray-600">
                          Confianza: {(forecast.confidence * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          Rango: {forecast.lowerBand} - {forecast.upperBand}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Alertas */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alertas críticas */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-800">Alertas Críticas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {highPriorityAlerts.map((alert) => (
                      <div key={alert.id} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-red-800 text-sm">{alert.titulo}</h4>
                            <p className="text-xs text-red-700 mt-1">{alert.descripcion}</p>
                            {alert.recomendacion && (
                              <p className="text-xs text-red-600 mt-2 font-medium">💡 {alert.recomendacion}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Alertas medias */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-yellow-800">Alertas Medias</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {mediumPriorityAlerts.slice(0, 5).map((alert) => (
                      <div key={alert.id} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <h4 className="font-medium text-yellow-800 text-sm">{alert.titulo}</h4>
                            <p className="text-xs text-yellow-700 mt-1">{alert.descripcion}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Tab: Inventario */}
          <TabsContent value="inventory" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análisis de Riesgo de Inventario</CardTitle>
                <CardDescription>Partes con mayor riesgo de desabasto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analysis.inventarioRiesgo.slice(0, 10).map((item, index) => (
                    <div
                      key={`${item.partNum}_${item.customerCode}`}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            item.riskLevel === "critical" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-600"
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{item.partNum}</div>
                          <div className="text-sm text-gray-600">{item.customerCode}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant="secondary"
                          className={
                            item.riskLevel === "critical" ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {item.riskLevel === "critical" ? "Crítico" : "Alto"}
                        </Badge>
                        <div className="text-sm text-gray-600 mt-1">Stock recomendado: {item.recommendedStock}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
