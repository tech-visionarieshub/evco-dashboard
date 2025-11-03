import { Suspense } from "react"
import { HistorialOrdenes } from "@/components/ordenes-compra/historial-ordenes"

export const metadata = {
  title: "Historial de Órdenes de Compra | EVCO",
  description: "Historial de órdenes de compra procesadas",
}

export default function HistorialOrdenesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Historial de Órdenes de Compra</h1>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        }
      >
        <HistorialOrdenes />
      </Suspense>
    </div>
  )
}
