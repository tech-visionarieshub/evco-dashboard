"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Save, Plus, Trash2, AlertTriangle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import type { OrdenCompra, LineaOrdenCompra } from "@/lib/types/orden-compra"

interface EditarOrdenCompraProps {
  ordenId: string
}

export function EditarOrdenCompra({ ordenId }: EditarOrdenCompraProps) {
  const [orden, setOrden] = useState<OrdenCompra | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  // Cargar la orden del localStorage
  useEffect(() => {
    const cargarOrden = () => {
      try {
        // Primero intentar cargar desde orden-editar (si viene de la redirección)
        let ordenJson = localStorage.getItem("orden-editar")

        // Si no existe, cargar por ID
        if (!ordenJson) {
          ordenJson = localStorage.getItem(`orden-${ordenId}`)
        }

        if (ordenJson) {
          const ordenCargada = JSON.parse(ordenJson) as OrdenCompra
          setOrden(ordenCargada)

          // Limpiar orden-editar si existe
          localStorage.removeItem("orden-editar")
        } else {
          toast({
            title: "Error",
            description: "No se encontró la orden de compra",
            variant: "destructive",
          })
          router.push("/ordenes-de-compra/historial")
        }
      } catch (error) {
        console.error("Error al cargar la orden:", error)
        toast({
          title: "Error",
          description: "Ocurrió un error al cargar la orden de compra",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    cargarOrden()
  }, [ordenId, router, toast])

  const handleOrdenChange = (field: keyof OrdenCompra, value: string) => {
    if (orden) {
      setOrden({
        ...orden,
        [field]: value,
      })
    }
  }

  const handleLineaChange = (index: number, field: keyof LineaOrdenCompra, value: string | number) => {
    if (orden) {
      const nuevasLineas = [...orden.lineas]
      nuevasLineas[index] = {
        ...nuevasLineas[index],
        [field]: value,
      }
      setOrden({
        ...orden,
        lineas: nuevasLineas,
      })
    }
  }

  const handleAgregarLinea = () => {
    if (orden) {
      const nuevaLinea: LineaOrdenCompra = {
        id: `linea-${Date.now()}`,
        numeroParteCLiente: "",
        numeroParteEVCO: "",
        descripcion: "",
        cantidad: 0,
        precio: 0,
        unidad: "PZA",
        fechaEntrega: new Date().toISOString().split("T")[0],
      }
      setOrden({
        ...orden,
        lineas: [...orden.lineas, nuevaLinea],
      })
    }
  }

  const handleEliminarLinea = (index: number) => {
    if (orden) {
      const nuevasLineas = [...orden.lineas]
      nuevasLineas.splice(index, 1)
      setOrden({
        ...orden,
        lineas: nuevasLineas,
      })
    }
  }

  const handleGuardar = () => {
    if (!orden) return

    setIsSaving(true)

    try {
      // Actualizar la fecha de modificación
      const ordenActualizada: OrdenCompra = {
        ...orden,
        ultimaModificacion: new Date().toISOString(),
      }

      // Guardar en localStorage
      localStorage.setItem(`orden-${ordenActualizada.id}`, JSON.stringify(ordenActualizada))

      toast({
        title: "Orden actualizada",
        description: "La orden de compra se ha actualizado correctamente",
      })

      // Redirigir al historial después de un breve retraso
      setTimeout(() => {
        router.push("/ordenes-de-compra/historial")
      }, 1500)
    } catch (error) {
      console.error("Error al guardar la orden:", error)
      toast({
        title: "Error",
        description: "Ocurrió un error al guardar la orden de compra",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
      </div>
    )
  }

  if (!orden) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3 text-amber-600">
          <AlertTriangle className="h-5 w-5" />
          <p>No se encontró la orden de compra</p>
        </div>
        <Button variant="outline" className="mt-4" onClick={() => router.push("/ordenes-de-compra/historial")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver al historial
        </Button>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Editar Orden de Compra</h2>
          <div className="text-sm text-gray-500">
            Última modificación:{" "}
            {orden.ultimaModificacion ? new Date(orden.ultimaModificacion).toLocaleString() : "No disponible"}
          </div>
        </div>

        {/* Información general de la orden */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <Label htmlFor="customerId" className="text-sm font-medium text-gray-700">
              Cliente
            </Label>
            <Input
              id="customerId"
              value={orden.customerId || ""}
              onChange={(e) => handleOrdenChange("customerId", e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="poNumber" className="text-sm font-medium text-gray-700">
              Número de orden (PO)
            </Label>
            <Input
              id="poNumber"
              value={orden.poNumber || ""}
              onChange={(e) => handleOrdenChange("poNumber", e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fechaOrden" className="text-sm font-medium text-gray-700">
              Fecha de orden
            </Label>
            <Input
              id="fechaOrden"
              type="date"
              value={orden.fechaOrden || ""}
              onChange={(e) => handleOrdenChange("fechaOrden", e.target.value)}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="moneda" className="text-sm font-medium text-gray-700">
              Moneda
            </Label>
            <Select value={orden.moneda || "USD"} onValueChange={(value) => handleOrdenChange("moneda", value)}>
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Seleccionar moneda" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                <SelectItem value="EUR">EUR - Euro</SelectItem>
                <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                <SelectItem value="CAD">CAD - Dólar Canadiense</SelectItem>
                <SelectItem value="GBP">GBP - Libra Esterlina</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canalRecepcion" className="text-sm font-medium text-gray-700">
              Canal de recepción
            </Label>
            <Select
              value={orden.canalRecepcion || "Correo"}
              onValueChange={(value) => handleOrdenChange("canalRecepcion", value as any)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Seleccionar canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Correo">Correo</SelectItem>
                <SelectItem value="Portal">Portal</SelectItem>
                <SelectItem value="EDI">EDI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipoOrden" className="text-sm font-medium text-gray-700">
              Tipo de orden
            </Label>
            <Select
              value={orden.tipoOrden || "Nacional"}
              onValueChange={(value) => handleOrdenChange("tipoOrden", value as any)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Nacional">Nacional</SelectItem>
                <SelectItem value="Exportación">Exportación</SelectItem>
                <SelectItem value="Express">Express</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="shipTo" className="text-sm font-medium text-gray-700">
              Dirección de envío (Ship To)
            </Label>
            <Textarea
              id="shipTo"
              value={orden.shipTo || ""}
              onChange={(e) => handleOrdenChange("shipTo", e.target.value)}
              className="text-sm"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="estado" className="text-sm font-medium text-gray-700">
              Estado
            </Label>
            <Select
              value={orden.estado || "Pendiente"}
              onValueChange={(value) => handleOrdenChange("estado", value as any)}
            >
              <SelectTrigger className="text-sm">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pendiente">Pendiente</SelectItem>
                <SelectItem value="Validada">Validada</SelectItem>
                <SelectItem value="Procesada">Procesada</SelectItem>
                <SelectItem value="Rechazada">Rechazada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Líneas de la orden */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Líneas de la orden</h3>
            <Button variant="outline" size="sm" onClick={handleAgregarLinea}>
              <Plus className="h-4 w-4 mr-2" />
              Agregar línea
            </Button>
          </div>

          <div className="border rounded-lg overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-sm">SKU del Cliente</TableHead>
                  <TableHead className="text-sm">SKU EVCO</TableHead>
                  <TableHead className="text-sm">Descripción</TableHead>
                  <TableHead className="text-sm">Cantidad</TableHead>
                  <TableHead className="text-sm">Precio</TableHead>
                  <TableHead className="text-sm">Unidad</TableHead>
                  <TableHead className="text-sm">Fecha Entrega</TableHead>
                  <TableHead className="text-sm w-[80px]">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orden.lineas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-4 text-gray-500">
                      No hay líneas en esta orden
                    </TableCell>
                  </TableRow>
                ) : (
                  orden.lineas.map((linea, index) => (
                    <TableRow key={linea.id || index}>
                      <TableCell>
                        <Input
                          value={linea.numeroParteCLiente || ""}
                          onChange={(e) => handleLineaChange(index, "numeroParteCLiente", e.target.value)}
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={linea.numeroParteEVCO || ""}
                          onChange={(e) => handleLineaChange(index, "numeroParteEVCO", e.target.value)}
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={linea.descripcion || ""}
                          onChange={(e) => handleLineaChange(index, "descripcion", e.target.value)}
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={linea.cantidad?.toString() || "0"}
                          onChange={(e) => handleLineaChange(index, "cantidad", Number(e.target.value))}
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          value={linea.precio?.toString() || "0"}
                          onChange={(e) => handleLineaChange(index, "precio", Number(e.target.value))}
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Select
                          value={linea.unidad || "PZA"}
                          onValueChange={(value) => handleLineaChange(index, "unidad", value)}
                        >
                          <SelectTrigger className="text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PZA">PZA</SelectItem>
                            <SelectItem value="EACH">EACH</SelectItem>
                            <SelectItem value="KG">KG</SelectItem>
                            <SelectItem value="M">M</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={linea.fechaEntrega?.split("T")[0] || ""}
                          onChange={(e) => handleLineaChange(index, "fechaEntrega", e.target.value)}
                          className="text-sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarLinea(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Observaciones */}
        <div className="mt-6 space-y-2">
          <Label htmlFor="observaciones" className="text-sm font-medium text-gray-700">
            Observaciones
          </Label>
          <Textarea
            id="observaciones"
            value={orden.observaciones || ""}
            onChange={(e) => handleOrdenChange("observaciones", e.target.value)}
            className="text-sm"
            rows={3}
            placeholder="Añade cualquier observación o nota relevante para esta orden"
          />
        </div>

        {/* Botones de acción */}
        <div className="flex justify-between mt-8">
          <Button variant="outline" onClick={() => router.push("/ordenes-de-compra/historial")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button onClick={handleGuardar} disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Guardar cambios
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}
