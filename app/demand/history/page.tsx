"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Filter, Clock, TrendingUp, AlertTriangle, Users } from "lucide-react"
import { DemandAnalysisList } from "@/components/demand/demand-analysis-list"
import { DemandFilters } from "@/components/demand/demand-filters"
import { DemandSearch } from "@/components/demand/demand-search"
import { useDemandHistory } from "@/hooks/useDemandHistory"

export default function DemandHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showFilters, setShowFilters] = useState(false)

  const { analyses, loading, error, hasMore, filters, setFilters, loadMore, deleteAnalysis, refreshHistory } =
    useDemandHistory()

  const handleSearch = (term: string) => {
    setSearchTerm(term)
    setFilters({ ...filters, searchTerm: term })
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters })
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { color: "bg-green-100 text-green-800", label: "Completado" },
      processing: { color: "bg-blue-100 text-blue-800", label: "Procesando" },
      failed: { color: "bg-red-100 text-red-800", label: "Error" },
      draft: { color: "bg-gray-100 text-gray-800", label: "Borrador" },
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getPriorityBadge = (alertasCriticas: number) => {
    if (alertasCriticas >= 10) return <Badge className="bg-red-100 text-red-800">Alta Prioridad</Badge>
    if (alertasCriticas >= 5) return <Badge className="bg-yellow-100 text-yellow-800">Media Prioridad</Badge>
    return <Badge className="bg-green-100 text-green-800">Baja Prioridad</Badge>
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-red-200">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Error al cargar el historial: {error}</span>
            </div>
            <Button onClick={refreshHistory} className="mt-4">
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-slate-600 bg-clip-text text-transparent">
              Historial de Análisis
            </h1>
            <p className="text-gray-600 mt-1">Explora y compara análisis de demanda anteriores</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
            <Button onClick={refreshHistory} className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <DemandSearch
          searchTerm={searchTerm}
          onSearch={handleSearch}
          placeholder="Buscar por nombre, cliente, producto..."
        />

        {/* Filters Panel */}
        {showFilters && (
          <DemandFilters filters={filters} onFiltersChange={handleFilterChange} onClose={() => setShowFilters(false)} />
        )}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-gray-600">Total Análisis</p>
                <p className="text-2xl font-bold">{analyses.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Completados</p>
                <p className="text-2xl font-bold">{analyses.filter((a) => a.status === "completed").length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-sm text-gray-600">Con Alertas</p>
                <p className="text-2xl font-bold">{analyses.filter((a) => a.alertasCriticas > 0).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-sm text-gray-600">Clientes Únicos</p>
                <p className="text-2xl font-bold">{new Set(analyses.flatMap((a) => a.topClientes || [])).size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analysis List */}
      <DemandAnalysisList
        analyses={analyses}
        loading={loading}
        hasMore={hasMore}
        onLoadMore={loadMore}
        onDelete={deleteAnalysis}
        getStatusBadge={getStatusBadge}
        getPriorityBadge={getPriorityBadge}
      />
    </div>
  )
}
