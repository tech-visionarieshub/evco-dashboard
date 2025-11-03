"use client"

import { useEffect, useMemo, useState } from "react"
import { signInAnonymously } from "firebase/auth"
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/init-lite"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Loader2, XCircle } from "lucide-react"

const SEED_TAG = "seed-v0-evco-dashboard" // same tag used by la página de seed
const DEFAULT_PARTS = [
  { id: "EVP-1001", desc: "Arnés principal" },
  { id: "EVP-1002", desc: "Sensor de temperatura" },
  { id: "EVP-1003", desc: "Módulo de control" },
  { id: "EVP-1004", desc: "Conector 12 pines" },
  { id: "EVP-1005", desc: "Chicote motor" },
  { id: "EVP-1006", desc: "Arnés salpicadero" },
  { id: "EVP-1007", desc: "Conjunto luces" },
  { id: "EVP-1008", desc: "Cable batería" },
  { id: "EVP-1009", desc: "Módulo telecom" },
  { id: "EVP-1010", desc: "Sensor velocidad" },
]

type ClienteLite = { id: string; name: string }

type SeedProgress = {
  step: string
  completed: number
  total: number
  status: "pending" | "running" | "completed" | "error"
}

function isoDate(date: Date) {
  return date.toISOString()
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function choose<T>(arr: T[]) {
  return arr[Math.floor(Math.random() * arr.length)]
}

export default function SeedAlinearPage() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [loadingClientes, setLoadingClientes] = useState(false)
  const [clientes, setClientes] = useState<ClienteLite[]>([])
  const [parts, setParts] = useState(DEFAULT_PARTS)

  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [progress, setProgress] = useState<SeedProgress[]>([])
  const [summary, setSummary] = useState<Record<string, number> | null>(null)

  // Auth igual que /dashboard/seed
  useEffect(() => {
    async function initAuth() {
      try {
        if (auth.currentUser) {
          setIsSignedIn(true)
          setAuthError(null)
          return
        }
        await signInAnonymously(auth)
        setIsSignedIn(true)
        setAuthError(null)
      } catch (error: any) {
        console.error("Auth error:", error)
        if (error.code === "auth/configuration-not-found") {
          setAuthError("Firebase Auth no está configurado. Habilita 'Anonymous' en Firebase Console.")
        } else if (error.code === "auth/operation-not-allowed") {
          setAuthError("Autenticación anónima no permitida. Habilítala en Firebase Console.")
        } else {
          setAuthError(`Error de autenticación: ${error.message}`)
        }
        setIsSignedIn(false)
      }
    }
    initAuth()
  }, [])

  // Carga nombres reales desde la colección "clientes"
  const loadClientes = async () => {
    if (!isSignedIn) return
    setLoadingClientes(true)
    try {
      const snap = await getDocs(collection(db, "clientes"))
      const list: ClienteLite[] = []
      snap.forEach((doc) => {
        const d = doc.data() as any
        const id = (d.cust_id || d.id || doc.id || "").toString().trim()
        const name = (d.name || d.nombre || id || "SIN_NOMBRE").toString().trim()
        if (id) list.push({ id, name })
      })
      // Si la base no tiene clientes, usar un fallback simple basado en dashboard anterior
      if (list.length === 0) {
        const fallback = [
          { id: "VOLK", name: "Volkswagen" },
          { id: "BMW", name: "BMW" },
          { id: "MB", name: "Mercedes-Benz" },
          { id: "TOY", name: "Toyota" },
          { id: "FORD", name: "Ford" },
          { id: "AUDI", name: "Audi" },
          { id: "NISSAN", name: "Nissan" },
        ]
        setClientes(fallback)
      } else {
        setClientes(list)
      }
    } catch (e) {
      console.error("Error cargando clientes:", e)
    } finally {
      setLoadingClientes(false)
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      loadClientes()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn])

  // Helpers progreso
  const updateProgress = (step: string, completed: number, total: number, status: SeedProgress["status"]) => {
    setProgress((prev) => {
      const next = [...prev]
      const idx = next.findIndex((p) => p.step === step)
      if (idx >= 0) {
        next[idx] = { step, completed, total, status }
      } else {
        next.push({ step, completed, total, status })
      }
      return next
    })
  }

  // Seeding solo de órdenes/lineas alineadas a clientes
  const seedAlignedOrders = async () => {
    if (!isSignedIn) return
    if (clientes.length === 0) {
      await loadClientes()
      if (clientes.length === 0) return
    }

    setIsSeeding(true)
    setProgress([])
    setSummary(null)

    try {
      // Limpiar datos anteriores con el mismo seed_tag solo en ordenes/lineas
      updateProgress("Limpiando datos anteriores", 0, 2, "running")
      const toClear = ["ordenes_compra", "lineas_orden"]
      for (let i = 0; i < toClear.length; i++) {
        const snap = await getDocs(query(collection(db, toClear[i]), where("seed_tag", "==", SEED_TAG)))
        for (const dSnap of snap.docs) {
          await deleteDoc(doc(db, toClear[i], dSnap.id))
        }
        updateProgress("Limpiando datos anteriores", i + 1, 2, "running")
      }
      updateProgress("Limpiando datos anteriores", 2, 2, "completed")

      // Sembrar
      updateProgress("Creando órdenes alineadas a clientes", 0, clientes.length, "running")
      const today = new Date()
      const daysBack = 120

      let totalOrders = 0
      let totalLines = 0
      const orderIds: string[] = []

      for (let cIdx = 0; cIdx < clientes.length; cIdx++) {
        const c = clientes[cIdx]
        const clientOrders = randomBetween(18, 40) // un poco menos que el seed completo

        for (let i = 0; i < clientOrders; i++) {
          const created = new Date(today)
          created.setDate(today.getDate() - randomBetween(0, daysBack))
          const estado = Math.random() < 0.7 ? "procesada" : "pendiente_erp"
          const linesCount = randomBetween(2, 6)
          let valorTotal = 0

          // Primero crear el doc de orden con valor 0, y luego actualizar el total (o simplemente calcular antes)
          // Aquí sumaremos sobre la marcha y guardamos en el addDoc final.
          const linesPreview: Array<{ part: { id: string; desc: string }; qty: number; price: number }> = []
          for (let ln = 0; ln < linesCount; ln++) {
            const part = choose(parts)
            const qty = randomBetween(20, 600)
            const price = randomBetween(12, 300)
            valorTotal += qty * price
            linesPreview.push({ part, qty, price })
          }

          const orderRef = await addDoc(collection(db, "ordenes_compra"), {
            seed_tag: SEED_TAG,
            cliente_id: c.id,
            cliente_nombre: c.name,
            numero_orden: `${c.id}-OC-${String(i + 1).padStart(4, "0")}`,
            fecha_orden: isoDate(created),
            estado_erp: estado,
            valor_total: Math.round(valorTotal),
            created_at: isoDate(created),
            updated_at: isoDate(created),
          })
          orderIds.push(orderRef.id)
          totalOrders++

          // Agregar líneas
          for (let ln = 0; ln < linesPreview.length; ln++) {
            const lp = linesPreview[ln]
            await addDoc(collection(db, "lineas_orden"), {
              seed_tag: SEED_TAG,
              orden_id: orderRef.id,
              cliente_id: c.id,
              cliente_nombre: c.name,
              part_id: lp.part.id,
              part_number: lp.part.id,
              descripcion: lp.part.desc,
              cantidad: lp.qty,
              precio: lp.price,
              valor_linea: lp.qty * lp.price,
              created_at: isoDate(created),
              updated_at: isoDate(created),
            })
            totalLines++
          }
        }
        updateProgress("Creando órdenes alineadas a clientes", cIdx + 1, clientes.length, "running")
      }
      updateProgress("Creando órdenes alineadas a clientes", clientes.length, clientes.length, "completed")

      setSummary({
        clientes: clientes.length,
        ordenes: totalOrders,
        lineas: totalLines,
      })
    } catch (error) {
      console.error("Error seeding aligned orders:", error)
      updateProgress("Error", 0, 1, "error")
    } finally {
      setIsSeeding(false)
    }
  }

  const clearAlignedOrders = async () => {
    if (!isSignedIn) return
    setIsClearing(true)
    try {
      const toClear = ["ordenes_compra", "lineas_orden"]
      for (const coll of toClear) {
        const snap = await getDocs(query(collection(db, coll), where("seed_tag", "==", SEED_TAG)))
        for (const dSnap of snap.docs) {
          await deleteDoc(doc(db, coll, dSnap.id))
        }
      }
      setSummary(null)
      setProgress([])
    } catch (e) {
      console.error("Error clearing aligned orders:", e)
    } finally {
      setIsClearing(false)
    }
  }

  const clientesPreview = useMemo(() => clientes.slice(0, 12), [clientes])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Seed Órdenes Alineadas a Clientes</h1>
        <p className="text-muted-foreground">
          Genera órdenes de compra y líneas usando los nombres reales de la colección {"'"}clientes{"'"} en Firebase.
        </p>
      </div>

      {authError && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {authError}
            <div className="mt-2 text-xs">
              <strong>Reglas temporales sugeridas (solo para mock con seed_tag):</strong>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null
        && request.resource.data.seed_tag == "${SEED_TAG}";
    }
  }
}`}
              </pre>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Clientes detectados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Se usarán estos clientes para generar órdenes y líneas. Si la lista está vacía, se usará un fallback
            estándar (Volkswagen, BMW, etc.).
          </div>
          <div className="flex flex-wrap gap-2">
            {loadingClientes ? (
              <div className="flex items-center text-sm">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Cargando clientes...
              </div>
            ) : clientesPreview.length > 0 ? (
              clientesPreview.map((c) => (
                <Badge key={c.id} variant="secondary">
                  {c.name} ({c.id})
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Sin clientes encontrados en la colección.</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadClientes} disabled={!isSignedIn || loadingClientes}>
              {loadingClientes ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Actualizando...
                </>
              ) : (
                "Recargar clientes"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cargar Órdenes Mock (Alineado)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              - Genera 18–40 órdenes por cliente en los últimos 120 días.{"\n"}- 2–6 líneas por orden, con valores
              realistas.{"\n"}- Marca documentos con seed_tag para fácil limpieza.
            </div>
            <Button onClick={seedAlignedOrders} disabled={!isSignedIn || isSeeding || isClearing} className="w-full">
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando...
                </>
              ) : (
                "Generar órdenes alineadas"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limpiar Órdenes Mock (Alineado)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Elimina documentos de ordenes_compra y lineas_orden con seed_tag.
            </div>
            <Button
              onClick={clearAlignedOrders}
              disabled={!isSignedIn || isSeeding || isClearing}
              variant="destructive"
              className="w-full"
            >
              {isClearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Borrando...
                </>
              ) : (
                "Borrar Mock Alineado"
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {progress.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Progreso</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {progress.map((p) => (
              <div key={p.step} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{p.step}</span>
                  <div className="flex items-center gap-2">
                    {p.status === "completed" && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {p.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
                    {p.status === "running" && <Loader2 className="h-4 w-4 animate-spin" />}
                    <span className="text-xs text-muted-foreground">
                      {p.completed}/{p.total}
                    </span>
                  </div>
                </div>
                <Progress value={(p.completed / p.total) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {summary && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Resumen</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium">Clientes</div>
              <div className="text-2xl font-bold">{summary.clientes}</div>
            </div>
            <div>
              <div className="font-medium">Órdenes</div>
              <div className="text-2xl font-bold">{summary.ordenes}</div>
            </div>
            <div>
              <div className="font-medium">Líneas</div>
              <div className="text-2xl font-bold">{summary.lineas}</div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 text-center">
        <Button variant="outline" asChild>
          <a href="/">Volver al Dashboard</a>
        </Button>
      </div>
    </div>
  )
}
