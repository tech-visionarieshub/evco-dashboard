import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import type {
  DemandAnalysis,
  DemandForecast,
  DemandAlert,
  SaveAnalysisParams,
  GetAnalysisParams,
} from "@/lib/types/demand-persistence"

const COLLECTIONS = {
  ANALYSES: "demand_analyses",
  FORECASTS: "demand_forecasts",
  ALERTS: "demand_alerts",
  METADATA: "demand_metadata",
} as const

// Guardar análisis completo de demanda
export async function saveDemandAnalysis(params: SaveAnalysisParams): Promise<string> {
  try {
    const { analysis, forecasts, alerts, metadata } = params

    // Crear documento principal del análisis
    const analysisRef = await addDoc(collection(db, COLLECTIONS.ANALYSES), {
      ...analysis,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: "completed",
    })

    const analysisId = analysisRef.id

    // Guardar pronósticos asociados
    if (forecasts && forecasts.length > 0) {
      const forecastPromises = forecasts.map((forecast) =>
        addDoc(collection(db, COLLECTIONS.FORECASTS), {
          ...forecast,
          analysisId,
          createdAt: serverTimestamp(),
        }),
      )
      await Promise.all(forecastPromises)
    }

    // Guardar alertas asociadas
    if (alerts && alerts.length > 0) {
      const alertPromises = alerts.map((alert) =>
        addDoc(collection(db, COLLECTIONS.ALERTS), {
          ...alert,
          analysisId,
          createdAt: serverTimestamp(),
          isActive: true,
        }),
      )
      await Promise.all(alertPromises)
    }

    // Guardar metadata
    if (metadata) {
      await addDoc(collection(db, COLLECTIONS.METADATA), {
        ...metadata,
        analysisId,
        createdAt: serverTimestamp(),
      })
    }

    console.log("✅ Análisis de demanda guardado:", analysisId)
    return analysisId
  } catch (error) {
    console.error("❌ Error guardando análisis de demanda:", error)
    throw new Error("Error al guardar el análisis de demanda")
  }
}

// Obtener análisis por ID
export async function getDemandAnalysisById(analysisId: string): Promise<DemandAnalysis | null> {
  try {
    const docRef = doc(db, COLLECTIONS.ANALYSES, analysisId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return null
    }

    const data = docSnap.data()
    return {
      id: docSnap.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as DemandAnalysis
  } catch (error) {
    console.error("❌ Error obteniendo análisis:", error)
    return null
  }
}

// Obtener historial de análisis con filtros
export async function getDemandAnalysisHistory(params: GetAnalysisParams = {}) {
  try {
    const { limit: queryLimit = 20, startDate, endDate, cliente, producto, status = "completed" } = params

    let q = query(
      collection(db, COLLECTIONS.ANALYSES),
      where("status", "==", status),
      orderBy("createdAt", "desc"),
      limit(queryLimit),
    )

    // Aplicar filtros adicionales
    if (startDate) {
      q = query(q, where("createdAt", ">=", Timestamp.fromDate(startDate)))
    }

    if (endDate) {
      q = query(q, where("createdAt", "<=", Timestamp.fromDate(endDate)))
    }

    if (cliente) {
      q = query(q, where("clientesIncluidos", "array-contains", cliente))
    }

    const querySnapshot = await getDocs(q)
    const analyses: DemandAnalysis[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      analyses.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      } as DemandAnalysis)
    })

    // Filtrar por producto si se especifica (filtro local)
    let filteredAnalyses = analyses
    if (producto) {
      filteredAnalyses = analyses.filter((analysis) =>
        analysis.productosAnalizados?.some((p) => p.toLowerCase().includes(producto.toLowerCase())),
      )
    }

    console.log(`✅ Obtenidos ${filteredAnalyses.length} análisis de demanda`)
    return filteredAnalyses
  } catch (error) {
    console.error("❌ Error obteniendo historial:", error)
    return []
  }
}

// Obtener pronósticos por análisis
export async function getForecastsByAnalysisId(analysisId: string): Promise<DemandForecast[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.FORECASTS),
      where("analysisId", "==", analysisId),
      orderBy("partNumber"),
      orderBy("weekNumber"),
    )

    const querySnapshot = await getDocs(q)
    const forecasts: DemandForecast[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      forecasts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as DemandForecast)
    })

    return forecasts
  } catch (error) {
    console.error("❌ Error obteniendo pronósticos:", error)
    return []
  }
}

// Obtener alertas por análisis
export async function getAlertsByAnalysisId(analysisId: string): Promise<DemandAlert[]> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ALERTS),
      where("analysisId", "==", analysisId),
      where("isActive", "==", true),
      orderBy("priority", "desc"),
      orderBy("createdAt", "desc"),
    )

    const querySnapshot = await getDocs(q)
    const alerts: DemandAlert[] = []

    querySnapshot.forEach((doc) => {
      const data = doc.data()
      alerts.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || new Date(),
      } as DemandAlert)
    })

    return alerts
  } catch (error) {
    console.error("❌ Error obteniendo alertas:", error)
    return []
  }
}

// Obtener último análisis
export async function getLatestDemandAnalysis(): Promise<DemandAnalysis | null> {
  try {
    const q = query(
      collection(db, COLLECTIONS.ANALYSES),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc"),
      limit(1),
    )

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      return null
    }

    const doc = querySnapshot.docs[0]
    const data = doc.data()

    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      updatedAt: data.updatedAt?.toDate?.() || new Date(),
    } as DemandAnalysis
  } catch (error) {
    console.error("❌ Error obteniendo último análisis:", error)
    return null
  }
}

// Obtener estadísticas del módulo de demanda
export async function getDemandModuleStats() {
  try {
    const [analysesSnapshot, forecastsSnapshot, alertsSnapshot] = await Promise.all([
      getDocs(query(collection(db, COLLECTIONS.ANALYSES), where("status", "==", "completed"))),
      getDocs(collection(db, COLLECTIONS.FORECASTS)),
      getDocs(query(collection(db, COLLECTIONS.ALERTS), where("isActive", "==", true))),
    ])

    const totalAnalyses = analysesSnapshot.size
    const totalForecasts = forecastsSnapshot.size
    const activeAlerts = alertsSnapshot.size

    // Calcular alertas por prioridad
    const alertsByPriority = { high: 0, medium: 0, low: 0 }
    alertsSnapshot.forEach((doc) => {
      const priority = doc.data().priority || "low"
      alertsByPriority[priority as keyof typeof alertsByPriority]++
    })

    return {
      totalAnalyses,
      totalForecasts,
      activeAlerts,
      alertsByPriority,
      lastUpdated: new Date(),
    }
  } catch (error) {
    console.error("❌ Error obteniendo estadísticas:", error)
    return {
      totalAnalyses: 0,
      totalForecasts: 0,
      activeAlerts: 0,
      alertsByPriority: { high: 0, medium: 0, low: 0 },
      lastUpdated: new Date(),
    }
  }
}

// Marcar alertas como resueltas
export async function resolveAlert(alertId: string): Promise<boolean> {
  try {
    const alertRef = doc(db, COLLECTIONS.ALERTS, alertId)
    await updateDoc(alertRef, {
      isActive: false,
      resolvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    console.log("✅ Alerta resuelta:", alertId)
    return true
  } catch (error) {
    console.error("❌ Error resolviendo alerta:", error)
    return false
  }
}

// Eliminar análisis completo
export async function deleteDemandAnalysis(analysisId: string): Promise<boolean> {
  try {
    // Eliminar pronósticos asociados
    const forecastsQuery = query(collection(db, COLLECTIONS.FORECASTS), where("analysisId", "==", analysisId))
    const forecastsSnapshot = await getDocs(forecastsQuery)
    const forecastDeletePromises = forecastsSnapshot.docs.map((doc) => deleteDoc(doc.ref))

    // Eliminar alertas asociadas
    const alertsQuery = query(collection(db, COLLECTIONS.ALERTS), where("analysisId", "==", analysisId))
    const alertsSnapshot = await getDocs(alertsQuery)
    const alertDeletePromises = alertsSnapshot.docs.map((doc) => deleteDoc(doc.ref))

    // Eliminar metadata asociada
    const metadataQuery = query(collection(db, COLLECTIONS.METADATA), where("analysisId", "==", analysisId))
    const metadataSnapshot = await getDocs(metadataQuery)
    const metadataDeletePromises = metadataSnapshot.docs.map((doc) => deleteDoc(doc.ref))

    // Ejecutar todas las eliminaciones
    await Promise.all([...forecastDeletePromises, ...alertDeletePromises, ...metadataDeletePromises])

    // Eliminar el análisis principal
    await deleteDoc(doc(db, COLLECTIONS.ANALYSES, analysisId))

    console.log("✅ Análisis eliminado completamente:", analysisId)
    return true
  } catch (error) {
    console.error("❌ Error eliminando análisis:", error)
    return false
  }
}
