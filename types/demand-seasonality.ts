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

export interface SeasonalityAnalysis {
  partNum: string
  patterns: SeasonalPattern[]
  insights: SeasonalityInsight[]
  overallSeasonality: number // 0-1 score
  recommendedActions: string[]
}
