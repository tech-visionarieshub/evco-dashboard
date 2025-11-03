"use client"

import { CardFooter } from "@/components/ui/card"

import type React from "react"
import { useState, useEffect } from "react"
import type { Dispatch, SetStateAction } from "react"
import {
  ArrowLeft,
  Check,
  FileSpreadsheet,
  FileText,
  Loader2,
  History,
  Upload,
  Download,
  HelpCircle,
  Info,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { FormData } from "@/components/forecast/forecast-flow"
import type { ForecastComparisonItem } from "@/components/forecast/types"
import { ForecastComparisonTable } from "@/components/forecast/comparison-table"
import { ForecastComparisonWidget } from "@/components/forecast/forecast-comparison-widget"
import { forecastHistories } from "@/lib/mock-data/forecast-history"
import { useToast } from "@/components/ui/use-toast"

// Datos de ejemplo para la comparación
const mockComparisonData: ForecastComparisonItem[] = [
  {
    id: "1",
    evcoPartNumber: "965313",
    clientPartNumber: "A12345",
    description: "Sensor de temperatura",
    previousForecast: 250,
    currentForecast: 291,
    changePercentage: 16.4,
    variationType: "normal",
    comments: "",
    client: "DONALDSON",
    period: "jun.25",
  },
  {
    id: "2",
    evcoPartNumber: "965328",
    clientPartNumber: "B67890",
    description: "Válvula de presión",
    previousForecast: 200,
    currentForecast: 250,
    changePercentage: 25,
    variationType: "moderada",
    comments: "Incremento por nueva línea de producción",
    client: "DONALDSON",
    period: "jul.25",
  },
  {
    id: "3",
    evcoPartNumber: "965327",
    clientPartNumber: "C13579",
    description: "Filtro de aire",
    previousForecast: 80,
    currentForecast: 100,
    changePercentage: 25,
    variationType: "moderada",
    comments: "",
    client: "DONALDSON",
    period: "jul.25",
  },
  {
    id: "4",
    evcoPartNumber: "965325",
    clientPartNumber: "D24680",
    description: "Sensor de presión",
    previousForecast: 320,
    currentForecast: 300,
    changePercentage: -6.25,
    variationType: "normal",
    comments: "Reducción por optimización de inventario",
    client: "DONALDSON",
    period: "jun.25",
  },
  {
    id: "5",
    evcoPartNumber: "965339",
    evcoNumber: "EV-5339",
    clientPartNumber: "E35791",
    description: "Conector eléctrico",
    previousForecast: 5000,
    currentForecast: 6000,
    changePercentage: 20,
    variationType: "moderada",
    comments: "",
    client: "DONALDSON",
    period: "jul.25",
  },
  {
    id: "6",
    evcoPartNumber: "965316",
    clientPartNumber: "F46802",
    description: "Soporte metálico",
    previousForecast: 100,
    currentForecast: 80,
    changePercentage: -20,
    variationType: "moderada",
    comments: "",
    client: "DONALDSON",
    period: "jun.25",
  },
  {
    id: "7",
    evcoPartNumber: "965337",
    clientPartNumber: "G57913",
    description: "Junta de goma",
    previousForecast: 750,
    currentForecast: 800,
    changePercentage: 6.67,
    variationType: "normal",
    comments: "",
    client: "DONALDSON",
    period: "jun.25",
  },
  {
    id: "8",
    evcoPartNumber: "965341",
    evcoNumber: "EV-5341",
    clientPartNumber: "H68024",
    description: "Tornillo especial",
    previousForecast: 50000,
    currentForecast: 57600,
    changePercentage: 15.2,
    variationType: "normal",
    comments: "Incremento por nuevo proyecto",
    isNew: false,
    client: "DONALDSON",
    period: "jun.25",
  },
  {
    id: "9",
    evcoPartNumber: "965331",
    clientPartNumber: "I79135",
    description: "Abrazadera metálica",
    previousForecast: 0,
    currentForecast: 1540,
    changePercentage: 100,
    variationType: "pico",
    comments: "Nuevo producto",
    isNew: true,
    client: "DONALDSON",
    period: "jul.25",
  },
  {
    id: "10",
    evcoPartNumber: "965307",
    clientPartNumber: "J80246",
    description: "Tubo de conexión",
    previousForecast: 1200,
    currentForecast: 1500,
    changePercentage: 25,
    variationType: "moderada",
    comments: "",
    client: "DONALDSON",
    period: "jul.25",
  },
]

type ComparisonScreenProps = {
  formData: FormData
  previewData: any[]
  setCurrentStep: Dispatch<SetStateAction<string>>
  isProcessing: boolean
  comparisonEnabled?: boolean
  normalizedRows?: Array<{ clientId: string; partId: string; periodKey: string; qty: number }>
  onBack: () => void
  onNext: () => void
}

export function ComparisonScreen({
  formData,
  previewData,
  setCurrentStep,
  isProcessing,
  comparisonEnabled = true,
  normalizedRows = [],
  onBack = () => setCurrentStep("validate"),
  onNext = () => setCurrentStep("confirm"),
}: ComparisonScreenProps) {
  const { toast } = useToast()
  const [showHistoricalData, setShowHistoricalData] = useState(true)
  const [isUploadingHistory, setIsUploadingHistory] = useState(false)
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [historyFile, setHistoryFile] = useState<File | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [templateType, setTemplateType] = useState<"monthly" | "weekly">("monthly")
  const [comparisonData, setComparisonData] = useState<ForecastComparisonItem[]>([])

  // Verificar si existe información histórica para el cliente seleccionado
  const clientName = formData.client
  const hasHistoricalData = forecastHistories.some(
    (history) => history.client.toLowerCase() === clientName.toLowerCase(),
  )

  // Actualizar los datos de comparación cuando cambia el cliente
  useEffect(() => {
    // Filtrar los datos de comparación para el cliente seleccionado
    // o usar los datos de ejemplo si no hay datos específicos
    const clientData = mockComparisonData
      .filter((item) => item.client.toLowerCase() === clientName.toLowerCase())
      .map((item) => ({ ...item }))

    if (clientData.length > 0) {
      setComparisonData(clientData)
    } else {
      // Si no hay datos específicos para este cliente, adaptar los datos de ejemplo
      setComparisonData(
        mockComparisonData.map((item) => ({
          ...item,
          client: clientName,
        })),
      )
    }
  }, [clientName])

  // Función para manejar la carga de archivo histórico
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setHistoryFile(file)
    }
  }

  // Función para procesar la carga de datos históricos
  const handleUploadHistory = () => {
    if (!historyFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo",
        variant: "destructive",
      })
      return
    }

    setIsUploadingHistory(true)

    // Simulación de carga
    setTimeout(() => {
      toast({
        title: "Datos históricos cargados",
        description: `Se han cargado los datos históricos para ${clientName}`,
        variant: "default",
      })
      setIsUploadingHistory(false)
      setShowUploadDialog(false)
      // Aquí se procesarían los datos históricos en un caso real
    }, 1500)
  }

  // Función para descargar la plantilla de datos históricos
  const handleDownloadTemplate = async () => {
    setIsDownloading(true)

    try {
      // Importar dinámicamente la biblioteca xlsx
      const XLSX = await import("xlsx")

      // Crear un libro de Excel
      const wb = XLSX.utils.book_new()

      // Crear datos para la plantilla según el tipo seleccionado
      let headers: string[] = []
      let sampleData: any[][] = []

      if (templateType === "monthly") {
        headers = [
          "partNumber",
          "custId",
          "description",
          "Jan-25",
          "Feb-25",
          "Mar-25",
          "Apr-25",
          "May-25",
          "Jun-25",
          "Jul-25",
          "Aug-25",
          "Sep-25",
          "Oct-25",
          "Nov-25",
          "Dec-25",
        ]

        // Datos de ejemplo basados en el cliente
        sampleData = [headers]

        // Añadir algunas filas de ejemplo
        for (let i = 0; i < 5; i++) {
          const row = [
            `96${5000 + i}`, // partNumber
            `${clientName.substring(0, 3)}${100 + i}`, // custId
            `Ejemplo ${i + 1}`, // description
          ]

          // Añadir valores mensuales
          for (let j = 0; j < 12; j++) {
            row.push(Math.floor(Math.random() * 1000) * 10)
          }

          sampleData.push(row)
        }
      } else {
        // Plantilla semanal
        headers = ["partNumber", "custId", "description"]
        // Añadir encabezados para las 52 semanas
        for (let i = 1; i <= 52; i++) {
          headers.push(`WK_${i.toString().padStart(2, "0")}`)
        }

        sampleData = [headers]

        // Añadir algunas filas de ejemplo
        for (let i = 0; i < 5; i++) {
          const row = [
            `96${5000 + i}`, // partNumber
            `${clientName.substring(0, 3)}${100 + i}`, // custId
            `Ejemplo ${i + 1}`, // description
          ]

          // Añadir valores semanales
          for (let j = 1; j <= 52; j++) {
            row.push(Math.floor(Math.random() * 1000) * 5)
          }

          sampleData.push(row)
        }
      }

      // Convertir los datos a una hoja de cálculo
      const ws = XLSX.utils.aoa_to_sheet(sampleData)
      XLSX.utils.book_append_sheet(wb, ws, `Plantilla_Historica_${templateType === "monthly" ? "Mensual" : "Semanal"}`)

      // Generar el archivo y descargarlo
      const fileName = `Plantilla_Historica_${clientName}_${templateType === "monthly" ? "Mensual" : "Semanal"}.xlsx`
      XLSX.writeFile(wb, fileName)
      toast({
        title: "Plantilla descargada",
        description: `La plantilla para datos históricos de ${clientName} ha sido descargada.`,
      })
    } catch (error) {
      console.error("Error al generar la plantilla:", error)
      toast({
        title: "Error al descargar",
        description: "No se pudo generar la plantilla. Por favor, inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
    }
  }

  const isInternal = formData.intention === "internal-forecast"
  const isClient = formData.intention === "client-forecast"

  return (
    <div className="flex flex-col min-h-screen">
      <main className="flex-1 flex flex-col items-center p-4 md:p-8 bg-gray-50">
        <div className="mx-auto w-full max-w-6xl">
          {/* Stepper */}
          <div className="mb-8">
            <div className="flex justify-between">
              {[
                {
                  name: "Carga de Archivo",
                  icon: <FileSpreadsheet className="w-5 h-5" />,
                  active: false,
                  completed: true,
                },
                { name: "Resumen", icon: <FileText className="w-5 h-5" />, active: false, completed: true },
                { name: "Comparación", icon: <History className="w-5 h-5" />, active: true, completed: false },
                { name: "Confirmación", icon: <Check className="w-5 h-5" />, active: false, completed: false },
              ].map((step, index) => (
                <div key={index} className={`flex flex-col items-center ${index > 0 ? "flex-1" : ""}`}>
                  <div className="relative flex items-center justify-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        step.completed
                          ? "bg-green-500 text-white"
                          : step.active
                            ? "bg-primary text-white"
                            : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {step.completed ? <Check className="w-5 h-5" /> : step.icon}
                    </div>
                    {index < 3 && (
                      <div
                        className={`hidden sm:block absolute left-10 w-full h-1 ${
                          index < 2 ? "bg-green-500" : "bg-gray-200"
                        }`}
                      />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-xs sm:text-sm font-medium ${
                      step.active ? "text-primary" : step.completed ? "text-green-500" : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Card className="card-dashboard mb-6">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-2xl">Comparación de Forecast</CardTitle>
                {!isInternal && (
                  <div className="flex gap-2">
                    {hasHistoricalData ? (
                      <Button variant="outline" size="sm" onClick={() => setShowHistoricalData(!showHistoricalData)}>
                        <History className="mr-2 h-4 w-4" />
                        {showHistoricalData ? "Ocultar datos históricos" : "Ver datos históricos"}
                      </Button>
                    ) : (
                      <>
                        <Button variant="outline" size="sm" onClick={() => setShowTemplateDialog(true)}>
                          <Download className="mr-2 h-4 w-4" />
                          Descargar plantilla
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowUploadDialog(true)}>
                          <Upload className="mr-2 h-4 w-4" />
                          Subir datos históricos
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Mensaje para pronóstico interno: no aplica comparación */}
              {isInternal && (
                <Alert className="mb-6 border-blue-200 bg-blue-50">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-800 font-medium">Comparación no aplicable</AlertTitle>
                  <AlertDescription className="text-blue-700">
                    Para pronósticos internos, la comparación contra histórico del cliente no es obligatoria. Continúa a
                    la confirmación para normalizar y guardar el pronóstico en semanas ISO.
                  </AlertDescription>
                </Alert>
              )}

              {isClient ? (
                <>
                  <div className="rounded-md border p-3 text-sm bg-blue-50 text-blue-800 flex items-center gap-2">
                    <History className="h-4 w-4" />
                    Para origen Cliente, puedes comparar con histórico (si aplica). En esta refactorización, la
                    comparación es opcional y no bloquea el flujo.
                  </div>
                  <div className="text-sm text-gray-600">
                    Cliente: <b>{formData.client || "N/D"}</b> — Filas normalizadas: <b>{normalizedRows.length}</b>
                  </div>
                  {/* Aquí podrías integrar un comparador real de histórico en Firebase si lo deseas */}
                </>
              ) : (
                <div className="rounded-md border p-3 text-sm bg-amber-50 text-amber-800">
                  Origen Interno: no se requiere comparación contra histórico del cliente.
                </div>
              )}

              {!isInternal && <ForecastComparisonTable data={comparisonData} />}

              {/* Widget de comparación con datos históricos */}
              {!isInternal && hasHistoricalData && showHistoricalData && (
                <ForecastComparisonWidget
                  clientName={clientName}
                  onClose={() => setShowHistoricalData(false)}
                  isExpanded={true}
                />
              )}
            </CardContent>
            <CardFooter className="flex justify-between p-6 pt-2">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Anterior
              </Button>
              <Button size="lg" onClick={onNext} disabled={isProcessing}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </main>

      {/* Diálogo para subir datos históricos */}
      {!isInternal && (
        <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Subir datos históricos</DialogTitle>
              <DialogDescription>
                Sube un archivo Excel con datos históricos para el cliente {clientName}. Esto permitirá realizar
                comparaciones con los datos actuales.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="history-file" className="text-sm font-medium">
                  Archivo de datos históricos
                </Label>
                <div className="flex items-center gap-2">
                  <Input id="history-file" type="file" accept=".xlsx" onChange={handleFileChange} className="flex-1" />
                </div>
                <p className="text-xs text-gray-500">
                  Formato requerido: Excel (.xlsx) con columnas similares a las del forecast actual.
                </p>
                <Alert className="mt-4">
                  <HelpCircle className="h-4 w-4" />
                  <AlertTitle>Consejo</AlertTitle>
                  <AlertDescription>
                    Si no tienes una plantilla, puedes descargarla haciendo clic en "Descargar plantilla" en la pantalla
                    anterior.
                  </AlertDescription>
                </Alert>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUploadDialog(false)} disabled={isUploadingHistory}>
                Cancelar
              </Button>
              <Button onClick={handleUploadHistory} disabled={!historyFile || isUploadingHistory}>
                {isUploadingHistory ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Subir datos
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Diálogo para descargar plantilla */}
      {!isInternal && (
        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Plantilla de Datos Históricos</DialogTitle>
              <DialogDescription>
                Descarga una plantilla para cargar datos históricos de forecast para el cliente {clientName}.
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="monthly" onValueChange={(value) => setTemplateType(value as "monthly" | "weekly")}>
              <TabsList className="grid grid-cols-2 mb-4">
                <TabsTrigger value="monthly">Formato Mensual</TabsTrigger>
                <TabsTrigger value="weekly">Formato Semanal</TabsTrigger>
              </TabsList>

              <TabsContent value="monthly">
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto max-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Part #</TableHead>
                          <TableHead className="min-w-[80px]">Cust ID</TableHead>
                          <TableHead className="min-w-[150px]">Descripción</TableHead>
                          <TableHead className="min-w-[70px]">Jan-25</TableHead>
                          <TableHead className="min-w-[70px]">Feb-25</TableHead>
                          <TableHead className="min-w-[70px]">Mar-25</TableHead>
                          <TableHead className="min-w-[40px]">...</TableHead>
                          <TableHead className="min-w-[70px]">Dec-25</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>96XXXX</TableCell>
                          <TableCell>{clientName.substring(0, 3)}XXX</TableCell>
                          <TableCell>Descripción del producto</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>...</TableCell>
                          <TableCell>0</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Formato mensual: Incluye columnas para cada mes del año (Jan-25 hasta Dec-25)
                </p>
              </TabsContent>

              <TabsContent value="weekly">
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto max-h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[100px]">Part #</TableHead>
                          <TableHead className="min-w-[80px]">Cust ID</TableHead>
                          <TableHead className="min-w-[150px]">Descripción</TableHead>
                          <TableHead className="min-w-[70px]">WK_01</TableHead>
                          <TableHead className="min-w-[70px]">WK_02</TableHead>
                          <TableHead className="min-w-[70px]">WK_03</TableHead>
                          <TableHead className="min-w-[40px]">...</TableHead>
                          <TableHead className="min-w-[70px]">WK_52</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell>96XXXX</TableCell>
                          <TableCell>{clientName.substring(0, 3)}XXX</TableCell>
                          <TableCell>Descripción del producto</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>0</TableCell>
                          <TableCell>...</TableCell>
                          <TableCell>0</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Formato semanal: Incluye columnas para cada semana del año (WK_01 hasta WK_52)
                </p>
              </TabsContent>
            </Tabs>

            <Alert className="mt-4">
              <HelpCircle className="h-4 w-4" />
              <AlertTitle>Instrucciones</AlertTitle>
              <AlertDescription>
                <ol className="list-decimal pl-4 space-y-1 mt-2">
                  <li>Descarga la plantilla en el formato que necesites (mensual o semanal)</li>
                  <li>Completa los datos históricos de forecast para el cliente {clientName}</li>
                  <li>Guarda el archivo y súbelo en la sección "Subir datos históricos"</li>
                </ol>
              </AlertDescription>
            </Alert>

            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={() => setShowTemplateDialog(false)} disabled={isDownloading}>
                Cancelar
              </Button>
              <Button onClick={handleDownloadTemplate} disabled={isDownloading}>
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Descargar plantilla {templateType === "monthly" ? "mensual" : "semanal"}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
