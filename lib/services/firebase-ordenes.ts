import {
  collection,
  addDoc,
  getDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  orderBy,
  query,
  where,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/client"
import type {
  OrdenCompra,
  OrdenCompraInsert,
  OrdenCompraUpdate,
  OrdenCompraConCliente,
  OrdenCompraCompleta,
  EstadoOrden,
  Cliente,
  LineaOrden,
  HistorialProcesamiento,
} from "@/lib/firebase/types"

const COLL_ORDENES = "ordenes_compra"
const COLL_LINEAS = "lineas_orden"
const COLL_CLIENTES = "clientes"
const COLL_HISTORIAL = "historial_procesamiento"

export class OrdenesService {
  static async crear(orden: OrdenCompraInsert): Promise<OrdenCompra> {
    const db = getDb()
    const nowIso = new Date().toISOString()
    const ref = await addDoc(collection(db, COLL_ORDENES), {
      numero_orden: (orden as any).numero_orden ?? null,
      customer_id: (orden as any).cliente_id ?? (orden as any).customer_id ?? null,
      fecha_orden: (orden as any).fecha_orden ?? null,
      fecha_requerimiento: (orden as any).fecha_requerimiento ?? null,
      direccion_envio: (orden as any).direccion_envio ?? null,
      tipo_orden: (orden as any).tipo_orden ?? null,
      moneda: (orden as any).moneda ?? null,
      estado: (orden as any).estado ?? "borrador",
      archivo_original: (orden as any).archivo_original ?? null,
      contenido_original: (orden as any).contenido_original ?? null,
      progreso_paso: (orden as any).progreso_paso ?? 1,
      datos_extraidos: (orden as any).datos_extraidos ?? null,
      confianza: (orden as any).confianza ?? null,
      advertencias: (orden as any).advertencias ?? null,
      created_at: nowIso,
      updated_at: nowIso,
    })
    return {
      id: ref.id,
      numero_orden: (orden as any).numero_orden ?? null,
      cliente_id: (orden as any).cliente_id ?? (orden as any).customer_id ?? null,
      fecha_orden: (orden as any).fecha_orden ?? null,
      fecha_requerimiento: (orden as any).fecha_requerimiento ?? null,
      direccion_envio: (orden as any).direccion_envio ?? null,
      tipo_orden: (orden as any).tipo_orden ?? null,
      moneda: (orden as any).moneda ?? null,
      estado: (orden as any).estado ?? "borrador",
      archivo_original: (orden as any).archivo_original ?? null,
      contenido_original: (orden as any).contenido_original ?? null,
      progreso_paso: (orden as any).progreso_paso ?? 1,
      datos_extraidos: (orden as any).datos_extraidos ?? null,
      confianza: (orden as any).confianza ?? null,
      advertencias: (orden as any).advertencias ?? null,
      created_at: nowIso,
      updated_at: nowIso,
    } as OrdenCompra
  }

  static async obtenerPorId(id: string): Promise<OrdenCompraCompleta | null> {
    const db = getDb()
    const snap = await getDoc(doc(db, COLL_ORDENES, id))
    if (!snap.exists()) return null
    const o = { id: snap.id, ...(snap.data() as any) }

    let cliente: Cliente | undefined = undefined
    if (o.customer_id) {
      const qCli = query(collection(db, COLL_CLIENTES), where("cust_id", "==", o.customer_id))
      const cs = await getDocs(qCli)
      if (!cs.empty) {
        const c = cs.docs[0]
        cliente = { id: c.id, ...(c.data() as any) } as Cliente
      }
    }

    const lq = query(collection(db, COLL_LINEAS), where("orden_id", "==", id), orderBy("numero_linea", "asc"))
    const ls = await getDocs(lq)
    const lineas = ls.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as LineaOrden[]

    const hq = query(collection(db, COLL_HISTORIAL), where("orden_id", "==", id), orderBy("fecha_evento", "desc"))
    const hs = await getDocs(hq)
    const historial = hs.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as HistorialProcesamiento[]

    return {
      ...(o as any),
      cliente,
      lineas_orden: lineas,
      historial_procesamiento: historial,
    } as unknown as OrdenCompraCompleta
  }

  static async obtenerTodas(
    page = 1,
    limit = 10,
    estado?: EstadoOrden,
  ): Promise<{ ordenes: OrdenCompraConCliente[]; total: number }> {
    const db = getDb()
    let qBase = query(collection(db, COLL_ORDENES), orderBy("created_at", "desc"))
    if (estado) {
      qBase = query(collection(db, COLL_ORDENES), where("estado", "==", estado), orderBy("created_at", "desc"))
    }
    const snap = await getDocs(qBase)
    const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as any[]

    const total = all.length
    const start = (page - 1) * limit
    const end = start + limit
    const slice = all.slice(start, end)

    const ordenes = await Promise.all(
      slice.map(async (o) => {
        let cliente: Cliente | undefined
        if (o.customer_id) {
          const cq = query(collection(db, COLL_CLIENTES), where("cust_id", "==", o.customer_id))
          const cs = await getDocs(cq)
          if (!cs.empty) {
            const c = cs.docs[0]
            cliente = { id: c.id, ...(c.data() as any) } as Cliente
          }
        }
        return { ...(o as any), cliente } as OrdenCompraConCliente
      }),
    )

    return { ordenes, total }
  }

  static async actualizar(id: string, updates: OrdenCompraUpdate): Promise<OrdenCompra> {
    const db = getDb()
    const nowIso = new Date().toISOString()
    await updateDoc(doc(db, COLL_ORDENES, id), { ...(updates as any), updated_at: nowIso })
    const snap = await getDoc(doc(db, COLL_ORDENES, id))
    return { id: snap.id, ...(snap.data() as any) } as OrdenCompra
  }

  static async actualizarProgreso(id: string, paso: number): Promise<OrdenCompra> {
    return this.actualizar(id, { progreso_paso: paso } as any)
  }

  static async cambiarEstado(id: string, estado: EstadoOrden): Promise<OrdenCompra> {
    return this.actualizar(id, { estado } as any)
  }

  static async obtenerPorEstado(estado: EstadoOrden): Promise<OrdenCompraConCliente[]> {
    const { ordenes } = await this.obtenerTodas(1, 1000, estado)
    return ordenes
  }

  static async buscar(termino: string): Promise<OrdenCompraConCliente[]> {
    const { ordenes } = await this.obtenerTodas(1, 1000)
    const t = termino.toLowerCase()
    return ordenes.filter(
      (o) => (o.numero_orden || "").toLowerCase().includes(t) || (o.direccion_envio || "").toLowerCase().includes(t),
    )
  }

  static async eliminar(id: string): Promise<void> {
    const db = getDb()

    const lq = query(collection(db, COLL_LINEAS), where("orden_id", "==", id))
    const ls = await getDocs(lq)
    await Promise.all(ls.docs.map((d) => deleteDoc(doc(db, COLL_LINEAS, d.id))))

    const hq = query(collection(db, COLL_HISTORIAL), where("orden_id", "==", id))
    const hs = await getDocs(hq)
    await Promise.all(hs.docs.map((d) => deleteDoc(doc(db, COLL_HISTORIAL, d.id))))

    await deleteDoc(doc(db, COLL_ORDENES, id))
  }
}
