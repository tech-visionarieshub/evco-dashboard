"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, FileText, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"

export function TemplateDownload() {
  const [isDownloading, setIsDownloading] = useState(false)
  const { toast } = useToast()

  const handleDownloadWeekly = async () => {
    setIsDownloading(true)

    try {
      // Importar dinámicamente la biblioteca xlsx
      const XLSX = await import("xlsx")

      // Crear un libro de Excel
      const wb = XLSX.utils.book_new()

      // Crear datos para la hoja de Forecast Semanal
      const weeklyHeaders = ["Cust ID", "No Parte EVCO", "No Parte Cliente", "MOQ", "STD Pack"]
      // Añadir encabezados para las 52 semanas
      for (let i = 1; i <= 52; i++) {
        weeklyHeaders.push(`WK_${i.toString().padStart(2, "0")}`)
      }

      const weeklyData = [
        weeklyHeaders,
        ["ABC123", "EVP-001", "CP-001", 100, 10, 500, 550, 600, 500, 550, 600 /* ... más valores */],
        ["ABC123", "EVP-002", "CP-002", 200, 20, 300, 350, 400, 300, 350, 400 /* ... más valores */],
        // Filas vacías para que el usuario las llene
        Array(weeklyHeaders.length).fill(""),
        Array(weeklyHeaders.length).fill(""),
        Array(weeklyHeaders.length).fill(""),
      ]

      // Convertir los datos a hojas de cálculo
      const wsWeekly = XLSX.utils.aoa_to_sheet(weeklyData)

      const weeklyColWidths = [
        { wch: 10 }, // Cust ID
        { wch: 15 }, // No Parte EVCO
        { wch: 15 }, // No Parte Cliente
        { wch: 8 }, // MOQ
        { wch: 8 }, // STD Pack
      ]
      // Añadir anchos para las columnas de semanas
      for (let i = 0; i < 52; i++) {
        weeklyColWidths.push({ wch: 10 })
      }
      wsWeekly["!cols"] = weeklyColWidths

      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, wsWeekly, "Forecast_Semanal")

      // Generar el archivo y descargarlo usando el método de navegador
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Convertir el array a Blob
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      // Crear URL para el blob
      const url = URL.createObjectURL(blob)

      // Crear un enlace temporal y hacer clic en él para descargar
      const a = document.createElement("a")
      a.href = url
      a.download = "EVCO_Forecast_Template_Semanal.xlsx"
      document.body.appendChild(a)
      a.click()

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      toast({
        title: "Descarga completada",
        description: "La plantilla semanal se ha descargado correctamente.",
      })
    } catch (error) {
      console.error("Error al generar la plantilla semanal:", error)
      toast({
        title: "Error al descargar",
        description: "No se pudo generar la plantilla semanal. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDownloadMonthly = async () => {
    setIsDownloading(true)

    try {
      // Importar dinámicamente la biblioteca xlsx
      const XLSX = await import("xlsx")

      // Crear un libro de Excel
      const wb = XLSX.utils.book_new()

      // Crear datos para la hoja de Forecast Mensual
      const monthlyHeaders = ["Cust ID", "No Parte EVCO", "No Parte Cliente", "MOQ", "STD Pack"]
      // Añadir encabezados para los 12 meses
      for (let i = 1; i <= 12; i++) {
        monthlyHeaders.push(`${i.toString().padStart(2, "0")}-2025`)
      }

      const monthlyData = [
        monthlyHeaders,
        [
          "ABC123",
          "EVP-001",
          "CP-001",
          100,
          10,
          2000,
          2200,
          2400,
          2000,
          2200,
          2400,
          2000,
          2200,
          2400,
          2000,
          2200,
          1800,
        ],
        [
          "ABC123",
          "EVP-002",
          "CP-002",
          200,
          20,
          1200,
          1400,
          1600,
          1200,
          1400,
          1600,
          1200,
          1400,
          1600,
          1200,
          1400,
          1000,
        ],
        // Filas vacías para que el usuario las llene
        Array(monthlyHeaders.length).fill(""),
        Array(monthlyHeaders.length).fill(""),
        Array(monthlyHeaders.length).fill(""),
      ]

      // Convertir los datos a hojas de cálculo
      const wsMonthly = XLSX.utils.aoa_to_sheet(monthlyData)

      const monthlyColWidths = [
        { wch: 10 }, // Cust ID
        { wch: 15 }, // No Parte EVCO
        { wch: 15 }, // No Parte Cliente
        { wch: 8 }, // MOQ
        { wch: 8 }, // STD Pack
      ]
      // Añadir anchos para las columnas de meses
      for (let i = 0; i < 12; i++) {
        monthlyColWidths.push({ wch: 10 })
      }
      wsMonthly["!cols"] = monthlyColWidths

      // Añadir la hoja al libro
      XLSX.utils.book_append_sheet(wb, wsMonthly, "Forecast_Mensual")

      // Generar el archivo y descargarlo usando el método de navegador
      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })

      // Convertir el array a Blob
      const blob = new Blob([wbout], { type: "application/octet-stream" })

      // Crear URL para el blob
      const url = URL.createObjectURL(blob)

      // Crear un enlace temporal y hacer clic en él para descargar
      const a = document.createElement("a")
      a.href = url
      a.download = "EVCO_Forecast_Template_Mensual.xlsx"
      document.body.appendChild(a)
      a.click()

      // Limpiar
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 0)

      toast({
        title: "Descarga completada",
        description: "La plantilla mensual se ha descargado correctamente.",
      })
    } catch (error) {
      console.error("Error al generar la plantilla mensual:", error)
      toast({
        title: "Error al descargar",
        description: "No se pudo generar la plantilla mensual. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 px-2">
          <FileText className="h-4 w-4 mr-1" />
          Descargar Plantilla
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Plantilla de Forecast</DialogTitle>
          <DialogDescription>
            Descarga la plantilla oficial para cargar tu forecast. La plantilla incluye los formatos semanal y mensual.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="weekly">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="weekly">Formato Semanal</TabsTrigger>
            <TabsTrigger value="monthly">Formato Mensual</TabsTrigger>
          </TabsList>

          <TabsContent value="weekly">
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">Cust ID</TableHead>
                      <TableHead className="min-w-[100px]">No Parte EVCO</TableHead>
                      <TableHead className="min-w-[100px]">No Parte Cliente</TableHead>
                      <TableHead className="min-w-[60px]">MOQ</TableHead>
                      <TableHead className="min-w-[60px]">STD Pack</TableHead>
                      <TableHead className="min-w-[70px]">WK_01</TableHead>
                      <TableHead className="min-w-[70px]">WK_02</TableHead>
                      <TableHead className="min-w-[70px]">WK_03</TableHead>
                      <TableHead className="min-w-[40px]">...</TableHead>
                      <TableHead className="min-w-[70px]">WK_52</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>ABC123</TableCell>
                      <TableCell>EVP-001</TableCell>
                      <TableCell>CP-001</TableCell>
                      <TableCell>100</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>500</TableCell>
                      <TableCell>550</TableCell>
                      <TableCell>600</TableCell>
                      <TableCell>...</TableCell>
                      <TableCell>450</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>ABC123</TableCell>
                      <TableCell>EVP-002</TableCell>
                      <TableCell>CP-002</TableCell>
                      <TableCell>200</TableCell>
                      <TableCell>20</TableCell>
                      <TableCell>300</TableCell>
                      <TableCell>350</TableCell>
                      <TableCell>400</TableCell>
                      <TableCell>...</TableCell>
                      <TableCell>250</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Formato semanal: Incluye columnas para cada semana del año (WK_01 hasta WK_52)
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={handleDownloadWeekly} disabled={isDownloading} className="w-full max-w-xs">
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar Plantilla Semanal
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="monthly">
            <div className="border rounded-md overflow-hidden">
              <div className="overflow-x-auto max-h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[80px]">Cust ID</TableHead>
                      <TableHead className="min-w-[100px]">No Parte EVCO</TableHead>
                      <TableHead className="min-w-[100px]">No Parte Cliente</TableHead>
                      <TableHead className="min-w-[60px]">MOQ</TableHead>
                      <TableHead className="min-w-[60px]">STD Pack</TableHead>
                      <TableHead className="min-w-[70px]">01-2025</TableHead>
                      <TableHead className="min-w-[70px]">02-2025</TableHead>
                      <TableHead className="min-w-[70px]">03-2025</TableHead>
                      <TableHead className="min-w-[40px]">...</TableHead>
                      <TableHead className="min-w-[70px]">12-2025</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>ABC123</TableCell>
                      <TableCell>EVP-001</TableCell>
                      <TableCell>CP-001</TableCell>
                      <TableCell>100</TableCell>
                      <TableCell>10</TableCell>
                      <TableCell>2000</TableCell>
                      <TableCell>2200</TableCell>
                      <TableCell>2400</TableCell>
                      <TableCell>...</TableCell>
                      <TableCell>1800</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>ABC123</TableCell>
                      <TableCell>EVP-002</TableCell>
                      <TableCell>CP-002</TableCell>
                      <TableCell>200</TableCell>
                      <TableCell>20</TableCell>
                      <TableCell>1200</TableCell>
                      <TableCell>1400</TableCell>
                      <TableCell>1600</TableCell>
                      <TableCell>...</TableCell>
                      <TableCell>1000</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Formato mensual: Incluye columnas para cada mes del año (01-2025 hasta 12-2025)
            </p>
            <div className="flex justify-center mt-4">
              <Button onClick={handleDownloadMonthly} disabled={isDownloading} className="w-full max-w-xs">
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Descargar Plantilla Mensual
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
