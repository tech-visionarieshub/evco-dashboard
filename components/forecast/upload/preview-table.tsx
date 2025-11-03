"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Props {
  rows: any[]
  title?: string
}

export function PreviewTable({ rows, title = "Previsualización" }: Props) {
  const headers = rows.length > 0 ? Object.keys(rows[0]) : []

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((h) => (
                  <TableHead key={h}>{h}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.slice(0, 25).map((r, idx) => (
                <TableRow key={idx}>
                  {headers.map((h) => (
                    <TableCell key={h} className="text-xs">
                      {String(r[h] ?? "")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={headers.length || 1} className="text-center text-sm text-gray-500">
                    Sin datos para mostrar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
