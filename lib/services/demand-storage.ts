import type { AIAnalysisResult } from "../demand/ai"
import type { DemandAnalysisResult } from "../demand/analyzeDemand"
import type { NormalizedConsumptionRecord } from "../demand/normalizeConsumption"

export interface StoredDemandAnalysis {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  normalizedData: NormalizedConsumptionRecord[]
  analysisResult: DemandAnalysisResult
  aiResult?: AIAnalysisResult
  metadata: {
    fileName: string
    fileSize: number
    recordCount: number
    dateRange: {
      start: Date
      end: Date
    }
  }
}

const STORAGE_KEY = "evco_demand_analyses"

export function saveDemandAnalysis(analysis: Omit<StoredDemandAnalysis, "id" | "createdAt" | "updatedAt">): string {
  const analyses = getDemandAnalyses()

  const newAnalysis: StoredDemandAnalysis = {
    ...analysis,
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  analyses.push(newAnalysis)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses, dateReplacer))

  return newAnalysis.id
}

export function getDemandAnalyses(): StoredDemandAnalysis[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return []

    const analyses = JSON.parse(stored, dateReviver)
    return Array.isArray(analyses) ? analyses : []
  } catch (error) {
    console.error("Error loading demand analyses:", error)
    return []
  }
}

export function getDemandAnalysis(id: string): StoredDemandAnalysis | null {
  const analyses = getDemandAnalyses()
  return analyses.find((a) => a.id === id) || null
}

export function updateDemandAnalysis(id: string, updates: Partial<StoredDemandAnalysis>): boolean {
  const analyses = getDemandAnalyses()
  const index = analyses.findIndex((a) => a.id === id)

  if (index === -1) return false

  analyses[index] = {
    ...analyses[index],
    ...updates,
    updatedAt: new Date(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(analyses, dateReplacer))
  return true
}

export function deleteDemandAnalysis(id: string): boolean {
  const analyses = getDemandAnalyses()
  const filteredAnalyses = analyses.filter((a) => a.id !== id)

  if (filteredAnalyses.length === analyses.length) return false

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filteredAnalyses, dateReplacer))
  return true
}

export function clearAllDemandAnalyses(): void {
  localStorage.removeItem(STORAGE_KEY)
}

export function getAnalysisStats() {
  const analyses = getDemandAnalyses()

  return {
    total: analyses.length,
    totalRecords: analyses.reduce((sum, a) => sum + a.metadata.recordCount, 0),
    avgRecordsPerAnalysis:
      analyses.length > 0 ? analyses.reduce((sum, a) => sum + a.metadata.recordCount, 0) / analyses.length : 0,
    oldestAnalysis:
      analyses.length > 0
        ? analyses.reduce((oldest, a) => (a.createdAt < oldest.createdAt ? a : oldest)).createdAt
        : null,
    newestAnalysis:
      analyses.length > 0
        ? analyses.reduce((newest, a) => (a.createdAt > newest.createdAt ? a : newest)).createdAt
        : null,
  }
}

function generateId(): string {
  return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

function dateReplacer(key: string, value: any) {
  if (value instanceof Date) {
    return { __type: "Date", value: value.toISOString() }
  }
  return value
}

function dateReviver(key: string, value: any) {
  if (value && typeof value === "object" && value.__type === "Date") {
    return new Date(value.value)
  }
  return value
}

// Export functions for backward compatibility
export { saveDemandAnalysis as saveAnalysis }
export { getDemandAnalyses as getAnalyses }
export { getDemandAnalysis as getAnalysis }
export { updateDemandAnalysis as updateAnalysis }
export { deleteDemandAnalysis as deleteAnalysis }
