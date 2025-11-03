import type { OrdenCompra, LineaOrdenCompra } from "@/lib/types/orden-compra"
import { generarIdUnico } from "@/lib/utils"

// Simulador de procesamiento de IA para órdenes de compra
export function procesarOrdenCompraConIA(
  tipo: "pdf" | "texto",
  contenido: string,
  index = 0,
): { orden: OrdenCompra; lineas: LineaOrdenCompra[] } {
  // En un caso real, aquí se enviaría el contenido a un servicio de IA
  // Para la simulación, vamos a devolver datos basados en el ejemplo proporcionado
  // y variamos algunos datos según el índice para simular diferentes órdenes

  // Simular que encontramos datos específicos basados en el ejemplo
  const ordenId = generarIdUnico()

  // Generar datos variados según el índice
  const clientes = ["Manitowoc FSG Manufactura", "Manitowoc Foodservice", "Welbilt Inc.", "Enodis Corporation"]

  const poNumbers = ["228976", "228977", "228978", "228979"]

  const fechas = [new Date("2025-03-20"), new Date("2025-03-22"), new Date("2025-03-25"), new Date("2025-03-28")]

  const clienteIndex = index % clientes.length

  // Datos de la orden
  const orden: OrdenCompra = {
    id: ordenId,
    customerId: clientes[clienteIndex],
    poNumber: poNumbers[clienteIndex],
    fechaOrden: fechas[clienteIndex].toISOString(),
    canalRecepcion: "Correo",
    shipTo:
      "Manitowoc FSG Manufactura S. de R.L., FFCC a Tampico # 1601, Parque Industrial Finsa Gpe, Guadalupe, Nuevo Leon, 67132, Mexico",
    observaciones: `BLANKET PO RELEASE FOR SHIPMENT OF GOODS - Batch ${index + 1}`,
    tipoOrden: "Exportación",
    fechaCreacion: new Date().toISOString(),
    estado: "Pendiente",
    lineas: [],
    archivoOriginal: tipo === "pdf" ? contenido : "Texto pegado",
    totalLineas: 2,
    ultimaModificacion: new Date().toISOString(),
    editadaDespuesDeExportar: false,
    confianzaExtraccion: 0.87, // Nivel de confianza simulado de la IA
  }

  // Líneas de productos
  const lineas: LineaOrdenCompra[] = [
    {
      id: generarIdUnico(),
      numeroParteCLiente: "3006963",
      numeroParteEVCO: "953102",
      descripcion: "DISTRIBUTION TUBE ASSY 30 IN",
      cantidad: 4050 + index * 100,
      precio: 5.24,
      fechaEntrega: new Date("2025-04-30").toISOString(),
      unidad: "EACH",
      estado: "valida",
      confianzaExtraccion: 0.92,
    },
    {
      id: generarIdUnico(),
      numeroParteCLiente: "3006973",
      numeroParteEVCO: "953101",
      descripcion: "DISTRIBUTION TUBE ASSY 22 IN",
      cantidad: 2025 + index * 50,
      precio: 4.3,
      fechaEntrega: new Date("2025-04-25").toISOString(),
      unidad: "EACH",
      estado: "valida",
      confianzaExtraccion: 0.89,
    },
  ]

  return { orden, lineas }
}
