"use client"

import { useRouter } from "next/navigation"
import { UploadForm } from "@/components/forecast/upload/upload-form"
import { useToast } from "@/components/ui/use-toast"
import { processExcelFile, detectFileFormat } from "@/lib/forecast-upload-utils"
import { setFlowState } from "@/lib/forecast-flow-store"

export default function InternalUploadPage() {
  const router = useRouter()
  const { toast } = useToast()

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Interno · Cargar Pronóstico</h1>
      <UploadForm
        defaultSource="internal"
        defaultNature="new"
        onSubmit={async ({ source, clientId, nature, file, modelParams }) => {
          if (!clientId) {
            toast({ title: "Cliente requerido", description: "Ingresa un ID de cliente.", variant: "destructive" })
            return
          }
          // For internal, file is optional per your spec. If provided, process it.
          let previewData: any[] = []
          let format: "weekly" | "monthly" | null = null
          let period: string | null = null
          let year: number | null = null
          let fileName = ""
          let fileSize = ""

          if (file) {
            try {
              previewData = await processExcelFile(file)
              const det = detectFileFormat(previewData)
              format = det.format
              period = det.period
              year = det.year
              fileName = file.name
              fileSize = `${Math.round(file.size / 1024)} KB`
              toast({
                title: "Archivo procesado",
                description: `Se detectaron ${previewData.length} filas en formato ${format || "desconocido"}.`,
              })
            } catch (err) {
              console.error(err)
              toast({
                title: "Error al procesar",
                description: "Asegúrate de subir un .xlsx válido.",
                variant: "destructive",
              })
              return
            }
          }

          setFlowState({
            source,
            clientId,
            nature,
            modelParams: modelParams || null,
            fileName,
            fileSize,
            previewData,
            detectedFormat: format,
            detectedDate: period,
            detectedYear: year,
            fileAnalysis: previewData.length
              ? {
                  rowCount: previewData.length,
                  format: format || "desconocido",
                  mappedColumns: Object.keys(previewData[0] || {}),
                  missingColumns: [],
                  period: period || undefined,
                }
              : null,
          })

          router.push("/upload/internal/validate")
        }}
      />
    </div>
  )
}
