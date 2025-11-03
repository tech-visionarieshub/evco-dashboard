export interface NormalizationOptions {
  monthlyStrategy?: "none" | "proRata"
}

export interface ForecastRow {
  clientId: string
  partId: string
  periodKey: string // YYYY-Www or YYYY-MM
  qty: number
  [key: string]: any
}

export function normalizeToIsoWeeks(rows: ForecastRow[], opts: NormalizationOptions = {}): ForecastRow[] {
  const { monthlyStrategy = "none" } = opts

  if (monthlyStrategy === "none") {
    return rows // No conversion, return as-is
  }

  const normalized: ForecastRow[] = []

  for (const row of rows) {
    if (isMonthlyPeriod(row.periodKey)) {
      if (monthlyStrategy === "proRata") {
        // Convert monthly to weekly using pro-rata distribution
        const weeklyRows = convertMonthlyToWeekly(row)
        normalized.push(...weeklyRows)
      } else {
        normalized.push(row) // Keep as monthly
      }
    } else {
      normalized.push(row) // Already weekly or other format
    }
  }

  return normalized
}

function isMonthlyPeriod(periodKey: string): boolean {
  // Check if format is YYYY-MM (monthly)
  return /^\d{4}-\d{2}$/.test(periodKey)
}

function convertMonthlyToWeekly(row: ForecastRow): ForecastRow[] {
  const [year, month] = row.periodKey.split("-").map(Number)
  const weeksInMonth = getIsoWeeksInMonth(year, month)
  const qtyPerWeek = row.qty / weeksInMonth.length

  return weeksInMonth.map((weekKey) => ({
    ...row,
    periodKey: weekKey,
    qty: Math.round(qtyPerWeek * 100) / 100, // Round to 2 decimals
  }))
}

function getIsoWeeksInMonth(year: number, month: number): string[] {
  const weeks: string[] = []
  const firstDay = new Date(year, month - 1, 1)
  const lastDay = new Date(year, month, 0)

  const current = new Date(firstDay)

  while (current <= lastDay) {
    const isoWeek = getIsoWeek(current)
    const weekKey = `${isoWeek.year}-W${isoWeek.week.toString().padStart(2, "0")}`

    if (!weeks.includes(weekKey)) {
      weeks.push(weekKey)
    }

    current.setDate(current.getDate() + 7)
  }

  return weeks
}

function getIsoWeek(date: Date): { year: number; week: number } {
  const target = new Date(date.valueOf())
  const dayNr = (date.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7))
  }
  const week = 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000)
  return { year: target.getFullYear(), week }
}
