export type ReleasesForecastItem = {
  id: string
  poNumber: string
  releaseNo: string
  partNumber: string
  quantity: number
  deliveryDate: string
  status: "normal" | "warning" | "critical"
  statusMessage?: string
}

export type WeeklyForecastItem = {
  id: string
  partNumber: string
  description: string
  week1: number
  week2: number
  week3: number
  week4: number
  week5: number
  week6: number
  status: "normal" | "warning" | "critical"
  statusMessage?: string
}

export type DailyForecastItem = {
  id: string
  partNumber: string
  description: string
  day1: number
  day2: number
  day3: number
  day4: number
  day5: number
  status: "normal" | "warning" | "critical"
  statusMessage?: string
}

export type LogisticsForecastItem = {
  id: string
  partNumber: string
  description: string
  currentInventory: number
  moq: number
  safetyStock: number
  openPOs: number
  doh: number
  status: "normal" | "warning" | "critical"
  statusMessage?: string
}

export type ForecastComparisonItem = {
  id: string
  evcoPartNumber: string
  evcoNumber?: string
  clientPartNumber: string
  description: string
  previousForecast: number
  currentForecast: number
  changePercentage: number
  variationType: "normal" | "moderada" | "pico"
  comments?: string
  isNew?: boolean
  client?: string
  period?: string
  difference?: number
  // Nuevos campos para ventas y asertividad
  currentMonthSales?: number
  previousMonthSales?: number
  twoMonthsAgoSales?: number
  assertivity?: number
}

// Nuevo tipo para el reporte de asertividad
export type AssertivityReportItem = {
  id: string
  partNumber: string
  evcoNumber?: string
  client: string
  month: string
  forecast: number
  sales: number
  assertivity: number
}

export type MonthlyAssertivitySummary = {
  month: string
  totalForecast: number
  totalSales: number
  assertivity: number
  itemCount: number
}
