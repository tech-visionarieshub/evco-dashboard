"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface HeatmapItem {
  partId: string
  partNumber?: string
  periodKey: string
  deviation: number // (demand - forecast) / forecast
  forecast: number
  demand: number
}

interface HeatmapCardProps {
  title: string
  data: HeatmapItem[]
  description?: string
}

export function HeatmapCard({ title, data, description }: HeatmapCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Sin datos de desviación disponibles</div>
        </CardContent>
      </Card>
    )
  }

  // Group by part and period for matrix display
  const parts = [...new Set(data.map((d) => d.partNumber || d.partId))].slice(0, 8)
  const periods = [...new Set(data.map((d) => d.periodKey))].sort().slice(-6) // Last 6 periods

  const getDeviationColor = (deviation: number) => {
    const abs = Math.abs(deviation)
    if (abs >= 0.5) return "bg-red-500" // ≥50% deviation
    if (abs >= 0.3) return "bg-orange-400" // 30-50% deviation
    if (abs >= 0.15) return "bg-yellow-400" // 15-30% deviation
    if (abs >= 0.05) return "bg-green-400" // 5-15% deviation
    return "bg-green-200" // <5% deviation
  }

  const getDeviationIntensity = (deviation: number) => {
    const abs = Math.abs(deviation)
    if (abs >= 0.5) return "opacity-100"
    if (abs >= 0.3) return "opacity-80"
    if (abs >= 0.15) return "opacity-60"
    if (abs >= 0.05) return "opacity-40"
    return "opacity-20"
  }

  const findDeviation = (partId: string, periodKey: string) => {
    return data.find((d) => (d.partNumber || d.partId) === partId && d.periodKey === periodKey)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-96">
            {/* Header with periods */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              <div className="text-xs font-medium p-2">Producto</div>
              {periods.map((period) => (
                <div key={period} className="text-xs font-medium p-2 text-center">
                  {period.split("-W")[1]}
                </div>
              ))}
            </div>

            {/* Heatmap rows */}
            {parts.map((part) => (
              <div key={part} className="grid grid-cols-7 gap-1 mb-1">
                <div className="text-xs p-2 truncate font-medium">{part}</div>
                {periods.map((period) => {
                  const item = findDeviation(part, period)
                  if (!item) {
                    return (
                      <div key={period} className="h-8 bg-gray-100 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-400">-</span>
                      </div>
                    )
                  }

                  return (
                    <div
                      key={period}
                      className={`h-8 rounded flex items-center justify-center cursor-pointer transition-all hover:scale-105 ${getDeviationColor(item.deviation)} ${getDeviationIntensity(item.deviation)}`}
                      title={`${part} - ${period}\nForecast: ${item.forecast}\nDemanda: ${item.demand}\nDesviación: ${(item.deviation * 100).toFixed(1)}%`}
                    >
                      <span className="text-xs font-medium text-white">{(item.deviation * 100).toFixed(0)}%</span>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs font-medium mb-2">Nivel de desviación:</div>
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              <span>{"<5%"}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-400 rounded"></div>
              <span>5-15%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span>15-30%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-orange-400 rounded"></div>
              <span>30-50%</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>{">50%"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
