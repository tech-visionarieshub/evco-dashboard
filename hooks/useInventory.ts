"use client"

import { useState, useEffect } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase/client"
import type { InventoryItem } from "@/types/demand-ai"

export function useInventory() {
  const [data, setData] = useState<InventoryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const inventoryRef = collection(db, "inventory")
        const snapshot = await getDocs(inventoryRef)

        const inventoryData: InventoryItem[] = []

        snapshot.forEach((doc) => {
          const data = doc.data()
          inventoryData.push({
            partNum: data.partNum || doc.id,
            currentStock: data.currentStock || 0,
            safetyStock: data.safetyStock || 0,
            leadTimeDays: data.leadTimeDays || 7,
            moq: data.moq || 1,
            unitCost: data.unitCost || 0,
            category: data.category || "General",
          })
        })

        console.log(`[Inventory] Loaded ${inventoryData.length} items from Firebase`)
        setData(inventoryData)
      } catch (err) {
        console.error("[Inventory] Error fetching data:", err)
        setError("Error cargando datos de inventario")

        // Fallback con datos mock
        setData([
          {
            partNum: "PART001",
            currentStock: 100,
            safetyStock: 20,
            leadTimeDays: 14,
            moq: 10,
            unitCost: 25.5,
            category: "Electronics",
          },
          {
            partNum: "PART002",
            currentStock: 50,
            safetyStock: 15,
            leadTimeDays: 7,
            moq: 5,
            unitCost: 12.75,
            category: "Mechanical",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    }

    fetchInventory()
  }, [])

  const refetch = () => {
    setIsLoading(true)
    // Re-ejecutar el efecto
    fetchInventory()
  }

  const fetchInventory = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const inventoryRef = collection(db, "inventory")
      const snapshot = await getDocs(inventoryRef)

      const inventoryData: InventoryItem[] = []

      snapshot.forEach((doc) => {
        const data = doc.data()
        inventoryData.push({
          partNum: data.partNum || doc.id,
          currentStock: data.currentStock || 0,
          safetyStock: data.safetyStock || 0,
          leadTimeDays: data.leadTimeDays || 7,
          moq: data.moq || 1,
          unitCost: data.unitCost || 0,
          category: data.category || "General",
        })
      })

      console.log(`[Inventory] Loaded ${inventoryData.length} items from Firebase`)
      setData(inventoryData)
    } catch (err) {
      console.error("[Inventory] Error fetching data:", err)
      setError("Error cargando datos de inventario")

      // Fallback con datos mock
      setData([
        {
          partNum: "PART001",
          currentStock: 100,
          safetyStock: 20,
          leadTimeDays: 14,
          moq: 10,
          unitCost: 25.5,
          category: "Electronics",
        },
        {
          partNum: "PART002",
          currentStock: 50,
          safetyStock: 15,
          leadTimeDays: 7,
          moq: 5,
          unitCost: 12.75,
          category: "Mechanical",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return {
    data,
    isLoading,
    error,
    refetch,
  }
}

// Hook para obtener inventario de una parte específica
export function useInventoryByPart(partNum: string) {
  const { data, isLoading, error } = useInventory()

  const partInventory = data.find((item) => item.partNum === partNum)

  return {
    data: partInventory,
    isLoading,
    error,
    exists: !!partInventory,
  }
}

// Hook para obtener partes con bajo stock
export function useLowStockParts(threshold = 1.5) {
  const { data, isLoading, error } = useInventory()

  const lowStockParts = data.filter((item) => {
    const weeksOfStock = item.safetyStock > 0 ? item.currentStock / item.safetyStock : 0
    return weeksOfStock < threshold
  })

  return {
    data: lowStockParts,
    count: lowStockParts.length,
    isLoading,
    error,
  }
}
