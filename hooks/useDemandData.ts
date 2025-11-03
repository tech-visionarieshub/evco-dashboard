"use client"

import { useState, useCallback, useMemo } from "react"
import { normalizeConsumption, getDataStats, groupByPartToSeries } from "@/lib/demand/normalizeConsumption"
import { analyzeDemand } from "@/lib/demand/analyzeDemand"
import { runDemandAI } from "@/lib/demand/ai"
import type { NormalizedConsumptionRecord, PartSeries, DataStats } from "@/lib/demand/normalizeConsumption"
import type { DemandAnalysisResult } from "@/lib/demand/analyzeDemand"
import type { AISignal } from "@/lib/demand/ai"

export interface DemandDataState {
  rawData: any[]
  normalizedData: NormalizedConsumptionRecord[]
  partSeries: PartSeries[]
  dataStats: DataStats | null
  analysisResult: DemandAnalysisResult | null
  aiSignals: AISignal[]
  isProcessing: boolean
  error: string | null
}

export function useDemandData() {
  const [state, setState] = useState<DemandDataState>({
    rawData: [],
    normalizedData: [],
    partSeries: [],
    dataStats: null,
    analysisResult: null,
    aiSignals: [],
    isProcessing: false,
    error: null,
  })

  const processData = useCallback(async (rawData: any[]) => {
    setState((prev) => ({ ...prev, isProcessing: true, error: null }))

    try {
      // Step 1: Normalize data
      const normalizedData = normalizeConsumption(rawData)
      if (normalizedData.length === 0) {
        throw new Error("No se pudieron normalizar los datos. Verifique el formato del archivo.")
      }

      // Step 2: Calculate basic statistics
      const dataStats = getDataStats(normalizedData)

      // Step 3: Group by part series
      const partSeries = groupByPartToSeries(normalizedData)

      // Step 4: Perform demand analysis
      const analysisResult = analyzeDemand(normalizedData, partSeries)

      // Step 5: Run AI analysis
      const aiSignals = await runDemandAI(partSeries)

      setState((prev) => ({
        ...prev,
        rawData,
        normalizedData,
        partSeries,
        dataStats,
        analysisResult,
        aiSignals,
        isProcessing: false,
      }))

      return {
        normalizedData,
        partSeries,
        dataStats,
        analysisResult,
        aiSignals,
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al procesar los datos"
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }))
      throw error
    }
  }, [])

  const clearData = useCallback(() => {
    setState({
      rawData: [],
      normalizedData: [],
      partSeries: [],
      dataStats: null,
      analysisResult: null,
      aiSignals: [],
      isProcessing: false,
      error: null,
    })
  }, [])

  const updateAnalysis = useCallback(async () => {
    if (state.partSeries.length === 0) return

    setState((prev) => ({ ...prev, isProcessing: true, error: null }))

    try {
      const analysisResult = analyzeDemand(state.normalizedData, state.partSeries)
      const aiSignals = await runDemandAI(state.partSeries)

      setState((prev) => ({
        ...prev,
        analysisResult,
        aiSignals,
        isProcessing: false,
      }))
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Error al actualizar el análisis"
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: errorMessage,
      }))
    }
  }, [state.normalizedData, state.partSeries])

  // Memoized computed values
  const computedStats = useMemo(() => {
    if (!state.analysisResult) return null

    return {
      totalParts: state.analysisResult.summary.totalParts,
      totalCustomers: state.analysisResult.summary.totalCustomers,
      avgVolatility: state.analysisResult.summary.avgVolatility,
      highRiskParts: state.analysisResult.summary.highRiskParts,
      criticalParts: state.analysisResult.summary.criticalParts,
      totalSignals: state.aiSignals.length,
      highSeveritySignals: state.aiSignals.filter((s) => s.severidad === "alta").length,
    }
  }, [state.analysisResult, state.aiSignals])

  return {
    ...state,
    computedStats,
    processData,
    clearData,
    updateAnalysis,
  }
}
