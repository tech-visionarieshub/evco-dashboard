"use client"

import { useEffect } from "react"

import { useState } from "react"

// Importación removida - migrado a Firebase
// El servicio ahora usa solo localStorage para notificaciones locales

export interface Notificacion {
  id: string
  tipo: "info" | "success" | "warning" | "error"
  titulo: string
  mensaje: string
  leida: boolean
  fechaCreacion: string
  metadatos?: Record<string, any>
  accion?: {
    texto: string
    url: string
  }
}

export class NotificacionesService {
  private static listeners: Set<(notificaciones: Notificacion[]) => void> = new Set()
  private static notificaciones: Notificacion[] = []

  // Inicializar servicio de notificaciones
  static async inicializar() {
    try {
      // Cargar notificaciones existentes
      await this.cargarNotificaciones()

      // TODO: Migrar suscripción en tiempo real a Firebase Firestore listeners
      // Por ahora, las notificaciones se manejan localmente vía localStorage
      // Para notificaciones en tiempo real, implementar:
      // import { onSnapshot, collection, query, where } from "firebase/firestore"
      // const db = getDb()
      // const q = query(collection(db, "ordenes_compra"))
      // onSnapshot(q, (snapshot) => {
      //   snapshot.docChanges().forEach((change) => {
      //     this.procesarCambioOrden({
      //       eventType: change.type === "added" ? "INSERT" : change.type === "modified" ? "UPDATE" : "DELETE",
      //       new: change.doc.data(),
      //       old: change.type === "removed" ? change.doc.data() : null,
      //     })
      //   })
      // })

      console.log("Servicio de notificaciones inicializado")
    } catch (error) {
      console.error("Error inicializando notificaciones:", error)
    }
  }

  // Cargar notificaciones desde localStorage
  private static async cargarNotificaciones() {
    try {
      const notificacionesGuardadas = localStorage.getItem("evco_notificaciones")
      if (notificacionesGuardadas) {
        this.notificaciones = JSON.parse(notificacionesGuardadas)
        this.notificarCambios()
      }
    } catch (error) {
      console.error("Error cargando notificaciones:", error)
      this.notificaciones = []
    }
  }

  // Guardar notificaciones en localStorage
  private static guardarNotificaciones() {
    try {
      localStorage.setItem("evco_notificaciones", JSON.stringify(this.notificaciones))
    } catch (error) {
      console.error("Error guardando notificaciones:", error)
    }
  }

  // Procesar cambios en órdenes
  private static procesarCambioOrden(payload: any) {
    const { eventType, new: nuevaOrden, old: ordenAnterior } = payload

    let notificacion: Omit<Notificacion, "id" | "fechaCreacion"> | null = null

    switch (eventType) {
      case "INSERT":
        notificacion = {
          tipo: "info",
          titulo: "Nueva orden creada",
          mensaje: `Se ha creado la orden ${nuevaOrden.numero_orden}`,
          leida: false,
          metadatos: { ordenId: nuevaOrden.id, numeroOrden: nuevaOrden.numero_orden },
          accion: {
            texto: "Ver orden",
            url: `/ordenes-de-compra/editar/${nuevaOrden.id}`,
          },
        }
        break

      case "UPDATE":
        if (ordenAnterior.estado !== nuevaOrden.estado) {
          const tipoNotificacion =
            nuevaOrden.estado === "completada" ? "success" : nuevaOrden.estado === "cancelada" ? "error" : "info"

          notificacion = {
            tipo: tipoNotificacion,
            titulo: "Estado de orden actualizado",
            mensaje: `La orden ${nuevaOrden.numero_orden} cambió a estado ${nuevaOrden.estado}`,
            leida: false,
            metadatos: {
              ordenId: nuevaOrden.id,
              numeroOrden: nuevaOrden.numero_orden,
              estadoAnterior: ordenAnterior.estado,
              estadoNuevo: nuevaOrden.estado,
            },
            accion: {
              texto: "Ver orden",
              url: `/ordenes-de-compra/editar/${nuevaOrden.id}`,
            },
          }
        }
        break

      case "DELETE":
        notificacion = {
          tipo: "warning",
          titulo: "Orden eliminada",
          mensaje: `Se ha eliminado la orden ${ordenAnterior.numero_orden}`,
          leida: false,
          metadatos: { numeroOrden: ordenAnterior.numero_orden },
        }
        break
    }

    if (notificacion) {
      this.agregarNotificacion(notificacion)
    }
  }

  // Agregar nueva notificación
  static agregarNotificacion(notificacion: Omit<Notificacion, "id" | "fechaCreacion">) {
    const nuevaNotificacion: Notificacion = {
      ...notificacion,
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      fechaCreacion: new Date().toISOString(),
    }

    this.notificaciones.unshift(nuevaNotificacion)

    // Mantener solo las últimas 50 notificaciones
    if (this.notificaciones.length > 50) {
      this.notificaciones = this.notificaciones.slice(0, 50)
    }

    this.guardarNotificaciones()
    this.notificarCambios()

    // Mostrar notificación del navegador si está permitido
    this.mostrarNotificacionNavegador(nuevaNotificacion)
  }

  // Mostrar notificación del navegador
  private static mostrarNotificacionNavegador(notificacion: Notificacion) {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(notificacion.titulo, {
        body: notificacion.mensaje,
        icon: "/favicon.ico",
        tag: notificacion.id,
      })
    }
  }

  // Solicitar permisos de notificación
  static async solicitarPermisos(): Promise<boolean> {
    if (!("Notification" in window)) {
      return false
    }

    if (Notification.permission === "granted") {
      return true
    }

    if (Notification.permission === "denied") {
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === "granted"
  }

  // Suscribirse a cambios
  static suscribirse(callback: (notificaciones: Notificacion[]) => void) {
    this.listeners.add(callback)

    // Enviar notificaciones actuales inmediatamente
    callback([...this.notificaciones])

    // Retornar función para desuscribirse
    return () => {
      this.listeners.delete(callback)
    }
  }

  // Notificar cambios a todos los listeners
  private static notificarCambios() {
    this.listeners.forEach((callback) => {
      callback([...this.notificaciones])
    })
  }

  // Marcar notificación como leída
  static marcarComoLeida(id: string) {
    const notificacion = this.notificaciones.find((n) => n.id === id)
    if (notificacion) {
      notificacion.leida = true
      this.guardarNotificaciones()
      this.notificarCambios()
    }
  }

  // Marcar todas como leídas
  static marcarTodasComoLeidas() {
    this.notificaciones.forEach((n) => (n.leida = true))
    this.guardarNotificaciones()
    this.notificarCambios()
  }

  // Eliminar notificación
  static eliminarNotificacion(id: string) {
    this.notificaciones = this.notificaciones.filter((n) => n.id !== id)
    this.guardarNotificaciones()
    this.notificarCambios()
  }

  // Limpiar todas las notificaciones
  static limpiarTodas() {
    this.notificaciones = []
    this.guardarNotificaciones()
    this.notificarCambios()
  }

  // Obtener notificaciones no leídas
  static obtenerNoLeidas(): Notificacion[] {
    return this.notificaciones.filter((n) => !n.leida)
  }

  // Obtener todas las notificaciones
  static obtenerTodas(): Notificacion[] {
    return [...this.notificaciones]
  }

  // Crear notificación personalizada
  static crearNotificacion(
    tipo: Notificacion["tipo"],
    titulo: string,
    mensaje: string,
    metadatos?: Record<string, any>,
    accion?: { texto: string; url: string },
  ) {
    this.agregarNotificacion({
      tipo,
      titulo,
      mensaje,
      leida: false,
      metadatos,
      accion,
    })
  }
}

// Hook para usar notificaciones en componentes
export function useNotificaciones() {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([])

  useEffect(() => {
    // Inicializar servicio si no está inicializado
    NotificacionesService.inicializar()

    // Suscribirse a cambios
    const desuscribir = NotificacionesService.suscribirse(setNotificaciones)

    return desuscribir
  }, [])

  return {
    notificaciones,
    noLeidas: notificaciones.filter((n) => !n.leida),
    marcarComoLeida: NotificacionesService.marcarComoLeida,
    marcarTodasComoLeidas: NotificacionesService.marcarTodasComoLeidas,
    eliminarNotificacion: NotificacionesService.eliminarNotificacion,
    limpiarTodas: NotificacionesService.limpiarTodas,
    crearNotificacion: NotificacionesService.crearNotificacion,
    solicitarPermisos: NotificacionesService.solicitarPermisos,
  }
}
