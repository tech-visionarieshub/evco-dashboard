"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { FileDown, BarChart2 } from "lucide-react"
import type { ForecastComparisonItem, MonthlyAssertivitySummary } from "@/components/forecast/types"
import * as XLSX from "xlsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import { convertToCSV, downloadFile } from "@/lib/utils"

type AssertivityReportProps = {
  data: ForecastComparisonItem[]
}

export function AssertivityReport({ data }: AssertivityReportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)

  // Filtrar solo los elementos que tienen datos de ventas
  const itemsWithSales = useMemo(() => {
    return data.filter((item) => item.currentMonthSales !== undefined)
  }, [data])

  // Agrupar por parte y cliente para el reporte detallado
  const detailedItems = useMemo(() => {
    const result: Record<string, any> = {}

    itemsWithSales.forEach((item) => {
      const key = `${item.evcoPartNumber}-${item.client}`
      if (!result[key]) {
        result[key] = {
          id: key,
          evcoPartNumber: item.evcoPartNumber,
          evcoNumber: item.evcoNumber,
          clientPartNumber: item.clientPartNumber,
          client: item.client || "Sin cliente",
          periods: [],
        }
      }

      result[key].periods.push({
        period: item.period,
        forecast: item.currentForecast,
        sales: item.currentMonthSales,
        assertivity: item.assertivity,
      })
    })

    return Object.values(result)
  }, [itemsWithSales])

  // Calcular resumen mensual de asertividad
  const monthlySummary = useMemo(() => {
    const months: Record<string, MonthlyAssertivitySummary> = {}

    itemsWithSales.forEach((item) => {
      if (!item.period) return

      if (!months[item.period]) {
        months[item.period] = {
          month: item.period,
          totalForecast: 0,
          totalSales: 0,
          assertivity: 0,
          itemCount: 0,
        }
      }

      months[item.period].totalForecast += item.currentForecast
      months[item.period].totalSales += item.currentMonthSales || 0
      months[item.period].itemCount++
    })

    // Calcular asertividad para cada mes
    Object.values(months).forEach((month) => {
      month.assertivity = month.totalForecast > 0 ? (month.totalSales / month.totalForecast) * 100 : 0
    })

    return Object.values(months).sort((a, b) => a.month.localeCompare(b.month))
  }, [itemsWithSales])

  // Calcular asertividad acumulada
  const cumulativeAssertivity = useMemo(() => {
    const totalForecast = monthlySummary.reduce((sum, month) => sum + month.totalForecast, 0)
    const totalSales = monthlySummary.reduce((sum, month) => sum + month.totalSales, 0)

    return totalForecast > 0 ? (totalSales / totalForecast) * 100 : 0
  }, [monthlySummary])

  // Función para obtener la clase de color según el valor de asertividad
  const getAssertivityColorClass = (assertivity: number) => {
    if (assertivity >= 90 && assertivity <= 110) return "text-green-600"
    if ((assertivity >= 80 && assertivity < 90) || (assertivity > 110 && assertivity <= 120)) return "text-amber-600"
    return "text-red-600"
  }

  // Función para exportar a Excel
  const handleExport = async () => {
    try {
      setIsExporting(true)

      // Preparar datos para la hoja de resumen mensual
      const monthlySummaryData = monthlySummary.map((month) => ({
        Periodo: month.month,
        "Total Forecast": month.totalForecast,
        "Total Ventas": month.totalSales,
        "Asertividad (%)": month.assertivity.toFixed(1) + "%",
        "Cantidad de Productos": month.itemCount,
      }))

      // Preparar datos para la hoja detallada
      const detailedData = detailedItems.flatMap((item) =>
        item.periods.map((period: any) => ({
          "Número de parte EVCO": item.evcoPartNumber,
          "EVCO #": item.evcoNumber || "",
          "Número de parte cliente": item.clientPartNumber,
          Cliente: item.client,
          Periodo: period.period,
          Forecast: period.forecast,
          Ventas: period.sales,
          "Asertividad (%)": period.assertivity ? period.assertivity.toFixed(1) + "%" : "N/A",
        })),
      )

      // Crear un libro de trabajo
      const wb = XLSX.utils.book_new()

      // Crear hojas de trabajo
      const wsSummary = XLSX.utils.json_to_sheet(monthlySummaryData)
      const wsDetailed = XLSX.utils.json_to_sheet(detailedData)

      // Establecer anchos de columna para resumen
      const summaryColWidths = [
        { wch: 15 }, // Periodo
        { wch: 15 }, // Total Forecast
        { wch: 15 }, // Total Ventas
        { wch: 15 }, // Asertividad (%)
        { wch: 20 }, // Cantidad de Productos
      ]
      wsSummary["!cols"] = summaryColWidths

      // Establecer anchos de columna para detalle
      const detailedColWidths = [
        { wch: 15 }, // Número de parte EVCO
        { wch: 10 }, // EVCO #
        { wch: 15 }, // Número de parte cliente
        { wch: 15 }, // Cliente
        { wch: 15 }, // Periodo
        { wch: 15 }, // Forecast
        { wch: 15 }, // Ventas
        { wch: 15 }, // Asertividad (%)
      ]
      wsDetailed["!cols"] = detailedColWidths

      // Añadir las hojas al libro
      XLSX.utils.book_append_sheet(wb, wsSummary, "Resumen Mensual")
      XLSX.utils.book_append_sheet(wb, wsDetailed, "Detalle por Producto")

      // Generar el archivo y descargarlo
      const fileName = `Reporte_Asertividad_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Error al exportar:", error)
    } finally {
      setIsExporting(false)
    }
  }

  // Función para exportar a CSV
  const handleExportCSV = async () => {
    try {
      setIsExportingCSV(true)

      // Preparar datos para el resumen mensual
      const monthlySummaryData = monthlySummary.map((month) => ({
        Periodo: month.month,
        "Total Forecast": month.totalForecast,
        "Total Ventas": month.totalSales,
        "Asertividad (%)": month.assertivity.toFixed(1) + "%",
        "Cantidad de Productos": month.itemCount,
      }))

      // Preparar datos para el detalle
      const detailedData = detailedItems.flatMap((item) =>
        item.periods.map((period: any) => ({
          "Número de parte EVCO": item.evcoPartNumber,
          "EVCO #": item.evcoNumber || "",
          "Número de parte cliente": item.clientPartNumber,
          Cliente: item.client,
          Periodo: period.period,
          Forecast: period.forecast,
          Ventas: period.sales,
          "Asertividad (%)": period.assertivity ? period.assertivity.toFixed(1) + "%" : "N/A",
        })),
      )

      // Convertir a CSV
      const summaryCsv = convertToCSV(monthlySummaryData)
      const detailedCsv = convertToCSV(detailedData)

      // Combinar ambos CSV con un separador
      const combinedCsv = "RESUMEN MENSUAL\n" + summaryCsv + "\n\nDETALLE POR PRODUCTO\n" + detailedCsv

      // Descargar el archivo
      const fileName = `Reporte_Asertividad_${new Date().toISOString().split("T")[0]}.csv`
      downloadFile(combinedCsv, fileName, "text/csv;charset=utf-8;")
    } catch (error) {
      console.error("Error al exportar a CSV:", error)
    } finally {
      setIsExportingCSV(false)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Reporte de Asertividad</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                disabled={isExporting || isExportingCSV || itemsWithSales.length === 0}
              >
                {isExporting || isExportingCSV ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Exportando...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Exportar reporte
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
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="summary" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              Resumen Mensual
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              Detalle por Producto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="summary">
            {/* Resumen de asertividad acumulada */}
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Asertividad Acumulada</h3>
                <Badge
                  className={`text-lg px-3 py-1 ${
                    cumulativeAssertivity >= 90 && cumulativeAssertivity <= 110
                      ? "bg-green-100 text-green-800 border-green-200"
                      : (cumulativeAssertivity >= 80 && cumulativeAssertivity < 90) ||
                          (cumulativeAssertivity > 110 && cumulativeAssertivity <= 120)
                        ? "bg-amber-100 text-amber-800 border-amber-200"
                        : "bg-red-100 text-red-800 border-red-200"
                  }`}
                >
                  {cumulativeAssertivity.toFixed(1)}%
                </Badge>
              </div>
            </div>

            {/* Tabla de resumen mensual */}
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">Total Forecast</TableHead>
                    <TableHead className="text-right">Total Ventas</TableHead>
                    <TableHead className="text-right">Asertividad</TableHead>
                    <TableHead className="text-right">Cantidad de Productos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlySummary.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    monthlySummary.map((month) => (
                      <TableRow key={month.month}>
                        <TableCell className="font-medium">{month.month}</TableCell>
                        <TableCell className="text-right">{month.totalForecast.toLocaleString()}</TableCell>
                        <TableCell className="text-right">{month.totalSales.toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <span className={getAssertivityColorClass(month.assertivity)}>
                            {month.assertivity.toFixed(1)}%
                          </span>
                        </TableCell>
                        <TableCell className="text-right">{month.itemCount}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="detailed">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Número de parte</TableHead>
                    <TableHead>EVCO #</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Periodo</TableHead>
                    <TableHead className="text-right">Forecast</TableHead>
                    <TableHead className="text-right">Ventas</TableHead>
                    <TableHead className="text-right">Asertividad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detailedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    detailedItems.flatMap((item: any) =>
                      item.periods.map((period: any, index: number) => (
                        <TableRow key={`${item.id}-${period.period}`}>
                          {index === 0 ? (
                            <>
                              <TableCell rowSpan={item.periods.length} className="font-medium align-top">
                                {item.evcoPartNumber}
                              </TableCell>
                              <TableCell rowSpan={item.periods.length} className="align-top">
                                {item.evcoNumber || "-"}
                              </TableCell>
                              <TableCell rowSpan={item.periods.length} className="align-top">
                                {item.client}
                              </TableCell>
                            </>
                          ) : null}
                          <TableCell>{period.period}</TableCell>
                          <TableCell className="text-right">{period.forecast.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{period.sales.toLocaleString()}</TableCell>
                          <TableCell className="text-right">
                            <span className={getAssertivityColorClass(period.assertivity)}>
                              {period.assertivity.toFixed(1)}%
                            </span>
                          </TableCell>
                        </TableRow>
                      )),
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
