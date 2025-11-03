"use client"

import { ForecastHistoryActivity } from "@/components/forecast/forecast-history-activity"

export default function UploadHistoryPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Historial de Actividad</h1>
      <ForecastHistoryActivity />
    </div>
  )
}
