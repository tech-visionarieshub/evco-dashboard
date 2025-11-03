import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase/client"
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  writeBatch,
  query,
  where,
  getDocs,
  type DocumentReference,
  updateDoc,
} from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"

// Tipos de datos
export type ForecastSource = "client" | "internal"

export interface NormalizedRow {
  clientId: string
  partId: string
  periodKey: string // "YYYY-Www"
  qty: number
  version?: string
}

export interface ForecastFileDoc {
  source: ForecastSource
  clientId: string
  format: "weekly" | "monthly"
  nature: "new" | "correction"
  hash: string
  storagePath?: string
  downloadURL?: string
  status: "uploaded" | "processed" | "error"
  modelParams?: {
    name?: string
    version?: string
    comments?: string
  } | null
  createdAt?: any
  rowsCount?: number
}

export interface WriteForecastOptions {
  version?: string
  sourceFileId: string
  source: ForecastSource
}

// Utilidad: hash de archivo (SHA-256)
export async function hashFileSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(digest))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
  return hashHex
}

// Subir archivo original a Storage
export async function uploadForecastFileToStorage(file: File, clientId: string) {
  const storage = getFirebaseStorage()
  const ts = new Date().toISOString().replace(/[:.]/g, "-")
  const safeName = file.name.replace(/\s+/g, "_")
  const path = `forecasts/${clientId}/${ts}_${safeName}`
  const storageRef = ref(storage, path)
  await uploadBytes(storageRef, file, { contentType: file.type || "application/octet-stream" })
  const downloadURL = await getDownloadURL(storageRef)
  return { storagePath: path, downloadURL }
}

// Crear documento forecast_files
export async function createForecastFileDoc(docData: ForecastFileDoc): Promise<DocumentReference> {
  const db = getFirebaseDb()
  const coll = collection(db, "forecast_files")
  const ref = await addDoc(coll, {
    ...docData,
    createdAt: serverTimestamp(),
  })
  return ref
}

// Escribir filas normalizadas en /forecasts (versionado por (clientId, partId, periodKey))
export async function writeNormalizedForecasts(rows: NormalizedRow[], opts: WriteForecastOptions): Promise<void> {
  const db = getFirebaseDb()
  const batch = writeBatch(db)
  const coll = collection(db, "forecasts")

  // Para cada fila: buscar si existe versión previa y escribir/upsert apuntando a sourceFileId
  // Estructura docId: {clientId}-{partId}-{periodKey} para asegurar idempotencia de versionado
  rows.forEach((r) => {
    const id = `${r.clientId}__${r.partId}__${r.periodKey}`
    const ref = doc(coll, id)
    batch.set(
      ref,
      {
        clientId: r.clientId,
        partId: r.partId,
        periodType: "week",
        periodKey: r.periodKey,
        qty: r.qty,
        source: opts.source,
        sourceFileId: opts.sourceFileId,
        version: r.version || opts.version || "1",
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  })

  await batch.commit()
}

// (Opcional) obtener forecasts por source para filtros en dashboard
export async function fetchForecastsBySource(source: ForecastSource) {
  const db = getFirebaseDb()
  const coll = collection(db, "forecasts")
  const q = query(coll, where("source", "==", source))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Finalizar documento forecast_files
export async function finalizeForecastFileDoc(
  fileId: string,
  patch: { status: "processed" | "error"; rowsCount?: number },
) {
  const db = getFirebaseDb()
  const ref = doc(db, "forecast_files", fileId)
  await updateDoc(ref, {
    ...patch,
    updatedAt: serverTimestamp(),
  })
}
