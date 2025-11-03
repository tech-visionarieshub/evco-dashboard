"use client"

import { useState } from "react"
import { FileProcessor } from "@/components/forecast/file-processor"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Toaster } from "@/components/ui/toaster"

export default function TestUploadPage() {
  const [fileData, setFileData] = useState<any>(null)

  const handleFileProcessed = (data: any) => {
    console.log("Archivo procesado:", data)
    setFileData(data)
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Prueba de Carga de Archivos</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Subir Archivo</CardTitle>
          </CardHeader>
          <CardContent>
            <FileProcessor onFileProcessed={handleFileProcessed} />
          </CardContent>
        </Card>

        {fileData && (
          <Card>
            <CardHeader>
              <CardTitle>Archivo Procesado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <strong>Nombre:</strong> {fileData.fileName}
                </p>
                <p>
                  <strong>Tamaño:</strong> {(fileData.fileSize / 1024).toFixed(2)} KB
                </p>
                <p>
                  <strong>Formato detectado:</strong> {fileData.format}
                </p>
                <p>
                  <strong>Filas:</strong> {fileData.rowCount}
                </p>
                <p>
                  <strong>Columnas:</strong> {fileData.columns.join(", ")}
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Toaster />
    </div>
  )
}
