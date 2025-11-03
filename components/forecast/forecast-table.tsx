import { AlertTriangle, CheckCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ReleasesForecastItem, WeeklyForecastItem } from "@/components/forecast/types"

type ForecastTableProps = {
  forecastType: string
  data: any[]
}

export function ForecastTable({ forecastType, data }: ForecastTableProps) {
  // Renderizar la tabla según el tipo de forecast
  if (forecastType === "monthly") {
    return <MonthlyForecastTable data={data as ReleasesForecastItem[]} />
  } else if (forecastType === "weekly") {
    return <WeeklyForecastTable data={data as WeeklyForecastItem[]} />
  }

  return <div>Tipo de forecast no soportado</div>
}

// Componente para mostrar el estado con un icono y color apropiado
function StatusIndicator({ status, message }: { status: string; message?: string }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center">
            {status === "normal" && <CheckCircle className="h-5 w-5 text-green-500" />}
            {status === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            {status === "critical" && <AlertTriangle className="h-5 w-5 text-red-500" />}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{message || (status === "normal" ? "Normal" : status === "warning" ? "Advertencia" : "Crítico")}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Tabla para Forecast Mensual (antes Releases)
function MonthlyForecastTable({ data }: { data: ReleasesForecastItem[] }) {
  return (
    <div className="rounded-md border">
      <div className="relative">
        {/* Header fijo */}
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-gray-50">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[80px]">Estado</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">PO</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Release No.</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Número de Parte</th>
              <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Cantidad</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Fecha de Entrega</th>
            </tr>
          </thead>
        </table>

        {/* Contenido con scroll */}
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full min-w-full">
            <tbody>
              {data.map((item) => (
                <tr
                  key={item.id}
                  className={
                    item.status === "critical" ? "bg-red-50" : item.status === "warning" ? "bg-amber-50" : "bg-white"
                  }
                >
                  <td className="p-4 align-middle w-[80px]">
                    <StatusIndicator status={item.status} message={item.statusMessage} />
                  </td>
                  <td className="p-4 align-middle">{item.poNumber}</td>
                  <td className="p-4 align-middle">{item.releaseNo}</td>
                  <td className="p-4 align-middle font-medium">
                    {typeof item.partNumber === "string" ? item.partNumber : String(item.partNumber).replace(/,/g, "")}
                  </td>
                  <td className="p-4 align-middle text-right">{item.quantity.toLocaleString()}</td>
                  <td className="p-4 align-middle">{item.deliveryDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

// Función para determinar si una columna tiene al menos un valor distinto de cero
function hasNonZeroValue(data: any[], columnName: string): boolean {
  return data.some((item) => {
    const value = item[columnName]
    return value !== 0 && value !== "0" && value !== "" && value !== null && value !== undefined
  })
}

// Tabla para Forecast Semanal
function WeeklyForecastTable({ data }: { data: WeeklyForecastItem[] }) {
  // Determinar qué columnas de semanas tienen al menos un valor distinto de cero
  const columnsToShow = {
    week1: hasNonZeroValue(data, "week1"),
    week2: hasNonZeroValue(data, "week2"),
    week3: hasNonZeroValue(data, "week3"),
    week4: hasNonZeroValue(data, "week4"),
    week5: hasNonZeroValue(data, "week5"),
    week6: hasNonZeroValue(data, "week6"),
  }

  // Crear array de columnas dinámicas
  const dynamicColumns = [
    { key: "week1", label: "Semana 1", show: columnsToShow.week1 },
    { key: "week2", label: "Semana 2", show: columnsToShow.week2 },
    { key: "week3", label: "Semana 3", show: columnsToShow.week3 },
    { key: "week4", label: "Semana 4", show: columnsToShow.week4 },
    { key: "week5", label: "Semana 5", show: columnsToShow.week5 },
    { key: "week6", label: "Semana 6", show: columnsToShow.week6 },
  ].filter((col) => col.show)

  return (
    <div className="rounded-md border">
      <div className="relative">
        {/* Header fijo */}
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-gray-50">
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground w-[80px]">Estado</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Número de Parte</th>
              <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Descripción</th>
              {dynamicColumns.map((column) => (
                <th key={column.key} className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
        </table>

        {/* Contenido con scroll */}
        <div className="overflow-auto max-h-[500px]">
          <table className="w-full min-w-full">
            <tbody>
              {data.map((item) => (
                <tr
                  key={item.id}
                  className={
                    item.status === "critical" ? "bg-red-50" : item.status === "warning" ? "bg-amber-50" : "bg-white"
                  }
                >
                  <td className="p-4 align-middle w-[80px]">
                    <StatusIndicator status={item.status} message={item.statusMessage} />
                  </td>
                  <td className="p-4 align-middle font-medium">{item.partNumber}</td>
                  <td className="p-4 align-middle">{item.description}</td>
                  {dynamicColumns.map((column) => (
                    <td key={column.key} className="p-4 align-middle text-right">
                      {item[column.key as keyof WeeklyForecastItem]?.toLocaleString()}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
