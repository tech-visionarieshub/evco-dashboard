"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertTriangle, Users, Activity, ArrowUp, ArrowDown } from "lucide-react"

export function DemandIndicators() {
  // Mock data - en Fase 2 se conectará con Firebase
  const indicators = {
    productsAtRisk: {
      count: 47,
      change: +12,
      trend: "up",
      severity: "high",
    },
    generalTrend: {
      direction: "up",
      percentage: 8.3,
      description: "Crecimiento sostenido",
    },
    topClients: [
      { name: "Cliente A", demand: 2340, change: +15.2 },
      { name: "Cliente B", demand: 1890, change: -3.1 },
      { name: "Cliente C", demand: 1650, change: +22.8 },
    ],
    weeklyMetrics: {
      totalDemand: 45680,
      avgVolatility: 12.4,
      forecastAccuracy: 94.2,
      inventoryTurnover: 6.8,
    },
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Productos en Riesgo */}
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-red-800">Productos en Riesgo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-red-700">{indicators.productsAtRisk.count}</span>
              <div className="flex items-center space-x-1">
                <ArrowUp className="h-3 w-3 text-red-600" />
                <span className="text-xs text-red-600">+{indicators.productsAtRisk.change}</span>
              </div>
            </div>
            <p className="text-xs text-red-600">Requieren atención inmediata</p>
            <Badge variant="destructive" className="text-xs">
              Alto Riesgo
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Tendencia General */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-green-800">Tendencia General</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-baseline space-x-2">
              <span className="text-2xl font-bold text-green-700">+{indicators.generalTrend.percentage}%</span>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs text-green-600">{indicators.generalTrend.description}</p>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
              Positiva
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Top Clientes */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-800">Top Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {indicators.topClients.slice(0, 2).map((client, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs font-medium text-blue-800">{client.name}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-blue-700">{client.demand.toLocaleString()}</span>
                  {client.change > 0 ? (
                    <ArrowUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <ArrowDown className="h-3 w-3 text-red-600" />
                  )}
                </div>
              </div>
            ))}
            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300 text-xs">
              {indicators.topClients.length} clientes activos
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Métricas Semanales */}
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-purple-800">Métricas Semanales</CardTitle>
            <Activity className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-xs text-purple-700">Demanda Total</span>
              <span className="text-xs font-semibold text-purple-800">
                {indicators.weeklyMetrics.totalDemand.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-purple-700">Precisión IA</span>
              <span className="text-xs font-semibold text-purple-800">
                {indicators.weeklyMetrics.forecastAccuracy}%
              </span>
            </div>
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300 text-xs">
              Actualizado hoy
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
