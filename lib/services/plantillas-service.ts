"use client"

import type { OrdenCompraFormData, LineaOrden } from "@/lib/types/orden-compra"

export interface PlantillaOrden {
  id: string
  nombre: string
  descripcion: string
  customerId: string
  tipoOrden: string
  canalRecepcion: string
  shipTo?: string
  billTo?: string
  observaciones?: string
  lineasPlantilla: Omit<LineaOrden, "numeroLinea">[]
  fechaCreacion: string
  fechaActualizacion: string
  usosCount: number
  activa: boolean
  etiquetas: string[]
}

export class PlantillasService {
  private static readonly STORAGE_KEY = "evco_plantillas_ordenes"

  // Obtener todas las plantillas
  static obtenerTodas(): PlantillaOrden[] {
    try {
      const plantillasJson = localStorage.getItem(this.STORAGE_KEY)
      if (!plantillasJson) return this.obtenerPlantillasDefault()

      const plantillas = JSON.parse(plantillasJson)
      return Array.isArray(plantillas) ? plantillas : this.obtenerPlantillasDefault()
    } catch (error) {
      console.error("Error obteniendo plantillas:", error)
      return this.obtenerPlantillasDefault()
    }
  }

  // Obtener plantillas por cliente
  static obtenerPorCliente(customerId: string): PlantillaOrden[] {
    return this.obtenerTodas().filter((plantilla) => plantilla.customerId === customerId && plantilla.activa)
  }

  // Obtener plantilla por ID
  static obtenerPorId(id: string): PlantillaOrden | null {
    const plantillas = this.obtenerTodas()
    return plantillas.find((p) => p.id === id) || null
  }

  // Crear nueva plantilla
  static crear(
    plantilla: Omit<PlantillaOrden, "id" | "fechaCreacion" | "fechaActualizacion" | "usosCount">,
  ): PlantillaOrden {
    const nuevaPlantilla: PlantillaOrden = {
      ...plantilla,
      id: `plantilla_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      usosCount: 0,
    }

    const plantillas = this.obtenerTodas()
    plantillas.push(nuevaPlantilla)
    this.guardarPlantillas(plantillas)

    return nuevaPlantilla
  }

  // Actualizar plantilla
  static actualizar(
    id: string,
    cambios: Partial<Omit<PlantillaOrden, "id" | "fechaCreacion" | "usosCount">>,
  ): PlantillaOrden | null {
    const plantillas = this.obtenerTodas()
    const indice = plantillas.findIndex((p) => p.id === id)

    if (indice === -1) return null

    plantillas[indice] = {
      ...plantillas[indice],
      ...cambios,
      fechaActualizacion: new Date().toISOString(),
    }

    this.guardarPlantillas(plantillas)
    return plantillas[indice]
  }

  // Eliminar plantilla
  static eliminar(id: string): boolean {
    const plantillas = this.obtenerTodas()
    const plantillasFiltradas = plantillas.filter((p) => p.id !== id)

    if (plantillasFiltradas.length === plantillas.length) return false

    this.guardarPlantillas(plantillasFiltradas)
    return true
  }

  // Duplicar plantilla
  static duplicar(id: string, nuevoNombre?: string): PlantillaOrden | null {
    const plantillaOriginal = this.obtenerPorId(id)
    if (!plantillaOriginal) return null

    const plantillaDuplicada = this.crear({
      ...plantillaOriginal,
      nombre: nuevoNombre || `${plantillaOriginal.nombre} (Copia)`,
      descripcion: `Copia de: ${plantillaOriginal.descripcion}`,
      activa: true,
    })

    return plantillaDuplicada
  }

  // Usar plantilla (incrementar contador)
  static usarPlantilla(id: string): PlantillaOrden | null {
    const plantillas = this.obtenerTodas()
    const indice = plantillas.findIndex((p) => p.id === id)

    if (indice === -1) return null

    plantillas[indice].usosCount++
    plantillas[indice].fechaActualizacion = new Date().toISOString()

    this.guardarPlantillas(plantillas)
    return plantillas[indice]
  }

  // Crear orden desde plantilla
  static crearOrdenDesdeplantilla(
    plantillaId: string,
    datosAdicionales?: Partial<OrdenCompraFormData>,
  ): {
    formData: OrdenCompraFormData
    lineas: LineaOrden[]
  } | null {
    const plantilla = this.obtenerPorId(plantillaId)
    if (!plantilla) return null

    // Incrementar contador de usos
    this.usarPlantilla(plantillaId)

    // Crear datos del formulario
    const formData: OrdenCompraFormData = {
      customerId: plantilla.customerId,
      poNumber: "", // Debe ser llenado por el usuario
      fechaOrden: new Date().toISOString().split("T")[0],
      fechaRequerida: "", // Debe ser llenado por el usuario
      canalRecepcion: plantilla.canalRecepcion,
      shipTo: plantilla.shipTo,
      billTo: plantilla.billTo,
      tipoOrden: plantilla.tipoOrden,
      observaciones: plantilla.observaciones,
      ...datosAdicionales,
    }

    // Crear líneas con números de línea
    const lineas: LineaOrden[] = plantilla.lineasPlantilla.map((linea, index) => ({
      ...linea,
      numeroLinea: index + 1,
    }))

    return { formData, lineas }
  }

  // Buscar plantillas
  static buscar(
    termino: string,
    filtros?: {
      customerId?: string
      tipoOrden?: string
      etiquetas?: string[]
      activa?: boolean
    },
  ): PlantillaOrden[] {
    let plantillas = this.obtenerTodas()

    // Filtrar por término de búsqueda
    if (termino.trim()) {
      const terminoLower = termino.toLowerCase()
      plantillas = plantillas.filter(
        (p) =>
          p.nombre.toLowerCase().includes(terminoLower) ||
          p.descripcion.toLowerCase().includes(terminoLower) ||
          p.customerId.toLowerCase().includes(terminoLower) ||
          p.etiquetas.some((etiqueta) => etiqueta.toLowerCase().includes(terminoLower)),
      )
    }

    // Aplicar filtros adicionales
    if (filtros) {
      if (filtros.customerId) {
        plantillas = plantillas.filter((p) => p.customerId === filtros.customerId)
      }

      if (filtros.tipoOrden) {
        plantillas = plantillas.filter((p) => p.tipoOrden === filtros.tipoOrden)
      }

      if (filtros.etiquetas && filtros.etiquetas.length > 0) {
        plantillas = plantillas.filter((p) => filtros.etiquetas!.some((etiqueta) => p.etiquetas.includes(etiqueta)))
      }

      if (filtros.activa !== undefined) {
        plantillas = plantillas.filter((p) => p.activa === filtros.activa)
      }
    }

    return plantillas.sort((a, b) => b.usosCount - a.usosCount) // Ordenar por más usadas
  }

  // Obtener estadísticas de plantillas
  static obtenerEstadisticas(): {
    totalPlantillas: number
    plantillasActivas: number
    plantillasMasUsadas: PlantillaOrden[]
    clientesConPlantillas: string[]
    tiposOrdenMasComunes: Array<{ tipo: string; cantidad: number }>
  } {
    const plantillas = this.obtenerTodas()

    const clientesUnicos = [...new Set(plantillas.map((p) => p.customerId))]

    const tiposOrden = plantillas.reduce(
      (acc, p) => {
        acc[p.tipoOrden] = (acc[p.tipoOrden] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const tiposOrdenMasComunes = Object.entries(tiposOrden)
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)

    return {
      totalPlantillas: plantillas.length,
      plantillasActivas: plantillas.filter((p) => p.activa).length,
      plantillasMasUsadas: plantillas
        .filter((p) => p.usosCount > 0)
        .sort((a, b) => b.usosCount - a.usosCount)
        .slice(0, 5),
      clientesConPlantillas: clientesUnicos,
      tiposOrdenMasComunes,
    }
  }

  // Exportar plantillas
  static exportar(): string {
    const plantillas = this.obtenerTodas()
    return JSON.stringify(plantillas, null, 2)
  }

  // Importar plantillas
  static importar(plantillasJson: string): { exitosas: number; errores: string[] } {
    try {
      const plantillasImportadas = JSON.parse(plantillasJson)

      if (!Array.isArray(plantillasImportadas)) {
        return { exitosas: 0, errores: ["El archivo no contiene un array válido de plantillas"] }
      }

      const plantillasExistentes = this.obtenerTodas()
      const errores: string[] = []
      let exitosas = 0

      plantillasImportadas.forEach((plantilla, index) => {
        try {
          // Validar estructura básica
          if (!plantilla.nombre || !plantilla.customerId) {
            errores.push(`Plantilla ${index + 1}: Faltan campos obligatorios (nombre, customerId)`)
            return
          }

          // Generar nuevo ID para evitar conflictos
          const nuevaPlantilla: PlantillaOrden = {
            ...plantilla,
            id: `plantilla_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            usosCount: 0,
          }

          plantillasExistentes.push(nuevaPlantilla)
          exitosas++
        } catch (error) {
          errores.push(`Plantilla ${index + 1}: Error procesando - ${error}`)
        }
      })

      if (exitosas > 0) {
        this.guardarPlantillas(plantillasExistentes)
      }

      return { exitosas, errores }
    } catch (error) {
      return { exitosas: 0, errores: [`Error parseando JSON: ${error}`] }
    }
  }

  // Guardar plantillas en localStorage
  private static guardarPlantillas(plantillas: PlantillaOrden[]) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(plantillas))
    } catch (error) {
      console.error("Error guardando plantillas:", error)
      throw new Error("No se pudieron guardar las plantillas")
    }
  }

  // Obtener plantillas por defecto
  private static obtenerPlantillasDefault(): PlantillaOrden[] {
    return [
      {
        id: "plantilla_default_1",
        nombre: "Orden Estándar MANI001",
        descripcion: "Plantilla estándar para órdenes de Manitowoc",
        customerId: "MANI001",
        tipoOrden: "Estándar",
        canalRecepcion: "Email",
        shipTo: "REYNOSA",
        billTo: "REYNOSA",
        observaciones: "Orden estándar con términos habituales",
        lineasPlantilla: [
          {
            skuCliente: "DTA-30-001",
            skuEvco: "EVP-2345",
            descripcion: "DISTRIBUTION TUBE ASSY 30 IN",
            cantidad: 100,
            precio: 5.24,
            unidad: "EACH",
            shipTo: "REYNOSA",
          },
        ],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        usosCount: 0,
        activa: true,
        etiquetas: ["estándar", "manitowoc", "frecuente"],
      },
      {
        id: "plantilla_default_2",
        nombre: "Orden Urgente CAT002",
        descripcion: "Plantilla para órdenes urgentes de Caterpillar",
        customerId: "CAT002",
        tipoOrden: "Urgente",
        canalRecepcion: "Portal",
        shipTo: "MTY1",
        billTo: "MTY1",
        observaciones: "ORDEN URGENTE - Procesar con prioridad alta",
        lineasPlantilla: [
          {
            skuCliente: "BA-500-004",
            skuEvco: "EVP-4567",
            descripcion: "BEARING ASSEMBLY",
            cantidad: 50,
            precio: 45.75,
            unidad: "EACH",
            shipTo: "MTY1",
          },
        ],
        fechaCreacion: new Date().toISOString(),
        fechaActualizacion: new Date().toISOString(),
        usosCount: 0,
        activa: true,
        etiquetas: ["urgente", "caterpillar", "prioridad"],
      },
    ]
  }
}
