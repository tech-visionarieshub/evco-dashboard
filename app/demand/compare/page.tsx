"use client"

import { Suspense } from "react"
import ForecastFlow from "@/components/forecast/ForecastFlow"

function DemandComparePageContent() {
  return <ForecastFlow mode="compare" />
}

export default function DemandComparePage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <DemandComparePageContent />
    </Suspense>
  )
}
