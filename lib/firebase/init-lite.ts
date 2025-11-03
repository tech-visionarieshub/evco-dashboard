import { initializeApp, getApps } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, signInAnonymously, onAuthStateChanged, type User } from "firebase/auth"

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
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
