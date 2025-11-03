"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, Calendar, AlertTriangle, Lightbulb, Clock, Target, BarChart3 } from "lucide-react"
import type { SeasonalityInsight } from "@/lib/demand/ai-seasonality"

interface SeasonalityInsightsProps {
  insights: SeasonalityInsight[]
  partNum?: string
  isLoading?: boolean
}

export function SeasonalityInsights({ insights, partNum, isLoading }: SeasonalityInsightsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análisis de Estacionalidad
          </CardTitle>
          <CardDescription>Cargando patrones estacionales...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Análisis de Estacionalidad
            {partNum && <Badge variant="outline">{partNum}</Badge>}
          </CardTitle>
          <CardDescription>No se detectaron patrones estacionales significativos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-2">Sin patrones estacionales detectados</p>
            <p className="text-sm text-gray-500">
              Se requieren al menos 12 semanas de datos históricos para detectar estacionalidad
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getInsightIcon = (type: SeasonalityInsight["type"]) => {
    switch (type) {
      case "seasonal_peak":
        return <TrendingUp className="h-4 w-4" />
      case "seasonal_low":
        return <TrendingDown className="h-4 w-4" />
      case "trend_change":
        return <BarChart3 className="h-4 w-4" />
      case "volatility_alert":
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getInsightColor = (type: SeasonalityInsight["type"], impact: SeasonalityInsight["impact"]) => {
    if (type === "volatility_alert") return "text-red-600 bg-red-50 border-red-200"
    if (type === "seasonal_peak") return "text-green-600 bg-green-50 border-green-200"
    if (type === "seasonal_low") return "text-blue-600 bg-blue-50 border-blue-200"
    if (impact === "high") return "text-orange-600 bg-orange-50 border-orange-200"
    return "text-gray-600 bg-gray-50 border-gray-200"
  }

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 0.8) return { label: "Alta", variant: "default" as const, color: "bg-green-100 text-green-800" }
    if (confidence >= 0.6)
      return { label: "Media", variant: "secondary" as const, color: "bg-yellow-100 text-yellow-800" }
    return { label: "Baja", variant: "outline" as const, color: "bg-red-100 text-red-800" }
  }

  const getImpactBadge = (impact: SeasonalityInsight["impact"]) => {
    switch (impact) {
      case "high":
        return { label: "Alto", color: "bg-red-100 text-red-800" }
      case "medium":
        return { label: "Medio", color: "bg-yellow-100 text-yellow-800" }
      case "low":
        return { label: "Bajo", color: "bg-green-100 text-green-800" }
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Insights de Estacionalidad
          {partNum && <Badge variant="outline">{partNum}</Badge>}
        </CardTitle>
        <CardDescription>Patrones estacionales detectados y recomendaciones basadas en IA</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          {insights.map((insight, index) => {
            const confidenceBadge = getConfidenceBadge(insight.confidence)
            const impactBadge = getImpactBadge(insight.impact)

            return (
              <div key={index} className={`border rounded-lg p-4 ${getInsightColor(insight.type, insight.impact)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getInsightIcon(insight.type)}
                    <h4 className="font-semibold">{insight.title}</h4>
                  </div>
                  <div className="flex gap-2">
                    <Badge className={confidenceBadge.color}>Confianza: {confidenceBadge.label}</Badge>
                    <Badge className={impactBadge.color}>Impacto: {impactBadge.label}</Badge>
                  </div>
                </div>

                <p className="text-sm mb-3">{insight.description}</p>

                {insight.recommendation && (
                  <div className="bg-white/50 rounded-md p-3 mb-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-4 w-4 mt-0.5 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium mb-1">Recomendación:</p>
                        <p className="text-sm">{insight.recommendation}</p>
                      </div>
                    </div>
                  </div>
                )}

                {insight.implementBy && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Implementar antes de:</span>
                    <span>{insight.implementBy}</span>
                  </div>
                )}

                <div className="mt-3 flex items-center justify-between">
                  <div className="text-xs text-gray-600">Confianza: {Math.round(insight.confidence * 100)}%</div>
                  {insight.recommendation && (
                    <Button size="sm" variant="outline">
                      <Target className="h-3 w-3 mr-1" />
                      Aplicar
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {insights.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-bold text-white">i</span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-blue-800 mb-1">Análisis de Estacionalidad</p>
                <p className="text-blue-700">
                  Los insights mostrados se basan en análisis de patrones históricos y algoritmos de IA. La confianza
                  indica la solidez estadística del patrón detectado. Se recomienda validar las recomendaciones con el
                  contexto específico del negocio.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
