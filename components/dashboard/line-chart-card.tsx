"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface LinePoint {
  periodKey: string
  value: number
  isPeak?: boolean
}

interface LineChartCardProps {
  title: string
  data: LinePoint[]
  description?: string
}

export function LineChartCard({ title, data, description }: LineChartCardProps) {
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

  const maxValue = Math.max(...data.map((d) => d.value))
  const minValue = Math.min(...data.map((d) => d.value))
  const range = maxValue - minValue || 1

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="h-64 relative">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="40"
                y1={40 + (y * 120) / 100}
                x2="380"
                y2={40 + (y * 120) / 100}
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-muted-foreground/20"
              />
            ))}

            {/* Line path */}
            <path
              d={data
                .map((point, index) => {
                  const x = 40 + (index * 340) / (data.length - 1)
                  const y = 160 - ((point.value - minValue) / range) * 120
                  return `${index === 0 ? "M" : "L"} ${x} ${y}`
                })
                .join(" ")}
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
              className="text-blue-500"
            />

            {/* Data points */}
            {data.map((point, index) => {
              const x = 40 + (index * 340) / (data.length - 1)
              const y = 160 - ((point.value - minValue) / range) * 120
              return (
                <g key={index}>
                  <circle
                    cx={x}
                    cy={y}
                    r={point.isPeak ? "6" : "3"}
                    fill="currentColor"
                    className={point.isPeak ? "text-red-500" : "text-blue-500"}
                  />
                  {point.isPeak && (
                    <circle
                      cx={x}
                      cy={y}
                      r="8"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-red-500 animate-pulse"
                    />
                  )}
                </g>
              )
            })}

            {/* X-axis labels */}
            {data.map((point, index) => {
              if (index % Math.ceil(data.length / 6) === 0) {
                const x = 40 + (index * 340) / (data.length - 1)
                return (
                  <text key={index} x={x} y="185" textAnchor="middle" className="text-xs fill-muted-foreground">
                    {point.periodKey.split("-W")[1]}
                  </text>
                )
              }
              return null
            })}
          </svg>

          {/* Legend */}
          <div className="absolute top-2 right-2 text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Variación normal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Pico ≥30%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
