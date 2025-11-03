"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, AlertTriangle, X, Loader2 } from "lucide-react"
import type { ForecastComparisonItem } from "@/components/forecast/types"

type BusinessRule = {
  id: string
  name: string
  description: string
  validate: (data: ForecastComparisonItem[]) => boolean
  severity: "high" | "medium" | "low"
}

type BusinessRulesValidatorProps = {
  data: ForecastComparisonItem[]
}

export function BusinessRulesValidator({ data }: BusinessRulesValidatorProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationComplete, setValidationComplete] = useState(false)
  const [ruleResults, setRuleResults] = useState<{ rule: BusinessRule; passed: boolean }[]>([])

  // Definir reglas de negocio
  const businessRules: BusinessRule[] = [
    {
      id: "rule-1",
      name: "Límite de variación",
      description: "No más del 30% de los items pueden tener variaciones superiores al 30%",
      validate: (data) => {
        const criticalVariations = data.filter((item) => Math.abs(item.changePercentage) > 30)
        return criticalVariations.length <= data.length * 0.3
      },
      severity: "high",
    },
    {
      id: "rule-2",
      name: "Consistencia de datos",
      description: "Todos los números de parte deben tener valores en forecast actual y anterior",
      validate: (data) => {
        return data.every(
          (item) =>
            item.previousForecast !== undefined &&
            item.currentForecast !== undefined &&
            !isNaN(item.previousForecast) &&
            !isNaN(item.currentForecast),
        )
      },
      severity: "high",
    },
    {
      id: "rule-3",
      name: "Variaciones extremas",
      description: "No debe haber variaciones superiores al 100%",
      validate: (data) => {
        return !data.some((item) => Math.abs(item.changePercentage) > 100)
      },
      severity: "medium",
    },
    {
      id: "rule-4",
      name: "Forecast negativo",
      description: "No debe haber valores negativos en el forecast",
      validate: (data) => {
        return !data.some((item) => item.currentForecast < 0 || item.previousForecast < 0)
      },
      severity: "high",
    },
    {
      id: "rule-5",
      name: "Números de parte duplicados",
      description: "No debe haber números de parte duplicados",
      validate: (data) => {
        const partNumbers = data.map((item) => item.evcoPartNumber)
        return partNumbers.length === new Set(partNumbers).size
      },
      severity: "medium",
    },
  ]

  const handleValidate = () => {
    setIsValidating(true)

    // Simular proceso de validación
    setTimeout(() => {
      const results = businessRules.map((rule) => ({
        rule,
        passed: rule.validate(data),
      }))

      setRuleResults(results)
      setIsValidating(false)
      setValidationComplete(true)
    }, 1500)
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "text-red-600 bg-red-50 border-red-200"
      case "medium":
        return "text-amber-600 bg-amber-50 border-amber-200"
      case "low":
        return "text-blue-600 bg-blue-50 border-blue-200"
      default:
        return "text-gray-600 bg-gray-50 border-gray-200"
    }
  }

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case "high":
        return "Alta"
      case "medium":
        return "Media"
      case "low":
        return "Baja"
      default:
        return "Desconocida"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validación de Reglas de Negocio</CardTitle>
        <CardDescription>Verifica que los datos cumplan con las reglas de negocio establecidas</CardDescription>
      </CardHeader>
      <CardContent>
        {!validationComplete ? (
          <div className="flex flex-col items-center justify-center py-6">
            {isValidating ? (
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-gray-600">Validando reglas de negocio...</p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-gray-600 mb-4">
                  Haga clic en el botón para validar que los datos cumplan con las reglas de negocio establecidas.
                </p>
                <Button onClick={handleValidate}>Validar Reglas de Negocio</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Resultados de la validación</h3>
              <Button variant="outline" size="sm" onClick={() => setValidationComplete(false)}>
                Volver a validar
              </Button>
            </div>

            <div className="space-y-3">
              {ruleResults.map(({ rule, passed }) => (
                <div
                  key={rule.id}
                  className={`p-4 rounded-lg border ${passed ? "bg-green-50 border-green-200" : getSeverityColor(rule.severity)}`}
                >
                  <div className="flex items-start">
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${passed ? "bg-green-100" : rule.severity === "high" ? "bg-red-100" : "bg-amber-100"}`}
                    >
                      {passed ? (
                        <Check className={`h-4 w-4 text-green-600`} />
                      ) : (
                        <X className={`h-4 w-4 ${rule.severity === "high" ? "text-red-600" : "text-amber-600"}`} />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-medium">{rule.name}</h4>
                        {!passed && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${rule.severity === "high" ? "bg-red-100 text-red-800" : rule.severity === "medium" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}
                          >
                            Severidad: {getSeverityText(rule.severity)}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      {!passed && rule.severity === "high" && (
                        <div className="mt-2 flex items-center">
                          <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                          <span className="text-xs text-red-600">
                            Esta regla debe cumplirse para procesar el forecast
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Resumen de validación */}
            <div className="mt-6 p-4 rounded-lg border bg-gray-50">
              <h4 className="text-sm font-medium mb-2">Resumen de validación</h4>
              <div className="flex items-center gap-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                  <span className="text-sm">{ruleResults.filter((r) => r.passed).length} reglas cumplidas</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  <span className="text-sm">
                    {ruleResults.filter((r) => !r.passed && r.rule.severity === "high").length} errores críticos
                  </span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 rounded-full bg-amber-500 mr-1"></div>
                  <span className="text-sm">
                    {ruleResults.filter((r) => !r.passed && r.rule.severity !== "high").length} advertencias
                  </span>
                </div>
              </div>

              {ruleResults.some((r) => !r.passed && r.rule.severity === "high") ? (
                <div className="mt-4 p-3 bg-red-100 border border-red-200 rounded-md text-red-800 text-sm">
                  <AlertTriangle className="h-4 w-4 text-red-600 inline-block mr-1" />
                  Hay errores críticos que deben corregirse antes de continuar con el procesamiento del forecast.
                </div>
              ) : ruleResults.some((r) => !r.passed) ? (
                <div className="mt-4 p-3 bg-amber-100 border border-amber-200 rounded-md text-amber-800 text-sm">
                  <AlertTriangle className="h-4 w-4 text-amber-600 inline-block mr-1" />
                  Hay advertencias que deberían revisarse, pero puede continuar con el procesamiento del forecast.
                </div>
              ) : (
                <div className="mt-4 p-3 bg-green-100 border border-green-200 rounded-md text-green-800 text-sm">
                  <Check className="h-4 w-4 text-green-600 inline-block mr-1" />
                  Todas las reglas de negocio se cumplen. Puede continuar con el procesamiento del forecast.
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
