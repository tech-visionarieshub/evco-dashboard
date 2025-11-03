import { ExportarOrdenCompra } from "@/components/ordenes-compra/exportar-orden-compra"

export default function ExportarOrdenCompraPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  return (
    <div className="container mx-auto py-6 px-6">
      <h1 className="text-2xl font-bold mb-6 pl-2">Exportar Orden de Compra</h1>
      <ExportarOrdenCompra ordenId={searchParams.id} />
    </div>
  )
}
