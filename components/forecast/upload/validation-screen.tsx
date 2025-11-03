"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react"
import type { ForecastSource } from "@/hooks/useForecastFlowState"
import { normalizeToIsoWeeks } from "@/lib/normalize/normalizeToIsoWeeks"
import { FEATURE_MONTHLY_TO_WEEK } from "@/constants/featureFlags"

interface ValidationScreenProps {
  source: ForecastSource
  data: any[]
  onValidated: (results: any) => void
  onBack: () => void
}

export function ValidationScreen({ source, data, onValidated, onBack }: ValidationScreenProps) {
  const [validationResults, setValidationResults] = useState<any>(null)
  const [validating, setValidating] = useState(true)

  useEffect(() => {
    const validateData = async () => {
      setValidating(true)

      // Simulate validation process
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Check for monthly data and normalize if feature flag is enabled
      let processedData = [...data]
      let hasMonthlyData = false
      let normalizedData = []

      // Detect monthly periods
      hasMonthlyData = data.some((row) => /^\d{4}-\d{2}$/.test(row.periodKey))

      if (hasMonthlyData && FEATURE_MONTHLY_TO_WEEK) {
        normalizedData = normalizeToIsoWeeks(data, { monthlyStrategy: "proRata" })
        processedData = normalizedData
      }

      // Mock validation results
      const results = {
        isValid: true,
        totalRows: data.length,
        validRows: data.length,
        errors: [],
        warnings:
          hasMonthlyData && !FEATURE_MONTHLY_TO_WEEK
            ? ["Se detectaron períodos mensuales. La normalización a semanas ISO está deshabilitada."]
            : [],
        hasMonthlyData,
        normalizedData: normalizedData.length > 0 ? normalizedData : null,
        processedData,
        summary: {
          clients: [...new Set(data.map((row) => row.clientId))].length,
          parts: [...new Set(data.map((row) => row.partId))].length,
          periods: [...new Set(data.map((row) => row.periodKey))].length,
          totalQty: data.reduce((sum, row) => sum + (row.qty || 0), 0),
        },
      }

      setValidationResults(results)
      setValidating(false)
    }

    validateData()
  }, [data])

  const handleContinue = () => {
    if (validationResults) {
      onValidated(validationResults)
    }
  }

  if (validating) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Validando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">
          Validación de Datos - {source === "client" ? "Cliente" : "Interno"}
        </h2>
        <p className="text-gray-600">Revisión de la calidad y estructura de los datos cargados</p>
      </div>

      {/* Validation Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            {validationResults?.isValid ? (
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
            )}
            Estado de Validación
          </CardTitle>
        </CardHeader>
        <CardContent>
          {validationResults?.isValid ? (
            <div className="text-green-600">✓ Todos los datos han sido validados correctamente</div>
          ) : (
            <div className="text-red-600">✗ Se encontraron errores en los datos</div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Resumen de Datos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{validationResults?.summary.clients}</div>
              <div className="text-sm text-gray-600">Clientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{validationResults?.summary.parts}</div>
              <div className="text-sm text-gray-600">Partes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{validationResults?.summary.periods}</div>
              <div className="text-sm text-gray-600">Períodos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {validationResults?.summary.totalQty?.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Cantidad Total</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Warnings */}
      {validationResults?.warnings?.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              {validationResults.warnings.map((warning: string, index: number) => (
                <div key={index}>• {warning}</div>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Normalization Info */}
      {validationResults?.hasMonthlyData && (
        <Card>
          <CardHeader>
            <CardTitle>Normalización de Períodos</CardTitle>
          </CardHeader>
          <CardContent>
            {FEATURE_MONTHLY_TO_WEEK ? (
              <div className="text-green-600">
                ✓ Los períodos mensuales han sido convertidos a semanas ISO usando distribución pro-rata
              </div>
            ) : (
              <div className="text-yellow-600">
                ⚠ Se detectaron períodos mensuales. La normalización automática está deshabilitada.
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Button onClick={handleContinue} disabled={!validationResults?.isValid}>
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
