import type { NormalizedConsumptionRecord, PartSeries } from "./normalizeConsumption"
import type { DemandAnalysisResult } from "./analyzeDemand"

export interface DemandForecast {
  id: string
  partNum: string
  customerCode: string
  week: string
  forecastQty: number
  confidence: number
  upperBand: number
  lowerBand: number
  method: string
  createdAt: Date
}

export interface DemandAlert {
  id: string
  type: "volatility" | "inventory" | "customer" | "trend"
  priority: "alta" | "media" | "baja"
  titulo: string
  descripcion: string
  partNum?: string
  customerCode?: string
  valor: number
  umbral: number
  recomendacion: string
  createdAt: Date
}

export interface AISignal {
  id: string
  tipo: "anomalia" | "tendencia" | "estacionalidad" | "riesgo"
  parte: string
  cliente: string
  descripcion: string
  severidad: "alta" | "media" | "baja"
  confianza: number
  recomendacion: string
  fecha: Date
  datos: any
}

export interface AIAnalysisResult {
  forecasts: DemandForecast[]
  alerts: DemandAlert[]
  signals: AISignal[]
  summary: {
    totalSignals: number
    highSeverity: number
    mediumSeverity: number
    lowSeverity: number
    confidence: number
  }
  recommendations: string[]
  insights: string[]
}

export interface SignalFilter {
  tipo?: "anomalia" | "tendencia" | "estacionalidad" | "riesgo" | "todos"
  severidad?: "alta" | "media" | "baja" | "todas"
  parte?: string
  cliente?: string
}

export async function runDemandAI(partSeries: PartSeries[]): Promise<AISignal[]> {
  console.log("Iniciando análisis con IA para", partSeries.length, "series de partes...")

  const signals: AISignal[] = []

  // Generate predictions for top parts
  const topParts = partSeries.slice(0, 20) // Focus on top 20 parts by volume

  for (const series of topParts) {
    // Generate predictions for next 8 weeks
    const predictions = generatePredictions(series)
    signals.push(...predictions)

    // Detect anomalies in recent data
    const anomalies = detectAnomalies(series)
    signals.push(...anomalies)
  }

  console.log(`IA completada: ${signals.length} señales generadas`)
  return signals
}

export async function runDemandAIFull(
  normalizedData: NormalizedConsumptionRecord[],
  analysisResults: DemandAnalysisResult,
): Promise<AIAnalysisResult> {
  console.log("Iniciando análisis completo con IA...")

  // Generate forecasts for top volatile parts
  const forecasts = generateForecasts(normalizedData, analysisResults)

  // Generate alerts based on analysis
  const alerts = generateAlerts(analysisResults)

  // Generate recommendations
  const recommendations = generateRecommendations(analysisResults, alerts)

  // Generate insights
  const insights = generateInsights(normalizedData, analysisResults)

  const result: AIAnalysisResult = {
    forecasts,
    alerts,
    signals: [],
    summary: {
      totalSignals: forecasts.length + alerts.length,
      highSeverity: 0,
      mediumSeverity: 0,
      lowSeverity: 0,
      confidence: calculateOverallConfidence(forecasts, alerts),
    },
    recommendations,
    insights,
  }

  console.log(`IA completada: ${result.summary.totalSignals} señales generadas`)
  return result
}

function generatePredictions(series: PartSeries): AISignal[] {
  const predictions: AISignal[] = []

  if (series.weeklyData.length < 4) return predictions

  // Sort by week
  const sortedData = series.weeklyData.sort((a, b) => a.week.localeCompare(b.week))
  const lastWeek = sortedData[sortedData.length - 1].week

  // Simple trend analysis
  const quantities = sortedData.map((d) => d.qty)
  const trend = calculateTrend(quantities)
  const seasonality = detectSeasonality(quantities)

  // Generate next 8 weeks
  for (let i = 1; i <= 8; i++) {
    const futureWeek = getNextWeek(lastWeek, i)

    // Base prediction on average
    let predictedQty = series.avgWeeklyQty

    // Apply trend
    predictedQty *= 1 + trend * i * 0.1

    // Apply seasonality if detected
    if (seasonality.isDetected) {
      const seasonalFactor = seasonality.factors[i % seasonality.factors.length]
      predictedQty *= seasonalFactor
    }

    // Add some volatility
    const volatility = calculateVolatility(quantities)
    predictedQty *= 1 + (Math.random() - 0.5) * volatility * 0.3

    // Calculate confidence (decreases with time)
    const confidence = Math.max(0.5, 0.95 - i * 0.05 - volatility * 0.2)

    predictions.push({
      id: `pred_${series.partNum}_${series.customerCode}_${futureWeek}`,
      tipo: "tendencia",
      parte: series.partNum,
      cliente: series.customerCode,
      descripcion: `Predicción para la semana ${futureWeek}: ${Math.round(predictedQty)} unidades`,
      severidad: "media",
      confianza: confidence,
      recomendacion: `Ajustar inventario según la predicción de ${Math.round(predictedQty)} unidades`,
      fecha: new Date(),
      datos: {
        predictedQty: Math.round(predictedQty),
        confidence,
        seasonalityTag: seasonality.isDetected ? "seasonal" : undefined,
      },
    })
  }

  return predictions
}

function detectAnomalies(series: PartSeries): AISignal[] {
  const signals: AISignal[] = []

  if (series.weeklyData.length < 3) return signals

  // Detectar picos anómalos
  const consumos = series.weeklyData.map((d) => d.qty)
  const promedio = consumos.reduce((sum, c) => sum + c, 0) / consumos.length
  const desviacion = Math.sqrt(consumos.reduce((sum, c) => sum + Math.pow(c - promedio, 2), 0) / consumos.length)

  for (let i = 0; i < series.weeklyData.length; i++) {
    const consumo = series.weeklyData[i].qty
    if (Math.abs(consumo - promedio) > desviacion * 2) {
      signals.push({
        id: `anomaly_${series.partNum}_${i}`,
        tipo: "anomalia",
        parte: series.partNum,
        cliente: series.customerCode,
        descripcion: `Consumo anómalo detectado: ${consumo} vs promedio ${promedio.toFixed(2)}`,
        severidad: Math.abs(consumo - promedio) > desviacion * 3 ? "alta" : "media",
        confianza: 0.8,
        recomendacion: "Verificar datos y causas del consumo anómalo",
        fecha: new Date(),
        datos: { consumo, promedio, desviacion },
      })
    }
  }

  return signals
}

function generateAlerts(analysisResults: DemandAnalysisResult): DemandAlert[] {
  const alerts: DemandAlert[] = []

  // High volatility alerts
  analysisResults.volatilityRanking.slice(0, 10).forEach((item) => {
    if (item.volatilityScore > 0.7) {
      alerts.push({
        id: `volatility_${item.partNum}_${item.customerCode}`,
        type: "volatility",
        priority: item.volatilityScore > 0.9 ? "alta" : "media",
        titulo: `Alta volatilidad detectada`,
        descripcion: `${item.partNum} (${item.customerCode}) muestra volatilidad del ${(item.volatilityScore * 100).toFixed(1)}%`,
        partNum: item.partNum,
        customerCode: item.customerCode,
        valor: item.volatilityScore,
        umbral: 0.7,
        recomendacion: "Revisar patrones de demanda y ajustar inventario de seguridad",
        createdAt: new Date(),
      })
    }
  })

  // Inventory risk alerts
  analysisResults.inventoryAnalysis
    .filter((item) => item.riskLevel === "critical" || item.riskLevel === "high")
    .slice(0, 15)
    .forEach((item) => {
      alerts.push({
        id: `inventory_${item.partNum}_${item.customerCode}`,
        type: "inventory",
        priority: item.riskLevel === "critical" ? "alta" : "media",
        titulo: `Riesgo de desabasto ${item.riskLevel === "critical" ? "crítico" : "alto"}`,
        descripcion: `${item.partNum} (${item.customerCode}) tiene ${item.stockoutRisk.toFixed(1)}% de riesgo de desabasto`,
        partNum: item.partNum,
        customerCode: item.customerCode,
        valor: item.stockoutRisk,
        umbral: item.riskLevel === "critical" ? 80 : 60,
        recomendacion: `Incrementar stock a ${item.recommendedStock} unidades`,
        createdAt: new Date(),
      })
    })

  // Customer instability alerts
  analysisResults.customerInstability.slice(0, 5).forEach((customer) => {
    if (customer.instabilityScore > 0.6) {
      alerts.push({
        id: `customer_${customer.customerCode}`,
        type: "customer",
        priority: customer.instabilityScore > 0.8 ? "alta" : "media",
        titulo: `Cliente con demanda inestable`,
        descripcion: `${customer.customerCode} muestra inestabilidad del ${(customer.instabilityScore * 100).toFixed(1)}% en ${customer.partCount} partes`,
        customerCode: customer.customerCode,
        valor: customer.instabilityScore,
        umbral: 0.6,
        recomendacion: "Revisar acuerdos comerciales y patrones de pedidos",
        createdAt: new Date(),
      })
    }
  })

  return alerts.sort((a, b) => {
    const priorityOrder = { alta: 3, media: 2, baja: 1 }
    return priorityOrder[b.priority] - priorityOrder[a.priority]
  })
}

function generateRecommendations(analysisResults: DemandAnalysisResult, alerts: DemandAlert[]): string[] {
  const recommendations: string[] = []

  // Based on alerts
  const highPriorityAlerts = alerts.filter((a) => a.priority === "alta")
  if (highPriorityAlerts.length > 0) {
    recommendations.push(`Atender inmediatamente ${highPriorityAlerts.length} alertas críticas`)
  }

  // Based on volatility
  const highVolatilityCount = analysisResults.volatilityRanking.filter((v) => v.volatilityScore > 0.7).length
  if (highVolatilityCount > 0) {
    recommendations.push(`Revisar política de inventario para ${highVolatilityCount} partes de alta volatilidad`)
  }

  // Based on customer instability
  const unstableCustomers = analysisResults.customerInstability.filter((c) => c.instabilityScore > 0.6).length
  if (unstableCustomers > 0) {
    recommendations.push(`Negociar acuerdos más estables con ${unstableCustomers} clientes inestables`)
  }

  // Based on inventory analysis
  const criticalParts = analysisResults.inventoryAnalysis.filter((i) => i.riskLevel === "critical").length
  if (criticalParts > 0) {
    recommendations.push(`Incrementar stock de seguridad para ${criticalParts} partes críticas`)
  }

  // General recommendations
  recommendations.push("Implementar monitoreo semanal de volatilidad")
  recommendations.push("Establecer alertas automáticas para desviaciones > 50%")

  return recommendations
}

function generateInsights(
  normalizedData: NormalizedConsumptionRecord[],
  analysisResults: DemandAnalysisResult,
): string[] {
  const insights: string[] = []

  const uniqueParts = new Set(normalizedData.map((d) => d.partNum)).size
  const uniqueCustomers = new Set(normalizedData.map((d) => d.customerCode)).size
  const totalConsumption = normalizedData.reduce((sum, d) => sum + d.qty, 0)

  insights.push(`Se analizaron ${normalizedData.length} registros de consumo`)
  insights.push(`Se identificaron ${uniqueParts} partes únicas`)
  insights.push(`Se identificaron ${uniqueCustomers} clientes únicos`)
  insights.push(`Consumo total: ${totalConsumption} unidades`)

  const highVolatilityParts = analysisResults.volatilityRanking.filter((v) => v.volatilityScore > 0.7).length
  insights.push(`Partes con alta volatilidad: ${highVolatilityParts}`)

  const criticalInventoryParts = analysisResults.inventoryAnalysis.filter((i) => i.riskLevel === "critical").length
  insights.push(`Partes con riesgo crítico de desabastecimiento: ${criticalInventoryParts}`)

  const unstableCustomers = analysisResults.customerInstability.filter((c) => c.instabilityScore > 0.6).length
  insights.push(`Clientes con demanda inestable: ${unstableCustomers}`)

  return insights
}

export function filterSignalsByType(signals: AISignal[], filter: SignalFilter): AISignal[] {
  let filtered = signals

  if (filter.tipo && filter.tipo !== "todos") {
    filtered = filtered.filter((signal) => signal.tipo === filter.tipo)
  }

  if (filter.severidad && filter.severidad !== "todas") {
    filtered = filtered.filter((signal) => signal.severidad === filter.severidad)
  }

  if (filter.parte) {
    filtered = filtered.filter((signal) => signal.parte.toLowerCase().includes(filter.parte!.toLowerCase()))
  }

  if (filter.cliente) {
    filtered = filtered.filter((signal) => signal.cliente.toLowerCase().includes(filter.cliente!.toLowerCase()))
  }

  return filtered
}

export function groupSignalsByPart(signals: AISignal[]): Map<string, AISignal[]> {
  const grouped = new Map<string, AISignal[]>()

  for (const signal of signals) {
    const key = signal.parte || "General"
    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(signal)
  }

  return grouped
}

function calculateTrend(values: number[]): number {
  if (values.length < 2) return 0

  const n = values.length
  const sumX = (n * (n - 1)) / 2
  const sumY = values.reduce((sum, val) => sum + val, 0)
  const sumXY = values.reduce((sum, val, i) => sum + i * val, 0)
  const sumX2 = values.reduce((sum, _, i) => sum + i * i, 0)

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  const avgY = sumY / n

  return avgY > 0 ? slope / avgY : 0 // Normalized slope
}

function calculateVolatility(values: number[]): number {
  if (values.length < 2) return 0

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
  const stdDev = Math.sqrt(variance)

  return mean > 0 ? stdDev / mean : 0
}

function detectSeasonality(values: number[]): { isDetected: boolean; factors: number[] } {
  if (values.length < 8) return { isDetected: false, factors: [] }

  // Simple seasonality detection (4-week cycle)
  const cycleLength = 4
  const cycles = Math.floor(values.length / cycleLength)

  if (cycles < 2) return { isDetected: false, factors: [] }

  const seasonalFactors: number[] = []
  const overallAvg = values.reduce((sum, val) => sum + val, 0) / values.length

  for (let i = 0; i < cycleLength; i++) {
    let positionSum = 0
    let count = 0

    for (let cycle = 0; cycle < cycles; cycle++) {
      const index = cycle * cycleLength + i
      if (index < values.length) {
        positionSum += values[index]
        count++
      }
    }

    const positionAvg = positionSum / count
    seasonalFactors.push(overallAvg > 0 ? positionAvg / overallAvg : 1)
  }

  // Check if seasonality is significant
  const variance = seasonalFactors.reduce((sum, factor) => sum + Math.pow(factor - 1, 2), 0) / cycleLength
  const isDetected = variance > 0.1 // Threshold for significant seasonality

  return { isDetected, factors: seasonalFactors }
}

function getNextWeek(currentWeek: string, weeksAhead: number): string {
  const [year, weekStr] = currentWeek.split("-W")
  const week = Number.parseInt(weekStr)

  let newYear = Number.parseInt(year)
  let newWeek = week + weeksAhead

  // Handle year transitions (simplified)
  while (newWeek > 52) {
    newWeek -= 52
    newYear += 1
  }

  return `${newYear}-W${newWeek.toString().padStart(2, "0")}`
}

function calculateOverallConfidence(forecasts: DemandForecast[], alerts: DemandAlert[]): number {
  if (forecasts.length === 0) return 0.5

  const avgForecastConfidence = forecasts.reduce((sum, f) => sum + f.confidence, 0) / forecasts.length

  // Reduce confidence based on number of high-priority alerts
  const highPriorityAlerts = alerts.filter((a) => a.priority === "alta").length
  const alertPenalty = Math.min(highPriorityAlerts * 0.05, 0.3)

  return Math.max(0.3, avgForecastConfidence - alertPenalty)
}

function generateForecasts(
  normalizedData: NormalizedConsumptionRecord[],
  analysisResults: DemandAnalysisResult,
): DemandForecast[] {
  const forecasts: DemandForecast[] = []

  // Generate forecasts for top volatile parts
  const topVolatileParts = analysisResults.volatilityRanking.slice(0, 20)

  for (const part of topVolatileParts) {
    // Generate next 8 weeks of forecasts
    for (let week = 1; week <= 8; week++) {
      const futureWeek = getNextWeek(new Date().toISOString().slice(0, 10), week)

      // Simple forecast based on average with trend adjustment
      let forecastQty = part.avgWeeklyQty

      // Apply volatility adjustment
      const volatilityFactor = 1 + (Math.random() - 0.5) * part.volatilityScore * 0.3
      forecastQty *= volatilityFactor

      // Calculate confidence (decreases with time and increases with volatility)
      const confidence = Math.max(0.4, 0.9 - week * 0.05 - part.volatilityScore * 0.2)

      forecasts.push({
        id: `forecast_${part.partNum}_${part.customerCode}_${futureWeek}`,
        partNum: part.partNum,
        customerCode: part.customerCode,
        week: futureWeek,
        forecastQty: Math.round(forecastQty),
        confidence,
        upperBand: Math.round(forecastQty * (1 + part.volatilityScore * 0.5)),
        lowerBand: Math.round(forecastQty * (1 - part.volatilityScore * 0.3)),
        method: "volatility_based",
        createdAt: new Date(),
      })
    }
  }

  return forecasts
}
