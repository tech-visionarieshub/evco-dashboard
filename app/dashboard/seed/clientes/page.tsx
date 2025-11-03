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

// Importar los datos correctos de ambos archivos
import { clientesDatabase } from "@/data/clientes-database"
import { clientesData } from "@/data/clientes-lookup"

const SEED_TAG = "real-data"

type SeedProgress = {
  step: string
  completed: number
  total: number
  status: "pending" | "running" | "completed" | "error"
}

export default function SeedClientesPage() {
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

  function isoDate(date: Date) {
    return date.toISOString()
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
      updateProgress("Limpiando datos anteriores", 0, 2, "running")
      const collections = ["clientes", "clientesLookup"]

      for (let i = 0; i < collections.length; i++) {
        const snap = await getDocs(query(collection(db, collections[i]), where("seed_tag", "==", SEED_TAG)))
        for (const dSnap of snap.docs) {
          await deleteDoc(doc(db, collections[i], dSnap.id))
        }
        updateProgress("Limpiando datos anteriores", i + 1, 2, "running")
      }
      updateProgress("Limpiando datos anteriores", 2, 2, "completed")

      // Seed clientes
      updateProgress("Creando clientes", 0, clientesDatabase.length, "running")
      let clientesCount = 0

      for (let i = 0; i < clientesDatabase.length; i++) {
        const cliente = clientesDatabase[i]
        const created = new Date()

        await addDoc(collection(db, "clientes"), {
          seed_tag: SEED_TAG,
          custId: cliente.custId,
          name: cliente.name,
          created_at: isoDate(created),
          updated_at: isoDate(created),
        })

        clientesCount++
        updateProgress("Creando clientes", i + 1, clientesDatabase.length, "running")
      }
      updateProgress("Creando clientes", clientesDatabase.length, clientesDatabase.length, "completed")

      // Seed clientes lookup
      updateProgress("Creando clientes lookup", 0, clientesData.length, "running")
      let lookupCount = 0

      for (let i = 0; i < clientesData.length; i++) {
        const item = clientesData[i]
        const created = new Date()

        await addDoc(collection(db, "clientesLookup"), {
          seed_tag: SEED_TAG,
          custId: item.custId,
          name: item.name,
          partNum: item.partNum,
          xPartNum: item.xPartNum,
          description: item.description,
          shipmentType: item.shipmentType,
          shipToNum: item.shipToNum,
          created_at: isoDate(created),
          updated_at: isoDate(created),
        })

        lookupCount++
        updateProgress("Creando clientes lookup", i + 1, clientesData.length, "running")
      }
      updateProgress("Creando clientes lookup", clientesData.length, clientesData.length, "completed")

      setSummary({
        clientes: clientesCount,
        clientesLookup: lookupCount,
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
      const collections = ["clientes", "clientesLookup"]

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
        <h1 className="text-2xl font-bold mb-2">Seed Clientes Data</h1>
        <p className="text-muted-foreground">Carga datos de clientes y lookup para el sistema EVCO</p>
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
        && (resource.data.seed_tag == "seed-v0-evco-dashboard"
            || resource.data.seed_tag == "real-data");
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
            <CardTitle>Cargar Datos de Clientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Esto creará datos de clientes en Firebase:
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>{clientesDatabase.length} clientes básicos</li>
                <li>{clientesData.length} registros de lookup con parts</li>
                <li>Timestamps y seed_tag para identificación</li>
              </ul>
            </div>
            <Button onClick={seedData} disabled={!isSignedIn || isSeeding || isClearing} className="w-full">
              {isSeeding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cargando...
                </>
              ) : (
                "Cargar Clientes a Firebase"
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Limpiar Datos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">Elimina todos los documentos con seed_tag de clientes.</div>
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
                "Borrar Datos de Clientes"
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
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-medium">Clientes</div>
                <div className="text-2xl font-bold">{summary.clientes}</div>
              </div>
              <div>
                <div className="font-medium">Clientes Lookup</div>
                <div className="text-2xl font-bold">{summary.clientesLookup}</div>
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
