"use client"

import type React from "react"
import { useCallback, useMemo, useState } from "react"
import * as XLSX from "xlsx"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, Info, ArrowLeft, ArrowRight, Check } from "lucide-react"
import { normalizeWeeklyRows, normalizeMonthlyRows } from "@/lib/forecast-normalization"

type NormalizedRow = {
  clientId: string
  partId: string
  periodKey: string
  qty: number
}

type ComparisonRow = {
  key: string
  clientId: string
  partId: string
  periodKey: string
  clientQty: number
  internalQty: number
  delta: number
  deltaPct: number | null
}

export function DemandAnalysisScreen({
  onBack,
  onContinue,
}: {
  onBack: () => void
  onContinue: (payload: {
    clientRows: NormalizedRow[]
    internalRows: NormalizedRow[]
    comparison: ComparisonRow[]
  }) => void
}) {
  const [clientFile, setClientFile] = useState<File | null>(null)
  const [internalFile, setInternalFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientRows, setClientRows] = useState<NormalizedRow[]>([])
  const [internalRows, setInternalRows] = useState<NormalizedRow[]>([])
  const [comparison, setComparison] = useState<ComparisonRow[]>([])
  const [activeTab, setActiveTab] = useState<"client" | "internal" | "comparison">("comparison")
  const [detectedYear, setDetectedYear] = useState<number | null>(null)
  const [ready, setReady] = useState(true)

  const handleFileChange = (side: "client" | "internal") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null
    if (side === "client") setClientFile(f)
    else setInternalFile(f)
  }

  const readFileAsJson = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          if (!data) return reject(new Error("No se pudo leer el archivo"))
          const workbook = XLSX.read(data, { type: "binary" })
          const sheet = workbook.Sheets[workbook.SheetNames[0]]
          resolve(XLSX.utils.sheet_to_json(sheet))
        } catch (err) {
          reject(err)
        }
      }
      reader.onerror = reject
      reader.readAsBinaryString(file)
    })
  }

  const detectFormat = (rows: any[]) => {
    if (!rows || rows.length === 0) return { type: "unknown" as const, year: null as number | null }
    const keys = Object.keys(rows[0]).map((k) => k.toLowerCase())
    const hasWeekly = keys.some((k) => /^wk[_\s-]*\d{1,2}$/.test(k))
    const hasMonthly = keys.some((k) => /^\d{2}-\d{4}$/.test(k))
    if (hasWeekly) return { type: "weekly" as const, year: new Date().getFullYear() }
    if (hasMonthly) {
      const month = keys.find((k) => /^\d{2}-\d{4}$/.test(k))!
      const [, y] = month.split("-")
      return { type: "monthly" as const, year: Number(y) || null }
    }
    // Internal weekly by periodKey
    const hasPeriodKey = keys.includes("periodkey")
    if (hasPeriodKey) return { type: "weekly-by-key" as const, year: null }
    return { type: "unknown" as const, year: null }
  }

  const normalize = (rows: any[], detected: ReturnType<typeof detectFormat>): NormalizedRow[] => {
    if (detected.type === "weekly") return normalizeWeeklyRows(rows, detected.year || undefined)
    if (detected.type === "monthly") return normalizeMonthlyRows(rows)
    if (detected.type === "weekly-by-key") {
      // Expect rows with { clientId, partId, periodKey, qty }
      return rows
        .map((r) => ({
          clientId: String(r.clientId ?? r.custId ?? "").trim(),
          partId: String(r.partId ?? r.part ?? r["Part #"] ?? "").trim(),
          periodKey: String(r.periodKey ?? "").trim(),
          qty: Number(r.qty ?? 0) || 0,
        }))
        .filter((r) => r.clientId && r.partId && r.periodKey)
    }
    // Unknown: return empty
    return []
  }

  const buildComparison = (client: NormalizedRow[], internal: NormalizedRow[]): ComparisonRow[] => {
    const map = new Map<string, ComparisonRow>()
    const add = (r: NormalizedRow, side: "client" | "internal") => {
      const key = `${r.clientId}|${r.partId}|${r.periodKey}`
      const prev = map.get(key) || {
        key,
        clientId: r.clientId,
        partId: r.partId,
        periodKey: r.periodKey,
        clientQty: 0,
        internalQty: 0,
        delta: 0,
        deltaPct: null as number | null,
      }
      if (side === "client") prev.clientQty += r.qty
      else prev.internalQty += r.qty
      prev.delta = prev.clientQty - prev.internalQty
      prev.deltaPct = prev.internalQty === 0 ? (prev.clientQty === 0 ? 0 : 100) : (prev.delta / prev.internalQty) * 100
      map.set(key, prev)
    }
    client.forEach((r) => add(r, "client"))
    internal.forEach((r) => add(r, "internal"))
    return Array.from(map.values()).sort((a, b) => a.key.localeCompare(b.key))
  }

  const processBoth = useCallback(async () => {
    if (!clientFile || !internalFile) return

    setIsProcessing(true)
    try {
      const [clientJson, internalJson] = await Promise.all([readFileAsJson(clientFile), readFileAsJson(internalFile)])

      const clientDetected = detectFormat(clientJson)
      const internalDetected = detectFormat(internalJson)
      if (clientDetected.year) setDetectedYear(clientDetected.year)

      const clientNorm = normalize(clientJson, clientDetected)
      const internalNorm = normalize(internalJson, internalDetected)
      const comp = buildComparison(clientNorm, internalNorm)

      setClientRows(clientNorm)
      setInternalRows(internalNorm)
      setComparison(comp)
      setActiveTab("comparison")
      setReady(true)
    } catch (err) {
      console.error("Error procesando archivos:", err)
      setReady(false)
    } finally {
      setIsProcessing(false)
    }
  }, [clientFile, internalFile])

  const totals = useMemo(() => {
    const clientTotal = clientRows.reduce((s, r) => s + r.qty, 0)
    const internalTotal = internalRows.reduce((s, r) => s + r.qty, 0)
    const delta = clientTotal - internalTotal
    const deltaPct = internalTotal === 0 ? (clientTotal === 0 ? 0 : 100) : (delta / internalTotal) * 100
    return { clientTotal, internalTotal, delta, deltaPct }
  }, [clientRows, internalRows])

  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">Análisis de Demanda: Cliente vs Interno</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Sube los dos archivos, normalizamos por semanas ISO y mostramos diferencias por cliente/parte/semana.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Archivo del Cliente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label className="text-sm">Excel (.xlsx) mensual o semanal</Label>
            <div className="flex items-center gap-3">
              <Input type="file" accept=".xlsx" onChange={handleFileChange("client")} />
              {clientFile && <Badge variant="secondary">{clientFile.name}</Badge>}
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle className="text-sm">Formato admitido</AlertTitle>
              <AlertDescription className="text-xs">
                Mensual (MM-YYYY) o semanal (WK_01..WK_52). Se normaliza a semanas ISO.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pronóstico Interno</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Label className="text-sm">Excel (.xlsx) semanal preferido</Label>
            <div className="flex items-center gap-3">
              <Input type="file" accept=".xlsx" onChange={handleFileChange("internal")} />
              {internalFile && <Badge variant="secondary">{internalFile.name}</Badge>}
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle className="text-sm">Formato admitido</AlertTitle>
              <AlertDescription className="text-xs">
                Preferido: periodKey=YYYY-Www, qty. Alternativo: semanal (WK_XX) o mensual (MM-YYYY).
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={processBoth} disabled={!clientFile || !internalFile || isProcessing} className="gap-2">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {isProcessing ? "Procesando..." : "Procesar archivos"}
        </Button>
      </div>

      {(clientRows.length > 0 || internalRows.length > 0) && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Resultados normalizados y comparación</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Cliente: {clientRows.length} filas</Badge>
                <Badge variant="outline">Interno: {internalRows.length} filas</Badge>
                <Badge variant="secondary">
                  Totales Δ: {totals.delta.toLocaleString()} ({totals.deltaPct.toFixed(1)}%)
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
              <TabsList className="mb-3">
                <TabsTrigger value="comparison">Comparación</TabsTrigger>
                <TabsTrigger value="client">Normalizado Cliente</TabsTrigger>
                <TabsTrigger value="internal">Normalizado Interno</TabsTrigger>
              </TabsList>

              <TabsContent value="comparison">
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto max-h-[420px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Parte</TableHead>
                          <TableHead>Semana</TableHead>
                          <TableHead className="text-right">Cliente Qty</TableHead>
                          <TableHead className="text-right">Interno Qty</TableHead>
                          <TableHead className="text-right">Δ</TableHead>
                          <TableHead className="text-right">Δ%</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {comparison.slice(0, 1000).map((r) => (
                          <TableRow key={r.key}>
                            <TableCell>{r.clientId}</TableCell>
                            <TableCell>{r.partId}</TableCell>
                            <TableCell>{r.periodKey}</TableCell>
                            <TableCell className="text-right">{r.clientQty.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{r.internalQty.toLocaleString()}</TableCell>
                            <TableCell className="text-right">{r.delta.toLocaleString()}</TableCell>
                            <TableCell className="text-right">
                              {r.deltaPct === null ? "—" : `${r.deltaPct.toFixed(1)}%`}
                            </TableCell>
                          </TableRow>
                        ))}
                        {comparison.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                              No hay datos para mostrar aún.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Mostrando hasta 1000 filas. Usa filtros adicionales si los necesitas en versiones posteriores.
                </p>
              </TabsContent>

              <TabsContent value="client">
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto max-h-[360px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Parte</TableHead>
                          <TableHead>Semana</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {clientRows.slice(0, 1000).map((r, i) => (
                          <TableRow key={`${r.clientId}|${r.partId}|${r.periodKey}|${i}`}>
                            <TableCell>{r.clientId}</TableCell>
                            <TableCell>{r.partId}</TableCell>
                            <TableCell>{r.periodKey}</TableCell>
                            <TableCell className="text-right">{r.qty.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="internal">
                <div className="border rounded-md overflow-hidden">
                  <div className="overflow-x-auto max-h-[360px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Cliente</TableHead>
                          <TableHead>Parte</TableHead>
                          <TableHead>Semana</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {internalRows.slice(0, 1000).map((r, i) => (
                          <TableRow key={`${r.clientId}|${r.partId}|${r.periodKey}|${i}`}>
                            <TableCell>{r.clientId}</TableCell>
                            <TableCell>{r.partId}</TableCell>
                            <TableCell>{r.periodKey}</TableCell>
                            <TableCell className="text-right">{r.qty.toLocaleString()}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-between mt-4">
              <Button variant="outline" onClick={onBack} className="gap-2 bg-transparent">
                <ArrowLeft className="h-4 w-4" />
                Volver
              </Button>
              <Button
                onClick={() => onContinue({ clientRows, internalRows, comparison })}
                disabled={comparison.length === 0}
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!clientFile && !internalFile && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Análisis de Demanda (Cliente vs Interno)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Esta pantalla permitirá cargar/seleccionar ambos orígenes para comparar por semana ISO. Próxima iteración:
              normalización lado a lado, variaciones y exportación.
            </p>

            <div className="rounded-md border p-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-700">
                <Check className="h-4 w-4" />
                <span>Base lista para continuar.</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" onClick={onBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Atrás
              </Button>
              <Button onClick={onContinue} disabled={!ready}>
                Continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default DemandAnalysisScreen
