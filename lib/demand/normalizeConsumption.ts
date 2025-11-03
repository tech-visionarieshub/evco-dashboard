export interface RawConsumptionRecord {
  [key: string]: any
}

export interface NormalizedConsumptionRecord {
  partNum: string
  customerCode: string
  qty: number
  date: Date
  isoWeek: string
  month: string
  year: number
}

export interface PartSeries {
  partNum: string
  customerCode: string
  totalQty: number
  avgWeeklyQty: number
  weeklyData: Array<{
    week: string
    qty: number
  }>
  stats: {
    min: number
    max: number
    avg: number
    stdDev: number
    volatility: number
    trend: "up" | "down" | "stable"
  }
}

export interface DataStats {
  totalRecords: number
  uniqueParts: number
  uniqueCustomers: number
  dateRange: {
    start: Date
    end: Date
  }
  totalConsumption: number
  avgWeeklyConsumption: number
  topParts: Array<{
    partNum: string
    totalQty: number
    percentage: number
  }>
  topCustomers: Array<{
    customerCode: string
    totalQty: number
    percentage: number
  }>
}

export function normalizeConsumption(rawData: RawConsumptionRecord[]): NormalizedConsumptionRecord[] {
  if (!rawData || rawData.length === 0) {
    return []
  }

  const normalized: NormalizedConsumptionRecord[] = []

  // Auto-detect column mappings
  const columnMappings = detectColumnMappings(rawData[0])

  for (const record of rawData) {
    try {
      const partNum = extractValue(record, columnMappings.partNum)
      const customerCode = extractValue(record, columnMappings.customerCode)
      const qty = Number.parseFloat(extractValue(record, columnMappings.qty)) || 0
      const dateValue = extractValue(record, columnMappings.date)

      if (!partNum || !customerCode || qty <= 0) {
        continue // Skip invalid records
      }

      const date = parseDate(dateValue)
      if (!date) {
        continue // Skip records with invalid dates
      }

      const isoWeek = getISOWeek(date)
      const month = date.toISOString().substring(0, 7) // YYYY-MM
      const year = date.getFullYear()

      normalized.push({
        partNum: String(partNum).trim(),
        customerCode: String(customerCode).trim(),
        qty,
        date,
        isoWeek,
        month,
        year,
      })
    } catch (error) {
      console.warn("Error normalizing record:", record, error)
      continue
    }
  }

  return normalized
}

// Export alias for backward compatibility
export const normalizeConsumptionData = normalizeConsumption

export function getDataStats(normalizedData: NormalizedConsumptionRecord[]): DataStats {
  if (normalizedData.length === 0) {
    return {
      totalRecords: 0,
      uniqueParts: 0,
      uniqueCustomers: 0,
      dateRange: { start: new Date(), end: new Date() },
      totalConsumption: 0,
      avgWeeklyConsumption: 0,
      topParts: [],
      topCustomers: [],
    }
  }

  const dates = normalizedData.map((d) => d.date).sort((a, b) => a.getTime() - b.getTime())
  const totalConsumption = normalizedData.reduce((sum, d) => sum + d.qty, 0)

  // Calculate unique parts and customers
  const uniqueParts = new Set(normalizedData.map((d) => d.partNum))
  const uniqueCustomers = new Set(normalizedData.map((d) => d.customerCode))

  // Calculate top parts
  const partConsumption = new Map<string, number>()
  for (const record of normalizedData) {
    partConsumption.set(record.partNum, (partConsumption.get(record.partNum) || 0) + record.qty)
  }

  const topParts = Array.from(partConsumption.entries())
    .map(([partNum, totalQty]) => ({
      partNum,
      totalQty,
      percentage: (totalQty / totalConsumption) * 100,
    }))
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 10)

  // Calculate top customers
  const customerConsumption = new Map<string, number>()
  for (const record of normalizedData) {
    customerConsumption.set(record.customerCode, (customerConsumption.get(record.customerCode) || 0) + record.qty)
  }

  const topCustomers = Array.from(customerConsumption.entries())
    .map(([customerCode, totalQty]) => ({
      customerCode,
      totalQty,
      percentage: (totalQty / totalConsumption) * 100,
    }))
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 10)

  // Calculate weekly average
  const weeks = new Set(normalizedData.map((d) => d.isoWeek))
  const avgWeeklyConsumption = totalConsumption / weeks.size

  return {
    totalRecords: normalizedData.length,
    uniqueParts: uniqueParts.size,
    uniqueCustomers: uniqueCustomers.size,
    dateRange: {
      start: dates[0],
      end: dates[dates.length - 1],
    },
    totalConsumption,
    avgWeeklyConsumption,
    topParts,
    topCustomers,
  }
}

export function groupByPartToSeries(normalizedData: NormalizedConsumptionRecord[]): PartSeries[] {
  const partGroups = new Map<string, NormalizedConsumptionRecord[]>()

  // Group by part-customer combination
  for (const record of normalizedData) {
    const key = `${record.partNum}_${record.customerCode}`
    if (!partGroups.has(key)) {
      partGroups.set(key, [])
    }
    partGroups.get(key)!.push(record)
  }

  const series: PartSeries[] = []

  for (const [key, records] of partGroups.entries()) {
    const [partNum, customerCode] = key.split("_")

    // Group by week and sum quantities
    const weeklyData = new Map<string, number>()
    for (const record of records) {
      weeklyData.set(record.isoWeek, (weeklyData.get(record.isoWeek) || 0) + record.qty)
    }

    const weeklyArray = Array.from(weeklyData.entries())
      .map(([week, qty]) => ({ week, qty }))
      .sort((a, b) => a.week.localeCompare(b.week))

    const totalQty = records.reduce((sum, r) => sum + r.qty, 0)
    const avgWeeklyQty = totalQty / weeklyArray.length

    // Calculate statistics
    const quantities = weeklyArray.map((w) => w.qty)
    const min = Math.min(...quantities)
    const max = Math.max(...quantities)
    const avg = quantities.reduce((sum, q) => sum + q, 0) / quantities.length
    const variance = quantities.reduce((sum, q) => sum + Math.pow(q - avg, 2), 0) / quantities.length
    const stdDev = Math.sqrt(variance)
    const volatility = avg > 0 ? stdDev / avg : 0

    // Calculate trend
    const trend = calculateTrend(quantities)

    series.push({
      partNum,
      customerCode,
      totalQty,
      avgWeeklyQty,
      weeklyData: weeklyArray,
      stats: {
        min,
        max,
        avg,
        stdDev,
        volatility,
        trend: trend > 0.1 ? "up" : trend < -0.1 ? "down" : "stable",
      },
    })
  }

  return series.sort((a, b) => b.totalQty - a.totalQty)
}

function detectColumnMappings(sampleRecord: RawConsumptionRecord) {
  const keys = Object.keys(sampleRecord)

  const partNumColumns = ["part", "partnum", "part_num", "partnumber", "part_number", "codigo", "codigo_parte"]
  const customerColumns = ["customer", "client", "cliente", "customer_code", "client_code", "codigo_cliente"]
  const qtyColumns = ["qty", "quantity", "cantidad", "consumo", "consumption", "demand", "demanda"]
  const dateColumns = ["date", "fecha", "week", "semana", "period", "periodo"]

  return {
    partNum: findBestMatch(keys, partNumColumns) || keys[0],
    customerCode: findBestMatch(keys, customerColumns) || keys[1],
    qty: findBestMatch(keys, qtyColumns) || keys[2],
    date: findBestMatch(keys, dateColumns) || keys[3],
  }
}

function findBestMatch(keys: string[], candidates: string[]): string | null {
  const lowerKeys = keys.map((k) => k.toLowerCase())

  for (const candidate of candidates) {
    const match = lowerKeys.find((key) => key.includes(candidate))
    if (match) {
      return keys[lowerKeys.indexOf(match)]
    }
  }

  return null
}

function extractValue(record: RawConsumptionRecord, columnName: string): any {
  return record[columnName] || ""
}

function parseDate(dateValue: any): Date | null {
  if (!dateValue) return null

  if (dateValue instanceof Date) {
    return dateValue
  }

  if (typeof dateValue === "string") {
    // Try various date formats
    const formats = [
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
      /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
      /^\d{4}-W\d{2}$/, // ISO Week format
    ]

    for (const format of formats) {
      if (format.test(dateValue)) {
        const parsed = new Date(dateValue)
        if (!isNaN(parsed.getTime())) {
          return parsed
        }
      }
    }
  }

  if (typeof dateValue === "number") {
    // Excel serial date
    const parsed = new Date((dateValue - 25569) * 86400 * 1000)
    if (!isNaN(parsed.getTime())) {
      return parsed
    }
  }

  return null
}

function getISOWeek(date: Date): string {
  const year = date.getFullYear()
  const start = new Date(year, 0, 1)
  const days = Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000))
  const week = Math.ceil((days + start.getDay() + 1) / 7)

  return `${year}-W${week.toString().padStart(2, "0")}`
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
