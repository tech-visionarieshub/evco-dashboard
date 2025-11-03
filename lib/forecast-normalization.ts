import { addWeeks, startOfISOWeek, endOfMonth, startOfMonth } from "date-fns"

type DetectedFormat = "weekly" | "monthly"

export interface RawRow {
  // Campos mínimos esperados en hoja
  clientId: string
  partId: string
  // Semanal: WK_01..WK_52
  // Mensual: MM-YYYY
  [key: string]: any
}

export interface NormalizedRow {
  clientId: string
  partId: string
  periodKey: string // "YYYY-Www"
  qty: number
}

// Convertir un Date a clave "YYYY-Www" de ISO week
export function toISOWeekKey(d: Date) {
  // formatISO no da semanas directamente; creamos manualmente usando Intl
  // Usaremos startOfISOWeek para fijar lunes y obtener el número de semana con Intl:
  const start = startOfISOWeek(d)
  // Extraer año ISO y número de semana vía Intl API (compatibilidad buena)
  const iso = new Intl.DateTimeFormat("en-GB", { week: "numeric", year: "numeric" } as any).formatToParts(start)
  const year = iso.find((p: any) => p.type === "year")?.value || String(start.getUTCFullYear())
  const weekNum = iso.find((p: any) => p.type === "week")?.value || "1"
  const ww = String(Number(weekNum)).padStart(2, "0")
  return `${year}-W${ww}`
}

// Normaliza filas semanales con columnas WK_XX a semanas ISO, asumiendo que el año se detecta de contexto.
// Estrategia: si hay campo "year" o "anio", usarlo; si no, usar año actual.
export function normalizeWeeklyRows(rows: RawRow[], detectedYear?: number): NormalizedRow[] {
  const out: NormalizedRow[] = []
  const currentYear = detectedYear || new Date().getFullYear()

  rows.forEach((row) => {
    const clientId = String(row.clientId ?? row.custId ?? "").trim()
    const partId = String(row.partId ?? row.part ?? row["Part #"] ?? row["Part"] ?? "").trim()
    if (!clientId || !partId) return

    Object.keys(row)
      .filter((k) => /^wk[_\s-]*\d{1,2}$/i.test(k))
      .forEach((k) => {
        const wkNum = Number(String(k.match(/\d{1,2}/)?.[0] || "0"))
        const qty = Number(row[k] ?? 0) || 0
        if (wkNum <= 0) return

        // Aproximar lunes ISO de esa semana del año detectado:
        const jan4 = new Date(Date.UTC(currentYear, 0, 4))
        const firstISOWeekStart = startOfISOWeek(jan4) // lunes de la semana 1
        const d = addWeeks(firstISOWeekStart, wkNum - 1)
        const periodKey = toISOWeekKey(d)

        out.push({ clientId, partId, periodKey, qty })
      })
  })
  return out
}

// Normaliza filas mensuales (MM-YYYY): reparte la cantidad del mes entre sus semanas ISO que caen en el mes
export function normalizeMonthlyRows(rows: RawRow[]): NormalizedRow[] {
  const out: NormalizedRow[] = []

  rows.forEach((row) => {
    const clientId = String(row.clientId ?? row.custId ?? "").trim()
    const partId = String(row.partId ?? row.part ?? row["Part #"] ?? row["Part"] ?? "").trim()
    if (!clientId || !partId) return

    const monthlyKeys = Object.keys(row).filter((k) => /^\d{2}-\d{4}$/.test(k)) // MM-YYYY
    monthlyKeys.forEach((k) => {
      const [mmStr, yyyyStr] = k.split("-")
      const mm = Number(mmStr) - 1
      const yyyy = Number(yyyyStr)
      const qtyMonth = Number(row[k] ?? 0) || 0
      if (qtyMonth === 0) return

      const start = startOfMonth(new Date(Date.UTC(yyyy, mm, 1)))
      const end = endOfMonth(start)

      // Caminar por semanas ISO dentro del mes
      const weekKeys = new Set<string>()
      for (let d = start; d <= end; d = addWeeks(d, 1)) {
        const wkKey = toISOWeekKey(d)
        weekKeys.add(wkKey)
      }

      // Distribuir equitativamente
      const weeks = Array.from(weekKeys)
      const perWeek = qtyMonth / weeks.length
      weeks.forEach((wk) => {
        out.push({ clientId, partId, periodKey: wk, qty: perWeek })
      })
    })
  })

  return out
}

export function detectFormatFromHeaders(headers: string[]): "weekly" | "monthly" | "unknown" {
  const hasWeekly = headers.some((h) => /^wk[_\s-]*\d{1,2}$/i.test(h))
  const hasMonthly = headers.some((h) => /^\d{2}-\d{4}$/.test(h))
  if (hasWeekly) return "weekly"
  if (hasMonthly) return "monthly"
  return "unknown"
}

// Verifica que periodKey tenga formato YYYY-Www (ISO)
export function isValidISOWeekKey(key: string) {
  return /^\d{4}-W\d{2}$/.test(key)
}

// Normaliza filas que ya traen periodKey (YYYY-Www) y qty
// Espera columnas: clientId, partId, periodKey, qty
export function normalizePeriodKeyRows(rows: RawRow[]): NormalizedRow[] {
  const out: NormalizedRow[] = []
  rows.forEach((row) => {
    const clientId = String(row.clientId ?? row.custId ?? "").trim()
    const partId = String(row.partId ?? row.part ?? row["Part #"] ?? row["Part"] ?? "").trim()
    const periodKey = String(row.periodKey ?? row.week ?? row["period"] ?? "").trim()
    const qty = Number(row.qty ?? row.quantity ?? row["Qty"] ?? row["Quantity"] ?? 0) || 0

    if (!clientId || !partId || !periodKey) return
    if (!isValidISOWeekKey(periodKey)) return

    out.push({ clientId, partId, periodKey, qty })
  })
  return out
}
