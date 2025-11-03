"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Search, Download } from "lucide-react"
import { forecastHistories } from "@/lib/mock-data/forecast-history"

type ForecastHistoryViewerProps = {
  clientFilter: string | null
}

export function ForecastHistoryViewer({ clientFilter }: ForecastHistoryViewerProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState<string>(clientFilter || "all")

  // Filtrar historiales por cliente si se proporciona un filtro
  const filteredHistories = clientFilter
    ? forecastHistories.filter((history) => history.client.toLowerCase() === clientFilter.toLowerCase())
    : forecastHistories

  // Función para normalizar nombres de meses
  const normalizeMonthName = (monthStr: string): string => {
    // Convertir formatos como "jun-25", "jul.25" a un formato estándar
    const monthMap: Record<string, string> = {
      ene: "Jan",
      jan: "Jan",
      enero: "Jan",
      feb: "Feb",
      febrero: "Feb",
      mar: "Mar",
      marzo: "Mar",
      abr: "Apr",
      apr: "Apr",
      abril: "Apr",
      may: "May",
      mayo: "May",
      jun: "Jun",
      junio: "Jun",
      jul: "Jul",
      julio: "Jul",
      ago: "Aug",
      aug: "Aug",
      agosto: "Aug",
      sep: "Sep",
      sept: "Sep",
      septiembre: "Sep",
      oct: "Oct",
      octubre: "Oct",
      nov: "Nov",
      noviembre: "Nov",
      dic: "Dec",
      dec: "Dec",
      diciembre: "Dec",
    }

    // Extraer el mes y el año
    const parts = monthStr.toLowerCase().split(/[-./]/)
    if (parts.length === 1) {
      // Si solo hay una parte, devolver tal cual
      return monthStr
    }

    let month = parts[0]
    const year = parts.length > 1 ? parts[1] : ""

    // Normalizar el nombre del mes si existe en el mapa
    if (monthMap[month]) {
      month = monthMap[month]
    }

    // Reconstruir el string con el formato normalizado
    return year ? `${month}-${year}` : month
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

  return (
    <div className="space-y-6">
      {/* Barra de búsqueda */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
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

      {/* Tabs para cada cliente */}
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-5">
          {!clientFilter && <TabsTrigger value="all">Todos</TabsTrigger>}
          {filteredHistories.map((history, index) => (
            <TabsTrigger key={index} value={history.client.toLowerCase()}>
              {history.client}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Tab para todos los clientes */}
        {!clientFilter && (
          <TabsContent value="all">
            <div className="grid gap-6 md:grid-cols-2">
              {forecastHistories.map((history, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg font-medium">{history.client}</CardTitle>
                    <Button variant="outline" size="sm" onClick={() => downloadCSV(history)}>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Part #</TableHead>
                            {history.hasDescription && <TableHead>Descripción</TableHead>}
                            {history.data[0] &&
                              Object.keys(history.data[0])
                                .filter((key) => key !== "partNumber" && key !== "description" && key !== "custId")
                                .map((key, i) => (
                                  <TableHead key={i} className="text-right">
                                    {normalizeMonthName(key)}
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
                            .slice(0, 5)
                            .map((item, i) => (
                              <TableRow key={i}>
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
                    {history.data.length > 5 && (
                      <div className="mt-2 text-center text-sm text-muted-foreground">
                        Mostrando 5 de {history.data.length} registros
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        )}

        {/* Tabs para cada cliente */}
        {filteredHistories.map((history, index) => (
          <TabsContent key={index} value={history.client.toLowerCase()}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">{history.client}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => downloadCSV(history)}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
              </CardHeader>
              <CardContent>
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
                                {normalizeMonthName(key)}
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
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
