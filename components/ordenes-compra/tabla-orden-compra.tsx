"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Eye } from "lucide-react"

interface LineaOrden {
  skuCliente: string
  skuEvco: string
  descripcion: string
  cantidad: number
  precio: number
  unidad: string
}

interface OrdenCompra {
  id: string
  numeroOrden: string
  direccionEnvio: string
  fechaOrden: string
  tipoOrden: string
  moneda: string
  cliente: string
  lineas: LineaOrden[]
  archivoOriginal: string
  estado?: "pendiente" | "validada" | "procesada"
}

interface TablaOrdenCompraProps {
  ordenes: OrdenCompra[]
  onEdit?: (orden: OrdenCompra) => void
  onDelete?: (ordenId: string) => void
  onView?: (orden: OrdenCompra) => void
  showActions?: boolean
}

export function TablaOrdenCompra({ ordenes, onEdit, onDelete, onView, showActions = true }: TablaOrdenCompraProps) {
  const getEstadoBadge = (estado?: string) => {
    switch (estado) {
      case "validada":
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Validada
          </Badge>
        )
      case "procesada":
        return (
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            Procesada
          </Badge>
        )
      default:
        return <Badge variant="outline">Pendiente</Badge>
    }
  }

  const getTotalLineas = (orden: OrdenCompra) => {
    return orden.lineas.length
  }

  const getTotalValor = (orden: OrdenCompra) => {
    return orden.lineas.reduce((total, linea) => total + linea.cantidad * linea.precio, 0)
  }

  if (ordenes.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">No hay órdenes de compra para mostrar</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-sm">Cliente</TableHead>
            <TableHead className="text-sm">PO Number</TableHead>
            <TableHead className="text-sm">Fecha</TableHead>
            <TableHead className="text-sm">Moneda</TableHead>
            <TableHead className="text-sm">Líneas</TableHead>
            <TableHead className="text-sm">Valor Total</TableHead>
            <TableHead className="text-sm">Estado</TableHead>
            <TableHead className="text-sm">Archivo</TableHead>
            {showActions && <TableHead className="text-sm">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {ordenes.map((orden) => (
            <TableRow key={orden.id}>
              <TableCell className="text-sm font-medium">{orden.cliente}</TableCell>
              <TableCell className="text-sm">{orden.numeroOrden}</TableCell>
              <TableCell className="text-sm">{orden.fechaOrden}</TableCell>
              <TableCell className="text-sm">{orden.moneda}</TableCell>
              <TableCell className="text-sm">{getTotalLineas(orden)}</TableCell>
              <TableCell className="text-sm">
                {orden.moneda} {getTotalValor(orden).toFixed(2)}
              </TableCell>
              <TableCell>{getEstadoBadge(orden.estado)}</TableCell>
              <TableCell className="text-sm text-gray-500">{orden.archivoOriginal}</TableCell>
              {showActions && (
                <TableCell>
                  <div className="flex items-center gap-2">
                    {onView && (
                      <Button variant="ghost" size="sm" onClick={() => onView(orden)} className="h-8 w-8 p-0">
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {onEdit && (
                      <Button variant="ghost" size="sm" onClick={() => onEdit(orden)} className="h-8 w-8 p-0">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(orden.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// Named export for compatibility
export { TablaOrdenCompra as default }
