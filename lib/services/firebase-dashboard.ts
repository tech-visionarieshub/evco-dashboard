import { collection, getDocs, query, where, orderBy, type QueryConstraint } from "firebase/firestore"
import { getDb } from "@/lib/firebase/client"

// Types
export type DateRange = { start?: string; end?: string }
export type Granularity = "week" | "month" | "quarter" | "year"

export type DashboardFilter = {
  range?: DateRange
  granularity?: Granularity
  clientIds?: string[]
  partNumbers?: string[]
}

export type KPIOrdenes = { totalOrdenes: number; valorTotal: number }
export type SerieItem = { name: string; value: number; color?: string }
export type LinePoint = { periodKey: string; value: number; isPeak?: boolean }
export type TopChange = {
  clientId: string
  clientName?: string
  partId: string
  partNumber?: string
  periodKey: string
  changePct: number
  from: number
  to: number
}

export type MOQCompliance = {
  clientId: string
  clientName?: string
  partId: string
  partNumber?: string
  compliancePercent: number
  totalOrders: number
  compliantOrders: number
}

export type LeadTimePerformance = {
  clientId: string
  clientName?: string
  onTimePercent: number
  totalShipments: number
  onTimeShipments: number
}

export type DeviationHeatmapItem = {
  partId: string
  partNumber?: string
  periodKey: string
  deviation: number // (demand - forecast) / forecast
  forecast: number
  demand: number
}

export type InventoryExcess = {
  partId: string
  partNumber?: string
  currentStock: number
  projectedDemand: number
  excessWeeks: number
  isExcess: boolean
}

// Helpers
function toIso(d: Date) {
  return d.toISOString()
}

export function defaultDateRange(days = 90): DateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days)
  return { start: toIso(start), end: toIso(end) }
}

function isDashboardFilter(arg: any): arg is DashboardFilter {
  return !!arg && (arg.granularity !== undefined || arg.clientIds !== undefined || arg.partNumbers !== undefined)
}

function asDate(val: any): Date | null {
  if (!val) return null
  if (val instanceof Date) return val
  if (typeof val?.toDate === "function") return val.toDate()
  const d = new Date(val)
  return isNaN(d.getTime()) ? null : d
}

function withinRange(date: Date | null, range?: DateRange): boolean {
  if (!range || (!range.start && !range.end)) return true
  if (!date) return false
  const start = range.start ? new Date(range.start) : null
  const end = range.end ? new Date(range.end) : null
  if (start && date < start) return false
  if (end && date > end) return false
  return true
}

function parsePeriodKeyToDate(key: string | undefined): Date | null {
  if (!key) return null
  const weekMatch = key.match(/^(\d{4})-W(\d{2})$/)
  if (weekMatch) {
    const year = Number(weekMatch[1])
    const week = Number(weekMatch[2])
    const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7))
    const dow = simple.getUTCDay()
    const ISOweekStart = new Date(simple)
    if (dow <= 4) ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1)
    else ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay())
    return ISOweekStart
  }
  const monthMatch = key.match(/^(\d{4})-(\d{2})$/)
  if (monthMatch) {
    const year = Number(monthMatch[1])
    const month = Number(monthMatch[2]) - 1
    return new Date(Date.UTC(year, month, 1))
  }
  const quarterMatch = key.match(/^(\d{4})-Q([1-4])$/)
  if (quarterMatch) {
    const year = Number(quarterMatch[1])
    const q = Number(quarterMatch[2])
    const month = (q - 1) * 3
    return new Date(Date.UTC(year, month, 1))
  }
  const d = new Date(key)
  return isNaN(d.getTime()) ? null : d
}

function formatByGranularity(d: Date, granularity: Granularity): string {
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth() + 1
  switch (granularity) {
    case "week": {
      const temp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
      temp.setUTCDate(temp.getUTCDate() + 3 - ((temp.getUTCDay() + 6) % 7))
      const week1 = new Date(Date.UTC(temp.getUTCFullYear(), 0, 4))
      const week =
        1 + Math.round(((temp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getUTCDay() + 6) % 7)) / 7)
      return `${temp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`
    }
    case "month":
      return `${year}-${String(month).padStart(2, "0")}`
    case "quarter": {
      const q = Math.floor((month - 1) / 3) + 1
      return `${year}-Q${q}`
    }
    case "year":
      return `${year}`
  }
}

async function getDocsWithOptionalDateRange(collName: string, dateField: string, range?: DateRange) {
  const db = getDb()
  const startTime = Date.now()
  console.log(`[Firebase] 📊 Consultando colección: ${collName}`, {
    dateField,
    range: range ? { start: range.start, end: range.end } : "sin filtro de fecha",
  })
  
  try {
    if (range?.start || range?.end) {
      const constraints: QueryConstraint[] = []
      if (range.start) constraints.push(where(dateField, ">=", new Date(range.start)))
      if (range.end) constraints.push(where(dateField, "<=", new Date(range.end)))
      const q1 = query(collection(db, collName), ...constraints)
      const snap1 = await getDocs(q1)
      const elapsed = Date.now() - startTime
      console.log(`[Firebase] ✅ Consulta con filtro de fecha completada: ${collName}`, {
        documentos: snap1.size,
        tiempo: `${elapsed}ms`,
        filtros: constraints.length,
      })
      if (!snap1.empty) return snap1
    }
  } catch (error: any) {
    const elapsed = Date.now() - startTime
    console.warn(`[Firebase] ⚠️ Error en consulta con filtro de fecha: ${collName}`, {
      error: error?.message || String(error),
      tiempo: `${elapsed}ms`,
    })
    // ignore and fallback to full collection
  }
  
  const snap = await getDocs(collection(db, collName))
  const elapsed = Date.now() - startTime
  console.log(`[Firebase] ✅ Consulta completa: ${collName}`, {
    documentos: snap.size,
    tiempo: `${elapsed}ms`,
  })
  return snap
}

function filterByClientsParts<T extends Record<string, any>>(
  arr: T[],
  clientIds?: string[],
  partNumbers?: string[],
): T[] {
  let out = arr
  if (clientIds && clientIds.length > 0) {
    out = out.filter((r) => {
      const id = r.clientId ?? r.cliente_id
      return id ? clientIds.includes(id) : false
    })
  }
  if (partNumbers && partNumbers.length > 0) {
    out = out.filter((r) => {
      const pn = r.partNumber ?? r.part_number ?? r.partId ?? r.part_id
      return pn ? partNumbers.includes(pn) : false
    })
  }
  return out
}

// Exports

// KPIs
export async function fetchOrdenesKPIs(rangeOrFilter?: DateRange | DashboardFilter): Promise<KPIOrdenes> {
  const startTime = Date.now()
  console.log(`[Dashboard] 🔍 fetchOrdenesKPIs iniciado`, { filter: rangeOrFilter })
  
  const filter: DashboardFilter = isDashboardFilter(rangeOrFilter) ? rangeOrFilter : { range: rangeOrFilter }
  const snap = await getDocsWithOptionalDateRange("ordenes_compra", "fecha_orden", filter.range)
  let rows: any[] = []
  snap.forEach((d) => rows.push(d.data()))
  console.log(`[Dashboard] 📦 fetchOrdenesKPIs: ${rows.length} documentos obtenidos`)
  
  rows = filterByClientsParts(rows, filter.clientIds, undefined)
  console.log(`[Dashboard] 🔽 fetchOrdenesKPIs: ${rows.length} documentos después de filtros de clientes`)

  let total = 0
  let valor = 0
  rows.forEach((r) => {
    if (!withinRange(asDate(r.fecha_orden || r.fecha), filter.range)) return
    total++
    valor += Number(r.valor_total ?? 0)
  })

  const elapsed = Date.now() - startTime
  const result = { totalOrdenes: total, valorTotal: valor }
  console.log(`[Dashboard] ✅ fetchOrdenesKPIs completado`, {
    ...result,
    tiempo: `${elapsed}ms`,
    documentosProcesados: rows.length,
  })
  
  return result
}

// Órdenes por cliente
export async function fetchOrdenesPorCliente(rangeOrFilter?: DateRange | DashboardFilter): Promise<SerieItem[]> {
  const startTime = Date.now()
  console.log(`[Dashboard] 🔍 fetchOrdenesPorCliente iniciado`, { filter: rangeOrFilter })
  
  const filter: DashboardFilter = isDashboardFilter(rangeOrFilter) ? rangeOrFilter : { range: rangeOrFilter }
  const snap = await getDocsWithOptionalDateRange("ordenes_compra", "fecha_orden", filter.range)
  const map = new Map<string, { name: string; count: number; id: string }>()

  snap.forEach((d) => {
    const data = d.data() as any
    if (!withinRange(asDate(data.fecha_orden || data.fecha), filter.range)) return
    if (filter.clientIds && filter.clientIds.length > 0 && !filter.clientIds.includes(data.cliente_id)) return
    const key = data.cliente_id ?? "SIN"
    const name = data.cliente_nombre ?? key
    if (!map.has(key)) map.set(key, { name, count: 0, id: key })
    map.get(key)!.count += 1
  })

  const result = Array.from(map.values()).map((v) => ({ name: v.name, value: v.count }))
  const elapsed = Date.now() - startTime
  console.log(`[Dashboard] ✅ fetchOrdenesPorCliente completado`, {
    clientes: result.length,
    tiempo: `${elapsed}ms`,
    documentos: snap.size,
  })
  
  return result
}

// Órdenes por producto
export async function fetchOrdenesPorProducto(rangeOrFilter?: DateRange | DashboardFilter): Promise<SerieItem[]> {
  const startTime = Date.now()
  console.log(`[Dashboard] 🔍 fetchOrdenesPorProducto iniciado`, { filter: rangeOrFilter })
  
  const filter: DashboardFilter = isDashboardFilter(rangeOrFilter) ? rangeOrFilter : { range: rangeOrFilter }
  const db = getDb()
  const linesSnap = await getDocs(collection(db, "lineas_orden"))
  console.log(`[Dashboard] 📦 fetchOrdenesPorProducto: ${linesSnap.size} líneas de orden obtenidas`)
  
  const map = new Map<string, { name: string; count: number }>()

  linesSnap.forEach((d) => {
    const data = d.data() as any
    if (!withinRange(asDate(data.fecha_orden || data.fecha), filter.range)) return
    if (filter.clientIds && filter.clientIds.length > 0 && !filter.clientIds.includes(data.cliente_id)) return
    const key = data.part_number ?? data.part_id ?? data.sku_evco ?? "SIN"
    if (filter.partNumbers && filter.partNumbers.length > 0 && !filter.partNumbers.includes(key)) return
    const name = key
    if (!map.has(key)) map.set(key, { name, count: 0 })
    map.get(key)!.count += 1
  })

  const result = Array.from(map.values())
    .map((v) => ({ name: v.name, value: v.count }))
    .slice(0, 12)
    
  const elapsed = Date.now() - startTime
  console.log(`[Dashboard] ✅ fetchOrdenesPorProducto completado`, {
    productos: result.length,
    tiempo: `${elapsed}ms`,
    documentos: linesSnap.size,
  })
  
  return result
}

// Variación de forecast
export async function fetchForecastVariation(
  source: "client" | "internal" = "client",
  points = 12,
  rangeOrFilter?: DateRange | DashboardFilter,
): Promise<LinePoint[]> {
  const startTime = Date.now()
  console.log(`[Dashboard] 🔍 fetchForecastVariation iniciado`, { source, points, filter: rangeOrFilter })
  
  const filter: DashboardFilter = isDashboardFilter(rangeOrFilter) ? rangeOrFilter : { range: rangeOrFilter }
  const db = getDb()
  let snap = await getDocs(query(collection(db, "forecasts"), where("source", "==", source)))
  console.log(`[Dashboard] 📦 fetchForecastVariation: ${snap.size} forecasts con source="${source}"`)
  if (snap.empty) {
    console.log(`[Dashboard] ⚠️  No se encontraron forecasts con source="${source}", obteniendo todos...`)
    snap = await getDocs(collection(db, "forecasts"))
    console.log(`[Dashboard] 📦 fetchForecastVariation: ${snap.size} forecasts totales`)
  }
  const gran = filter.granularity ?? "week"

  const byKey = new Map<string, number>()
  snap.forEach((d) => {
    const data = d.data() as any
    if (filter.clientIds && filter.clientIds.length > 0) {
      const c = data.clientId ?? data.cliente_id
      if (!c || !filter.clientIds.includes(c)) return
    }
    if (filter.partNumbers && filter.partNumbers.length > 0) {
      const pn = data.partNumber ?? data.part_number ?? data.partId ?? data.part_id
      if (!pn || !filter.partNumbers.includes(pn)) return
    }
    const periodKey = (data.periodKey ?? data.periodo) as string | undefined
    const dtt = parsePeriodKeyToDate(periodKey)
    if (!withinRange(dtt, filter.range)) return
    const groupKey = dtt ? formatByGranularity(dtt, gran) : (periodKey ?? "unknown")
    const qty = Number(data.qty ?? data.cantidad ?? 0)
    byKey.set(groupKey, (byKey.get(groupKey) || 0) + qty)
  })

  const all = Array.from(byKey.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-points)
    .map(([periodKey, value]) => ({ periodKey, value }))

  const result: LinePoint[] = all.map((p, idx) => {
    if (idx === 0) return { ...p, isPeak: false }
    const prev = all[idx - 1].value
    const deltaPct = prev === 0 ? 0 : Math.abs((p.value - prev) / prev)
    return { ...p, isPeak: deltaPct >= 0.3 }
  })
  
  const elapsed = Date.now() - startTime
  console.log(`[Dashboard] ✅ fetchForecastVariation completado`, {
    puntos: result.length,
    tiempo: `${elapsed}ms`,
    documentos: snap.size,
  })
  
  return result
}

// Top cambios de forecast (MISSING -> now implemented)
export async function fetchTopForecastChanges(
  source: "client" | "internal" = "client",
  limit = 5,
  rangeOrFilter?: DateRange | DashboardFilter,
): Promise<TopChange[]> {
  const filter: DashboardFilter = isDashboardFilter(rangeOrFilter) ? rangeOrFilter : { range: rangeOrFilter }
  const db = getDb()
  let snap = await getDocs(query(collection(db, "forecasts"), where("source", "==", source)))
  if (snap.empty) snap = await getDocs(collection(db, "forecasts"))

  type Key = string // clientId|partId|periodKey
  const byKey = new Map<Key, number>()
  const meta = new Map<string, { clientId: string; clientName?: string; partId: string; partNumber?: string }>()
  snap.forEach((d) => {
    const data = d.data() as any

    // filter clients/parts
    if (filter.clientIds && filter.clientIds.length > 0) {
      const c = data.clientId ?? data.cliente_id
      if (!c || !filter.clientIds.includes(c)) return
    }
    if (filter.partNumbers && filter.partNumbers.length > 0) {
      const pn = data.partNumber ?? data.part_number ?? data.partId ?? data.part_id
      if (!pn || !filter.partNumbers.includes(pn)) return
    }

    const periodKey = (data.periodKey ?? data.periodo) as string | undefined
    const dt = parsePeriodKeyToDate(periodKey)
    if (!withinRange(dt, filter.range)) return
    const groupKey = dt ? formatByGranularity(dt, filter.granularity ?? "week") : (periodKey ?? "unknown")

    const clientId = (data.clientId ?? data.cliente_id ?? "UNKNOWN").toString()
    const partId = (data.partId ?? data.part_id ?? "UNKNOWN").toString()
    const k: Key = `${clientId}|${partId}|${groupKey}`
    byKey.set(k, Number(data.qty ?? data.cantidad ?? 0))
    meta.set(`${clientId}|${partId}`, {
      clientId,
      clientName: data.clientName ?? data.cliente_nombre,
      partId,
      partNumber: data.partNumber ?? data.part_number,
    })
  })

  // Build pairs of consecutive periods
  const periods = new Set<string>()
  Array.from(byKey.keys()).forEach((k) => periods.add(k.split("|")[2]))
  const sortedPeriods = Array.from(periods).sort()
  const recent = sortedPeriods.slice(-2) // last 2
  if (recent.length < 2) return []
  const [p1, p2] = recent
  const changes: TopChange[] = []
  meta.forEach((m) => {
    const q1 = byKey.get(`${m.clientId}|${m.partId}|${p1}`) ?? 0
    const q2 = byKey.get(`${m.clientId}|${m.partId}|${p2}`) ?? 0
    const changePct = q1 === 0 ? (q2 > 0 ? 1 : 0) : (q2 - q1) / q1
    if (q1 === 0 && q2 === 0) return
    changes.push({
      clientId: m.clientId,
      clientName: m.clientName,
      partId: m.partId,
      partNumber: m.partNumber,
      periodKey: p2,
      changePct,
      from: q1,
      to: q2,
    })
  })
  return changes.sort((a, b) => Math.abs(b.changePct) - Math.abs(a.changePct)).slice(0, limit)
}

// Asertividad
export async function fetchAsertividad(
  source: "client" | "internal" = "client",
  periods = 8,
  rangeOrFilter?: DateRange | DashboardFilter,
): Promise<{ percent: number }> {
  const filter: DashboardFilter = isDashboardFilter(rangeOrFilter) ? rangeOrFilter : { range: rangeOrFilter }
  const db = getDb()
  let fSnap = await getDocs(query(collection(db, "forecasts"), where("source", "==", source)))
  if (fSnap.empty) fSnap = await getDocs(collection(db, "forecasts"))
  const dSnap = await getDocs(collection(db, "demanda"))

  const byPeriod = new Map<string, { forecast: number; demand: number }>()

  fSnap.forEach((d) => {
    const data = d.data() as any
    if (filter.clientIds && filter.clientIds.length > 0) {
      const c = data.clientId ?? data.cliente_id
      if (!c || !filter.clientIds.includes(c)) return
    }
    if (filter.partNumbers && filter.partNumbers.length > 0) {
      const pn = data.partNumber ?? data.part_number ?? data.partId ?? data.part_id
      if (!pn || !filter.partNumbers.includes(pn)) return
    }
    const periodKey = (data.periodKey ?? data.periodo) as string | undefined
    const dtt = parsePeriodKeyToDate(periodKey)
    if (!withinRange(dtt, filter.range)) return
    const k = dtt ? formatByGranularity(dtt, filter.granularity ?? "week") : (periodKey ?? "unknown")
    const f = Number(data.qty ?? data.cantidad ?? 0)
    const rec = byPeriod.get(k) || { forecast: 0, demand: 0 }
    rec.forecast += f
    byPeriod.set(k, rec)
  })

  dSnap.forEach((d) => {
    const data = d.data() as any
    if (filter.clientIds && filter.clientIds.length > 0) {
      const c = data.clientId ?? data.cliente_id
      if (!c || !filter.clientIds.includes(c)) return
    }
    if (filter.partNumbers && filter.partNumbers.length > 0) {
      const pn = data.partNumber ?? data.part_number ?? data.partId ?? data.part_id
      if (!pn || !filter.partNumbers.includes(pn)) return
    }
    const periodKey = (data.periodKey ?? data.periodo) as string | undefined
    const dtt = parsePeriodKeyToDate(periodKey)
    if (!withinRange(dtt, filter.range)) return
    const k = dtt ? formatByGranularity(dtt, filter.granularity ?? "week") : (periodKey ?? "unknown")
    const q = Number(data.qty ?? data.cantidad ?? 0)
    const rec = byPeriod.get(k) || { forecast: 0, demand: 0 }
    rec.demand += q
    byPeriod.set(k, rec)
  })

  const keys = Array.from(byPeriod.keys()).sort().slice(-periods)
  if (keys.length === 0) return { percent: 0 }
  let acc = 0
  let n = 0
  keys.forEach((p) => {
    const rec = byPeriod.get(p)!
    if ((rec?.forecast ?? 0) > 0) {
      const ratio = Math.min(1, rec.demand / rec.forecast)
      acc += ratio
      n++
    }
  })
  const percent = n === 0 ? 0 : Math.round((acc / n) * 100)
  return { percent }
}

// Volumen Proy vs Demand
export async function fetchVolumenProjVsDemand(
  rangeOrFilter?: DateRange | DashboardFilter,
): Promise<Array<{ name: string; forecast: number; demand: number }>> {
  const filter: DashboardFilter = isDashboardFilter(rangeOrFilter) ? rangeOrFilter : { range: rangeOrFilter }
  const db = getDb()
  const fSnap = await getDocs(collection(db, "forecasts"))
  const dSnap = await getDocs(collection(db, "demanda"))

  const agg = new Map<string, { forecast: number; demand: number }>()
  fSnap.forEach((d) => {
    const data = d.data() as any
    if (filter.clientIds && filter.clientIds.length > 0) {
      const c = data.clientId ?? data.cliente_id
      if (!c || !filter.clientIds.includes(c)) return
    }
    if (filter.partNumbers && filter.partNumbers.length > 0) {
      const pn = data.partNumber ?? data.part_number ?? data.partId ?? data.part_id
      if (!pn || !filter.partNumbers.includes(pn)) return
    }
    const periodKey = (data.periodKey ?? data.periodo) as string | undefined
    const dtt = parsePeriodKeyToDate(periodKey)
    if (!withinRange(dtt, filter.range)) return
    const key = data.clientName ?? data.clientId ?? data.cliente_nombre ?? data.cliente_id ?? "SIN"
    const rec = agg.get(key) || { forecast: 0, demand: 0 }
    rec.forecast += Number(data.qty ?? data.cantidad ?? 0)
    agg.set(key, rec)
  })
  dSnap.forEach((d) => {
    const data = d.data() as any
    if (filter.clientIds && filter.clientIds.length > 0) {
      const c = data.clientId ?? data.cliente_id
      if (!c || !filter.clientIds.includes(c)) return
    }
    if (filter.partNumbers && filter.partNumbers.length > 0) {
      const pn = data.partNumber ?? data.part_number ?? data.partId ?? data.part_id
      if (!pn || !filter.partNumbers.includes(pn)) return
    }
    const periodKey = (data.periodKey ?? data.periodo) as string | undefined
    const dtt = parsePeriodKeyToDate(periodKey)
    if (!withinRange(dtt, filter.range)) return
    const key = data.clientName ?? data.clientId ?? data.cliente_nombre ?? data.cliente_id ?? "SIN"
    const rec = agg.get(key) || { forecast: 0, demand: 0 }
    rec.demand += Number(data.qty ?? data.cantidad ?? 0)
    agg.set(key, rec)
  })

  return Array.from(agg.entries()).map(([name, { forecast, demand }]) => ({ name, forecast, demand }))
}

// MOQ
export async function fetchMOQCompliance(): Promise<MOQCompliance[]> {
  const startTime = Date.now()
  console.log(`[Dashboard] 🔍 fetchMOQCompliance iniciado`)
  
  const db = getDb()
  const [moqsSnap, linesSnap] = await Promise.all([
    getDocs(collection(db, "moqs")),
    getDocs(collection(db, "lineas_orden")),
  ])
  
  console.log(`[Dashboard] 📦 fetchMOQCompliance: ${moqsSnap.size} MOQs, ${linesSnap.size} líneas de orden`)

  const moqMap = new Map<string, { clientId: string; partId: string; moq: number }>()
  moqsSnap.forEach((d) => {
    const data = d.data() as any
    const key = `${data.clientId}|${data.partId}`
    moqMap.set(key, {
      clientId: data.clientId,
      partId: data.partId,
      moq: Number(data.moq || 0),
    })
  })

  const compliance = new Map<
    string,
    {
      clientId: string
      clientName?: string
      partId: string
      partNumber?: string
      total: number
      compliant: number
    }
  >()

  linesSnap.forEach((d) => {
    const data = d.data() as any
    const key = `${data.cliente_id || "UNKNOWN"}|${data.part_id}`
    const moq = moqMap.get(key)?.moq || 0
    const qty = Number(data.cantidad || 0)

    if (!compliance.has(key)) {
      compliance.set(key, {
        clientId: data.cliente_id || "UNKNOWN",
        clientName: data.cliente_nombre,
        partId: data.part_id,
        partNumber: data.part_number,
        total: 0,
        compliant: 0,
      })
    }

    const record = compliance.get(key)!
    record.total += 1
    if (qty >= moq) {
      record.compliant += 1
    }
  })

  const result = Array.from(compliance.values())
    .map((record) => ({
      clientId: record.clientId,
      clientName: record.clientName,
      partId: record.partId,
      partNumber: record.partNumber,
      compliancePercent: record.total > 0 ? Math.round((record.compliant / record.total) * 100) : 0,
      totalOrders: record.total,
      compliantOrders: record.compliant,
    }))
    .slice(0, 10)
    
  const elapsed = Date.now() - startTime
  console.log(`[Dashboard] ✅ fetchMOQCompliance completado`, {
    items: result.length,
    tiempo: `${elapsed}ms`,
  })
  
  return result
}

// Lead time
export async function fetchLeadTimePerformance(): Promise<LeadTimePerformance[]> {
  const db = getDb()
  const [shipmentsSnap, leadTimesSnap] = await Promise.all([
    getDocs(collection(db, "shipments")),
    getDocs(collection(db, "lead_times")),
  ])

  const leadTimeMap = new Map<string, number>()
  leadTimesSnap.forEach((d) => {
    const data = d.data() as any
    const id = data.partId ?? data.part_id
    if (!id) return
    leadTimeMap.set(id, Number(data.lead_time_days || 0))
  })

  const performance = new Map<
    string,
    {
      clientId: string
      clientName?: string
      total: number
      onTime: number
    }
  >()

  shipmentsSnap.forEach((d) => {
    const data = d.data() as any
    const clientId = data.clientId ?? data.cliente_id ?? "UNKNOWN"
    const partId = data.partId ?? data.part_id ?? "UNKNOWN"
    const promisedDate = new Date(data.promised_date)
    const deliveredDate = new Date(data.delivered_date)
    const leadTimeDays = leadTimeMap.get(partId) || 14
    const actualDays = Math.ceil((deliveredDate.getTime() - promisedDate.getTime()) / (1000 * 60 * 60 * 24))

    if (!performance.has(clientId)) {
      performance.set(clientId, {
        clientId,
        clientName: data.clientName ?? data.cliente_nombre,
        total: 0,
        onTime: 0,
      })
    }

    const record = performance.get(clientId)!
    record.total += 1
    if (actualDays <= leadTimeDays) {
      record.onTime += 1
    }
  })

  return Array.from(performance.values())
    .map((record) => ({
      clientId: record.clientId,
      clientName: record.clientName,
      onTimePercent: record.total > 0 ? Math.round((record.onTime / record.total) * 100) : 0,
      totalShipments: record.total,
      onTimeShipments: record.onTime,
    }))
    .slice(0, 8)
}

// Heatmap
export async function fetchDeviationHeatmap(): Promise<DeviationHeatmapItem[]> {
  const db = getDb()
  const [forecastSnap, demandSnap] = await Promise.all([
    getDocs(collection(db, "forecasts")),
    getDocs(collection(db, "demanda")),
  ])

  const forecastMap = new Map<string, { forecast: number; partNumber?: string }>()
  forecastSnap.forEach((d) => {
    const data = d.data() as any
    const partId = data.partId ?? data.part_id
    const periodKey = data.periodKey ?? data.periodo
    if (!partId || !periodKey) return
    const key = `${partId}|${periodKey}`
    const existing = forecastMap.get(key) || { forecast: 0, partNumber: data.partNumber ?? data.part_number }
    existing.forecast += Number(data.qty ?? data.cantidad ?? 0)
    forecastMap.set(key, existing)
  })

  const demandMap = new Map<string, number>()
  demandSnap.forEach((d) => {
    const data = d.data() as any
    const partId = data.partId ?? data.part_id
    const periodKey = data.periodKey ?? data.periodo
    if (!partId || !periodKey) return
    const key = `${partId}|${periodKey}`
    const existing = demandMap.get(key) || 0
    demandMap.set(key, existing + Number(data.qty ?? data.cantidad ?? 0))
  })

  const deviations: DeviationHeatmapItem[] = []
  forecastMap.forEach((forecastData, key) => {
    const [partId, periodKey] = key.split("|")
    const demand = demandMap.get(key) || 0
    const forecast = forecastData.forecast

    if (forecast > 0) {
      const deviation = (demand - forecast) / forecast
      deviations.push({
        partId,
        partNumber: forecastData.partNumber,
        periodKey,
        deviation,
        forecast,
        demand,
      })
    }
  })

  return deviations.slice(0, 50)
}

// Inventario excedente
export async function fetchInventoryExcess(): Promise<InventoryExcess[]> {
  const db = getDb()
  const [inventorySnap, demandSnap] = await Promise.all([
    getDocs(collection(db, "inventario")),
    getDocs(collection(db, "demanda")),
  ])

  const inventoryMap = new Map<string, { stock: number; partNumber?: string }>()
  inventorySnap.forEach((d) => {
    const data = d.data() as any
    const id = data.partId ?? data.part_id
    if (!id) return
    inventoryMap.set(id, {
      stock: Number(data.qty || 0),
      partNumber: data.partNumber ?? data.part_number,
    })
  })

  const demandMap = new Map<string, number>()
  demandSnap.forEach((d) => {
    const data = d.data() as any
    const partId = data.partId ?? data.part_id
    const qty = Number(data.qty ?? data.cantidad ?? 0)
    if (!partId) return
    demandMap.set(partId, (demandMap.get(partId) || 0) + qty)
  })

  const excess: InventoryExcess[] = []
  inventoryMap.forEach((invData, partId) => {
    const weeklyDemand = (demandMap.get(partId) || 0) / 8
    const projectedDemand = weeklyDemand * 4
    const excessWeeks = weeklyDemand > 0 ? invData.stock / weeklyDemand : 0

    excess.push({
      partId,
      partNumber: invData.partNumber,
      currentStock: invData.stock,
      projectedDemand: Math.round(projectedDemand),
      excessWeeks: Math.round(excessWeeks * 10) / 10,
      isExcess: excessWeeks > 6,
    })
  })

  return excess.sort((a, b) => b.excessWeeks - a.excessWeeks).slice(0, 10)
}

// Extras
export async function getForecastHistory() {
  const db = getDb()
  const q = query(collection(db, "forecast_files"), orderBy("createdAt", "desc"))
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
    createdAt: (doc.data() as any).createdAt?.toDate?.() || new Date(),
  }))
}

export async function getForecastDataForDownload(clientId: string, sourceFileId?: string) {
  const db = getDb()
  let q = query(collection(db, "forecasts"), where("clientId", "==", clientId))
  if (sourceFileId) {
    q = query(q, where("sourceFileId", "==", sourceFileId))
  }
  const snapshot = await getDocs(q)
  return snapshot.docs.map((doc) => doc.data())
}
