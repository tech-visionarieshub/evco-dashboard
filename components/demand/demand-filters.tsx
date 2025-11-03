"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { X, Calendar, Filter, RotateCcw } from "lucide-react"

interface DemandFiltersProps {
  filters: {
    dateFrom?: string
    dateTo?: string
    cliente?: string
    producto?: string
    status?: string
    priority?: string
    searchTerm?: string
  }
  onFiltersChange: (filters: any) => void
  onClose: () => void
}

export function DemandFilters({ filters, onFiltersChange, onClose }: DemandFiltersProps) {
  const [localFilters, setLocalFilters] = useState(filters)

  const handleApplyFilters = () => {
    onFiltersChange(localFilters)
    onClose()
  }

  const handleResetFilters = () => {
    const resetFilters = {}
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const handleFilterChange = (key: string, value: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      [key]: value || undefined,
    }))
  }

  const getActiveFiltersCount = () => {
    return Object.values(localFilters).filter((value) => value && value !== "").length
  }

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-blue-600" />
            Filtros Avanzados
            {getActiveFiltersCount() > 0 && (
              <Badge className="bg-blue-100 text-blue-800">{getActiveFiltersCount()} activos</Badge>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="dateFrom" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha desde
            </Label>
            <Input
              id="dateFrom"
              type="date"
              value={localFilters.dateFrom || ""}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dateTo">Fecha hasta</Label>
            <Input
              id="dateTo"
              type="date"
              value={localFilters.dateTo || ""}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>
        </div>

        {/* Status and Priority */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select value={localFilters.status || "all"} onValueChange={(value) => handleFilterChange("status", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="processing">Procesando</SelectItem>
                <SelectItem value="failed">Error</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Prioridad</Label>
            <Select
              value={localFilters.priority || "all"}
              onValueChange={(value) => handleFilterChange("priority", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las prioridades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="high">Alta Prioridad (10+ alertas)</SelectItem>
                <SelectItem value="medium">Media Prioridad (5-9 alertas)</SelectItem>
                <SelectItem value="low">Baja Prioridad (0-4 alertas)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cliente and Producto */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cliente">Cliente</Label>
            <Input
              id="cliente"
              placeholder="Filtrar por cliente..."
              value={localFilters.cliente || ""}
              onChange={(e) => handleFilterChange("cliente", e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="producto">Producto</Label>
            <Input
              id="producto"
              placeholder="Filtrar por producto..."
              value={localFilters.producto || ""}
              onChange={(e) => handleFilterChange("producto", e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          <Button onClick={handleApplyFilters} className="flex-1">
            Aplicar Filtros
          </Button>
          <Button variant="outline" onClick={handleResetFilters} className="flex items-center gap-2 bg-transparent">
            <RotateCcw className="h-4 w-4" />
            Limpiar
          </Button>
        </div>

        {/* Active Filters Display */}
        {getActiveFiltersCount() > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm text-gray-600 mb-2">Filtros activos:</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(localFilters).map(([key, value]) => {
                if (!value) return null
                const labels: Record<string, string> = {
                  dateFrom: "Desde",
                  dateTo: "Hasta",
                  cliente: "Cliente",
                  producto: "Producto",
                  status: "Estado",
                  priority: "Prioridad",
                }
                return (
                  <Badge key={key} variant="secondary" className="text-xs">
                    {labels[key]}: {value}
                  </Badge>
                )
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
