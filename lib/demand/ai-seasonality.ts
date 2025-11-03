import type { ConsumptionPoint, WeeklyStat } from "@/types/demand-ai"

export interface SeasonalPattern {
  weekOfYear: number
  avgDemand: number
  confidence: number
  pattern: "peak" | "low" | "stable"
  variance: number
}

export interface SeasonalityInsight {
  type: "seasonal_peak" | "seasonal_low" | "trend_change" | "volatility_alert"
  title: string
  description: string
  confidence: number
  impact: "high" | "medium" | "low"
  recommendation?: string
  implementBy?: string
}

export class SeasonalityDetector {
  private consumptionData: ConsumptionPoint[]
  private weeklyStats: WeeklyStat[]

  constructor(consumptionData: ConsumptionPoint[], weeklyStats: WeeklyStat[]) {
    this.consumptionData = consumptionData
    this.weeklyStats = weeklyStats
  }

  detectSeasonalPatterns(partNum: string): SeasonalPattern[] {
    const partData = this.consumptionData.filter((d) => d.partNum === partNum)

    if (partData.length < 12) {
      return [] // Necesitamos al menos 12 semanas de datos
    }

    // Agrupar por semana del año
    const weeklyDemand = new Map<number, number[]>()

    partData.forEach((point) => {
      const weekOfYear = this.getWeekOfYear(point.weekKey)
      if (!weeklyDemand.has(weekOfYear)) {
        weeklyDemand.set(weekOfYear, [])
      }
      weeklyDemand.get(weekOfYear)!.push(point.qty)
    })

    const patterns: SeasonalPattern[] = []

    for (const [weekOfYear, demands] of weeklyDemand.entries()) {
      if (demands.length < 2) continue // Necesitamos al menos 2 años de datos

      const avgDemand = demands.reduce((sum, d) => sum + d, 0) / demands.length
      const variance = this.calculateVariance(demands, avgDemand)
      const confidence = Math.min(demands.length / 3, 1) // Más años = más confianza

      // Determinar patrón basado en desviación de la media general
      const overallAvg = partData.reduce((sum, d) => sum + d.qty, 0) / partData.length
      const deviation = (avgDemand - overallAvg) / overallAvg

      let pattern: "peak" | "low" | "stable"
      if (deviation > 0.2) pattern = "peak"
      else if (deviation < -0.2) pattern = "low"
      else pattern = "stable"

      patterns.push({
        weekOfYear,
        avgDemand,
        confidence,
        pattern,
        variance,
      })
    }

    return patterns.sort((a, b) => a.weekOfYear - b.weekOfYear)
  }

  generateSeasonalityInsights(partNum: string): SeasonalityInsight[] {
    const patterns = this.detectSeasonalPatterns(partNum)
    const insights: SeasonalityInsight[] = []

    if (patterns.length === 0) {
      return [
        {
          type: "volatility_alert",
          title: "Datos insuficientes para análisis estacional",
          description: "Se requieren al menos 12 semanas de datos históricos",
          confidence: 0,
          impact: "low",
        },
      ]
    }

    // Detectar picos estacionales
    const peaks = patterns.filter((p) => p.pattern === "peak" && p.confidence > 0.6)
    if (peaks.length > 0) {
      const peakWeeks = peaks.map((p) => `semana ${p.weekOfYear}`).join(", ")
      insights.push({
        type: "seasonal_peak",
        title: "Picos estacionales detectados",
        description: `Demanda alta consistente en ${peakWeeks}`,
        confidence: Math.max(...peaks.map((p) => p.confidence)),
        impact: "high",
        recommendation: "Incrementar inventario 2-3 semanas antes de los picos",
        implementBy: this.getImplementationDate(Math.min(...peaks.map((p) => p.weekOfYear))),
      })
    }

    // Detectar valles estacionales
    const lows = patterns.filter((p) => p.pattern === "low" && p.confidence > 0.6)
    if (lows.length > 0) {
      const lowWeeks = lows.map((p) => `semana ${p.weekOfYear}`).join(", ")
      insights.push({
        type: "seasonal_low",
        title: "Valles estacionales identificados",
        description: `Demanda baja consistente en ${lowWeeks}`,
        confidence: Math.max(...lows.map((p) => p.confidence)),
        impact: "medium",
        recommendation: "Reducir inventario y planificar mantenimiento",
        implementBy: this.getImplementationDate(Math.min(...lows.map((p) => p.weekOfYear))),
      })
    }

    // Detectar alta variabilidad
    const highVariance = patterns.filter((p) => p.variance > 0.5)
    if (highVariance.length > patterns.length * 0.3) {
      insights.push({
        type: "volatility_alert",
        title: "Alta variabilidad estacional",
        description: `${Math.round((highVariance.length / patterns.length) * 100)}% de las semanas muestran alta variabilidad`,
        confidence: 0.8,
        impact: "high",
        recommendation: "Implementar buffer de seguridad dinámico",
        implementBy: "Próximas 2 semanas",
      })
    }

    return insights
  }

  private getWeekOfYear(weekKey: string): number {
    // Extraer número de semana de formato "YYYY-Www"
    const match = weekKey.match(/W(\d+)/)
    return match ? Number.parseInt(match[1]) : 1
  }

  private calculateVariance(values: number[], mean: number): number {
    if (values.length <= 1) return 0
    const squaredDiffs = values.map((v) => Math.pow(v - mean, 2))
    return Math.sqrt(squaredDiffs.reduce((sum, d) => sum + d, 0) / values.length) / mean
  }

  private getImplementationDate(weekOfYear: number): string {
    const currentDate = new Date()
    const currentWeek = this.getWeekOfYear(
      `${currentDate.getFullYear()}-W${Math.ceil((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`,
    )

    let targetWeek = weekOfYear - 2 // 2 semanas antes
    if (targetWeek <= currentWeek) {
      targetWeek += 52 // Próximo año
    }

    const weeksToAdd = targetWeek - currentWeek
    const targetDate = new Date(currentDate.getTime() + weeksToAdd * 7 * 24 * 60 * 60 * 1000)

    return targetDate.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
}
