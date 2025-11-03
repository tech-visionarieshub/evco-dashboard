"use client"

import type React from "react"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Download, FileDown } from "lucide-react"
import { limpiarTexto } from "@/lib/utils"

interface TablaExportacionProps {
  datos: any[]
  onExportar?: (datos: any[]) => void
  onSeleccionar?: (dato: any) => void
}

export function TablaExportacion({ datos, onExportar, onSeleccionar }: TablaExportacionProps) {
  const [filtro, setFiltro] = useState("")
  const [datosFiltrados, setDatosFiltrados] = useState(datos)

  const handleFiltrar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.toLowerCase()
    setFiltro(valor)

    if (!valor) {
      setDatosFiltrados(datos)
      return
    }

    const filtrados = datos.filter(
      (dato) =>
        String(dato.customerId || "")
          .toLowerCase()
          .includes(valor) ||
        String(dato.poNumber || "")
          .toLowerCase()
          .includes(valor) ||
        String(dato.numeroParteEVCO || "")
          .toLowerCase()
          .includes(valor) ||
        String(dato.descripcion || "")
          .toLowerCase()
          .includes(valor),
    )

    setDatosFiltrados(filtrados)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Buscar por cliente, PO, parte..."
            className="pl-8"
            value={filtro}
            onChange={handleFiltrar}
          />
        </div>
        {onExportar && (
          <Button variant="outline" onClick={() => onExportar(datosFiltrados)}>
            <FileDown className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>CUST ID</TableHead>
              <TableHead>NO PARTE EVCO</TableHead>
              <TableHead>NO PARTE CLIENTE</TableHead>
              <TableHead>DESCRIPCIÓN</TableHead>
              <TableHead className="text-right">CANTIDAD</TableHead>
              <TableHead>ACCIONES</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {datosFiltrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4 text-gray-500">
                  No hay datos para mostrar
                </TableCell>
              </TableRow>
            ) : (
              datosFiltrados.map((dato, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{limpiarTexto(String(dato.customerId || ""))}</TableCell>
                  <TableCell>{limpiarTexto(String(dato.numeroParteEVCO || ""))}</TableCell>
                  <TableCell>{limpiarTexto(String(dato.numeroParteCLiente || ""))}</TableCell>
                  <TableCell>{dato.descripcion}</TableCell>
                  <TableCell className="text-right">{dato.cantidad}</TableCell>
                  <TableCell>
                    {onSeleccionar && (
                      <Button variant="ghost" size="sm" onClick={() => onSeleccionar(dato)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        Mostrando {datosFiltrados.length} de {datos.length} registros
      </div>
    </div>
  )
}
