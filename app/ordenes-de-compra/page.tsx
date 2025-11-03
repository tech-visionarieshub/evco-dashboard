import Link from "next/link"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Órdenes de Compra | EVCO",
  description: "Sube y valida órdenes de compra para procesamiento",
}

export default function OrdenesDeCompraPage() {
  return (
    <div className="container mx-auto py-6 px-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Gestión de Órdenes de Compra</h1>
        <Button asChild>
          <Link href="/ordenes-de-compra/historial">Ver Historial</Link>
        </Button>
      </div>

      <div className="max-w-4xl mx-auto text-center space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Crear Nueva Orden de Compra</h2>
          <p className="text-gray-600">
            Procesa tus órdenes de compra de manera inteligente con nuestro sistema de IA. Sube archivos o ingresa texto
            manualmente para extraer información automáticamente.
          </p>
        </div>

        <div className="flex justify-center gap-4">
          <Button asChild size="lg">
            <Link href="/ordenes-de-compra/subir-archivo">Comenzar Nueva Orden</Link>
          </Button>
          <Button variant="outline" asChild size="lg">
            <Link href="/ordenes-de-compra/historial">Ver Historial</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">1. Subir Archivo</h3>
            <p className="text-sm text-gray-600">
              Sube archivos PDF, imágenes o documentos, o ingresa texto manualmente
            </p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">2. Formulario Global</h3>
            <p className="text-sm text-gray-600">Revisa y edita la información extraída por IA</p>
          </div>
          <div className="p-6 border rounded-lg">
            <h3 className="font-semibold mb-2">3. Confirmar Orden</h3>
            <p className="text-sm text-gray-600">Confirma y exporta las órdenes validadas en formato CSV</p>
          </div>
        </div>
      </div>
    </div>
  )
}
