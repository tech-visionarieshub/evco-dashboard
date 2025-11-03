import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Tipos de datos para los diferentes forecasts
type ReleasesForecastItem = {
  id: string
  poNumber: string
  releaseNo: string
  partNumber: string
  quantity: number
  deliveryDate: string
  status: "normal" | "warning" | "critical"
  statusMessage?: string
}

type WeeklyForecastItem = {
  id: string
  partNumber: string
  description: string
  week1: number
  week2: number
  week3: number
  week4: number
  week5: number
  week6: number
  status: "normal" | "warning" | "critical"
  statusMessage?: string
}

type DailyForecastItem = {
  id: string
  partNumber: string
  description: string
  day1: number
  day2: number
  day3: number
  day4: number
  day5: number
  status: "normal" | "warning" | "critical"
  statusMessage?: string
}

type LogisticsForecastItem = {
  id: string
  partNumber: string
  description: string
  currentInventory: number
  moq: number
  safetyStock: number
  openPOs: number
  doh: number
  status: "normal" | "warning" | "critical"
  statusMessage?: string
}

type ForecastTableProps = {
  forecastType: string
  data: any[]
}

export function ForecastTable({ forecastType, data }: ForecastTableProps) {
  // Renderizar la tabla según el tipo de forecast
  if (forecastType === "releases") {
    return <ReleasesForecastTable data={data as ReleasesForecastItem[]} />
  } else if (forecastType === "weekly") {
    return <WeeklyForecastTable data={data as WeeklyForecastItem[]} />
  } else if (forecastType === "daily") {
    return <DailyForecastTable data={data as DailyForecastItem[]} />
  } else if (forecastType === "inventory") {
    return <LogisticsForecastTable data={data as LogisticsForecastItem[]} />
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

// Tabla para Forecast de Releases
function ReleasesForecastTable({ data }: { data: ReleasesForecastItem[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Estado</TableHead>
            <TableHead>PO</TableHead>
            <TableHead>Release No.</TableHead>
            <TableHead>Número de Parte</TableHead>
            <TableHead className="text-right">Cantidad</TableHead>
            <TableHead>Fecha de Entrega</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className={
                item.status === "critical" ? "bg-red-50" : item.status === "warning" ? "bg-amber-50" : "bg-white"
              }
            >
              <TableCell>
                <StatusIndicator status={item.status} message={item.statusMessage} />
              </TableCell>
              <TableCell>{item.poNumber}</TableCell>
              <TableCell>{item.releaseNo}</TableCell>
              <TableCell className="font-medium">{item.partNumber}</TableCell>
              <TableCell className="text-right">{item.quantity.toLocaleString()}</TableCell>
              <TableCell>{item.deliveryDate}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Tabla para Forecast Semanal
function WeeklyForecastTable({ data }: { data: WeeklyForecastItem[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Estado</TableHead>
            <TableHead>Número de Parte</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Semana 1</TableHead>
            <TableHead className="text-right">Semana 2</TableHead>
            <TableHead className="text-right">Semana 3</TableHead>
            <TableHead className="text-right">Semana 4</TableHead>
            <TableHead className="text-right">Semana 5</TableHead>
            <TableHead className="text-right">Semana 6</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className={
                item.status === "critical" ? "bg-red-50" : item.status === "warning" ? "bg-amber-50" : "bg-white"
              }
            >
              <TableCell>
                <StatusIndicator status={item.status} message={item.statusMessage} />
              </TableCell>
              <TableCell className="font-medium">{item.partNumber}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{item.week1.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.week2.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.week3.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.week4.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.week5.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.week6.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Tabla para Forecast Diario
function DailyForecastTable({ data }: { data: DailyForecastItem[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Estado</TableHead>
            <TableHead>Número de Parte</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Día 1</TableHead>
            <TableHead className="text-right">Día 2</TableHead>
            <TableHead className="text-right">Día 3</TableHead>
            <TableHead className="text-right">Día 4</TableHead>
            <TableHead className="text-right">Día 5</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className={
                item.status === "critical" ? "bg-red-50" : item.status === "warning" ? "bg-amber-50" : "bg-white"
              }
            >
              <TableCell>
                <StatusIndicator status={item.status} message={item.statusMessage} />
              </TableCell>
              <TableCell className="font-medium">{item.partNumber}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{item.day1.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.day2.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.day3.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.day4.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.day5.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Tabla para Forecast Logístico/Inventarios
function LogisticsForecastTable({ data }: { data: LogisticsForecastItem[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[80px]">Estado</TableHead>
            <TableHead>Número de Parte</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-right">Inventario Actual</TableHead>
            <TableHead className="text-right">MOQ</TableHead>
            <TableHead className="text-right">Safety Stock</TableHead>
            <TableHead className="text-right">Open POs</TableHead>
            <TableHead className="text-right">DOH</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow
              key={item.id}
              className={
                item.status === "critical" ? "bg-red-50" : item.status === "warning" ? "bg-amber-50" : "bg-white"
              }
            >
              <TableCell>
                <StatusIndicator status={item.status} message={item.statusMessage} />
              </TableCell>
              <TableCell className="font-medium">{item.partNumber}</TableCell>
              <TableCell>{item.description}</TableCell>
              <TableCell className="text-right">{item.currentInventory.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.moq.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.safetyStock.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.openPOs.toLocaleString()}</TableCell>
              <TableCell className="text-right">{item.doh.toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
