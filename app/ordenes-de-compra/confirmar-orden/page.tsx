import { ConfirmarOrdenStep } from "@/components/ordenes-compra/confirmar-orden-step"
import { StepNavigation } from "@/components/ordenes-compra/step-navigation"

export const metadata = {
  title: "Confirmar Orden - Órdenes de Compra | EVCO",
  description: "Confirma y exporta las órdenes de compra validadas",
}

export default function ConfirmarOrdenPage() {
  return (
    <div className="container mx-auto py-6 px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Órdenes de Compra</h1>
      </div>

      <StepNavigation currentStep={3} />

      <div className="max-w-6xl mx-auto">
        <ConfirmarOrdenStep />
      </div>
    </div>
  )
}
