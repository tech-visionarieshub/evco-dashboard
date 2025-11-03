"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface ComplianceRow {
  clientName?: string
  partNumber?: string
  compliancePercent: number
  totalOrders: number
  compliantOrders: number
}

interface ComplianceTableProps {
  title: string
  rows: ComplianceRow[]
  type: "moq" | "leadtime"
  description?: string
}

export function ComplianceTable({ title, rows, type, description }: ComplianceTableProps) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Sin datos de cumplimiento disponibles</div>
        </CardContent>
      </Card>
    )
  }

  const getComplianceBadge = (percent: number) => {
    if (percent >= 90) return { variant: "default" as const, color: "text-green-600", label: "Excelente" }
    if (percent >= 80) return { variant: "secondary" as const, color: "text-yellow-600", label: "Bueno" }
    if (percent >= 60) return { variant: "secondary" as const, color: "text-orange-600", label: "Regular" }
    return { variant: "destructive" as const, color: "text-red-600", label: "Bajo" }
  }

  const getBarColor = (percent: number) => {
    if (percent >= 90) return "bg-green-500"
    if (percent >= 80) return "bg-yellow-500"
    if (percent >= 60) return "bg-orange-500"
    return "bg-red-500"
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
            const badge = getComplianceBadge(row.compliancePercent)

            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">
                      {type === "moq" ? row.partNumber || "Producto N/D" : row.clientName || "Cliente N/D"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {row.compliantOrders}/{row.totalOrders} {type === "moq" ? "órdenes" : "envíos"} cumplidos
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={badge.variant} className={badge.color}>
                      {row.compliancePercent}%
                    </Badge>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded">
                    <div
                      className={`h-2 rounded transition-all duration-300 ${getBarColor(row.compliancePercent)}`}
                      style={{ width: `${row.compliancePercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-12 text-right">{badge.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 pt-3 border-t">
          <div className="text-xs font-medium mb-2">
            {type === "moq" ? "Cumplimiento MOQ:" : "Cumplimiento Lead Time:"}
          </div>
          <div className="flex items-center gap-4 text-xs flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>{"<60% Bajo"}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded"></div>
              <span>60-79% Regular</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span>80-89% Bueno</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>{"≥90% Excelente"}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
