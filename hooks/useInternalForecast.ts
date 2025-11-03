"use client"

import { useState, useEffect } from "react"

export interface InternalForecastData {
  clientId: string
  partId: string
  periodKey: string // YYYY-Www format
  qty: number
  modelName?: string
  modelVersion?: string
  confidence?: number
}

// Mock data para desarrollo
const mockInternalData: InternalForecastData[] = [
  {
    clientId: "BMW",
    partId: "P001",
    periodKey: "2025-W01",
    qty: 950,
    modelName: "ARIMA-v2",
    modelVersion: "2.1.0",
    confidence: 0.85,
  },
  {
    clientId: "BMW",
    partId: "P001",
    periodKey: "2025-W02",
    qty: 1150,
    modelName: "ARIMA-v2",
    modelVersion: "2.1.0",
    confidence: 0.82,
  },
  {
    clientId: "BMW",
    partId: "P002",
    periodKey: "2025-W01",
    qty: 820,
    modelName: "LSTM-v1",
    modelVersion: "1.3.2",
    confidence: 0.78,
  },
  {
    clientId: "AUDI",
    partId: "P003",
    periodKey: "2025-W01",
    qty: 580,
    modelName: "RandomForest",
    modelVersion: "3.0.1",
    confidence: 0.91,
  },
  {
    clientId: "AUDI",
    partId: "P003",
    periodKey: "2025-W02",
    qty: 720,
    modelName: "RandomForest",
    modelVersion: "3.0.1",
    confidence: 0.88,
  },
  {
    clientId: "VW",
    partId: "P004",
    periodKey: "2025-W01",
    qty: 880,
    modelName: "XGBoost",
    modelVersion: "1.7.0",
    confidence: 0.86,
  },
]

export function useInternalForecast(clientId?: string) {
  const [data, setData] = useState<InternalForecastData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Simular delay de red
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Filtrar por cliente si se especifica
      const filteredData = clientId ? mockInternalData.filter((item) => item.clientId === clientId) : mockInternalData

      setData(filteredData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching internal forecast data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [clientId])

  return { data, loading, error, refetch: fetchData }
}
