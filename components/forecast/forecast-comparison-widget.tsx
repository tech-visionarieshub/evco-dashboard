"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search, ChevronDown, ChevronUp, Download } from "lucide-react"
import { forecastHistories } from "@/lib/mock-data/forecast-history"
import { Input } from "@/components/ui/input"

type ForecastComparisonWidgetProps = {
  clientName?: string
  onClose?: () => void
  isExpanded?: boolean
}

export function ForecastComparisonWidget({
  clientName,
  onClose,
  isExpanded: initialExpanded = false,
}: ForecastComparisonWidgetProps) {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const [searchTerm, setSearchTerm] = useState("")

  // Filtrar historiales por cliente si se proporciona un nombre de cliente
  const filteredHistories = clientName
    ? forecastHistories.filter((history) => history.client.toLowerCase() === clientName.toLowerCase())
    : forecastHistories

  const toggleExpand = () => {
    setIsExpanded(!isExpanded)
  }

  // Función para descargar los datos como CSV
  const downloadCSV = (historyData: any) => {
    // Crear encabezados
    const headers = Object.keys(historyData.data[0])

    // Crear filas de datos
    const rows = historyData.data.map((row: any) => headers.map((header) => row[header]).join(","))

    // Combinar encabezados y filas
    const csv = [headers.join(","), ...rows].join("\n")

    // Crear y descargar el archivo
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `forecast_history_${historyData.client}_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Si no hay datos históricos para el cliente seleccionado, mostrar mensaje
  if (clientName && filteredHistories.length === 0) {
    return (
      <Card className="w-full mt-4">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Datos Históricos de Forecast</CardTitle>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No se encontraron datos históricos para el cliente {clientName}.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full mt-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Datos Históricos de Forecast</CardTitle>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={toggleExpand}>
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-1" />
                  Contraer
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-1" />
                  Expandir
                </>
              )}
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cerrar
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Buscar por número de parte..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {filteredHistories.map((history, index) => (
            <Card key={index} className="mb-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium">{history.client}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => downloadCSV(history)}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {history.hasCustId && <TableHead>Cust ID</TableHead>}
                        <TableHead>Part #</TableHead>
                        {history.hasDescription && <TableHead>Descripción</TableHead>}
                        {history.data[0] &&
                          Object.keys(history.data[0])
                            .filter((key) => key !== "partNumber" && key !== "description" && key !== "custId")
                            .map((key, i) => (
                              <TableHead key={i} className="text-right">
                                {key}
                              </TableHead>
                            ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {history.data
                        .filter(
                          (item) =>
                            searchTerm === "" || item.partNumber.toLowerCase().includes(searchTerm.toLowerCase()),
                        )
                        .map((item, i) => (
                          <TableRow key={i}>
                            {history.hasCustId && <TableCell>{item.custId || "-"}</TableCell>}
                            <TableCell className="font-medium">{item.partNumber}</TableCell>
                            {history.hasDescription && <TableCell>{item.description || "-"}</TableCell>}
                            {Object.entries(item)
                              .filter(([key]) => key !== "partNumber" && key !== "description" && key !== "custId")
                              .map(([key, value], j) => (
                                <TableCell key={j} className="text-right">
                                  {typeof value === "number" ? value.toLocaleString() : value || "-"}
                                </TableCell>
                              ))}
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          ))}
        </CardContent>
      )}
    </Card>
  )
}
