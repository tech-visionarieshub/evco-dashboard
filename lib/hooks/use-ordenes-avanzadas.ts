"use client"

import { useState, useEffect, useCallback } from "react"
import { OrdenesService } from "@/lib/services/firebase-ordenes"
import { LineasOrdenService } from "@/lib/services/firebase-lineas-orden"
import { HistorialService } from "@/lib/services/firebase-historial"
import type { OrdenCompra, OrdenCompraConCliente, OrdenCompraCompleta, EstadoOrden } from "@/lib/firebase/types"
import { useToast } from "@/components/ui/use-toast"

export interface FiltrosOrdenesAvanzados {
  busqueda?: string
  estado?: EstadoOrden
  fechaDesde?: string
  fechaHasta?: string
  cliente?: string
  montoMinimo?: number
  montoMaximo?: number
  tipoOrden?: string
}

export interface OpcionesOrdenacion {
  campo: "created_at" | "numero_orden" | "customer_id" | "fecha_orden"
  direccion: "asc" | "desc"
}

export function useOrdenesAvanzadas() {
  const [ordenes, setOrdenes] = useState<OrdenCompraConCliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalOrdenes, setTotalOrdenes] = useState(0)
  const [paginaActual, setPaginaActual] = useState(1)
  const [filtros, setFiltros] = useState<FiltrosOrdenesAvanzados>({})
  const [ordenacion, setOrdenacion] = useState<OpcionesOrdenacion>({
    campo: "created_at",
    direccion: "desc",
  })
  const { toast } = useToast()

  // Cache para órdenes
  const [cache, setCache] = useState<Map<string, OrdenCompraCompleta>>(new Map())

  const cargarOrdenes = useCallback(
    async (pagina = 1, limite = 20, filtrosActuales = filtros, ordenacionActual = ordenacion) => {
      try {
        setLoading(true)
        setError(null)

        const { ordenes: data, total } = await OrdenesService.obtenerTodas(pagina, limite, filtrosActuales.estado)

        // Aplicar filtros adicionales en el cliente (en producción esto debería ser en el servidor)
        let ordenesFiltradas = data

        if (filtrosActuales.busqueda) {
          const busqueda = filtrosActuales.busqueda.toLowerCase()
          ordenesFiltradas = ordenesFiltradas.filter(
            (orden) =>
              orden.numero_orden.toLowerCase().includes(busqueda) ||
              orden.customer_id.toLowerCase().includes(busqueda) ||
              orden.direccion_envio.toLowerCase().includes(busqueda),
          )
        }

        if (filtrosActuales.fechaDesde) {
          ordenesFiltradas = ordenesFiltradas.filter((orden) => orden.created_at >= filtrosActuales.fechaDesde!)
        }

        if (filtrosActuales.fechaHasta) {
          ordenesFiltradas = ordenesFiltradas.filter((orden) => orden.created_at <= filtrosActuales.fechaHasta!)
        }

        if (filtrosActuales.cliente) {
          ordenesFiltradas = ordenesFiltradas.filter((orden) => orden.customer_id === filtrosActuales.cliente)
        }

        if (filtrosActuales.tipoOrden) {
          ordenesFiltradas = ordenesFiltradas.filter((orden) => orden.tipo_orden === filtrosActuales.tipoOrden)
        }

        // Aplicar ordenación
        ordenesFiltradas.sort((a, b) => {
          const valorA = a[ordenacionActual.campo]
          const valorB = b[ordenacionActual.campo]

          if (ordenacionActual.direccion === "asc") {
            return valorA > valorB ? 1 : -1
          } else {
            return valorA < valorB ? 1 : -1
          }
        })

        setOrdenes(ordenesFiltradas)
        setTotalOrdenes(total)
        setPaginaActual(pagina)
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error desconocido"
        setError(mensaje)
        toast({
          title: "Error",
          description: `No se pudieron cargar las órdenes: ${mensaje}`,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [filtros, ordenacion, toast],
  )

  // Cargar orden completa con cache
  const cargarOrdenCompleta = useCallback(
    async (id: string): Promise<OrdenCompraCompleta | null> => {
      try {
        // Verificar cache primero
        if (cache.has(id)) {
          return cache.get(id)!
        }

        const orden = await OrdenesService.obtenerPorId(id)

        if (orden) {
          // Actualizar cache
          setCache((prev) => new Map(prev).set(id, orden))
        }

        return orden
      } catch (err) {
        console.error("Error cargando orden completa:", err)
        return null
      }
    },
    [cache],
  )

  // Duplicar orden
  const duplicarOrden = useCallback(
    async (ordenId: string): Promise<OrdenCompra | null> => {
      try {
        const ordenOriginal = await cargarOrdenCompleta(ordenId)
        if (!ordenOriginal) {
          throw new Error("No se pudo encontrar la orden original")
        }

        // Crear nueva orden basada en la original
        const nuevaOrden = await OrdenesService.crear({
          numero_orden: `${ordenOriginal.numero_orden}-COPY-${Date.now()}`,
          customer_id: ordenOriginal.cliente_id,
          direccion_envio: ordenOriginal.direccion_envio,
          fecha_orden: new Date().toISOString().split("T")[0],
          fecha_requerimiento: ordenOriginal.fecha_requerimiento,
          tipo_orden: ordenOriginal.tipo_orden,
          moneda: ordenOriginal.moneda,
          estado: "borrador",
          progreso_paso: 1,
        })

        // Duplicar líneas de orden si existen
        if (ordenOriginal.lineas_orden && ordenOriginal.lineas_orden.length > 0) {
          for (const linea of ordenOriginal.lineas_orden) {
            await LineasOrdenService.crear({
              orden_id: nuevaOrden.id,
              numero_linea: linea.numero_linea,
              sku_cliente: linea.sku_cliente,
              sku_evco: linea.sku_evco,
              descripcion: linea.descripcion,
              cantidad: linea.cantidad,
              precio: linea.precio,
              unidad: linea.unidad,
              ship_to: linea.ship_to,
            })
          }
        }

        // Registrar en historial
        await HistorialService.crear(
          nuevaOrden.id,
          "orden_duplicada",
          `Orden duplicada desde ${ordenOriginal.numero_orden}`,
          {
            orden_original_id: ordenId,
            numero_orden_original: ordenOriginal.numero_orden,
          },
        )

        toast({
          title: "Orden duplicada",
          description: `Se ha creado una copia de la orden ${ordenOriginal.numero_orden}`,
        })

        // Recargar órdenes
        await cargarOrdenes()

        return nuevaOrden
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error desconocido"
        toast({
          title: "Error",
          description: `No se pudo duplicar la orden: ${mensaje}`,
          variant: "destructive",
        })
        return null
      }
    },
    [cargarOrdenCompleta, cargarOrdenes, toast],
  )

  // Cambiar estado de múltiples órdenes
  const cambiarEstadoMasivo = useCallback(
    async (ordenesIds: string[], nuevoEstado: EstadoOrden): Promise<boolean> => {
      try {
        setLoading(true)

        const promesas = ordenesIds.map((id) => OrdenesService.cambiarEstado(id, nuevoEstado))

        await Promise.all(promesas)

        // Registrar en historial para cada orden
        const promesasHistorial = ordenesIds.map((id) =>
          HistorialService.crear(id, "cambio_estado_masivo", `Estado cambiado a ${nuevoEstado} (operación masiva)`, {
            estado_anterior: "multiple",
            estado_nuevo: nuevoEstado,
            cantidad_ordenes: ordenesIds.length,
          }),
        )

        await Promise.all(promesasHistorial)

        toast({
          title: "Estados actualizados",
          description: `Se actualizaron ${ordenesIds.length} órdenes a estado ${nuevoEstado}`,
        })

        // Recargar órdenes
        await cargarOrdenes()

        return true
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error desconocido"
        toast({
          title: "Error",
          description: `No se pudieron actualizar los estados: ${mensaje}`,
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [cargarOrdenes, toast],
  )

  // Eliminar múltiples órdenes
  const eliminarMasivo = useCallback(
    async (ordenesIds: string[]): Promise<boolean> => {
      try {
        setLoading(true)

        const promesas = ordenesIds.map((id) => OrdenesService.eliminar(id))
        await Promise.all(promesas)

        toast({
          title: "Órdenes eliminadas",
          description: `Se eliminaron ${ordenesIds.length} órdenes`,
        })

        // Recargar órdenes
        await cargarOrdenes()

        return true
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error desconocido"
        toast({
          title: "Error",
          description: `No se pudieron eliminar las órdenes: ${mensaje}`,
          variant: "destructive",
        })
        return false
      } finally {
        setLoading(false)
      }
    },
    [cargarOrdenes, toast],
  )

  // Exportar órdenes filtradas
  const exportarOrdenes = useCallback(
    async (formato: "csv" | "excel" = "csv"): Promise<void> => {
      try {
        // Obtener todas las órdenes que coincidan con los filtros actuales
        const { ordenes: todasLasOrdenes } = await OrdenesService.obtenerTodas(1, 10000, filtros.estado)

        let ordenesFiltradas = todasLasOrdenes

        // Aplicar los mismos filtros que en cargarOrdenes
        if (filtros.busqueda) {
          const busqueda = filtros.busqueda.toLowerCase()
          ordenesFiltradas = ordenesFiltradas.filter(
            (orden) =>
              orden.numero_orden.toLowerCase().includes(busqueda) ||
              orden.customer_id.toLowerCase().includes(busqueda) ||
              orden.direccion_envio.toLowerCase().includes(busqueda),
          )
        }

        // Preparar datos para exportación
        const datosExportacion = ordenesFiltradas.map((orden) => ({
          "Número de Orden": orden.numero_orden,
          "Customer ID": orden.customer_id,
          "Dirección de Envío": orden.direccion_envio,
          "Fecha de Orden": orden.fecha_orden,
          "Fecha Requerimiento": orden.fecha_requerimiento || "",
          "Tipo de Orden": orden.tipo_orden,
          Moneda: orden.moneda,
          Estado: orden.estado,
          Progreso: `${orden.progreso_paso}/3`,
          "Fecha Creación": new Date(orden.created_at).toLocaleDateString("es-ES"),
          "Última Actualización": new Date(orden.updated_at).toLocaleDateString("es-ES"),
        }))

        // Generar CSV
        const headers = Object.keys(datosExportacion[0] || {})
        const csvContent = [
          headers.join(","),
          ...datosExportacion.map((row) => headers.map((header) => `"${row[header as keyof typeof row]}"`).join(",")),
        ].join("\n")

        // Descargar archivo
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", `ordenes_${new Date().toISOString().split("T")[0]}.csv`)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        toast({
          title: "Exportación completada",
          description: `Se exportaron ${datosExportacion.length} órdenes`,
        })
      } catch (err) {
        const mensaje = err instanceof Error ? err.message : "Error desconocido"
        toast({
          title: "Error",
          description: `No se pudo exportar: ${mensaje}`,
          variant: "destructive",
        })
      }
    },
    [filtros, toast],
  )

  // Buscar órdenes con debounce
  const buscarOrdenes = useCallback(async (termino: string) => {
    setFiltros((prev) => ({ ...prev, busqueda: termino }))
  }, [])

  // Aplicar filtros
  const aplicarFiltros = useCallback(
    async (nuevosFiltros: FiltrosOrdenesAvanzados) => {
      setFiltros(nuevosFiltros)
      setPaginaActual(1)
      await cargarOrdenes(1, 20, nuevosFiltros, ordenacion)
    },
    [cargarOrdenes, ordenacion],
  )

  // Cambiar ordenación
  const cambiarOrdenacion = useCallback(
    async (nuevaOrdenacion: OpcionesOrdenacion) => {
      setOrdenacion(nuevaOrdenacion)
      await cargarOrdenes(paginaActual, 20, filtros, nuevaOrdenacion)
    },
    [cargarOrdenes, paginaActual, filtros],
  )

  // Limpiar cache
  const limpiarCache = useCallback(() => {
    setCache(new Map())
  }, [])

  // Cargar datos iniciales
  useEffect(() => {
    cargarOrdenes()
  }, [])

  return {
    // Estado
    ordenes,
    loading,
    error,
    totalOrdenes,
    paginaActual,
    filtros,
    ordenacion,

    // Acciones básicas
    cargarOrdenes,
    cargarOrdenCompleta,
    buscarOrdenes,
    aplicarFiltros,
    cambiarOrdenacion,

    // Acciones avanzadas
    duplicarOrden,
    cambiarEstadoMasivo,
    eliminarMasivo,
    exportarOrdenes,

    // Utilidades
    limpiarCache,

    // Navegación
    irAPagina: (pagina: number) => cargarOrdenes(pagina),
    siguientePagina: () => cargarOrdenes(paginaActual + 1),
    paginaAnterior: () => cargarOrdenes(Math.max(1, paginaActual - 1)),
  }
}

// Hook para estadísticas de órdenes
export function useEstadisticasOrdenes() {
  const [estadisticas, setEstadisticas] = useState({
    totalOrdenes: 0,
    ordenesPorEstado: {} as Record<EstadoOrden, number>,
    tendenciaMensual: [] as Array<{ mes: string; cantidad: number }>,
    clientesActivos: 0,
    promedioLineasPorOrden: 0,
  })
  const [loading, setLoading] = useState(true)

  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true)

      // En una implementación real, esto sería una llamada a la API
      // Por ahora usamos datos mock
      const stats = {
        totalOrdenes: 150,
        ordenesPorEstado: {
          borrador: 25,
          validacion: 30,
          procesada: 45,
          completada: 40,
          cancelada: 10,
        } as Record<EstadoOrden, number>,
        tendenciaMensual: [
          { mes: "Ene", cantidad: 20 },
          { mes: "Feb", cantidad: 25 },
          { mes: "Mar", cantidad: 30 },
          { mes: "Abr", cantidad: 28 },
          { mes: "May", cantidad: 35 },
          { mes: "Jun", cantidad: 40 },
        ],
        clientesActivos: 15,
        promedioLineasPorOrden: 3.2,
      }

      setEstadisticas(stats)
    } catch (error) {
      console.error("Error cargando estadísticas:", error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarEstadisticas()
  }, [cargarEstadisticas])

  return {
    estadisticas,
    loading,
    cargarEstadisticas,
  }
}
