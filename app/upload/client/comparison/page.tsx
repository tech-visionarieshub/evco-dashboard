"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { ComparisonScreen } from "@/components/forecast/upload/comparison-screen"
import { useFlowState } from "@/lib/forecast-flow-store"

export default function ClientComparisonPage() {
  const router = useRouter()
  const { state } = useFlowState()

  useEffect(() => {
    if (!state.previewData || state.previewData.length === 0) {
      router.replace("/upload/client/upload")
    }
  }, [state.previewData, router])

  return (
    <div className="container mx-auto p-6">
      <ComparisonScreen
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
        previewData={state.previewData}
        setCurrentStep={() => {}}
        isProcessing={false}
        comparisonEnabled={true}
        normalizedRows={[]}
        onBack={() => router.push("/upload/client/validate")}
        onNext={() => router.push("/upload/client/confirm")}
      />
    </div>
  )
}
