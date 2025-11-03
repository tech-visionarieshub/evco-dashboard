"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, FileSpreadsheet, TrendingUp, AlertTriangle, Brain, Package, Users, BarChart3 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useDemandData } from "@/hooks/useDemandData"
import { getDataStats } from "@/lib/demand/normalizeConsumption"
import { getTopParts, filterByRiskLevel } from "@/lib/demand/analyzeDemand"
import { filterSignalsByType, groupSignalsByPart } from "@/lib/demand/ai"
import * as XLSX from "xlsx"
import type { InvoiceRow } from "@/types/demand-ai"

export default function DemandAnalyzePage() {
  const [invoiceData, setInvoiceData] = useState<InvoiceRow[]>([])
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle")
  const [uploadError, setUploadError] = useState<string | null>(null)

  const { result, isLoading, aiLoading, hasData, error, runAIAnalysis } = useDemandData({
    invoiceData,
    autoRunAI: true,
  })

  // Manejar carga de archivo
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setUploadStatus("uploading")
    setUploadError(null)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)

        // Mapear a formato InvoiceRow
        const invoiceRows: InvoiceRow[] = jsonData
          .map((row: any) => ({
            partNum: String(row.partNum || row.PartNum || row.part_num || "").trim(),
            customerCode: String(row.customerCode || row.CustomerCode || row.customer_code || "").trim(),
            invoiceDate: String(row.invoiceDate || row.InvoiceDate || row.invoice_date || ""),
            qty: Number(row.qty || row.Qty || row.quantity || 0),
            unitPrice: Number(row.unitPrice || row.UnitPrice || row.unit_price || 0),
            totalAmount: Number(row.totalAmount || row.TotalAmount || row.total_amount || 0),
          }))
          .filter((row) => row.partNum && row.customerCode && row.qty > 0)

        console.log(`[Upload] Processed ${invoiceRows.length} valid invoice rows`)
        setInvoiceData(invoiceRows)
        setUploadStatus("success")
      } catch (err) {
        console.error("[Upload] Error processing file:", err)
        setUploadError("Error procesando archivo. Verifique el formato.")
        setUploadStatus("error")
      }
    }

    reader.readAsArrayBuffer(file)
  }, [])

  // Drag & drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      if (file) {
        const input = document.createElement("input")
        input.type = "file"
        input.files = e.dataTransfer.files
        handleFileUpload({ target: input } as any)
      }
    },
    [handleFileUpload],
  )

  // Calcular métricas para el dashboard - with safe defaults
  const dataStats = invoiceData.length > 0 ? getDataStats(invoiceData) : null
  const topVolatileParts = result?.volatilityRanking ? getTopParts(result.volatilityRanking, 20) : []
  const topInstableCustomers = result?.customerInstability ? getTopParts(result.customerInstability, 15) : []
  const criticalInventory = result?.inventoryAnalysis ? filterByRiskLevel(result.inventoryAnalysis, "critical") : []
  const highRiskInventory = result?.inventoryAnalysis ? filterByRiskLevel(result.inventoryAnalysis, "high") : []
  const anomalies = result?.aiSignals ? filterSignalsByType(result.aiSignals, "anomalies") : []
  const predictions = result?.aiSignals ? filterSignalsByType(result.aiSignals, "predictions") : []

  if (!hasData) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Análisis de Demanda con IA
          </h1>
          <p className="text-muted-foreground mt-2">
            Carga un archivo Excel con datos de facturas para comenzar el análisis
          </p>
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Cargar Datos de Facturas
            </CardTitle>
            <CardDescription>Archivo Excel con columnas: partNum, customerCode, invoiceDate, qty</CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-lg font-medium mb-2">Arrastra tu archivo aquí o haz clic para seleccionar</p>
              <p className="text-sm text-muted-foreground">Formatos soportados: .xlsx, .xls</p>
              <input id="file-upload" type="file" accept=".xlsx,.xls" onChange={handleFileUpload} className="hidden" />
            </div>

            {uploadStatus === "uploading" && (
              <div className="mt-4">
                <Progress value={50} className="mb-2" />
                <p className="text-sm text-center text-muted-foreground">Procesando archivo...</p>
              </div>
            )}

            {uploadStatus === "error" && uploadError && (
              <Alert className="mt-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{uploadError}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Análisis de Demanda con IA
        </h1>
        <p className="text-muted-foreground mt-2">Análisis completo de patrones de demanda, volatilidad e inventario</p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Partes</p>
                <p className="text-2xl font-bold">{dataStats?.uniqueParts || 0}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registros</p>
                <p className="text-2xl font-bold">{dataStats?.totalRecords || 0}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Señales IA</p>
                <p className="text-2xl font-bold">{result?.aiSignals?.length || 0}</p>
                {aiLoading && (
                  <Badge variant="secondary" className="text-xs mt-1">
                    Procesando...
                  </Badge>
                )}
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Alertas</p>
                <p className="text-2xl font-bold text-red-500">
                  {criticalInventory.length + highRiskInventory.length + anomalies.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error de IA */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            {error}
            <Button variant="outline" size="sm" onClick={runAIAnalysis} disabled={aiLoading}>
              Reintentar IA
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs de análisis */}
      <Tabs defaultValue="resumen" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="volatilidad">Volatilidad</TabsTrigger>
          <TabsTrigger value="inventario">Inventario</TabsTrigger>
          <TabsTrigger value="predicciones">Predicciones</TabsTrigger>
          <TabsTrigger value="anomalias">Anomalías</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top partes volátiles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Top 10 Partes Más Volátiles
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topVolatileParts.slice(0, 10).map((part, index) => (
                    <div key={part.partNum} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{part.partNum}</p>
                          <p className="text-sm text-muted-foreground">
                            Promedio: {part.avgWeeklyQty?.toFixed(1) || 0} / semana
                          </p>
                        </div>
                      </div>
                      <Badge variant={part.volatilityScore > 1 ? "destructive" : "secondary"}>
                        {part.volatilityScore?.toFixed(2) || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Top clientes inestables */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top 10 Clientes Más Inestables
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topInstableCustomers.slice(0, 10).map((customer, index) => (
                    <div
                      key={customer.customerCode}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="w-8 h-8 rounded-full p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{customer.customerCode}</p>
                          <p className="text-sm text-muted-foreground">
                            {customer.partCount} partes, {customer.totalQty} total
                          </p>
                        </div>
                      </div>
                      <Badge variant={customer.volatilityScore > 1 ? "destructive" : "secondary"}>
                        {customer.volatilityScore?.toFixed(2) || 0}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="volatilidad" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ranking Completo de Volatilidad</CardTitle>
              <CardDescription>Todas las partes ordenadas por coeficiente de variación</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {topVolatileParts.map((part) => (
                  <div key={part.partNum} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-4">
                      <Badge variant="outline" className="w-10 h-6 flex items-center justify-center">
                        #{part.rank}
                      </Badge>
                      <div>
                        <p className="font-medium">{part.partNum}</p>
                        <p className="text-sm text-muted-foreground">
                          Promedio: {part.avgWeeklyQty?.toFixed(1) || 0} | Máximo: {part.maxWeeklyQty || 0} |{" "}
                          {part.weekCount || 0} semanas
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          (part.volatilityScore || 0) > 1.5
                            ? "destructive"
                            : (part.volatilityScore || 0) > 0.8
                              ? "secondary"
                              : "default"
                        }
                      >
                        {part.volatilityScore?.toFixed(3) || 0}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventario" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inventario crítico */}
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Inventario Crítico</CardTitle>
                <CardDescription>Partes con stock por debajo del mínimo</CardDescription>
              </CardHeader>
              <CardContent>
                {criticalInventory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No hay partes en estado crítico</p>
                ) : (
                  <div className="space-y-3">
                    {criticalInventory.map((item) => (
                      <div key={item.partNum} className="p-3 rounded-lg border border-red-200 bg-red-50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{item.partNum}</p>
                          <Badge variant="destructive">Crítico</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            Stock actual: {item.currentStock} | Mínimo: {item.safetyStock}
                          </p>
                          <p>Consumo semanal: {item.avgWeeklyConsumption?.toFixed(1) || 0}</p>
                          <p>Semanas de stock: {item.weeksOfStock?.toFixed(1) || 0}</p>
                        </div>
                        {item.alerts && item.alerts.length > 0 && (
                          <div className="mt-2">
                            {item.alerts.map((alert, index) => (
                              <Badge key={index} variant="outline" className="text-xs mr-1 mb-1">
                                {alert}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Inventario alto riesgo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-600">Alto Riesgo</CardTitle>
                <CardDescription>Partes con stock bajo para el consumo actual</CardDescription>
              </CardHeader>
              <CardContent>
                {highRiskInventory.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No hay partes en alto riesgo</p>
                ) : (
                  <div className="space-y-3">
                    {highRiskInventory.slice(0, 10).map((item) => (
                      <div key={item.partNum} className="p-3 rounded-lg border border-orange-200 bg-orange-50">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium">{item.partNum}</p>
                          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                            Alto Riesgo
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>
                            Stock actual: {item.currentStock} | Mínimo: {item.safetyStock}
                          </p>
                          <p>Consumo semanal: {item.avgWeeklyConsumption?.toFixed(1) || 0}</p>
                          <p>Semanas de stock: {item.weeksOfStock?.toFixed(1) || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predicciones" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Predicciones de IA - Próximas 8 Semanas
              </CardTitle>
              <CardDescription>Predicciones generadas por IA con bandas de confianza</CardDescription>
            </CardHeader>
            <CardContent>
              {predictions.length === 0 ? (
                <div className="text-center py-8">
                  <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No hay predicciones disponibles</p>
                  <Button
                    variant="outline"
                    onClick={runAIAnalysis}
                    disabled={aiLoading}
                    className="mt-4 bg-transparent"
                  >
                    {aiLoading ? "Procesando..." : "Generar Predicciones"}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {Array.from(groupSignalsByPart(predictions))
                    .slice(0, 10)
                    .map(([partNum, signals]) => (
                      <div key={partNum} className="p-4 rounded-lg border">
                        <h4 className="font-medium mb-3">{partNum}</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                          {signals.slice(0, 8).map((signal) => (
                            <div key={signal.weekKey} className="text-center p-2 rounded bg-muted/50">
                              <p className="text-xs text-muted-foreground">{signal.weekKey}</p>
                              <p className="font-medium">{signal.predictedQty}</p>
                              {signal.lower && signal.upper && (
                                <p className="text-xs text-muted-foreground">
                                  {signal.lower}-{signal.upper}
                                </p>
                              )}
                              {signal.seasonalityTag && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {signal.seasonalityTag}
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalias" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Anomalías Detectadas
              </CardTitle>
              <CardDescription>Patrones inusuales detectados por IA en el consumo reciente</CardDescription>
            </CardHeader>
            <CardContent>
              {anomalies.length === 0 ? (
                <div className="text-center py-8">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No se detectaron anomalías</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Los patrones de consumo están dentro de los rangos esperados
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anomalies.map((anomaly) => (
                    <div
                      key={`${anomaly.partNum}-${anomaly.weekKey}`}
                      className="p-4 rounded-lg border border-red-200 bg-red-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-medium">{anomaly.partNum}</p>
                          <p className="text-sm text-muted-foreground">Semana: {anomaly.weekKey}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="destructive">Score: {anomaly.anomalyScore?.toFixed(2) || 0}</Badge>
                          {anomaly.seasonalityTag && (
                            <Badge variant="outline" className="ml-2">
                              {anomaly.seasonalityTag}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-sm">
                        <p>Cantidad predicha: {anomaly.predictedQty}</p>
                        {anomaly.lower && anomaly.upper && (
                          <p className="text-muted-foreground">
                            Rango esperado: {anomaly.lower} - {anomaly.upper}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
