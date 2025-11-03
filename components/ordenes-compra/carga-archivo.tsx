"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, Upload, FileText, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import * as XLSX from "xlsx"

interface CargaArchivoProps {
  onChange: (file: File | null, preview: any[], isValid: boolean) => void
}

// Columnas requeridas para el archivo de orden de compra
const COLUMNAS_REQUERIDAS = ["Número de Parte Cliente", "Número de Parte EVCO", "Cantidad", "Fecha de Entrega"]

export function CargaArchivo({ onChange }: CargaArchivoProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setIsLoading(true)
    setError(null)

    try {
      // Validar tipo de archivo
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/pdf",
      ]

      if (!validTypes.includes(selectedFile.type)) {
        setError("Formato de archivo no soportado. Por favor sube un archivo CSV, Excel o PDF.")
        setFile(null)
        setPreview([])
        onChange(null, [], false)
        setIsLoading(false)
        return
      }

      // Procesar archivo según su tipo
      let previewData: any[] = []
      let isValid = false

      if (selectedFile.type === "application/pdf") {
        // Para PDF, en un caso real usaríamos una API para extraer datos
        // Aquí solo simulamos que se procesó correctamente
        previewData = [
          {
            "Número de Parte Cliente": "ABC123",
            "Número de Parte EVCO": "EV-456",
            Cantidad: 100,
            "Fecha de Entrega": "2023-12-15",
          },
          {
            "Número de Parte Cliente": "DEF456",
            "Número de Parte EVCO": "EV-789",
            Cantidad: 200,
            "Fecha de Entrega": "2023-12-20",
          },
        ]
        isValid = true
      } else {
        // Para CSV y Excel
        const data = await readExcelFile(selectedFile)

        if (data.length === 0) {
          setError("El archivo está vacío")
          setFile(null)
          setPreview([])
          onChange(null, [], false)
          setIsLoading(false)
          return
        }

        // Verificar columnas requeridas
        const headers = Object.keys(data[0])
        const missingColumns = COLUMNAS_REQUERIDAS.filter(
          (col) => !headers.some((header) => header.toLowerCase().includes(col.toLowerCase())),
        )

        if (missingColumns.length > 0) {
          setError(`Faltan columnas requeridas: ${missingColumns.join(", ")}`)
          previewData = data.slice(0, 5) // Mostrar primeras 5 filas de todas formas
          isValid = false
        } else {
          previewData = data.slice(0, 5)
          isValid = true
        }
      }

      // Actualizar estado local primero
      setFile(selectedFile)
      setPreview(previewData)

      // Luego notificar al padre (solo una vez al final)
      onChange(selectedFile, previewData, isValid)

      toast({
        title: "Archivo cargado",
        description: `Se ha cargado el archivo ${selectedFile.name}`,
      })
    } catch (err) {
      console.error("Error al procesar el archivo:", err)
      setError("Error al procesar el archivo. Verifica el formato e intenta nuevamente.")
      setFile(null)
      setPreview([])
      onChange(null, [], false)
    } finally {
      setIsLoading(false)
    }
  }

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: "binary" })
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const json = XLSX.utils.sheet_to_json(worksheet)
          resolve(json)
        } catch (err) {
          reject(err)
        }
      }

      reader.onerror = (err) => reject(err)
      reader.readAsBinaryString(file)
    })
  }

  const handleDownloadTemplate = () => {
    // Crear una plantilla simple
    const worksheet = XLSX.utils.json_to_sheet([
      {
        "Número de Parte Cliente": "",
        "Número de Parte EVCO": "",
        Descripción: "",
        Cantidad: "",
        Precio: "",
        "Fecha de Entrega": "",
        Unidad: "",
      },
    ])

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Plantilla")

    // Ajustar anchos de columna
    const wscols = [
      { wch: 20 }, // Número de Parte Cliente
      { wch: 20 }, // Número de Parte EVCO
      { wch: 30 }, // Descripción
      { wch: 10 }, // Cantidad
      { wch: 10 }, // Precio
      { wch: 15 }, // Fecha de Entrega
      { wch: 10 }, // Unidad
    ]

    worksheet["!cols"] = wscols

    // Generar un blob y crear un enlace de descarga (método compatible con navegadores)
    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })

    // Crear URL para el blob
    const url = URL.createObjectURL(blob)

    // Crear un enlace temporal y hacer clic en él
    const a = document.createElement("a")
    a.href = url
    a.download = "plantilla_orden_compra.xlsx"
    document.body.appendChild(a)
    a.click()

    // Limpiar
    setTimeout(() => {
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }, 0)

    toast({
      title: "Plantilla descargada",
      description: "Se ha descargado la plantilla de orden de compra",
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={handleDownloadTemplate} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Descargar Plantilla
        </Button>

        <Button
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <Upload className="h-4 w-4" />
          Subir Archivo
        </Button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".csv,.xls,.xlsx,.pdf"
        />
      </div>

      {isLoading && (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700"></div>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {file && !isLoading && (
        <div className="border rounded-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-blue-600" />
            <span className="font-medium">{file.name}</span>
            <span className="text-sm text-gray-500">({(file.size / 1024).toFixed(2)} KB)</span>
          </div>

          {preview.length > 0 && (
            <div className="overflow-x-auto">
              <h3 className="text-sm font-medium mb-2">Vista previa:</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    {Object.keys(preview[0]).map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {Object.values(row).map((cell, cellIndex) => (
                        <TableCell key={cellIndex}>{String(cell)}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {preview.length < 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  Mostrando {preview.length} de {preview.length} filas
                </p>
              )}
              {preview.length === 5 && <p className="text-sm text-gray-500 mt-2">Mostrando 5 primeras filas</p>}
            </div>
          )}
        </div>
      )}

      {!file && !isLoading && (
        <div className="border-2 border-dashed rounded-md p-8 text-center">
          <p className="text-gray-500">Arrastra y suelta un archivo aquí, o haz clic en "Subir Archivo"</p>
          <p className="text-sm text-gray-400 mt-1">Formatos soportados: CSV, Excel, PDF</p>
        </div>
      )}
    </div>
  )
}
