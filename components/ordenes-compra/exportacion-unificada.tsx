// components/ordenes-compra/exportacion-unificada.tsx

// Asegurarse de que los números de EVCO no tengan comas al exportar

// Buscar donde se formatean los datos para exportación y asegurarse de que los números de EVCO no tengan comas:
// Si hay código como:
// const rows = ordenes.flatMap((orden) =>
//   orden.lineas.map((linea) => [
//     orden.cliente,
//     orden.numeroOrden,
//     orden.fechaOrden,
//     linea.skuCliente,
//     linea.skuEvco.toString().replace(/,/g, ''), // Asegurar que no haya comas
//     // ...resto de campos
//   ]),
// );

// This is a placeholder file.  A real implementation would need to be provided
// based on the specific requirements of the application.  The above comments
// indicate the general area where the update should be applied, assuming
// the code involves processing 'ordenes' and their 'lineas' to generate
// data for export.

// Example structure (replace with actual implementation):

interface Orden {
  cliente: string
  numeroOrden: string
  fechaOrden: string
  lineas: Linea[]
}

interface Linea {
  skuCliente: string
  skuEvco: number
  // ... other fields
}

const exportacionUnificada = (ordenes: Orden[]) => {
  const rows = ordenes.flatMap((orden) =>
    orden.lineas.map((linea) => [
      orden.cliente,
      orden.numeroOrden,
      orden.fechaOrden,
      linea.skuCliente,
      linea.skuEvco
        .toString()
        .replace(/,/g, ""), // Asegurar que no haya comas
      // ...resto de campos
    ]),
  )

  // Further processing to generate the export file (e.g., CSV)
  // would go here.  This is just a placeholder.

  return rows // Or the generated file
}

export default exportacionUnificada
