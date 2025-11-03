import { ValidarOrdenCompra } from "@/components/ordenes-compra/validar-orden-compra"

// Añadir márgenes consistentes en la página de validación
export default function ValidarOrdenCompraPage({
  searchParams,
}: {
  searchParams: { id?: string }
}) {
  return (
    <div className="container mx-auto py-6 px-6">
      <h1 className="text-2xl font-bold mb-6 pl-2">Validar Orden de Compra</h1>
      <ValidarOrdenCompra ordenId={searchParams.id} />
    </div>
  )
}
