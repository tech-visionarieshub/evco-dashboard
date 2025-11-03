"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Cpu, GitCompare } from "lucide-react"

export type FlowIntention = "client-forecast" | "internal-forecast" | "demand-analysis"

export function IntentionSelector({ onSelect }: { onSelect: (intention: FlowIntention) => void }) {
  return (
    <div className="w-full">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold">¿Qué quieres hacer?</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Selecciona el flujo que necesitas. Todos los datos se normalizan a semanas ISO y pueden persistirse en
          Firebase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Client Forecast */}
        <Card className="border-blue-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base">Analizar Forecast del Cliente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Carga un Excel del cliente (mensual o semanal), normaliza a semanas ISO y compáralo contra histórico.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Origen: Cliente</Badge>
              <Badge variant="outline">Comparación histórica</Badge>
            </div>
            <Button className="w-full mt-1" onClick={() => onSelect("client-forecast")}>
              Comenzar
            </Button>
          </CardContent>
        </Card>

        {/* Internal Forecast */}
        <Card className="border-emerald-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cpu className="h-5 w-5 text-emerald-600" />
              <CardTitle className="text-base">Cargar Pronóstico Interno</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Carga un pronóstico interno ya semanal (YYYY-Www) o mensual para normalizar. Sin comparación con cliente.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Origen: Interno</Badge>
              <Badge variant="outline">Validación semanal</Badge>
            </div>
            <Button className="w-full mt-1" onClick={() => onSelect("internal-forecast")}>
              Comenzar
            </Button>
          </CardContent>
        </Card>

        {/* Demand Analysis */}
        <Card className="border-purple-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <GitCompare className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-base">Análisis de Demanda (Cliente vs Interno)</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Compara lado a lado el forecast del cliente contra el pronóstico interno, por semana ISO.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">Cliente vs Interno</Badge>
              <Badge variant="outline">Variaciones y deltas</Badge>
            </div>
            <Button className="w-full mt-1" onClick={() => onSelect("demand-analysis")}>
              Comenzar
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
