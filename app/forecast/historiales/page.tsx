import { ForecastHistoryViewer } from "@/components/forecast/forecast-history-viewer"

export default function ForecastHistoryPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Datos Históricos de Forecast</h1>
      <p className="text-muted-foreground mb-6">
        Esta página muestra los datos históricos de forecast para todos los clientes. Normalmente, accederás a estos
        datos desde las pantallas de validación y comparación.
      </p>
      <ForecastHistoryViewer clientFilter={null} />
    </div>
  )
}
