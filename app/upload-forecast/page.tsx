import type { Metadata } from "next"
import ClientForecastFlow from "@/components/forecast/client-forecast-flow"

export const metadata: Metadata = {
  title: "Analizar Forecast del Cliente | EVCO Dashboard",
  description: "Carga y analiza archivos de forecast de clientes",
}

// Forzar renderizado dinámico para evitar errores de Firebase durante SSR
export const dynamic = 'force-dynamic'

export default function UploadForecastPage() {
  return <ClientForecastFlow />
}
