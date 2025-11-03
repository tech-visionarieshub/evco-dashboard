import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore"
import { getDb } from "@/lib/firebase/client"
import type { Cliente, ClienteInsert, ClienteUpdate } from "@/lib/firebase/types"

const COLL_CLIENTES = "clientes"

export class ClientesService {
  static async obtenerTodos(): Promise<Cliente[]> {
    const db = getDb()
    const q = query(collection(db, COLL_CLIENTES), orderBy("name", "asc"))
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
  }

  static async buscarPorCustId(custId: string): Promise<Cliente | null> {
    const db = getDb()
    const q = query(collection(db, COLL_CLIENTES), where("cust_id", "==", custId), limit(1))
    const snap = await getDocs(q)
    if (snap.empty) return null
    const docSnap = snap.docs[0]
    return { id: docSnap.id, ...(docSnap.data() as any) }
  }

  static async buscarPorNombre(nombre: string): Promise<Cliente[]> {
    const todos = await this.obtenerTodos()
    const n = nombre.toLowerCase()
    return todos.filter((c) => (c.name || "").toLowerCase().includes(n))
  }

  static async crear(cliente: ClienteInsert): Promise<Cliente> {
    const db = getDb()
    const nowIso = new Date().toISOString()
    const ref = await addDoc(collection(db, COLL_CLIENTES), {
      cust_id: cliente.cust_id,
      name: cliente.name,
      created_at: nowIso,
      updated_at: nowIso,
    })
    return {
      id: ref.id,
      cust_id: cliente.cust_id,
      name: cliente.name,
      created_at: nowIso,
      updated_at: nowIso,
    } as Cliente
  }

  static async actualizar(id: string, updates: ClienteUpdate): Promise<Cliente> {
    const db = getDb()
    const nowIso = new Date().toISOString()
    await updateDoc(doc(db, COLL_CLIENTES, id), { ...updates, updated_at: nowIso })
    const lista = await this.obtenerTodos()
    const actualizado = lista.find((c) => c.id === id)
    if (!actualizado) throw new Error("Cliente no encontrado tras actualizar")
    return actualizado
  }

  static async eliminar(id: string): Promise<void> {
    const db = getDb()
    await deleteDoc(doc(db, COLL_CLIENTES, id))
  }
}
