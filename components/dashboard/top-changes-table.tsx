"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface TopChange {
  clientName?: string
  partNumber?: string
  periodKey: string
  changePct: number
  from: number
  to: number
}

interface TopChangesTableProps {
  title: string
  rows: TopChange[]
  description?: string
}

export function TopChangesTable({ title, rows, description }: TopChangesTableProps) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Sin cambios significativos detectados</div>
        </CardContent>
      </Card>
    )
  }

  const getChangeColor = (changePct: number) => {
    const absChange = Math.abs(changePct)
    if (absChange >= 0.5) return "destructive" // ≥50% red
    if (absChange >= 0.3) return "secondary" // ≥30% yellow/orange
    return "default" // <30% default
  }

  const getChangeIcon = (changePct: number) => {
    return changePct > 0 ? "↗️" : "↘️"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm truncate">{row.clientName || "Cliente N/D"}</span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground truncate">{row.partNumber || "Producto N/D"}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {row.periodKey} | {row.from.toLocaleString()} → {row.to.toLocaleString()}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg">{getChangeIcon(row.changePct)}</span>
                <Badge variant={getChangeColor(row.changePct)}>{Math.abs(row.changePct * 100).toFixed(0)}%</Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <Badge variant="default">{"<30%"}</Badge>
              <span>Normal</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{"30-50%"}</Badge>
              <span>Alto</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="destructive">{">50%"}</Badge>
              <span>Crítico</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
