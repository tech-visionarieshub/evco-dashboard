"use client"

import { UploadOrdenCompra } from "@/components/ordenes-compra/upload-orden-compra"

export default function OrdenesDeCompraClientPage() {
  return (
    <div className="container mx-auto py-6 px-6">
      <h1 className="text-2xl font-bold mb-6 pl-2">Subir Orden de Compra</h1>
      <UploadOrdenCompra />
    </div>
  )
}
