"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChartCard } from "@/components/dashboard/bar-chart-card"
import {
  defaultDateRange,
  fetchAsertividad,
  fetchForecastVariation,
  fetchOrdenesKPIs,
  fetchOrdenesPorCliente,
  fetchOrdenesPorProducto,
  fetchTopForecastChanges,
  fetchVolumenProjVsDemand,
  type DateRange,
} from "@/lib/services/firebase-dashboard"
import { LineChartCard } from "@/components/dashboard/line-chart-card"
import { GaugeCard } from "@/components/dashboard/gauge-card"
import { TopChangesTable } from "@/components/dashboard/top-changes-table"

export function Dashboard() {
  const [range] = useState<DateRange>(defaultDateRange(90))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // All data states
  const [kpis, setKpis] = useState<{ totalOrdenes: number; valorTotal: number }>({ totalOrdenes: 0, valorTotal: 0 })
  const [porCliente, setPorCliente] = useState<Array<{ name: string; value: number }>>([])
  const [porProducto, setPorProducto] = useState<Array<{ name: string; value: number }>>([])
  const [variacion, setVariacion] = useState<Array<{ periodKey: string; value: number; isPeak?: boolean }>>([])
  const [topChanges, setTopChanges] = useState<
    Array<{ clientName?: string; partNumber?: string; periodKey: string; changePct: number; from: number; to: number }>
  >([])
  const [asertividad, setAsertividad] = useState<number>(0)
  const [projVsDemand, setProjVsDemand] = useState<Array<{ name: string; forecast: number; demand: number }>>([])

  useEffect(() => {
    let mounted = true

    async function loadDashboardData() {
      try {
        setLoading(true)
        setError(null)

        // Fetch all data from Firebase
        const [kpisData, clienteData, productoData, variacionData, topChangesData, asertividadData, projVsDemandData] =
          await Promise.all([
            fetchOrdenesKPIs(range).catch(() => ({ totalOrdenes: 0, valorTotal: 0 })),
            fetchOrdenesPorCliente(range).catch(() => []),
            fetchOrdenesPorProducto(range).catch(() => []),
            fetchForecastVariation("client", 12).catch(() => []),
            fetchTopForecastChanges("client", 5).catch(() => []),
            fetchAsertividad("client", 8).catch(() => ({ percent: 0 })),
            fetchVolumenProjVsDemand().catch(() => []),
          ])

        if (!mounted) return

        // Set all data with safe defaults
        setKpis(kpisData || { totalOrdenes: 0, valorTotal: 0 })
        setPorCliente(clienteData || [])
        setPorProducto(productoData || [])
        setVariacion(variacionData || [])
        setTopChanges(
          (topChangesData || []).map((t) => ({
            ...t,
            clientName: t.clientName || "Cliente desconocido",
            partNumber: t.partNumber || "Producto desconocido",
          })),
        )
        setAsertividad(asertividadData?.percent || 0)
        setProjVsDemand(projVsDemandData || [])
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        if (mounted) {
          setError("Error al cargar los datos del dashboard")
          // Set safe defaults on error
          setKpis({ totalOrdenes: 0, valorTotal: 0 })
          setPorCliente([])
          setPorProducto([])
          setVariacion([])
          setTopChanges([])
          setAsertividad(0)
          setProjVsDemand([])
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadDashboardData()

    return () => {
      mounted = false
    }
  }, [range])

  if (error) {
    return (
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="dashboard-container">
          <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-red-600 mb-4">⚠️ {error}</div>
            <Button onClick={() => window.location.reload()}>Reintentar</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-auto p-6 bg-gray-50">
      <div className="dashboard-container">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Dashboard</h1>
            <p className="text-muted-foreground">Resumen de actividad y métricas clave</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/upload">Subir Forecast</Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/seed">Seed Firebase</Link>
            </Button>
          </div>
        </div>

        {/* KPIs y métricas clave */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Órdenes Procesadas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "—" : kpis.totalOrdenes.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">Total en rango</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Valor Total de Órdenes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{loading ? "—" : `$${kpis.valorTotal.toLocaleString()}`}</div>
              <p className="text-xs text-muted-foreground">Suma del período</p>
            </CardContent>
          </Card>

          <GaugeCard title="Asertividad Forecast" percent={asertividad} />
        </div>

        {/* Órdenes por cliente / producto */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <BarChartCard
            title="Órdenes por Cliente"
            description="Conteo en el período"
            yAxisLabel="# Órdenes"
            data={porCliente}
            barColor="#10b981"
          />
          <BarChartCard
            title="Órdenes por Producto"
            description="Conteo de líneas (en órdenes del período)"
            yAxisLabel="# Líneas"
            data={porProducto}
            barColor="#8b5cf6"
          />
        </div>

        {/* Variación y top cambios */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <LineChartCard title="Variación de Forecast (Cliente)" data={variacion} />
          <TopChangesTable title="Top 5 Cambios de Forecast" rows={topChanges} />
        </div>

        {/* Volumen proyectado vs demandado */}
        <div className="grid gap-6 md:grid-cols-1 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Volumen Proyectado vs Demandado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projVsDemand.length > 0 ? (
                  projVsDemand.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="font-medium">{item.name}</span>
                      <div className="flex gap-4 text-sm">
                        <span className="text-blue-600">Forecast: {item.forecast.toLocaleString()}</span>
                        <span className="text-green-600">Demanda: {item.demand.toLocaleString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    {loading ? "Cargando datos..." : "No hay datos disponibles"}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
