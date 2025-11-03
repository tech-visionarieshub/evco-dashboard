import type { NormalizedConsumptionRecord, PartSeries } from "./normalizeConsumption"

export interface WeeklyStats {
  week: string
  totalQty: number
  uniqueParts: number
  uniqueCustomers: number
  avgQtyPerPart: number
}

export interface VolatilityItem {
  partNum: string
  customerCode: string
  avgQty: number
  stdDev: number
  volatilityScore: number
  trend: "up" | "down" | "stable"
  riskLevel: "low" | "medium" | "high" | "critical"
}

export interface CustomerInstabilityItem {
  customerCode: string
  partCount: number
  avgVolatility: number
  instabilityScore: number
  riskLevel: "low" | "medium" | "high" | "critical"
}

export interface InventoryAnalysisItem {
  partNum: string
  customerCode: string
  currentStock: number
  avgWeeklyConsumption: number
  volatility: number
  recommendedStock: number
  stockoutRisk: number
  riskLevel: "low" | "medium" | "high" | "critical"
}

export interface DemandAnalysisResult {
  weeklyStats: WeeklyStats[]
  volatilityRanking: VolatilityItem[]
  customerInstability: CustomerInstabilityItem[]
  inventoryAnalysis: InventoryAnalysisItem[]
  summary: {
    totalParts: number
    totalCustomers: number
    avgVolatility: number
    highRiskParts: number
    criticalParts: number
  }
}

export function calcWeeklyStats(normalizedData: NormalizedConsumptionRecord[]): WeeklyStats[] {
  const weeklyGroups = new Map<string, NormalizedConsumptionRecord[]>()

  // Group by week
  for (const record of normalizedData) {
    if (!weeklyGroups.has(record.isoWeek)) {
      weeklyGroups.set(record.isoWeek, [])
    }
    weeklyGroups.get(record.isoWeek)!.push(record)
  }

  const stats: WeeklyStats[] = []

  for (const [week, records] of weeklyGroups.entries()) {
    const totalQty = records.reduce((sum, r) => sum + r.qty, 0)
    const uniqueParts = new Set(records.map((r) => r.partNum)).size
    const uniqueCustomers = new Set(records.map((r) => r.customerCode)).size
    const avgQtyPerPart = totalQty / uniqueParts

    stats.push({
      week,
      totalQty,
      uniqueParts,
      uniqueCustomers,
      avgQtyPerPart,
    })
  }

  return stats.sort((a, b) => a.week.localeCompare(b.week))
}

export function rankByVolatility(partSeries: PartSeries[]): VolatilityItem[] {
  const volatilityItems: VolatilityItem[] = []

  for (const series of partSeries) {
    const volatilityScore = series.stats.volatility
    let riskLevel: "low" | "medium" | "high" | "critical"

    if (volatilityScore > 0.8) riskLevel = "critical"
    else if (volatilityScore > 0.6) riskLevel = "high"
    else if (volatilityScore > 0.4) riskLevel = "medium"
    else riskLevel = "low"

    volatilityItems.push({
      partNum: series.partNum,
      customerCode: series.customerCode,
      avgQty: series.stats.avg,
      stdDev: series.stats.stdDev,
      volatilityScore,
      trend: series.stats.trend,
      riskLevel,
    })
  }

  return volatilityItems.sort((a, b) => b.volatilityScore - a.volatilityScore)
}

export function customerInstability(partSeries: PartSeries[]): CustomerInstabilityItem[] {
  const customerGroups = new Map<string, PartSeries[]>()

  // Group by customer
  for (const series of partSeries) {
    if (!customerGroups.has(series.customerCode)) {
      customerGroups.set(series.customerCode, [])
    }
    customerGroups.get(series.customerCode)!.push(series)
  }

  const instabilityItems: CustomerInstabilityItem[] = []

  for (const [customerCode, customerSeries] of customerGroups.entries()) {
    const partCount = customerSeries.length
    const avgVolatility = customerSeries.reduce((sum, s) => sum + s.stats.volatility, 0) / partCount

    // Calculate instability score based on average volatility and part count variability
    const partVolatilities = customerSeries.map((s) => s.stats.volatility)
    const volatilityStdDev = Math.sqrt(
      partVolatilities.reduce((sum, v) => sum + Math.pow(v - avgVolatility, 2), 0) / partCount,
    )

    const instabilityScore = (avgVolatility + volatilityStdDev) / 2

    let riskLevel: "low" | "medium" | "high" | "critical"
    if (instabilityScore > 0.8) riskLevel = "critical"
    else if (instabilityScore > 0.6) riskLevel = "high"
    else if (instabilityScore > 0.4) riskLevel = "medium"
    else riskLevel = "low"

    instabilityItems.push({
      customerCode,
      partCount,
      avgVolatility,
      instabilityScore,
      riskLevel,
    })
  }

  return instabilityItems.sort((a, b) => b.instabilityScore - a.instabilityScore)
}

export function analyzeWithInventory(partSeries: PartSeries[]): InventoryAnalysisItem[] {
  const inventoryItems: InventoryAnalysisItem[] = []

  for (const series of partSeries) {
    // Simulate current stock (in real scenario, this would come from inventory system)
    const avgWeeklyConsumption = series.avgWeeklyQty
    const volatility = series.stats.volatility

    // Estimate current stock as 2-4 weeks of average consumption
    const currentStock = Math.round(avgWeeklyConsumption * (2 + Math.random() * 2))

    // Calculate recommended stock based on volatility
    const safetyFactor = 1 + volatility * 2 // Higher volatility = more safety stock
    const recommendedStock = Math.round(avgWeeklyConsumption * 4 * safetyFactor)

    // Calculate stockout risk
    const stockoutRisk = Math.min(
      100,
      Math.max(0, ((recommendedStock - currentStock) / recommendedStock) * 100 + volatility * 50),
    )

    let riskLevel: "low" | "medium" | "high" | "critical"
    if (stockoutRisk > 80) riskLevel = "critical"
    else if (stockoutRisk > 60) riskLevel = "high"
    else if (stockoutRisk > 40) riskLevel = "medium"
    else riskLevel = "low"

    inventoryItems.push({
      partNum: series.partNum,
      customerCode: series.customerCode,
      currentStock,
      avgWeeklyConsumption,
      volatility,
      recommendedStock,
      stockoutRisk,
      riskLevel,
    })
  }

  return inventoryItems.sort((a, b) => b.stockoutRisk - a.stockoutRisk)
}

export function getTopParts(volatilityRanking: VolatilityItem[], limit = 10): VolatilityItem[] {
  return volatilityRanking.slice(0, limit)
}

export function filterByRiskLevel(
  items: (VolatilityItem | InventoryAnalysisItem)[],
  riskLevel: "low" | "medium" | "high" | "critical",
): (VolatilityItem | InventoryAnalysisItem)[] {
  return items.filter((item) => item.riskLevel === riskLevel)
}

export function analyzeDemand(
  normalizedData: NormalizedConsumptionRecord[],
  partSeries: PartSeries[],
): DemandAnalysisResult {
  const weeklyStats = calcWeeklyStats(normalizedData)
  const volatilityRanking = rankByVolatility(partSeries)
  const customerInstabilityItems = customerInstability(partSeries)
  const inventoryAnalysis = analyzeWithInventory(partSeries)

  // Calculate summary statistics
  const totalParts = new Set(normalizedData.map((d) => d.partNum)).size
  const totalCustomers = new Set(normalizedData.map((d) => d.customerCode)).size
  const avgVolatility = volatilityRanking.reduce((sum, v) => sum + v.volatilityScore, 0) / volatilityRanking.length
  const highRiskParts = volatilityRanking.filter((v) => v.riskLevel === "high" || v.riskLevel === "critical").length
  const criticalParts = volatilityRanking.filter((v) => v.riskLevel === "critical").length

  return {
    weeklyStats,
    volatilityRanking,
    customerInstability: customerInstabilityItems,
    inventoryAnalysis,
    summary: {
      totalParts,
      totalCustomers,
      avgVolatility,
      highRiskParts,
      criticalParts,
    },
  }
}
