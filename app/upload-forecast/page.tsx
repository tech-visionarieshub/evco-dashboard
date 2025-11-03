import type { Metadata } from "next"
import ClientForecastFlow from "@/components/forecast/client-forecast-flow"

export const metadata: Metadata = {
  title: "Analizar Forecast del Cliente | EVCO Dashboard",
  description: "Carga y analiza archivos de forecast de clientes",
}

export default function UploadForecastPage() {
  return <ClientForecastFlow />
}
