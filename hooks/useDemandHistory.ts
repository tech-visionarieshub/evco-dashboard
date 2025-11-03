"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getDemandAnalysisHistory,
  getDemandAnalysisById,
  getForecastsByAnalysisId,
  getAlertsByAnalysisId,
  deleteDemandAnalysis,
} from "@/lib/services/firebase-demand-analysis"
import type { DemandAnalysis, DemandForecast, DemandAlert, GetAnalysisParams } from "@/lib/types/demand-persistence"

interface UseDemandHistoryReturn {
  // Estado
  analyses: DemandAnalysis[]
  loading: boolean
  error: string | null
  hasMore: boolean

  // Acciones
  loadHistory: (params?: GetAnalysisParams) => Promise<void>
  loadMore: () => Promise<void>
  refreshHistory: () => Promise<void>
  deleteAnalysis: (analysisId: string) => Promise<boolean>

  // Análisis específico
  selectedAnalysis: DemandAnalysis | null
  analysisForecasts: DemandForecast[]
  analysisAlerts: DemandAlert[]
  loadingAnalysis: boolean
  selectAnalysis: (analysisId: string) => Promise<void>
  clearSelection: () => void
}

export function useDemandHistory(): UseDemandHistoryReturn {
  const [analyses, setAnalyses] = useState<DemandAnalysis[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentParams, setCurrentParams] = useState<GetAnalysisParams>({})

  // Estado para análisis específico
  const [selectedAnalysis, setSelectedAnalysis] = useState<DemandAnalysis | null>(null)
  const [analysisForecasts, setAnalysisForecasts] = useState<DemandForecast[]>([])
  const [analysisAlerts, setAnalysisAlerts] = useState<DemandAlert[]>([])
  const [loadingAnalysis, setLoadingAnalysis] = useState(false)

  // Cargar historial con parámetros
  const loadHistory = useCallback(async (params: GetAnalysisParams = {}) => {
    try {
      setLoading(true)
      setError(null)
      setCurrentParams(params)

      const results = await getDemandAnalysisHistory({
        limit: 20,
        ...params,
      })

      setAnalyses(results)
      setHasMore(results.length === (params.limit || 20))

      console.log(`✅ Cargados ${results.length} análisis de demanda`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error cargando historial"
      setError(errorMessage)
      console.error("❌ Error en loadHistory:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar más resultados
  const loadMore = useCallback(async () => {
    if (!hasMore || loading) return

    try {
      setLoading(true)

      const lastAnalysis = analyses[analyses.length - 1]
      const moreResults = await getDemandAnalysisHistory({
        ...currentParams,
        limit: 20,
        startDate: lastAnalysis?.createdAt,
      })

      // Filtrar duplicados
      const newResults = moreResults.filter(
        (newAnalysis) => !analyses.some((existing) => existing.id === newAnalysis.id),
      )

      setAnalyses((prev) => [...prev, ...newResults])
      setHasMore(newResults.length === 20)

      console.log(`✅ Cargados ${newResults.length} análisis adicionales`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error cargando más resultados"
      setError(errorMessage)
      console.error("❌ Error en loadMore:", err)
    } finally {
      setLoading(false)
    }
  }, [analyses, currentParams, hasMore, loading])

  // Refrescar historial
  const refreshHistory = useCallback(async () => {
    await loadHistory(currentParams)
  }, [loadHistory, currentParams])

  // Eliminar análisis
  const deleteAnalysis = useCallback(
    async (analysisId: string): Promise<boolean> => {
      try {
        const success = await deleteDemandAnalysis(analysisId)

        if (success) {
          setAnalyses((prev) => prev.filter((analysis) => analysis.id !== analysisId))

          // Si el análisis eliminado estaba seleccionado, limpiar selección
          if (selectedAnalysis?.id === analysisId) {
            clearSelection()
          }

          console.log("✅ Análisis eliminado del estado local")
        }

        return success
      } catch (err) {
        console.error("❌ Error eliminando análisis:", err)
        return false
      }
    },
    [selectedAnalysis],
  )

  // Seleccionar análisis específico
  const selectAnalysis = useCallback(async (analysisId: string) => {
    try {
      setLoadingAnalysis(true)
      setError(null)

      // Cargar análisis principal
      const analysis = await getDemandAnalysisById(analysisId)
      if (!analysis) {
        throw new Error("Análisis no encontrado")
      }

      // Cargar datos relacionados en paralelo
      const [forecasts, alerts] = await Promise.all([
        getForecastsByAnalysisId(analysisId),
        getAlertsByAnalysisId(analysisId),
      ])

      setSelectedAnalysis(analysis)
      setAnalysisForecasts(forecasts)
      setAnalysisAlerts(alerts)

      console.log(`✅ Análisis cargado: ${analysis.nombre}`)
      console.log(`   - ${forecasts.length} pronósticos`)
      console.log(`   - ${alerts.length} alertas activas`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Error cargando análisis"
      setError(errorMessage)
      console.error("❌ Error en selectAnalysis:", err)
    } finally {
      setLoadingAnalysis(false)
    }
  }, [])

  // Limpiar selección
  const clearSelection = useCallback(() => {
    setSelectedAnalysis(null)
    setAnalysisForecasts([])
    setAnalysisAlerts([])
  }, [])

  // Cargar historial inicial
  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  return {
    // Estado
    analyses,
    loading,
    error,
    hasMore,

    // Acciones
    loadHistory,
    loadMore,
    refreshHistory,
    deleteAnalysis,

    // Análisis específico
    selectedAnalysis,
    analysisForecasts,
    analysisAlerts,
    loadingAnalysis,
    selectAnalysis,
    clearSelection,
  }
}
