import type { DemandAnalysis, DemandForecast, DemandAlert } from "@/lib/types/demand-persistence"
import { saveDemandAnalysis } from "@/lib/services/demand-storage"
import { normalizeConsumptionData } from "@/lib/demand/normalizeConsumption"
import { analyzeDemand } from "@/lib/demand/analyzeDemand"
import { runDemandAI } from "@/lib/demand/ai"
import * as XLSX from "xlsx"

export interface ProcessingStep {
  id: string
  label: string
  progress: number
}

export interface ProcessingResult {
  analysisId: string
  analysis: DemandAnalysis
  forecasts: DemandForecast[]
  alerts: DemandAlert[]
}

export class DemandAutoProcessor {
  private onProgressUpdate?: (step: string, progress: number) => void
  private onStepComplete?: (step: string) => void

  constructor(onProgressUpdate?: (step: string, progress: number) => void, onStepComplete?: (step: string) => void) {
    this.onProgressUpdate = onProgressUpdate
    this.onStepComplete = onStepComplete
  }

  async processFile(file: File, analysisName?: string, analysisDescription?: string): Promise<ProcessingResult> {
    try {
      // Paso 1: Validar archivo
      this.updateProgress("Validando archivo", 10)
      await this.delay(500)

      const rawData = await this.validateAndReadFile(file)
      this.completeStep("validating")

      // Paso 2: Normalizar datos
      this.updateProgress("Normalizando datos", 30)
      await this.delay(800)

      const normalizedData = await normalizeConsumptionData(rawData)

      if (normalizedData.length === 0) {
        throw new Error("No se encontraron datos válidos después de la normalización")
      }

      this.completeStep("normalizing")

      // Paso 3: Análisis estadístico
      this.updateProgress("Ejecutando análisis estadístico", 50)
      await this.delay(1000)

      const analysisResults = analyzeDemand(normalizedData, [])
      this.completeStep("analyzing")

      // Paso 4: Procesamiento IA
      this.updateProgress("Procesando con IA", 75)
      await this.delay(2000)

      const aiResults = await runDemandAI(normalizedData, analysisResults)
      this.completeStep("ai-processing")

      // Paso 5: Guardar resultados
      this.updateProgress("Guardando resultados", 90)
      await this.delay(500)

      const analysis: Omit<DemandAnalysis, "id"> = {
        nombre: analysisName || `Análisis ${new Date().toLocaleDateString()}`,
        descripcion: analysisDescription || "",
        archivoOriginal: file.name,
        fechaCreacion: new Date(),
        fechaActualizacion: new Date(),
        status: "completado",

        // Métricas principales
        totalPartes: analysisResults.summary.totalParts,
        totalRegistros: normalizedData.length,
        totalClientes: analysisResults.summary.totalCustomers,
        senalesIA: aiResults.totalSignals,
        alertasCriticas: aiResults.alerts.filter((a) => a.priority === "alta").length,

        // Análisis
        volatilidad: analysisResults.volatilityRanking.slice(0, 10),
        tendenciaGeneral: this.calculateTrend(analysisResults.weeklyStats),
        inventarioRiesgo: analysisResults.inventoryAnalysis.filter(
          (a) => a.riskLevel === "critical" || a.riskLevel === "high",
        ),
        topClientes: analysisResults.customerInstability.slice(0, 5).map((c) => c.customerCode),

        // Configuración
        parametros: {
          normalizacionSemanal: true,
          analisisVolatilidad: true,
          integracionInventario: true,
          prediccionesIA: true,
        },
      }

      const result = await saveDemandAnalysis({
        analysis,
        forecasts: aiResults.forecasts,
        alerts: aiResults.alerts,
        metadata: {
          archivoOriginal: file.name,
          tamanoArchivo: file.size,
          tiempoProcesamiento: Date.now(),
          calidadDatos: this.calculateDataQuality(rawData, normalizedData),
          configuracion: analysis.parametros,
        },
      })

      this.updateProgress("Completado", 100)
      this.completeStep("saving")

      return result
    } catch (error) {
      console.error("Error en procesamiento automático:", error)
      throw new Error(`Error en procesamiento: ${error instanceof Error ? error.message : "Error desconocido"}`)
    }
  }

  private calculateTrend(weeklyStats: any[]): number {
    if (weeklyStats.length === 0) return 0

    const totalQty = weeklyStats.reduce((sum, stat) => sum + stat.totalQty, 0)
    const avgQty = totalQty / weeklyStats.length

    // Simulación de tendencia basada en volatilidad promedio
    const avgVolatility = weeklyStats.reduce((sum, stat) => sum + stat.volatilityScore, 0) / weeklyStats.length
    return avgVolatility > 0.5 ? 8.3 : -2.1 // Mock trend
  }

  private calculateDataQuality(rawData: any[], normalizedData: any[]): number {
    const validDataRatio = normalizedData.length / rawData.length
    const completenessScore = validDataRatio * 100

    // Penalizar si hay muy pocos datos
    if (normalizedData.length < 50) return Math.min(completenessScore, 60)
    if (normalizedData.length < 100) return Math.min(completenessScore, 80)

    return Math.min(completenessScore, 95)
  }

  private async validateAndReadFile(file: File): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, { type: "array" })

          if (workbook.SheetNames.length === 0) {
            reject(new Error("El archivo no contiene hojas de cálculo"))
            return
          }

          const worksheet = workbook.Sheets[workbook.SheetNames[0]]
          const jsonData = XLSX.utils.sheet_to_json(worksheet)

          if (jsonData.length === 0) {
            reject(new Error("El archivo está vacío"))
            return
          }

          // Validar que tenga al menos las columnas básicas
          const firstRow = jsonData[0] as any
          const availableColumns = Object.keys(firstRow)

          console.log("Columnas disponibles:", availableColumns)

          // Buscar columnas requeridas con diferentes nombres posibles
          const hasDateColumn = availableColumns.some(
            (col) =>
              col.toLowerCase().includes("date") || col.toLowerCase().includes("fecha") || col === "Invoice_Date",
          )

          const hasCustomerColumn = availableColumns.some(
            (col) => col.toLowerCase().includes("cust") || col.toLowerCase().includes("cliente") || col === "CustID",
          )

          const hasPartColumn = availableColumns.some(
            (col) => col.toLowerCase().includes("part") || col.toLowerCase().includes("parte") || col === "PartNum",
          )

          const hasQtyColumn = availableColumns.some(
            (col) =>
              col.toLowerCase().includes("qty") || col.toLowerCase().includes("cantidad") || col === "SellingShipQty",
          )

          if (!hasDateColumn || !hasCustomerColumn || !hasPartColumn || !hasQtyColumn) {
            const missing = []
            if (!hasDateColumn) missing.push("fecha/date")
            if (!hasCustomerColumn) missing.push("cliente/customer")
            if (!hasPartColumn) missing.push("parte/part")
            if (!hasQtyColumn) missing.push("cantidad/qty")

            reject(
              new Error(
                `Faltan columnas requeridas: ${missing.join(", ")}. Columnas encontradas: ${availableColumns.join(", ")}`,
              ),
            )
            return
          }

          resolve(jsonData)
        } catch (error) {
          console.error("Error leyendo archivo:", error)
          reject(new Error("Error al leer el archivo Excel. Verifique que sea un archivo .xlsx válido"))
        }
      }

      reader.onerror = () => reject(new Error("Error al leer el archivo"))
      reader.readAsArrayBuffer(file)
    })
  }

  private updateProgress(step: string, progress: number) {
    this.onProgressUpdate?.(step, progress)
  }

  private completeStep(step: string) {
    this.onStepComplete?.(step)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }
}

// Función helper para uso directo
export async function processFileAutomatically(
  file: File,
  analysisName?: string,
  analysisDescription?: string,
  onProgress?: (step: string, progress: number) => void,
): Promise<ProcessingResult> {
  const processor = new DemandAutoProcessor(onProgress)
  return processor.processFile(file, analysisName, analysisDescription)
}
