"use client"

import { useState, useCallback } from "react"
import {
  saveDemandAnalysis,
  getLatestDemandAnalysis,
  getDemandModuleStats,
  resolveAlert,
} from "@/lib/services/firebase-demand-analysis"
import type { DemandAnalysis, SaveAnalysisParams, DemandModuleStats } from "@/lib/types/demand-persistence"

interface UseDemandPersistenceReturn {
  // Estado
  saving: boolean
  loading: boolean
  error: string | null
  lastSavedId: string | null

  // Datos
  latestAnalysis: DemandAnalysis | null
  moduleStats: DemandModuleStats | null

  // Acciones principales
  saveAnalysis: (params: SaveAnalysisParams) => Promise<string | null>
  loadLatestAnalysis: () => Promise<void>
  loadModuleStats: () => Promise<void>

  // Acciones de alertas
  resolveAlertById: (alertId: string) => Promise<boolean>

  // Utilidades
  clearError: () => void
  reset: () => void
}

export function useDemandPersistence(): UseDemandPersistenceReturn {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSavedId, setLastSavedId] = useState<string | null>(null)

  const [latestAnalysis, setLatestAnalysis] = useState<DemandAnalysis | null>(null)
  const [moduleStats, setModuleStats] = useState<DemandModuleStats | null>(null)

  // Guardar análisis completo
  const saveAnalysis = useCallback(async (params: SaveAnalysisParams): Promise<string | null> => {
    try {
      setSaving(true)
      setError(null)

      console.log("💾 Guardando análisis de demanda...")
      console.log(`   - ${params.analysis.totalPartes} partes analizadas`)
      console.log(`   - ${params.forecasts?.length || 0} pronósticos`)
      console.log(`   - ${params.alerts?.length || 0} alertas`)

      const analysisId = await saveDemandAnalysis(params)

      setLastSavedId(analysisId)
      console.log("✅ Análisis guardado exitosamente:", analysisId)

      // Actualizar último análisis si es necesario
      await loadLatestAnalysis()

      return analysisId
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error guardando análisis"
      setError(errorMessage)
      console.error("❌ Error en saveAnalysis:", err)
      return null
    } finally {
      setSaving(false)
    }
  }, [])

  // Cargar último análisis
  const loadLatestAnalysis = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const latest = await getLatestDemandAnalysis()
      setLatestAnalysis(latest)

      if (latest) {
        console.log(`✅ Último análisis cargado: ${latest.nombre} (${latest.createdAt.toLocaleDateString()})`)
      } else {
        console.log("ℹ️ No hay análisis previos")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error cargando último análisis"
      setError(errorMessage)
      console.error("❌ Error en loadLatestAnalysis:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar estadísticas del módulo
  const loadModuleStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const stats = await getDemandModuleStats()
      setModuleStats(stats)

      console.log("✅ Estadísticas del módulo cargadas:")
      console.log(`   - ${stats.totalAnalyses} análisis totales`)
      console.log(`   - ${stats.activeAlerts} alertas activas`)
      console.log(`   - ${stats.totalForecasts} pronósticos`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error cargando estadísticas"
      setError(errorMessage)
      console.error("❌ Error en loadModuleStats:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Resolver alerta
  const resolveAlertById = useCallback(
    async (alertId: string): Promise<boolean> => {
      try {
        const success = await resolveAlert(alertId)

        if (success) {
          // Actualizar estadísticas después de resolver alerta
          await loadModuleStats()
          console.log("✅ Alerta resuelta y estadísticas actualizadas")
        }

        return success
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Error resolviendo alerta"
        setError(errorMessage)
        console.error("❌ Error en resolveAlertById:", err)
        return false
      }
    },
    [loadModuleStats],
  )

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // Reset completo
  const reset = useCallback(() => {
    setSaving(false)
    setLoading(false)
    setError(null)
    setLastSavedId(null)
    setLatestAnalysis(null)
    setModuleStats(null)
  }, [])

  return {
    // Estado
    saving,
    loading,
    error,
    lastSavedId,

    // Datos
    latestAnalysis,
    moduleStats,

    // Acciones principales
    saveAnalysis,
    loadLatestAnalysis,
    loadModuleStats,

    // Acciones de alertas
    resolveAlertById,

    // Utilidades
    clearError,
    reset,
  }
}
