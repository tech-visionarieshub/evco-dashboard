import { AlertTriangle, TrendingUp, TrendingDown } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

type AlertItemProps = {
  type: "warning" | "critical"
  // Nuevos campos para forecast
  client?: string
  material?: string
  quantity?: number
  month?: string
  // Nuevos campos para tendencia y navegación
  trend?: "up" | "down"
  changePercentage?: number
  previousValue?: number
  forecastId?: string
  // Campos antiguos
  title?: string
  description?: string
  time?: string
}

export function AlertItem({
  type,
  client,
  material,
  quantity,
  month,
  trend,
  changePercentage,
  previousValue,
  forecastId,
  title,
  description,
  time,
}: AlertItemProps) {
  // Determinar qué formato usar
  const isNewFormat = client !== undefined && material !== undefined && quantity !== undefined && month !== undefined

  const content = (
    <div
      className={`flex items-center gap-4 rounded-lg border p-4 bg-white transition-colors ${
        forecastId ? "hover:bg-blue-50 cursor-pointer" : "hover:bg-gray-50"
      }`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full ${
          type === "critical" ? "bg-red-100" : "bg-amber-100"
        }`}
      >
        <AlertTriangle className={`h-5 w-5 ${type === "critical" ? "text-red-600" : "text-amber-600"}`} />
      </div>

      {isNewFormat ? (
        // Nuevo formato con client, material, quantity, month
        <>
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div>
              <div className="text-sm text-muted-foreground">Cliente</div>
              <div className="font-medium">{client}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Material</div>
              <div className="font-medium">{material}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Cantidad</div>
              <div className="font-medium flex items-center gap-2">
                {quantity?.toLocaleString()}
                {trend && (
                  <div className={`flex items-center gap-1 ${trend === "up" ? "text-green-600" : "text-red-600"}`}>
                    {trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {changePercentage && (
                      <span className="text-xs font-medium">
                        {trend === "up" ? "+" : ""}
                        {changePercentage}%
                      </span>
                    )}
                  </div>
                )}
              </div>
              {previousValue && (
                <div className="text-xs text-muted-foreground">Anterior: {previousValue.toLocaleString()}</div>
              )}
            </div>
          </div>
          <Badge variant="outline" className="whitespace-nowrap">
            {month}
          </Badge>
        </>
      ) : (
        // Formato antiguo con title, description, time
        <>
          <div className="flex-1">
            <div className="font-medium">{title}</div>
            <div className="text-sm text-muted-foreground">{description}</div>
          </div>
          <Badge variant="outline">{time}</Badge>
        </>
      )}
    </div>
  )

  // Si tiene forecastId, envolver en Link
  if (forecastId) {
    return <Link href={`/forecast/${forecastId}`}>{content}</Link>
  }

  return content
}
