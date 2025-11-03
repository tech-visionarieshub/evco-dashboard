"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Check, ArrowLeft, Send } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

type Props = {
  formData: any
  setCurrentStep?: (step: string) => void
  previewData: any[]
  detectedFormat: string | null
  detectedYear: number | null
  detectedDate: string | null
}

export function ConfirmationScreen({
  formData,
  setCurrentStep,
  previewData,
  detectedFormat,
  detectedYear,
  detectedDate,
}: Props) {
  const { toast } = useToast()
  const [submitting, setSubmitting] = useState(false)

  const totalRows = previewData?.length || 0
  const sourceLabel = formData?.source === "internal" ? "Interno" : "Cliente"
  const natureLabel = formData?.forecastNature === "correction" ? "Corrección" : "Nuevo Forecast"

  const handleBack = () => setCurrentStep?.("comparison")
  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Aquí más adelante haremos la persistencia (Firebase Storage + Firestore)
      await new Promise((r) => setTimeout(r, 600))
      toast({
        title: "Forecast enviado",
        description: "Se ha iniciado el proceso de persistencia en Firebase.",
      })
    } catch (e) {
      toast({
        title: "Error",
        description: "No se pudo enviar el forecast.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmar y Enviar</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="outline">Origen: {sourceLabel}</Badge>
          <Badge variant="outline">Cliente: {formData?.client || formData?.clientId || "—"}</Badge>
          {detectedFormat && <Badge variant="secondary">Formato detectado: {detectedFormat}</Badge>}
          {detectedDate && <Badge variant="secondary">Período: {detectedDate}</Badge>}
          {typeof detectedYear === "number" && <Badge variant="secondary">Año: {detectedYear}</Badge>}
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 rounded-md border">
            <div className="text-muted-foreground">Naturaleza</div>
            <div className="font-medium">{natureLabel}</div>
          </div>
          <div className="p-3 rounded-md border">
            <div className="text-muted-foreground">Archivo</div>
            <div className="font-medium">{formData?.fileName || "—"}</div>
          </div>
          <div className="p-3 rounded-md border">
            <div className="text-muted-foreground">Filas detectadas</div>
            <div className="font-medium">{totalRows.toLocaleString()}</div>
          </div>
        </div>

        <div className="rounded-md border p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2 mb-1">
            <Check className="h-3.5 w-3.5 text-emerald-600" />
            <span>Resumen</span>
          </div>
          <ul className="list-disc pl-5 space-y-1">
            <li>{"Las cantidades se normalizarán a semanas ISO al persistir."}</li>
            <li>{"Se registrará el origen y la versión correspondiente."}</li>
            <li>{"Se guardarán metadatos del archivo para trazabilidad."}</li>
          </ul>
        </div>

        <div className="flex items-center justify-between">
          <Button variant="outline" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Atrás
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Enviando..." : "Enviar pronóstico"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default ConfirmationScreen
