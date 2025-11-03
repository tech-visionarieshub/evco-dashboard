export interface OrdenCompraFormData {
  customerId: string
  poNumber: string
  fechaOrden: string
  fechaRequerida: string
  fechaRequerimiento?: string // Campo existente
  canalRecepcion: string
  shipTo?: string
  billTo?: string
  tipoOrden?: string
  observaciones?: string
  direccionCliente?: string
}

export interface LineaOrden {
  numeroLinea: number // Nuevo campo
  skuCliente: string
  skuEvco: string
  descripcion: string
  cantidad: number
  precio: number
  unidad: string
  shipTo?: string // Nuevo campo
}

export interface OrdenCompra {
  id: string
  numeroOrden: string
  direccionEnvio: string
  fechaOrden: string
  fechaRequerimiento?: string // Nuevo campo
  tipoOrden: string
  moneda: string
  cliente: string
  lineas: LineaOrden[]
  archivoOriginal: string
}
