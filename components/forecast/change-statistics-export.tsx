"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { convertToCSV, downloadFile } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu"
import * as XLSX from "xlsx"

type StatisticItem = {
  name: string
  totalItems: number
  averageChange: number
  totalIncrease: number
  totalDecrease: number
  newItems: number
}

type ChangeStatisticsExportProps = {
  clientStats: StatisticItem[]
  productStats: StatisticItem[]
}

export function ChangeStatisticsExport({ clientStats, productStats }: ChangeStatisticsExportProps) {
  const [isExporting, setIsExporting] = useState(false)
  const [isExportingCSV, setIsExportingCSV] = useState(false)

  const handleExportExcel = async () => {
    try {
      setIsExporting(true)

      // Crear un libro de Excel
      const wb = XLSX.utils.book_new()

      // Preparar datos para la hoja de clientes
      const clientData = clientStats.map((stat) => ({
        Cliente: stat.name,
        Productos: stat.totalItems,
        "% Cambio Promedio": `${stat.averageChange > 0 ? "+" : ""}${stat.averageChange.toFixed(1)}%`,
        Aumentos: stat.totalIncrease,
        Disminuciones: stat.totalDecrease,
        "Productos Nuevos": stat.newItems,
      }))

      // Preparar datos para la hoja de productos
      const productData = productStats.map((stat) => ({
        "Número de Parte": stat.name,
        Periodos: stat.totalItems,
        "% Cambio Promedio": `${stat.averageChange > 0 ? "+" : ""}${stat.averageChange.toFixed(1)}%`,
        Aumentos: stat.totalIncrease,
        Disminuciones: stat.totalDecrease,
        "Es Nuevo": stat.newItems > 0 ? "Sí" : "No",
      }))

      // Crear hojas de trabajo
      const wsClients = XLSX.utils.json_to_sheet(clientData)
      const wsProducts = XLSX.utils.json_to_sheet(productData)

      // Establecer anchos de columna
      const clientColWidths = [
        { wch: 20 }, // Cliente
        { wch: 10 }, // Productos
        { wch: 15 }, // % Cambio Promedio
        { wch: 10 }, // Aumentos
        { wch: 15 }, // Disminuciones
        { wch: 15 }, // Productos Nuevos
      ]
      wsClients["!cols"] = clientColWidths

      const productColWidths = [
        { wch: 20 }, // Número de Parte
        { wch: 10 }, // Periodos
        { wch: 15 }, // % Cambio Promedio
        { wch: 10 }, // Aumentos
        { wch: 15 }, // Disminuciones
        { wch: 10 }, // Es Nuevo
      ]
      wsProducts["!cols"] = productColWidths

      // Añadir las hojas al libro
      XLSX.utils.book_append_sheet(wb, wsClients, "Estadísticas por Cliente")
      XLSX.utils.book_append_sheet(wb, wsProducts, "Estadísticas por Producto")

      // Generar el archivo y descargarlo
      const fileName = `Estadísticas_Cambios_${new Date().toISOString().split("T")[0]}.xlsx`
      XLSX.writeFile(wb, fileName)
    } catch (error) {
      console.error("Error al exportar estadísticas:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportCSV = async () => {
    try {
      setIsExportingCSV(true)

      // Preparar datos para clientes
      const clientData = clientStats.map((stat) => ({
        Cliente: stat.name,
        Productos: stat.totalItems,
        "% Cambio Promedio": `${stat.averageChange > 0 ? "+" : ""}${stat.averageChange.toFixed(1)}%`,
        Aumentos: stat.totalIncrease,
        Disminuciones: stat.totalDecrease,
        "Productos Nuevos": stat.newItems,
      }))

      // Preparar datos para productos
      const productData = productStats.map((stat) => ({
        "Número de Parte": stat.name,
        Periodos: stat.totalItems,
        "% Cambio Promedio": `${stat.averageChange > 0 ? "+" : ""}${stat.averageChange.toFixed(1)}%`,
        Aumentos: stat.totalIncrease,
        Disminuciones: stat.totalDecrease,
        "Es Nuevo": stat.newItems > 0 ? "Sí" : "No",
      }))

      // Convertir a CSV
      const clientCSV = convertToCSV(clientData)
      const productCSV = convertToCSV(productData)

      // Combinar ambos CSV con un separador
      const combinedCSV = "ESTADÍSTICAS POR CLIENTE\n" + clientCSV + "\n\nESTADÍSTICAS POR PRODUCTO\n" + productCSV

      // Descargar el archivo
      const fileName = `Estadísticas_Cambios_${new Date().toISOString().split("T")[0]}.csv`
      downloadFile(combinedCSV, fileName, "text/csv;charset=utf-8;")
    } catch (error) {
      console.error("Error al exportar estadísticas a CSV:", error)
    } finally {
      setIsExportingCSV(false)
    }
  }

  return (
    <div className="flex justify-end mb-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isExporting || isExportingCSV || (clientStats.length === 0 && productStats.length === 0)}
          >
            {isExporting || isExportingCSV ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exportando...
              </>
            ) : (
              <>
                <FileDown className="mr-2 h-4 w-4" />
                Exportar estadísticas
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Formato de exportación</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleExportExcel} disabled={isExporting || isExportingCSV}>
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
  )
}
