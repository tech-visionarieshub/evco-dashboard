import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore, type Firestore } from "firebase/firestore"
import { getStorage, type FirebaseStorage } from "firebase/storage"

// Función helper para limpiar variables de entorno (elimina espacios y saltos de línea)
function cleanEnvVar(value: string | undefined): string | undefined {
  if (!value) return undefined
  const cleaned = value.trim()
  // Log warning si detectamos caracteres problemáticos (solo en desarrollo)
  if (process.env.NODE_ENV === 'development' && (value !== cleaned || value.includes('\n') || value.includes('\r'))) {
    console.warn('[Firebase] ⚠️ Variable de entorno tenía espacios/saltos de línea y fue limpiada')
  }
  return cleaned || undefined
}

// Validar configuración de Firebase
function validateFirebaseConfig(config: typeof firebaseConfig) {
  const missing: string[] = []
  if (!config.apiKey) missing.push('NEXT_PUBLIC_FIREBASE_API_KEY')
  if (!config.authDomain) missing.push('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN')
  if (!config.projectId) missing.push('NEXT_PUBLIC_FIREBASE_PROJECT_ID')
  if (!config.storageBucket) missing.push('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET')
  if (!config.appId) missing.push('NEXT_PUBLIC_FIREBASE_APP_ID')
  
  if (missing.length > 0) {
    const errorMsg = `[Firebase] ❌ Variables de entorno faltantes: ${missing.join(', ')}`
    console.error(errorMsg)
    if (typeof window !== 'undefined') {
      // En el cliente, mostrar error visible
      console.error('[Firebase] Verifica las variables de entorno en Vercel: Settings > Environment Variables')
    }
    throw new Error(`Firebase configuration incomplete. Missing: ${missing.join(', ')}`)
  }
  
  // Verificar que projectId no tenga caracteres inválidos
  if (config.projectId && (config.projectId.includes('\n') || config.projectId.includes('\r'))) {
    console.error('[Firebase] ❌ projectId contiene caracteres inválidos (saltos de línea)')
    throw new Error('Firebase projectId contains invalid characters')
  }
}

const firebaseConfig = {
  apiKey: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  appId: cleanEnvVar(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
}

// Validar configuración al cargar el módulo
if (typeof window !== 'undefined') {
  // Solo validar en el cliente (navegador)
  try {
    validateFirebaseConfig(firebaseConfig)
  } catch (error) {
    console.error('[Firebase] Error de configuración:', error)
  }
}

let app: FirebaseApp
let db: Firestore
let storage: FirebaseStorage

// Singleton pattern para evitar múltiples inicializaciones
function getFirebaseApp(): FirebaseApp {
  if (!app) {
    if (getApps().length === 0) {
      // Validar configuración antes de inicializar
      try {
        validateFirebaseConfig(firebaseConfig)
      } catch (error: any) {
        console.error('[Firebase] ❌ Error de configuración:', error.message)
        if (typeof window !== 'undefined') {
          alert(`Error de configuración de Firebase: ${error.message}\n\nRevisa las variables de entorno en Vercel.`)
        }
        throw error
      }
      
      console.log("[Firebase] 🔥 Inicializando Firebase App...", {
        projectId: firebaseConfig.projectId,
        authDomain: firebaseConfig.authDomain,
        hasApiKey: !!firebaseConfig.apiKey,
        hasAppId: !!firebaseConfig.appId,
        environment: typeof window !== 'undefined' ? 'client' : 'server',
      })
      
      try {
        app = initializeApp(firebaseConfig)
        console.log("[Firebase] ✅ Firebase App inicializado correctamente")
      } catch (error: any) {
        console.error("[Firebase] ❌ Error al inicializar Firebase:", error)
        if (error.message?.includes('projectId') || error.message?.includes('database')) {
          console.error('[Firebase] 💡 Sugerencia: Verifica que NEXT_PUBLIC_FIREBASE_PROJECT_ID no tenga espacios o saltos de línea en Vercel')
        }
        throw error
      }
    } else {
      app = getApps()[0]
      console.log("[Firebase] ℹ️  Usando Firebase App existente")
    }
  }
  return app
}

export function getFirebaseDb(): Firestore {
  if (!db) {
    console.log("[Firebase] 📊 Inicializando Firestore...")
    db = getFirestore(getFirebaseApp())
    console.log("[Firebase] ✅ Firestore inicializado")
  }
  return db
}

export function getDb(): Firestore {
  return getFirebaseDb()
}

export function getFirebaseStorage(): FirebaseStorage {
  if (!storage) {
    storage = getStorage(getFirebaseApp())
  }
  return storage
}

export function getBucket(): FirebaseStorage {
  return getFirebaseStorage()
}

export function getStorageBucket(): FirebaseStorage {
  return getFirebaseStorage()
}

export function getFilesStorage(): FirebaseStorage {
  return getFirebaseStorage()
}

export { app, db, storage }
