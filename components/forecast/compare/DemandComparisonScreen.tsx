"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Download, AlertTriangle, Upload } from "lucide-react"
import { useClientForecast } from "@/hooks/useClientForecast"
import { useInternalForecast } from "@/hooks/useInternalForecast"
import { useRouter } from "next/navigation"

interface ComparisonRow {
  clientId: string
  partId: string
  periodKey: string
  qty_client: number
  qty_internal: number
  delta: number
  delta_pct: number
}

export default function DemandComparisonScreen() {
  const router = useRouter()
  const [clientFilter, setClientFilter] = useState("")
  const [partFilter, setPartFilter] = useState("")
  const [weekRangeStart, setWeekRangeStart] = useState("2025-W01")
  const [weekRangeEnd, setWeekRangeEnd] = useState("2025-W12")

  const { data: clientData, loading: clientLoading } = useClientForecast()
  const { data: internalData, loading: internalLoading } = useInternalForecast()

  const comparisonData = useMemo(() => {
    const clientMap = new Map<string, number>()
    const internalMap = new Map<string, number>()

    // Build maps for quick lookup
    clientData.forEach((item) => {
      const key = `${item.clientId}|${item.partId}|${item.periodKey}`
      clientMap.set(key, item.qty)
    })

    internalData.forEach((item) => {
      const key = `${item.clientId}|${item.partId}|${item.periodKey}`
      internalMap.set(key, item.qty)
    })

    // Create comparison rows
    const allKeys = new Set([...clientMap.keys(), ...internalMap.keys()])
    const rows: ComparisonRow[] = []

    allKeys.forEach((key) => {
      const [clientId, partId, periodKey] = key.split("|")
      const qtyClient = clientMap.get(key) || 0
      const qtyInternal = internalMap.get(key) || 0
      const delta = qtyInternal - qtyClient
      const deltaPct = qtyClient > 0 ? (delta / qtyClient) * 100 : 0

      rows.push({
        clientId,
        partId,
        periodKey,
        qty_client: qtyClient,
        qty_internal: qtyInternal,
        delta,
        delta_pct: deltaPct,
      })
    })

    return rows
  }, [clientData, internalData])

  const filteredData = useMemo(() => {
    return comparisonData.filter((row) => {
      const matchesClient = !clientFilter || row.clientId.toLowerCase().includes(clientFilter.toLowerCase())
      const matchesPart = !partFilter || row.partId.toLowerCase().includes(partFilter.toLowerCase())
      const matchesWeekRange = row.periodKey >= weekRangeStart && row.periodKey <= weekRangeEnd

      return matchesClient && matchesPart && matchesWeekRange
    })
  }, [comparisonData, clientFilter, partFilter, weekRangeStart, weekRangeEnd])

  const hasClientData = clientData.length > 0
  const hasInternalData = internalData.length > 0

  const exportToCSV = () => {
    const headers = ["Cliente", "Parte", "Período", "Qty Cliente", "Qty Interno", "Delta", "Delta %"]
    const csvContent = [
      headers.join(","),
      ...filteredData.map((row) =>
        [
          row.clientId,
          row.partId,
          row.periodKey,
          row.qty_client,
          row.qty_internal,
          row.delta,
          row.delta_pct.toFixed(2) + "%",
        ].join(","),
      ),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `demand_comparison_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (clientLoading || internalLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Cargando datos de comparación...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Comparación de Demanda</h1>
        <Button onClick={exportToCSV} disabled={filteredData.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Exportar CSV
        </Button>
      </div>

      {/* Alerts for missing data */}
      {!hasClientData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No hay datos de forecast de cliente disponibles.</span>
            <Button variant="outline" size="sm" onClick={() => router.push("/upload?source=client&mode=upload")}>
              <Upload className="w-4 h-4 mr-2" />
              Subir Forecast Cliente
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {!hasInternalData && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>No hay datos de forecast interno disponibles.</span>
            <Button variant="outline" size="sm" onClick={() => router.push("/upload?source=internal&mode=upload")}>
              <Upload className="w-4 h-4 mr-2" />
              Subir Forecast Interno
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="client-filter">Cliente</Label>
              <Input
                id="client-filter"
                placeholder="Filtrar por cliente..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="part-filter">Parte</Label>
              <Input
                id="part-filter"
                placeholder="Filtrar por parte..."
                value={partFilter}
                onChange={(e) => setPartFilter(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="week-start">Semana Inicio</Label>
              <Input
                id="week-start"
                type="text"
                placeholder="2025-W01"
                value={weekRangeStart}
                onChange={(e) => setWeekRangeStart(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="week-end">Semana Fin</Label>
              <Input
                id="week-end"
                type="text"
                placeholder="2025-W12"
                value={weekRangeEnd}
                onChange={(e) => setWeekRangeEnd(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comparación de Forecast ({filteredData.length} registros)</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredData.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No hay datos que coincidan con los filtros aplicados.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Parte</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead className="text-right">Qty Cliente</TableHead>
                    <TableHead className="text-right">Qty Interno</TableHead>
                    <TableHead className="text-right">Delta</TableHead>
                    <TableHead className="text-right">Delta %</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.clientId}</TableCell>
                      <TableCell>{row.partId}</TableCell>
                      <TableCell>{row.periodKey}</TableCell>
                      <TableCell className="text-right">{row.qty_client.toLocaleString()}</TableCell>
                      <TableCell className="text-right">{row.qty_internal.toLocaleString()}</TableCell>
                      <TableCell className={`text-right ${row.delta >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {row.delta >= 0 ? "+" : ""}
                        {row.delta.toLocaleString()}
                      </TableCell>
                      <TableCell className={`text-right ${row.delta_pct >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {row.delta_pct >= 0 ? "+" : ""}
                        {row.delta_pct.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
