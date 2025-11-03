// Tipos base para Firebase
export interface Cliente {
  id: string
  cust_id: string
  name: string
  created_at: string
  updated_at: string
}

export interface ClienteInsert {
  cust_id: string
  name: string
}

export interface ClienteUpdate {
  cust_id?: string
  name?: string
}

// Tipos para órdenes de compra
export interface OrdenCompra {
  id?: string
  poNumber: string
  customerId: string
  fechaOrden: string
  fechaRequerimiento?: string
  shipTo: string
  tipoOrden: string
  moneda: string
  estado: string
  canalRecepcion: string
  archivoOriginal?: string
  contenidoOriginal?: string
  progresoPaso: number
  progresoTemporal?: any
  datosExtraidos?: any
  confianza?: number
  advertencias?: string[]
  createdAt: string
  updatedAt: string
}

export interface LineaOrden {
  id: string
  ordenId: string
  numeroLinea: number
  skuCliente: string
  skuEvco: string
  descripcion: string
  cantidad: number
  precio: number
  unidad: string
  shipTo?: string
  createdAt: string
  updatedAt: string
}

export interface HistorialProcesamiento {
  id: string
  orden_id: string
  evento: string
  descripcion: string
  metadatos?: any
  fecha_evento: string
}

// Tipos para forecast
export interface ForecastData {
  id?: string
  cliente_id: string
  periodo: string
  sku: string
  demanda: number
  created_at: string
  updated_at: string
}

// Tipos para dashboard
export interface DashboardMetric {
  id: string
  metric_name: string
  metric_value: number
  metric_type: string
  period: string
  created_at: string
  updated_at: string
}
