import { addDoc, collection, deleteDoc, doc, getDocs, query, where } from "firebase/firestore"
import { getDb } from "@/lib/firebase/client"

type Client = { id: string; name: string }
type Part = { id: string; number: string; description: string }

// Helpers
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

async function clearPreviousSeed(db: any, seedTag: string) {
  const colls = [
    "ordenes_compra",
    "lineas_orden",
    "forecasts",
    "demanda",
    "inventario",
    "moqs",
    "lead_times",
    "shipments",
  ]
  for (const c of colls) {
    const snap = await getDocs(query(collection(db, c), where("seed_tag", "==", seedTag)))
    for (const dSnap of snap.docs) {
      await deleteDoc(doc(db, c, dSnap.id))
    }
  }
}

async function main() {
  const db = getDb()
  const seedTag = "seed-v0-dashboard"
  console.log("Seeding Firebase with comprehensive mock dashboard data...")

  // Clear previous seed
  await clearPreviousSeed(db, seedTag)

  // Clients and parts
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

  const periodKeys = weeksBack(20) // last ~20 weeks for better analysis

  // Seed orders and lines with more realistic distribution
  const orderStates = ["procesada", "pendiente_erp"] as const
  const ordersPerClient = randomBetween(35, 65) // More variation

  const orderIds: string[] = []
  for (const c of clients) {
    const clientOrders = randomBetween(30, 60)
    for (let i = 0; i < clientOrders; i++) {
      const created = new Date()
      created.setDate(created.getDate() - randomBetween(0, 120)) // 4 months back
      const valor = randomBetween(2500, 85000) // Wider range

      const orderRef = await addDoc(collection(db, "ordenes_compra"), {
        seed_tag: seedTag,
        cliente_id: c.id,
        cliente_nombre: c.name,
        numero_orden: `${c.id}-OC-${String(i + 1).padStart(4, "0")}`,
        fecha_orden: isoDate(created),
        estado_erp: choose(orderStates),
        valor_total: valor,
        created_at: isoDate(created),
        updated_at: isoDate(created),
      })
      orderIds.push(orderRef.id)

      // More realistic line distribution
      const linesCount = randomBetween(2, 8)
      for (let ln = 0; ln < linesCount; ln++) {
        const part = choose(parts)
        const qty = randomBetween(50, 1200)
        const price = randomBetween(8, 250)
        await addDoc(collection(db, "lineas_orden"), {
          seed_tag: seedTag,
          orden_id: orderRef.id,
          cliente_id: c.id, // Added for MOQ compliance calculation
          cliente_nombre: c.name,
          part_id: part.id,
          part_number: part.number,
          cantidad: qty,
          precio: price,
          valor_linea: qty * price,
          created_at: isoDate(created),
          updated_at: isoDate(created),
        })
      }
    }
  }

  // Seed forecasts with more realistic patterns and variations
  for (const c of clients) {
    for (const p of parts) {
      // Skip some combinations to make it more realistic
      if (Math.random() < 0.3) continue

      let clientBase = randomBetween(300, 2500)
      let internalBase = Math.round(clientBase * (0.9 + Math.random() * 0.2))

      for (let i = 0; i < periodKeys.length; i++) {
        const k = periodKeys[i]

        // Add seasonality and trends
        const seasonality = Math.sin((i / periodKeys.length) * 2 * Math.PI) * 0.2
        const trend = (i / periodKeys.length) * 0.1 - 0.05
        const noise = (Math.random() - 0.5) * 0.3

        const clientMultiplier = 1 + seasonality + trend + noise
        const internalMultiplier = 1 + seasonality + trend + (Math.random() - 0.5) * 0.25

        const clientQty = Math.max(0, Math.round(clientBase * clientMultiplier))
        const internalQty = Math.max(0, Math.round(internalBase * internalMultiplier))

        // Create some dramatic changes for "Top Changes" detection
        if (Math.random() < 0.05) {
          clientBase = Math.round(clientBase * (1.5 + Math.random() * 0.8))
          internalBase = Math.round(internalBase * (1.4 + Math.random() * 0.7))
        }

        const created = new Date()
        await addDoc(collection(db, "forecasts"), {
          seed_tag: seedTag,
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
          seed_tag: seedTag,
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
      }
    }
  }

  // Seed demand with realistic patterns relative to forecasts
  for (const c of clients) {
    for (const p of parts) {
      if (Math.random() < 0.3) continue

      const demandBase = randomBetween(250, 2200)

      for (let i = 0; i < periodKeys.length; i++) {
        const k = periodKeys[i]

        // Demand typically lags and varies from forecast
        const variation = (Math.random() - 0.5) * 0.4 // ±20% variation
        const demandQty = Math.max(0, Math.round(demandBase * (1 + variation)))

        await addDoc(collection(db, "demanda"), {
          seed_tag: seedTag,
          clientId: c.id,
          clientName: c.name,
          partId: p.id,
          partNumber: p.number,
          periodKey: k,
          qty: demandQty,
          created_at: isoDate(new Date()),
        })
      }
    }
  }

  // Seed MOQs with realistic values per client-part combination
  for (const c of clients) {
    for (const p of parts) {
      if (Math.random() < 0.4) continue // Not all combinations have MOQs

      await addDoc(collection(db, "moqs"), {
        seed_tag: seedTag,
        clientId: c.id, // Added client-specific MOQs
        partId: p.id,
        partNumber: p.number,
        moq: randomBetween(100, 1000),
        vigente_desde: isoDate(new Date()),
        vigente_hasta: null,
      })
    }
  }

  // Seed Lead Times with more variation
  for (const p of parts) {
    await addDoc(collection(db, "lead_times"), {
      seed_tag: seedTag,
      partId: p.id,
      partNumber: p.number,
      lead_time_days: randomBetween(7, 60), // Wider range
      vigente_desde: isoDate(new Date()),
      vigente_hasta: null,
    })
  }

  // Seed Inventory with realistic levels
  for (const p of parts) {
    await addDoc(collection(db, "inventario"), {
      seed_tag: seedTag,
      partId: p.id,
      partNumber: p.number,
      qty: randomBetween(500, 8000), // Higher inventory levels
      fecha_corte: isoDate(new Date()),
      ubicacion: choose(["WH-01", "WH-02", "WH-03"]),
    })
  }

  // Seed Shipments with realistic lead time performance
  for (let i = 0; i < 800; i++) {
    // More shipments for better analysis
    const c = choose(clients)
    const p = choose(parts)
    const promised = new Date()
    promised.setDate(promised.getDate() - randomBetween(5, 45))

    // Some clients perform better than others
    const clientPerformance = c.id === "BMW" || c.id === "AUDI" ? 0.85 : 0.7
    const onTime = Math.random() < clientPerformance

    const delay = onTime ? randomBetween(-3, 2) : randomBetween(3, 15)
    const delivered = new Date(promised)
    delivered.setDate(promised.getDate() + delay)

    await addDoc(collection(db, "shipments"), {
      seed_tag: seedTag,
      clientId: c.id,
      clientName: c.name,
      partId: p.id,
      partNumber: p.number,
      qty: randomBetween(100, 1500),
      promised_date: isoDate(promised),
      delivered_date: isoDate(delivered),
      created_at: isoDate(new Date()),
    })
  }

  console.log("✅ Comprehensive seeding complete with:")
  console.log(`- ${clients.length} clients`)
  console.log(`- ${parts.length} parts`)
  console.log(`- ${periodKeys.length} weeks of data`)
  console.log(`- ~${clients.length * 45} orders with multiple lines`)
  console.log(`- Forecasts (client + internal) for ${periodKeys.length} weeks`)
  console.log(`- Demand data matching forecast periods`)
  console.log(`- MOQs, Lead Times, Inventory, and 800+ Shipments`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
