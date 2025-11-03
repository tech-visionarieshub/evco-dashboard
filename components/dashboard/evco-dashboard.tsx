"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { signInAnonymously } from "firebase/auth"
import { auth } from "@/lib/firebase/init-lite"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"

import {
  AlertTriangle,
  Boxes,
  Calendar,
  Package,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Activity,
  PieChart,
  LineChart,
} from "lucide-react"

import { DashboardFilters } from "@/components/dashboard/filters"
import { HorizontalBarsCard } from "@/components/dashboard/horizontal-bars-card"
import { LineChartCard } from "@/components/dashboard/line-chart-card"
import { TopChangesTable } from "@/components/dashboard/top-changes-table"
import { GroupedBarChartCard } from "@/components/dashboard/grouped-bar-chart-card"
import { HeatmapCard } from "@/components/dashboard/heatmap-card"
import { InventoryExcessTable } from "@/components/dashboard/inventory-excess-table"
import { ComplianceTable } from "@/components/dashboard/compliance-table"
import { GaugeCard } from "@/components/dashboard/gauge-card"

import {
  defaultDateRange,
  fetchOrdenesKPIs,
  fetchOrdenesPorCliente,
  fetchOrdenesPorProducto,
  fetchForecastVariation,
  fetchTopForecastChanges,
  fetchAsertividad,
  fetchVolumenProjVsDemand,
  fetchMOQCompliance,
  fetchLeadTimePerformance,
  fetchDeviationHeatmap,
  fetchInventoryExcess,
  type DashboardFilter,
  type SerieItem,
  type LinePoint,
  type TopChange,
} from "@/lib/services/firebase-dashboard"

export default function EVCODashboard() {
  // Auth state
  const [isSignedIn, setIsSignedIn] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)

  // Loading/data state
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filters
  const [filters, setFilters] = useState<DashboardFilter>({
    range: defaultDateRange(90),
    granularity: "week",
    clientIds: [],
    partNumbers: [],
  })

  // Data
  const [kpis, setKpis] = useState<{ totalOrdenes: number; valorTotal: number }>({ totalOrdenes: 0, valorTotal: 0 })
  const [porCliente, setPorCliente] = useState<SerieItem[]>([])
  const [porProducto, setPorProducto] = useState<SerieItem[]>([])
  const [variacion, setVariacion] = useState<LinePoint[]>([])
  const [topChanges, setTopChanges] = useState<TopChange[]>([])
  const [asertividad, setAsertividad] = useState<number>(0)
  const [projVsDemand, setProjVsDemand] = useState<Array<{ name: string; forecast: number; demand: number }>>([])
  const [moqCompliance, setMoqCompliance] = useState<any[]>([])
  const [leadTimePerf, setLeadTimePerf] = useState<any[]>([])
  const [deviationHeatmap, setDeviationHeatmap] = useState<any[]>([])
  const [inventoryExcess, setInventoryExcess] = useState<any[]>([])

  // Derived
  const avgOnTime = useMemo(() => {
    if (!leadTimePerf.length) return 0
    const s = leadTimePerf.reduce((acc: number, r: any) => acc + (r.onTimePercent || 0), 0)
    return Math.round(s / leadTimePerf.length)
  }, [leadTimePerf])

  const excessCount = useMemo(() => inventoryExcess.filter((e: any) => e.isExcess).length, [inventoryExcess])

  const looksEmpty =
    kpis.totalOrdenes === 0 && kpis.valorTotal === 0 && porCliente.length === 0 && porProducto.length === 0

  // Auth like seed
  useEffect(() => {
    async function initAuth() {
      try {
        if (auth.currentUser) {
          setIsSignedIn(true)
          setAuthError(null)
          return
        }
        await signInAnonymously(auth)
        setIsSignedIn(true)
        setAuthError(null)
      } catch (err: any) {
        console.error("Auth error:", err)
        if (err.code === "auth/operation-not-allowed") {
          setAuthError("Autenticación anónima no permitida. Habilítala en Firebase Console.")
        } else {
          setAuthError(`Error de autenticación: ${err.message}`)
        }
        setIsSignedIn(false)
      }
    }
    initAuth()
  }, [])

  async function load() {
    if (!isSignedIn) return
    try {
      setLoading(true)
      setError(null)
      const [kpi, pc, pp, varc, tchg, aser, pvd, moq, lt, dev, inv] = await Promise.all([
        fetchOrdenesKPIs(filters),
        fetchOrdenesPorCliente(filters),
        fetchOrdenesPorProducto(filters),
        fetchForecastVariation("client", 12, filters),
        fetchTopForecastChanges("client", 5, filters),
        fetchAsertividad("client", 12, filters),
        fetchVolumenProjVsDemand(filters),
        fetchMOQCompliance(),
        fetchLeadTimePerformance(),
        fetchDeviationHeatmap(),
        fetchInventoryExcess(),
      ])

      setKpis(kpi)
      setPorCliente(pc)
      setPorProducto(pp)
      setVariacion(varc)
      setTopChanges(tchg)
      setAsertividad(aser.percent)
      setProjVsDemand(pvd)
      setMoqCompliance(moq)
      setLeadTimePerf(lt)
      setDeviationHeatmap(dev)
      setInventoryExcess(inv)
    } catch (e: any) {
      console.error("Error cargando dashboard:", e)
      setError(e?.message || "No se pudieron cargar los datos.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn) load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, JSON.stringify(filters)])

  // UI
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="sticky top-0 z-50 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">{/* Removed Dashboard EVCO and Metrics text */}</div>
            </div>
            <div className="flex items-center gap-3">
              {/* Removed Subir Forecast button */}
              {/* Removed Órdenes button */}
            </div>
          </div>
        </div>

        {/* Enhanced Filters */}
        <div className="border-t border-gray-100 bg-white/60 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-6">
            <DashboardFilters
              value={filters}
              onChange={setFilters}
              onRefresh={load}
              isSignedIn={isSignedIn}
              loading={loading}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {authError && (
          <Alert className="mb-8 border-amber-200 bg-amber-50">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="space-y-3 text-amber-800">
              <div>{authError}</div>
              <div className="text-sm">
                Usa la página de seed para validar configuración:
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-amber-300 text-amber-700 hover:bg-amber-100 bg-transparent"
                    asChild
                  >
                    <Link href="/dashboard/seed">Ir a Seed Dashboard</Link>
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!isSignedIn && !authError ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
              </div>
              <p className="text-lg font-medium text-gray-700">Conectando con Firebase...</p>
              <p className="text-sm text-gray-500">Estableciendo conexión segura</p>
            </div>
          </div>
        ) : loading ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600"></div>
              </div>
              <p className="text-lg font-medium text-gray-700">Cargando dashboard...</p>
              <p className="text-sm text-gray-500">Procesando datos en tiempo real</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex h-96 items-center justify-center">
            <div className="text-center space-y-6 max-w-md">
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Error al cargar datos</h3>
                <p className="text-red-600 mb-4">{error}</p>
              </div>
              <div className="flex items-center justify-center gap-3">
                <Button onClick={load} disabled={!isSignedIn} className="shadow-lg">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Reintentar
                </Button>
                <Button variant="outline" className="shadow-sm bg-transparent" asChild>
                  <Link href="/dashboard/seed">Revisar configuración</Link>
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Enhanced KPIs */}
            <section className="mb-10">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-0 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-blue-700">Total Órdenes</CardTitle>
                    <div className="rounded-lg bg-blue-600 p-2 shadow-md">
                      <Package className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-900">{kpis.totalOrdenes.toLocaleString()}</div>
                    <p className="text-xs text-blue-600 mt-1">Período seleccionado</p>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-emerald-50 to-emerald-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-emerald-700">Valor Total</CardTitle>
                    <div className="rounded-lg bg-emerald-600 p-2 shadow-md">
                      <TrendingUp className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-emerald-900">${kpis.valorTotal.toLocaleString()}</div>
                    <p className="text-xs text-emerald-600 mt-1">Suma del período</p>
                  </CardContent>
                </Card>

                <Card className="border-0 bg-gradient-to-br from-purple-50 to-purple-100 shadow-lg hover:shadow-xl transition-all duration-300">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-semibold text-purple-700">Clientes Activos</CardTitle>
                    <div className="rounded-lg bg-purple-600 p-2 shadow-md">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-purple-900">{porCliente.length}</div>
                    <p className="text-xs text-purple-600 mt-1">Con órdenes en el período</p>
                  </CardContent>
                </Card>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
                  <GaugeCard
                    title="Asertividad Forecast"
                    percent={asertividad}
                    threshold={80}
                    description="% de cumplimiento entre forecast y demanda"
                  />
                </div>
              </div>
            </section>

            <Separator className="my-8 bg-gradient-to-r from-transparent via-gray-300 to-transparent" />

            {/* Enhanced Tabs */}
            <Tabs defaultValue="resumen" className="w-full">
              <TabsList className="grid w-full grid-cols-4 rounded-xl bg-white shadow-lg p-1 border-0">
                <TabsTrigger
                  value="resumen"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <PieChart className="mr-2 h-4 w-4" />
                  Resumen
                </TabsTrigger>
                <TabsTrigger
                  value="forecast"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <LineChart className="mr-2 h-4 w-4" />
                  Forecast
                </TabsTrigger>
                <TabsTrigger
                  value="demanda"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <Activity className="mr-2 h-4 w-4" />
                  Demanda
                </TabsTrigger>
                <TabsTrigger
                  value="inventario"
                  className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-red-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-200"
                >
                  <Boxes className="mr-2 h-4 w-4" />
                  Inventario
                </TabsTrigger>
              </TabsList>

              {/* Resumen Tab */}
              <TabsContent value="resumen" className="mt-8">
                <div className="space-y-8">
                  <div className="grid gap-8 lg:grid-cols-2">
                    <div className="rounded-xl bg-white shadow-lg border-0 overflow-hidden">
                      <HorizontalBarsCard
                        title="Órdenes por cliente"
                        items={porCliente.map((x) => ({ name: x.name, value: x.value, color: "#10b981" }))}
                        description="Clientes con mayor número de órdenes."
                      />
                    </div>
                    <div className="rounded-xl bg-white shadow-lg border-0 overflow-hidden">
                      <HorizontalBarsCard
                        title="Órdenes por producto"
                        items={porProducto.map((x) => ({ name: x.name, value: x.value, color: "#059669" }))}
                        description="Productos más activos por líneas."
                      />
                    </div>
                  </div>

                  {looksEmpty && (
                    <Alert className="border-0 bg-gradient-to-r from-amber-50 to-orange-50 shadow-lg">
                      <AlertTriangle className="h-5 w-5 text-amber-600" />
                      <AlertDescription className="text-amber-800">
                        <div className="space-y-3">
                          <p className="font-medium">No hay datos disponibles</p>
                          <p className="text-sm">
                            Parece que no hay datos de órdenes en el período/cliente seleccionado. Puedes limpiar
                            filtros o cargar datos de prueba.
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-amber-300 text-amber-700 hover:bg-amber-100 shadow-sm bg-transparent"
                            asChild
                          >
                            <Link href="/dashboard/seed">Ir a Seed Dashboard</Link>
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </TabsContent>

              {/* Forecast Tab */}
              <TabsContent value="forecast" className="mt-8">
                <div className="space-y-8">
                  <div className="grid gap-8 lg:grid-cols-2">
                    <div className="rounded-xl bg-white shadow-lg border-0 overflow-hidden">
                      <LineChartCard
                        title="Variación de forecast (últimos periodos)"
                        data={variacion}
                        description="Resaltamos picos cuando la variación entre periodos es ≥30%."
                      />
                    </div>
                    <div className="rounded-xl bg-white shadow-lg border-0 overflow-hidden">
                      <GroupedBarChartCard
                        title="Volumen proyectado vs. demandado (por cliente)"
                        data={projVsDemand.map((d) => ({
                          name: d.name,
                          forecast: d.forecast,
                          demand: d.demand,
                        }))}
                        description="En rojo cuando la diferencia supera 20%."
                      />
                    </div>
                  </div>

                  <div className="rounded-xl bg-white shadow-lg border-0 overflow-hidden">
                    <TopChangesTable
                      title="Top 5 cambios de forecast (clientes/productos)"
                      rows={topChanges}
                      description="Colores rojo/amarillo según magnitud del cambio."
                    />
                  </div>

                  <div className="rounded-xl bg-white shadow-lg border-0 overflow-hidden">
                    <HeatmapCard
                      title="Desviación forecast vs. demanda (por producto)"
                      data={deviationHeatmap}
                      description="Colores representan niveles de desviación por periodo."
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Demanda Tab */}
              <TabsContent value="demanda" className="mt-8">
                <div className="space-y-8">
                  <div className="grid gap-8 lg:grid-cols-2">
                    <div className="rounded-xl bg-white shadow-lg border-0 overflow-hidden">
                      <ComplianceTable
                        title="Cumplimiento de MOQs"
                        type="moq"
                        rows={moqCompliance.map((r: any) => ({
                          clientName: r.clientName,
                          partNumber: r.partNumber,
                          compliancePercent: r.compliancePercent,
                          totalOrders: r.totalOrders,
                          compliantOrders: r.compliantOrders,
                        }))}
                        description="Resaltamos incumplimientos por debajo de umbrales."
                      />
                    </div>

                    <div className="space-y-6">
                      <Card className="border-0 bg-gradient-to-br from-indigo-50 to-indigo-100 shadow-lg">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-semibold text-indigo-700">
                            Entregas a tiempo (promedio)
                          </CardTitle>
                          <div className="rounded-lg bg-indigo-600 p-2 shadow-md">
                            <Target className="h-4 w-4 text-white" />
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className={`text-3xl font-bold ${avgOnTime < 80 ? "text-red-600" : "text-indigo-900"}`}>
                            {avgOnTime}%
                          </div>
                          <p className="text-xs text-indigo-600 mt-1">Promedio por cliente</p>
                        </CardContent>
                      </Card>

                      <div className="rounded-xl bg-white shadow-lg border-0 overflow-hidden">
                        <ComplianceTable
                          title="Pedidos dentro del lead time (por cliente)"
                          type="leadtime"
                          rows={leadTimePerf.map((r: any) => ({
                            clientName: r.clientName,
                            compliancePercent: r.onTimePercent,
                            totalOrders: r.totalShipments,
                            compliantOrders: r.onTimeShipments,
                          }))}
                          description="Clientes marcados cuando el % de cumplimiento es bajo."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Inventario Tab */}
              <TabsContent value="inventario" className="mt-8">
                <div className="space-y-8">
                  <div className="grid gap-8 lg:grid-cols-2">
                    <Card className="border-0 bg-gradient-to-br from-red-50 to-red-100 shadow-lg hover:shadow-xl transition-all duration-300">
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-semibold text-red-700">Productos en excedente</CardTitle>
                        <div className="rounded-lg bg-red-600 p-2 shadow-md">
                          <Boxes className="h-4 w-4 text-white" />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className={`text-3xl font-bold ${excessCount > 0 ? "text-red-900" : "text-gray-600"}`}>
                          {excessCount.toLocaleString()}
                        </div>
                        <p className="text-xs text-red-600 mt-1">Marcados como excedente &gt; 6 semanas</p>
                      </CardContent>
                    </Card>

                    <div className="rounded-xl bg-white shadow-lg border-0 overflow-hidden">
                      <InventoryExcessTable
                        title="Inventario excedente (por producto)"
                        rows={inventoryExcess}
                        description="Resaltamos en naranja/rojo según severidad de excedente."
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Enhanced Footer */}
            <div className="mt-12 rounded-xl bg-white/60 backdrop-blur-sm p-6 shadow-lg border-0">
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <Badge variant="outline" className="bg-white shadow-sm">
                    {filters?.granularity === "week"
                      ? "Semanal"
                      : filters?.granularity === "month"
                        ? "Mensual"
                        : filters?.granularity === "quarter"
                          ? "Trimestral"
                          : "Anual"}
                  </Badge>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <span>
                  Período: {filters?.range?.start?.slice(0, 10) || "—"} {"→"} {filters?.range?.end?.slice(0, 10) || "—"}
                </span>
                {filters.clientIds && filters.clientIds.length > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                      {filters.clientIds.length} cliente{filters.clientIds.length !== 1 ? "s" : ""} seleccionado
                      {filters.clientIds.length !== 1 ? "s" : ""}
                    </Badge>
                  </>
                )}
                {filters.partNumbers && filters.partNumbers.length > 0 && (
                  <>
                    <Separator orientation="vertical" className="h-4" />
                    <Badge variant="secondary" className="bg-green-100 text-green-700">
                      {filters.partNumbers.length} producto{filters.partNumbers.length !== 1 ? "s" : ""} seleccionado
                      {filters.partNumbers.length !== 1 ? "s" : ""}
                    </Badge>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
