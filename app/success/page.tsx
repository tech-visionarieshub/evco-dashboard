"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  CheckCircle,
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  Upload,
  User,
  Database,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { format, addMonths, parse } from "date-fns"
import { es } from "date-fns/locale"

// Importar las funciones de utilidad
import { convertToCSV, downloadFile, limpiarTexto, getForecastTypeName } from "@/lib/utils"

export default function SuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isDownloading, setIsDownloading] = useState(false)
  const [periodDisplay, setPeriodDisplay] = useState("")
  const [isExportingForEpicor, setIsExportingForEpicor] = useState(false)

  // Añadir un estado para controlar la exportación a CSV
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false)

  // Recuperar parámetros de la URL o usar valores predeterminados
  const client = searchParams.get("client") || "Cliente no especificado"
  const forecastType = searchParams.get("forecastType") || "unknown"
  const fileName = searchParams.get("fileName") || "archivo.xlsx"
  const totalItems = Number.parseInt(searchParams.get("totalItems") || "0")
  const warningAlerts = Number.parseInt(searchParams.get("warningAlerts") || "0")
  const criticalAlerts = Number.parseInt(searchParams.get("criticalAlerts") || "0")
  const notes = searchParams.get("notes") || ""
  const rawData = searchParams.get("rawData") || ""

  // Recuperar los meses incluidos en el forecast
  const includedMonths = searchParams.get("includedMonths") || ""
  const startMonth = searchParams.get("startMonth") || ""
  const monthCount = Number.parseInt(searchParams.get("monthCount") || "1")
  const periodMonths = searchParams.get("periodMonths") || ""

  // Estado para almacenar los datos del forecast
  const [forecastData, setForecastData] = useState<any[]>([])

  // Efecto para procesar los datos del forecast si están disponibles
  useEffect(() => {
    if (rawData) {
      try {
        const parsedData = JSON.parse(decodeURIComponent(rawData))
        if (Array.isArray(parsedData) && parsedData.length > 0) {
          setForecastData(parsedData)
          console.log(`Datos cargados: ${parsedData.length} filas`)
        }
      } catch (e) {
        console.error("Error parsing forecast data:", e)
      }
    }
  }, [rawData])

  // Efecto para generar la visualización de los períodos
  useEffect(() => {
    if (periodMonths) {
      // Si tenemos una lista específica de meses incluidos en formato JSON
      try {
        const months = JSON.parse(periodMonths)
        if (Array.isArray(months) && months.length > 0) {
          setPeriodDisplay(months.join(", "))
          return
        }
      } catch (e) {
        console.error("Error parsing periodMonths:", e)
      }
    }

    if (includedMonths) {
      // Si tenemos una lista específica de meses incluidos como string
      setPeriodDisplay(includedMonths)
      return
    }

    if (startMonth && monthCount > 0) {
      // Si tenemos un mes de inicio y una cantidad de meses
      try {
        const startDate = parse(startMonth, "yyyy-MM", new Date())
        const periods = []

        for (let i = 0; i < monthCount; i++) {
          const currentMonth = addMonths(startDate, i)
          periods.push(format(currentMonth, "MMMM yyyy", { locale: es }))
        }

        setPeriodDisplay(periods.join(", "))
        return
      } catch (error) {
        console.error("Error parsing date:", error)
      }
    }

    // Por defecto, mostrar el mes actual
    setPeriodDisplay(format(new Date(), "MMMM yyyy", { locale: es }))
  }, [includedMonths, startMonth, monthCount, periodMonths])

  // Función para generar el archivo para Epicor
  const handleExportForEpicor = async () => {
    setIsExportingForEpicor(true)

    try {
      // Importar dinámicamente la biblioteca xlsx
      const XLSX = await import("xlsx")

      // Si no tenemos datos del forecast, intentar recuperarlos de la URL
      let dataToExport = forecastData
      if (dataToExport.length === 0 && rawData) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(rawData))
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            dataToExport = parsedData
            console.log(`Datos recuperados para exportación: ${parsedData.length} filas`)
          }
        } catch (e) {
          console.error("Error parsing forecast data for export:", e)
        }
      }

      // Si aún no tenemos datos, mostrar un error
      if (dataToExport.length === 0) {
        alert("No hay datos disponibles para exportar a Epicor.")
        setIsExportingForEpicor(false)
        return
      }

      // Obtener las columnas de períodos (meses o semanas)
      const firstRow = dataToExport[0]
      const allKeys = Object.keys(firstRow)

      // Determinar qué columnas son períodos según el tipo de forecast
      let periodColumns: string[] = []
      if (forecastType === "monthly") {
        // Para forecast mensual, buscar columnas con formato MM-YYYY
        const monthlyPattern = /^\d{2}-\d{4}$/
        periodColumns = allKeys.filter((key) => monthlyPattern.test(key))
      } else if (forecastType === "weekly") {
        // Para forecast semanal, buscar columnas con formato WK_XX
        const weeklyPattern = /^WK_\d+$/i
        periodColumns = allKeys.filter((key) => weeklyPattern.test(key))
      }

      console.log(`Columnas de períodos detectadas: ${periodColumns.length}`)
      console.log(`Total de filas a exportar: ${dataToExport.length}`)

      // Crear los datos para Epicor
      const epicorData = dataToExport.map((row) => {
        // Extraer correctamente los datos de las columnas
        const partNumberEVCO = limpiarTexto(row["Part Number"] || row["PartNum"] || row["Número de Parte"] || "")
        const partNumberCliente = limpiarTexto(
          row["Customer Part Number"] || row["No. Parte Cliente"] || row["Número de Parte Cliente"] || "",
        )
        const customerID = limpiarTexto(row["Customer ID"] || row["CustomerID"] || row["ID Cliente"] || client)

        // Datos base que siempre se incluyen
        const baseData: any = {
          "Cust ID": customerID,
          "No. Parte EVCO": partNumberEVCO,
          "No. Parte Cliente": partNumberCliente,
        }

        // Añadir las cantidades por período con los nombres de columna correctos
        periodColumns.forEach((period) => {
          const quantity = Number.parseInt(row[period] || "0", 10)

          // Formatear el nombre de la columna según el tipo de forecast
          let columnName = period
          if (forecastType === "monthly") {
            // Convertir de MM-YYYY a MMM-YY (ej: 04-2025 -> Apr-25)
            const [month, year] = period.split("-")
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
            const monthIndex = Number.parseInt(month) - 1
            const shortYear = year.slice(-2)
            columnName = `${monthNames[monthIndex]}-${shortYear}`
          } else if (forecastType === "weekly") {
            // Mantener el formato WK_XX o convertir según sea necesario
            columnName = period
          }

          baseData[columnName] = quantity
        })

        return baseData
      })

      // Crear una hoja de cálculo
      const ws = XLSX.utils.json_to_sheet(epicorData)

      // Crear un libro de Excel
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Epicor_Import")

      // Generar el archivo y descargarlo usando el método para navegador
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)

      // Crear un enlace temporal y hacer clic en él para descargar
      const a = document.createElement("a")
      a.href = url
      a.download = `Epicor_Forecast_${client}_${format(new Date(), "yyyyMMdd")}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)
    } catch (error) {
      console.error("Error al generar el archivo para Epicor:", error)
      alert("Ocurrió un error al generar el archivo para Epicor. Por favor, inténtelo de nuevo.")
    } finally {
      setIsExportingForEpicor(false)
    }
  }

  const handleDownload = async () => {
    setIsDownloading(true)

    try {
      // Importar dinámicamente la biblioteca xlsx
      const XLSX = await import("xlsx")

      // Crear un libro de Excel
      const wb = XLSX.utils.book_new()

      // Crear datos para el reporte
      const reportData = [
        ["Resumen de Forecast", ""],
        ["", ""],
        ["Cliente:", client],
        ["Tipo de Forecast:", getForecastTypeName(forecastType)],
        ["Periodo:", periodDisplay],
        ["Archivo:", fileName],
        ["Líneas procesadas:", totalItems],
        ["Advertencias:", warningAlerts],
        ["Críticas:", criticalAlerts],
        ["Fecha de procesamiento:", format(new Date(), "dd/MM/yyyy HH:mm:ss")],
      ]

      // Añadir notas si existen
      if (notes) {
        reportData.push(["", ""])
        reportData.push(["Notas:", notes])
      }

      reportData.push(["", ""])
      reportData.push(["Reporte generado por EVCO Forecast System", ""])

      // Convertir los datos a una hoja de cálculo
      const ws = XLSX.utils.aoa_to_sheet(reportData)

      // Ajustar el ancho de las columnas
      const colWidths = [{ wch: 25 }, { wch: 30 }]
      ws["!cols"] = colWidths

      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, ws, "Resumen")

      // Si tenemos datos del forecast, añadir una hoja con los datos
      let dataToExport = forecastData
      if (dataToExport.length === 0 && rawData) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(rawData))
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            dataToExport = parsedData
          }
        } catch (e) {
          console.error("Error parsing forecast data for download:", e)
        }
      }

      if (dataToExport.length > 0) {
        const dataWs = XLSX.utils.json_to_sheet(dataToExport)
        XLSX.utils.book_append_sheet(wb, dataWs, "Datos")
      }

      // Generar el archivo y descargarlo usando el método para navegador
      const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" })
      const blob = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      })
      const url = URL.createObjectURL(blob)

      // Crear un enlace temporal y hacer clic en él para descargar
      const a = document.createElement("a")
      a.href = url
      a.download = `Forecast_${client}_${format(new Date(), "yyyyMMdd")}.xlsx`
      document.body.appendChild(a)
      a.click()

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)
    } catch (error) {
      console.error("Error al generar el reporte:", error)
      // Mostrar un mensaje de error al usuario
      alert("Ocurrió un error al generar el reporte. Por favor, inténtelo de nuevo.")
    } finally {
      setIsDownloading(false)
    }
  }

  // Añadir la función para descargar en CSV después de la función handleDownload
  const handleDownloadCSV = async () => {
    setIsDownloadingCSV(true)

    try {
      // Crear datos para el reporte
      const reportData = [
        {
          "Resumen de Forecast": "Cliente:",
          "": client,
        },
        {
          "Resumen de Forecast": "Tipo de Forecast:",
          "": getForecastTypeName(forecastType),
        },
        {
          "Resumen de Forecast": "Periodo:",
          "": periodDisplay,
        },
        {
          "Resumen de Forecast": "Archivo:",
          "": fileName,
        },
        {
          "Resumen de Forecast": "Líneas procesadas:",
          "": totalItems.toString(),
        },
        {
          "Resumen de Forecast": "Advertencias:",
          "": warningAlerts.toString(),
        },
        {
          "Resumen de Forecast": "Críticas:",
          "": criticalAlerts.toString(),
        },
        {
          "Resumen de Forecast": "Fecha de procesamiento:",
          "": format(new Date(), "dd/MM/yyyy HH:mm:ss"),
        },
      ]

      // Añadir notas si existen
      if (notes) {
        reportData.push({
          "Resumen de Forecast": "",
          "": "",
        })
        reportData.push({
          "Resumen de Forecast": "Notas:",
          "": notes,
        })
      }

      reportData.push({
        "Resumen de Forecast": "",
        "": "",
      })
      reportData.push({
        "Resumen de Forecast": "Reporte generado por EVCO Forecast System",
        "": "",
      })

      // Convertir a CSV
      const csvContent = convertToCSV(reportData)

      // Descargar el archivo
      const fileName = `Forecast_${client}_${format(new Date(), "yyyyMMdd")}.csv`
      downloadFile(csvContent, fileName, "text/csv;charset=utf-8;")
    } catch (error) {
      console.error("Error al generar el reporte CSV:", error)
      // Mostrar un mensaje de error al usuario
      alert("Ocurrió un error al generar el reporte CSV. Por favor, inténtelo de nuevo.")
    } finally {
      setIsDownloadingCSV(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-gray-50">
        <div className="w-full max-w-3xl mx-auto">
          {/* Logo de EVCO */}
          <div className="flex justify-center mb-8">
            <Image src="/images/evco-logo-horizontal.png" alt="EVCO Logo" width={180} height={60} className="h-auto" />
          </div>

          {/* Mensaje de éxito */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Forecast procesado exitosamente</h1>
            <p className="text-gray-600">El archivo ha sido analizado y procesado correctamente.</p>
          </div>

          {/* Resumen de la operación */}
          <Card className="card-dashboard mb-8">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Resumen de la operación</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Cliente</p>
                      <p className="font-medium">{client}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Tipo de Forecast</p>
                      <p className="font-medium">{getForecastTypeName(forecastType)}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Periodo</p>
                      <p className="font-medium">{periodDisplay}</p>
                    </div>
                  </div>

                  {/* Mostrar semana si es forecast semanal */}
                  {forecastType === "weekly" && searchParams.get("week") && (
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Semana</p>
                        <p className="font-medium">Semana {searchParams.get("week")}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-muted-foreground">Archivo</p>
                      <p className="font-medium">{fileName}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 flex items-center justify-center text-primary mt-0.5">
                      <span className="text-xs font-bold">#</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Líneas procesadas</p>
                      <div className="flex items-center gap-3">
                        <p className="font-medium">{totalItems.toLocaleString()}</p>
                        {(warningAlerts > 0 || criticalAlerts > 0) && (
                          <div className="flex items-center gap-2">
                            {warningAlerts > 0 && (
                              <Badge variant="outline" className="bg-amber-100 text-amber-800">
                                {warningAlerts} advertencias
                              </Badge>
                            )}
                            {criticalAlerts > 0 && (
                              <Badge variant="outline" className="bg-red-100 text-red-800">
                                {criticalAlerts} críticas
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="h-5 w-5 flex items-center justify-center text-primary mt-0.5">
                      <span className="text-xs font-bold">@</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha y hora de carga</p>
                      <p className="font-medium">{format(new Date(), "dd/MM/yyyy HH:mm:ss")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Mostrar notas si existen */}
              {notes && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-muted-foreground">Notas adicionales:</h3>
                    <p className="text-sm whitespace-pre-wrap">{notes}</p>
                  </div>
                </>
              )}

              <Separator className="my-6" />

              <div className="flex flex-col items-center">
                <p className="text-center text-sm text-muted-foreground mb-2">
                  El forecast ha sido validado y está listo para su descarga.
                </p>

                {(warningAlerts > 0 || criticalAlerts > 0) && (
                  <p className="text-center text-sm text-amber-600 mb-4">
                    Se han detectado {warningAlerts + criticalAlerts} alertas que requieren atención.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Opciones de acción */}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Button size="lg" className="h-12" onClick={handleDownload} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generando Excel...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Descargar Excel
                  </>
                )}
              </Button>

              <Button
                size="lg"
                className="h-12"
                variant="outline"
                onClick={handleDownloadCSV}
                disabled={isDownloadingCSV}
              >
                {isDownloadingCSV ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generando CSV...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-5 w-5" />
                    Descargar CSV
                  </>
                )}
              </Button>
            </div>

            {/* Botón para exportar a Epicor */}
            <Button
              size="lg"
              className="h-12"
              variant="default"
              onClick={handleExportForEpicor}
              disabled={isExportingForEpicor}
            >
              {isExportingForEpicor ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Generando archivo para Epicor...
                </>
              ) : (
                <>
                  <Database className="mr-2 h-5 w-5" />
                  Exportar para Epicor
                </>
              )}
            </Button>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              {(warningAlerts > 0 || criticalAlerts > 0) && (
                <Button variant="outline" className="h-11" asChild>
                  <Link href={`/alerts?client=${client}&forecastType=${forecastType}`}>Ver Detalle de Alertas</Link>
                </Button>
              )}

              <Button variant="outline" className="h-11" asChild>
                <Link href="/upload">
                  <Upload className="mr-2 h-5 w-5" />
                  Cargar Otro Forecast
                </Link>
              </Button>

              <Button variant="ghost" className="h-11" asChild>
                <Link href="/">
                  <ArrowLeft className="mr-2 h-5 w-5" />
                  Volver al Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
