import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Análisis de Demanda - EVCO",
  description: "Pronóstico de demanda con IA e inventario inteligente",
}

export default function DemandLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header del módulo de demanda */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Análisis de Demanda</h1>
              <p className="text-gray-600 mt-1">Pronósticos inteligentes con IA e inventario en tiempo real</p>
            </div>
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">IA Activa</div>
              <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Firebase Conectado
              </div>
            </div>
          </div>
        </div>

        {/* Navegación del módulo */}
        <nav className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border">
            <a href="/demand" className="px-4 py-2 rounded-md text-sm font-medium bg-blue-100 text-blue-700">
              Dashboard
            </a>
            <a
              href="/demand/upload"
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Nuevo Análisis
            </a>
            <a
              href="/demand/history"
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Historial
            </a>
            <a
              href="/demand/compare"
              className="px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              Comparar
            </a>
          </div>
        </nav>

        {children}
      </div>
    </div>
  )
}
