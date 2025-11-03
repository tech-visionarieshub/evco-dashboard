"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RequiredColumnsInfo } from "../required-columns-info"
import { validateForecastData } from "@/lib/validations"

interface AnalysisScreenProps {
  data: any[]
  onContinue: (validatedData: any[]) => void
  onBack: () => void
}

export function AnalysisScreen({ data, onContinue, onBack }: AnalysisScreenProps) {
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean
    errors: string[]
  }>({ isValid: false, errors: [] })

  const handleValidate = () => {
    const result = validateForecastData(data)
    setValidationStatus(result)

    if (result.isValid) {
      onContinue(data)
    }
  }

  // Obtener las columnas del primer objeto
  const columns = data && data.length > 0 ? Object.keys(data[0]) : []

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Previsualización del contenido</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <div className="relative">
              {/* Header fijo */}
              <table className="w-full min-w-full">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted bg-gray-50">
                    {columns.map((column) => (
                      <th
                        key={column}
                        className="h-12 px-4 text-left align-middle font-medium text-muted-foreground min-w-[150px]"
                      >
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
              </table>

              {/* Contenido con scroll */}
              <div className="overflow-auto max-h-[400px]">
                <table className="w-full min-w-full">
                  <tbody>
                    {data.map((row, rowIndex) => (
                      <tr key={rowIndex} className="border-b transition-colors hover:bg-muted/50">
                        {columns.map((column) => (
                          <td key={`${rowIndex}-${column}`} className="p-4 align-middle min-w-[150px]">
                            {row[column] !== undefined && row[column] !== null ? String(row[column]) : ""}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Mostrando {data.length} de {data.length} filas del archivo.
          </p>
        </CardContent>
      </Card>

      <RequiredColumnsInfo />

      {validationStatus.errors.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Errores de validación</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-5 space-y-1">
              {validationStatus.errors.map((error, index) => (
                <li key={index} className="text-destructive">
                  {error}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={handleValidate}>Continuar</Button>
      </div>
    </div>
  )
}
