"use client"
import { useRouter } from "next/navigation"
import { useFlowState } from "@/lib/forecast-flow-store"
import { ValidationScreen } from "@/components/forecast/upload/validation-screen"

export default function InternalValidatePage() {
  const router = useRouter()
  const { state } = useFlowState()

  // Internal flow allows proceeding even without file, but ValidationScreen still renders context.
  return (
    <div className="container mx-auto p-6">
      <ValidationScreen
        formData={{
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
        date={null}
        previewData={state.previewData}
        missingColumns={[]}
        isProcessing={false}
        setCurrentStep={() => {}}
        // Go directly to confirm (no comparison for internal)
        handleProcessForecast={() => router.push("/upload/internal/confirm")}
        detectedFormat={state.detectedFormat}
        detectedDate={state.detectedDate}
        fileAnalysis={state.fileAnalysis || null}
      />
    </div>
  )
}
