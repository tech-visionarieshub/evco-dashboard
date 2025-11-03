"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

interface PdfEjemploGeneradorProps {
  orden: any // Replace 'any' with the actual type of 'orden'
}

export function PDFEjemploGenerador({ orden }: PdfEjemploGeneradorProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const { toast } = useToast()

  const handleGenerarPDF = async () => {
    setIsGenerating(true)

    try {
      // Importar jspdf dinámicamente para evitar problems con SSR
      const jsPDF = (await import("jspdf")).default
      const doc = new jsPDF()

      // Configurar fuentes
      doc.setFont("helvetica", "bold")
      doc.setFontSize(16)

      // Encabezado
      doc.text("PURCHASE ORDER", 105, 20, { align: "center" })
      doc.setFontSize(12)
      doc.text("NUMBER: 228976", 105, 30, { align: "center" })
      doc.text("REVISION: 11", 105, 35, { align: "center" })
      doc.text("PAGE: 1 of 1", 105, 40, { align: "center" })

      // Información del proveedor
      doc.setFont("helvetica", "bold")
      doc.text("VENDOR:", 20, 55)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("EVCO PLASTICS DE MEXICO S DE RL DE CV", 20, 62)
      doc.text("AVE PABLO LIVAS NO 4211", 20, 67)
      doc.text("COL GUADALUPE VICTORIA", 20, 72)
      doc.text("GUADALUPE, NL 67180", 20, 77)
      doc.text("Mexico", 20, 82)

      // Información de envío
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("SHIP TO:", 120, 55)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("Manitowoc FSG Manufactura S. de R.L.", 120, 62)
      doc.text("FFCC a Tampico # 1601", 120, 67)
      doc.text("Parque Industrial Finsa Gpe", 120, 72)
      doc.text("Guadalupe, Nuevo Leon, 67132", 120, 77)
      doc.text("Mexico", 120, 82)

      // Información de facturación
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text("BILL TO:", 20, 95)
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)
      doc.text("Manitowoc Foodservice (Switzerland) G", 20, 102)
      doc.text("Accounts Payable", 20, 107)
      doc.text("iceap@pentair.com", 20, 112)

      // Información de la orden
      doc.setFont("helvetica", "bold")
      doc.setFontSize(10)
      doc.text("DATE OF ORDER/BUYER:", 20, 125)
      doc.text("REVISED DATE/BUYER:", 120, 125)
      doc.setFont("helvetica", "normal")
      doc.text("20-MAR-25 Presuel, Luis", 20, 130)
      doc.text("20-MAR-25 L Presuel", 120, 130)

      doc.setFont("helvetica", "bold")
      doc.text("PAYMENT TERMS:", 20, 140)
      doc.text("SHIP VIA:", 120, 140)
      doc.setFont("helvetica", "normal")
      doc.text("DUE IN 60 DAYS", 20, 145)
      doc.text("LMB_PO", 120, 145)

      doc.setFont("helvetica", "bold")
      doc.text("CONTACT NAME:", 20, 155)
      doc.text("CONTACT PHONE:", 120, 155)
      doc.setFont("helvetica", "normal")
      doc.text("Presuel, Luis Angel", 20, 160)
      doc.text("(419) 861-0808", 120, 160)

      doc.setFont("helvetica", "bold")
      doc.text("EMAIL:", 20, 170)
      doc.text("CURRENCY:", 120, 170)
      doc.setFont("helvetica", "normal")
      doc.text("luis.presuel@pentair.com", 20, 175)
      doc.text("USD", 120, 175)

      // Línea separadora
      doc.setLineWidth(0.5)
      doc.line(20, 185, 190, 185)

      // Encabezados de tabla
      doc.setFont("helvetica", "bold")
      doc.text("LINE", 20, 195)
      doc.text("PART NUMBER/DESCRIPTION", 40, 195)
      doc.text("DELIVERY DATE", 120, 195)
      doc.text("UNIT PRICE", 150, 195)
      doc.text("QUANTITY", 170, 195)
      doc.text("EXTENDED", 190, 195, { align: "right" })

      // Línea separadora
      doc.line(20, 200, 190, 200)

      // Datos de líneas
      doc.setFont("helvetica", "normal")
      // Línea 1
      doc.text("6", 20, 210)
      doc.text("3006963", 40, 210)
      doc.text("DISTRIBUTION TUBE ASSY 30 IN", 40, 215)
      doc.text("Your #: 953102", 40, 220)
      doc.text("30-APR-25", 120, 210)
      doc.text("5.2400", 150, 210)
      doc.text("4,050", 170, 210)
      doc.text("21,222.00", 190, 210, { align: "right" })

      // Línea 2
      doc.text("7", 20, 235)
      doc.text("3006973", 40, 235)
      doc.text("DISTRIBUTION TUBE ASSY 22 IN", 40, 240)
      doc.text("Your #: 953101", 40, 245)
      doc.text("25-APR-25", 120, 235)
      doc.text("4.3000", 150, 235)
      doc.text("2,025", 170, 235)
      doc.text("8,707.50", 190, 235, { align: "right" })

      // Línea separadora
      doc.line(20, 255, 190, 255)

      // Totales
      doc.setFont("helvetica", "bold")
      doc.text("TOTAL:", 150, 265)
      doc.text("29,929.50", 190, 265, { align: "right" })

      // Pie de página
      doc.setFont("helvetica", "normal")
      doc.setFontSize(8)
      doc.text(
        "This Purchase Order Number, release number, Manitowoc Ice item number and line number must appear on all order acknowledgements, packing lists, cartons, and correspondence.",
        105,
        280,
        { align: "center", maxWidth: 170 },
      )

      // Guardar el PDF
      doc.save("Orden_Compra_Manitowoc_228976.pdf")

      toast({
        title: "PDF generado correctamente",
        description: "Se ha descargado el PDF de ejemplo para la simulación",
      })
    } catch (error) {
      console.error("Error al generar PDF:", error)
      toast({
        title: "Error al generar PDF",
        description: "Ocurrió un problema al crear el archivo PDF",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Button onClick={handleGenerarPDF} disabled={isGenerating} variant="outline" className="gap-2">
      {isGenerating ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generando PDF...
        </>
      ) : (
        <>
          <FileDown className="h-4 w-4" />
          Descargar PDF de ejemplo
        </>
      )}
    </Button>
  )
}
