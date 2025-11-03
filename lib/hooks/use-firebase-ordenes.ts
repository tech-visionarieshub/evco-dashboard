"use client"

import { useState, useEffect } from "react"
import { OrdenesService } from "@/lib/services/firebase-ordenes"
import type { OrdenCompra, OrdenCompraConCliente, OrdenCompraCompleta, EstadoOrden } from "@/lib/firebase/types"

export function useOrdenes(estado?: EstadoOrden) {
  const [ordenes, setOrdenes] = useState<OrdenCompraConCliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarOrdenes = async () => {
    try {
      setLoading(true)
      setError(null)
      const { ordenes: data } = await OrdenesService.obtenerTodas(1, 50, estado)
      setOrdenes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarOrdenes()
  }, [estado])

  const crearOrden = async (orden: any): Promise<OrdenCompra | null> => {
    try {
      const nuevaOrden = await OrdenesService.crear(orden)
      await cargarOrdenes()
      return nuevaOrden
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear orden")
      return null
    }
  }

  const actualizarOrden = async (id: string, updates: any): Promise<boolean> => {
    try {
      await OrdenesService.actualizar(id, updates)
      await cargarOrdenes()
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar orden")
      return false
    }
  }

  return {
    ordenes,
    loading,
    error,
    cargarOrdenes,
    crearOrden,
    actualizarOrden,
  }
}

export function useOrden(id: string | null) {
  const [orden, setOrden] = useState<OrdenCompraCompleta | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarOrden = async () => {
    if (!id) {
      setOrden(null)
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      const data = await OrdenesService.obtenerPorId(id)
      setOrden(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar orden")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarOrden()
  }, [id])

  return {
    orden,
    loading,
    error,
    cargarOrden,
  }
}
