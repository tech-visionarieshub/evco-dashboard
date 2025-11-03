// Tipos para inventario
export interface InventoryRow {
  partNum: string
  onHandQty: number
  safetyStock?: number | null
  leadTimeDays?: number | null
  moq?: number | null
  plant?: string | null
  lastUpdated?: string | null // ISO
}

// Tipos para consumo normalizado
export interface ConsumptionRow {
  weekKey: string // 'YYYY-Www' semana ISO
  custId: string
  customerName: string
  partNum: string
  partDesc?: string
  qty: number // sum(SellingShipQty)
  unitPrice?: number | null
  totalValue?: number | null // sum(qty * unitPrice)
}

export interface NormalizedConsumptionData {
  // Campos principales
  invoiceDate: Date
  customerCode: string
  customerName?: string
  partNum: string
  qty: number
  unitPrice?: number
  totalAmount?: number

  // Campos adicionales del CSV
  invoiceNum?: string
  poNum?: string
  lineDesc?: string

  // Campos calculados
  weekNumber: number
  year: number
  month: number
}

// Tipos base para análisis de demanda
export interface InvoiceRow {
  partNum: string
  customerCode: string
  invoiceDate: string
  qty: number
  unitPrice?: number
  totalAmount?: number
}

export interface ConsumptionPoint {
  partNum: string
  customerCode: string
  customerName: string
  date: Date
  weekKey: string
  qty: number
  unitPrice: number
  totalAmount: number
  orderNum?: string
  poNum?: string
  monthKey: string
}

// Tipos para series de tiempo
export interface PartSeries {
  partNum: string
  series: Array<{
    weekKey: string
    qty: number
  }>
}

// Tipos para señales IA
export interface AiSignal {
  id: string
  partNum: string
  customerCode?: string
  weekKey: string
  type: "predictions" | "anomalies"
  predictedQty: number
  confidence?: number
  lower?: number
  upper?: number
  anomalyScore?: number
  seasonalityTag?: string
}

// Tipos para análisis estadístico
export interface WeeklyStat {
  partNum: string
  weekKey: string
  totalQty: number
  customerCount: number
  avgQtyPerCustomer: number
  maxQty: number
  minQty: number
  stdDev: number
  volatilityScore: number
}

// Tipo para respuesta completa del análisis
export interface DemandAnalysisResult {
  consumptionData: NormalizedConsumptionData[]
  weeklyStats: WeeklyStat[]
  inventoryAnalysis: InventoryAnalysis[]
  aiSignals: AiSignal[]
  volatilityRanking: VolatilityRanking[]
  customerInstability: CustomerInstability[]
}

// Tipos para análisis de inventario
export interface InventoryItem {
  partNum: string
  currentStock: number
  safetyStock: number
  leadTimeDays: number
  moq: number
}

export interface InventoryAnalysis {
  partNum: string
  currentStock: number
  safetyStock: number
  leadTimeDays: number
  avgWeeklyConsumption: number
  weeksOfStock: number
  riskLevel: "low" | "medium" | "high" | "critical"
  alerts: string[]
}

// Tipos para UI
export interface DemandAnalysisTab {
  id: string
  label: string
  icon: string
  count?: number
}

export interface MetricCard {
  title: string
  value: string | number
  change?: string
  trend?: "up" | "down" | "stable"
  color?: "default" | "success" | "warning" | "danger"
}

// Tipo para respuesta completa del análisis
export interface VolatilityRanking {
  partNum: string
  volatilityScore: number
  avgWeeklyQty: number
  maxWeeklyQty: number
  weekCount: number
  rank: number
}

export interface CustomerInstability {
  customerCode: string
  partCount: number
  totalQty: number
  avgQtyPerPart: number
  volatilityScore: number
  rank: number
}

export interface DemandForecast {
  id: string
  analysisId: string
  partNumber: string
  weekNumber: number
  year: number
  fechaSemana: Date
  demandaPredicha: number
  confianza: number
  limiteInferior: number
  limiteSuperior: number
  categoria: "normal" | "peak" | "low" | "anomaly"
  algoritmo: string
  createdAt: Date
}

export interface DemandAlert {
  id: string
  analysisId: string
  partNumber: string
  cliente?: string
  tipo: "volatilidad_alta" | "stock_critico" | "anomalia" | "sistema"
  titulo: string
  descripcion: string
  recomendacion?: string
  priority: "alta" | "media" | "baja"
  severity: "critical" | "warning" | "info"
  categoria: "demanda" | "inventario" | "sistema"
  valorActual?: number
  valorEsperado?: number
  desviacion?: number
  impacto?: "alto" | "medio" | "bajo"
  isActive: boolean
  createdAt: Date
}

export interface AIAnalysisResult {
  forecasts: DemandForecast[]
  alerts: DemandAlert[]
  totalSignals: number
  confidence: number
  processingTime: number
  modelVersion: string
}

export interface SeasonalityPattern {
  weekNumber: number
  factor: number
  confidence: number
  historicalAverage: number
}

export interface TrendAnalysis {
  direction: "up" | "down" | "stable"
  strength: number
  confidence: number
  projectedGrowth: number
}
