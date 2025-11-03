"use client"

import { useRouter } from "next/navigation"
import { UploadForm } from "@/components/forecast/upload/upload-form"
import { useToast } from "@/components/ui/use-toast"
import { processExcelFile, detectFileFormat } from "@/lib/forecast-upload-utils"
import { setFlowState } from "@/lib/forecast-flow-store"

export default function ClientUploadPage() {
  const router = useRouter()
  const { toast } = useToast()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Cliente · Subir Forecast</h1>
      <UploadForm
        defaultSource="client"
        defaultNature="new"
        onSubmit={async ({ source, clientId, nature, file, modelParams }) => {
          if (!clientId) {
            toast({ title: "Cliente requerido", description: "Ingresa un ID de cliente.", variant: "destructive" })
            return
          }
          if (!file) {
            toast({ title: "Archivo requerido", description: "Sube un archivo .xlsx.", variant: "destructive" })
            return
          }

          try {
            const jsonData = await processExcelFile(file)
            const { format, period, year } = detectFileFormat(jsonData)

            setFlowState({
              source,
              clientId,
              nature,
              modelParams: null,
              fileName: file.name,
              fileSize: `${Math.round(file.size / 1024)} KB`,
              previewData: jsonData,
              detectedFormat: format,
              detectedDate: period,
              detectedYear: year,
              fileAnalysis: {
                rowCount: jsonData.length,
                format: format || "desconocido",
                mappedColumns: jsonData.length > 0 ? Object.keys(jsonData[0]) : [],
                missingColumns: [],
                period: period || undefined,
              },
            })

            toast({
              title: "Archivo procesado",
              description: `Se detectaron ${jsonData.length} filas en formato ${format || "desconocido"}.`,
            })
            router.push("/upload/client/validate")
          } catch (err) {
            console.error(err)
            toast({
              title: "Error al procesar",
              description: "Asegúrate de subir un .xlsx válido.",
              variant: "destructive",
            })
          }
        }}
      />
    </div>
  )
}
