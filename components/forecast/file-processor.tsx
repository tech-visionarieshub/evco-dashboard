"use client"

import type React from "react"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Upload } from "lucide-react"

type FileProcessorProps = {
  onFileProcessed: (fileData: any) => void
}

export function FileProcessor({ onFileProcessed }: FileProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de archivo
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      toast({
        title: "Formato de archivo inválido",
        description: "Por favor, sube un archivo Excel (.xlsx)",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // En una implementación real, aquí procesaríamos el archivo Excel
      // Para esta demostración, simularemos el procesamiento
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Simular datos procesados
      const mockData = {
        fileName: file.name,
        fileSize: file.size,
        format: file.name.toLowerCase().includes("week") ? "semanal" : "mensual",
        rowCount: Math.floor(Math.random() * 100) + 50,
        columns: ["Cust ID", "No Parte EVCO", "No Parte Cliente", "MOQ", "STD Pack"],
      }

      // Notificar éxito
      toast({
        title: "Archivo procesado correctamente",
        description: `Se procesaron ${mockData.rowCount} filas de ${file.name}`,
      })

      // Enviar datos procesados al componente padre
      onFileProcessed(mockData)
    } catch (error) {
      console.error("Error procesando archivo:", error)
      toast({
        title: "Error al procesar archivo",
        description: "Ocurrió un error al procesar el archivo. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col items-center">
      <label
        htmlFor="file-upload-direct"
        className={`flex items-center justify-center px-4 py-2 rounded-md ${
          isProcessing ? "bg-gray-400" : "bg-primary hover:bg-primary/90"
        } text-white cursor-pointer`}
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Procesando...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Subir archivo
          </>
        )}
        <input
          id="file-upload-direct"
          type="file"
          accept=".xlsx"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isProcessing}
        />
      </label>
      <p className="text-xs text-gray-500 mt-2">Solo archivos Excel (.xlsx)</p>
    </div>
  )
}
