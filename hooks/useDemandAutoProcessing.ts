"use client"

import { useState, useCallback } from "react"
import { normalizeConsumptionData } from "@/lib/demand/normalizeConsumption"
import { analyzeDemand } from "@/lib/demand/analyzeDemand"
import { runDemandAIFull } from "@/lib/demand/ai"
import { saveDemandAnalysis } from "@/lib/services/demand-storage"

export interface ProcessingStep {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  message?: string
  error?: string
}

export interface ProcessingState {
  isProcessing: boolean
  currentStep: number
  steps: ProcessingStep[]
  results: any
  error: string | null
}

export function useDemandAutoProcessing() {
  const [state, setState] = useState<ProcessingState>({
    isProcessing: false,
    currentStep: 0,
    steps: [
      { id: "normalize", name: "Normalización de datos", status: "pending", progress: 0 },
      { id: "analyze", name: "Análisis estadístico", status: "pending", progress: 0 },
      { id: "ai", name: "Procesamiento con IA", status: "pending", progress: 0 },
      { id: "save", name: "Guardando resultados", status: "pending", progress: 0 },
    ],
    results: null,
    error: null,
  })

  const updateStep = useCallback((stepId: string, updates: Partial<ProcessingStep>) => {
    setState((prev) => ({
      ...prev,
      steps: prev.steps.map((step) => (step.id === stepId ? { ...step, ...updates } : step)),
    }))
  }, [])

  const startProcessing = useCallback(
    async (rawData: any[]) => {
      setState((prev) => ({
        ...prev,
        isProcessing: true,
        currentStep: 0,
        error: null,
        results: null,
        steps: prev.steps.map((step) => ({ ...step, status: "pending", progress: 0, error: undefined })),
      }))

      try {
        // Step 1: Normalize data
        setState((prev) => ({ ...prev, currentStep: 0 }))
        updateStep("normalize", { status: "processing", progress: 0, message: "Procesando datos..." })

        const normalizedData = await normalizeConsumptionData(rawData)

        updateStep("normalize", {
          status: "completed",
          progress: 100,
          message: `${normalizedData.length} registros normalizados`,
        })

        if (normalizedData.length === 0) {
          throw new Error("No se pudieron normalizar los datos")
        }

        // Step 2: Statistical analysis
        setState((prev) => ({ ...prev, currentStep: 1 }))
        updateStep("analyze", { status: "processing", progress: 0, message: "Calculando estadísticas..." })

        const analysisResults = analyzeDemand(normalizedData)

        updateStep("analyze", {
          status: "completed",
          progress: 100,
          message: `Análisis completado para ${analysisResults.summary.totalParts} partes`,
        })

        // Step 3: AI processing
        setState((prev) => ({ ...prev, currentStep: 2 }))
        updateStep("ai", { status: "processing", progress: 0, message: "Ejecutando análisis con IA..." })

        const aiResults = await runDemandAIFull(normalizedData, analysisResults)

        updateStep("ai", {
          status: "completed",
          progress: 100,
          message: `${aiResults.totalSignals} señales generadas`,
        })

        // Step 4: Save results
        setState((prev) => ({ ...prev, currentStep: 3 }))
        updateStep("save", { status: "processing", progress: 0, message: "Guardando resultados..." })

        const finalResults = {
          id: `analysis_${Date.now()}`,
          timestamp: new Date(),
          normalizedData,
          analysisResults,
          aiResults,
          summary: {
            totalRecords: rawData.length,
            validRecords: normalizedData.length,
            totalParts: analysisResults.summary.totalParts,
            totalCustomers: analysisResults.summary.totalCustomers,
            aiSignals: aiResults.totalSignals,
            confidence: aiResults.confidence,
          },
        }

        await saveDemandAnalysis(finalResults)

        updateStep("save", {
          status: "completed",
          progress: 100,
          message: "Resultados guardados exitosamente",
        })

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          results: finalResults,
        }))

        return finalResults
      } catch (error) {
        console.error("Error en procesamiento:", error)

        const errorMessage = error instanceof Error ? error.message : "Error desconocido"

        // Mark current step as error
        const currentStepId = state.steps[state.currentStep]?.id
        if (currentStepId) {
          updateStep(currentStepId, {
            status: "error",
            error: errorMessage,
            message: `Error: ${errorMessage}`,
          })
        }

        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: errorMessage,
        }))

        throw error
      }
    },
    [state.currentStep, state.steps, updateStep],
  )

  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      currentStep: 0,
      steps: [
        { id: "normalize", name: "Normalización de datos", status: "pending", progress: 0 },
        { id: "analyze", name: "Análisis estadístico", status: "pending", progress: 0 },
        { id: "ai", name: "Procesamiento con IA", status: "pending", progress: 0 },
        { id: "save", name: "Guardando resultados", status: "pending", progress: 0 },
      ],
      results: null,
      error: null,
    })
  }, [])

  return {
    ...state,
    startProcessing,
    reset,
  }
}
