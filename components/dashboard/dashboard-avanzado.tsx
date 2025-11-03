"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import {
  TrendingUp,
  TrendingDown,
  Users,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  RefreshCw,
  Activity,
  XCircle,
} from "lucide-react"
import { HistorialAvanzadoService, type EstadisticasHistorial } from "@/lib/services/firebase-historial-avanzado"
import { useToast } from "@/components/ui/use-toast"

const COLORES_ESTADOS = {
  borrador: "#94a3b8",
  validacion: "#f59e0b",
  procesada: "#3b82f6",
  completada: "#10b981",
  cancelada: "#ef4444",
}

export function DashboardAvanzado() {
  const [estadisticas, setEstadisticas] = useState<EstadisticasHistorial | null>(null)
  const [actividadDiaria, setActividadDiaria] = useState<
    Array<{
      fecha: string
      eventos: number
      ordenes: number
    }>
  >([])
  const [eventosFrecuentes, setEventosFrecuentes] = useState<
    Array<{
      evento: string
      cantidad: number
      ultimaFecha: string
    }>
  >([])
  const [loading, setLoading] = useState(true)
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState<"7d" | "30d" | "90d" | "1y">("30d")
  const { toast } = useToast()

  useEffect(() => {
    cargarDatos()
  }, [periodoSeleccionado])

  const cargarDatos = async () => {
    try {
      setLoading(true)

      // Calcular fechas según el período
      const fechaHasta = new Date().toISOString().split("T")[0]
      const fechaDesde = new Date()

      switch (periodoSeleccionado) {
        case "7d":
          fechaDesde.setDate(fechaDesde.getDate() - 7)
          break
        case "30d":
          fechaDesde.setDate(fechaDesde.getDate() - 30)
          break
        case "90d":
          fechaDesde.setDate(fechaDesde.getDate() - 90)
          break
        case "1y":
          fechaDesde.setFullYear(fechaDesde.getFullYear() - 1)
          break
      }

      const fechaDesdeStr = fechaDesde.toISOString().split("T")[0]

      // Cargar datos en paralelo
      const [stats, actividad, eventos] = await Promise.all([
        HistorialAvanzadoService.obtenerEstadisticas(fechaDesdeStr, fechaHasta),
        HistorialAvanzadoService.obtenerActividadDiaria(fechaDesdeStr, fechaHasta),
        HistorialAvanzadoService.obtenerEventosFrecuentes(10),
      ])

      setEstadisticas(stats)
      setActividadDiaria(actividad)
      setEventosFrecuentes(eventos)
    } catch (error) {
      console.error("Error cargando datos del dashboard:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos del dashboard",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const exportarReporte = async () => {
    try {
      const csvContent = await HistorialAvanzadoService.exportarHistorialCSV({
        fechaDesde: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        fechaHasta: new Date().toISOString().split("T")[0],
      })

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `reporte_dashboard_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Reporte exportado",
        description: "El reporte ha sido descargado exitosamente",
      })
    } catch (error) {
      console.error("Error exportando reporte:", error)
      toast({
        title: "Error",
        description: "No se pudo exportar el reporte",
        variant: "destructive",
      })
    }
  }

  const calcularTendencia = (datos: number[]): "up" | "down" | "stable" => {
    if (datos.length < 2) return "stable"
    const ultimo = datos[datos.length - 1]
    const penultimo = datos[datos.length - 2]

    if (ultimo > penultimo) return "up"
    if (ultimo < penultimo) return "down"
    return "stable"
  }

  const formatearNumero = (num: number): string => {
    return new Intl.NumberFormat("es-ES").format(num)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard Avanzado</h1>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando dashboard...</span>
        </div>
      </div>
    )
  }

  if (!estadisticas) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Dashboard Avanzado</h1>
        </div>
        <Card className="p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No se pudieron cargar los datos</p>
            <Button onClick={cargarDatos} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  // Preparar datos para gráficos
  const datosEstados = Object.entries(estadisticas.ordenesPorEstado).map(([estado, cantidad]) => ({
    estado: estado.charAt(0).toUpperCase() + estado.slice(1),
    cantidad,
    color: COLORES_ESTADOS[estado as keyof typeof COLORES_ESTADOS] || "#6b7280",
  }))

  const tendenciaOrdenes = calcularTendencia(estadisticas.ordenesPorMes.map((m) => m.cantidad))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Avanzado</h1>
          <p className="text-gray-600">Análisis detallado de órdenes de compra</p>
        </div>
        <div className="flex gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: "7d", label: "7d" },
              { key: "30d", label: "30d" },
              { key: "90d", label: "90d" },
              { key: "1y", label: "1a" },
            ].map((periodo) => (
              <Button
                key={periodo.key}
                variant={periodoSeleccionado === periodo.key ? "default" : "ghost"}
                size="sm"
                onClick={() => setPeriodoSeleccionado(periodo.key as any)}
                className="text-xs"
              >
                {periodo.label}
              </Button>
            ))}
          </div>
          <Button onClick={cargarDatos} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
          <Button onClick={exportarReporte} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Órdenes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearNumero(estadisticas.totalOrdenes)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {tendenciaOrdenes === "up" ? (
                <TrendingUp className="h-3 w-3 text-green-600 mr-1" />
              ) : tendenciaOrdenes === "down" ? (
                <TrendingDown className="h-3 w-3 text-red-600 mr-1" />
              ) : null}
              <span>Últimos {periodoSeleccionado}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clientes Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearNumero(estadisticas.clientesActivos)}</div>
            <p className="text-xs text-muted-foreground">Clientes únicos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Promedio Líneas</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.promedioLineasPorOrden}</div>
            <p className="text-xs text-muted-foreground">Líneas por orden</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatearNumero(estadisticas.ordenesPorEstado.completada || 0)}</div>
            <p className="text-xs text-muted-foreground">
              {estadisticas.totalOrdenes > 0
                ? `${Math.round(((estadisticas.ordenesPorEstado.completada || 0) / estadisticas.totalOrdenes) * 100)}%`
                : "0%"}{" "}
              del total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Tendencia de Órdenes</CardTitle>
            <CardDescription>Órdenes creadas por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={estadisticas.ordenesPorMes}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="cantidad" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución por estado */}
        <Card>
          <CardHeader>
            <CardTitle>Distribución por Estado</CardTitle>
            <CardDescription>Órdenes agrupadas por estado actual</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={datosEstados}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ estado, cantidad }) => `${estado}: ${cantidad}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="cantidad"
                >
                  {datosEstados.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con información detallada */}
      <Tabs defaultValue="actividad" className="space-y-4">
        <TabsList>
          <TabsTrigger value="actividad">Actividad Diaria</TabsTrigger>
          <TabsTrigger value="eventos">Eventos Frecuentes</TabsTrigger>
          <TabsTrigger value="estados">Análisis de Estados</TabsTrigger>
        </TabsList>

        <TabsContent value="actividad" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Diaria</CardTitle>
              <CardDescription>Eventos y órdenes creadas por día</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={actividadDiaria}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="fecha" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="ordenes" fill="#3b82f6" name="Órdenes" />
                  <Bar dataKey="eventos" fill="#10b981" name="Eventos" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eventos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Eventos Más Frecuentes</CardTitle>
              <CardDescription>Actividades más comunes en el sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {eventosFrecuentes.map((evento, index) => (
                  <div key={evento.evento} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-sm font-medium text-blue-600">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium">{evento.evento}</p>
                        <p className="text-sm text-gray-500">
                          Última vez: {new Date(evento.ultimaFecha).toLocaleDateString("es-ES")}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{formatearNumero(evento.cantidad)} veces</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="estados" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(estadisticas.ordenesPorEstado).map(([estado, cantidad]) => {
              const porcentaje =
                estadisticas.totalOrdenes > 0 ? Math.round((cantidad / estadisticas.totalOrdenes) * 100) : 0

              const IconoEstado =
                {
                  borrador: Clock,
                  validacion: AlertCircle,
                  procesada: Activity,
                  completada: CheckCircle,
                  cancelada: XCircle,
                }[estado as keyof typeof COLORES_ESTADOS] || FileText

              return (
                <Card key={estado}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium capitalize">{estado}</CardTitle>
                    <IconoEstado className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatearNumero(cantidad)}</div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">{porcentaje}% del total</p>
                      <div
                        className="w-12 h-2 rounded-full"
                        style={{
                          backgroundColor: COLORES_ESTADOS[estado as keyof typeof COLORES_ESTADOS] || "#6b7280",
                          opacity: 0.3,
                        }}
                      >
                        <div
                          className="h-2 rounded-full"
                          style={{
                            width: `${porcentaje}%`,
                            backgroundColor: COLORES_ESTADOS[estado as keyof typeof COLORES_ESTADOS] || "#6b7280",
                          }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
