import { FormularioGlobalStep } from "@/components/ordenes-compra/formulario-global-step"
import { StepNavigation } from "@/components/ordenes-compra/step-navigation"

export const metadata = {
  title: "Formulario Global - Órdenes de Compra | EVCO",
  description: "Valida y edita la información extraída de las órdenes de compra",
}

export default function FormularioGlobalPage() {
  return (
    <div className="container mx-auto py-6 px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Órdenes de Compra</h1>
      </div>

      <StepNavigation currentStep={2} />

      <div className="max-w-6xl mx-auto">
        <FormularioGlobalStep />
      </div>
    </div>
  )
}
