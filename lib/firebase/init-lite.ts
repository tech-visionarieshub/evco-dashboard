import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth"

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

// Validar configuración al cargar el módulo (solo en cliente)
if (typeof window !== 'undefined') {
  try {
    validateFirebaseConfig(firebaseConfig)
  } catch (error) {
    console.error('[Firebase] Error de configuración:', error)
  }
}

// Initialize Firebase
let app: FirebaseApp
try {
  // Validar antes de inicializar
  if (typeof window !== 'undefined') {
    validateFirebaseConfig(firebaseConfig)
  }
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
} catch (error: any) {
  console.error('[Firebase] ❌ Error al inicializar Firebase en init-lite:', error)
  if (error.message?.includes('projectId') || error.message?.includes('database')) {
    console.error('[Firebase] 💡 Sugerencia: Verifica que NEXT_PUBLIC_FIREBASE_PROJECT_ID no tenga espacios o saltos de línea en Vercel')
  }
  throw error
}

const db = getFirestore(app)
const auth = getAuth(app)

export { db, auth }

export type AuthResult = { success: true; user: User } | { success: false; error: string; code: string }

export async function ensureSignedInAnonymously(): Promise<AuthResult> {
  try {
    // Check if already signed in
    if (auth.currentUser) {
      return { success: true, user: auth.currentUser }
    }

    // Try to sign in anonymously
    const result = await signInAnonymously(auth)
    return { success: true, user: result.user }
  } catch (error: any) {
    const code = error?.code || "unknown"
    let message = "Error de autenticación desconocido"

    switch (code) {
      case "auth/configuration-not-found":
        message = "Firebase Auth no está configurado. Habilita Authentication en Firebase Console."
        break
      case "auth/operation-not-allowed":
        message = "Autenticación anónima no está habilitada. Ve a Authentication > Sign-in methods > Anonymous."
        break
      case "auth/network-request-failed":
        message = "Error de red. Verifica tu conexión."
        break
      default:
        message = error?.message || "Error de autenticación"
    }

    return { success: false, error: message, code }
  }
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback)
}
