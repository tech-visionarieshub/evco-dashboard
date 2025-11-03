"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Download, Trash2, Calendar, TrendingUp, Users, Package, MoreVertical } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import Link from "next/link"
import type { DemandAnalysis } from "@/lib/types/demand-persistence"

interface DemandAnalysisListProps {
  analyses: DemandAnalysis[]
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
  onDelete: (id: string) => Promise<void>
  getStatusBadge: (status: string) => React.ReactNode
  getPriorityBadge: (alertas: number) => React.ReactNode
}

export function DemandAnalysisList({
  analyses,
  loading,
  hasMore,
  onLoadMore,
  onDelete,
  getStatusBadge,
  getPriorityBadge,
}: DemandAnalysisListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este análisis?")) {
      setDeletingId(id)
      try {
        await onDelete(id)
      } finally {
        setDeletingId(null)
      }
    }
  }

  const formatDate = (date: any) => {
    if (!date) return "Sin fecha"
    const d = date.toDate ? date.toDate() : new Date(date)
    return d.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const formatDuration = (start: any, end: any) => {
    if (!start || !end) return "N/A"
    const startTime = start.toDate ? start.toDate() : new Date(start)
    const endTime = end.toDate ? end.toDate() : new Date(end)
    const diffMs = endTime.getTime() - startTime.getTime()
    const diffMins = Math.round(diffMs / (1000 * 60))
    return `${diffMins}min`
  }

  if (loading && analyses.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-200 rounded w-16"></div>
                  <div className="h-6 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (analyses.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-600 mb-2">No hay análisis disponibles</h3>
          <p className="text-gray-500 mb-4">Comienza creando tu primer análisis de demanda</p>
          <Link href="/demand/upload">
            <Button>Crear Análisis</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {analyses.map((analysis) => (
        <Card key={analysis.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  {analysis.nombre}
                  {getStatusBadge(analysis.status)}
                  {getPriorityBadge(analysis.alertasCriticas)}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(analysis.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Duración: {formatDuration(analysis.createdAt, analysis.updatedAt)}
                  </span>
                </CardDescription>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href={`/demand/analysis/${analysis.id}`} className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Ver Análisis
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => handleDelete(analysis.id)}
                    className="text-red-600"
                    disabled={deletingId === analysis.id}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {deletingId === analysis.id ? "Eliminando..." : "Eliminar"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{analysis.totalPartes}</p>
                <p className="text-xs text-gray-500">Partes</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{analysis.totalRegistros.toLocaleString()}</p>
                <p className="text-xs text-gray-500">Registros</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">{analysis.senalesIA}</p>
                <p className="text-xs text-gray-500">Señales IA</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{analysis.alertasCriticas}</p>
                <p className="text-xs text-gray-500">Alertas</p>
              </div>
            </div>

            {analysis.descripcion && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{analysis.descripcion}</p>}

            <div className="flex flex-wrap gap-2 mb-4">
              {analysis.topClientes?.slice(0, 3).map((cliente, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  <Users className="h-3 w-3 mr-1" />
                  {cliente}
                </Badge>
              ))}
              {analysis.topClientes && analysis.topClientes.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{analysis.topClientes.length - 3} más
                </Badge>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex gap-2 text-xs text-gray-500">
                <span>Volatilidad: {analysis.volatilidad?.toFixed(1)}%</span>
                <span>•</span>
                <span>
                  Tendencia: {analysis.tendencia > 0 ? "+" : ""}
                  {analysis.tendencia?.toFixed(1)}%
                </span>
              </div>

              <div className="flex gap-2">
                <Link href={`/demand/analysis/${analysis.id}`}>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                </Link>
                <Button size="sm" variant="outline">
                  <Download className="h-4 w-4 mr-1" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {hasMore && (
        <div className="text-center py-4">
          <Button onClick={onLoadMore} disabled={loading} variant="outline" className="w-full md:w-auto bg-transparent">
            {loading ? "Cargando..." : "Cargar más análisis"}
          </Button>
        </div>
      )}
    </div>
  )
}
