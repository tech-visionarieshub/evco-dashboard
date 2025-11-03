import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Órdenes de Compra | EVCO Forecast",
  description: "Gestión de órdenes de compra para EVCO Plastics México",
}

export default function OrdenesDeCompraLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className="bg-gray-50 min-h-screen">{children}</div>
}
