"use client"

import { useEffect, useState } from "react"
import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore"
import { signInAnonymously } from "firebase/auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2, AlertTriangle } from "lucide-react"
import { auth, db } from "@/lib/firebase/init-lite"

const SEED_TAG = "seed-v0-evco-dashboard"

type SeedProgress = {
  step: string
  completed: number
  total: number
  status: "pending" | "running" | "completed" | "error"
}

type Client = { id: string; name: string }
type Part = { id: string; number: string; description: string }

export default function SeedPage() {
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [isSeeding, setIsSeeding] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [progress, setProgress] = useState<SeedProgress[]>([])
  const [summary, setSummary] = useState<Record<string, number> | null>(null)

  useEffect(() => {
    async function initAuth() {
      try {
        if (auth.currentUser) {
          setIsSignedIn(true)
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
      }
    }
    initAuth()
  }, [])

  // Helper functions
  function isoDate(date: Date) {
    return date.toISOString()
  }

  function randomBetween(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  function choose<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)]
  }

  function getISOWeek(date: Date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
    const weekStr = String(weekNo).padStart(2, "0")
    return `${d.getUTCFullYear()}-W${weekStr}`
  }

  function weeksBack(n: number): string[] {
    const keys: string[] = []
    const today = new Date()
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(today.getDate() - i * 7)
      keys.push(getISOWeek(d))
    }
    return keys
  }

  const updateProgress = (step: string, completed: number, total: number, status: SeedProgress["status"]) => {
    setProgress((prev) => {
      const existing = prev.find((p) => p.step === step)
      if (existing) {
        existing.completed = completed
        existing.total = total
        existing.status = status
        return [...prev]
      }
      return [...prev, { step, completed, total, status }]
    })
  }

  const seedData = async () => {
    if (!isSignedIn) return

    setIsSeeding(true)
    setProgress([])
    setSummary(null)

    try {
      // Clear previous data
      updateProgress("Limpiando datos anteriores", 0, 8, "running")
      const collections = [
        "ordenes_compra",
        "lineas_orden",
        "forecasts",
        "demanda",
        "inventario",
        "moqs",
        "lead_times",
        "shipments",
      ]
      for (let i = 0; i < collections.length; i++) {
        const snap = await getDocs(query(collection(db, collections[i]), where("seed_tag", "==", SEED_TAG)))
        for (const dSnap of snap.docs) {
          await deleteDoc(doc(db, collections[i], dSnap.id))
        }
        updateProgress("Limpiando datos anteriores", i + 1, 8, "running")
      }
      updateProgress("Limpiando datos anteriores", 8, 8, "completed")

      // Define data
      const clients: Client[] = [
        { id: "VOLK", name: "Volkswagen" },
        { id: "BMW", name: "BMW" },
        { id: "MB", name: "Mercedes-Benz" },
        { id: "TOY", name: "Toyota" },
        { id: "FORD", name: "Ford" },
        { id: "AUDI", name: "Audi" },
        { id: "NISSAN", name: "Nissan" },
      ]

      const parts: Part[] = Array.from({ length: 20 }).map((_, i) => ({
        id: `P${String(i + 1).padStart(3, "0")}`,
        number: `EVP-${1000 + i}`,
        description: `Componente ${i + 1}`,
      }))

      const periodKeys = weeksBack(20)

      // Seed orders
      updateProgress("Creando órdenes de compra", 0, clients.length, "running")
      const orderIds: string[] = []
      let totalOrders = 0
      let totalLines = 0

      for (let clientIdx = 0; clientIdx < clients.length; clientIdx++) {
        const c = clients[clientIdx]
        const clientOrders = randomBetween(30, 60)

        for (let i = 0; i < clientOrders; i++) {
          const created = new Date()
          created.setDate(created.getDate() - randomBetween(0, 120))
          const valor = randomBetween(2500, 85000)

          const orderRef = await addDoc(collection(db, "ordenes_compra"), {
            seed_tag: SEED_TAG,
            cliente_id: c.id,
            cliente_nombre: c.name,
            numero_orden: `${c.id}-OC-${String(i + 1).padStart(4, "0")}`,
            fecha_orden: isoDate(created),
            estado_erp: choose(["procesada", "pendiente_erp"]),
            valor_total: valor,
            created_at: isoDate(created),
            updated_at: isoDate(created),
          })
          orderIds.push(orderRef.id)
          totalOrders++

          // Add lines
          const linesCount = randomBetween(2, 8)
          for (let ln = 0; ln < linesCount; ln++) {
            const part = choose(parts)
            const qty = randomBetween(50, 1200)
            const price = randomBetween(8, 250)
            await addDoc(collection(db, "lineas_orden"), {
              seed_tag: SEED_TAG,
              orden_id: orderRef.id,
              cliente_id: c.id,
              cliente_nombre: c.name,
              part_id: part.id,
              part_number: part.number,
              cantidad: qty,
              precio: price,
              valor_linea: qty * price,
              created_at: isoDate(created),
              updated_at: isoDate(created),
            })
            totalLines++
          }
        }
        updateProgress("Creando órdenes de compra", clientIdx + 1, clients.length, "running")
      }
      updateProgress("Creando órdenes de compra", clients.length, clients.length, "completed")

      // Seed forecasts
      updateProgress("Creando forecasts", 0, clients.length * parts.length, "running")
      let forecastCount = 0
      for (let clientIdx = 0; clientIdx < clients.length; clientIdx++) {
        const c = clients[clientIdx]
        for (let partIdx = 0; partIdx < parts.length; partIdx++) {
          const p = parts[partIdx]

          if (Math.random() < 0.3) continue // Skip some combinations

          let clientBase = randomBetween(300, 2500)
          let internalBase = Math.round(clientBase * (0.9 + Math.random() * 0.2))

          for (let i = 0; i < periodKeys.length; i++) {
            const k = periodKeys[i]

            const seasonality = Math.sin((i / periodKeys.length) * 2 * Math.PI) * 0.2
            const trend = (i / periodKeys.length) * 0.1 - 0.05
            const noise = (Math.random() - 0.5) * 0.3

            const clientMultiplier = 1 + seasonality + trend + noise
            const internalMultiplier = 1 + seasonality + trend + (Math.random() - 0.5) * 0.25

            const clientQty = Math.max(0, Math.round(clientBase * clientMultiplier))
            const internalQty = Math.max(0, Math.round(internalBase * internalMultiplier))

            if (Math.random() < 0.05) {
              clientBase = Math.round(clientBase * (1.5 + Math.random() * 0.8))
              internalBase = Math.round(internalBase * (1.4 + Math.random() * 0.7))
            }

            const created = new Date()
            await addDoc(collection(db, "forecasts"), {
              seed_tag: SEED_TAG,
              clientId: c.id,
              clientName: c.name,
              partId: p.id,
              partNumber: p.number,
              periodKey: k,
              qty: clientQty,
              source: "client",
              version: 1,
              created_at: isoDate(created),
            })

            await addDoc(collection(db, "forecasts"), {
              seed_tag: SEED_TAG,
              clientId: c.id,
              clientName: c.name,
              partId: p.id,
              partNumber: p.number,
              periodKey: k,
              qty: internalQty,
              source: "internal",
              version: 1,
              created_at: isoDate(created),
            })
            forecastCount += 2
          }
          updateProgress(
            "Creando forecasts",
            clientIdx * parts.length + partIdx + 1,
            clients.length * parts.length,
            "running",
          )
        }
      }
      updateProgress("Creando forecasts", clients.length * parts.length, clients.length * parts.length, "completed")

      // Seed demand
      updateProgress("Creando demanda", 0, clients.length * parts.length, "running")
      let demandCount = 0
      for (let clientIdx = 0; clientIdx < clients.length; clientIdx++) {
        const c = clients[clientIdx]
        for (let partIdx = 0; partIdx < parts.length; partIdx++) {
          const p = parts[partIdx]

          if (Math.random() < 0.3) continue

          const demandBase = randomBetween(250, 2200)

          for (let i = 0; i < periodKeys.length; i++) {
            const k = periodKeys[i]
            const variation = (Math.random() - 0.5) * 0.4
            const demandQty = Math.max(0, Math.round(demandBase * (1 + variation)))

            await addDoc(collection(db, "demanda"), {
              seed_tag: SEED_TAG,
              clientId: c.id,
              clientName: c.name,
              partId: p.id,
              partNumber: p.number,
              periodKey: k,
              qty: demandQty,
              created_at: isoDate(new Date()),
            })
            demandCount++
          }
          updateProgress(
            "Creando demanda",
            clientIdx * parts.length + partIdx + 1,
            clients.length * parts.length,
            "running",
          )
        }
      }
      updateProgress("Creando demanda", clients.length * parts.length, clients.length * parts.length, "completed")

      // Seed MOQs, Lead Times, Inventory, Shipments
      updateProgress("Creando MOQs y configuraciones", 0, 4, "running")

      let moqCount = 0
      for (const c of clients) {
        for (const p of parts) {
          if (Math.random() < 0.4) continue
          await addDoc(collection(db, "moqs"), {
            seed_tag: SEED_TAG,
            clientId: c.id,
            partId: p.id,
            partNumber: p.number,
            moq: randomBetween(100, 1000),
            vigente_desde: isoDate(new Date()),
            vigente_hasta: null,
          })
          moqCount++
        }
      }
      updateProgress("Creando MOQs y configuraciones", 1, 4, "running")

      for (const p of parts) {
        await addDoc(collection(db, "lead_times"), {
          seed_tag: SEED_TAG,
          partId: p.id,
          partNumber: p.number,
          lead_time_days: randomBetween(7, 60),
          vigente_desde: isoDate(new Date()),
          vigente_hasta: null,
        })
      }
      updateProgress("Creando MOQs y configuraciones", 2, 4, "running")

      for (const p of parts) {
        await addDoc(collection(db, "inventario"), {
          seed_tag: SEED_TAG,
          partId: p.id,
          partNumber: p.number,
          qty: randomBetween(500, 8000),
          fecha_corte: isoDate(new Date()),
          ubicacion: choose(["WH-01", "WH-02", "WH-03"]),
        })
      }
      updateProgress("Creando MOQs y configuraciones", 3, 4, "running")

      let shipmentCount = 0
      for (let i = 0; i < 800; i++) {
        const c = choose(clients)
        const p = choose(parts)
        const promised = new Date()
        promised.setDate(promised.getDate() - randomBetween(5, 45))

        const clientPerformance = c.id === "BMW" || c.id === "AUDI" ? 0.85 : 0.7
        const onTime = Math.random() < clientPerformance

        const delay = onTime ? randomBetween(-3, 2) : randomBetween(3, 15)
        const delivered = new Date(promised)
        delivered.setDate(promised.getDate() + delay)

        await addDoc(collection(db, "shipments"), {
          seed_tag: SEED_TAG,
          clientId: c.id,
          clientName: c.name,
          partId: p.id,
          partNumber: p.number,
          qty: randomBetween(100, 1500),
          promised_date: isoDate(promised),
          delivered_date: isoDate(delivered),
          created_at: isoDate(new Date()),
        })
        shipmentCount++
      }
      updateProgress("Creando MOQs y configuraciones", 4, 4, "completed")

      setSummary({
        clientes: clients.length,
        productos: parts.length,
        semanas: periodKeys.length,
        ordenes: totalOrders,
        lineas: totalLines,
        forecasts: forecastCount,
        demanda: demandCount,
        moqs: moqCount,
        inventario: parts.length,
        leadTimes: parts.length,
        shipments: shipmentCount,
      })
    } catch (error) {
      console.error("Error seeding:", error)
      updateProgress("Error", 0, 1, "error")
    } finally {
      setIsSeeding(false)
    }
  }

  const clearData = async () => {
    if (!isSignedIn) return

    setIsClearing(true)
    try {
      const collections = [
        "ordenes_compra",
        "lineas_orden",
        "forecasts",
        "demanda",
        "inventario",
        "moqs",
        "lead_times",
        "shipments",
      ]

      for (const collName of collections) {
        const snap = await getDocs(query(collection(db, collName), where("seed_tag", "==", SEED_TAG)))
        for (const dSnap of snap.docs) {
          await deleteDoc(doc(db, collName, dSnap.id))
        }
      }

      setSummary(null)
      setProgress([])
    } catch (error) {
      console.error("Error clearing:", error)
    } finally {
      setIsClearing(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Seed Dashboard Data</h1>
        <p className="text-muted-foreground">
          Carga datos mock completos para probar todas las métricas del Dashboard EVCO
        </p>
      </div>

      {authError && (
        <Alert className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {authError}
            <div className="mt-2 text-xs">
              <strong>Reglas temporales sugeridas:</strong>
              <pre className="mt-1 p-2 bg-muted rounded text-xs">
                {`rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null 
        && resource.data.seed_tag == "seed-v0-evco-dashboard";
    }
  }
}`}
              </pre>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Cargar Datos Mock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Esto creará datos completos para todas las métricas del dashboard:
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>7 clientes con 30-60 órdenes cada uno</li>
                <li>20 productos con variaciones realistas</li>
                <li>20 semanas de forecasts (cliente + interno)</li>
                <li>Demanda histórica con patrones estacionales</li>
                <li>MOQs, Lead Times, Inventario, 800+ Shipments</li>
              </ul>
            </div>
            <Button onClick={seedData} disabled={!isSignedIn || isSeeding || isClearing} className="w-full">
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Cargar Mock a Firebase"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limpiar Datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Elimina todos los documentos con seed_tag del dashboard.
            </div>
            <Button
              onClick={clearData}
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
                "Borrar Mock"
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
            <CardTitle>Resumen de Datos Creados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Clientes</div>
                <div className="text-2xl font-bold">{summary.clientes}</div>
              </div>
              <div>
                <div className="font-medium">Productos</div>
                <div className="text-2xl font-bold">{summary.productos}</div>
              </div>
              <div>
                <div className="font-medium">Órdenes</div>
                <div className="text-2xl font-bold">{summary.ordenes}</div>
              </div>
              <div>
                <div className="font-medium">Líneas</div>
                <div className="text-2xl font-bold">{summary.lineas}</div>
              </div>
              <div>
                <div className="font-medium">Forecasts</div>
                <div className="text-2xl font-bold">{summary.forecasts}</div>
              </div>
              <div>
                <div className="font-medium">Demanda</div>
                <div className="text-2xl font-bold">{summary.demanda}</div>
              </div>
              <div>
                <div className="font-medium">MOQs</div>
                <div className="text-2xl font-bold">{summary.moqs}</div>
              </div>
              <div>
                <div className="font-medium">Shipments</div>
                <div className="text-2xl font-bold">{summary.shipments}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 text-center">
        <Button variant="outline" asChild>
          <a href="/dashboard/evco">Ver Dashboard EVCO</a>
        </Button>
      </div>
    </div>
  )
}
