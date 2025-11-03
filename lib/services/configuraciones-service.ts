"use client"

import { useEffect } from "react"

import { useState } from "react"

export interface ConfiguracionUsuario {
  id: string
  tema: "light" | "dark" | "system"
  idioma: "es" | "en"
  notificaciones: {
    navegador: boolean
    email: boolean
    sonido: boolean
    ordenesNuevas: boolean
    cambiosEstado: boolean
    erroresValidacion: boolean
  }
  dashboard: {
    mostrarEstadisticas: boolean
    mostrarGraficos: boolean
    actualizacionAutomatica: boolean
    intervaloActualizacion: number // en segundos
  }
  tablas: {
    filasPorPagina: number
    ordenacionDefault: "asc" | "desc"
    columnaOrdenDefault: string
    mostrarFiltrosAvanzados: boolean
  }
  formularios: {
    autoguardado: boolean
    validacionTiempoReal: boolean
    confirmarCambios: boolean
  }
  exportacion: {
    formatoDefault: "csv" | "excel" | "pdf"
    incluirMetadatos: boolean
    separadorCSV: "," | ";"
  }
  fechaCreacion: string
  fechaActualizacion: string
}

export class ConfiguracionesService {
  private static readonly STORAGE_KEY = "evco_configuraciones_usuario"
  private static configuracion: ConfiguracionUsuario | null = null
  private static listeners: Set<(config: ConfiguracionUsuario) => void> = new Set()

  // Obtener configuración actual
  static obtener(): ConfiguracionUsuario {
    if (!this.configuracion) {
      this.cargarConfiguracion()
    }
    return this.configuracion!
  }

  // Cargar configuración desde localStorage
  private static cargarConfiguracion() {
    try {
      const configGuardada = localStorage.getItem(this.STORAGE_KEY)
      if (configGuardada) {
        const config = JSON.parse(configGuardada)
        this.configuracion = { ...this.obtenerConfiguracionDefault(), ...config }
      } else {
        this.configuracion = this.obtenerConfiguracionDefault()
      }
    } catch (error) {
      console.error("Error cargando configuración:", error)
      this.configuracion = this.obtenerConfiguracionDefault()
    }
  }

  // Guardar configuración
  private static guardarConfiguracion() {
    try {
      if (this.configuracion) {
        this.configuracion.fechaActualizacion = new Date().toISOString()
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.configuracion))
        this.notificarCambios()
      }
    } catch (error) {
      console.error("Error guardando configuración:", error)
    }
  }

  // Actualizar configuración
  static actualizar(cambios: Partial<ConfiguracionUsuario>) {
    if (!this.configuracion) {
      this.cargarConfiguracion()
    }

    this.configuracion = {
      ...this.configuracion!,
      ...cambios,
    }

    this.guardarConfiguracion()
  }

  // Actualizar sección específica
  static actualizarSeccion<K extends keyof ConfiguracionUsuario>(
    seccion: K,
    cambios: Partial<ConfiguracionUsuario[K]>,
  ) {
    if (!this.configuracion) {
      this.cargarConfiguracion()
    }

    this.configuracion = {
      ...this.configuracion!,
      [seccion]: {
        ...this.configuracion![seccion],
        ...cambios,
      },
    }

    this.guardarConfiguracion()
  }

  // Restablecer a valores por defecto
  static restablecerDefault() {
    this.configuracion = this.obtenerConfiguracionDefault()
    this.guardarConfiguracion()
  }

  // Exportar configuración
  static exportar(): string {
    return JSON.stringify(this.obtener(), null, 2)
  }

  // Importar configuración
  static importar(configJson: string): boolean {
    try {
      const configImportada = JSON.parse(configJson)

      // Validar estructura básica
      if (!configImportada.id || !configImportada.tema) {
        throw new Error("Configuración inválida")
      }

      // Combinar con configuración actual para mantener campos nuevos
      const configActual = this.obtener()
      this.configuracion = {
        ...configActual,
        ...configImportada,
        id: configActual.id, // Mantener ID actual
        fechaActualizacion: new Date().toISOString(),
      }

      this.guardarConfiguracion()
      return true
    } catch (error) {
      console.error("Error importando configuración:", error)
      return false
    }
  }

  // Suscribirse a cambios
  static suscribirse(callback: (config: ConfiguracionUsuario) => void) {
    this.listeners.add(callback)

    // Enviar configuración actual inmediatamente
    callback(this.obtener())

    // Retornar función para desuscribirse
    return () => {
      this.listeners.delete(callback)
    }
  }

  // Notificar cambios a listeners
  private static notificarCambios() {
    if (this.configuracion) {
      this.listeners.forEach((callback) => {
        callback(this.configuracion!)
      })
    }
  }

  // Aplicar tema
  static aplicarTema(tema: ConfiguracionUsuario["tema"]) {
    const root = document.documentElement

    if (tema === "system") {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      tema = prefersDark ? "dark" : "light"
    }

    if (tema === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

    this.actualizarSeccion("tema", tema)
  }

  // Configuración por defecto
  private static obtenerConfiguracionDefault(): ConfiguracionUsuario {
    return {
      id: `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      tema: "system",
      idioma: "es",
      notificaciones: {
        navegador: false,
        email: true,
        sonido: true,
        ordenesNuevas: true,
        cambiosEstado: true,
        erroresValidacion: true,
      },
      dashboard: {
        mostrarEstadisticas: true,
        mostrarGraficos: true,
        actualizacionAutomatica: true,
        intervaloActualizacion: 30,
      },
      tablas: {
        filasPorPagina: 20,
        ordenacionDefault: "desc",
        columnaOrdenDefault: "created_at",
        mostrarFiltrosAvanzados: false,
      },
      formularios: {
        autoguardado: true,
        validacionTiempoReal: true,
        confirmarCambios: true,
      },
      exportacion: {
        formatoDefault: "csv",
        incluirMetadatos: false,
        separadorCSV: ",",
      },
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
    }
  }
}

// Hook para usar configuraciones en componentes
export function useConfiguraciones() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionUsuario>(ConfiguracionesService.obtener())

  useEffect(() => {
    const desuscribir = ConfiguracionesService.suscribirse(setConfiguracion)
    return desuscribir
  }, [])

  return {
    configuracion,
    actualizar: ConfiguracionesService.actualizar,
    actualizarSeccion: ConfiguracionesService.actualizarSeccion,
    restablecerDefault: ConfiguracionesService.restablecerDefault,
    exportar: ConfiguracionesService.exportar,
    importar: ConfiguracionesService.importar,
    aplicarTema: ConfiguracionesService.aplicarTema,
  }
}
