"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Check, CircleDot } from "lucide-react"
import { cn } from "@/lib/utils"

export type Step = {
  id: number
  name: string
  path: string
}

const steps: Step[] = [
  { id: 1, name: "Subir archivo", path: "/ordenes-de-compra/subir-archivo" },
  { id: 2, name: "Formulario global", path: "/ordenes-de-compra/formulario-global" },
  { id: 3, name: "Confirmar orden", path: "/ordenes-de-compra/confirmar-orden" },
]

interface StepNavigationProps {
  currentStep: number
  ordenId?: string | null
}

export function StepNavigation({ currentStep, ordenId }: StepNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [maxCompletedStep, setMaxCompletedStep] = useState(0)

  useEffect(() => {
    // Recuperar el progreso máximo del localStorage
    if (ordenId) {
      try {
        const progress = localStorage.getItem(`orden-progress-${ordenId}`)
        if (progress) {
          const progressNum = Number.parseInt(progress, 10)
          if (!isNaN(progressNum)) {
            setMaxCompletedStep(progressNum)
          }
        }
      } catch (error) {
        console.error("Error al recuperar progreso:", error)
      }
    }
  }, [ordenId])

  useEffect(() => {
    // Guardar el progreso actual en localStorage si es mayor que el máximo anterior
    if (ordenId && currentStep > maxCompletedStep) {
      try {
        localStorage.setItem(`orden-progress-${ordenId}`, currentStep.toString())
        setMaxCompletedStep(currentStep)
      } catch (error) {
        console.error("Error al guardar progreso:", error)
      }
    }
  }, [currentStep, maxCompletedStep, ordenId])

  const handleStepClick = (step: Step) => {
    // Solo permitir navegación a pasos completados o al paso actual
    if (step.id <= maxCompletedStep + 1) {
      // Si el paso tiene un ID de orden asociado, incluirlo en la URL
      const url = ordenId ? `${step.path}?id=${ordenId}` : step.path
      router.push(url)
    }
  }

  return (
    <div className="w-full mb-8 px-2">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center">
            {/* Paso */}
            <div
              className={cn(
                "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                step.id < currentStep
                  ? "bg-green-100 border-green-500 text-green-500 cursor-pointer"
                  : step.id === currentStep
                    ? "bg-blue-100 border-blue-500 text-blue-500"
                    : "bg-gray-100 border-gray-300 text-gray-400",
                step.id <= maxCompletedStep + 1 ? "cursor-pointer" : "cursor-not-allowed",
              )}
              onClick={() => handleStepClick(step)}
              title={step.id <= maxCompletedStep + 1 ? step.name : "Complete los pasos anteriores primero"}
            >
              {step.id < currentStep ? (
                <Check className="w-5 h-5" />
              ) : step.id === currentStep ? (
                <CircleDot className="w-5 h-5" />
              ) : (
                step.id
              )}
            </div>

            {/* Nombre del paso */}
            <span
              className={cn(
                "ml-2 text-sm font-medium hidden sm:block",
                step.id < currentStep ? "text-green-500" : step.id === currentStep ? "text-blue-500" : "text-gray-400",
              )}
            >
              {step.name}
            </span>

            {/* Línea conectora */}
            {index < steps.length - 1 && (
              <div className={cn("flex-1 h-0.5 mx-4", step.id < currentStep ? "bg-green-500" : "bg-gray-300")}></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
