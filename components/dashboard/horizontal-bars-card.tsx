"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type Item = { name: string; value: number; color?: string; hintRight?: string }

export function HorizontalBarsCard({
  title,
  items,
  max = 8,
  description,
  emptyText = "Sin datos disponibles",
}: {
  title: string
  items: Item[]
  max?: number
  description?: string
  emptyText?: string
}) {
  const data = (items || []).slice(0, max)
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{emptyText}</div>
        </CardContent>
      </Card>
    )
  }

  const maxValue = Math.max(...data.map((d) => d.value), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((d, idx) => {
          const pct = Math.max(2, (d.value / maxValue) * 100) // ensure visible bar
          return (
            <div key={`${d.name}-${idx}`} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium truncate">{d.name}</div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {d.hintRight ?? d.value.toLocaleString()}
                </div>
              </div>
              <div className="h-3 rounded bg-muted">
                <div
                  className="h-3 rounded transition-all"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: d.color ?? "hsl(var(--primary))",
                  }}
                />
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
