"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, FileSpreadsheet, Calendar, Clock, MoreHorizontal, Eye, Database, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { getForecastHistory, getForecastDataForDownload } from "@/lib/services/firebase-dashboard"
import { useToast } from "@/hooks/use-toast"

interface ForecastFile {
  id: string
  source: "client" | "internal"
  clientId: string
  format: "weekly" | "monthly"
  nature: "new" | "correction"
  status: "uploaded" | "processed" | "error"
  modelParams?: {
    name?: string
    version?: string
    comments?: string
  }
  createdAt: Date
  rowsCount?: number
  hash: string
}

export function ForecastHistoryActivity() {
  const [filter, setFilter] = useState("all")
  const [forecastHistory, setForecastHistory] = useState<ForecastFile[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState<string | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Cargar datos de Firebase
  useEffect(() => {
    const loadHistory = async () => {
      try {
        setLoading(true)
        const data = await getForecastHistory()
        setForecastHistory(data as ForecastFile[])
      } catch (error) {
        console.error("Error loading forecast history:", error)
        toast({
          title: "Error",
          description: "No se pudo cargar el historial de forecasts",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadHistory()
  }, [toast])

  const filteredHistory =
    filter === "all"
      ? forecastHistory
      : forecastHistory.filter((item) => item.clientId.toLowerCase() === filter.toLowerCase())

  const uniqueClients = Array.from(new Set(forecastHistory.map((item) => item.clientId)))

  const formatDate = (date: Date) => {
    return format(date, "dd/MM/yyyy", { locale: es })
  }

  const formatTime = (date: Date) => {
    return format(date, "HH:mm", { locale: es })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "processed":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Completado
          </Badge>
        )
      case "uploaded":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Subido
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Error
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getTitle = (forecast: ForecastFile) => {
    if (forecast.modelParams?.name) {
      return `${forecast.modelParams.name} - ${forecast.format === "weekly" ? "Semanal" : "Mensual"}`
    }
    return `${forecast.source === "client" ? "Cliente" : "Interno"} - ${forecast.format === "weekly" ? "Semanal" : "Mensual"}`
  }

  const handleViewForecast = (id: string) => {
    router.push(`/forecast/${id}`)
  }

  const handleDownloadEpicor = async (forecast: ForecastFile) => {
    try {
      setDownloading(forecast.id)

      // Obtener datos del forecast
      const forecastData = await getForecastDataForDownload(forecast.clientId, forecast.id)

      if (forecastData.length === 0) {
        toast({
          title: "Sin datos",
          description: "No se encontraron datos para este forecast",
          variant: "destructive",
        })
        return
      }

      // Importar dinámicamente la biblioteca xlsx
      const XLSX = await import("xlsx")

      // Convertir datos de Firebase a formato Epicor
      const epicorData = forecastData.map((row: any) => {
        // Extraer año y semana del periodKey (formato: YYYY-Www)
        const [year, weekStr] = row.periodKey.split("-W")
        const week = Number.parseInt(weekStr)

        // Convertir semana ISO a fecha aproximada del mes
        const date = new Date(Number.parseInt(year), 0, 1 + (week - 1) * 7)
        const month = date.getMonth()
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        const shortYear = year.slice(-2)
        const columnName = `${monthNames[month]}-${shortYear}`

        return {
          "Cust ID": row.clientId,
          "No. Parte EVCO": row.partId,
          "No. Parte Cliente": row.partId, // En un caso real, esto vendría de otra tabla
          [columnName]: row.qty || 0,
        }
      })

      // Agrupar por parte y sumar cantidades por mes
      const groupedData: { [key: string]: any } = {}
      epicorData.forEach((row) => {
        const key = `${row["Cust ID"]}-${row["No. Parte EVCO"]}`
        if (!groupedData[key]) {
          groupedData[key] = {
            "Cust ID": row["Cust ID"],
            "No. Parte EVCO": row["No. Parte EVCO"],
            "No. Parte Cliente": row["No. Parte Cliente"],
          }
        }

        // Sumar cantidades por mes
        Object.keys(row).forEach((col) => {
          if (col.includes("-")) {
            // Es una columna de mes
            groupedData[key][col] = (groupedData[key][col] || 0) + row[col]
          }
        })
      })

      const finalData = Object.values(groupedData)

      // Crear una hoja de cálculo
      const ws = XLSX.utils.json_to_sheet(finalData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Epicor_Import")

      // Generar el archivo y descargarlo
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `Epicor_Forecast_${forecast.clientId}_${format(new Date(), "yyyyMMdd")}.xlsx`
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      toast({
        title: "Descarga exitosa",
        description: "Archivo Epicor generado correctamente",
      })
    } catch (error) {
      console.error("Error al generar el archivo para Epicor:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el archivo para Epicor",
        variant: "destructive",
      })
    } finally {
      setDownloading(null)
    }
  }

  const handleDownloadTable = async (forecast: ForecastFile) => {
    try {
      setDownloading(forecast.id)

      // Obtener datos del forecast
      const forecastData = await getForecastDataForDownload(forecast.clientId, forecast.id)

      if (forecastData.length === 0) {
        toast({
          title: "Sin datos",
          description: "No se encontraron datos para este forecast",
          variant: "destructive",
        })
        return
      }

      // Importar dinámicamente la biblioteca xlsx
      const XLSX = await import("xlsx")

      // Crear un libro de Excel
      const wb = XLSX.utils.book_new()

      // Crear datos para el reporte
      const reportData = [
        ["Resumen de Forecast", ""],
        ["", ""],
        ["Cliente:", forecast.clientId],
        ["Título:", getTitle(forecast)],
        ["Fecha de procesamiento:", formatDate(forecast.createdAt)],
        ["Tipo:", forecast.source === "client" ? "Cliente" : "Interno"],
        ["Formato:", forecast.format === "weekly" ? "Semanal" : "Mensual"],
        ["Estado:", forecast.status],
        ["Filas procesadas:", forecast.rowsCount || forecastData.length],
        ["", ""],
        ["Reporte generado por EVCO Forecast System", ""],
      ]

      // Convertir los datos a una hoja de cálculo
      const ws = XLSX.utils.aoa_to_sheet(reportData)

      // Ajustar el ancho de las columnas
      const colWidths = [{ wch: 25 }, { wch: 30 }]
      ws["!cols"] = colWidths

      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Resumen")

      // Añadir hoja con datos del forecast
      const dataWs = XLSX.utils.json_to_sheet(forecastData)
      XLSX.utils.book_append_sheet(wb, dataWs, "Datos")

      // Generar el archivo y descargarlo
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `Forecast_${forecast.clientId}_${format(new Date(), "yyyyMMdd")}.xlsx`
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      toast({
        title: "Descarga exitosa",
        description: "Reporte generado correctamente",
      })
    } catch (error) {
      console.error("Error al generar el reporte:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al generar el reporte",
        variant: "destructive",
      })
    } finally {
      setDownloading(null)
    }
  }

  const handleExportAll = async () => {
    try {
      setDownloading("all")

      // Importar dinámicamente la biblioteca xlsx
      const XLSX = await import("xlsx")

      // Crear datos para exportar
      const exportData = filteredHistory.map((forecast) => ({
        ID: forecast.id,
        Cliente: forecast.clientId,
        Título: getTitle(forecast),
        Tipo: forecast.source === "client" ? "Cliente" : "Interno",
        Formato: forecast.format === "weekly" ? "Semanal" : "Mensual",
        Estado: forecast.status,
        Fecha: formatDate(forecast.createdAt),
        Hora: formatTime(forecast.createdAt),
        Filas: forecast.rowsCount || 0,
      }))

      // Crear una hoja de cálculo
      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Historial_Forecasts")

      // Generar el archivo y descargarlo
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)

      const a = document.createElement("a")
      a.href = url
      a.download = `Historial_Forecasts_${format(new Date(), "yyyyMMdd")}.xlsx`
      document.body.appendChild(a)
      a.click()

      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      toast({
        title: "Exportación exitosa",
        description: "Historial exportado correctamente",
      })
    } catch (error) {
      console.error("Error al exportar:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al exportar el historial",
        variant: "destructive",
      })
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando historial...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Historial de Actividad</h2>
        <div className="flex gap-2">
          <Select defaultValue="all" onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los clientes</SelectItem>
              {uniqueClients.map((client) => (
                <SelectItem key={client} value={client.toLowerCase()}>
                  {client}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExportAll} disabled={downloading === "all"}>
            {downloading === "all" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Exportar
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecasts procesados ({filteredHistory.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filter === "all" ? "No hay forecasts procesados" : "No hay forecasts para este cliente"}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Filas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHistory.map((forecast) => (
                  <TableRow key={forecast.id}>
                    <TableCell className="font-medium">{getTitle(forecast)}</TableCell>
                    <TableCell>{forecast.clientId}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{forecast.source === "client" ? "Cliente" : "Interno"}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                        {formatDate(forecast.createdAt)}
                        <Clock className="ml-4 mr-2 h-4 w-4 text-muted-foreground" />
                        {formatTime(forecast.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(forecast.status)}</TableCell>
                    <TableCell>{forecast.rowsCount || 0}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" disabled={downloading === forecast.id}>
                            {downloading === forecast.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <MoreHorizontal className="h-4 w-4" />
                            )}
                            <span className="sr-only">Abrir menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewForecast(forecast.id)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver forecast
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadEpicor(forecast)}>
                            <Database className="mr-2 h-4 w-4" />
                            Descargar Epicor
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDownloadTable(forecast)}>
                            <FileSpreadsheet className="mr-2 h-4 w-4" />
                            Descargar tabla
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
