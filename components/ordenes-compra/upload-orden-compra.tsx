"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  FileUp,
  Info,
  X,
  FileText,
  Trash2,
  Upload,
  ArrowLeft,
  ArrowRight,
  Check,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  Brain,
  Type,
  AlertCircle,
  Search,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { buscarClientePorCustId } from "@/data/clientes-database"
import { OrdenFlowService, type OrdenFlowData } from "@/lib/services/orden-flow-service"
import type { OrdenCompra, LineaOrden } from "@/lib/firebase/types"

// Usamos un tipo local para el ViewModel que incluye el nombre del cliente para la UI
type OrdenViewModel = Omit<OrdenCompra, "customerId"> & {
  customerId: string
  clienteNombre: string
  lineas: LineaOrden[]
  archivoOriginal: string
  contenidoOriginal?: string
}

export function UploadOrdenCompra() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedMode, setSelectedMode] = useState<"inteligente" | "manual">("inteligente")
  const [archivos, setArchivos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [textoManual, setTextoManual] = useState("")
  const [custId, setCustId] = useState("")
  const [clienteEncontrado, setClienteEncontrado] = useState<string>("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [progress, setProgress] = useState(0)
  const [ordenes, setOrdenes] = useState<OrdenViewModel[]>([])
  const [currentOrdenIndex, setCurrentOrdenIndex] = useState(0)
  const [ordenesIds, setOrdenesIds] = useState<string[]>([]) // IDs de órdenes guardadas en BD
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  const steps = [
    { number: 1, title: "Subir archivo" },
    { number: 2, title: "Formulario global" },
    { number: 3, title: "Confirmar orden" },
  ]

  // Cargar progreso guardado al inicializar
  useEffect(() => {
    const progresoGuardado = localStorage.getItem("orden-upload-progress")
    if (progresoGuardado) {
      try {
        const progreso = JSON.parse(progresoGuardado)
        setCurrentStep(progreso.step || 1)
        setCustId(progreso.custId || "")
        setClienteEncontrado(progreso.clienteEncontrado || "")
        setSelectedMode(progreso.selectedMode || "inteligente")

        if (progreso.ordenesIds && progreso.ordenesIds.length > 0) {
          setOrdenesIds(progreso.ordenesIds)
          cargarOrdenesDesdeDB(progreso.ordenesIds)
        }
      } catch (error) {
        console.error("Error cargando progreso:", error)
      }
    }
  }, [])

  // Guardar progreso automáticamente
  const guardarProgreso = async () => {
    const progreso = {
      step: currentStep,
      custId,
      clienteEncontrado,
      selectedMode,
      ordenesIds,
      timestamp: Date.now(),
    }

    localStorage.setItem("orden-upload-progress", JSON.stringify(progreso))
  }

  // Cargar órdenes desde la base de datos
  const cargarOrdenesDesdeDB = async (ids: string[]) => {
    try {
      const ordenesDB: OrdenViewModel[] = []

      for (const id of ids) {
        const ordenData = await OrdenFlowService.obtenerOrdenCompleta(id)
        if (ordenData) {
          const nombreCliente = await buscarClientePorCustId(ordenData.customerId)
          ordenesDB.push({
            ...ordenData,
            clienteNombre: nombreCliente || "Cliente no encontrado",
            lineas: ordenData.lineas.map((linea) => ({
              ...linea,
            })),
          })
        }
      }

      setOrdenes(ordenesDB)
    } catch (error) {
      console.error("Error cargando órdenes desde DB:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las órdenes guardadas",
        variant: "destructive",
      })
    }
  }

  // Manejar cambio en Cust ID
  const handleCustIdChange = (value: string) => {
    setCustId(value)
    if (clienteEncontrado) {
      setClienteEncontrado("")
    }
    guardarProgreso()
  }

  // Función para buscar cliente manualmente
  const handleBuscarCliente = async () => {
    if (!custId.trim()) {
      toast({
        title: "Cust ID requerido",
        description: "Por favor, ingresa un Cust ID para buscar",
        variant: "destructive",
      })
      return
    }

    try {
      const nombreCliente = await buscarClientePorCustId(custId)
      setClienteEncontrado(nombreCliente)

      if (!nombreCliente) {
        toast({
          title: "Cliente no encontrado",
          description: `No se encontró un cliente con Cust ID: ${custId}. Puedes continuar pero verifica la información.`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Cliente encontrado",
          description: `Cliente: ${nombreCliente}`,
        })
        guardarProgreso()
      }
    } catch (error) {
      console.error("Error buscando cliente:", error)
      toast({
        title: "Error",
        description: "Error al buscar el cliente",
        variant: "destructive",
      })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files)
      setArchivos((prevArchivos) => [...prevArchivos, ...newFiles])

      // Generar previews para los nuevos archivos
      newFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreviews((prevPreviews) => [...prevPreviews, e.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
      })

      e.target.value = ""
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      setArchivos((prevArchivos) => [...prevArchivos, ...files])

      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          if (e.target?.result) {
            setPreviews((prevPreviews) => [...prevPreviews, e.target!.result as string])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleRemoveFile = (index: number) => {
    setArchivos((prevArchivos) => prevArchivos.filter((_, i) => i !== index))
    setPreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index))
  }

  const generateOrdenFromFile = (file: File, index: number): Omit<OrdenViewModel, "id"> => {
    const clientes = [
      "Manitowoc FSG Manufactura",
      "Caterpillar Inc.",
      "John Deere",
      "Komatsu America",
      "Volvo Construction Equipment",
    ]

    const productos = [
      {
        descripcion: "DISTRIBUTION TUBE ASSY 30 IN",
        cantidad: 4050,
        precio: 5.24,
        skuCliente: "DTA-30-001",
        skuEvco: "EVP-2345",
      },
      {
        descripcion: "DISTRIBUTION TUBE ASSY 22 IN",
        cantidad: 2025,
        precio: 4.3,
        skuCliente: "DTA-22-002",
        skuEvco: "EVP-1122",
      },
      {
        descripcion: "HYDRAULIC CYLINDER ASSY",
        cantidad: 150,
        precio: 125.5,
        skuCliente: "HCA-150-003",
        skuEvco: "EVP-7890",
      },
      {
        descripcion: "BEARING ASSEMBLY",
        cantidad: 500,
        precio: 45.75,
        skuCliente: "BA-500-004",
        skuEvco: "EVP-4567",
      },
      {
        descripcion: "SEAL KIT COMPLETE",
        cantidad: 200,
        precio: 89.99,
        skuCliente: "SKC-200-005",
        skuEvco: "EVP-8901",
      },
    ]

    const clienteNombre = clienteEncontrado || clientes[index % clientes.length]
    const randomProductos = productos.slice(0, Math.floor(Math.random() * 3) + 1)

    return {
      poNumber: `PO-${(228976 + index).toString()}`,
      shipTo: `${clienteNombre} S. de R.L., FFCC a Tampico # ${1601 + index}, Parque Industrial Finsa`,
      fechaOrden: new Date().toISOString().split("T")[0],
      tipoOrden: "nacional",
      moneda: "USD",
      customerId: custId,
      clienteNombre: clienteNombre,
      archivoOriginal: file.name,
      estado: "borrador",
      canalRecepcion: "inteligente",
      progresoPaso: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lineas: randomProductos.map((producto, lineaIndex) => ({
        id: `temp-linea-${lineaIndex}`,
        ordenId: "temp-orden",
        numeroLinea: lineaIndex + 1,
        skuCliente: producto.skuCliente,
        skuEvco: producto.skuEvco,
        descripcion: producto.descripcion,
        cantidad: producto.cantidad,
        precio: producto.precio,
        unidad: "EACH",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
    }
  }

  const generateOrdenFromText = (texto: string): Omit<OrdenViewModel, "id"> => {
    const extractedData = simulateOpenAIExtraction(texto)

    return {
      poNumber: extractedData.poNumber,
      shipTo: extractedData.shipTo,
      fechaOrden: extractedData.fechaOrden,
      tipoOrden: extractedData.tipoOrden,
      moneda: extractedData.moneda,
      customerId: custId,
      clienteNombre: clienteEncontrado || extractedData.cliente,
      archivoOriginal: "Texto manual",
      contenidoOriginal: texto,
      estado: "borrador",
      canalRecepcion: "manual",
      progresoPaso: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lineas: extractedData.lineas.map((l, i) => ({ ...l, id: `temp-linea-${i}`, ordenId: "temp-orden" })),
    }
  }

  const simulateOpenAIExtraction = (texto: string) => {
    const poNumberMatch = texto.match(/(?:PO|P\.O\.|Purchase Order|Orden)[:\s#]*([A-Z0-9-]+)/i)
    const fechaMatch = texto.match(/(?:fecha|date)[:\s]*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/i)
    const clienteMatch = texto.match(/(?:cliente|customer|company)[:\s]*([A-Za-z\s]+)/i)
    const monedaMatch = texto.match(/(?:USD|EUR|MXN|CAD|\$|€|peso)/i)

    const lineasExtraidas = []
    const lineasTexto = texto.split("\n").filter((linea) => linea.trim().length > 10)

    for (let i = 0; i < Math.min(3, lineasTexto.length); i++) {
      const linea = lineasTexto[i]
      const cantidadMatch = linea.match(/(\d+)/)
      const precioMatch = linea.match(/\$?(\d+\.?\d*)/)

      lineasExtraidas.push({
        numeroLinea: i + 1,
        skuCliente: `CLI-${(1000 + i).toString()}`,
        skuEvco: `EVP-${(2000 + i).toString()}`,
        descripcion: linea.substring(0, 50).trim() || `Producto extraído ${i + 1}`,
        cantidad: cantidadMatch ? Number.parseInt(cantidadMatch[1]) : Math.floor(Math.random() * 1000) + 100,
        precio: precioMatch ? Number.parseFloat(precioMatch[1]) : Math.random() * 100 + 10,
        unidad: "EACH",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    if (lineasExtraidas.length === 0) {
      lineasExtraidas.push({
        numeroLinea: 1,
        skuCliente: "CLI-1001",
        skuEvco: "EVP-2001",
        descripcion: "Producto extraído del texto",
        cantidad: 100,
        precio: 25.5,
        unidad: "EACH",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    }

    return {
      poNumber: poNumberMatch ? poNumberMatch[1] : `PO-${Date.now().toString().slice(-6)}`,
      shipTo: "Dirección extraída del texto - Por favor verificar y editar según sea necesario",
      fechaOrden: fechaMatch
        ? new Date(fechaMatch[1]).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      tipoOrden: "nacional",
      moneda: monedaMatch ? (monedaMatch[0].toUpperCase() === "$" ? "USD" : monedaMatch[0].toUpperCase()) : "USD",
      cliente: clienteMatch ? clienteMatch[1].trim() : "Cliente extraído del texto",
      lineas: lineasExtraidas,
    }
  }

  // Guardar órdenes en base de datos
  const guardarOrdenesEnDB = async (ordenesData: Omit<OrdenViewModel, "id">[]): Promise<string[]> => {
    const idsCreados: string[] = []

    try {
      for (const orden of ordenesData) {
        const ordenFlowData: OrdenFlowData = {
          customerId: orden.customerId,
          poNumber: orden.poNumber,
          fechaOrden: orden.fechaOrden,
          fechaRequerimiento: orden.fechaRequerimiento,
          canalRecepcion: orden.canalRecepcion,
          shipTo: orden.shipTo,
          tipoOrden: orden.tipoOrden,
          moneda: orden.moneda,
          archivoOriginal: orden.archivoOriginal,
          contenidoOriginal: orden.contenidoOriginal,
          lineas: orden.lineas.map((linea) => ({
            numeroLinea: linea.numeroLinea,
            skuCliente: linea.skuCliente,
            skuEvco: linea.skuEvco,
            descripcion: linea.descripcion,
            cantidad: linea.cantidad,
            precio: linea.precio,
            unidad: linea.unidad,
            shipTo: linea.shipTo,
          })),
        }

        const ordenId = await OrdenFlowService.crearOrdenCompleta(ordenFlowData)
        idsCreados.push(ordenId)
      }

      return idsCreados
    } catch (error) {
      console.error("Error guardando órdenes en DB:", error)
      throw error
    }
  }

  const handleProcesarArchivos = async () => {
    if (archivos.length === 0) {
      toast({
        title: "No hay archivos",
        description: "Por favor, selecciona al menos un archivo para procesar",
        variant: "destructive",
      })
      return
    }

    if (!custId.trim()) {
      toast({
        title: "Cust ID requerido",
        description: "Por favor, ingresa el Cust ID antes de procesar los archivos",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const nuevasOrdenes: Omit<OrdenViewModel, "id">[] = []

      // Procesar cada archivo
      for (let i = 0; i < archivos.length; i++) {
        const file = archivos[i]
        setProgress(((i + 0.5) / archivos.length) * 50)

        await new Promise((resolve) => setTimeout(resolve, 1000))

        const nuevaOrden = generateOrdenFromFile(file, i)
        nuevasOrdenes.push(nuevaOrden)

        setProgress(((i + 1) / archivos.length) * 50)
      }

      // Guardar en base de datos
      setProgress(60)
      const idsCreados = await guardarOrdenesEnDB(nuevasOrdenes)

      // Actualizar estados
      setOrdenes(
        nuevasOrdenes.map((orden, index) => ({
          ...orden,
          id: idsCreados[index],
        })),
      )
      setOrdenesIds(idsCreados)
      setCurrentOrdenIndex(0)
      setProgress(100)

      await guardarProgreso()

      toast({
        title: "Procesamiento completado",
        description: `Se han procesado ${archivos.length} archivos y guardado ${nuevasOrdenes.length} órdenes`,
      })

      setCurrentStep(2)
    } catch (error) {
      console.error("Error al procesar los archivos:", error)
      toast({
        title: "Error de procesamiento",
        description: "Ocurrió un error al procesar los archivos",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcesarTexto = async () => {
    if (!textoManual.trim()) {
      toast({
        title: "No hay texto",
        description: "Por favor, pega el texto de la orden de compra para procesar",
        variant: "destructive",
      })
      return
    }

    if (!custId.trim()) {
      toast({
        title: "Cust ID requerido",
        description: "Por favor, ingresa el Cust ID antes de procesar el texto",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      setProgress(25)
      await new Promise((resolve) => setTimeout(resolve, 800))

      setProgress(50)
      const nuevaOrden = generateOrdenFromText(textoManual)

      setProgress(75)
      const idsCreados = await guardarOrdenesEnDB([nuevaOrden])

      setOrdenes([{ ...nuevaOrden, id: idsCreados[0] }])
      setOrdenesIds(idsCreados)
      setCurrentOrdenIndex(0)
      setProgress(100)

      await guardarProgreso()

      toast({
        title: "Procesamiento completado",
        description: "Se ha extraído la información del texto y guardado en la base de datos.",
      })

      setCurrentStep(2)
    } catch (error) {
      console.error("Error al procesar el texto:", error)
      toast({
        title: "Error de procesamiento",
        description: "Ocurrió un error al procesar el texto",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleOrdenChange = async (field: keyof OrdenViewModel, value: string) => {
    const updatedOrdenes = ordenes.map((orden, index) =>
      index === currentOrdenIndex
        ? {
            ...orden,
            [field]: value,
          }
        : orden,
    )

    setOrdenes(updatedOrdenes)

    // Guardar cambio en BD si la orden ya existe
    const currentOrden = updatedOrdenes[currentOrdenIndex]
    if (currentOrden.id) {
      try {
        await OrdenFlowService.guardarProgresoTemporal(currentOrden.id, {
          [field]: value,
        } as Partial<OrdenFlowData>)
      } catch (error) {
        console.error("Error guardando cambio:", error)
      }
    }
  }

  const handleLineaChange = async (lineaIndex: number, field: keyof LineaOrden, value: string | number) => {
    const updatedOrdenes = ordenes.map((orden, ordenIndex) =>
      ordenIndex === currentOrdenIndex
        ? {
            ...orden,
            lineas: orden.lineas.map((linea, lIndex) =>
              lIndex === lineaIndex
                ? {
                    ...linea,
                    [field]: value,
                  }
                : linea,
            ),
          }
        : orden,
    )

    setOrdenes(updatedOrdenes)

    // Guardar cambio en BD
    const currentOrden = updatedOrdenes[currentOrdenIndex]
    if (currentOrden.id) {
      try {
        await OrdenFlowService.guardarProgresoTemporal(currentOrden.id, {
          lineas: currentOrden.lineas.map((linea) => ({
            numeroLinea: linea.numeroLinea,
            skuCliente: linea.skuCliente,
            skuEvco: linea.skuEvco,
            descripcion: linea.descripcion,
            cantidad: linea.cantidad,
            precio: linea.precio,
            unidad: linea.unidad,
            shipTo: linea.shipTo,
          })),
        })
      } catch (error) {
        console.error("Error guardando cambio de línea:", error)
      }
    }
  }

  const handleNextStep = async () => {
    if (currentStep < steps.length) {
      // Guardar progreso antes de avanzar
      await guardarProgreso()

      // Actualizar progreso en BD
      if (ordenesIds.length > 0) {
        try {
          for (const ordenId of ordenesIds) {
            await OrdenFlowService.actualizarProgreso(ordenId, currentStep + 1)
          }
        } catch (error) {
          console.error("Error actualizando progreso en BD:", error)
        }
      }

      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handlePrevOrden = () => {
    if (currentOrdenIndex > 0) {
      setCurrentOrdenIndex(currentOrdenIndex - 1)
    }
  }

  const handleNextOrden = () => {
    if (currentOrdenIndex < ordenes.length - 1) {
      setCurrentOrdenIndex(currentOrdenIndex + 1)
    }
  }

  const handleExportarUnificado = async () => {
    try {
      // Marcar órdenes como procesadas
      for (const ordenId of ordenesIds) {
        await OrdenFlowService.cambiarEstado(ordenId, "procesada", "Orden exportada y completada")
      }

      // Generar CSV
      const headers = [
        "Cliente",
        "PO Number",
        "Fecha Orden",
        "SKU Cliente",
        "SKU EVCO",
        "Descripción",
        "Cantidad",
        "Precio",
        "Moneda",
        "Unidad",
        "Ship To",
        "Observaciones",
      ]

      const rows = ordenes.flatMap((orden) =>
        orden.lineas.map((linea) => [
          orden.clienteNombre,
          orden.poNumber,
          orden.fechaOrden,
          linea.skuCliente,
          linea.skuEvco,
          linea.descripcion,
          linea.cantidad.toString(),
          linea.precio.toFixed(2),
          orden.moneda,
          linea.unidad,
          orden.shipTo,
          "",
        ]),
      )

      const csvContent = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      const url = URL.createObjectURL(blob)
      link.setAttribute("href", url)
      link.setAttribute("download", `ordenes_compra_${new Date().toISOString().split("T")[0]}.csv`)
      link.style.visibility = "hidden"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      // Limpiar progreso
      localStorage.removeItem("orden-upload-progress")
      for (const ordenId of ordenesIds) {
        OrdenFlowService.limpiarProgresoTemporal(ordenId)
      }

      toast({
        title: "Exportación completada",
        description: `Se ha exportado un archivo CSV con ${ordenes.length} órdenes y ${ordenes.reduce(
          (total, orden) => total + orden.lineas.length,
          0,
        )} líneas`,
      })

      // Redirigir al historial
      setTimeout(() => {
        router.push("/ordenes-de-compra/historial")
      }, 2000)
    } catch (error) {
      console.error("Error en exportación:", error)
      toast({
        title: "Error",
        description: "Error al completar la exportación",
        variant: "destructive",
      })
    }
  }

  const currentOrden = ordenes[currentOrdenIndex]
  const totalLineas = ordenes.reduce((total, orden) => total + orden.lineas.length, 0)

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            {/* Campo Cust ID con botón de buscar */}
            <div className="space-y-2">
              <Label htmlFor="custId" className="text-sm font-medium text-gray-700">
                Cust ID <span className="text-red-500">*</span>
              </Label>
              <div className="flex gap-2">
                <Input
                  id="custId"
                  value={custId}
                  onChange={(e) => handleCustIdChange(e.target.value)}
                  placeholder="Ingresa el Cust ID del cliente"
                  className="text-sm flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleBuscarCliente}
                  className="flex items-center bg-transparent"
                  disabled={!custId.trim()}
                >
                  <Search className="w-4 h-4 mr-1" />
                  Buscar
                </Button>
              </div>
              {clienteEncontrado && (
                <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-700">Cliente encontrado: {clienteEncontrado}</span>
                </div>
              )}
              <p className="text-xs text-gray-500">
                Este ID se utilizará para identificar automáticamente la información del cliente
              </p>
            </div>

            {selectedMode === "inteligente" ? (
              <>
                <div>
                  <h2 className="text-lg font-medium mb-2">Carga inteligente con IA</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-sm text-gray-600">
                      Sube tus archivos de órdenes de compra y nuestro sistema de IA extraerá automáticamente la
                      información.
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Múltiples archivos
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-medium text-amber-900 mb-1">Importante - Verificación requerida</h4>
                      <p className="text-xs text-amber-700">
                        La información extraída por IA puede contener errores o inexactitudes. Es fundamental que
                        revises y valides todos los datos extraídos antes de proceder con la orden de compra.
                      </p>
                    </div>
                  </div>
                </div>

                {archivos.length === 0 ? (
                  /* Drag and Drop Area */
                  <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <h3 className="text-sm font-medium text-gray-900 mb-1">Arrastra archivos aquí</h3>
                    <p className="text-xs text-gray-500">O haz clic para seleccionar archivos</p>
                  </div>
                ) : (
                  /* File List */
                  <div className="space-y-4">
                    <div className="flex flex-wrap gap-3">
                      {archivos.map((file, index) => (
                        <div
                          key={index}
                          className="relative border rounded-lg p-2 w-[120px] h-[140px] flex flex-col items-center"
                        >
                          <button
                            className="absolute top-1 right-1 p-1 rounded-full bg-white shadow-sm hover:bg-gray-100"
                            onClick={() => handleRemoveFile(index)}
                          >
                            <X className="h-3 w-3" />
                          </button>
                          <div className="h-[80px] w-[80px] flex items-center justify-center bg-gray-100 rounded mb-2">
                            {file.type.includes("image") && previews[index] ? (
                              <img
                                src={previews[index] || "/placeholder.svg"}
                                alt={file.name}
                                className="h-full w-full object-cover rounded"
                              />
                            ) : (
                              <FileText className="h-8 w-8 text-gray-400" />
                            )}
                          </div>
                          <p className="text-xs text-center font-medium truncate w-full">{file.name}</p>
                          <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      ))}
                      <div
                        className="border-2 border-dashed rounded-lg p-2 w-[120px] h-[140px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Upload className="h-8 w-8 text-gray-400 mb-2" />
                        <p className="text-xs text-center text-gray-500">Añadir más</p>
                      </div>
                    </div>

                    {isProcessing ? (
                      <div className="space-y-3">
                        <Progress value={progress} />
                        <p className="text-xs text-center text-gray-600">
                          Procesando archivos con IA ({Math.round(progress)}%)...
                        </p>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setArchivos([])
                            setPreviews([])
                          }}
                          className="flex items-center"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Limpiar todo
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleProcesarArchivos}
                          className="flex items-center"
                          disabled={!custId.trim()}
                        >
                          <FileUp className="w-3 h-3 mr-2" />
                          Procesar {archivos.length} {archivos.length === 1 ? "archivo" : "archivos"}
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                />

                {/* Supported Formats */}
                <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
                  <Info className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-gray-900 mb-1">Formatos soportados</h4>
                    <p className="text-xs text-gray-600">
                      PDF, imágenes (JPG, PNG), documentos de Word (DOC, DOCX) y hojas de cálculo (XLS, XLSX).
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <h2 className="text-lg font-medium mb-2">Carga manual</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <p className="text-sm text-gray-600">
                      Pega el texto de tu orden de compra y nuestro sistema de IA extraerá automáticamente la
                      información.
                    </p>
                    <Badge variant="outline" className="text-xs">
                      Procesamiento con IA
                    </Badge>
                  </div>
                  <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
                    <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-medium text-amber-900 mb-1">Importante - Verificación requerida</h4>
                      <p className="text-xs text-amber-700">
                        La información extraída por IA del texto puede contener errores o interpretaciones incorrectas.
                        Revisa cuidadosamente todos los campos extraídos y corrígelos según sea necesario.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="textoManual" className="text-sm font-medium text-gray-700">
                      Texto de la orden de compra
                    </Label>
                    <Textarea
                      id="textoManual"
                      value={textoManual}
                      onChange={(e) => setTextoManual(e.target.value)}
                      placeholder="Pega aquí el texto de tu orden de compra. Puede incluir información como:&#10;&#10;- Número de PO&#10;- Cliente/Empresa&#10;- Fecha de orden&#10;- Productos y cantidades&#10;- Precios&#10;- Dirección de envío&#10;&#10;Ejemplo:&#10;Purchase Order: PO-123456&#10;Cliente: Manitowoc FSG Manufactura&#10;Fecha: 19/03/2025&#10;&#10;Productos:&#10;- DISTRIBUTION TUBE ASSY 30 IN - Cantidad: 4050 - Precio: $5.24&#10;- DISTRIBUTION TUBE ASSY 22 IN - Cantidad: 2025 - Precio: $4.30"
                      className="min-h-[200px] text-sm"
                      rows={10}
                    />
                  </div>

                  {isProcessing ? (
                    <div className="space-y-3">
                      <Progress value={progress} />
                      <p className="text-xs text-center text-gray-600">
                        Procesando texto con IA ({Math.round(progress)}%)...
                      </p>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTextoManual("")}
                        className="flex items-center"
                        disabled={!textoManual.trim()}
                      >
                        <Trash2 className="w-3 h-3 mr-2" />
                        Limpiar texto
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleProcesarTexto}
                        className="flex items-center"
                        disabled={!textoManual.trim() || !custId.trim()}
                      >
                        <Brain className="w-3 h-3 mr-2" />
                        Procesar con IA
                      </Button>
                    </div>
                  )}
                </div>

                {/* AI Processing Info */}
                <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg">
                  <Brain className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-xs font-medium text-blue-900 mb-1">Procesamiento inteligente</h4>
                    <p className="text-xs text-blue-700">
                      Nuestro sistema de IA extraerá automáticamente información como números de PO, clientes, fechas,
                      productos, cantidades y precios. Podrás revisar y editar toda la información extraída.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        )

      case 2:
        if (!currentOrden) {
          return <div className="text-center py-12 text-gray-500 text-sm">No hay órdenes para validar</div>
        }

        return (
          <div className="space-y-6">
            {/* Header with navigation */}
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h2 className="text-lg font-medium">
                  Validando orden {currentOrdenIndex + 1} de {ordenes.length}
                </h2>
                {ordenes.length > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrevOrden}
                      disabled={currentOrdenIndex === 0}
                      className="flex items-center bg-transparent"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </Button>
                    <span className="text-xs text-gray-500 px-2">
                      {currentOrdenIndex + 1} / {ordenes.length}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextOrden}
                      disabled={currentOrdenIndex === ordenes.length - 1}
                      className="flex items-center bg-transparent"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
              <div className="text-right">
                <span className="text-sm text-gray-600">Cliente: {currentOrden.clienteNombre}</span>
                <br />
                <span className="text-xs text-gray-500">
                  {selectedMode === "manual" ? "Texto manual" : `Archivo: ${currentOrden.archivoOriginal}`}
                </span>
              </div>
            </div>

            {/* Blue progress bar */}
            <div className="w-full h-2 bg-blue-600 rounded"></div>

            {/* AI extraction notice for manual mode */}
            {selectedMode === "manual" && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
                <Brain className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-medium text-amber-900 mb-1">Información extraída por IA</h4>
                  <p className="text-xs text-amber-700">
                    Los siguientes campos han sido extraídos automáticamente del texto. Por favor, revisa y edita
                    cualquier información que necesite corrección.
                  </p>
                </div>
              </div>
            )}

            {/* Form fields in 2x3 grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="poNumber" className="text-sm font-medium text-gray-700">
                  Número de orden (PO)
                </Label>
                <Input
                  id="poNumber"
                  value={currentOrden.poNumber}
                  onChange={(e) => handleOrdenChange("poNumber", e.target.value)}
                  className="text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fechaOrden" className="text-sm font-medium text-gray-700">
                  Fecha de orden
                </Label>
                <div className="relative">
                  <Input
                    id="fechaOrden"
                    type="date"
                    value={currentOrden.fechaOrden}
                    onChange={(e) => handleOrdenChange("fechaOrden", e.target.value)}
                    className="text-sm pr-10"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="moneda" className="text-sm font-medium text-gray-700">
                  Moneda
                </Label>
                <Select value={currentOrden.moneda} onValueChange={(value) => handleOrdenChange("moneda", value)}>
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

              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="shipTo" className="text-sm font-medium text-gray-700">
                  Dirección de envío (Ship To)
                </Label>
                <Textarea
                  id="shipTo"
                  value={currentOrden.shipTo}
                  onChange={(e) => handleOrdenChange("shipTo", e.target.value)}
                  className="text-sm"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoOrden" className="text-sm font-medium text-gray-700">
                  Tipo de orden
                </Label>
                <Select value={currentOrden.tipoOrden} onValueChange={(value) => handleOrdenChange("tipoOrden", value)}>
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nacional">Nacional</SelectItem>
                    <SelectItem value="exportacion">Exportación</SelectItem>
                    <SelectItem value="express">Express</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lines table */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Líneas de la orden</h3>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentOrden.lineas.map((linea, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Input
                            value={linea.skuCliente}
                            onChange={(e) => handleLineaChange(index, "skuCliente", e.target.value)}
                            className="text-sm"
                            placeholder="SKU del cliente"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={linea.skuEvco}
                            onChange={(e) => handleLineaChange(index, "skuEvco", e.target.value)}
                            className="text-sm"
                            placeholder="SKU EVCO"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={linea.descripcion}
                            onChange={(e) => handleLineaChange(index, "descripcion", e.target.value)}
                            className="text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            value={linea.cantidad.toString()}
                            onChange={(e) => handleLineaChange(index, "cantidad", Number(e.target.value))}
                            className="text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.01"
                            value={linea.precio.toString()}
                            onChange={(e) => handleLineaChange(index, "precio", Number(e.target.value))}
                            className="text-sm"
                          />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={linea.unidad}
                            onValueChange={(value) => handleLineaChange(index, "unidad", value)}
                          >
                            <SelectTrigger className="text-sm">
                              <SelectValue placeholder="" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="EACH">EACH</SelectItem>
                              <SelectItem value="PCS">PCS</SelectItem>
                              <SelectItem value="KG">KG</SelectItem>
                              <SelectItem value="M">M</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Auto-save indicator */}
            {isSaving && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Guardando cambios automáticamente...
              </div>
            )}

            {/* Bottom buttons */}
            <div className="flex justify-between pt-4">
              <Button variant="outline" size="sm" onClick={handlePrevStep} className="flex items-center bg-transparent">
                <ArrowLeft className="w-3 h-3 mr-2" />
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={currentOrdenIndex === ordenes.length - 1 ? handleNextStep : handleNextOrden}
                className="flex items-center bg-blue-600 hover:bg-blue-700"
              >
                {currentOrdenIndex === ordenes.length - 1 ? "Confirmar órdenes" : "Continuar con siguiente orden"}
                <ArrowRight className="w-3 h-3 ml-2" />
              </Button>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-lg font-medium mb-2">Exportación unificada de órdenes</h2>
              <p className="text-sm text-gray-600">
                Se han validado {ordenes.length} órdenes de compra con un total de {totalLineas} líneas. Puedes
                exportarlas todas en un único archivo CSV para IT.
              </p>
            </div>

            {/* Summary table */}
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-sm">Cliente</TableHead>
                    <TableHead className="text-sm">PO Number</TableHead>
                    <TableHead className="text-sm">Fecha de orden</TableHead>
                    <TableHead className="text-sm">Moneda</TableHead>
                    <TableHead className="text-sm">Total líneas</TableHead>
                    <TableHead className="text-sm">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ordenes.map((orden, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-sm">{orden.clienteNombre}</TableCell>
                      <TableCell className="text-sm">{orden.poNumber}</TableCell>
                      <TableCell className="text-sm">{orden.fechaOrden}</TableCell>
                      <TableCell className="text-sm">{orden.moneda}</TableCell>
                      <TableCell className="text-sm">{orden.lineas.length}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          ✓ Validada
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={handlePrevStep} className="flex items-center bg-transparent">
                <ArrowLeft className="w-3 h-3 mr-2" />
                Volver
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex items-center bg-transparent">
                  Cargar nueva OC
                </Button>
                <Button
                  size="sm"
                  onClick={handleExportarUnificado}
                  className="flex items-center bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-3 h-3 mr-2" />
                  Exportar unificado
                </Button>
              </div>
            </div>

            {/* Preview section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Preview de exportación</h3>
                <Button variant="ghost" size="sm" className="text-xs">
                  Ocultar detalles
                </Button>
              </div>

              <div className="text-sm text-gray-600 mb-2">Formato de exportación CSV</div>

              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-700">
                    <div>Cliente</div>
                    <div>PO Number</div>
                    <div>Fecha Orden</div>
                    <div>SKU Cliente</div>
                    <div>SKU EVCO</div>
                    <div>Descripción</div>
                    <div>Cantidad</div>
                    <div>Precio</div>
                    <div>Moneda</div>
                    <div>Unidad</div>
                    <div>Ship To</div>
                    <div>Observaciones</div>
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {ordenes.flatMap((orden, ordenIndex) =>
                    orden.lineas.map((linea, lineaIndex) => (
                      <div
                        key={`${ordenIndex}-${lineaIndex}`}
                        className="grid grid-cols-12 gap-2 px-4 py-2 text-xs border-b border-gray-100"
                      >
                        <div>{orden.clienteNombre}</div>
                        <div>{orden.poNumber}</div>
                        <div>{orden.fechaOrden}</div>
                        <div>{linea.skuCliente}</div>
                        <div>{linea.skuEvco}</div>
                        <div className="truncate">{linea.descripcion}</div>
                        <div>{linea.cantidad}</div>
                        <div>{linea.precio.toFixed(2)}</div>
                        <div>{orden.moneda}</div>
                        <div>{linea.unidad}</div>
                        <div className="truncate">{orden.shipTo}</div>
                        <div></div>
                      </div>
                    )),
                  )}
                </div>
              </div>
            </div>

            {/* Export info */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Información de exportación</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Total de órdenes: {ordenes.length}</li>
                <li>• Total de líneas: {totalLineas}</li>
                <li>• Clientes: {new Set(ordenes.map((o) => o.clienteNombre)).size} diferentes</li>
                <li>• Monedas: {new Set(ordenes.map((o) => o.moneda)).size} diferentes</li>
                <li>• Formato: CSV (compatible con Excel)</li>
                <li>• Codificación: UTF-8</li>
              </ul>
            </div>
          </div>
        )

      default:
        return <div className="text-center py-12 text-gray-500 text-sm">Paso {currentStep} - En desarrollo</div>
    }
  }

  return (
    <div className="space-y-6">
      {/* Step Navigation */}
      <div className="flex items-center justify-center mb-6 space-x-12">
        {steps.map((step, index) => (
          <div key={step.number} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-medium ${
                  step.number === currentStep
                    ? "bg-blue-600 border-blue-600 text-white"
                    : step.number < currentStep
                      ? "bg-green-600 border-green-600 text-white"
                      : "border-gray-300 text-gray-400"
                }`}
              >
                {step.number < currentStep ? <Check className="w-4 h-4" /> : step.number}
              </div>
              <span
                className={`mt-1 text-xs font-medium ${
                  step.number === currentStep
                    ? "text-blue-600"
                    : step.number < currentStep
                      ? "text-green-600"
                      : "text-gray-500"
                }`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`w-16 h-0.5 mx-4 mt-[-16px] ${step.number < currentStep ? "bg-green-600" : "bg-gray-300"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Mode Selection - Solo mostrar en el primer paso */}
      {currentStep === 1 && (
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedMode === "inteligente" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedMode("inteligente")}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Brain className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium">Carga inteligente con IA</h3>
            </div>
            <p className="text-xs text-gray-600 text-center">Sube archivos PDF, imágenes o documentos</p>
          </div>

          <div
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedMode === "manual" ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => setSelectedMode("manual")}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Type className="w-4 h-4 text-green-600" />
              <h3 className="text-sm font-medium">Carga manual</h3>
            </div>
            <p className="text-xs text-gray-600 text-center">Pega texto y procesa con IA</p>
          </div>
        </div>
      )}

      {/* Content Area */}
      {renderStepContent()}
    </div>
  )
}
