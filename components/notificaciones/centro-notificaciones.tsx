"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  ExternalLink,
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Settings,
} from "lucide-react"
import { useNotificaciones, type Notificacion } from "@/lib/services/notificaciones-service"
import { cn } from "@/lib/utils"
import Link from "next/link"

export function CentroNotificaciones() {
  const {
    notificaciones,
    noLeidas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion,
    limpiarTodas,
    solicitarPermisos,
  } = useNotificaciones()

  const [abierto, setAbierto] = useState(false)
  const [mostrarSoloNoLeidas, setMostrarSoloNoLeidas] = useState(false)

  const notificacionesMostrar = mostrarSoloNoLeidas ? noLeidas : notificaciones.slice(0, 20) // Mostrar solo las últimas 20

  const getIconoTipo = (tipo: Notificacion["tipo"]) => {
    switch (tipo) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Info className="h-4 w-4 text-blue-600" />
    }
  }

  const getColorFondo = (tipo: Notificacion["tipo"], leida: boolean) => {
    if (leida) return "bg-gray-50"

    switch (tipo) {
      case "success":
        return "bg-green-50 border-l-4 border-green-400"
      case "warning":
        return "bg-yellow-50 border-l-4 border-yellow-400"
      case "error":
        return "bg-red-50 border-l-4 border-red-400"
      default:
        return "bg-blue-50 border-l-4 border-blue-400"
    }
  }

  const formatearFecha = (fecha: string) => {
    const ahora = new Date()
    const fechaNotificacion = new Date(fecha)
    const diferencia = ahora.getTime() - fechaNotificacion.getTime()

    const minutos = Math.floor(diferencia / (1000 * 60))
    const horas = Math.floor(diferencia / (1000 * 60 * 60))
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))

    if (minutos < 1) return "Ahora"
    if (minutos < 60) return `Hace ${minutos}m`
    if (horas < 24) return `Hace ${horas}h`
    if (dias < 7) return `Hace ${dias}d`

    return fechaNotificacion.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
  }

  const handleSolicitarPermisos = async () => {
    const concedido = await solicitarPermisos()
    if (concedido) {
      // Crear notificación de prueba
      const notificacionPrueba = {
        tipo: "success" as const,
        titulo: "Notificaciones activadas",
        mensaje: "Ahora recibirás notificaciones del navegador",
        leida: false,
      }

      // Simular agregar notificación (en una implementación real esto vendría del servicio)
      setTimeout(() => {
        new Notification(notificacionPrueba.titulo, {
          body: notificacionPrueba.mensaje,
          icon: "/favicon.ico",
        })
      }, 1000)
    }
  }

  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative">
          <Bell className="h-5 w-5" />
          {noLeidas.length > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {noLeidas.length > 99 ? "99+" : noLeidas.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">Notificaciones</h3>
            {noLeidas.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {noLeidas.length} nuevas
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMostrarSoloNoLeidas(!mostrarSoloNoLeidas)}
              className="text-xs"
            >
              {mostrarSoloNoLeidas ? "Todas" : "No leídas"}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSolicitarPermisos}
              title="Configurar notificaciones del navegador"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {notificacionesMostrar.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">{mostrarSoloNoLeidas ? "No hay notificaciones nuevas" : "No hay notificaciones"}</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
              <Button
                variant="ghost"
                size="sm"
                onClick={marcarTodasComoLeidas}
                disabled={noLeidas.length === 0}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas como leídas
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={limpiarTodas}
                className="text-xs text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Limpiar todas
              </Button>
            </div>

            <ScrollArea className="h-96">
              <div className="divide-y">
                {notificacionesMostrar.map((notificacion) => (
                  <div
                    key={notificacion.id}
                    className={cn(
                      "p-3 hover:bg-gray-50 transition-colors",
                      getColorFondo(notificacion.tipo, notificacion.leida),
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">{getIconoTipo(notificacion.tipo)}</div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p
                              className={cn(
                                "text-sm font-medium",
                                notificacion.leida ? "text-gray-600" : "text-gray-900",
                              )}
                            >
                              {notificacion.titulo}
                            </p>
                            <p className={cn("text-xs mt-1", notificacion.leida ? "text-gray-500" : "text-gray-700")}>
                              {notificacion.mensaje}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">{formatearFecha(notificacion.fechaCreacion)}</p>
                          </div>

                          <div className="flex items-center gap-1">
                            {!notificacion.leida && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => marcarComoLeida(notificacion.id)}
                                className="h-6 w-6 p-0"
                                title="Marcar como leída"
                              >
                                <Check className="h-3 w-3" />
                              </Button>
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarNotificacion(notificacion.id)}
                              className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                              title="Eliminar notificación"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>

                        {notificacion.accion && (
                          <div className="mt-2">
                            <Link href={notificacion.accion.url}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-xs h-6 bg-transparent"
                                onClick={() => {
                                  marcarComoLeida(notificacion.id)
                                  setAbierto(false)
                                }}
                              >
                                {notificacion.accion.texto}
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
