"use client"

import { useState, useCallback } from "react"

export type ForecastFlowStep = "upload" | "validate" | "compare" | "confirm" | "complete"

export interface ForecastFlowState {
  currentStep: ForecastFlowStep
  data: any
  isLoading: boolean
  error: string | null
}

export function useForecastFlowState() {
  const [state, setState] = useState<ForecastFlowState>({
    currentStep: "upload",
    data: null,
    isLoading: false,
    error: null,
  })

  const setStep = useCallback((step: ForecastFlowStep) => {
    setState((prev) => ({ ...prev, currentStep: step }))
  }, [])

  const setData = useCallback((data: any) => {
    setState((prev) => ({ ...prev, data }))
  }, [])

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }))
  }, [])

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }))
  }, [])

  const reset = useCallback(() => {
    setState({
      currentStep: "upload",
      data: null,
      isLoading: false,
      error: null,
    })
  }, [])

  const nextStep = useCallback(() => {
    setState((prev) => {
      const steps: ForecastFlowStep[] = ["upload", "validate", "compare", "confirm", "complete"]
      const currentIndex = steps.indexOf(prev.currentStep)
      const nextIndex = Math.min(currentIndex + 1, steps.length - 1)
      return { ...prev, currentStep: steps[nextIndex] }
    })
  }, [])

  const prevStep = useCallback(() => {
    setState((prev) => {
      const steps: ForecastFlowStep[] = ["upload", "validate", "compare", "confirm", "complete"]
      const currentIndex = steps.indexOf(prev.currentStep)
      const prevIndex = Math.max(currentIndex - 1, 0)
      return { ...prev, currentStep: steps[prevIndex] }
    })
  }, [])

  return {
    ...state,
    setStep,
    setData,
    setLoading,
    setError,
    reset,
    nextStep,
    prevStep,
  }
}
