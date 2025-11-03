"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useFlowState } from "@/lib/forecast-flow-store"
import { ValidationScreen } from "@/components/forecast/upload/validation-screen"

export default function ClientValidatePage() {
  const router = useRouter()
  const { state } = useFlowState()

  useEffect(() => {
    if (!state.previewData || state.previewData.length === 0) {
      router.replace("/upload/client/upload")
    }
  }, [state.previewData, router])

  return (
    <div className="container mx-auto p-6">
      <ValidationScreen
        formData={{
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
        date={null}
        previewData={state.previewData}
        missingColumns={[]}
        isProcessing={false}
        setCurrentStep={() => {}}
        handleProcessForecast={() => router.push("/upload/client/comparison")}
        detectedFormat={state.detectedFormat}
        detectedDate={state.detectedDate}
        fileAnalysis={state.fileAnalysis || null}
      />
    </div>
  )
}
