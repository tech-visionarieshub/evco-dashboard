"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ArrowDown, ArrowUp, Check, ChevronDown, ChevronUp, Search, SlidersHorizontal } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Tipos para los datos de comparación
export type ForecastComparisonItem = {
  id: string
  evcoPartNumber: string
  clientPartNumber: string
  description: string
  previousForecast: number
  currentForecast: number
  changePercentage: number
  variationType: "normal" | "moderada" | "pico"
  comments?: string
}

type ForecastComparisonTableProps = {
  data: ForecastComparisonItem[]
  onExport: () => void
}

export function ForecastComparisonTable({ data, onExport }: ForecastComparisonTableProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [selectedSemaphores, setSelectedSemaphores] = useState<string[]>(["green", "yellow", "red"])

  // Función para determinar el color del semáforo según el porcentaje de cambio
  const getSemaphoreColor = (percentage: number) => {
    const absPercentage = Math.abs(percentage)
    if (absPercentage <= 20) return "green"
    if (absPercentage <= 30) return "yellow"
    return "red"
  }

  // Función para obtener el texto del semáforo
  const getSemaphoreText = (color: string) => {
    switch (color) {
      case "green":
        return "Normal"
      case "yellow":
        return "Moderada"
      case "red":
        return "Alta"
      default:
        return ""
    }
  }

  // Función para ordenar los datos
  const sortData = (data: ForecastComparisonItem[]) => {
    if (!sortColumn) return data

    return [...data].sort((a, b) => {
      let valueA: any = a[sortColumn as keyof ForecastComparisonItem]
      let valueB: any = b[sortColumn as keyof ForecastComparisonItem]

      // Convertir a números si son strings numéricos
      if (typeof valueA === "string" && !isNaN(Number(valueA))) valueA = Number(valueA)
      if (typeof valueB === "string" && !isNaN(Number(valueB))) valueB = Number(valueB)

      if (valueA < valueB) return sortDirection === "asc" ? -1 : 1
      if (valueA > valueB) return sortDirection === "asc" ? 1 : -1
      return 0
    })
  }

  // Función para manejar el cambio de ordenamiento
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  // Filtrar datos por término de búsqueda y semáforos seleccionados
  const filteredData = sortData(
    data.filter((item) => {
      // Filtrar por término de búsqueda
      const searchMatch =
        searchTerm === "" ||
        item.evcoPartNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.clientPartNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase())

      // Filtrar por semáforos seleccionados
      const semaphoreColor = getSemaphoreColor(item.changePercentage)
      const semaphoreMatch = selectedSemaphores.includes(semaphoreColor)

      return searchMatch && semaphoreMatch
    }),
  )

  // Renderizar el indicador de dirección de ordenamiento
  const renderSortIndicator = (column: string) => {
    if (sortColumn !== column) return null
    return sortDirection === "asc" ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />
  }

  return (
    <div className="space-y-4">
      {/* Barra de búsqueda y filtros */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por número de parte..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Filtrar por variación
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuCheckboxItem
                checked={selectedSemaphores.includes("green")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSemaphores([...selectedSemaphores, "green"])
                  } else {
                    setSelectedSemaphores(selectedSemaphores.filter((s) => s !== "green"))
                  }
                }}
              >
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-green-500 mr-2"></span>
                  Normal
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedSemaphores.includes("yellow")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSemaphores([...selectedSemaphores, "yellow"])
                  } else {
                    setSelectedSemaphores(selectedSemaphores.filter((s) => s !== "yellow"))
                  }
                }}
              >
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-amber-500 mr-2"></span>
                  Moderada
                </div>
              </DropdownMenuCheckboxItem>
              <DropdownMenuCheckboxItem
                checked={selectedSemaphores.includes("red")}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedSemaphores([...selectedSemaphores, "red"])
                  } else {
                    setSelectedSemaphores(selectedSemaphores.filter((s) => s !== "red"))
                  }
                }}
              >
                <div className="flex items-center">
                  <span className="h-3 w-3 rounded-full bg-red-500 mr-2"></span>
                  Alta
                </div>
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="h-9" onClick={onExport}>
            Exportar
          </Button>
        </div>
      </div>

      {/* Tabla de comparación */}
      <div className="rounded-md border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort("evcoPartNumber")}>
                  <div className="flex items-center">
                    Número de parte EVCO
                    {renderSortIndicator("evcoPartNumber")}
                  </div>
                </TableHead>
                <TableHead className="w-[180px] cursor-pointer" onClick={() => handleSort("clientPartNumber")}>
                  <div className="flex items-center">
                    Número de parte cliente
                    {renderSortIndicator("clientPartNumber")}
                  </div>
                </TableHead>
                <TableHead className="w-[200px]">Descripción</TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("previousForecast")}>
                  <div className="flex items-center justify-end">
                    Forecast anterior
                    {renderSortIndicator("previousForecast")}
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("currentForecast")}>
                  <div className="flex items-center justify-end">
                    Forecast actual
                    {renderSortIndicator("currentForecast")}
                  </div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort("changePercentage")}>
                  <div className="flex items-center justify-end">
                    % Cambio
                    {renderSortIndicator("changePercentage")}
                  </div>
                </TableHead>
                <TableHead className="text-center">Variación</TableHead>
                <TableHead className="cursor-pointer" onClick={() => handleSort("variationType")}>
                  <div className="flex items-center">
                    Tipo
                    {renderSortIndicator("variationType")}
                  </div>
                </TableHead>
                <TableHead>Comentarios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-24 text-center">
                    No se encontraron resultados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item) => {
                  const semaphoreColor = getSemaphoreColor(item.changePercentage)
                  const isIncrease = item.changePercentage > 0
                  const isDecrease = item.changePercentage < 0

                  return (
                    <TableRow
                      key={item.id}
                      className={
                        semaphoreColor === "red"
                          ? "bg-red-50"
                          : semaphoreColor === "yellow"
                            ? "bg-amber-50"
                            : "bg-white"
                      }
                    >
                      <TableCell className="font-medium">{item.evcoPartNumber}</TableCell>
                      <TableCell>{item.clientPartNumber}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={item.description}>
                        {item.description}
                      </TableCell>
                      <TableCell className="text-right">{item.previousForecast.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{item.currentForecast.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end">
                          {isIncrease && <ArrowUp className="mr-1 h-4 w-4 text-red-500" />}
                          {isDecrease && <ArrowDown className="mr-1 h-4 w-4 text-green-500" />}
                          {!isIncrease && !isDecrease && <Check className="mr-1 h-4 w-4 text-gray-400" />}
                          <span
                            className={
                              isIncrease ? "text-red-600 font-medium" : isDecrease ? "text-green-600 font-medium" : ""
                            }
                          >
                            {item.changePercentage > 0 ? "+" : ""}
                            {item.changePercentage.toFixed(1)}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex justify-center">
                                <span
                                  className={`h-6 w-6 rounded-full ${
                                    semaphoreColor === "green"
                                      ? "bg-green-500"
                                      : semaphoreColor === "yellow"
                                        ? "bg-amber-500"
                                        : "bg-red-500"
                                  }`}
                                ></span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Variación {getSemaphoreText(semaphoreColor)}</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            item.variationType === "pico"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : item.variationType === "moderada"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : "bg-green-100 text-green-800 border-green-200"
                          }
                        >
                          {item.variationType === "pico"
                            ? "Pico"
                            : item.variationType === "moderada"
                              ? "Moderada"
                              : "Normal"}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={item.comments}>
                        {item.comments || "-"}
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="text-sm text-muted-foreground">
        Mostrando {filteredData.length} de {data.length} registros
      </div>
    </div>
  )
}
