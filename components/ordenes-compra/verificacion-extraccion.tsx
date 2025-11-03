"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, CheckCircle, AlertCircle, Edit, Save } from "lucide-react"
import { cn, limpiarTexto } from "@/lib/utils"
import type { OrdenCompra, LineaOrdenCompra } from "@/lib/types/orden-compra"

interface VerificacionExtraccionProps {
  orden: OrdenCompra
  lineas: LineaOrdenCompra[]
  onConfirmar: (orden: OrdenCompra, lineas: LineaOrdenCompra[]) => void
  onCancelar: () => void
}

export function VerificacionExtraccion({
  orden,
  lineas: lineasIniciales,
  onConfirmar,
  onCancelar,
}: VerificacionExtraccionProps) {
  const [ordenData, setOrdenData] = useState<OrdenCompra>({ ...orden })
  const [lineas, setLineas] = useState<LineaOrdenCompra[]>([...lineasIniciales])
  const [lineaEditando, setLineaEditando] = useState<LineaOrdenCompra | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)

  const handleOrdenChange = (field: keyof OrdenCompra, value: any) => {
    setOrdenData((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleEditarLinea = (linea: LineaOrdenCompra) => {
    setLineaEditando({ ...linea })
    setShowEditDialog(true)
  }

  const handleGuardarLinea = () => {
    if (!lineaEditando) return

    setLineas((prev) => prev.map((l) => (l.id === lineaEditando.id ? lineaEditando : l)))

    setShowEditDialog(false)
    setLineaEditando(null)
  }

  const handleConfirmar = () => {
    onConfirmar(ordenData, lineas)
  }

  // Función para determinar el color de confianza
  const getConfianzaColor = (confianza?: number) => {
    if (!confianza) return "bg-gray-100"
    if (confianza >= 0.9) return "bg-green-50"
    if (confianza >= 0.7) return "bg-yellow-50"
    return "bg-red-50"
  }

  // Función para mostrar el indicador de confianza
  const ConfianzaIndicator = ({ confianza }: { confianza?: number }) => {
    if (!confianza) return null

    if (confianza >= 0.9) {
      return <CheckCircle className="h-4 w-4 text-green-500" />
    }
    if (confianza >= 0.7) {
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    }
    return <AlertCircle className="h-4 w-4 text-red-500" />
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Verificación de datos extraídos</h2>
        <p className="text-gray-600 mb-4">
          Revisa y corrige la información extraída automáticamente. Los campos con{" "}
          <AlertCircle className="inline h-4 w-4 text-yellow-500" /> tienen confianza media y podrían requerir
          verificación.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="customerId">Cliente</Label>
                <ConfianzaIndicator confianza={ordenData.confianzaExtraccion} />
              </div>
              <Input
                id="customerId"
                value={ordenData.customerId}
                onChange={(e) => handleOrdenChange("customerId", e.target.value)}
                className={cn(getConfianzaColor(ordenData.confianzaExtraccion))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="direccionCliente">Dirección del cliente</Label>
                <ConfianzaIndicator confianza={ordenData.confianzaExtraccion} />
              </div>
              <Textarea
                id="direccionCliente"
                value={ordenData.direccionCliente || ""}
                onChange={(e) => handleOrdenChange("direccionCliente", e.target.value)}
                className={cn("min-h-[80px]", getConfianzaColor(ordenData.confianzaExtraccion))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="poNumber">Número de PO</Label>
                <ConfianzaIndicator confianza={ordenData.confianzaExtraccion} />
              </div>
              <Input
                id="poNumber"
                value={ordenData.poNumber}
                onChange={(e) => handleOrdenChange("poNumber", e.target.value)}
                className={cn(getConfianzaColor(ordenData.confianzaExtraccion))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="fechaOrden">Fecha de orden</Label>
                <ConfianzaIndicator confianza={ordenData.confianzaExtraccion} />
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      getConfianzaColor(ordenData.confianzaExtraccion),
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {ordenData.fechaOrden ? (
                      format(new Date(ordenData.fechaOrden), "PPP", { locale: es })
                    ) : (
                      <span>Selecciona una fecha</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={ordenData.fechaOrden ? new Date(ordenData.fechaOrden) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        handleOrdenChange("fechaOrden", date.toISOString())
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="canalRecepcion">Canal de recepción</Label>
              </div>
              <Select
                value={ordenData.canalRecepcion}
                onValueChange={(value) => handleOrdenChange("canalRecepcion", value)}
              >
                <SelectTrigger id="canalRecepcion">
                  <SelectValue placeholder="Selecciona un canal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Correo">Correo</SelectItem>
                  <SelectItem value="Portal">Portal</SelectItem>
                  <SelectItem value="EDI">EDI</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="shipTo">Dirección de envío</Label>
                <ConfianzaIndicator confianza={ordenData.confianzaExtraccion} />
              </div>
              <Textarea
                id="shipTo"
                value={ordenData.shipTo || ""}
                onChange={(e) => handleOrdenChange("shipTo", e.target.value)}
                className={cn("min-h-[80px]", getConfianzaColor(ordenData.confianzaExtraccion))}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="observaciones">Observaciones</Label>
              </div>
              <Textarea
                id="observaciones"
                value={ordenData.observaciones || ""}
                onChange={(e) => handleOrdenChange("observaciones", e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Líneas de productos</h2>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parte Cliente</TableHead>
                <TableHead>Parte EVCO</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Cantidad</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Fecha entrega</TableHead>
                <TableHead>Fecha requerida</TableHead>
                <TableHead>Confianza</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lineas.map((linea) => (
                <TableRow key={linea.id} className={getConfianzaColor(linea.confianzaExtraccion)}>
                  <TableCell>{limpiarTexto(String(linea.numeroParteCLiente || ""))}</TableCell>
                  <TableCell>{limpiarTexto(String(linea.numeroParteEVCO || ""))}</TableCell>
                  <TableCell>{linea.descripcion}</TableCell>
                  <TableCell>{linea.cantidad}</TableCell>
                  <TableCell>{"piezas"}</TableCell>
                  <TableCell>${linea.precio?.toFixed(2)}</TableCell>
                  <TableCell>{linea.fechaEntrega ? format(new Date(linea.fechaEntrega), "dd/MM/yyyy") : ""}</TableCell>
                  <TableCell>
                    {linea.fechaRequerida ? format(new Date(linea.fechaRequerida), "dd/MM/yyyy") : ""}
                  </TableCell>
                  <TableCell>
                    <ConfianzaIndicator confianza={linea.confianzaExtraccion} />
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleEditarLinea(linea)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancelar}>
          Cancelar
        </Button>
        <Button onClick={handleConfirmar}>Confirmar y continuar</Button>
      </div>

      {/* Diálogo para editar línea */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar línea de producto</DialogTitle>
          </DialogHeader>

          {lineaEditando && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numeroParteCLiente">Número de parte cliente</Label>
                  <Input
                    id="numeroParteCLiente"
                    value={lineaEditando.numeroParteCLiente}
                    onChange={(e) =>
                      setLineaEditando({
                        ...lineaEditando,
                        numeroParteCLiente: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroParteEVCO">Número de parte EVCO</Label>
                  <Input
                    id="numeroParteEVCO"
                    value={lineaEditando.numeroParteEVCO}
                    onChange={(e) =>
                      setLineaEditando({
                        ...lineaEditando,
                        numeroParteEVCO: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descripcion">Descripción</Label>
                <Input
                  id="descripcion"
                  value={lineaEditando.descripcion || ""}
                  onChange={(e) =>
                    setLineaEditando({
                      ...lineaEditando,
                      descripcion: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    type="number"
                    value={lineaEditando.cantidad}
                    onChange={(e) =>
                      setLineaEditando({
                        ...lineaEditando,
                        cantidad: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unidad">Unidad</Label>
                  <Input
                    id="unidad"
                    value={lineaEditando.unidad || ""}
                    onChange={(e) =>
                      setLineaEditando({
                        ...lineaEditando,
                        unidad: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="precio">Precio unitario</Label>
                  <Input
                    id="precio"
                    type="number"
                    step="0.01"
                    value={lineaEditando.precio || 0}
                    onChange={(e) =>
                      setLineaEditando({
                        ...lineaEditando,
                        precio: Number(e.target.value),
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fechaEntrega">Fecha de entrega</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {lineaEditando.fechaEntrega ? (
                          format(new Date(lineaEditando.fechaEntrega), "PPP", { locale: es })
                        ) : (
                          <span>Selecciona una fecha</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={lineaEditando.fechaEntrega ? new Date(lineaEditando.fechaEntrega) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            setLineaEditando({
                              ...lineaEditando,
                              fechaEntrega: date.toISOString(),
                            })
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaRequerida">Fecha Requerida</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant={"outline"} className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {lineaEditando.fechaRequerida ? (
                        format(new Date(lineaEditando.fechaRequerida), "PPP", { locale: es })
                      ) : (
                        <span>Selecciona una fecha</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={lineaEditando.fechaRequerida ? new Date(lineaEditando.fechaRequerida) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setLineaEditando({
                            ...lineaEditando,
                            fechaRequerida: date.toISOString(),
                          })
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGuardarLinea}>
              <Save className="h-4 w-4 mr-2" />
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
