import { config } from "dotenv"
import { resolve } from "path"
import { initializeApp, getApps } from "firebase/app"
import { getFirestore, collection, getDocs, query, limit } from "firebase/firestore"
import { getAuth, signInAnonymously } from "firebase/auth"

// Cargar variables de entorno desde .env.local
config({ path: resolve(__dirname, "../.env.local") })

// Función helper para limpiar variables de entorno (elimina espacios y saltos de línea)
function cleanEnvVar(value: string | undefined): string | undefined {
  return value?.trim() || undefined
}

const firebaseConfig = {
  apiKey: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  appId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
}

if (!firebaseConfig.projectId) {
  console.error("❌ Error: No se encontraron las variables de entorno de Firebase")
  console.error("Asegúrate de que .env.local existe y tiene las variables NEXT_PUBLIC_FIREBASE_*")
  process.exit(1)
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
const db = getFirestore(app)
const auth = getAuth(app)

// Autenticación anónima para acceder a Firestore
async function authenticate() {
  try {
    if (!auth.currentUser) {
      await signInAnonymously(auth)
      console.log("✅ Autenticación anónima exitosa\n")
    } else {
      console.log("✅ Ya autenticado\n")
    }
  } catch (error: any) {
    console.warn("⚠️  No se pudo autenticar (continuando sin autenticación):", error.message)
    console.warn("   Esto puede causar errores si las reglas de seguridad requieren autenticación\n")
  }
}

// Colecciones que el dashboard espera encontrar
const expectedCollections = [
  "ordenes_compra",
  "lineas_orden",
  "forecasts",
  "demanda",
  "inventario",
  "moqs",
  "lead_times",
  "shipments",
  "clientes",
  "historial_procesamiento",
  "forecast_files",
  "demand_analyses",
  "demand_forecasts",
  "demand_alerts",
]

async function listCollections() {
  console.log("📊 Revisando colecciones en Firebase...\n")
  console.log(`Proyecto: ${firebaseConfig.projectId || "desconocido"}\n`)
  
  // Autenticar primero
  await authenticate()

  const results: Array<{ name: string; count: number; hasData: boolean }> = []

  for (const collName of expectedCollections) {
    try {
      const snap = await getDocs(query(collection(db, collName), limit(1)))
      const count = snap.size
      const hasData = count > 0
      
      // Si queremos el conteo completo (más lento)
      const fullSnap = await getDocs(collection(db, collName))
      const fullCount = fullSnap.size
      
      results.push({
        name: collName,
        count: fullCount,
        hasData,
      })
      
      const status = hasData ? "✅" : "⚠️"
      console.log(`${status} ${collName.padEnd(30)} ${fullCount.toString().padStart(5)} documentos`)
    } catch (error: any) {
      console.log(`❌ ${collName.padEnd(30)} Error: ${error.message}`)
      results.push({
        name: collName,
        count: 0,
        hasData: false,
      })
    }
  }

  console.log("\n" + "=".repeat(60))
  console.log("\n📈 Resumen:")
  const withData = results.filter((r) => r.hasData)
  const withoutData = results.filter((r) => !r.hasData)
  
  console.log(`\n✅ Colecciones con datos: ${withData.length}`)
  withData.forEach((r) => {
    console.log(`   - ${r.name}: ${r.count} documentos`)
  })
  
  console.log(`\n⚠️  Colecciones vacías: ${withoutData.length}`)
  withoutData.forEach((r) => {
    console.log(`   - ${r.name}`)
  })
  
  const totalDocs = results.reduce((sum, r) => sum + r.count, 0)
  console.log(`\n📊 Total de documentos: ${totalDocs}`)
}

listCollections()
  .then(() => {
    console.log("\n✅ Revisión completada")
    process.exit(0)
  })
  .catch((error) => {
    console.error("\n❌ Error:", error)
    process.exit(1)
  })

