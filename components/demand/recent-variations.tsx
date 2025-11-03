"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, TrendingDown, AlertCircle, ArrowRight, Package2 } from "lucide-react"

export function RecentVariations() {
  // Mock data - en Fase 2 se conectará con Firebase
  const recentVariations = [
    {
      partNumber: "PN-2024-001",
      description: "Componente Electrónico A",
      client: "Cliente Premium",
      currentDemand: 1250,
      previousDemand: 890,
      variation: +40.4,
      trend: "up",
      riskLevel: "medium",
      lastUpdate: "2024-01-15",
      weeklyPattern: [890, 920, 1050, 1180, 1250],
    },
    {
      partNumber: "PN-2024-002",
      description: "Pieza Mecánica B",
      client: "Cliente Industrial",
      currentDemand: 680,
      previousDemand: 1120,
      variation: -39.3,
      trend: "down",
      riskLevel: "high",
      lastUpdate: "2024-01-15",
      weeklyPattern: [1120, 1050, 890, 750, 680],
    },
    {
      partNumber: "PN-2024-003",
      description: "Material Compuesto C",
      client: "Cliente Automotriz",
      currentDemand: 2340,
      previousDemand: 1980,
      variation: +18.2,
      trend: "up",
      riskLevel: "low",
      lastUpdate: "2024-01-15",
      weeklyPattern: [1980, 2050, 2150, 2280, 2340],
    },
    {
      partNumber: "PN-2024-004",
      description: "Componente Plástico D",
      client: "Cliente Tecnológico",
      currentDemand: 450,
      previousDemand: 780,
      variation: -42.3,
      trend: "down",
      riskLevel: "high",
      lastUpdate: "2024-01-15",
      weeklyPattern: [780, 720, 650, 520, 450],
    },
    {
      partNumber: "PN-2024-005",
      description: "Elemento Metálico E",
      client: "Cliente Aeroespacial",
      currentDemand: 890,
      previousDemand: 750,
      variation: +18.7,
      trend: "up",
      riskLevel: "low",
      lastUpdate: "2024-01-15",
      weeklyPattern: [750, 780, 820, 860, 890],
    },
  ]

  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "high":
        return (
          <Badge variant="destructive" className="text-xs">
            Alto Riesgo
          </Badge>
        )
      case "medium":
        return (
          <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
            Riesgo Medio
          </Badge>
        )
      case "low":
        return (
          <Badge variant="outline" className="text-xs bg-green-100 text-green-800 border-green-300">
            Bajo Riesgo
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-xs">
            Sin Clasificar
          </Badge>
        )
    }
  }

  const getTrendIcon = (trend: string, variation: number) => {
    if (trend === "up") {
      return <TrendingUp className="h-4 w-4 text-green-600" />
    } else {
      return <TrendingDown className="h-4 w-4 text-red-600" />
    }
  }

  const getTrendColor = (trend: string) => {
    return trend === "up" ? "text-green-700" : "text-red-700"
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package2 className="h-5 w-5 text-blue-600" />
            <CardTitle>Productos con Variaciones Recientes</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={() => (window.location.href = "/demand/history")}>
            Ver Todos
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentVariations.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              {/* Información del producto */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 truncate">{item.partNumber}</h4>
                    <p className="text-sm text-gray-600 truncate">{item.description}</p>
                    <p className="text-xs text-gray-500">Cliente: {item.client}</p>
                  </div>
                </div>
              </div>

              {/* Métricas de demanda */}
              <div className="flex items-center space-x-6">
                {/* Demanda actual */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">Demanda Actual</p>
                  <p className="font-semibold text-gray-900">{item.currentDemand.toLocaleString()}</p>
                </div>

                {/* Variación */}
                <div className="text-center">
                  <p className="text-sm text-gray-600">Variación</p>
                  <div className="flex items-center space-x-1">
                    {getTrendIcon(item.trend, item.variation)}
                    <span className={`font-semibold ${getTrendColor(item.trend)}`}>
                      {item.variation > 0 ? "+" : ""}
                      {item.variation.toFixed(1)}%
                    </span>
                  </div>
                </div>

                {/* Nivel de riesgo */}
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-1">Riesgo</p>
                  {getRiskBadge(item.riskLevel)}
                </div>

                {/* Acciones */}
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (window.location.href = `/demand/analysis/part/${item.partNumber}`)}
                  >
                    Analizar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Resumen */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-800">Resumen de Variaciones</span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-blue-700">Productos con aumento:</span>
              <span className="font-semibold text-blue-800 ml-2">
                {recentVariations.filter((item) => item.trend === "up").length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Productos con descenso:</span>
              <span className="font-semibold text-blue-800 ml-2">
                {recentVariations.filter((item) => item.trend === "down").length}
              </span>
            </div>
            <div>
              <span className="text-blue-700">Alto riesgo:</span>
              <span className="font-semibold text-red-700 ml-2">
                {recentVariations.filter((item) => item.riskLevel === "high").length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
