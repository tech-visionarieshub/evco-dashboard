"use client"

import { useEffect, useState } from "react"

export type ForecastSource = "client" | "internal" | ""
export type Nature = "new" | "correction"

export type ModelParams = {
  name?: string
  version?: string
  comments?: string
}

export type FlowState = {
  source: ForecastSource
  clientId: string
  nature: Nature
  modelParams?: ModelParams | null
  fileName?: string
  fileSize?: string
  // Preview and analysis
  previewData: any[]
  detectedFormat: "weekly" | "monthly" | null
  detectedDate: string | null
  detectedYear: number | null
  fileAnalysis?: {
    rowCount: number
    format: string
    mappedColumns: string[]
    missingColumns: string[]
    period?: string
  } | null
}

const KEY = "forecastFlow"

const defaultState: FlowState = {
  source: "",
  clientId: "",
  nature: "new",
  modelParams: null,
  fileName: "",
  fileSize: "",
  previewData: [],
  detectedFormat: null,
  detectedDate: null,
  detectedYear: null,
  fileAnalysis: null,
}

export function getFlowState(): FlowState {
  if (typeof window === "undefined") return defaultState
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return defaultState
    const parsed = JSON.parse(raw)
    return { ...defaultState, ...parsed }
  } catch {
    return defaultState
  }
}

export function setFlowState(partial: Partial<FlowState>) {
  if (typeof window === "undefined") return
  const prev = getFlowState()
  const next = { ...prev, ...partial }
  localStorage.setItem(KEY, JSON.stringify(next))
}

export function clearFlowState() {
  if (typeof window === "undefined") return
  localStorage.removeItem(KEY)
}

export function useFlowState() {
  const [state, setState] = useState<FlowState>(defaultState)
  useEffect(() => {
    setState(getFlowState())
  }, [])
  const update = (partial: Partial<FlowState>) => {
    setFlowState(partial)
    setState((prev) => ({ ...prev, ...partial }))
  }
  const clear = () => {
    clearFlowState()
    setState(defaultState)
  }
  return { state, update, clear }
}
