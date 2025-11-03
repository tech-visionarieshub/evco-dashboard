"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResumenOrden } from "./resumen-orden"
import { TablaOrdenCompra } from "./tabla-orden-compra"
import { StepNavigation } from "./step-navigation"
import type { OrdenCompra, LineaOrdenCompra } from "@/lib/types/orden-compra"
import { v4 as uuidv4 } from "uuid"

interface ValidarOrdenCompraProps {
  orden: OrdenCompra
  onValidar: (orden: OrdenCompra) => void
  onRechazar: (orden: OrdenCompra) => void
  onVolver: () => void
}

export function ValidarOrdenCompra({ orden: ordenInicial, onValidar, onRechazar, onVolver }: ValidarOrdenCompraProps) {
  const [orden, setOrden] = useState<OrdenCompra>(ordenInicial)
  const [activeTab, setActiveTab] = useState("lineas")
  const [lineasValidas, setLineasValidas] = useState(false)

  // Validar líneas cuando cambian
  useEffect(() => {
    const todasValidas = orden.lineas.every((linea) => linea.estado !== "error")
    setLineasValidas(todasValidas)
  }, [orden.lineas])

  const handleEditarLinea = (lineaEditada: LineaOrdenCompra) => {
    setOrden((prevOrden) => ({
      ...prevOrden,
      lineas: prevOrden.lineas.map((linea) => (linea.id === lineaEditada.id ? lineaEditada : linea)),
    }))
  }

  const handleEliminarLinea = (id: string) => {
    setOrden((prevOrden) => ({
      ...prevOrden,
      lineas: prevOrden.lineas.filter((linea) => linea.id !== id),
    }))
  }

  const handleAgregarLinea = (nuevaLinea: LineaOrdenCompra) => {
    setOrden((prevOrden) => ({
      ...prevOrden,
      lineas: [...prevOrden.lineas, { ...nuevaLinea, id: uuidv4() }],
    }))
  }

  const handleValidar = () => {
    onValidar({
      ...orden,
      estado: "Validada",
      ultimaModificacion: new Date().toISOString(),
    })
  }

  const handleRechazar = () => {
    onRechazar({
      ...orden,
      estado: "Rechazada",
      ultimaModificacion: new Date().toISOString(),
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Validar Orden de Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Revisa y valida la información de la orden de compra. Puedes editar las líneas si es necesario.
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="lineas">Líneas de la Orden</TabsTrigger>
              <TabsTrigger value="resumen">Resumen de la Orden</TabsTrigger>
            </TabsList>

            <TabsContent value="lineas">
              <TablaOrdenCompra
                lineas={orden.lineas}
                onEditarLinea={handleEditarLinea}
                onEliminarLinea={handleEliminarLinea}
              />
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setActiveTab("resumen")}>
                  Ver Resumen
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="resumen">
              <ResumenOrden orden={orden} onAgregarLinea={handleAgregarLinea} onEditarLinea={handleEditarLinea} />
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setActiveTab("lineas")}>
                  Ver Líneas
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <StepNavigation
        onBack={onVolver}
        onNext={handleValidar}
        nextLabel="Validar Orden"
        nextDisabled={!lineasValidas}
        alternativeAction={
          <Button variant="destructive" onClick={handleRechazar}>
            Rechazar Orden
          </Button>
        }
      />
    </div>
  )
}
