"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { OrdenCompra } from "@/lib/types/orden-compra"

type PrevisualizarContenidoProps = {
  data: OrdenCompra[]
  className?: string
}

export function PrevisualizarContenido({ data, className = "" }: PrevisualizarContenidoProps) {
  if (!data || data.length === 0) {
    return <div className="text-center p-4 text-gray-500">No hay datos para mostrar</div>
  }

  // Obtener todas las columnas posibles de los datos
  const allColumns = new Set<string>()
  data.forEach((item) => {
    Object.keys(item).forEach((key) => allColumns.add(key))
  })

  // Filtrar columnas que solo contienen ceros
  const columnsToShow = Array.from(allColumns).filter((column) => {
    // No filtrar columnas que no son numéricas o son identificadores
    if (
      column.toLowerCase().includes("id") ||
      column.toLowerCase().includes("parte") ||
      column.toLowerCase().includes("part") ||
      column.toLowerCase().includes("descripción") ||
      column.toLowerCase().includes("description") ||
      column.toLowerCase().includes("fecha") ||
      column.toLowerCase().includes("date") ||
      column.toLowerCase().includes("cliente") ||
      column.toLowerCase().includes("customer") ||
      column.toLowerCase().includes("dirección") ||
      column.toLowerCase().includes("address") ||
      column.toLowerCase().includes("unidad") ||
      column.toLowerCase().includes("unit")
    ) {
      return true
    }

    // Verificar si la columna solo contiene ceros
    return data.some((row) => {
      const value = row[column as keyof OrdenCompra]
      return value !== 0 && value !== "0" && value !== "" && value !== null && value !== undefined
    })
  })

  return (
    <div className={`border rounded-md overflow-x-auto ${className}`}>
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            {columnsToShow.map((column, index) => (
              <TableHead key={index} className="whitespace-nowrap">
                {column.toUpperCase()}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow key={rowIndex}>
              {columnsToShow.map((column, cellIndex) => {
                const value = row[column as keyof OrdenCompra]
                return (
                  <TableCell key={cellIndex} className="whitespace-nowrap">
                    {column.toLowerCase().includes("parte") ||
                    column.toLowerCase().includes("part") ||
                    column.toLowerCase().includes("id") ||
                    column.toLowerCase().includes("number") ||
                    column.toLowerCase().includes("código") ||
                    column.toLowerCase().includes("code") ||
                    column.toLowerCase().includes("cust")
                      ? String(value || "").replace(/,/g, "")
                      : typeof value === "number"
                        ? value.toLocaleString()
                        : String(value || "")}
                  </TableCell>
                )
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
