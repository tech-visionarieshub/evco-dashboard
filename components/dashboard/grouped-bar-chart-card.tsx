"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GroupedBarData {
  name: string
  forecast: number
  demand: number
}

interface GroupedBarChartCardProps {
  title: string
  data: GroupedBarData[]
  leftLabel?: string
  description?: string
}

export function GroupedBarChartCard({ title, data, leftLabel = "Valor", description }: GroupedBarChartCardProps) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Sin datos disponibles</div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.flatMap((d) => [d.forecast, d.demand]))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => {
            const forecastWidth = (item.forecast / maxValue) * 100
            const demandWidth = (item.demand / maxValue) * 100
            const difference = Math.abs(item.forecast - item.demand) / Math.max(item.forecast, item.demand, 1)
            const isHighDifference = difference > 0.2 // 20% threshold

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium truncate max-w-32">{item.name}</span>
                  <div className="text-xs text-muted-foreground">
                    F: {item.forecast.toLocaleString()} | D: {item.demand.toLocaleString()}
                    {isHighDifference && <span className="ml-2 text-red-500">⚠️ {Math.round(difference * 100)}%</span>}
                  </div>
                </div>
                <div className="space-y-1">
                  {/* Forecast bar */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 text-xs text-muted-foreground">Forecast</div>
                    <div className="flex-1 h-4 bg-muted rounded">
                      <div
                        className="h-4 bg-blue-500 rounded transition-all duration-300"
                        style={{ width: `${forecastWidth}%` }}
                      />
                    </div>
                  </div>
                  {/* Demand bar */}
                  <div className="flex items-center gap-2">
                    <div className="w-16 text-xs text-muted-foreground">Demanda</div>
                    <div className="flex-1 h-4 bg-muted rounded">
                      <div
                        className={`h-4 rounded transition-all duration-300 ${
                          isHighDifference ? "bg-red-500" : "bg-green-500"
                        }`}
                        style={{ width: `${demandWidth}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Forecast</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Demanda normal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Diferencia &gt;20%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
