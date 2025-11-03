import { Suspense } from "react"
import { EditarOrdenCompra } from "@/components/ordenes-compra/editar-orden-compra"

export const metadata = {
  title: "Editar Orden de Compra | EVCO",
  description: "Editar orden de compra existente",
}

export default function EditarOrdenPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Editar Orden de Compra</h1>
      <Suspense
        fallback={
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
          </div>
        }
      >
        <EditarOrdenCompra ordenId={params.id} />
      </Suspense>
    </div>
  )
}
