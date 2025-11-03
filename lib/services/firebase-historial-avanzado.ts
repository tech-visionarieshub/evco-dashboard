import { collection, getDocs, query, orderBy } from "firebase/firestore"
import { getDb } from "@/lib/firebase/client"
import type { HistorialProcesamiento } from "@/lib/firebase/types"

export interface FiltrosHistorial {
  fechaDesde?: string
  fechaHasta?: string
  estado?: string
  cliente?: string
  usuario?: string
  evento?: string
}

export interface EstadisticasHistorial {
  totalOrdenes: number
  ordenesPorEstado: Record<string, number>
  ordenesPorMes: Array<{ mes: string; cantidad: number }>
  clientesActivos: number
  promedioLineasPorOrden: number
}

const COLL_HISTORIAL = "historial_procesamiento"
const COLL_ORDENES = "ordenes_compra"
const COLL_LINEAS = "lineas_orden"

export class HistorialAvanzadoService {
  static async obtenerHistorialConFiltros(
    filtros: FiltrosHistorial,
    pagina = 1,
    limite = 50,
  ): Promise<{
    historial: HistorialProcesamiento[]
    total: number
    paginas: number
  }> {
    const db = getDb()
    const qBase = query(collection(db, COLL_HISTORIAL), orderBy("fecha_evento", "desc"))
    const snap = await getDocs(qBase)

    let historial = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as HistorialProcesamiento[]
    if (filtros.evento) historial = historial.filter((h) => (h as any).evento === filtros.evento)
    if (filtros.fechaDesde) historial = historial.filter((h) => (h as any).fecha_evento >= filtros.fechaDesde!)
    if (filtros.fechaHasta) historial = historial.filter((h) => (h as any).fecha_evento <= filtros.fechaHasta!)

    const total = historial.length
    const paginas = Math.ceil(total / limite)
    const start = (pagina - 1) * limite
    const end = start + limite

    return {
      historial: historial.slice(start, end),
      total,
      paginas,
    }
  }

  static async obtenerEstadisticas(fechaDesde?: string, fechaHasta?: string): Promise<EstadisticasHistorial> {
    const db = getDb()

    const oSnap = await getDocs(query(collection(db, COLL_ORDENES), orderBy("created_at", "desc")))
    let ordenes = oSnap.docs.map((d) => d.data() as any)
    if (fechaDesde) ordenes = ordenes.filter((o) => (o.created_at || "") >= fechaDesde)
    if (fechaHasta) ordenes = ordenes.filter((o) => (o.created_at || "") <= fechaHasta)

    const totalOrdenes = ordenes.length
    const ordenesPorEstado: Record<string, number> = {}
    const clientes = new Set<string>()
    for (const o of ordenes) {
      ordenesPorEstado[o.estado] = (ordenesPorEstado[o.estado] || 0) + 1
      if (o.customer_id) clientes.add(o.customer_id)
    }

    const lSnap = await getDocs(collection(db, COLL_LINEAS))
    const totalLineas = lSnap.size

    const ordenesPorMes: Array<{ mes: string; cantidad: number }> = []
    const fechaActual = new Date()
    for (let i = 11; i >= 0; i--) {
      const f = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - i, 1)
      const y = f.getFullYear()
      const m = f.getMonth() + 1
      const mesClave = `${y}-${String(m).padStart(2, "0")}`
      const cantidad = ordenes.filter((o) => (o.created_at || "").startsWith(mesClave)).length
      ordenesPorMes.push({ mes: f.toLocaleDateString("es-ES", { month: "short", year: "numeric" }), cantidad })
    }

    return {
      totalOrdenes,
      ordenesPorEstado,
      ordenesPorMes,
      clientesActivos: clientes.size,
      promedioLineasPorOrden: totalOrdenes ? Math.round(totalLineas / totalOrdenes) : 0,
    }
  }

  static async exportarHistorialCSV(filtros: FiltrosHistorial): Promise<string> {
    const { historial } = await this.obtenerHistorialConFiltros(filtros, 1, 10000)
    const headers = ["ID", "Orden ID", "Evento", "Descripción", "Fecha", "Metadatos"]
    const rows = historial.map((item: any) => [
      item.id,
      item.orden_id,
      item.evento,
      item.descripcion,
      item.fecha_evento,
      JSON.stringify(item.metadatos || {}),
    ])
    return [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n")
  }

  static async obtenerEventosFrecuentes(
    limite = 10,
  ): Promise<Array<{ evento: string; cantidad: number; ultimaFecha: string }>> {
    const db = getDb()
    const snap = await getDocs(query(collection(db, COLL_HISTORIAL), orderBy("fecha_evento", "desc")))
    const eventosMap = new Map<string, { cantidad: number; ultimaFecha: string }>()
    snap.docs.forEach((d) => {
      const h = d.data() as any
      const e = h.evento
      const f = h.fecha_evento
      if (eventosMap.has(e)) {
        const cur = eventosMap.get(e)!
        cur.cantidad++
        if (f > cur.ultimaFecha) cur.ultimaFecha = f
      } else {
        eventosMap.set(e, { cantidad: 1, ultimaFecha: f })
      }
    })
    return Array.from(eventosMap.entries())
      .map(([evento, data]) => ({ evento, cantidad: data.cantidad, ultimaFecha: data.ultimaFecha }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limite)
  }

  static async limpiarHistorialAntiguo(diasAntiguedad = 90): Promise<number> {
    const db = getDb()
    const limite = new Date()
    limite.setDate(limite.getDate() - diasAntiguedad)
    const iso = limite.toISOString()
    const snap = await getDocs(collection(db, COLL_HISTORIAL))
    const antiguos = snap.docs.filter((d) => ((d.data() as any).fecha_evento || "") < iso)
    for (const d of antiguos) {
      await import("firebase/firestore").then(({ deleteDoc, doc: dref }) => deleteDoc(dref(db, COLL_HISTORIAL, d.id)))
    }
    return antiguos.length
  }

  static async obtenerActividadDiaria(
    fechaDesde: string,
    fechaHasta: string,
  ): Promise<Array<{ fecha: string; eventos: number; ordenes: number }>> {
    const db = getDb()
    const hsnap = await getDocs(query(collection(db, COLL_HISTORIAL), orderBy("fecha_evento", "asc")))
    const osnap = await getDocs(query(collection(db, COLL_ORDENES), orderBy("created_at", "asc")))

    const eventosMap = new Map<string, number>()
    hsnap.docs.forEach((d) => {
      const f = ((d.data() as any).fecha_evento || "").split("T")[0]
      if (f >= fechaDesde && f <= fechaHasta) {
        eventosMap.set(f, (eventosMap.get(f) || 0) + 1)
      }
    })

    const ordenesMap = new Map<string, number>()
    osnap.docs.forEach((d) => {
      const f = ((d.data() as any).created_at || "").split("T")[0]
      if (f >= fechaDesde && f <= fechaHasta) {
        ordenesMap.set(f, (ordenesMap.get(f) || 0) + 1)
      }
    })

    const dias: Array<{ fecha: string; eventos: number; ordenes: number }> = []
    const start = new Date(fechaDesde)
    const end = new Date(fechaHasta)
    for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
      const key = dt.toISOString().split("T")[0]
      dias.push({
        fecha: key,
        eventos: eventosMap.get(key) || 0,
        ordenes: ordenesMap.get(key) || 0,
      })
    }
    return dias
  }
}
