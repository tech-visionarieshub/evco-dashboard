"use client"

import { useState, useEffect } from "react"
import { ClientesService } from "@/lib/services/firebase-clientes"
import type { Cliente } from "@/lib/firebase/types"

export function useClientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargarClientes = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await ClientesService.obtenerTodos()
      setClientes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarClientes()
  }, [])

  const buscarCliente = async (custId: string): Promise<Cliente | null> => {
    try {
      return await ClientesService.buscarPorCustId(custId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar cliente")
      return null
    }
  }

  const buscarPorNombre = async (nombre: string): Promise<Cliente[]> => {
    try {
      return await ClientesService.buscarPorNombre(nombre)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al buscar clientes")
      return []
    }
  }

  return {
    clientes,
    loading,
    error,
    cargarClientes,
    buscarCliente,
    buscarPorNombre,
  }
}
