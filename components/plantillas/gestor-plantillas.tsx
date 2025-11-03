"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Search,
  Plus,
  Edit,
  Copy,
  Trash2,
  Download,
  Upload,
  Star,
  Tag,
  Calendar,
  Users,
  TrendingUp,
  FileText,
  Filter,
} from "lucide-react"
import { PlantillasService, type PlantillaOrden } from "@/lib/services/plantillas-service"
import { useToast } from "@/components/ui/use-toast"
import { format } from "date-fns"
import { es } from "date-fns/locale"

interface FiltrosPlantillas {
  busqueda: string
  customerId: string
  tipoOrden: string
  activa: string
  etiqueta: string
}

export function GestorPlantillas() {
  const [plantillas, setPlantillas] = useState<PlantillaOrden[]>([])
  const [plantillasFiltradas, setPlantillasFiltradas] = useState<PlantillaOrden[]>([])
  const [filtros, setFiltros] = useState<FiltrosPlantillas>({
    busqueda: "",
    customerId: "",
    tipoOrden: "",
    activa: "todas",
    etiqueta: "",
  })
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState<PlantillaOrden | null>(null)
  const [dialogoAbierto, setDialogoAbierto] = useState(false)
  const [estadisticas, setEstadisticas] = useState<any>(null)
  const { toast } = useToast()

  useEffect(() => {
    cargarPlantillas()
    cargarEstadisticas()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [plantillas, filtros])

  const cargarPlantillas = () => {
    const plantillasData = PlantillasService.obtenerTodas()
    setPlantillas(plantillasData)
  }

  const cargarEstadisticas = () => {
    const stats = PlantillasService.obtenerEstadisticas()
    setEstadisticas(stats)
  }

  const aplicarFiltros = () => {
    let resultado = [...plantillas]

    // Filtro por búsqueda
    if (filtros.busqueda.trim()) {
      resultado = PlantillasService.buscar(filtros.busqueda, {
        customerId: filtros.customerId || undefined,
        tipoOrden: filtros.tipoOrden || undefined,
        activa: filtros.activa === "todas" ? undefined : filtros.activa === "activas",
      })
    } else {
      // Aplicar filtros individuales
      if (filtros.customerId) {
        resultado = resultado.filter((p) => p.customerId === filtros.customerId)
      }

      if (filtros.tipoOrden) {
        resultado = resultado.filter((p) => p.tipoOrden === filtros.tipoOrden)
      }

      if (filtros.activa !== "todas") {
        resultado = resultado.filter((p) => p.activa === (filtros.activa === "activas"))
      }

      if (filtros.etiqueta) {
        resultado = resultado.filter((p) => p.etiquetas.includes(filtros.etiqueta))
      }
    }

    setPlantillasFiltradas(resultado)
  }

  const handleFiltroChange = (campo: keyof FiltrosPlantillas, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: "",
      customerId: "",
      tipoOrden: "",
      activa: "todas",
      etiqueta: "",
    })
  }

  const duplicarPlantilla = async (plantilla: PlantillaOrden) => {
    try {
      const plantillaDuplicada = PlantillasService.duplicar(plantilla.id)
      if (plantillaDuplicada) {
        cargarPlantillas()
        cargarEstadisticas()
        toast({
          title: "Plantilla duplicada",
          description: `Se ha creado una copia de "${plantilla.nombre}"`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo duplicar la plantilla",
        variant: "destructive",
      })
    }
  }

  const eliminarPlantilla = async (plantilla: PlantillaOrden) => {
    try {
      const eliminada = PlantillasService.eliminar(plantilla.id)
      if (eliminada) {
        cargarPlantillas()
        cargarEstadisticas()
        toast({
          title: "Plantilla eliminada",
          description: `Se ha eliminado "${plantilla.nombre}"`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la plantilla",
        variant: "destructive",
      })
    }
  }

  const toggleEstadoPlantilla = async (plantilla: PlantillaOrden) => {
    try {
      const actualizada = PlantillasService.actualizar(plantilla.id, {
        activa: !plantilla.activa,
      })

      if (actualizada) {
        cargarPlantillas()
        toast({
          title: "Estado actualizado",
          description: `La plantilla "${plantilla.nombre}" ha sido ${actualizada.activa ? "activada" : "desactivada"}`,
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la plantilla",
        variant: "destructive",
      })
    }
  }

  const exportarPlantillas = () => {
    try {
      const plantillasJson = PlantillasService.exportar()
      const blob = new Blob([plantillasJson], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `plantillas_ordenes_${new Date().toISOString().split("T")[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      toast({
        title: "Exportación completada",
        description: `Se exportaron ${plantillas.length} plantillas`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron exportar las plantillas",
        variant: "destructive",
      })
    }
  }

  const importarPlantillas = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const contenido = e.target?.result as string
        const resultado = PlantillasService.importar(contenido)

        cargarPlantillas()
        cargarEstadisticas()

        if (resultado.exitosas > 0) {
          toast({
            title: "Importación completada",
            description: `Se importaron ${resultado.exitosas} plantillas exitosamente`,
          })
        }

        if (resultado.errores.length > 0) {
          toast({
            title: "Errores en importación",
            description: `${resultado.errores.length} plantillas tuvieron errores`,
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo procesar el archivo",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)

    // Limpiar input
    event.target.value = ""
  }

  const obtenerEtiquetasUnicas = () => {
    const etiquetas = new Set<string>()
    plantillas.forEach((p) => p.etiquetas.forEach((e) => etiquetas.add(e)))
    return Array.from(etiquetas).sort()
  }

  const obtenerClientesUnicos = () => {
    const clientes = new Set(plantillas.map((p) => p.customerId))
    return Array.from(clientes).sort()
  }

  const obtenerTiposOrdenUnicos = () => {
    const tipos = new Set(plantillas.map((p) => p.tipoOrden))
    return Array.from(tipos).sort()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestor de Plantillas</h1>
          <p className="text-gray-600">Administra plantillas de órdenes de compra</p>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".json" onChange={importarPlantillas} className="hidden" id="importar-plantillas" />
          <Button variant="outline" size="sm" onClick={() => document.getElementById("importar-plantillas")?.click()}>
            <Upload className="h-4 w-4 mr-2" />
            Importar
          </Button>
          <Button variant="outline" size="sm" onClick={exportarPlantillas}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Dialog open={dialogoAbierto} onOpenChange={setDialogoAbierto}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nueva Plantilla
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Crear Nueva Plantilla</DialogTitle>
                <DialogDescription>Crea una nueva plantilla de orden de compra</DialogDescription>
              </DialogHeader>
              {/* Aquí iría el formulario de creación de plantillas */}
              <div className="p-4 text-center text-gray-500">
                <p>Formulario de creación de plantillas</p>
                <p className="text-sm">(Por implementar)</p>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Estadísticas */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plantillas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.totalPlantillas}</div>
              <p className="text-xs text-muted-foreground">{estadisticas.plantillasActivas} activas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.clientesConPlantillas.length}</div>
              <p className="text-xs text-muted-foreground">Con plantillas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Más Usada</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.plantillasMasUsadas[0]?.usosCount || 0}</div>
              <p className="text-xs text-muted-foreground">
                {estadisticas.plantillasMasUsadas[0]?.nombre.substring(0, 20) || "N/A"}...
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tipo Común</CardTitle>
              <Tag className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{estadisticas.tiposOrdenMasComunes[0]?.cantidad || 0}</div>
              <p className="text-xs text-muted-foreground">{estadisticas.tiposOrdenMasComunes[0]?.tipo || "N/A"}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            <CardTitle className="text-lg">Filtros</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar plantillas..."
                value={filtros.busqueda}
                onChange={(e) => handleFiltroChange("busqueda", e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filtros.customerId} onValueChange={(value) => handleFiltroChange("customerId", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Cliente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los clientes</SelectItem>
                {obtenerClientesUnicos().map((cliente) => (
                  <SelectItem key={cliente} value={cliente}>
                    {cliente}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.tipoOrden} onValueChange={(value) => handleFiltroChange("tipoOrden", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de Orden" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {obtenerTiposOrdenUnicos().map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtros.activa} onValueChange={(value) => handleFiltroChange("activa", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="activas">Activas</SelectItem>
                <SelectItem value="inactivas">Inactivas</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filtros.etiqueta} onValueChange={(value) => handleFiltroChange("etiqueta", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Etiqueta" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las etiquetas</SelectItem>
                {obtenerEtiquetasUnicas().map((etiqueta) => (
                  <SelectItem key={etiqueta} value={etiqueta}>
                    {etiqueta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={limpiarFiltros}>
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de plantillas */}
      <Card>
        <CardHeader>
          <CardTitle>Plantillas ({plantillasFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Líneas</TableHead>
                <TableHead>Usos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Actualizada</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plantillasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    {filtros.busqueda ||
                    filtros.customerId ||
                    filtros.tipoOrden ||
                    filtros.etiqueta ||
                    filtros.activa !== "todas"
                      ? "No se encontraron plantillas con los filtros aplicados"
                      : "No hay plantillas creadas"}
                  </TableCell>
                </TableRow>
              ) : (
                plantillasFiltradas.map((plantilla) => (
                  <TableRow key={plantilla.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{plantilla.nombre}</p>
                        <p className="text-sm text-gray-500">{plantilla.descripcion}</p>
                        <div className="flex gap-1 mt-1">
                          {plantilla.etiquetas.slice(0, 3).map((etiqueta) => (
                            <Badge key={etiqueta} variant="secondary" className="text-xs">
                              {etiqueta}
                            </Badge>
                          ))}
                          {plantilla.etiquetas.length > 3 && (
                            <Badge variant="secondary" className="text-xs">
                              +{plantilla.etiquetas.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{plantilla.customerId}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{plantilla.tipoOrden}</Badge>
                    </TableCell>
                    <TableCell>{plantilla.lineasPlantilla.length}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500" />
                        {plantilla.usosCount}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={plantilla.activa ? "default" : "secondary"}>
                        {plantilla.activa ? "Activa" : "Inactiva"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(plantilla.fechaActualizacion), "dd/MM/yy", { locale: es })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setPlantillaSeleccionada(plantilla)
                            setDialogoAbierto(true)
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => duplicarPlantilla(plantilla)}
                          className="h-8 w-8 p-0"
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleEstadoPlantilla(plantilla)}
                          className="h-8 w-8 p-0"
                        >
                          {plantilla.activa ? (
                            <Badge variant="secondary" className="text-xs">
                              Off
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">
                              On
                            </Badge>
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600 hover:text-red-700">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>¿Eliminar plantilla?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente la plantilla "
                                {plantilla.nombre}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => eliminarPlantilla(plantilla)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Eliminar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
