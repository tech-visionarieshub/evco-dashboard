"use client"

import { useState, useEffect } from "react"

export interface ClientForecastData {
  clientId: string
  partId: string
  periodKey: string // YYYY-Www
  qty: number
}

export function useClientForecast(clientId?: string): {
  data: ClientForecastData[]
  loading: boolean
  error: string | null
  refetch: () => void
} {
  const [data, setData] = useState<ClientForecastData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    try {
      // TODO: Replace with Firebase query when ready
      // const db = getDb();
      // const q = query(collection(db, "forecasts"), where("source", "==", "client"));
      // if (clientId) q = query(q, where("clientId", "==", clientId));
      // const snapshot = await getDocs(q);

      // Mock data for now
      await new Promise((resolve) => setTimeout(resolve, 500)) // Simulate API call

      const mockData: ClientForecastData[] = [
        { clientId: "BMW", partId: "P001", periodKey: "2025-W01", qty: 1000 },
        { clientId: "BMW", partId: "P001", periodKey: "2025-W02", qty: 1200 },
        { clientId: "BMW", partId: "P002", periodKey: "2025-W01", qty: 800 },
        { clientId: "AUDI", partId: "P003", periodKey: "2025-W01", qty: 600 },
        { clientId: "AUDI", partId: "P003", periodKey: "2025-W02", qty: 750 },
        { clientId: "VW", partId: "P004", periodKey: "2025-W01", qty: 900 },
      ]

      const filteredData = clientId ? mockData.filter((item) => item.clientId === clientId) : mockData

      setData(filteredData)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error fetching client forecast data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [clientId])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
  }
}
