"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, Brain, TrendingUp, BarChart3, Zap, FileSpreadsheet } from "lucide-react"
import Link from "next/link"

export default function UploadPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Centro de Carga de Datos</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Selecciona el tipo de análisis que deseas realizar. Cada módulo está optimizado para diferentes tipos de
            datos y objetivos de negocio.
          </p>
        </div>

        {/* Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Forecast Upload Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                  Tradicional
                </Badge>
              </div>
              <CardTitle className="text-2xl text-gray-900 group-hover:text-blue-700 transition-colors">
                Subir Forecast
              </CardTitle>
              <CardDescription className="text-gray-600 text-base leading-relaxed">
                Carga y valida archivos de forecast en formato Excel. Incluye comparación con históricos, validación de
                reglas de negocio y análisis de cambios.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Excel (.xlsx)
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <BarChart3 className="h-3 w-3 mr-1" />
                    Comparación histórica
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Validación automática
                  </Badge>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <h4 className="font-semibold text-blue-900 mb-2">Funcionalidades incluidas:</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Detección automática de formato y período</li>
                    <li>• Comparación con forecast anterior</li>
                    <li>• Validación de reglas de negocio</li>
                    <li>• Análisis de cambios y estadísticas</li>
                  </ul>
                </div>

                <Link href="/upload-forecast" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3">
                    Ir a Subir Forecast
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Demand Analysis Card */}
          <Card className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 bg-white">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Brain className="h-8 w-8 text-purple-600" />
                </div>
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
                  <Zap className="h-3 w-3 mr-1" />
                  Powered by IA
                </Badge>
              </div>
              <CardTitle className="text-2xl text-gray-900 group-hover:text-purple-700 transition-colors">
                Análisis de Demanda
              </CardTitle>
              <CardDescription className="text-gray-600 text-base leading-relaxed">
                Análisis inteligente de históricos de consumo con IA. Detecta anomalías, patrones estacionales y genera
                predicciones automáticas de demanda.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-xs">
                    <FileSpreadsheet className="h-3 w-3 mr-1" />
                    Facturas (.xlsx)
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Brain className="h-3 w-3 mr-1" />
                    IA GPT-4o-mini
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Predicciones automáticas
                  </Badge>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-100">
                  <h4 className="font-semibold text-purple-900 mb-2">Capacidades de IA:</h4>
                  <ul className="text-sm text-purple-800 space-y-1">
                    <li>• Detección automática de anomalías</li>
                    <li>• Análisis de estacionalidad y tendencias</li>
                    <li>• Predicciones de demanda (8 semanas)</li>
                    <li>• Integración con inventario en tiempo real</li>
                  </ul>
                </div>

                <Link href="/demand" className="block">
                  <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-medium py-3">
                    Ir a Análisis de Demanda
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <Card className="bg-gray-50 border-gray-200">
            <CardHeader>
              <CardTitle className="text-center text-gray-800">Información sobre formatos de archivo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">📊 Archivos de Forecast</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Formato Excel (.xlsx) con columnas estándar de forecast por cliente y producto.
                  </p>
                  <p className="text-xs text-gray-500">
                    El sistema detecta automáticamente el formato y período del archivo.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3">🧾 Archivos de Facturas</h4>
                  <p className="text-sm text-gray-600 mb-2">
                    Detalle de facturas con columnas: Invoice_Date, CustID, PartNum, SellingShipQty, etc.
                  </p>
                  <p className="text-xs text-gray-500">Se procesan automáticamente para análisis semanal de consumo.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
