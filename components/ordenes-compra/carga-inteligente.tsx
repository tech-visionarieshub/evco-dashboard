"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useToast } from "@/components/ui/use-toast"
import { FileUp, X, FileText, Trash2, Upload, AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { procesarOrdenCompraConIA } from "./ia-processor"
import type { OrdenCompra } from "@/lib/types/orden-compra"
import { generarIdUnico } from "@/lib/utils"

interface CargaInteligenteProps {
  onExtraccionCompleta: (ordenes: OrdenCompra[]) => void
}

export function CargaInteligente({ onExtraccionCompleta }: CargaInteligenteProps) {
  const [archivos, setArchivos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

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
    }
  }

  const handleRemoveFile = (index: number) => {
    setArchivos((prevArchivos) => prevArchivos.filter((_, i) => i !== index))
    setPreviews((prevPreviews) => prevPreviews.filter((_, i) => i !== index))
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

    setIsProcessing(true)
    setProgress(0)

    try {
      const ordenesExtraidas: OrdenCompra[] = []

      // Procesar cada archivo secuencialmente
      for (let i = 0; i < archivos.length; i++) {
        const file = archivos[i]

        // Actualizar progreso
        setProgress(((i + 0.2) / archivos.length) * 100)

        // Simular procesamiento con IA
        await new Promise((resolve) => setTimeout(resolve, 1000))

        // Generar un ID único para la orden
        const ordenId = generarIdUnico()

        // Procesar el archivo con IA (simulado)
        const { orden, lineas } = await procesarOrdenCompraConIA(file, ordenId)

        // Actualizar progreso
        setProgress(((i + 0.8) / archivos.length) * 100)

        // Guardar la orden extraída
        ordenesExtraidas.push({
          ...orden,
          lineas: lineas,
        })

        // Guardar en localStorage
        localStorage.setItem(
          `orden-${ordenId}`,
          JSON.stringify({
            ...orden,
            lineas: lineas,
          }),
        )

        // Guardar el progreso (paso 2 completado)
        localStorage.setItem(`orden-progress-${ordenId}`, "2")

        // Simular finalización del procesamiento
        await new Promise((resolve) => setTimeout(resolve, 500))
      }

      // Actualizar progreso a 100%
      setProgress(100)

      // Esperar un momento antes de continuar
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Notificar que la extracción está completa
      toast({
        title: "Procesamiento completado",
        description: `Se han procesado ${archivos.length} archivos correctamente`,
      })

      // Llamar al callback con las órdenes extraídas
      onExtraccionCompleta(ordenesExtraidas)
    } catch (error) {
      console.error("Error al procesar los archivos:", error)
      toast({
        title: "Error de procesamiento",
        description: "Ocurrió un error al procesar los archivos con IA",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Carga inteligente con IA</h2>
      <p className="text-gray-600 mb-6">
        Sube tus archivos de órdenes de compra y nuestro sistema de IA extraerá automáticamente la información.
        <Badge variant="outline" className="ml-2">
          Múltiples archivos
        </Badge>
      </p>

      {archivos.length === 0 ? (
        <div
          className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <FileUp className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">Arrastra archivos aquí</h3>
          <p className="mt-1 text-xs text-gray-500">O haz clic para seleccionar archivos</p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {archivos.map((file, index) => (
              <div
                key={index}
                className="relative border rounded-lg p-2 w-[150px] h-[180px] flex flex-col items-center"
              >
                <button
                  className="absolute top-1 right-1 p-1 rounded-full bg-white shadow-sm hover:bg-gray-100"
                  onClick={() => handleRemoveFile(index)}
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="h-[100px] w-[100px] flex items-center justify-center bg-gray-100 rounded mb-2">
                  {file.type.includes("image") && previews[index] ? (
                    <img
                      src={previews[index] || "/placeholder.svg"}
                      alt={file.name}
                      className="h-full w-full object-cover rounded"
                    />
                  ) : (
                    <FileText className="h-12 w-12 text-gray-400" />
                  )}
                </div>
                <p className="text-xs text-center font-medium truncate w-full">{file.name}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ))}
            <div
              className="border-2 border-dashed rounded-lg p-2 w-[150px] h-[180px] flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 text-gray-400 mb-2" />
              <p className="text-xs text-center text-gray-500">Añadir más archivos</p>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
              />
            </div>
          </div>

          {isProcessing ? (
            <div className="space-y-4">
              <Progress value={progress} />
              <p className="text-sm text-center text-gray-600">
                Procesando archivos con IA ({Math.round(progress)}%)...
              </p>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={() => {
                  setArchivos([])
                  setPreviews([])
                }}
                className="flex items-center"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpiar todo
              </Button>
              <Button onClick={handleProcesarArchivos} className="flex items-center">
                <FileUp className="w-4 h-4 mr-2" />
                Procesar {archivos.length} {archivos.length === 1 ? "archivo" : "archivos"}
              </Button>
            </div>
          )}
        </div>
      )}

      <Alert className="mt-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Formatos soportados</AlertTitle>
        <AlertDescription>
          PDF, imágenes (JPG, PNG), documentos de Word (DOC, DOCX) y hojas de cálculo (XLS, XLSX).
        </AlertDescription>
      </Alert>
    </Card>
  )
}
