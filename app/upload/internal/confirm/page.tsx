"use client"

import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { useFlowState } from "@/lib/forecast-flow-store"
import { ConfirmationScreen } from "@/components/forecast/upload/confirmation-screen-new"

export default function InternalConfirmPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { state, clear } = useFlowState()

  return (
    <div className="container mx-auto p-6">
      <ConfirmationScreen
        formData={{
          intention: "internal-forecast",
          client: state.clientId,
          forecastType: state.detectedFormat || "",
          forecastNature: state.nature,
          source: "internal",
          internalModelName: state.modelParams?.name || "",
          internalModelVersion: state.modelParams?.version || "",
          internalComments: state.modelParams?.comments || "",
          file: null,
          fileName: state.fileName || "",
          fileSize: state.fileSize || "",
          notes: "",
        }}
        previewData={state.previewData}
        detectedFormat={state.detectedFormat}
        detectedYear={state.detectedYear}
        detectedDate={state.detectedDate}
        onBack={() => router.push("/upload/internal/validate")}
        onFinish={() => {
          toast({ title: "Pronóstico interno guardado", description: "Se ha completado la carga." })
          clear()
          router.push("/success")
        }}
      />
    </div>
  )
}
