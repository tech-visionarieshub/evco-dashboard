import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { FileSpreadsheet } from "lucide-react"

type ForecastSummaryProps = {
  client: string
  forecastType: string
  date: Date
  fileName: string
  totalItems: number
  alertsCount: {
    warning: number
    critical: number
  }
}

export function ForecastSummary({
  client,
  forecastType,
  date,
  fileName,
  totalItems,
  alertsCount,
}: ForecastSummaryProps) {
  // Función para obtener el nombre completo del tipo de forecast
  const getForecastTypeName = (type: string) => {
    switch (type) {
      case "monthly":
        return "Forecast Mensual"
      case "weekly":
        return "Forecast Semanal"
      default:
        return type
    }
  }

  return (
    <Card className="card-dashboard mb-6">
      <CardContent className="p-4">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium">{client}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{getForecastTypeName(forecastType)}</span>
                <span>•</span>
                <span>{format(date, "MMMM yyyy", { locale: es })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{fileName}</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/5 text-primary">
                {totalItems} registros
              </Badge>
              {alertsCount.warning > 0 && (
                <Badge variant="outline" className="bg-amber-100 text-amber-800">
                  {alertsCount.warning} advertencias
                </Badge>
              )}
              {alertsCount.critical > 0 && (
                <Badge variant="outline" className="bg-red-100 text-red-800">
                  {alertsCount.critical} críticas
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
