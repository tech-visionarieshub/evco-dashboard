"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowDown, ArrowUp, BarChart2, Users } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Importar el componente de exportación
import { ChangeStatisticsExport } from "@/components/forecast/change-statistics-export"

type ChangeStatisticsProps = {
  data: any[]
  filteredData?: any[]
}

type StatisticItem = {
  name: string
  totalItems: number
  averageChange: number
  totalIncrease: number
  totalDecrease: number
  newItems: number
}

export function ChangeStatistics({ data, filteredData = data }: ChangeStatisticsProps) {
  // Calcular estadísticas por cliente
  const clientStats = useMemo(() => {
    const stats = new Map<string, StatisticItem>()

    // Inicializar estadísticas para cada cliente
    filteredData.forEach((item) => {
      if (!stats.has(item.client)) {
        stats.set(item.client, {
          name: item.client,
          totalItems: 0,
          averageChange: 0,
          totalIncrease: 0,
          totalDecrease: 0,
          newItems: 0,
        })
      }

      const clientStat = stats.get(item.client)!
      clientStat.totalItems++

      // Sumar el cambio porcentual para calcular el promedio después
      clientStat.averageChange += item.percentageChange

      // Contar aumentos y disminuciones
      if (item.percentageChange > 0) {
        clientStat.totalIncrease++
      } else if (item.percentageChange < 0) {
        clientStat.totalDecrease++
      }

      // Contar productos nuevos
      if (item.isNew) {
        clientStat.newItems++
      }
    })

    // Calcular promedios
    stats.forEach((stat) => {
      stat.averageChange = stat.totalItems > 0 ? stat.averageChange / stat.totalItems : 0
    })

    return Array.from(stats.values())
  }, [filteredData])

  // Calcular estadísticas por producto
  const productStats = useMemo(() => {
    const stats = new Map<string, StatisticItem>()

    // Inicializar estadísticas para cada producto
    filteredData.forEach((item) => {
      if (!stats.has(item.partNumber)) {
        stats.set(item.partNumber, {
          name: item.partNumber,
          totalItems: 0,
          averageChange: 0,
          totalIncrease: 0,
          totalDecrease: 0,
          newItems: item.isNew ? 1 : 0,
        })
      }

      const productStat = stats.get(item.partNumber)!
      productStat.totalItems++

      // Sumar el cambio porcentual para calcular el promedio después
      productStat.averageChange += item.percentageChange

      // Contar aumentos y disminuciones
      if (item.percentageChange > 0) {
        productStat.totalIncrease++
      } else if (item.percentageChange < 0) {
        productStat.totalDecrease++
      }
    })

    // Calcular promedios
    stats.forEach((stat) => {
      stat.averageChange = stat.totalItems > 0 ? stat.averageChange / stat.totalItems : 0
    })

    return Array.from(stats.values())
  }, [filteredData])

  // Función para obtener la clase de color según el valor del cambio
  const getChangeColorClass = (change: number) => {
    if (change > 0) return "text-red-600"
    if (change < 0) return "text-green-600"
    return "text-gray-600"
  }

  // Función para renderizar el indicador de cambio
  const renderChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center text-red-600">
          <ArrowUp className="mr-1 h-4 w-4" />
          <span>+{change.toFixed(1)}%</span>
        </div>
      )
    }
    if (change < 0) {
      return (
        <div className="flex items-center text-green-600">
          <ArrowDown className="mr-1 h-4 w-4" />
          <span>{change.toFixed(1)}%</span>
        </div>
      )
    }
    return <span className="text-gray-600">0%</span>
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Estadísticas de Cambios</CardTitle>
          <ChangeStatisticsExport clientStats={clientStats} productStats={productStats} />
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="client">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="client" className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Por Cliente
            </TabsTrigger>
            <TabsTrigger value="product" className="flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              Por Producto
            </TabsTrigger>
          </TabsList>

          <TabsContent value="client">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Productos</TableHead>
                    <TableHead className="text-right">% Cambio Promedio</TableHead>
                    <TableHead className="text-right">Aumentos</TableHead>
                    <TableHead className="text-right">Disminuciones</TableHead>
                    <TableHead className="text-right">Nuevos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    clientStats.map((stat) => (
                      <TableRow key={stat.name}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell className="text-right">{stat.totalItems}</TableCell>
                        <TableCell className="text-right">{renderChangeIndicator(stat.averageChange)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {stat.totalIncrease}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {stat.totalDecrease}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {stat.newItems > 0 ? (
                            <Badge className="bg-blue-500 text-white">{stat.newItems}</Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="product">
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Número de Parte</TableHead>
                    <TableHead className="text-right">Periodos</TableHead>
                    <TableHead className="text-right">% Cambio Promedio</TableHead>
                    <TableHead className="text-right">Aumentos</TableHead>
                    <TableHead className="text-right">Disminuciones</TableHead>
                    <TableHead className="text-center">Nuevo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productStats.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        No hay datos disponibles
                      </TableCell>
                    </TableRow>
                  ) : (
                    productStats.map((stat) => (
                      <TableRow key={stat.name}>
                        <TableCell className="font-medium">{stat.name}</TableCell>
                        <TableCell className="text-right">{stat.totalItems}</TableCell>
                        <TableCell className="text-right">{renderChangeIndicator(stat.averageChange)}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-red-50 text-red-700">
                            {stat.totalIncrease}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {stat.totalDecrease}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {stat.newItems > 0 ? (
                            <Badge className="bg-blue-500 text-white">Sí</Badge>
                          ) : (
                            <span className="text-gray-400">No</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
