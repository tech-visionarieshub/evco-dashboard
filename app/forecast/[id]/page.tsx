"use client"

import { useParams, useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

// Datos de ejemplo para los forecasts
const forecastsData = {
  "f-001": {
    id: "f-001",
    title: "Automotive Inc. - Semanal",
    status: "Completado",
    time: "Hoy, 10:23 AM",
    client: "Automotive Inc.",
    type: "Semanal",
    items: [
      { part: "EVP-2345", evcoNumber: "951801", quantity: 1500, month: "Mayo 2025" },
      { part: "EVP-2346", evcoNumber: "951802", quantity: 2200, month: "Mayo 2025" },
      { part: "EVP-2347", evcoNumber: "951803", quantity: 800, month: "Mayo 2025" },
    ],
  },
  "f-002": {
    id: "f-002",
    title: "TechParts - Releases",
    status: "Completado",
    time: "Hoy, 09:15 AM",
    client: "TechParts",
    type: "Releases",
    items: [
      { part: "EVP-1122", evcoNumber: "951804", quantity: 950, month: "Abril 2025" },
      { part: "EVP-1123", evcoNumber: "951805", quantity: 1200, month: "Abril 2025" },
    ],
  },
  "f-003": {
    id: "f-003",
    title: "MedSupply - Inventario",
    status: "Completado",
    time: "Ayer, 15:45 PM",
    client: "MedSupply",
    type: "Inventario",
    items: [
      { part: "EVP-7890", evcoNumber: "951806", quantity: 3200, month: "Mayo 2025" },
      { part: "EVP-7891", evcoNumber: "951807", quantity: 1800, month: "Mayo 2025" },
    ],
  },
  "f-004": {
    id: "f-004",
    title: "ElectroComp - Diario",
    status: "Completado",
    time: "Ayer, 11:30 AM",
    client: "ElectroComp",
    type: "Diario",
    items: [
      { part: "EVP-5678", evcoNumber: "951808", quantity: 500, month: "Junio 2025" },
      { part: "EVP-5679", evcoNumber: "951809", quantity: 750, month: "Junio 2025" },
    ],
  },
}

export default function ForecastDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const forecast = forecastsData[id as keyof typeof forecastsData]

  if (!forecast) {
    return (
      <div className="flex-1 p-6">
        <div className="mb-6">
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="text-center py-8">
              <h2 className="text-xl font-semibold mb-2">Forecast no encontrado</h2>
              <p className="text-muted-foreground">El forecast que estás buscando no existe o ha sido eliminado.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Encabezado del forecast */}
        <Card>
          <CardHeader>
            <CardTitle>{forecast.title}</CardTitle>
            <CardDescription>
              Procesado: {forecast.time} • Estado: {forecast.status}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Cliente</h3>
                <p className="font-medium">{forecast.client}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Tipo</h3>
                <p className="font-medium">{forecast.type}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Items</h3>
                <p className="font-medium">{forecast.items.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabla de items del forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Detalle de Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium">Número de Parte</th>
                    <th className="text-left py-3 px-4 font-medium">EVCO #</th>
                    <th className="text-right py-3 px-4 font-medium">Cantidad</th>
                    <th className="text-left py-3 px-4 font-medium">Mes</th>
                  </tr>
                </thead>
                <tbody>
                  {forecast.items.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="py-3 px-4">{item.part}</td>
                      <td className="py-3 px-4">{item.evcoNumber}</td>
                      <td className="py-3 px-4 text-right">{item.quantity.toLocaleString()}</td>
                      <td className="py-3 px-4">{item.month}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
