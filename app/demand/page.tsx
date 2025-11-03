"use client"

import { DemandDashboard } from "@/components/demand/demand-dashboard"
import { LastAnalysisSummary } from "@/components/demand/last-analysis-summary"
import { RecentVariations } from "@/components/demand/recent-variations"
import { DemandIndicators } from "@/components/demand/demand-indicators"

export default function DemandPage() {
  return (
    <div className="space-y-6">
      {/* Resumen del último análisis */}
      <LastAnalysisSummary />

      {/* Indicadores clave */}
      <DemandIndicators />

      {/* Productos con variaciones recientes */}
      <RecentVariations />

      {/* Dashboard principal */}
      <DemandDashboard />
    </div>
  )
}
