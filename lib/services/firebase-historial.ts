import { collection, addDoc, getDocs, query, where, orderBy, deleteDoc, doc } from "firebase/firestore"
import { getDb } from "@/lib/firebase/client"
import type { HistorialProcesamiento } from "@/lib/firebase/types"

const COLL_HISTORIAL = "historial_procesamiento"

export class HistorialService {
  static async crear(ordenId: string, evento: string, descripcion: string, metadatos?: any): Promise<string> {
    const db = getDb()
    const nowIso = new Date().toISOString()
    const ref = await addDoc(collection(db, COLL_HISTORIAL), {
      orden_id: ordenId,
      evento,
      descripcion,
      metadatos: metadatos ?? null,
      fecha_evento: nowIso,
    })
    return ref.id
  }

  static async obtenerPorOrden(ordenId: string): Promise<HistorialProcesamiento[]> {
    const db = getDb()
    const q = query(collection(db, COLL_HISTORIAL), where("orden_id", "==", ordenId), orderBy("fecha_evento", "desc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as HistorialProcesamiento[]
  }

  static async obtenerReciente(limite = 50): Promise<HistorialProcesamiento[]> {
    const db = getDb()
    const q = query(collection(db, COLL_HISTORIAL), orderBy("fecha_evento", "desc"))
    const snap = await getDocs(q)
    const all = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as HistorialProcesamiento[]
    return all.slice(0, limite)
  }

  static async obtenerPorEvento(evento: string): Promise<HistorialProcesamiento[]> {
    const db = getDb()
    const q = query(collection(db, COLL_HISTORIAL), where("evento", "==", evento), orderBy("fecha_evento", "desc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as HistorialProcesamiento[]
  }

  static async eliminar(id: string): Promise<void> {
    const db = getDb()
    await deleteDoc(doc(db, COLL_HISTORIAL, id))
  }

  static async limpiarPorOrden(ordenId: string): Promise<void> {
    const db = getDb()
    const q = query(collection(db, COLL_HISTORIAL), where("orden_id", "==", ordenId))
    const snap = await getDocs(q)
    await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, COLL_HISTORIAL, d.id))))
  }
}
