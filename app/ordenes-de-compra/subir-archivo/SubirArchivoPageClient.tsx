"use client"

import dynamic from "next/dynamic"
import { StepNavigation } from "@/components/ordenes-compra/step-navigation"

const SubirArchivoStep = dynamic(() => import("@/components/ordenes-compra/subir-archivo-step"), { ssr: false })

export default function SubirArchivoPageClient() {
  return (
    <div className="container mx-auto py-6 px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Órdenes de Compra</h1>
      </div>

      <StepNavigation currentStep={1} />

      <div className="max-w-4xl mx-auto">
        <SubirArchivoStep />
      </div>
    </div>
  )
}
