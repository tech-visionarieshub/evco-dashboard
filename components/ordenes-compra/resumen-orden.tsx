import { Card, CardContent } from "@/components/ui/card"
import type { OrdenCompra } from "@/lib/types/orden-compra"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface ResumenOrdenProps {
  orden: OrdenCompra
}

export function ResumenOrden({ orden }: ResumenOrdenProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h3 className="text-lg font-semibold mb-3">Resumen de la orden</h3>

        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-500">Cliente</p>
            <p className="font-medium">{orden.customerId}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Número de PO</p>
            <p className="font-medium">{orden.poNumber}</p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Fecha de orden</p>
            <p className="font-medium">
              {orden.fechaOrden ? format(new Date(orden.fechaOrden), "PPP", { locale: es }) : "No especificada"}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500">Canal de recepción</p>
            <p className="font-medium">{orden.canalRecepcion}</p>
          </div>

          {orden.shipTo && (
            <div>
              <p className="text-sm text-gray-500">Dirección de envío</p>
              <p className="font-medium">{orden.shipTo}</p>
            </div>
          )}

          {orden.tipoOrden && (
            <div>
              <p className="text-sm text-gray-500">Tipo de orden</p>
              <p className="font-medium">{orden.tipoOrden}</p>
            </div>
          )}

          {orden.observaciones && (
            <div>
              <p className="text-sm text-gray-500">Observaciones</p>
              <p className="text-sm">{orden.observaciones}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Añadir export nombrado para compatibilidad
export { ResumenOrden as default }
