import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, deleteDoc } from "firebase/firestore"
import { getDb } from "@/lib/firebase/client"
import type { LineaOrden } from "@/lib/firebase/types"

const COLL_LINEAS = "lineas_orden"

export class LineasOrdenService {
  static async obtenerPorOrden(ordenId: string): Promise<LineaOrden[]> {
    const db = getDb()
    const q = query(collection(db, COLL_LINEAS), where("orden_id", "==", ordenId), orderBy("numero_linea", "asc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as LineaOrden[]
  }

  static async crear(linea: Omit<LineaOrden, "id" | "fechaCreacion" | "fechaActualizacion">): Promise<string> {
    const db = getDb()
    const nowIso = new Date().toISOString()
    const ref = await addDoc(collection(db, COLL_LINEAS), {
      orden_id: (linea as any).ordenId ?? (linea as any).orden_id,
      numero_linea: (linea as any).numeroLinea ?? (linea as any).numero_linea,
      sku_cliente: (linea as any).skuCliente ?? (linea as any).sku_cliente,
      sku_evco: (linea as any).skuEvco ?? (linea as any).sku_evco,
      descripcion: (linea as any).descripcion,
      cantidad: (linea as any).cantidad,
      precio: (linea as any).precio,
      unidad: (linea as any).unidad,
      ship_to: (linea as any).shipTo ?? (linea as any).ship_to ?? null,
      created_at: nowIso,
      updated_at: nowIso,
    })
    return ref.id
  }

  static async actualizar(
    id: string,
    cambios: Partial<Omit<LineaOrden, "id" | "ordenId" | "fechaCreacion" | "fechaActualizacion">>,
  ): Promise<void> {
    const db = getDb()
    const nowIso = new Date().toISOString()
    const payload: any = { updated_at: nowIso }

    if ((cambios as any).numeroLinea !== undefined) payload.numero_linea = (cambios as any).numeroLinea
    if ((cambios as any).skuCliente !== undefined) payload.sku_cliente = (cambios as any).skuCliente
    if ((cambios as any).skuEvco !== undefined) payload.sku_evco = (cambios as any).skuEvco
    if ((cambios as any).descripcion !== undefined) payload.descripcion = (cambios as any).descripcion
    if ((cambios as any).cantidad !== undefined) payload.cantidad = (cambios as any).cantidad
    if ((cambios as any).precio !== undefined) payload.precio = (cambios as any).precio
    if ((cambios as any).unidad !== undefined) payload.unidad = (cambios as any).unidad
    if ((cambios as any).shipTo !== undefined) payload.ship_to = (cambios as any).shipTo

    await updateDoc(doc(db, COLL_LINEAS, id), payload)
  }

  static async eliminar(id: string): Promise<void> {
    const db = getDb()
    await deleteDoc(doc(db, COLL_LINEAS, id))
  }

  static async crearMultiples(
    lineas: Omit<LineaOrden, "id" | "fechaCreacion" | "fechaActualizacion">[],
  ): Promise<string[]> {
    const ids: string[] = []
    for (const l of lineas) {
      const id = await this.crear(l as any)
      ids.push(id)
    }
    return ids
  }

  static async actualizarMultiples(
    ordenId: string,
    lineas: Omit<LineaOrden, "id" | "ordenId" | "fechaCreacion" | "fechaActualizacion">[],
  ): Promise<void> {
    const existentes = await this.obtenerPorOrden(ordenId)
    await Promise.all(existentes.map((l) => this.eliminar(l.id)))
    if (lineas.length) {
      await this.crearMultiples(lineas.map((l) => ({ ...(l as any), ordenId })))
    }
  }
}
