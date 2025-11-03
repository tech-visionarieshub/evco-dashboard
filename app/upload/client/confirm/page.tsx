"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useFlowState } from "@/lib/forecast-flow-store"
import { ConfirmationScreen } from "@/components/forecast/upload/confirmation-screen-new"

export default function ClientConfirmPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { state, clear } = useFlowState()

  useEffect(() => {
    if (!state.previewData || state.previewData.length === 0) {
      router.replace("/upload/client/upload")
    }
  }, [state.previewData, router])

  return (
    <div className="container mx-auto p-6">
      <ConfirmationScreen
        formData={{
          intention: "client-forecast",
          client: state.clientId,
          forecastType: state.detectedFormat || "",
          forecastNature: state.nature,
          source: "client",
          internalModelName: "",
          internalModelVersion: "",
          internalComments: "",
          file: null,
          fileName: state.fileName || "",
          fileSize: state.fileSize || "",
          notes: "",
        }}
        previewData={state.previewData}
        detectedFormat={state.detectedFormat}
        detectedYear={state.detectedYear}
        detectedDate={state.detectedDate}
        onBack={() => router.push("/upload/client/comparison")}
        onFinish={() => {
          toast({ title: "Proceso completado", description: "El forecast ha sido guardado." })
          clear()
          router.push("/success")
        }}
      />
    </div>
  )
}
