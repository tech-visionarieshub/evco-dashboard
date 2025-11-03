"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  Package,
  Calendar,
  DollarSign,
  Hash,
  User,
  Truck,
  Download,
  Eye,
  CheckCircle,
  Info,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

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
  custId: string // Número del cliente
  nombreCliente?: string // Nombre del cliente
  archivoOriginal: string
  poTotal?: number
  lineas: LineaOrden[]
}

export function ConfirmarOrdenStep() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [ordenActual, setOrdenActual] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [previewData, setPreviewData] = useState<string[][]>([])
  const { toast } = useToast()
  const router = useRouter()

  // Cargar órdenes del localStorage
  useEffect(() => {
    const ordenesGuardadas = localStorage.getItem("ordenes-procesadas")
    if (ordenesGuardadas) {
      const ordenesParsed = JSON.parse(ordenesGuardadas)

      // Asegurar que custId sea numérico y nombreCliente sea texto
      const ordenesCorregidas = ordenesParsed.map((orden: any) => {
        let custIdNumerico = ""
        let nombreClienteTexto = ""

        // Si custId contiene texto, extraer el número
        if (orden.custId && typeof orden.custId === "string") {
          const numeroMatch = orden.custId.match(/\b\d+\b/)
          if (numeroMatch) {
            custIdNumerico = numeroMatch[0]
            // Si no hay nombreCliente, usar el texto restante
            if (!orden.nombreCliente) {
              nombreClienteTexto = orden.custId.replace(/\b\d+\b/, "").trim()
            }
          } else if (/^\d+$/.test(orden.custId)) {
            // Si custId es solo números
            custIdNumerico = orden.custId
          }
        }

        // Si hay cliente (campo legacy), usarlo como custId si es numérico
        if (orden.cliente && /^\d+$/.test(orden.cliente)) {
          custIdNumerico = orden.cliente
        }

        return {
          ...orden,
          custId: custIdNumerico || orden.custId || "",
          nombreCliente: orden.nombreCliente || nombreClienteTexto || "",
        }
      })

      setOrdenes(ordenesCorregidas)
    }
  }, [])

  // Función para generar CSV para Epicor
  const generarCSVEpicor = () => {
    if (ordenes.length === 0) return ""

    // Headers estáticos + dinámicos
    const maxLineas = Math.max(...ordenes.map((orden) => orden.lineas.length))
    const headers = ["purchasing_document", "cust_id", "ship_to"]

    // Agregar headers dinámicos para cada línea
    for (let i = 1; i <= maxLineas; i++) {
      headers.push(`item_${i}`, `part_number_${i}`, `material_${i}`, `qty_${i}`, `delivery_date_${i}`)
    }

    const rows = [headers]

    ordenes.forEach((orden) => {
      const row: string[] = []

      // Columnas estáticas
      row.push(orden.numeroOrden || "")
      row.push(orden.custId || "") // Solo el número
      row.push(orden.direccionEnvio || "")

      // Columnas dinámicas por línea
      for (let i = 0; i < maxLineas; i++) {
        const linea = orden.lineas[i]
        if (linea) {
          row.push((i + 1).toString()) // item_x
          row.push(linea.skuEvco || "") // part_number_x
          row.push(linea.descripcion || "") // material_x
          row.push(linea.cantidad.toString()) // qty_x

          // Fecha en formato DDMMYYYY
          let fechaFormateada = ""
          if (linea.fechaRequerimiento) {
            const fecha = new Date(linea.fechaRequerimiento)
            const dia = fecha.getDate().toString().padStart(2, "0")
            const mes = (fecha.getMonth() + 1).toString().padStart(2, "0")
            const año = fecha.getFullYear().toString()
            fechaFormateada = `${dia}${mes}${año}`
          }
          row.push(fechaFormateada) // delivery_date_x
        } else {
          // Línea vacía
          row.push("", "", "", "", "")
        }
      }

      rows.push(row)
    })

    return rows.map((row) => row.join(",")).join("\n")
  }

  // Función para generar preview del CSV
  const generarPreviewEpicor = () => {
    if (ordenes.length === 0) return []

    const maxLineas = Math.max(...ordenes.map((orden) => orden.lineas.length))
    const headers = ["purchasing_document", "cust_id", "ship_to"]

    // Agregar headers dinámicos
    for (let i = 1; i <= maxLineas; i++) {
      headers.push(`item_${i}`, `part_number_${i}`, `material_${i}`, `qty_${i}`, `delivery_date_${i}`)
    }

    const rows = [headers]

    // Solo mostrar las primeras 3 órdenes en el preview
    ordenes.slice(0, 3).forEach((orden) => {
      const row: string[] = []

      row.push(orden.numeroOrden || "")
      row.push(orden.custId || "")
      row.push(orden.direccionEnvio?.substring(0, 30) + "..." || "")

      for (let i = 0; i < maxLineas; i++) {
        const linea = orden.lineas[i]
        if (linea) {
          row.push((i + 1).toString())
          row.push(linea.skuEvco || "")
          row.push(linea.descripcion?.substring(0, 20) + "..." || "")
          row.push(linea.cantidad.toString())

          let fechaFormateada = ""
          if (linea.fechaRequerimiento) {
            const fecha = new Date(linea.fechaRequerimiento)
            const dia = fecha.getDate().toString().padStart(2, "0")
            const mes = (fecha.getMonth() + 1).toString().padStart(2, "0")
            const año = fecha.getFullYear().toString()
            fechaFormateada = `${dia}${mes}${año}`
          }
          row.push(fechaFormateada)
        } else {
          row.push("", "", "", "", "")
        }
      }

      rows.push(row)
    })

    return rows
  }

  const handleDescargarCSV = () => {
    const csvContent = generarCSVEpicor()
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `ordenes_epicor_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: "CSV descargado",
      description: "El archivo CSV para Epicor se ha descargado correctamente.",
    })
  }

  const handleVerPreview = () => {
    const preview = generarPreviewEpicor()
    setPreviewData(preview)
    setShowPreview(true)
  }

  const handleFinalizar = () => {
    // Guardar en historial
    const historial = JSON.parse(localStorage.getItem("historial-ordenes") || "[]")
    const nuevaEntrada = {
      id: Date.now().toString(),
      fecha: new Date().toISOString(),
      ordenes: ordenes.length,
      lineas: ordenes.reduce((total, orden) => total + orden.lineas.length, 0),
      estado: "completado",
    }
    historial.push(nuevaEntrada)
    localStorage.setItem("historial-ordenes", JSON.stringify(historial))

    // Limpiar datos temporales
    localStorage.removeItem("ordenes-procesadas")
    localStorage.removeItem("orden-progress-main")

    toast({
      title: "Proceso completado",
      description: "Las órdenes se han procesado exitosamente.",
    })

    router.push("/ordenes-de-compra/historial")
  }

  const handleVolverAtras = () => {
    router.push("/ordenes-de-compra/formulario-global")
  }

  if (ordenes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay órdenes para confirmar</h3>
        <p className="text-sm text-gray-500 mb-4">Primero debes completar el formulario global.</p>
        <Button onClick={() => router.push("/ordenes-de-compra/formulario-global")}>Ir al formulario global</Button>
      </div>
    )
  }

  const orden = ordenes[ordenActual]

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <h2 className="text-lg font-medium">Confirmar y Exportar Órdenes</h2>
          <Badge variant="outline" className="text-xs">
            {ordenes.length} orden{ordenes.length !== 1 ? "es" : ""} lista{ordenes.length !== 1 ? "s" : ""}
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

      {/* Resumen de la orden actual */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Resumen de Orden {ordenActual + 1}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Número de Orden
              </Label>
              <div className="p-2 bg-gray-50 rounded text-sm font-mono">{orden.numeroOrden || "N/A"}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Hash className="h-3 w-3" />
                Cust ID
              </Label>
              <div className="p-2 bg-gray-50 rounded text-sm font-mono">{orden.custId || "N/A"}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <User className="h-3 w-3" />
                Nombre del Cliente
              </Label>
              <div className="p-2 bg-gray-50 rounded text-sm">{orden.nombreCliente || "N/A"}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fecha de Orden
              </Label>
              <div className="p-2 bg-gray-50 rounded text-sm">{orden.fechaOrden || "N/A"}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                Moneda
              </Label>
              <div className="p-2 bg-gray-50 rounded text-sm">{orden.moneda || "USD"}</div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                PO Total
              </Label>
              <div className="p-2 bg-gray-50 rounded text-sm font-mono">${orden.poTotal?.toFixed(2) || "0.00"}</div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-1">
              <Truck className="h-3 w-3" />
              Dirección de Envío
            </Label>
            <div className="p-2 bg-gray-50 rounded text-sm max-h-20 overflow-y-auto">
              {orden.direccionEnvio || "N/A"}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Líneas de la orden */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Package className="h-4 w-4" />
            Líneas de la Orden ({orden.lineas.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>SKU Cliente</TableHead>
                  <TableHead>SKU EVCO</TableHead>
                  <TableHead>Descripción</TableHead>
                  <TableHead className="text-right">Cantidad</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead>Fecha Req.</TableHead>
                  <TableHead>Ship To</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orden.lineas.map((linea, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{linea.skuCliente}</TableCell>
                    <TableCell className="font-mono text-xs">{linea.skuEvco}</TableCell>
                    <TableCell className="max-w-48 truncate" title={linea.descripcion}>
                      {linea.descripcion}
                    </TableCell>
                    <TableCell className="text-right">{linea.cantidad}</TableCell>
                    <TableCell className="text-right">${linea.precio.toFixed(2)}</TableCell>
                    <TableCell className="text-xs">
                      {linea.fechaRequerimiento ? new Date(linea.fechaRequerimiento).toLocaleDateString() : "N/A"}
                    </TableCell>
                    <TableCell className="text-xs">{linea.shipTo || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Información del formato Epicor */}
      <div className="flex items-start gap-2 p-4 bg-blue-50 rounded-lg border border-blue-200 w-full">
        <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <h4 className="text-sm font-medium text-blue-900 mb-2">Formato de exportación para Epicor</h4>
          <div className="text-xs text-blue-700 space-y-1">
            <p>
              <strong>Columnas estáticas:</strong>
            </p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>
                <code>purchasing_document</code> - Número de orden
              </li>
              <li>
                <code>cust_id</code> - ID del cliente (número)
              </li>
              <li>
                <code>ship_to</code> - Dirección de envío
              </li>
            </ul>
            <p className="mt-2">
              <strong>Columnas variables (por línea):</strong>
            </p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>
                <code>item_x</code> - Número de línea
              </li>
              <li>
                <code>part_number_x</code> - SKU EVCO
              </li>
              <li>
                <code>material_x</code> - Descripción
              </li>
              <li>
                <code>qty_x</code> - Cantidad
              </li>
              <li>
                <code>delivery_date_x</code> - Fecha (DDMMYYYY)
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Preview del CSV */}
      {showPreview && (
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4" />
                Preview CSV Epicor
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => setShowPreview(false)}>
                Cerrar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {previewData[0]?.map((header, index) => (
                      <TableHead key={index} className="text-xs font-mono">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.slice(1).map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <TableCell key={cellIndex} className="text-xs font-mono max-w-32 truncate" title={cell}>
                          {cell}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            {ordenes.length > 3 && (
              <p className="text-xs text-gray-500 mt-2">
                Mostrando las primeras 3 órdenes. El archivo completo incluirá todas las {ordenes.length} órdenes.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Botones de acción */}
      <div className="flex justify-between items-center pt-4 border-t w-full">
        <Button variant="outline" onClick={handleVolverAtras} className="flex items-center gap-2 bg-transparent">
          <ArrowLeft className="w-4 h-4" />
          Volver atrás
        </Button>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleVerPreview} className="flex items-center gap-2 bg-transparent">
            <Eye className="w-4 h-4" />
            Ver preview
          </Button>

          <Button variant="outline" onClick={handleDescargarCSV} className="flex items-center gap-2 bg-transparent">
            <Download className="w-4 h-4" />
            Descargar CSV
          </Button>

          <Button onClick={handleFinalizar} className="flex items-center gap-2">
            <Check className="w-4 h-4" />
            Finalizar proceso
          </Button>
        </div>
      </div>
    </div>
  )
}
