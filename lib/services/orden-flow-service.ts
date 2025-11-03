import {
  collection,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/client"
import type { HistorialProcesamiento, LineaOrden, OrdenCompra } from "@/lib/firebase/types"

export interface OrdenFlowData {
  customerId: string
  poNumber: string
  fechaOrden: string
  fechaRequerimiento?: string
  canalRecepcion: string
  shipTo: string
  tipoOrden: string
  moneda: string
  archivoOriginal?: string
  contenidoOriginal?: string
  lineas: {
    numeroLinea: number
    skuCliente: string
    skuEvco: string
    descripcion: string
    cantidad: number
    precio: number
    unidad: string
    shipTo?: string
  }[]
}

export interface OrdenCompletaData extends OrdenCompra {
  lineas: LineaOrden[]
  historial?: HistorialProcesamiento[]
}

const COLL_ORDENES = "ordenes_compra"
const COLL_LINEAS = "lineas_orden"
const COLL_HISTORIAL = "historial_procesamiento"

// Helper para mapear de la app (camelCase) a la DB (snake_case)
const mapToDb = (data: OrdenFlowData) => ({
  customer_id: data.customerId,
  po_number: data.poNumber,
  fecha_orden: data.fechaOrden,
  fecha_requerimiento: data.fechaRequerimiento ?? null,
  canal_recepcion: data.canalRecepcion,
  ship_to: data.shipTo,
  tipo_orden: data.tipoOrden,
  moneda: data.moneda,
  estado: "borrador",
  progreso_paso: 1,
  archivo_original: data.archivoOriginal ?? null,
  contenido_original: data.contenidoOriginal ?? null,
  progreso_temporal: null,
})

// Helper para mapear de la DB (snake_case) a la app (camelCase)
const mapOrdenFromDb = (docData: any, id: string): OrdenCompra => ({
  id,
  poNumber: docData.po_number,
  customerId: docData.customer_id,
  fechaOrden: docData.fecha_orden,
  fechaRequerimiento: docData.fecha_requerimiento,
  shipTo: docData.ship_to,
  tipoOrden: docData.tipo_orden,
  moneda: docData.moneda,
  estado: docData.estado,
  canalRecepcion: docData.canal_recepcion,
  archivoOriginal: docData.archivo_original,
  contenidoOriginal: docData.contenido_original,
  progresoPaso: docData.progreso_paso,
  progresoTemporal: docData.progreso_temporal,
  datosExtraidos: docData.datos_extraidos,
  confianza: docData.confianza,
  advertencias: docData.advertencias,
  createdAt: docData.created_at,
  updatedAt: docData.updated_at,
})

const mapLineaFromDb = (docData: any, id: string): LineaOrden => ({
  id,
  ordenId: docData.orden_id,
  numeroLinea: docData.numero_linea,
  skuCliente: docData.sku_cliente,
  skuEvco: docData.sku_evco,
  descripcion: docData.descripcion,
  cantidad: docData.cantidad,
  precio: docData.precio,
  unidad: docData.unidad,
  shipTo: docData.ship_to,
  createdAt: docData.created_at,
  updatedAt: docData.updated_at,
})

export class OrdenFlowService {
  static async crearOrdenCompleta(data: OrdenFlowData): Promise<string> {
    const db = getDb()
    const nowIso = new Date().toISOString()

    const ordenDataDb = {
      ...mapToDb(data),
      created_at: nowIso,
      updated_at: nowIso,
      created_at_ts: serverTimestamp(),
      updated_at_ts: serverTimestamp(),
    }

    const ordenRef = await addDoc(collection(db, COLL_ORDENES), ordenDataDb)
    const ordenId = ordenRef.id

    if (data.lineas?.length) {
      const ops = data.lineas.map((l) =>
        addDoc(collection(db, COLL_LINEAS), {
          orden_id: ordenId,
          numero_linea: l.numeroLinea,
          sku_cliente: l.skuCliente,
          sku_evco: l.skuEvco,
          descripcion: l.descripcion,
          cantidad: l.cantidad,
          precio: l.precio,
          unidad: l.unidad,
          ship_to: l.shipTo ?? null,
          created_at: nowIso,
          updated_at: nowIso,
          created_at_ts: serverTimestamp(),
          updated_at_ts: serverTimestamp(),
        }),
      )
      await Promise.all(ops)
    }

    await this.crearHistorial(ordenId, "creada", "Orden creada exitosamente")
    return ordenId
  }

  static async obtenerOrdenCompleta(ordenId: string): Promise<OrdenCompletaData | null> {
    const db = getDb()

    const snap = await getDoc(doc(db, COLL_ORDENES, ordenId))
    if (!snap.exists()) return null

    const orden = mapOrdenFromDb(snap.data(), snap.id)

    const lineasQ = query(collection(db, COLL_LINEAS), where("orden_id", "==", ordenId), orderBy("numero_linea", "asc"))
    const lineasSnap = await getDocs(lineasQ)
    const lineas: LineaOrden[] = lineasSnap.docs.map((d) => mapLineaFromDb(d.data(), d.id))

    return { ...orden, lineas }
  }

  static async guardarProgresoTemporal(ordenId: string, progreso: Partial<OrdenFlowData>): Promise<void> {
    const db = getDb()
    await updateDoc(doc(db, COLL_ORDENES, ordenId), {
      progreso_temporal: progreso,
      updated_at: new Date().toISOString(),
      updated_at_ts: serverTimestamp(),
    })
  }

  static async actualizarProgreso(ordenId: string, paso: number): Promise<void> {
    const db = getDb()
    await updateDoc(doc(db, COLL_ORDENES, ordenId), {
      progreso_paso: paso,
      updated_at: new Date().toISOString(),
      updated_at_ts: serverTimestamp(),
    })
    await this.crearHistorial(ordenId, "progreso", `Progreso actualizado a paso ${paso}`)
  }

  static async cambiarEstado(ordenId: string, nuevoEstado: string, comentario?: string): Promise<void> {
    const db = getDb()
    await updateDoc(doc(db, COLL_ORDENES, ordenId), {
      estado: nuevoEstado,
      updated_at: new Date().toISOString(),
      updated_at_ts: serverTimestamp(),
    })
    await this.crearHistorial(ordenId, nuevoEstado, comentario || `Estado cambiado a ${nuevoEstado}`)
  }

  static async limpiarProgresoTemporal(ordenId: string): Promise<void> {
    const db = getDb()
    await updateDoc(doc(db, COLL_ORDENES, ordenId), {
      progreso_temporal: null,
      updated_at: new Date().toISOString(),
      updated_at_ts: serverTimestamp(),
    })
  }

  static async obtenerOrdenesPorEstado(estado: string): Promise<OrdenCompra[]> {
    const db = getDb()
    const q = query(collection(db, COLL_ORDENES), where("estado", "==", estado), orderBy("created_at", "desc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => mapOrdenFromDb(d.data(), d.id))
  }

  static async obtenerHistorialOrden(ordenId: string): Promise<HistorialProcesamiento[]> {
    const db = getDb()
    const q = query(collection(db, COLL_HISTORIAL), where("orden_id", "==", ordenId), orderBy("fecha_evento", "desc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => {
      const h = d.data() as any
      return {
        id: d.id,
        orden_id: h.orden_id,
        evento: h.evento,
        descripcion: h.descripcion,
        metadatos: h.metadatos,
        fecha_evento: h.fecha_evento,
      }
    })
  }

  private static async crearHistorial(
    ordenId: string,
    evento: string,
    descripcion: string,
    metadatos?: any,
  ): Promise<void> {
    const db = getDb()
    await addDoc(collection(db, COLL_HISTORIAL), {
      orden_id: ordenId,
      evento,
      descripcion,
      metadatos: metadatos ?? null,
      fecha_evento: new Date().toISOString(),
      fecha_evento_ts: serverTimestamp(),
    })
  }

  static async eliminarOrden(ordenId: string): Promise<void> {
    const db = getDb()
    const lq = query(collection(db, COLL_LINEAS), where("orden_id", "==", ordenId))
    const lSnap = await getDocs(lq)
    await Promise.all(lSnap.docs.map((d) => deleteDoc(doc(db, COLL_LINEAS, d.id))))
    const hq = query(collection(db, COLL_HISTORIAL), where("orden_id", "==", ordenId))
    const hSnap = await getDocs(hq)
    await Promise.all(hSnap.docs.map((d) => deleteDoc(doc(db, COLL_HISTORIAL, d.id))))
    await deleteDoc(doc(db, COLL_ORDENES, ordenId))
  }
}
