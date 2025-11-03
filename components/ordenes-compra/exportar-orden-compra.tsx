"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResumenOrden } from "./resumen-orden"
import { TablaExportacion } from "./tabla-exportacion"
import { StepNavigation } from "./step-navigation"
import type { OrdenCompra } from "@/lib/types/orden-compra"
import { PDFEjemploGenerador } from "./pdf-ejemplo-generador"

interface ExportarOrdenCompraProps {
  orden: OrdenCompra
  onExportar: (orden: OrdenCompra) => void
  onVolver: () => void
}

export function ExportarOrdenCompra({ orden: ordenInicial, onExportar, onVolver }: ExportarOrdenCompraProps) {
  const [orden, setOrden] = useState<OrdenCompra>(ordenInicial)
  const [activeTab, setActiveTab] = useState("resumen")
  const [showPreview, setShowPreview] = useState(false)

  const handleExportar = () => {
    onExportar({
      ...orden,
      archivoGenerado: `OC_${orden.poNumber}_${new Date().toISOString().split("T")[0]}.pdf`,
      ultimaModificacion: new Date().toISOString(),
      editadaDespuesDeExportar: false,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Exportar Orden de Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Revisa la información de la orden de compra antes de exportarla. La orden se generará en formato PDF.
          </p>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="resumen">Resumen de la Orden</TabsTrigger>
              <TabsTrigger value="exportacion">Detalles de Exportación</TabsTrigger>
              {showPreview && <TabsTrigger value="preview">Vista Previa</TabsTrigger>}
            </TabsList>

            <TabsContent value="resumen">
              <ResumenOrden orden={orden} readOnly />
              <div className="mt-4 flex justify-end">
                <Button variant="outline" size="sm" onClick={() => setActiveTab("exportacion")}>
                  Ver Detalles de Exportación
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="exportacion">
              <TablaExportacion orden={orden} />
              <div className="mt-4 flex justify-between">
                <Button variant="outline" size="sm" onClick={() => setActiveTab("resumen")}>
                  Ver Resumen
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowPreview(true)
                    setActiveTab("preview")
                  }}
                >
                  Vista Previa
                </Button>
              </div>
            </TabsContent>

            {showPreview && (
              <TabsContent value="preview">
                <div className="border rounded-md p-4">
                  <PDFEjemploGenerador orden={orden} />
                </div>
                <div className="mt-4 flex justify-start">
                  <Button variant="outline" size="sm" onClick={() => setActiveTab("exportacion")}>
                    Volver a Detalles
                  </Button>
                </div>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <StepNavigation
        onBack={onVolver}
        onNext={handleExportar}
        nextLabel="Exportar Orden"
        nextDisabled={orden.estado !== "Validada"}
      />
    </div>
  )
}
