"use client"

import { DemandAnalysisScreen } from "@/components/forecast/upload/demand-analysis-screen"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

export default function DemandAnalysisPage() {
  const router = useRouter()
  const { toast } = useToast()
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Análisis de Demanda</h1>
      <DemandAnalysisScreen
        onBack={() => router.push("/upload")}
        onContinue={() => {
          toast({
            title: "Análisis generado",
            description: "La comparación Cliente vs Interno se ha calculado.",
          })
        }}
      />
    </div>
  )
}
