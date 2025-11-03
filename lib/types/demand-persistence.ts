export interface DemandAnalysis {
  id: string
  nombre: string
  descripcion?: string

  // Datos del análisis
  totalPartes: number
  totalRegistros: number
  fechaInicio: Date
  fechaFin: Date
  clientesIncluidos: string[]
  productosAnalizados: string[]

  // Resultados del análisis
  senalesIA: number
  alertasCriticas: number
  alertasAltas: number
  alertasMedias: number
  alertasBajas: number

  // Métricas calculadas
  volatilidad: {
    promedio: number
    maxima: number
    partesVolatiles: number
  }

  tendencia: {
    general: number // porcentaje
    direccion: "up" | "down" | "stable"
    confianza: number
  }

  inventario: {
    partesEnRiesgo: number
    stockCritico: number
    excesosDetectados: number
  }

  // Configuración del análisis
  parametros: {
    ventanaAnalisis: number // semanas
    umbralVolatilidad: number
    umbralRiesgo: number
    incluirIA: boolean
    modeloIA?: string
  }

  // Metadata del sistema
  status: "processing" | "completed" | "failed"
  tiempoProcesamiento?: number // segundos
  precision?: number // porcentaje
  version: string
  createdAt: Date
  updatedAt: Date
  createdBy?: string
}

export interface DemandForecast {
  id: string
  analysisId: string

  // Identificación del producto
  partNumber: string
  cliente?: string
  descripcion?: string

  // Pronóstico temporal
  weekNumber: number
  year: number
  fechaSemana: Date

  // Valores del pronóstico
  demandaPredicha: number
  demandaHistorica?: number
  confianza: number // 0-1

  // Bandas de predicción
  limiteInferior: number
  limiteSuperior: number

  // Clasificación
  categoria: "normal" | "peak" | "low" | "anomaly"
  estacionalidad?: {
    factor: number
    patron: string
  }

  // Metadata
  algoritmo: string
  createdAt: Date
}

export interface DemandAlert {
  id: string
  analysisId: string

  // Identificación
  partNumber: string
  cliente?: string
  tipo: "stock_critico" | "volatilidad_alta" | "anomalia" | "tendencia_negativa" | "exceso_inventario"

  // Contenido de la alerta
  titulo: string
  descripcion: string
  recomendacion?: string

  // Clasificación
  priority: "high" | "medium" | "low"
  severity: "critical" | "warning" | "info"
  categoria: "inventario" | "demanda" | "calidad" | "sistema"

  // Valores relacionados
  valorActual?: number
  valorEsperado?: number
  desviacion?: number
  impacto?: "alto" | "medio" | "bajo"

  // Estado
  isActive: boolean
  resolvedAt?: Date
  resolvedBy?: string

  // Metadata
  createdAt: Date
  updatedAt?: Date
}

export interface DemandAnalysisMetadata {
  id: string
  analysisId: string

  // Información del archivo fuente
  archivoOriginal: {
    nombre: string
    tamano: number
    tipo: string
    checksum?: string
  }

  // Estadísticas de procesamiento
  procesamiento: {
    inicioAt: Date
    finAt: Date
    duracion: number
    etapas: {
      carga: number
      normalizacion: number
      analisis: number
      ia?: number
    }
  }

  // Calidad de datos
  calidadDatos: {
    registrosOriginales: number
    registrosValidos: number
    registrosFiltrados: number
    porcentajeCalidad: number
    erroresDetectados: string[]
  }

  // Configuración utilizada
  configuracion: {
    version: string
    parametros: Record<string, any>
    modelosIA?: string[]
  }

  createdAt: Date
}

// Parámetros para operaciones
export interface SaveAnalysisParams {
  analysis: Omit<DemandAnalysis, "id" | "createdAt" | "updatedAt">
  forecasts?: Omit<DemandForecast, "id" | "analysisId" | "createdAt">[]
  alerts?: Omit<DemandAlert, "id" | "analysisId" | "createdAt" | "updatedAt">[]
  metadata?: Omit<DemandAnalysisMetadata, "id" | "analysisId" | "createdAt">
}

export interface GetAnalysisParams {
  limit?: number
  startDate?: Date
  endDate?: Date
  cliente?: string
  producto?: string
  status?: "processing" | "completed" | "failed"
  orderBy?: "createdAt" | "nombre" | "totalPartes"
  orderDirection?: "asc" | "desc"
}

// Tipos para estadísticas
export interface DemandModuleStats {
  totalAnalyses: number
  totalForecasts: number
  activeAlerts: number
  alertsByPriority: {
    high: number
    medium: number
    low: number
  }
  lastUpdated: Date
}

// Tipos para búsqueda y filtros
export interface DemandSearchFilters {
  texto?: string
  fechaDesde?: Date
  fechaHasta?: Date
  clientes?: string[]
  productos?: string[]
  tiposAlerta?: string[]
  prioridades?: ("high" | "medium" | "low")[]
  estados?: ("processing" | "completed" | "failed")[]
}

export interface DemandSearchResult {
  analyses: DemandAnalysis[]
  forecasts: DemandForecast[]
  alerts: DemandAlert[]
  totalResults: number
  hasMore: boolean
}
