"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { getFirebaseDb, getFirebaseStorage } from "@/lib/firebase/client"
import { collection, addDoc, getDocs, orderBy, query, serverTimestamp, Timestamp, limit } from "firebase/firestore"
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"
import { CheckCircle2, XCircle, Upload, Database } from "lucide-react"

type TestDoc = {
  message: string
  createdAt: string | Timestamp
}

export default function PruebaFirebasePage() {
  const [firestoreStatus, setFirestoreStatus] = useState<"idle" | "ok" | "error">("idle")
  const [storageStatus, setStorageStatus] = useState<"idle" | "ok" | "error">("idle")
  const [log, setLog] = useState<string>("")
  const [docs, setDocs] = useState<TestDoc[]>([])
  const [file, setFile] = useState<File | null>(null)
  const [downloadURL, setDownloadURL] = useState<string>("")

  const appendLog = (msg: string) => setLog((prev) => `${prev}${prev ? "\n" : ""}${msg}`)

  async function probarFirestore() {
    setFirestoreStatus("idle")
    setLog("")
    setDocs([])
    try {
      const db = getFirebaseDb()
      appendLog("Escribiendo documento de prueba...")
      await addDoc(collection(db, "test_connection"), {
        message: "Hola Firestore desde EVCO",
        createdAt: serverTimestamp(),
        env: {
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "desconocido",
          bucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "desconocido",
        },
      })
      appendLog("Leyendo últimos documentos...")
      const snap = await getDocs(query(collection(db, "test_connection"), orderBy("createdAt", "desc"), limit(5)))
      const items: TestDoc[] = snap.docs.map((d) => d.data() as any)
      setDocs(items)
      setFirestoreStatus("ok")
      appendLog("Firestore OK ✅")
    } catch (err: any) {
      console.error(err)
      setFirestoreStatus("error")
      appendLog(`Error Firestore ❌: ${err?.message || String(err)}`)
    }
  }

  async function subirAStorage() {
    setStorageStatus("idle")
    setDownloadURL("")
    try {
      const storage = getFirebaseStorage()
      let toUpload: File
      if (file) {
        toUpload = file
        appendLog(`Archivo seleccionado: ${file.name}`)
      } else {
        const blob = new Blob([`Archivo de prueba - ${new Date().toISOString()}`], { type: "text/plain" })
        toUpload = new File([blob], "archivo-prueba.txt", { type: "text/plain" })
        appendLog("Generando archivo de prueba: archivo-prueba.txt")
      }
      const storageRef = ref(storage, `test-uploads/${Date.now()}-${toUpload.name}`)
      appendLog("Subiendo a Storage...")
      await uploadBytes(storageRef, toUpload)
      const url = await getDownloadURL(storageRef)
      setDownloadURL(url)
      setStorageStatus("ok")
      appendLog("Storage OK ✅")
    } catch (err: any) {
      console.error(err)
      setStorageStatus("error")
      appendLog(`Error Storage ❌: ${err?.message || String(err)}`)
    }
  }

  return (
    <main className="container mx-auto max-w-3xl py-10">
      <Card>
        <CardHeader>
          <CardTitle>Prueba de Conexión Firebase</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Firestore
                </h3>
                {firestoreStatus === "ok" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : firestoreStatus === "error" ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground mt-2">Crea y lista documentos de test_connection.</p>
              <Button onClick={probarFirestore} className="mt-3">
                Probar Firestore
              </Button>
              <div className="rounded-md border bg-white p-3 mt-3">
                <p className="text-xs text-gray-500 mb-2">Últimos documentos:</p>
                <ul className="space-y-1 text-sm">
                  {docs.map((d, idx) => (
                    <li key={idx} className="flex items-center justify-between">
                      <span>{d.message}</span>
                      <span className="text-xs text-gray-500">
                        {d.createdAt instanceof Timestamp
                          ? d.createdAt.toDate().toLocaleString()
                          : typeof d.createdAt === "string"
                            ? new Date(d.createdAt).toLocaleString()
                            : "—"}
                      </span>
                    </li>
                  ))}
                  {docs.length === 0 && <li className="text-xs text-gray-400">Sin datos aún</li>}
                </ul>
              </div>
            </div>

            <div className="p-4 rounded border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Storage
                </h3>
                {storageStatus === "ok" ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : storageStatus === "error" ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : null}
              </div>
              <div className="mt-3 space-y-2">
                <Label htmlFor="file">Archivo (opcional)</Label>
                <Input id="file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </div>
              <Button onClick={subirAStorage} className="mt-3">
                Subir a Storage
              </Button>
              {downloadURL && (
                <p className="text-sm mt-2">
                  URL:{" "}
                  <a
                    className="text-emerald-600 underline break-all"
                    href={downloadURL}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {downloadURL}
                  </a>
                </p>
              )}
            </div>
          </section>

          <section className="space-y-2">
            <Label>Log</Label>
            <Textarea value={log} onChange={(e) => setLog(e.target.value)} className="min-h-[140px]" />
          </section>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <div className="font-semibold mb-1">Proyecto</div>
              <div>Project ID: {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "no definido"}</div>
              <div>Bucket: {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "no definido"}</div>
            </div>
            <div>
              <div className="font-semibold mb-1">Estado</div>
              <div>
                Firestore: {firestoreStatus === "ok" ? "OK" : firestoreStatus === "error" ? "Error" : "Pendiente"}
              </div>
              <div>Storage: {storageStatus === "ok" ? "OK" : storageStatus === "error" ? "Error" : "Pendiente"}</div>
            </div>
          </section>
        </CardContent>
      </Card>
    </main>
  )
}
