import type { InventoryAnalysis, DemandAnalysisResult } from "@/types/demand-ai"
import { DemandForecaster, type DemandForecast } from "./demand-forecasting"
import { SeasonalityDetector } from "./ai-seasonality"

export interface DemandRecommendation {
  id: string
  partNum: string
  type: "inventory" | "procurement" | "planning" | "alert"
  priority: "critical" | "high" | "medium" | "low"
  title: string
  description: string
  action: string
  impact: string
  implementBy: string
  estimatedBenefit?: string
  riskScore: number
  confidence: number
}

export interface PortfolioRecommendation {
  type: "strategic" | "operational" | "tactical"
  title: string
  description: string
  affectedParts: string[]
  estimatedImpact: string
  timeframe: string
  priority: "critical" | "high" | "medium" | "low"
}

export class DemandRecommendationEngine {
  private analysisResult: DemandAnalysisResult
  private forecaster: DemandForecaster
  private seasonalityDetector: SeasonalityDetector

  constructor(analysisResult: DemandAnalysisResult) {
    this.analysisResult = analysisResult
    this.forecaster = new DemandForecaster(
      analysisResult.consumptionData,
      analysisResult.weeklyStats,
      analysisResult.aiSignals,
    )
    this.seasonalityDetector = new SeasonalityDetector(analysisResult.consumptionData, analysisResult.weeklyStats)
  }

  generateRecommendations(): DemandRecommendation[] {
    const recommendations: DemandRecommendation[] = []

    // Recomendaciones por inventario crítico
    recommendations.push(...this.generateInventoryRecommendations())

    // Recomendaciones por estacionalidad
    recommendations.push(...this.generateSeasonalityRecommendations())

    // Recomendaciones por pronósticos
    recommendations.push(...this.generateForecastRecommendations())

    // Recomendaciones por volatilidad
    recommendations.push(...this.generateVolatilityRecommendations())

    // Ordenar por prioridad y score de riesgo
    return recommendations
      .sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff
        return b.riskScore - a.riskScore
      })
      .slice(0, 20) // Top 20 recomendaciones
  }

  generatePortfolioRecommendations(): PortfolioRecommendation[] {
    const recommendations: PortfolioRecommendation[] = []

    // Análisis estratégico
    const criticalParts = this.analysisResult.inventoryAnalysis
      .filter((inv) => inv.riskLevel === "critical")
      .map((inv) => inv.partNum)

    if (criticalParts.length > 0) {
      recommendations.push({
        type: "strategic",
        title: "Revisión de portafolio de partes críticas",
        description: `${criticalParts.length} partes requieren atención inmediata por riesgo de desabasto`,
        affectedParts: criticalParts.slice(0, 10),
        estimatedImpact: "Reducción del 60% en riesgo de desabasto",
        timeframe: "2-4 semanas",
        priority: "critical",
      })
    }

    // Análisis operacional
    const highVolatilityParts = this.analysisResult.volatilityRanking
      .filter((v) => v.volatilityScore > 0.7)
      .slice(0, 15)
      .map((v) => v.partNum)

    if (highVolatilityParts.length > 0) {
      recommendations.push({
        type: "operational",
        title: "Implementar buffer dinámico para partes volátiles",
        description: "Ajustar niveles de inventario basado en volatilidad histórica",
        affectedParts: highVolatilityParts,
        estimatedImpact: "Reducción del 25% en costos de inventario",
        timeframe: "4-6 semanas",
        priority: "high",
      })
    }

    // Análisis táctico
    const seasonalParts = this.getSeasonalParts()
    if (seasonalParts.length > 0) {
      recommendations.push({
        type: "tactical",
        title: "Planificación estacional automatizada",
        description: "Implementar ajustes automáticos basados en patrones estacionales",
        affectedParts: seasonalParts,
        estimatedImpact: "Mejora del 30% en nivel de servicio",
        timeframe: "6-8 semanas",
        priority: "medium",
      })
    }

    return recommendations
  }

  private generateInventoryRecommendations(): DemandRecommendation[] {
    const recommendations: DemandRecommendation[] = []

    this.analysisResult.inventoryAnalysis
      .filter((inv) => inv.riskLevel === "critical" || inv.riskLevel === "high")
      .slice(0, 10)
      .forEach((inv, index) => {
        const forecast = this.forecaster.generateForecast(inv.partNum, 4)
        const riskScore = this.calculateInventoryRiskScore(inv, forecast)

        recommendations.push({
          id: `inv-${index}`,
          partNum: inv.partNum,
          type: "inventory",
          priority: inv.riskLevel === "critical" ? "critical" : "high",
          title: `Riesgo de desabasto: ${inv.partNum}`,
          description: `Stock actual: ${inv.currentStock} unidades, ${inv.weeksOfStock.toFixed(1)} semanas de cobertura`,
          action: `Ordenar ${Math.ceil(inv.avgWeeklyConsumption * 8)} unidades inmediatamente`,
          impact: `Evitar desabasto por ${Math.ceil(8 - inv.weeksOfStock)} semanas`,
          implementBy: this.getImplementationDate(3),
          estimatedBenefit: `$${(inv.avgWeeklyConsumption * 100).toLocaleString()} en ventas protegidas`,
          riskScore,
          confidence: forecast.confidence,
        })
      })

    return recommendations
  }

  private generateSeasonalityRecommendations(): DemandRecommendation[] {
    const recommendations: DemandRecommendation[] = []

    // Obtener partes con patrones estacionales fuertes
    const seasonalParts = this.getSeasonalParts().slice(0, 5)

    seasonalParts.forEach((partNum, index) => {
      const insights = this.seasonalityDetector.generateSeasonalityInsights(partNum)
      const highConfidenceInsights = insights.filter((i) => i.confidence > 0.6)

      highConfidenceInsights.forEach((insight, insightIndex) => {
        if (insight.recommendation) {
          recommendations.push({
            id: `seasonal-${index}-${insightIndex}`,
            partNum,
            type: "planning",
            priority: insight.impact === "high" ? "high" : "medium",
            title: insight.title,
            description: insight.description,
            action: insight.recommendation,
            impact: `Optimización estacional para ${partNum}`,
            implementBy: insight.implementBy || "Próximas 4 semanas",
            riskScore: insight.confidence * (insight.impact === "high" ? 0.8 : 0.6),
            confidence: insight.confidence,
          })
        }
      })
    })

    return recommendations
  }

  private generateForecastRecommendations(): DemandRecommendation[] {
    const recommendations: DemandRecommendation[] = []

    // Top partes por volumen para pronósticos
    const topParts = this.analysisResult.weeklyStats
      .sort((a, b) => b.totalQty - a.totalQty)
      .slice(0, 8)
      .map((s) => s.partNum)

    topParts.forEach((partNum, index) => {
      const forecast = this.forecaster.generateForecast(partNum, 6)

      if (forecast.confidence > 0.7) {
        const nextWeekForecast = forecast.forecasts[0]
        const currentConsumption = this.getCurrentWeeklyConsumption(partNum)
        const change = ((nextWeekForecast.predictedQty - currentConsumption) / currentConsumption) * 100

        if (Math.abs(change) > 20) {
          recommendations.push({
            id: `forecast-${index}`,
            partNum,
            type: "procurement",
            priority: Math.abs(change) > 50 ? "high" : "medium",
            title: `Cambio significativo en demanda proyectada`,
            description: `Pronóstico indica ${change > 0 ? "incremento" : "reducción"} del ${Math.abs(change).toFixed(1)}%`,
            action:
              change > 0
                ? `Incrementar orden en ${Math.ceil(nextWeekForecast.predictedQty * 0.2)} unidades`
                : `Reducir orden planificada en ${Math.ceil(currentConsumption * 0.15)} unidades`,
            impact: `Ajuste proactivo basado en IA`,
            implementBy: this.getImplementationDate(1),
            estimatedBenefit: `$${(Math.abs(change) * 50).toLocaleString()} en optimización`,
            riskScore: forecast.confidence * (Math.abs(change) / 100),
            confidence: forecast.confidence,
          })
        }
      }
    })

    return recommendations
  }

  private generateVolatilityRecommendations(): DemandRecommendation[] {
    const recommendations: DemandRecommendation[] = []

    // Partes con alta volatilidad
    const volatileParts = this.analysisResult.volatilityRanking.filter((v) => v.volatilityScore > 0.6).slice(0, 5)

    volatileParts.forEach((part, index) => {
      recommendations.push({
        id: `volatility-${index}`,
        partNum: part.partNum,
        type: "alert",
        priority: part.volatilityScore > 0.8 ? "high" : "medium",
        title: `Alta volatilidad detectada`,
        description: `Score de volatilidad: ${(part.volatilityScore * 100).toFixed(1)}%, variación semanal significativa`,
        action: `Implementar buffer de seguridad del ${Math.ceil(part.volatilityScore * 30)}%`,
        impact: `Reducir riesgo de desabasto por volatilidad`,
        implementBy: this.getImplementationDate(2),
        estimatedBenefit: `Mejora del ${Math.ceil(part.volatilityScore * 20)}% en nivel de servicio`,
        riskScore: part.volatilityScore,
        confidence: 0.8,
      })
    })

    return recommendations
  }

  private calculateInventoryRiskScore(inv: InventoryAnalysis, forecast: DemandForecast): number {
    let score = 0

    // Factor de cobertura (más peso si menos semanas)
    score += Math.max(0, (8 - inv.weeksOfStock) / 8) * 0.4

    // Factor de pronóstico (si la demanda va a aumentar)
    if (forecast.forecasts.length > 0) {
      const avgForecast = forecast.forecasts.reduce((sum, f) => sum + f.predictedQty, 0) / forecast.forecasts.length
      if (avgForecast > inv.avgWeeklyConsumption) {
        score += 0.3
      }
    }

    // Factor de confianza del pronóstico
    score += (1 - forecast.confidence) * 0.2

    // Factor de criticidad del nivel de riesgo
    const riskMultiplier = {
      critical: 1.0,
      high: 0.8,
      medium: 0.6,
      low: 0.4,
    }
    score *= riskMultiplier[inv.riskLevel]

    return Math.min(1, score)
  }

  private getSeasonalParts(): string[] {
    // Identificar partes con patrones estacionales
    const seasonalParts: string[] = []

    const uniqueParts = [...new Set(this.analysisResult.consumptionData.map((d) => d.partNum))]

    uniqueParts.forEach((partNum) => {
      const patterns = this.seasonalityDetector.detectSeasonalPatterns(partNum)
      const hasStrongSeasonality = patterns.some(
        (p) => (p.pattern === "peak" || p.pattern === "low") && p.confidence > 0.6,
      )

      if (hasStrongSeasonality) {
        seasonalParts.push(partNum)
      }
    })

    return seasonalParts
  }

  private getCurrentWeeklyConsumption(partNum: string): number {
    const recentData = this.analysisResult.consumptionData.filter((d) => d.partNum === partNum).slice(-4) // Últimas 4 semanas

    return recentData.length > 0 ? recentData.reduce((sum, d) => sum + d.qty, 0) / recentData.length : 0
  }

  private getImplementationDate(weeksFromNow: number): string {
    const date = new Date()
    date.setDate(date.getDate() + weeksFromNow * 7)

    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }
}
