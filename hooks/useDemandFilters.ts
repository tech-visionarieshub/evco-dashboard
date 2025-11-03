"use client"

import { useState, useEffect } from "react"

export interface DemandFilters {
  dateFrom?: string
  dateTo?: string
  cliente?: string
  producto?: string
  status?: string
  priority?: string
  searchTerm?: string
}

export function useDemandFilters(initialFilters: DemandFilters = {}) {
  const [filters, setFilters] = useState<DemandFilters>(initialFilters)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)

  useEffect(() => {
    const count = Object.values(filters).filter((value) => value && value !== "").length
    setActiveFiltersCount(count)
  }, [filters])

  const updateFilter = (key: keyof DemandFilters, value: string | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  const updateFilters = (newFilters: Partial<DemandFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
    }))
  }

  const resetFilters = () => {
    setFilters({})
  }

  const hasActiveFilters = activeFiltersCount > 0

  // Convert filters to Firebase query format
  const getFirebaseFilters = () => {
    const firebaseFilters: any = {}

    if (filters.status) {
      firebaseFilters.status = filters.status
    }

    if (filters.dateFrom) {
      firebaseFilters.createdAt_gte = new Date(filters.dateFrom)
    }

    if (filters.dateTo) {
      firebaseFilters.createdAt_lte = new Date(filters.dateTo)
    }

    if (filters.cliente) {
      firebaseFilters.topClientes_contains = filters.cliente
    }

    if (filters.producto) {
      firebaseFilters.searchTerm = filters.producto
    }

    if (filters.priority) {
      switch (filters.priority) {
        case "high":
          firebaseFilters.alertasCriticas_gte = 10
          break
        case "medium":
          firebaseFilters.alertasCriticas_gte = 5
          firebaseFilters.alertasCriticas_lt = 10
          break
        case "low":
          firebaseFilters.alertasCriticas_lt = 5
          break
      }
    }

    return firebaseFilters
  }

  // Get display labels for active filters
  const getActiveFiltersLabels = () => {
    const labels: Record<string, string> = {
      dateFrom: "Desde",
      dateTo: "Hasta",
      cliente: "Cliente",
      producto: "Producto",
      status: "Estado",
      priority: "Prioridad",
      searchTerm: "Búsqueda",
    }

    return Object.entries(filters)
      .filter(([_, value]) => value && value !== "")
      .map(([key, value]) => ({
        key,
        label: labels[key] || key,
        value: value as string,
      }))
  }

  return {
    filters,
    activeFiltersCount,
    hasActiveFilters,
    updateFilter,
    updateFilters,
    resetFilters,
    getFirebaseFilters,
    getActiveFiltersLabels,
  }
}
