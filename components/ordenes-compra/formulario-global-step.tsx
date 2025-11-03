"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Package,
  FileText,
  Calendar,
  DollarSign,
  Hash,
  User,
  Truck,
  Plus,
  Trash2,
  Info,
  Save,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { buscarClientesPorSKU, buscarClientePorSKU, type ClienteData } from "@/data/clientes-lookup"

interface LineaOrden {
  skuCliente: string
  skuEvco: string
  descripcion: string
  cantidad: number
  precio: number
  unidad: string
  fechaRequerimiento?: string
  shipTo?: string
  tipoEmbarque?: string
}

interface OrdenCompra {
  id: string
  numeroOrden: string
  direccionEnvio: string
  fechaOrden: string
  moneda: string
  custId: string // SOLO custId, eliminamos cliente
  nombreCliente?: string
  archivoOriginal: string
  poTotal?: number
  lineas: LineaOrden[]
}

export function FormularioGlobalStep() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [ordenActual, setOrdenActual] = useState(0)
  const [searchResults, setSearchResults] = useState<ClienteData[]>([])
  const [activeSearchIndex, setActiveSearchIndex] = useState<number | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Función para auto-ajustar altura de textarea
  const autoResizeTextarea = (textarea: HTMLTextAreaElement) => {
    textarea.style.height = "auto"
    textarea.style.height = textarea.scrollHeight + "px"
  }

  // Función para calcular el total de la orden
  const calcularTotalOrden = (lineas: LineaOrden[]) => {
    return lineas.reduce((total, linea) => total + linea.cantidad * linea.precio, 0)
  }

  // Cargar órdenes del localStorage
  useEffect(() => {
    const ordenesGuardadas = localStorage.getItem("ordenes-procesadas")
    if (ordenesGuardadas) {
      const ordenesParsed = JSON.parse(ordenesGuardadas)
      // Migrar datos existentes - consolidar cliente y custId en solo custId
      const ordenesMigradas = ordenesParsed.map((orden: any) => {
        const { fechaRequerimiento, cliente, ...ordenSinFechaGlobal } = orden

        // Usar custId como campo principal, si no existe usar cliente
        const custIdFinal = orden.custId || orden.cliente || ""

        // Si había fecha global y las líneas no tienen fecha, usar la global
        if (fechaRequerimiento && ordenSinFechaGlobal.lineas) {
          ordenSinFechaGlobal.lineas = ordenSinFechaGlobal.lineas.map((linea: any) => ({
            ...linea,
            fechaRequerimiento: linea.fechaRequerimiento || fechaRequerimiento,
          }))
        }

        return {
          ...ordenSinFechaGlobal,
          custId: custIdFinal, // Solo custId
          // Mantener nombreCliente si existe
          nombreCliente: ordenSinFechaGlobal.nombreCliente,
        }
      })
      setOrdenes(ordenesMigradas)
    }
  }, [])

  // PASO B: Búsqueda automática al cargar órdenes y cálculo de totales
  useEffect(() => {
    if (ordenes.length > 0) {
      let actualizacionesRealizadas = 0

      const ordenesActualizadas = ordenes.map((orden) => {
        const lineasActualizadas = orden.lineas.map((linea) => {
          let lineaActualizada = { ...linea }

          // Solo buscar si hay SKU cliente y no hay SKU EVCO
          if (lineaActualizada.skuCliente && !lineaActualizada.skuEvco) {
            const resultado = buscarClientePorSKU(lineaActualizada.skuCliente)
            if (resultado) {
              actualizacionesRealizadas++
              lineaActualizada = {
                ...lineaActualizada,
                skuEvco: resultado.PartNum,
                descripcion: resultado.Descri || lineaActualizada.descripcion,
                tipoEmbarque: resultado.Tipo_Embarque || lineaActualizada.tipoEmbarque,
                shipTo: resultado.ShipToNum || lineaActualizada.shipTo,
              }
            }
          }
          return lineaActualizada
        })

        // Calcular el total de la orden si no existe
        const totalCalculado = calcularTotalOrden(lineasActualizadas)

        return {
          ...orden,
          lineas: lineasActualizadas,
          poTotal: orden.poTotal || totalCalculado,
        }
      })

      if (actualizacionesRealizadas > 0) {
        setOrdenes(ordenesActualizadas)
        toast({
          title: "Auto-completado realizado",
          description: `Se completaron automáticamente ${actualizacionesRealizadas} líneas con datos del sistema.`,
        })
      } else {
        setOrdenes(ordenesActualizadas)
      }
    }
  }, [ordenes.length, toast])

  const handleOrdenChange = (field: keyof OrdenCompra, value: string | number) => {
    setOrdenes((prev) =>
      prev.map((orden, index) => {
        if (index === ordenActual) {
          return { ...orden, [field]: value }
        }
        return orden
      }),
    )
  }

  const handleLineaChange = (lineaIndex: number, field: keyof LineaOrden, value: string | number) => {
    setOrdenes((prev) =>
      prev.map((orden, index) => {
        if (index === ordenActual) {
          const lineasActualizadas = orden.lineas.map((linea, lIndex) => {
            if (lIndex === lineaIndex) {
              return { ...linea, [field]: value }
            }
            return linea
          })

          // Recalcular el total si se cambia cantidad o precio
          if (field === "cantidad" || field === "precio") {
            const nuevoTotal = calcularTotalOrden(lineasActualizadas)
            return {
              ...orden,
              lineas: lineasActualizadas,
              poTotal: nuevoTotal,
            }
          }

          return {
            ...orden,
            lineas: lineasActualizadas,
          }
        }
        return orden
      }),
    )
  }

  // PASO D: Validación de SKU en tiempo real
  const handleSKUClienteChange = (lineaIndex: number, value: string) => {
    // Limpiar espacios automáticamente
    const skuLimpio = value.replace(/\s+/g, "").trim()
    handleLineaChange(lineaIndex, "skuCliente", skuLimpio)

    if (skuLimpio.length > 0) {
      const resultados = buscarClientesPorSKU(skuLimpio)
      setSearchResults(resultados)
      setActiveSearchIndex(lineaIndex)
      setShowSuggestions(resultados.length > 0)
    } else {
      setSearchResults([])
      setShowSuggestions(false)
      setActiveSearchIndex(null)
    }
  }

  // PASO C: Estructura de datos corregida en sugerencias
  const handleSelectSuggestion = (lineaIndex: number, sugerencia: ClienteData) => {
    handleLineaChange(lineaIndex, "skuCliente", sugerencia.xpartnum)
    handleLineaChange(lineaIndex, "skuEvco", sugerencia.PartNum)
    handleLineaChange(lineaIndex, "descripcion", sugerencia.Descri)
    handleLineaChange(lineaIndex, "tipoEmbarque", sugerencia.Tipo_Embarque)
    handleLineaChange(lineaIndex, "shipTo", sugerencia.ShipToNum)

    setShowSuggestions(false)
    setActiveSearchIndex(null)
    setSearchResults([])

    toast({
      title: "Datos completados",
      description: `SKU ${sugerencia.xpartnum} completado automáticamente.`,
    })
  }

  const handleAgregarLinea = () => {
    const nuevaLinea: LineaOrden = {
      skuCliente: "",
      skuEvco: "",
      descripcion: "",
      cantidad: 1,
      precio: 0,
      unidad: "EACH",
      fechaRequerimiento: "",
      shipTo: "",
      tipoEmbarque: "",
    }

    setOrdenes((prev) =>
      prev.map((orden, index) => (index === ordenActual ? { ...orden, lineas: [...orden.lineas, nuevaLinea] } : orden)),
    )
  }

  const handleEliminarLinea = (lineaIndex: number) => {
    setOrdenes((prev) =>
      prev.map((orden, index) => {
        if (index === ordenActual) {
          const lineasActualizadas = orden.lineas.filter((_, lIndex) => lIndex !== lineaIndex)
          const nuevoTotal = calcularTotalOrden(lineasActualizadas)
          return {
            ...orden,
            lineas: lineasActualizadas,
            poTotal: nuevoTotal,
          }
        }
        return orden
      }),
    )
  }

  const handleGuardarCambios = () => {
    localStorage.setItem("ordenes-procesadas", JSON.stringify(ordenes))
    toast({
      title: "Cambios guardados",
      description: "Los cambios se han guardado correctamente.",
    })
  }

  const handleContinuar = () => {
    localStorage.setItem("ordenes-procesadas", JSON.stringify(ordenes))
    localStorage.setItem("orden-progress-main", "2")
    router.push("/ordenes-de-compra/confirmar-orden")
  }

  const handleVolverAtras = () => {
    router.push("/ordenes-de-compra/subir-archivo")
  }

  if (ordenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes para editar</h3>
        <p className="text-sm text-gray-500 mb-4">Primero debes subir y procesar archivos.</p>
        <Button onClick={() => router.push("/ordenes-de-compra/subir-archivo")}>Ir a subir archivos</Button>
      </div>
    )
  }

  const orden = ordenes[ordenActual]

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header con navegación entre órdenes */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-medium">Formulario Global de Órdenes</h2>
          <Badge variant="outline" className="text-xs">
            Orden {ordenActual + 1} de {ordenes.length}
          </Badge>
        </div>

        {ordenes.length > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOrdenActual(Math.max(0, ordenActual - 1))}
              disabled={ordenActual === 0}
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-gray-500">
              {ordenActual + 1} / {ordenes.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOrdenActual(Math.min(ordenes.length - 1, ordenActual + 1))}
              disabled={ordenActual === ordenes.length - 1}
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Información general de la orden */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Información General
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numeroOrden" className="text-sm font-medium flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Número de Orden
              </Label>
              <Input
                id="numeroOrden"
                value={orden.numeroOrden || ""}
                onChange={(e) => handleOrdenChange("numeroOrden", e.target.value)}
                placeholder="PO-12345"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custId" className="text-sm font-medium flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Cust ID
              </Label>
              <Input
                id="custId"
                value={orden.custId || ""}
                onChange={(e) => handleOrdenChange("custId", e.target.value)}
                placeholder="10086"
                className="text-sm font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombreCliente" className="text-sm font-medium flex items-center gap-1">
                <User className="h-3 w-3" />
                Nombre del Cliente
              </Label>
              <Input
                id="nombreCliente"
                value={orden.nombreCliente || ""}
                onChange={(e) => handleOrdenChange("nombreCliente", e.target.value)}
                placeholder="Manitowoc Foodservice (Switzerland) Gmbh"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fechaOrden" className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fecha de Orden
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
              <Label htmlFor="moneda" className="text-sm font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Moneda
              </Label>
              <Input
                id="moneda"
                value={orden.moneda || "USD"}
                onChange={(e) => handleOrdenChange("moneda", e.target.value)}
                placeholder="USD"
                className="text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="poTotal" className="text-sm font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                PO Total
              </Label>
              <Input
                id="poTotal"
                value={orden.poTotal?.toFixed(2) || "0.00"}
                onChange={(e) => handleOrdenChange("poTotal", Number.parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                className="text-sm"
                type="number"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccionEnvio" className="text-sm font-medium flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Dirección de Envío
            </Label>
            <Textarea
              id="direccionEnvio"
              value={orden.direccionEnvio || ""}
              onChange={(e) => {
                handleOrdenChange("direccionEnvio", e.target.value)
                autoResizeTextarea(e.target)
              }}
              placeholder="Dirección completa de envío..."
              className="min-h-[80px] max-h-[200px] text-sm resize-y overflow-y-auto w-full"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabla de líneas de la orden */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-4 w-4" />
              Líneas de la Orden ({orden.lineas.length})
            </CardTitle>
            <Button onClick={handleAgregarLinea} size="sm" className="flex items-center gap-1">
              <Plus className="w-3 h-3" />
              Agregar línea
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orden.lineas.map((linea, lineaIndex) => (
              <div key={lineaIndex} className="border rounded-lg p-4 space-y-3 relative w-full">
                <div className="flex items-center justify-between mb-2">
                  <Badge variant="secondary" className="text-xs">
                    Línea {lineaIndex + 1}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEliminarLinea(lineaIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {/* SKU Cliente con búsqueda */}
                  <div className="space-y-1 relative">
                    <Label className="text-xs font-medium text-gray-700">
                      SKU Cliente <span className="text-red-500">*</span>
                    </Label>
                    <div className="relative">
                      <Textarea
                        value={linea.skuCliente || ""}
                        onChange={(e) => {
                          handleSKUClienteChange(lineaIndex, e.target.value)
                          autoResizeTextarea(e.target)
                        }}
                        placeholder="SKU del cliente"
                        className="min-h-[48px] text-xs resize-none overflow-hidden pr-8 w-full"
                        rows={1}
                      />
                    </div>

                    {/* Sugerencias de búsqueda */}
                    {showSuggestions && activeSearchIndex === lineaIndex && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto mt-1">
                        {searchResults.slice(0, 5).map((resultado, idx) => (
                          <div
                            key={idx}
                            className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                            onClick={() => handleSelectSuggestion(lineaIndex, resultado)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-blue-600 truncate">
                                  {resultado.xpartnum} → {resultado.PartNum}
                                </p>
                                <p className="text-xs text-gray-600 truncate">{resultado.Descri}</p>
                                <p className="text-xs text-gray-500">{resultado.Name}</p>
                              </div>
                              <Check className="h-3 w-3 text-green-600" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* SKU EVCO */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">SKU EVCO</Label>
                    <Textarea
                      value={linea.skuEvco || ""}
                      onChange={(e) => {
                        handleLineaChange(lineaIndex, "skuEvco", e.target.value)
                        autoResizeTextarea(e.target)
                      }}
                      placeholder="SKU interno"
                      className="min-h-[48px] text-xs resize-none overflow-hidden w-full"
                      rows={1}
                    />
                  </div>

                  {/* Cantidad */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Cantidad</Label>
                    <Input
                      type="number"
                      value={linea.cantidad}
                      onChange={(e) => handleLineaChange(lineaIndex, "cantidad", Number.parseInt(e.target.value) || 0)}
                      placeholder="0"
                      className="text-xs h-12 w-full"
                      min="0"
                    />
                  </div>

                  {/* Precio */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Precio</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={linea.precio}
                      onChange={(e) => handleLineaChange(lineaIndex, "precio", Number.parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      className="text-xs h-12 w-full"
                      min="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Fecha de Requerimiento */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Fecha Requerimiento</Label>
                    <Input
                      type="date"
                      value={linea.fechaRequerimiento || ""}
                      onChange={(e) => handleLineaChange(lineaIndex, "fechaRequerimiento", e.target.value)}
                      className="text-xs h-12 w-full"
                    />
                  </div>

                  {/* Ship To */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Ship To</Label>
                    <Input
                      value={linea.shipTo || ""}
                      onChange={(e) => handleLineaChange(lineaIndex, "shipTo", e.target.value)}
                      placeholder="Almacén de destino"
                      className="text-xs h-12 w-full"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Descripción */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Descripción</Label>
                    <Textarea
                      value={linea.descripcion || ""}
                      onChange={(e) => {
                        handleLineaChange(lineaIndex, "descripcion", e.target.value)
                        autoResizeTextarea(e.target)
                      }}
                      placeholder="Descripción del producto"
                      className="min-h-[64px] text-xs resize-none overflow-hidden w-full"
                      rows={2}
                    />
                  </div>

                  {/* Unidad */}
                  <div className="space-y-1">
                    <Label className="text-xs font-medium text-gray-700">Unidad</Label>
                    <Input
                      value={linea.unidad}
                      onChange={(e) => handleLineaChange(lineaIndex, "unidad", e.target.value)}
                      placeholder="EACH"
                      className="text-xs h-12 w-full"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 w-full">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-xs font-medium text-blue-900 mb-1">Información importante</h4>
          <p className="text-xs text-blue-700">
            • El <strong>Cust ID</strong> es el identificador único del cliente que se usará en la exportación CSV para
            Epicor ERP
            <br />• Escribe en "SKU Cliente" para buscar automáticamente en la base de datos
          </p>
        </div>
      </div>

      {/* Botones de acción */}
      <div className="flex justify-between items-center pt-4 border-t w-full">
        <Button variant="outline" onClick={handleVolverAtras} className="flex items-center gap-2 bg-transparent">
          <ArrowLeft className="w-4 h-4" />
          Volver atrás
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGuardarCambios} className="flex items-center gap-2 bg-transparent">
            <Save className="w-4 h-4" />
            Guardar cambios
          </Button>

          <Button onClick={handleContinuar} className="flex items-center gap-2">
            Continuar
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
