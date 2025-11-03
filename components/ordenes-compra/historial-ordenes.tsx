"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Filter, Download, Eye, Calendar, FileText, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { OrdenFlowService } from "@/lib/services/orden-flow-service"
import { buscarClientePorCustId } from "@/data/clientes-database"
import type { OrdenCompra } from "@/lib/firebase/types"

interface OrdenHistorial extends OrdenCompra {
  clienteNombre?: string
  totalLineas?: number
}

export function HistorialOrdenes() {
  const [ordenes, setOrdenes] = useState<OrdenHistorial[]>([])
  const [filteredOrdenes, setFilteredOrdenes] = useState<OrdenHistorial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [estadoFilter, setEstadoFilter] = useState<string>("todos")
  const [fechaDesde, setFechaDesde] = useState("")
  const [fechaHasta, setFechaHasta] = useState("")

  useEffect(() => {
    cargarHistorial()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [ordenes, searchTerm, estadoFilter, fechaDesde, fechaHasta])

  const cargarHistorial = async () => {
    try {
      setLoading(true)

      // Obtener todas las órdenes (podríamos filtrar por estado si es necesario)
      const estados = ["borrador", "procesada", "completada", "cancelada"]
      const todasLasOrdenes: OrdenHistorial[] = []

      for (const estado of estados) {
        const ordenesPorEstado = await OrdenFlowService.obtenerOrdenesPorEstado(estado)
        todasLasOrdenes.push(...ordenesPorEstado)
      }

      // Enriquecer con información adicional
      const ordenesEnriquecidas = await Promise.all(
        todasLasOrdenes.map(async (orden) => {
          try {
            // Obtener nombre del cliente
            const clienteNombre = await buscarClientePorCustId(orden.customerId)

            // Obtener información completa para contar líneas
            const ordenCompleta = await OrdenFlowService.obtenerOrdenCompleta(orden.id!)
            const totalLineas = ordenCompleta?.lineas?.length || 0

            return {
              ...orden,
              clienteNombre: clienteNombre || "Cliente no encontrado",
              totalLineas,
            }
          } catch (error) {
            console.error(`Error enriqueciendo orden ${orden.id}:`, error)
            return {
              ...orden,
              clienteNombre: "Error al cargar cliente",
              totalLineas: 0,
            }
          }
        }),
      )

      // Ordenar por fecha de creación (más recientes primero)
      ordenesEnriquecidas.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

      setOrdenes(ordenesEnriquecidas)
    } catch (error) {
      console.error("Error cargando historial:", error)
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let filtered = [...ordenes]

    // Filtro por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (orden) =>
          orden.poNumber?.toLowerCase().includes(term) ||
          orden.clienteNombre?.toLowerCase().includes(term) ||
          orden.customerId?.toLowerCase().includes(term),
      )
    }

    // Filtro por estado
    if (estadoFilter !== "todos") {
      filtered = filtered.filter((orden) => orden.estado === estadoFilter)
    }

    // Filtro por fecha desde
    if (fechaDesde) {
      filtered = filtered.filter((orden) => orden.fechaOrden >= fechaDesde)
    }

    // Filtro por fecha hasta
    if (fechaHasta) {
      filtered = filtered.filter((orden) => orden.fechaOrden <= fechaHasta)
    }

    setFilteredOrdenes(filtered)
  }

  const getEstadoBadge = (estado: string) => {
    const configs = {
      borrador: { variant: "secondary" as const, color: "bg-gray-100 text-gray-800", icon: FileText },
      procesada: { variant: "default" as const, color: "bg-blue-100 text-blue-800", icon: Clock },
      completada: { variant: "default" as const, color: "bg-green-100 text-green-800", icon: CheckCircle },
      cancelada: { variant: "destructive" as const, color: "bg-red-100 text-red-800", icon: AlertCircle },
    }

    const config = configs[estado as keyof typeof configs] || configs.borrador
    const Icon = config.icon

    return (
      <Badge variant={config.variant} className={`text-xs ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    )
  }

  const exportarCSV = () => {
    const headers = [
      "PO Number",
      "Cliente",
      "Cust ID",
      "Fecha Orden",
      "Estado",
      "Moneda",
      "Tipo Orden",
      "Total Líneas",
      "Fecha Creación",
    ]

    const rows = filteredOrdenes.map((orden) => [
      orden.poNumber || "",
      orden.clienteNombre || "",
      orden.customerId || "",
      orden.fechaOrden || "",
      orden.estado || "",
      orden.moneda || "",
      orden.tipoOrden || "",
      orden.totalLineas?.toString() || "0",
      new Date(orden.createdAt).toLocaleDateString(),
    ])

    const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `historial_ordenes_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const verDetalleOrden = (ordenId: string) => {
    // Navegar a la página de detalle de la orden
    window.open(`/ordenes-de-compra/detalle/${ordenId}`, "_blank")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Historial de Órdenes</h1>
            <p className="text-gray-600">Cargando historial...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Historial de Órdenes</h1>
          <p className="text-gray-600">
            {filteredOrdenes.length} de {ordenes.length} órdenes
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportarCSV} className="flex items-center bg-transparent">
            <Download className="w-4 h-4 mr-2" />
            Exportar CSV
          </Button>
          <Button size="sm" onClick={cargarHistorial} className="flex items-center">
            Actualizar
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </CardTitle>
          <CardDescription>Filtra las órdenes por diferentes criterios</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="PO, Cliente, Cust ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Estado</label>
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los estados</SelectItem>
                  <SelectItem value="borrador">Borrador</SelectItem>
                  <SelectItem value="procesada">Procesada</SelectItem>
                  <SelectItem value="completada">Completada</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha desde</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Fecha hasta</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Acciones</label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm("")
                  setEstadoFilter("todos")
                  setFechaDesde("")
                  setFechaHasta("")
                }}
                className="w-full"
              >
                Limpiar filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de órdenes */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Fecha Orden</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Moneda</TableHead>
                  <TableHead>Líneas</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrdenes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      No se encontraron órdenes que coincidan con los filtros
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrdenes.map((orden) => (
                    <TableRow key={orden.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{orden.poNumber}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{orden.clienteNombre}</div>
                          <div className="text-xs text-gray-500">ID: {orden.customerId}</div>
                        </div>
                      </TableCell>
                      <TableCell>{orden.fechaOrden}</TableCell>
                      <TableCell>{getEstadoBadge(orden.estado)}</TableCell>
                      <TableCell>{orden.moneda}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {orden.totalLineas} líneas
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{orden.tipoOrden}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {new Date(orden.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => verDetalleOrden(orden.id!)}
                          className="flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas rápidas */}
      {filteredOrdenes.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Órdenes</p>
                  <p className="text-2xl font-bold">{filteredOrdenes.length}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completadas</p>
                  <p className="text-2xl font-bold text-green-600">
                    {filteredOrdenes.filter((o) => o.estado === "completada").length}
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">En Proceso</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {filteredOrdenes.filter((o) => o.estado === "procesada").length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Líneas</p>
                  <p className="text-2xl font-bold">
                    {filteredOrdenes.reduce((total, orden) => total + (orden.totalLineas || 0), 0)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
