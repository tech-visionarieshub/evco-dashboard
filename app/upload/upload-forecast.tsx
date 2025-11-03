"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Info } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { UploadForm } from "@/components/forecast/upload/upload-form"
import { ValidationScreen } from "@/components/forecast/upload/validation-screen"
import { ComparisonScreen } from "@/components/forecast/upload/comparison-screen"
import { AnalysisScreen } from "@/components/forecast/upload/analysis-screen"
import type { ForecastComparisonItem } from "@/components/forecast/types"
import {
  mockReleasesForecastData,
  mockWeeklyForecastData,
  mockDailyForecastData,
  mockLogisticsForecastData,
  getMockComparisonData,
} from "@/lib/mock-data"

export type FormData = {
  client: string
  forecastType: string
  forecastNature: string
  file: File | null
  fileName: string
  fileSize: string
  notes: string
}

export function UploadForecast() {
  const router = useRouter()
  const [isUploading, setIsUploading] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadSuccess, setUploadSuccess] = useState(false)
  const [date, setDate] = useState<Date | null>(null)
  const [formData, setFormData] = useState<FormData>({
    client: "",
    forecastType: "",
    forecastNature: "new",
    file: null,
    fileName: "",
    fileSize: "",
    notes: "",
  })
  const [errors, setErrors] = useState({
    client: false,
    forecastType: false,
    date: false,
    file: false,
    week: false,
  })

  // Estado para controlar la etapa del flujo
  const [currentStep, setCurrentStep] = useState("upload") // "upload", "validate", "analysis", "comparison"
  const [analysisTab, setAnalysisTab] = useState("data") // "data" o "alerts"

  // Datos de análisis (simulados)
  const [analysisData, setAnalysisData] = useState<any[]>([])
  const [comparisonData, setComparisonData] = useState<ForecastComparisonItem[]>([])
  const [alertsCount, setAlertsCount] = useState({ warning: 0, critical: 0 })

  // Datos para la previsualización
  const [previewData, setPreviewData] = useState<any[]>([])
  const [missingColumns, setMissingColumns] = useState<string[]>([])

  // Selección de semana o día
  const [selectedWeek, setSelectedWeek] = useState<string>("")

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const fileExt = file.name.split(".").pop()?.toLowerCase()
      if (fileExt !== "xlsx") {
        setErrors({ ...errors, file: true })
        return
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, file: true })
        return
      }

      // Format file size
      let fileSize
      if (file.size < 1024 * 1024) {
        fileSize = (file.size / 1024).toFixed(2) + " KB"
      } else {
        fileSize = (file.size / (1024 * 1024)).toFixed(2) + " MB"
      }

      setFormData({
        ...formData,
        file,
        fileName: file.name,
        fileSize,
      })
      setErrors({ ...errors, file: false })

      // Simulate file upload
      setIsUploading(true)
      setTimeout(() => {
        setIsUploading(false)
        setUploadSuccess(true)
      }, 1500)
    }
  }

  const validateForm = () => {
    const newErrors = {
      client: !formData.client,
      forecastType: !formData.forecastType,
      date: !date,
      file: !formData.file,
      week: (formData.forecastType === "weekly" || formData.forecastType === "daily") && !selectedWeek,
    }

    setErrors(newErrors)
    return !Object.values(newErrors).some((error) => error)
  }

  const handleSubmit = () => {
    if (validateForm()) {
      // Simular carga de previsualización
      setIsUploading(true)

      setTimeout(() => {
        // Obtener datos de previsualización según el tipo de forecast
        const preview = getPreviewData(formData.forecastType)
        setPreviewData(preview)

        // Verificar columnas requeridas
        const missing = checkRequiredColumns(formData.forecastType, preview)
        setMissingColumns(missing)

        setIsUploading(false)
        setCurrentStep("validate")
      }, 1500)
    }
  }

  const handleProcessForecast = () => {
    // Simular procesamiento del forecast
    setIsProcessing(true)

    setTimeout(() => {
      // Cargar datos de comparación según el tipo de forecast
      const comparisonData = getMockComparisonData(formData.forecastType)
      setComparisonData(comparisonData)

      // Contar alertas
      const warnings = comparisonData.filter(
        (item) => Math.abs(item.changePercentage) > 20 && Math.abs(item.changePercentage) <= 30,
      ).length
      const criticals = comparisonData.filter((item) => Math.abs(item.changePercentage) > 30).length
      setAlertsCount({ warning: warnings, critical: criticals })

      setIsProcessing(false)
      setCurrentStep("comparison")
    }, 2000)
  }

  const handleContinueToAnalysis = () => {
    // Simular carga de datos de análisis
    setIsProcessing(true)

    setTimeout(() => {
      // Cargar datos de ejemplo según el tipo de forecast
      let data = []

      if (formData.forecastType === "releases") {
        data = mockReleasesForecastData
      } else if (formData.forecastType === "weekly") {
        data = mockWeeklyForecastData
      } else if (formData.forecastType === "daily") {
        data = mockDailyForecastData
      } else if (formData.forecastType === "inventory") {
        data = mockLogisticsForecastData
      }

      setAnalysisData(data)
      setIsProcessing(false)
      setCurrentStep("analysis")
    }, 1500)
  }

  const handleExportExcel = () => {
    // Simulación de exportación a Excel
    console.log("Exportando a Excel...")
    // Aquí iría la lógica real de exportación
  }

  const handleGenerateReport = () => {
    // Simulación de generación de reporte
    console.log("Generando reporte final...")

    // Contar alertas
    const warnings = comparisonData.filter(
      (item) => Math.abs(item.changePercentage) > 20 && Math.abs(item.changePercentage) <= 30,
    ).length
    const criticals = comparisonData.filter((item) => Math.abs(item.changePercentage) > 30).length

    // Construir URL con parámetros
    let url = `/success?client=${encodeURIComponent(formData.client)}&forecastType=${formData.forecastType}&date=${date?.toISOString()}&fileName=${encodeURIComponent(formData.fileName)}&totalItems=${comparisonData.length}&warningAlerts=${warnings}&criticalAlerts=${criticals}`

    // Añadir semana si es relevante
    if ((formData.forecastType === "weekly" || formData.forecastType === "daily") && selectedWeek) {
      url += `&week=${selectedWeek}`
    }

    // Redirigir a la página de éxito con los parámetros
    router.push(url)
  }

  // Función para obtener datos de previsualización según el tipo de forecast
  const getPreviewData = (forecastType: string) => {
    // Implementación de la función getPreviewData
    // (Esta función se movería a un archivo de utilidades)
    switch (forecastType) {
      case "releases":
        return [
          {
            poNumber: "PO-12345",
            releaseNo: "R001",
            partNumber: "EVP-2345",
            quantity: 500,
            deliveryDate: "15/05/2023",
          },
          {
            poNumber: "PO-12345",
            releaseNo: "R002",
            partNumber: "EVP-2345",
            quantity: 750,
            deliveryDate: "22/05/2023",
          },
          // Más datos...
        ]
      case "weekly":
        return [
          {
            partNumber: "EVP-2345",
            description: "Plastic Housing A",
            week1: 500,
            week2: 550,
            week3: 600,
            week4: 500,
            week5: 550,
            week6: 600,
          },
          // Más datos...
        ]
      case "daily":
        return [
          {
            partNumber: "EVP-2345",
            description: "Plastic Housing A",
            day1: 100,
            day2: 110,
            day3: 120,
            day4: 100,
            day5: 110,
          },
          // Más datos...
        ]
      case "inventory":
        return [
          {
            partNumber: "EVP-2345",
            description: "Plastic Housing A",
            currentInventory: 1500,
            moq: 500,
            safetyStock: 1000,
            openPOs: 1000,
            doh: 15,
          },
          // Más datos...
        ]
      default:
        return []
    }
  }

  // Función para verificar columnas requeridas según el tipo de forecast
  const checkRequiredColumns = (forecastType: string, previewData: any[]) => {
    if (!previewData || previewData.length === 0) return []

    const firstRow = previewData[0]
    const missingColumns = []

    switch (forecastType) {
      case "releases":
        if (!("partNumber" in firstRow)) missingColumns.push("Número de Parte")
        if (!("quantity" in firstRow)) missingColumns.push("Cantidad")
        if (!("deliveryDate" in firstRow)) missingColumns.push("Fecha de Entrega")
        break
      case "weekly":
        if (!("partNumber" in firstRow)) missingColumns.push("Número de Parte")
        if (!("week1" in firstRow)) missingColumns.push("Semana 1")
        break
      case "daily":
        if (!("partNumber" in firstRow)) missingColumns.push("Número de Parte")
        if (!("day1" in firstRow)) missingColumns.push("Día 1")
        break
      case "inventory":
        if (!("partNumber" in firstRow)) missingColumns.push("Número de Parte")
        if (!("currentInventory" in firstRow)) missingColumns.push("Inventario Actual")
        if (!("safetyStock" in firstRow)) missingColumns.push("Safety Stock")
        break
    }

    return missingColumns
  }

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex flex-1 flex-col items-center p-4 md:p-8 bg-gray-50">
        <div className="mx-auto w-full max-w-5xl">
          {currentStep === "upload" ? (
            <>
              <Alert className="mb-6 border border-primary/20 bg-primary/5">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary font-medium">Información importante</AlertTitle>
                <AlertDescription className="text-primary/80">
                  Este módulo procesa únicamente archivos Excel (.xlsx). Asegúrate de seleccionar el tipo de forecast
                  correcto.
                </AlertDescription>
              </Alert>

              <UploadForm
                formData={formData}
                setFormData={setFormData}
                date={date}
                setDate={setDate}
                selectedWeek={selectedWeek}
                setSelectedWeek={setSelectedWeek}
                errors={errors}
                isUploading={isUploading}
                uploadSuccess={uploadSuccess}
                handleFileChange={handleFileChange}
                handleSubmit={handleSubmit}
                setUploadSuccess={setUploadSuccess}
              />
            </>
          ) : currentStep === "validate" ? (
            <ValidationScreen
              formData={formData}
              date={date}
              selectedWeek={selectedWeek}
              previewData={previewData}
              missingColumns={missingColumns}
              isProcessing={isProcessing}
              setCurrentStep={setCurrentStep}
              handleProcessForecast={handleProcessForecast}
            />
          ) : currentStep === "comparison" ? (
            <ComparisonScreen
              formData={formData}
              date={date}
              comparisonData={comparisonData}
              isProcessing={isProcessing}
              setCurrentStep={setCurrentStep}
              handleContinueToAnalysis={handleContinueToAnalysis}
              handleExportExcel={handleExportExcel}
              handleGenerateReport={handleGenerateReport}
            />
          ) : (
            <AnalysisScreen
              formData={formData}
              date={date}
              analysisData={analysisData}
              alertsCount={alertsCount}
              analysisTab={analysisTab}
              setAnalysisTab={setAnalysisTab}
              handleExportExcel={handleExportExcel}
              handleGenerateReport={handleGenerateReport}
            />
          )}
        </div>
      </main>
    </div>
  )
}
