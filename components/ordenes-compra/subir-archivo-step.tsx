"use client"

import type React from "react"
import { useState, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  FileUp,
  Info,
  X,
  FileText,
  Trash2,
  Check,
  Brain,
  Type,
  AlertCircle,
  Search,
  Eye,
  ArrowRight,
  ArrowLeft,
  Plus,
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { getClientesDatabase, buscarClientePorCustId } from "@/data/clientes-database"
import { useRouter } from "next/navigation"
import { createOpenAIProcessor } from "@/lib/services/openai-processor"

interface LineaOrden {
  skuCliente: string
  skuEvco: string
  descripcion: string
  cantidad: number
  precio: number
  unidad: string
  fechaRequerimiento?: string
}

interface TextoData {
  texto: string
  custId: string
  clienteEncontrado: string
}

interface ArchivoData {
  file: File
  preview: string
  custId: string
  clienteEncontrado: string
}

// Función para extraer texto real de archivos PDF usando nuestro API route
const extractTextFromFile = async (file: File): Promise<string> => {
  const fileType = file.type.toLowerCase()
  const fileName = file.name.toLowerCase()

  if (fileType === "application/pdf" || fileName.endsWith(".pdf")) {
    try {
      console.log("Procesando archivo PDF:", file.name, "Tamaño:", file.size)

      // Usar nuestro API route como proxy
      const formData = new FormData()
      formData.append("file", file)

      console.log("Enviando request a nuestro API route...")

      const response = await fetch("/api/extract-pdf", {
        method: "POST",
        body: formData,
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("API route error:", errorData)
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      console.log("Response result:", result)

      if (!result.success || !result.text) {
        throw new Error("No text extracted from PDF")
      }

      console.log("Texto extraído exitosamente, longitud:", result.text.length)
      return result.text
    } catch (error) {
      console.error("Error completo extrayendo texto del PDF:", error)

      // Mejor manejo de errores específicos
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          `Error de conexión: No se pudo conectar al servicio de extracción de PDF. Verifica tu conexión a internet.`,
        )
      }

      throw new Error(`Error procesando PDF: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  } else {
    throw new Error(`Tipo de archivo no soportado: ${fileType}. Solo se admiten archivos PDF.`)
  }
}

export function SubirArchivoStep() {
  const [selectedMode, setSelectedMode] = useState<"inteligente" | "manual">("manual")
  const [archivosData, setArchivosData] = useState<ArchivoData[]>([])
  const [textosData, setTextosData] = useState<TextoData[]>([{ texto: "", custId: "", clienteEncontrado: "" }])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [showPreview, setShowPreview] = useState(false)
  const [processedOrders, setProcessedOrders] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Estados para búsqueda individual por texto
  const [searchTermsTextos, setSearchTermsTextos] = useState<string[]>([""])
  const [filteredClientesTextos, setFilteredClientesTextos] = useState<Array<Array<{ custId: string; name: string }>>>([
    [],
  ])
  const [showSuggestionsTextos, setShowSuggestionsTextos] = useState<boolean[]>([false])
  const [selectedClientesTextos, setSelectedClientesTextos] = useState<Array<{ custId: string; name: string } | null>>([
    null,
  ])

  // Estados para búsqueda individual por archivo
  const [searchTermsArchivos, setSearchTermsArchivos] = useState<string[]>([])
  const [filteredClientesArchivos, setFilteredClientesArchivos] = useState<
    Array<Array<{ custId: string; name: string }>>
  >([])
  const [showSuggestionsArchivos, setShowSuggestionsArchivos] = useState<boolean[]>([])
  const [selectedClientesArchivos, setSelectedClientesArchivos] = useState<
    Array<{ custId: string; name: string } | null>
  >([])

  // Usar el procesador de OpenAI actualizado (sin API key en cliente)
  const processWithOpenAI = async (text: string, source: string, customerId: string): Promise<any> => {
    try {
      const processor = createOpenAIProcessor()
      const result = await processor.processOrdenCompra({
        userText: text,
        customerId: customerId,
      })

      if (!result.success) {
        throw new Error(result.warnings?.join(", ") || "Error en el procesamiento")
      }

      const { orderInfo, lineItems } = result.extractedData

      // Buscar el cliente para este customerId específico
      const nombreCliente = await buscarClientePorCustId(customerId)

      // Construir el objeto orden con solo los campos específicos extraídos por IA
      // y agregar los campos faltantes de otras fuentes - forzar null en lugar de ""
      return {
        id: `orden-ia-${Date.now()}`,
        numeroOrden: orderInfo.poNumber || null,
        direccionEnvio: orderInfo.shipTo || null,
        fechaOrden: orderInfo.orderDate || null,
        fechaRequerimiento: orderInfo.requiredDate || null,
        poTotal: orderInfo.poTotal || null, // CAMPO AGREGADO: Total extraído por IA
        moneda: "USD", // Campo fijo
        custId: customerId, // Guardar el ID numérico del primer formulario
        nombreCliente: nombreCliente || `Cliente ${customerId}`, // Guardar el nombre por separado
        archivoOriginal: source,
        lineas: lineItems.map((item: any) => ({
          // PASO A: Tomar solo la parte antes del primer espacio del SKU extraído por IA
          skuCliente: item.customerSku ? String(item.customerSku).split(" ")[0].trim() : null,
          skuEvco: null, // Se llenará posteriormente
          descripcion: item.description || null,
          cantidad: Number(item.quantity) || 0,
          precio: Number(item.price) || 0,
          unidad: item.unit || "EACH",
          fechaRequerimiento: item.requestedDate || orderInfo.requiredDate || null, // CAMPO AGREGADO: Fecha de línea o fecha de orden
        })),
      }
    } catch (error) {
      console.error("Error procesando con OpenAI:", error)
      throw new Error(`Error de OpenAI: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  // Funciones para manejo de múltiples textos con CustID individual
  const handleAgregarTexto = () => {
    setTextosData((prev) => [...prev, { texto: "", custId: "", clienteEncontrado: "" }])
    setSearchTermsTextos((prev) => [...prev, ""])
    setFilteredClientesTextos((prev) => [...prev, []])
    setShowSuggestionsTextos((prev) => [...prev, false])
    setSelectedClientesTextos((prev) => [...prev, null])
  }

  const handleEliminarTexto = (index: number) => {
    if (textosData.length > 1) {
      setTextosData((prev) => prev.filter((_, i) => i !== index))
      setSearchTermsTextos((prev) => prev.filter((_, i) => i !== index))
      setFilteredClientesTextos((prev) => prev.filter((_, i) => i !== index))
      setShowSuggestionsTextos((prev) => prev.filter((_, i) => i !== index))
      setSelectedClientesTextos((prev) => prev.filter((_, i) => i !== index))
    }
  }

  const handleTextoChange = (index: number, value: string) => {
    setTextosData((prev) => prev.map((item, i) => (i === index ? { ...item, texto: value } : item)))
  }

  const handleCustIdTextoChange = async (index: number, value: string) => {
    // Actualizar el custId en textosData
    setTextosData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, custId: value, clienteEncontrado: "" } : item)),
    )

    // Actualizar el searchTerm para este índice
    setSearchTermsTextos((prev) => prev.map((term, i) => (i === index ? value : term)))

    // Limpiar cliente seleccionado
    setSelectedClientesTextos((prev) => prev.map((cliente, i) => (i === index ? null : cliente)))

    if (value.trim().length > 0) {
      try {
        const clientesDb = await getClientesDatabase()
        const filtered = clientesDb
          .filter((cliente) => {
            const custIdMatch = cliente.custId && String(cliente.custId).toLowerCase().includes(value.toLowerCase())
            const nameMatch = cliente.name && String(cliente.name).toLowerCase().includes(value.toLowerCase())
            return custIdMatch || nameMatch
          })
          .slice(0, 10)

        setFilteredClientesTextos((prev) => {
          const newArray = [...prev]
          while (newArray.length <= index) {
            newArray.push([])
          }
          newArray[index] = filtered
          return newArray
        })

        setShowSuggestionsTextos((prev) => prev.map((show, i) => (i === index ? true : show)))
      } catch (error) {
        console.error("Error buscando clientes:", error)
        setFilteredClientesTextos((prev) => {
          const newArray = [...prev]
          while (newArray.length <= index) {
            newArray.push([])
          }
          newArray[index] = []
          return newArray
        })
        setShowSuggestionsTextos((prev) => prev.map((show, i) => (i === index ? false : show)))
      }
    } else {
      setFilteredClientesTextos((prev) => {
        const newArray = [...prev]
        while (newArray.length <= index) {
          newArray.push([])
        }
        newArray[index] = []
        return newArray
      })
      setShowSuggestionsTextos((prev) => prev.map((show, i) => (i === index ? false : show)))
    }
  }

  const handleSelectClienteTexto = (index: number, cliente: { custId: string; name: string }) => {
    setSelectedClientesTextos((prev) => prev.map((c, i) => (i === index ? cliente : c)))
    setTextosData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, custId: String(cliente.custId), clienteEncontrado: String(cliente.name) } : item,
      ),
    )
    setSearchTermsTextos((prev) => prev.map((term, i) => (i === index ? `${cliente.custId} - ${cliente.name}` : term)))
    setShowSuggestionsTextos((prev) => prev.map((show, i) => (i === index ? false : show)))
    setFilteredClientesTextos((prev) => prev.map((list, i) => (i === index ? [] : list)))
  }

  const handleBuscarClienteTexto = async (index: number) => {
    const custIdTexto = textosData[index]?.custId
    if (!custIdTexto || !custIdTexto.trim()) {
      toast({
        title: "Cust ID requerido",
        description: `Por favor, ingresa un Cust ID para el texto ${index + 1}`,
        variant: "destructive",
      })
      return
    }
    try {
      const nombreCliente = await buscarClientePorCustId(custIdTexto)
      setTextosData((prev) =>
        prev.map((item, i) => (i === index ? { ...item, clienteEncontrado: nombreCliente || "" } : item)),
      )

      if (!nombreCliente) {
        toast({
          title: "Cliente no encontrado",
          description: `No se encontró un cliente con Cust ID: ${custIdTexto} para el texto ${index + 1}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Cliente encontrado",
          description: `Texto ${index + 1} - Cliente: ${nombreCliente}`,
        })
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

  const handleLimpiarTodosTextos = () => {
    setTextosData([{ texto: "", custId: "", clienteEncontrado: "" }])
    setSearchTermsTextos([""])
    setFilteredClientesTextos([[]])
    setShowSuggestionsTextos([false])
    setSelectedClientesTextos([null])
  }

  // Funciones para manejo de archivos con CustID individual
  const handleCustIdArchivoChange = async (index: number, value: string) => {
    // Actualizar el custId en archivosData
    setArchivosData((prev) =>
      prev.map((item, i) => (i === index ? { ...item, custId: value, clienteEncontrado: "" } : item)),
    )

    // Actualizar el searchTerm para este índice
    setSearchTermsArchivos((prev) => prev.map((term, i) => (i === index ? value : term)))

    // Limpiar cliente seleccionado
    setSelectedClientesArchivos((prev) => prev.map((cliente, i) => (i === index ? null : cliente)))

    if (value.trim().length > 0) {
      try {
        const clientesDb = await getClientesDatabase()
        const filtered = clientesDb
          .filter((cliente) => {
            const custIdMatch = cliente.custId && String(cliente.custId).toLowerCase().includes(value.toLowerCase())
            const nameMatch = cliente.name && String(cliente.name).toLowerCase().includes(value.toLowerCase())
            return custIdMatch || nameMatch
          })
          .slice(0, 10)

        setFilteredClientesArchivos((prev) => {
          const newArray = [...prev]
          while (newArray.length <= index) {
            newArray.push([])
          }
          newArray[index] = filtered
          return newArray
        })

        setShowSuggestionsArchivos((prev) => prev.map((show, i) => (i === index ? true : show)))
      } catch (error) {
        console.error("Error buscando clientes:", error)
        setFilteredClientesArchivos((prev) => {
          const newArray = [...prev]
          while (newArray.length <= index) {
            newArray.push([])
          }
          newArray[index] = []
          return newArray
        })
        setShowSuggestionsArchivos((prev) => prev.map((show, i) => (i === index ? false : show)))
      }
    } else {
      setFilteredClientesArchivos((prev) => {
        const newArray = [...prev]
        while (newArray.length <= index) {
          newArray.push([])
        }
        newArray[index] = []
        return newArray
      })
      setShowSuggestionsArchivos((prev) => prev.map((show, i) => (i === index ? false : show)))
    }
  }

  const handleSelectClienteArchivo = (index: number, cliente: { custId: string; name: string }) => {
    setSelectedClientesArchivos((prev) => prev.map((c, i) => (i === index ? cliente : c)))
    setArchivosData((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, custId: String(cliente.custId), clienteEncontrado: String(cliente.name) } : item,
      ),
    )
    setSearchTermsArchivos((prev) =>
      prev.map((term, i) => (i === index ? `${cliente.custId} - ${cliente.name}` : term)),
    )
    setShowSuggestionsArchivos((prev) => prev.map((show, i) => (i === index ? false : show)))
    setFilteredClientesArchivos((prev) => prev.map((list, i) => (i === index ? [] : list)))
  }

  const handleBuscarClienteArchivo = async (index: number) => {
    const custIdArchivo = archivosData[index]?.custId
    if (!custIdArchivo || !custIdArchivo.trim()) {
      toast({
        title: "Cust ID requerido",
        description: `Por favor, ingresa un Cust ID para el archivo ${index + 1}`,
        variant: "destructive",
      })
      return
    }
    try {
      const nombreCliente = await buscarClientePorCustId(custIdArchivo)
      setArchivosData((prev) =>
        prev.map((item, i) => (i === index ? { ...item, clienteEncontrado: nombreCliente || "" } : item)),
      )

      if (!nombreCliente) {
        toast({
          title: "Cliente no encontrado",
          description: `No se encontró un cliente con Cust ID: ${custIdArchivo} para el archivo ${index + 1}`,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Cliente encontrado",
          description: `Archivo ${index + 1} - Cliente: ${nombreCliente}`,
        })
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

      newFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          if (ev.target?.result) {
            const newArchivoData: ArchivoData = {
              file: file,
              preview: ev.target.result as string,
              custId: "",
              clienteEncontrado: "",
            }

            setArchivosData((prev) => [...prev, newArchivoData])

            // Agregar estados para búsqueda de este archivo
            setSearchTermsArchivos((prev) => [...prev, ""])
            setFilteredClientesArchivos((prev) => [...prev, []])
            setShowSuggestionsArchivos((prev) => [...prev, false])
            setSelectedClientesArchivos((prev) => [...prev, null])
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

  const handleDragDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    if (files.length) {
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (ev) => {
          if (ev.target?.result) {
            const newArchivoData: ArchivoData = {
              file: file,
              preview: ev.target.result as string,
              custId: "",
              clienteEncontrado: "",
            }

            setArchivosData((prev) => [...prev, newArchivoData])

            // Agregar estados para búsqueda de este archivo
            setSearchTermsArchivos((prev) => [...prev, ""])
            setFilteredClientesArchivos((prev) => [...prev, []])
            setShowSuggestionsArchivos((prev) => [...prev, false])
            setSelectedClientesArchivos((prev) => [...prev, null])
          }
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleRemoveFile = (index: number) => {
    setArchivosData((prev) => prev.filter((_, i) => i !== index))
    setSearchTermsArchivos((prev) => prev.filter((_, i) => i !== index))
    setFilteredClientesArchivos((prev) => prev.filter((_, i) => i !== index))
    setShowSuggestionsArchivos((prev) => prev.filter((_, i) => i !== index))
    setSelectedClientesArchivos((prev) => prev.filter((_, i) => i !== index))
  }

  const handleProcesarArchivos = async () => {
    if (!archivosData.length) {
      toast({
        title: "No hay archivos",
        description: "Selecciona al menos un archivo PDF.",
        variant: "destructive",
      })
      return
    }

    // Verificar que todos los archivos sean PDFs
    const archivoNoValido = archivosData.find(
      (archivoData) =>
        !archivoData.file.type.toLowerCase().includes("pdf") && !archivoData.file.name.toLowerCase().endsWith(".pdf"),
    )

    if (archivoNoValido) {
      toast({
        title: "Archivo no válido",
        description: `El archivo "${archivoNoValido.file.name}" no es un PDF. Solo se admiten archivos PDF.`,
        variant: "destructive",
      })
      return
    }

    // Verificar que todos los archivos tengan cliente verificado
    const archivosSinCliente = archivosData.filter((archivoData) => !archivoData.clienteEncontrado)

    if (archivosSinCliente.length > 0) {
      toast({
        title: "Clientes faltantes",
        description: `${archivosSinCliente.length} archivo(s) necesitan verificación de cliente.`,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const nuevas: any[] = []
      for (let i = 0; i < archivosData.length; i++) {
        setProgress(((i + 0.5) / archivosData.length) * 100)

        // Extraer texto del archivo usando nuestro API route
        const text = await extractTextFromFile(archivosData[i].file)

        // Procesar con OpenAI usando el custId específico de cada archivo
        const orden = await processWithOpenAI(text, archivosData[i].file.name, archivosData[i].custId)
        nuevas.push(orden)

        setProgress(((i + 1) / archivosData.length) * 100)
      }

      setProcessedOrders(nuevas)
      setShowPreview(true)
      toast({
        title: "Procesamiento completado",
        description: `Se procesaron ${nuevas.length} archivos con OpenAI.`,
      })
    } catch (err: any) {
      console.error("Error procesando archivos:", err)
      toast({
        title: "Error de procesamiento",
        description: err.message || "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // Nueva función para procesar múltiples textos con CustID individual
  const handleProcesarTodosTextos = async () => {
    const textosValidos = textosData.filter((item) => item.texto.trim() && item.custId.trim() && item.clienteEncontrado)

    if (!textosValidos.length) {
      toast({
        title: "No hay textos válidos",
        description: "Cada texto debe tener contenido y un cliente verificado.",
        variant: "destructive",
      })
      return
    }

    // Verificar que todos los textos con contenido tengan cliente verificado
    const textosConContenido = textosData.filter((item) => item.texto.trim())
    const textosSinCliente = textosConContenido.filter((item) => !item.clienteEncontrado)

    if (textosSinCliente.length > 0) {
      toast({
        title: "Clientes faltantes",
        description: `${textosSinCliente.length} texto(s) necesitan verificación de cliente.`,
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProgress(0)

    try {
      const nuevas: any[] = []
      for (let i = 0; i < textosValidos.length; i++) {
        setProgress(((i + 0.5) / textosValidos.length) * 100)

        // Procesar con OpenAI usando el custId específico de cada texto
        const orden = await processWithOpenAI(textosValidos[i].texto, `Texto ${i + 1}`, textosValidos[i].custId)
        nuevas.push(orden)

        setProgress(((i + 1) / textosValidos.length) * 100)
      }

      setProcessedOrders(nuevas)
      setShowPreview(true)
      toast({
        title: "Procesamiento completado",
        description: `Se procesaron ${nuevas.length} textos con OpenAI.`,
      })
    } catch (err: any) {
      console.error("Error procesando textos:", err)
      toast({
        title: "Error de procesamiento",
        description: err.message || "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleContinuar = () => {
    localStorage.setItem("ordenes-procesadas", JSON.stringify(processedOrders))
    localStorage.setItem("orden-progress-main", "1")
    router.push("/ordenes-de-compra/formulario-global")
  }

  const handleVolverAtras = () => {
    setShowPreview(false)
    setProcessedOrders([])
  }

  // Vista previa de resultados
  if (showPreview) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <Eye className="h-5 w-5 text-blue-600" />
          <h2 className="text-lg font-medium">Vista previa de datos extraídos por OpenAI</h2>
          <Badge variant="outline" className="text-xs">
            {processedOrders.length} {processedOrders.length === 1 ? "orden" : "órdenes"} procesada(s)
          </Badge>
        </div>

        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
          <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-xs font-medium text-blue-900 mb-1">Revisa los datos extraídos</h4>
            <p className="text-xs text-blue-700">
              A continuación se muestran los datos extraídos por OpenAI en formato JSON. Revisa la información antes de
              continuar al siguiente paso.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {processedOrders.map((orden, index) => (
            <div key={orden.id} className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-sm">
                  Orden {index + 1}: {orden.numeroOrden || "Sin número"}
                </h3>
                <Badge variant="secondary" className="text-xs">
                  {orden.archivoOriginal}
                </Badge>
              </div>

              <div className="bg-white rounded border p-3">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap text-gray-800">
                  {JSON.stringify(orden, null, 2)}
                </pre>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={handleVolverAtras} className="flex items-center gap-2 bg-transparent">
            <ArrowLeft className="w-4 h-4" />
            Volver atrás
          </Button>

          <Button onClick={handleContinuar} className="flex items-center gap-2">
            Continuar al siguiente paso
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div className="grid grid-cols-2 gap-4 mb-6">
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
          <p className="text-xs text-gray-600 text-center">Sube archivos PDF</p>
        </div>
      </div>

      {selectedMode === "manual" ? (
        <>
          <div>
            <h2 className="text-lg font-medium mb-2">Carga manual</h2>
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <div>
                <h4 className="text-xs font-medium text-amber-900 mb-1">Verificación requerida</h4>
                <p className="text-xs text-amber-700">
                  Recuerda que la IA no es perfecta, puede cometer errores, revisa cuidadosamente antes de proceder.
                  Revisa y ajusta los datos extraídos. Cada texto puede pertenecer a un cliente diferente. Cada
                  procesamiento con IA genera un costo, utilízalo cuidadosamente.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Contador de textos */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {textosData.filter((t) => t.texto.trim()).length} de {textosData.length} textos con contenido
                </Badge>
                <Badge variant="outline" className="text-xs">
                  {textosData.filter((t) => t.clienteEncontrado).length} clientes verificados
                </Badge>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAgregarTexto}
                className="flex items-center gap-2 bg-transparent"
              >
                <Plus className="w-3 h-3" />
                Agregar texto
              </Button>
            </div>

            {/* Lista de textareas con CustID individual */}
            <div className="space-y-4">
              {textosData.map((textoData, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <Label className="text-sm font-medium text-gray-700">Texto {index + 1}</Label>
                    {textosData.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEliminarTexto(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    )}
                  </div>

                  {/* Campo Cust ID individual */}
                  <div className="space-y-2 relative mb-3">
                    <Label className="text-xs font-medium text-gray-600">
                      Cust ID / Cliente <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={searchTermsTextos[index] || ""}
                          onChange={(e) => handleCustIdTextoChange(index, e.target.value)}
                          placeholder="Busca por Cust ID o nombre..."
                          className="text-sm"
                          onFocus={() => {
                            if (filteredClientesTextos[index]?.length > 0) {
                              setShowSuggestionsTextos((prev) => prev.map((show, i) => (i === index ? true : show)))
                            }
                          }}
                          onBlur={() => {
                            setTimeout(() => {
                              setShowSuggestionsTextos((prev) => prev.map((show, i) => (i === index ? false : show)))
                            }, 200)
                          }}
                        />

                        {/* Sugerencias dropdown individual */}
                        {showSuggestionsTextos[index] && filteredClientesTextos[index]?.length > 0 && (
                          <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                            {filteredClientesTextos[index].map((cliente) => (
                              <div
                                key={`${cliente.custId}-${cliente.name}`}
                                className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                onClick={() => handleSelectClienteTexto(index, cliente)}
                              >
                                <div>
                                  <span className="font-medium text-sm text-blue-600">{cliente.custId}</span>
                                  <p className="text-xs text-gray-600 truncate">{cliente.name}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleBuscarClienteTexto(index)}
                        className="flex items-center bg-transparent"
                        disabled={!textosData[index]?.custId?.trim()}
                      >
                        <Search className="w-4 h-4 mr-1" />
                        Verificar
                      </Button>
                    </div>

                    {selectedClientesTextos[index] && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                        <Check className="h-3 w-3 text-green-600" />
                        <div className="flex-1">
                          <span className="text-xs font-medium text-green-700">Cliente seleccionado:</span>
                          <p className="text-xs text-green-600">
                            {selectedClientesTextos[index]!.custId} - {selectedClientesTextos[index]!.name}
                          </p>
                        </div>
                      </div>
                    )}

                    {textoData.clienteEncontrado && !selectedClientesTextos[index] && (
                      <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-700">Cliente: {textoData.clienteEncontrado}</span>
                      </div>
                    )}
                  </div>

                  {/* Textarea del contenido */}
                  <div className="space-y-2">
                    <Label className="text-xs font-medium text-gray-600">Contenido de la orden</Label>
                    <Textarea
                      value={textoData.texto}
                      onChange={(e) => handleTextoChange(index, e.target.value)}
                      placeholder={`Pega aquí el texto de la orden de compra ${index + 1}...`}
                      className="min-h-[120px] text-sm"
                      rows={5}
                    />
                  </div>
                </div>
              ))}
            </div>

            {isProcessing ? (
              <div className="space-y-3">
                <Progress value={progress} />
                <p className="text-xs text-center text-gray-600">
                  Procesando textos con IA ({Math.round(progress)}%)...
                </p>
              </div>
            ) : (
              <div className="flex justify-between items-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLimpiarTodosTextos}
                  className="flex items-center bg-transparent"
                  disabled={textosData.every((t) => !t.texto.trim())}
                >
                  <Trash2 className="w-3 h-3 mr-2" />
                  Limpiar todos
                </Button>
                <Button
                  size="sm"
                  onClick={handleProcesarTodosTextos}
                  className="flex items-center"
                  disabled={!textosData.some((t) => t.texto.trim() && t.clienteEncontrado)}
                >
                  <Brain className="w-3 h-3 mr-2" />
                  Procesar {textosData.filter((t) => t.texto.trim() && t.clienteEncontrado).length}{" "}
                  {textosData.filter((t) => t.texto.trim() && t.clienteEncontrado).length === 1 ? "texto" : "textos"}
                </Button>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Modo inteligente */
        <>
          <div>
            <h2 className="text-lg font-medium mb-2">Carga inteligente con IA</h2>
            <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-200 mb-4">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <div>
                <h4 className="text-xs font-medium text-amber-900 mb-1">Verificación requerida</h4>
                <p className="text-xs text-amber-700">
                  La IA puede cometer errores. Revisa y ajusta los datos extraídos. Cada archivo puede pertenecer a un
                  cliente diferente.
                </p>
              </div>
            </div>
          </div>

          {archivosData.length === 0 ? (
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50"
              onDragOver={handleDragOver}
              onDrop={handleDragDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-sm font-medium text-gray-900 mb-1">Arrastra archivos PDF aquí</h3>
              <p className="text-xs text-gray-500">O haz clic para seleccionar archivos PDF</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Contador de archivos */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {archivosData.length} {archivosData.length === 1 ? "archivo" : "archivos"} cargado(s)
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {archivosData.filter((a) => a.clienteEncontrado).length} clientes verificados
                  </Badge>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 bg-transparent"
                >
                  <Plus className="w-3 h-3" />
                  Agregar archivos
                </Button>
              </div>

              {/* Lista de archivos con CustID individual */}
              <div className="space-y-4">
                {archivosData.map((archivoData, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center bg-gray-100 rounded">
                          {archivoData.file.type.includes("image") ? (
                            <img
                              src={archivoData.preview || "/placeholder.svg"}
                              alt={archivoData.file.name}
                              className="h-full w-full object-cover rounded"
                            />
                          ) : (
                            <FileText className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-gray-700">{archivoData.file.name}</Label>
                          <p className="text-xs text-gray-500">{(archivoData.file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>

                    {/* Campo Cust ID individual para archivo */}
                    <div className="space-y-2 relative">
                      <Label className="text-xs font-medium text-gray-600">
                        Cust ID / Cliente <span className="text-red-500">*</span>
                      </Label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Input
                            value={searchTermsArchivos[index] || ""}
                            onChange={(e) => handleCustIdArchivoChange(index, e.target.value)}
                            placeholder="Busca por Cust ID o nombre..."
                            className="text-sm"
                            onFocus={() => {
                              if (filteredClientesArchivos[index]?.length > 0) {
                                setShowSuggestionsArchivos((prev) => prev.map((show, i) => (i === index ? true : show)))
                              }
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setShowSuggestionsArchivos((prev) =>
                                  prev.map((show, i) => (i === index ? false : show)),
                                )
                              }, 200)
                            }}
                          />

                          {/* Sugerencias dropdown individual para archivo */}
                          {showSuggestionsArchivos[index] && filteredClientesArchivos[index]?.length > 0 && (
                            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                              {filteredClientesArchivos[index].map((cliente) => (
                                <div
                                  key={`${cliente.custId}-${cliente.name}`}
                                  className="px-3 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                  onClick={() => handleSelectClienteArchivo(index, cliente)}
                                >
                                  <div>
                                    <span className="font-medium text-sm text-blue-600">{cliente.custId}</span>
                                    <p className="text-xs text-gray-600 truncate">{cliente.name}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleBuscarClienteArchivo(index)}
                          className="flex items-center bg-transparent"
                          disabled={!archivosData[index]?.custId?.trim()}
                        >
                          <Search className="w-4 h-4 mr-1" />
                          Verificar
                        </Button>
                      </div>

                      {selectedClientesArchivos[index] && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <Check className="h-3 w-3 text-green-600" />
                          <div className="flex-1">
                            <span className="text-xs font-medium text-green-700">Cliente seleccionado:</span>
                            <p className="text-xs text-green-600">
                              {selectedClientesArchivos[index]!.custId} - {selectedClientesArchivos[index]!.name}
                            </p>
                          </div>
                        </div>
                      )}

                      {archivoData.clienteEncontrado && !selectedClientesArchivos[index] && (
                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-lg border border-green-200">
                          <Check className="h-3 w-3 text-green-600" />
                          <span className="text-xs text-green-700">Cliente: {archivoData.clienteEncontrado}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {isProcessing ? (
                <div className="space-y-3">
                  <Progress value={progress} />
                  <p className="text-xs text-center text-gray-600">
                    Procesando archivos con OpenAI ({Math.round(progress)}%)...
                  </p>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setArchivosData([])
                      setSearchTermsArchivos([])
                      setFilteredClientesArchivos([])
                      setShowSuggestionsArchivos([])
                      setSelectedClientesArchivos([])
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-2" />
                    Limpiar todo
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleProcesarArchivos}
                    disabled={archivosData.length === 0 || !archivosData.some((a) => a.clienteEncontrado)}
                  >
                    <FileUp className="w-3 h-3 mr-2" />
                    Procesar {archivosData.filter((a) => a.clienteEncontrado).length}{" "}
                    {archivosData.filter((a) => a.clienteEncontrado).length === 1 ? "archivo" : "archivos"}
                  </Button>
                </div>
              )}
            </div>
          )}

          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple accept=".pdf" />

          <div className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <Info className="h-4 w-4 text-gray-600 mt-0.5" />
            <div>
              <h4 className="text-xs font-medium text-gray-900 mb-1">Formatos soportados</h4>
              <p className="text-xs text-gray-600">Solo archivos PDF.</p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// Exportar como default export
export default SubirArchivoStep
