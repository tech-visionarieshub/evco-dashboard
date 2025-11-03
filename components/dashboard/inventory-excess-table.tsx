"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface InventoryExcessRow {
  partId: string
  partNumber?: string
  currentStock: number
  projectedDemand: number
  excessWeeks: number
  isExcess: boolean
}

interface InventoryExcessTableProps {
  title: string
  rows: InventoryExcessRow[]
  description?: string
}

export function InventoryExcessTable({ title, rows, description }: InventoryExcessTableProps) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Sin datos de inventario disponibles</div>
        </CardContent>
      </Card>
    )
  }

  const getExcessBadge = (weeks: number, isExcess: boolean) => {
    if (!isExcess) return { variant: "default" as const, color: "text-green-600", label: "Normal" }
    if (weeks >= 12) return { variant: "destructive" as const, color: "text-red-600", label: "Crítico" }
    if (weeks >= 8) return { variant: "secondary" as const, color: "text-orange-600", label: "Alto" }
    return { variant: "secondary" as const, color: "text-yellow-600", label: "Moderado" }
  }

  const getBarColor = (weeks: number, isExcess: boolean) => {
    if (!isExcess) return "bg-green-500"
    if (weeks >= 12) return "bg-red-500"
    if (weeks >= 8) return "bg-orange-500"
    return "bg-yellow-500"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rows.map((row, index) => {
            const badge = getExcessBadge(row.excessWeeks, row.isExcess)
            const maxWeeks = Math.max(...rows.map((r) => r.excessWeeks))
            const barWidth = (row.excessWeeks / maxWeeks) * 100

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{row.partNumber || row.partId}</div>
                    <div className="text-xs text-muted-foreground">
                      Stock: {row.currentStock.toLocaleString()} | Demanda 4 sem: {row.projectedDemand.toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{row.excessWeeks}w</span>
                    <Badge variant={badge.variant} className={badge.color}>
                      {badge.label}
                    </Badge>
                  </div>
                </div>

                {/* Progress bar showing weeks of coverage */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded">
                    <div
                      className={`h-2 rounded transition-all duration-300 ${getBarColor(row.excessWeeks, row.isExcess)}`}
                      style={{ width: `${Math.min(100, barWidth)}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">{row.excessWeeks} semanas</span>
                </div>

                {row.isExcess && (
                  <div className="text-xs text-red-600 font-medium">
                    ⚠️ Excedente: {(row.currentStock - row.projectedDemand).toLocaleString()} unidades
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs font-medium mb-2">Cobertura de inventario:</div>
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>{"≤6 sem Normal"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>6-8 sem Moderado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>8-12 sem Alto</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>{">12 sem Crítico"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
