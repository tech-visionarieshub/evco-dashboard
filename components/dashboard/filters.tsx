"use client"

import { useEffect, useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronsUpDown, Filter, Plus, X, ChevronDown, RefreshCw } from "lucide-react"
import type { DateRange, Granularity, DashboardFilter } from "@/lib/services/firebase-dashboard"
import { ClientMultiSelect } from "@/components/dashboard/client-multi-select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export function DashboardFilters({
  value,
  onChange,
  onRefresh,
  isSignedIn = true,
  loading = false,
}: {
  value: DashboardFilter
  onChange: (v: DashboardFilter) => void
  onRefresh?: () => void
  isSignedIn?: boolean
  loading?: boolean
}) {
  const [granularity, setGranularity] = useState<Granularity>(value.granularity ?? "week")
  const [start, setStart] = useState<string>(value.range?.start?.slice(0, 10) ?? "")
  const [end, setEnd] = useState<string>(value.range?.end?.slice(0, 10) ?? "")
  const [selectedClients, setSelectedClients] = useState<string[]>(value.clientIds ?? [])
  const [selectedParts, setSelectedParts] = useState<string[]>(value.partNumbers ?? [])
  const [isExpanded, setIsExpanded] = useState(false) // Simple boolean state
  const [bulkValue, setBulkValue] = useState("")
  const [valueInput, setValue] = useState("")

  // Propagate changes to parent
  useEffect(() => {
    const range: DateRange | undefined =
      start || end
        ? {
            start: start ? new Date(start).toISOString() : undefined,
            end: end ? new Date(end).toISOString() : undefined,
          }
        : undefined

    onChange({
      granularity,
      range,
      clientIds: selectedClients,
      partNumbers: selectedParts,
    })
  }, [granularity, start, end, selectedClients, selectedParts, onChange])

  const granOptions: { label: string; value: Granularity }[] = useMemo(
    () => [
      { label: "Semanal", value: "week" },
      { label: "Mensual", value: "month" },
      { label: "Trimestral", value: "quarter" },
      { label: "Anual", value: "year" },
    ],
    [],
  )

  const hasActiveFilters = start || end || selectedClients.length > 0 || selectedParts.length > 0
  const load = onRefresh || (() => {})

  function addPart(part: string) {
    const p = part.trim()
    if (!p) return
    if (!selectedParts.includes(p)) setSelectedParts([...selectedParts, p])
    setValue("")
  }

  function addFromCommaSeparated(text: string) {
    const parts = text
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
    if (parts.length === 0) return
    const merged = Array.from(new Set([...selectedParts, ...parts]))
    setSelectedParts(merged)
    setBulkValue("")
  }

  function clearAllFilters() {
    setStart("")
    setEnd("")
    setGranularity("week")
    setSelectedClients([])
    setSelectedParts([])
  }

  return (
    <Card className="border-0 bg-white/80 backdrop-blur-sm shadow-lg">
      <CardContent className="p-0">
        {/* Header - Always visible */}
        <div
          className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors rounded-t-lg"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 p-2 shadow-md">
              <Filter className="h-4 w-4 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Filtros del Dashboard</h3>
              <p className="text-sm text-gray-500">Personaliza la vista de tus datos</p>
            </div>
          </div>
          <ChevronDown
            className={`h-5 w-5 text-gray-500 transition-transform duration-200 ${
              isExpanded ? "rotate-180" : "rotate-0"
            }`}
          />
        </div>

        {/* Content - Conditionally rendered */}
        {isExpanded && (
          <div className="space-y-3 p-4 pt-0">
            <Separator />

            {/* Compact Filters Grid - Better Horizontal Layout */}
            <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              {/* Date Range */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Período</Label>
                <div className="space-y-1">
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Desde</Label>
                    <Input
                      type="date"
                      value={start}
                      onChange={(e) => setStart(e.target.value)}
                      className="w-full text-xs border-gray-200 focus:border-green-500 focus:ring-green-500 h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500 mb-1 block">Hasta</Label>
                    <Input
                      type="date"
                      value={end}
                      onChange={(e) => setEnd(e.target.value)}
                      className="w-full text-xs border-gray-200 focus:border-green-500 focus:ring-green-500 h-8"
                    />
                  </div>
                </div>
              </div>

              {/* Granularity */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Granularidad</Label>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-between border-gray-200 hover:bg-purple-50 hover:border-purple-300 bg-transparent h-8 text-xs"
                    >
                      {granOptions.find((g) => g.value === granularity)?.label ?? "Semanal"}
                      <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-full">
                    {granOptions.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={granularity === opt.value}
                        onCheckedChange={() => setGranularity(opt.value)}
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Clients */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">Clientes</Label>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {selectedClients.length}
                  </Badge>
                </div>
                <ClientMultiSelect
                  buttonLabel="Seleccionar clientes"
                  selected={selectedClients}
                  onChange={setSelectedClients}
                  className="w-full h-8 text-xs"
                />
              </div>

              {/* Part Numbers */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-sm font-medium text-gray-700">Part Numbers</Label>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {selectedParts.length}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="flex gap-1">
                    <Input
                      placeholder="PN-12345"
                      value={valueInput}
                      onChange={(e) => setValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          addPart(valueInput)
                        }
                      }}
                      className="flex-1 text-xs border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-8"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addPart(valueInput)}
                      disabled={!valueInput.trim()}
                      className="px-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 h-8 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  {/* Bulk input */}
                  <div className="flex gap-1">
                    <Input
                      placeholder="PN-001, PN-002..."
                      value={bulkValue}
                      onChange={(e) => setBulkValue(e.target.value)}
                      className="flex-1 text-xs border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-7"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => addFromCommaSeparated(bulkValue)}
                      disabled={!bulkValue.trim()}
                      className="px-2 border-gray-200 hover:bg-blue-50 hover:border-blue-300 h-7 text-xs"
                    >
                      +
                    </Button>
                  </div>
                  {/* Selected parts */}
                  {selectedParts.length > 0 && (
                    <div className="max-h-12 overflow-y-auto">
                      <div className="flex flex-wrap gap-1">
                        {selectedParts.slice(0, 2).map((pn) => (
                          <Badge
                            key={pn}
                            variant="secondary"
                            className="flex items-center gap-1 bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs py-0"
                          >
                            <span className="max-w-[50px] truncate">{pn}</span>
                            <button
                              onClick={() => setSelectedParts(selectedParts.filter((x) => x !== pn))}
                              className="ml-1 hover:text-red-600 transition-colors"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        ))}
                        {selectedParts.length > 2 && (
                          <Badge variant="outline" className="text-xs py-0">
                            +{selectedParts.length - 2}
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Column */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Acciones</Label>
                <div className="space-y-1">
                  <Button
                    size="sm"
                    onClick={load}
                    disabled={!isSignedIn || loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-md hover:shadow-lg transition-all duration-200 h-8 text-xs"
                  >
                    <RefreshCw className={`mr-1 h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                    Actualizar
                  </Button>
                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="w-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 h-7 text-xs"
                    >
                      <X className="mr-1 h-3 w-3" />
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-gray-700">Filtros activos</Label>
                  <div className="flex flex-wrap gap-1">
                    {start && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs py-0">
                        Desde: {start}
                      </Badge>
                    )}
                    {end && (
                      <Badge variant="outline" className="bg-green-50 border-green-200 text-green-700 text-xs py-0">
                        Hasta: {end}
                      </Badge>
                    )}
                    {granularity !== "week" && (
                      <Badge variant="outline" className="bg-purple-50 border-purple-200 text-purple-700 text-xs py-0">
                        {granOptions.find((g) => g.value === granularity)?.label}
                      </Badge>
                    )}
                    {selectedClients.length > 0 && (
                      <Badge variant="outline" className="bg-orange-50 border-orange-200 text-orange-700 text-xs py-0">
                        {selectedClients.length} cliente{selectedClients.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                    {selectedParts.length > 0 && (
                      <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-700 text-xs py-0">
                        {selectedParts.length} producto{selectedParts.length !== 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
