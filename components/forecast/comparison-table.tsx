"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronUp,
  Search,
  SlidersHorizontal,
  FileDown,
  Plus,
} from "lucide-react"
import * as XLSX from "xlsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ForecastComparisonItem } from "@/components/forecast/types"
// Importar las funciones de utilidad
import { convertToCSV, downloadFile } from "@/lib/utils"

type ForecastComparisonTableProps = {
  data: ForecastComparisonItem[]
  onExport?: () => void
  showSalesColumns?: boolean
}

export function ForecastComparisonTable({ data, onExport, showSalesColumns = false }: ForecastComparisonTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedSemaphores, setSelectedSemaphores] = useState<string[]>(["green", "yellow", "red"])
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)
  const [showNewOnly, setShowNewOnly] = useState(false)

  // Función para determinar el color del semáforo según el porcentaje de cambio
  const getSemaphoreColor = (percentage: number): string => {
    const absPercentage = Math.abs(percentage)
    if (absPercentage <= 19) return "green"
    if (absPercentage <= 29) return "yellow"
    return "red"
  }

  // Nueva función para obtener la clase de color de texto basada en el semáforo
  const getSemaphoreTextColorClass = (semaphoreColor: string): string => {
    switch (semaphoreColor) {
      case "green":
        return "text-green-600"
      case "yellow":
        return "text-amber-600"
      case "red":
        return "text-red-600"
      default:
        return ""
    }
  }

  // Función para obtener la clase de color según el valor de asertividad
  const getAssertivityColorClass = (assertivity: number | undefined) => {
    if (!assertivity) return ""
    if (assertivity >= 90 && assertivity <= 110) return "text-green-600"
    if ((assertivity >= 80 && assertivity < 90) || (assertivity > 110 && assertivity <= 120)) return "text-amber-600"
    return "text-red-600"
  }

  // Función para obtener el texto del semáforo
  const getSemaphoreText = (color: string) => {
    switch (color) {
      case "green":
        return "Normal"
      case "yellow":
        return "Moderada"
      case "red":
        return "Alta"
      default:
        return ""
    }
  }

  // Función para formatear fecha según el tipo de período
  const formatPeriod = (period: string | undefined, type: "monthly" | "weekly" = "monthly") => {
    if (!period) return "-"

    if (type === "monthly") {
      // Para formato mensual como "05-2025" -> "Mayo 2025"
      const [month, year] = period.split("-")
      const monthNames = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre",
      ]
      const monthIndex = Number.parseInt(month) - 1
      return `${monthNames[monthIndex]} ${year}`
    } else {
      // Para formato semanal como "2025-W01" -> "S05/05-09/05 2025"
      // Esto es un ejemplo, necesitarías la lógica específica para calcular las fechas de la semana
      return period // Por ahora retorna el período tal como viene
    }
  }

  // Función para formatear fecha
  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "-"
    const dateObj = typeof date === "string" ? new Date(date) : date
    return dateObj.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  // Función para ordenar los datos
  const sortData = (data: ForecastComparisonItem[]) => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      let valueA: any = a[sortColumn as keyof ForecastComparisonItem]
      let valueB: any = b[sortColumn as keyof ForecastComparisonItem]

      // Convertir a números si son strings numéricos
      if (typeof valueA === "string" && !isNaN(Number(valueA))) valueA = Number(valueA)
      if (typeof valueB === "string" && !isNaN(Number(valueB))) valueB = Number(valueB)

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }

  // Función para manejar el cambio de ordenamiento
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Filtrar datos por término de búsqueda y semáforos seleccionados
  const filteredData = sortData(
    data.filter((item) => {
      // Filtrar por término de búsqueda
      const searchMatch =
        searchTerm === "" ||
        item.evcoPartNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientPartNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.evcoNumber && item.evcoNumber.toLowerCase().includes(searchTerm.toLowerCase()))

      // Filtrar por semáforos seleccionados
      const semaphoreColor = getSemaphoreColor(item.changePercentage)
      const semaphoreMatch = selectedSemaphores.includes(semaphoreColor)

      // Filtrar por productos nuevos si está activado
      const newMatch = !showNewOnly || item.isNew === true

      return searchMatch && semaphoreMatch && newMatch
    }),
  )

  // Renderizar el indicador de dirección de ordenamiento
  const renderSortIndicator = (column: string) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  // Función para exportar a Excel
  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Si hay una función onExport proporcionada, usarla
      if (onExport) {
        onExport()
        setIsExporting(false)
        return
      }

      // Preparar los datos para Excel
      const exportData = filteredData.map((item) => {
        const semaphoreColor = getSemaphoreColor(item.changePercentage)
        const exportItem: Record<string, any> = {
          "NO PARTE EVCO": item.evcoPartNumber,
          "CUST ID": item.evcoNumber || "",
          "NO PARTE CLIENTE": item.clientPartNumber,
          Period: formatPeriod(item.period),
          "Forecast anterior": item.previousForecast,
          "Forecast actual": item.currentForecast,
          Diferencia:
            item.changePercentage > 0
              ? `+${item.currentForecast - item.previousForecast}`
              : item.currentForecast - item.previousForecast,
          "% Cambio": `${item.changePercentage > 0 ? "+" : ""}${item.changePercentage.toFixed(1)}%`,
          Variación: getSemaphoreText(semaphoreColor),
          Tipo: item.variationType === "pico" ? "Pico" : item.variationType === "moderada" ? "Moderada" : "Normal",
          "Producto nuevo": item.isNew ? "Sí" : "No",
        }

        // Añadir columnas de ventas si están habilitadas
        if (showSalesColumns) {
          exportItem["Ventas mes actual"] = item.currentMonthSales || 0
          exportItem["Ventas mes anterior"] = item.previousMonthSales || 0
          exportItem["Ventas hace 2 meses"] = item.twoMonthsAgoSales || 0
          exportItem["Asertividad (%)"] = item.assertivity ? `${item.assertivity.toFixed(1)}%` : "N/A"
        }

        return exportItem
      })

      // Crear un libro de trabajo
      const wb = XLSX.utils.book_new()

      // Crear una hoja de trabajo con los datos
      const ws = XLSX.utils.json_to_sheet(exportData)

      // Establecer anchos de columna
      const baseColWidths = [
        { wch: 15 }, // Número de parte EVCO
        { wch: 10 }, // CUST ID
        { wch: 15 }, // Número de parte cliente
        { wch: 15 }, // Period
        { wch: 15 }, // Forecast anterior
        { wch: 15 }, // Forecast actual
        { wch: 15 }, // Diferencia
        { wch: 10 }, // % Cambio
        { wch: 10 }, // Variación
        { wch: 10 }, // Tipo
        { wch: 12 }, // Producto nuevo
      ]

      // Añadir anchos para columnas de ventas si están habilitadas
      const salesColWidths = showSalesColumns
        ? [
            { wch: 15 }, // Ventas mes actual
            { wch: 15 }, // Ventas mes anterior
            { wch: 15 }, // Ventas hace 2 meses
            { wch: 15 }, // Asertividad (%)
          ]
        : []

      ws["!cols"] = [...baseColWidths, ...salesColWidths]

      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Comparación de Forecast")

      // Simular un pequeño retraso para mostrar el proceso
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Generar el archivo y descargarlo
      const fileName = `Comparación_Forecast_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Error al exportar:", error)
    } finally {
      setIsExporting(false)
    }
  }

  // Añadir la función para exportar a CSV después de la función handleExport
  const handleExportCSV = async () => {
    try {
      setIsExportingCSV(true)

      // Preparar los datos para CSV
      const exportData = filteredData.map((item) => {
        const semaphoreColor = getSemaphoreColor(item.changePercentage)
        const exportItem: Record<string, any> = {
          "NO PARTE EVCO": item.evcoPartNumber,
          "CUST ID": item.evcoNumber || "",
          "NO PARTE CLIENTE": item.clientPartNumber,
          Period: formatPeriod(item.period),
          "Forecast anterior": item.previousForecast,
          "Forecast actual": item.currentForecast,
          Diferencia:
            item.changePercentage > 0
              ? `+${item.currentForecast - item.previousForecast}`
              : item.currentForecast - item.previousForecast,
          "% Cambio": `${item.changePercentage > 0 ? "+" : ""}${item.changePercentage.toFixed(1)}%`,
          Variación: getSemaphoreText(semaphoreColor),
          Tipo: item.variationType === "pico" ? "Pico" : item.variationType === "moderada" ? "Moderada" : "Normal",
          "Producto nuevo": item.isNew ? "Sí" : "No",
        }

        // Añadir columnas de ventas si están habilitadas
        if (showSalesColumns) {
          exportItem["Ventas mes actual"] = item.currentMonthSales || 0
          exportItem["Ventas mes anterior"] = item.previousMonthSales || 0
          exportItem["Ventas hace 2 meses"] = item.twoMonthsAgoSales || 0
          exportItem["Asertividad (%)"] = item.assertivity ? `${item.assertivity.toFixed(1)}%` : "N/A"
        }

        return exportItem
      })

      // Convertir a CSV
      const csvContent = convertToCSV(exportData)

      // Descargar el archivo
      const fileName = `Comparación_Forecast_${new Date().toISOString().split("T")[0]}.csv`
      downloadFile(csvContent, fileName, "text/csv;charset=utf-8;")
    } catch (error) {
      console.error("Error al exportar a CSV:", error)
    } finally {
      setIsExportingCSV(false)
    }
  }

  // Contar productos nuevos
  const newProductsCount = data.filter((item) => item.isNew).length

  if (!data || data.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">No hay datos de comparación disponibles</div>
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de parte..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant={showNewOnly ? "default" : "outline"}
            size="sm"
            className="h-9"
            onClick={() => setShowNewOnly(!showNewOnly)}
          >
            <Plus className="mr-2 h-4 w-4" />
            {showNewOnly ? "Todos los productos" : `Nuevos (${newProductsCount})`}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filtrar por variación
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuCheckboxItem
                checked={selectedSemaphores.includes("green")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSemaphores([...selectedSemaphores, "green"])
                  } else {
                    setSelectedSemaphores(selectedSemaphores.filter((s) => s !== "green"))
                  }
                }}
              >
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                  Normal
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedSemaphores.includes("yellow")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSemaphores([...selectedSemaphores, "yellow"])
                  } else {
                    setSelectedSemaphores(selectedSemaphores.filter((s) => s !== "yellow"))
                  }
                }}
              >
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-amber-500 mr-2"></span>
                  Moderada
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedSemaphores.includes("red")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSemaphores([...selectedSemaphores, "red"])
                  } else {
                    setSelectedSemaphores(selectedSemaphores.filter((s) => s !== "red"))
                  }
                }}
              >
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                  Alta
                </div>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                disabled={isExporting || isExportingCSV || filteredData.length === 0}
              >
                {isExporting || isExportingCSV ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleExport} disabled={isExporting || isExportingCSV}>
                <FileDown className="mr-2 h-4 w-4" />
                Excel (.xlsx)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV} disabled={isExporting || isExportingCSV}>
                <FileDown className="mr-2 h-4 w-4" />
                CSV (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabla de comparación */}
      <div className="rounded-md border text-sm">
        <div className="relative">
          {/* Header fijo */}
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-gray-50">
                <th className="h-12 px-3 text-left align-middle font-medium text-muted-foreground w-[140px] text-sm">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("evcoPartNumber")}>
                    NO PARTE EVCO
                    {renderSortIndicator("evcoPartNumber")}
                  </div>
                </th>
                <th className="h-12 px-3 text-left align-middle font-medium text-muted-foreground w-[100px] text-sm">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("evcoNumber")}>
                    CUST ID
                    {renderSortIndicator("evcoNumber")}
                  </div>
                </th>
                <th className="h-12 px-3 text-left align-middle font-medium text-muted-foreground w-[140px] text-sm">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("clientPartNumber")}>
                    NO PARTE CLIENTE
                    {renderSortIndicator("clientPartNumber")}
                  </div>
                </th>
                <th className="h-12 px-3 text-left align-middle font-medium text-muted-foreground w-[120px] text-sm">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("period")}>
                    Period
                    {renderSortIndicator("period")}
                  </div>
                </th>
                <th className="h-12 px-3 text-right align-middle font-medium text-muted-foreground text-sm">
                  <div
                    className="flex items-center justify-end cursor-pointer"
                    onClick={() => handleSort("previousForecast")}
                  >
                    Forecast anterior
                    {renderSortIndicator("previousForecast")}
                  </div>
                </th>
                <th className="h-12 px-3 text-right align-middle font-medium text-muted-foreground text-sm">
                  <div
                    className="flex items-center justify-end cursor-pointer"
                    onClick={() => handleSort("currentForecast")}
                  >
                    Forecast actual
                    {renderSortIndicator("currentForecast")}
                  </div>
                </th>
                <th className="h-12 px-3 text-right align-middle font-medium text-muted-foreground text-sm">
                  <div
                    className="flex items-center justify-end cursor-pointer"
                    onClick={() => handleSort("changePercentage")}
                  >
                    % Cambio
                    {renderSortIndicator("changePercentage")}
                  </div>
                </th>
                <th className="h-12 px-3 text-center align-middle font-medium text-muted-foreground text-sm">
                  Variación
                </th>
                <th className="h-12 px-3 text-left align-middle font-medium text-muted-foreground text-sm">
                  <div className="flex items-center cursor-pointer" onClick={() => handleSort("variationType")}>
                    Tipo
                    {renderSortIndicator("variationType")}
                  </div>
                </th>
              </tr>
            </thead>
          </table>

          {/* Contenido con scroll */}
          <div className="overflow-auto max-h-[500px]">
            <Table className="min-w-full">
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      No se encontraron resultados.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => {
                    const semaphoreColor = getSemaphoreColor(item.changePercentage)
                    const isIncrease = item.changePercentage > 0
                    const isDecrease = item.changePercentage < 0

                    return (
                      <TableRow
                        key={item.id}
                        className={
                          semaphoreColor === "red"
                            ? "bg-red-50"
                            : semaphoreColor === "yellow"
                              ? "bg-amber-50"
                              : "bg-white"
                        }
                      >
                        <TableCell className="font-medium w-[140px] px-3 text-sm">
                          <div className="flex items-center gap-2">
                            {typeof item.evcoPartNumber === "string"
                              ? item.evcoPartNumber
                              : String(item.evcoPartNumber).replace(/,/g, "")}
                            {item.isNew && <Badge className="bg-blue-500 text-white hover:bg-blue-600">Nuevo</Badge>}
                          </div>
                        </TableCell>
                        <TableCell className="w-[100px] px-3 text-sm">{item.evcoNumber || "-"}</TableCell>
                        <TableCell className="w-[140px] px-3 text-sm">
                          {typeof item.clientPartNumber === "string"
                            ? item.clientPartNumber
                            : String(item.clientPartNumber).replace(/,/g, "")}
                        </TableCell>
                        <TableCell className="w-[120px] px-3 text-sm">{formatPeriod(item.period)}</TableCell>
                        <TableCell className="text-right px-3 text-sm">
                          {item.previousForecast.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right px-3 text-sm">
                          {item.currentForecast.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right px-3 text-sm">
                          <div className="flex items-center justify-end">
                            {isIncrease && (
                              <ArrowUp className={`mr-1 h-4 w-4 ${getSemaphoreTextColorClass(semaphoreColor)}`} />
                            )}
                            {isDecrease && (
                              <ArrowDown className={`mr-1 h-4 w-4 ${getSemaphoreTextColorClass(semaphoreColor)}`} />
                            )}
                            {!isIncrease && !isDecrease && <Check className="mr-1 h-4 w-4 text-gray-400" />}
                            <span className={`font-medium ${getSemaphoreTextColorClass(semaphoreColor)}`}>
                              {item.changePercentage > 0 ? "+" : ""}
                              {item.changePercentage.toFixed(1)}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-3 text-sm">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <div className="flex justify-center">
                                  <span
                                    className={`h-6 w-6 rounded-full ${
                                      semaphoreColor === "green"
                                        ? "bg-green-500"
                                        : semaphoreColor === "yellow"
                                          ? "bg-amber-500"
                                          : "bg-red-500"
                                    }`}
                                  ></span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Variación {getSemaphoreText(semaphoreColor)}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                        <TableCell className="px-3 text-sm">
                          <Badge
                            variant="outline"
                            className={
                              item.variationType === "pico"
                                ? "bg-red-100 text-red-800 border-red-200"
                                : item.variationType === "moderada"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : "bg-green-100 text-green-800 border-green-200"
                            }
                          >
                            {item.variationType === "pico"
                              ? "Pico"
                              : item.variationType === "moderada"
                                ? "Moderada"
                                : "Normal"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando {filteredData.length} de {data.length} registros
        {newProductsCount > 0 && (
          <span className="ml-2">
            ({newProductsCount} {newProductsCount === 1 ? "producto nuevo" : "productos nuevos"})
          </span>
        )}
      </div>
    </div>
  )
}
