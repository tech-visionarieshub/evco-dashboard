"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

export type BarChartData = {
  name: string
  value: number
  color?: string
}

interface BarChartCardProps {
  title: string
  description?: string
  data: BarChartData[]
  yAxisLabel?: string
  valuePrefix?: string
  valueSuffix?: string
  height?: number
  barColor?: string
}

export function BarChartCard({
  title,
  description,
  data,
  yAxisLabel,
  valuePrefix = "",
  valueSuffix = "",
  height = 200,
  barColor = "#4f46e5",
}: BarChartCardProps) {
  const formatYAxis = (value: number) => {
    return `${valuePrefix}${value}${valueSuffix}`
  }

  const formatTooltip = (value: number) => {
    return [`${valuePrefix}${value}${valueSuffix}`, ""]
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            margin={{
              top: 5,
              right: 10,
              left: 10,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              interval={0}
              angle={-45}
              textAnchor="end"
              height={50}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              label={{
                value: yAxisLabel,
                angle: -90,
                position: "insideLeft",
                style: { textAnchor: "middle", fontSize: 12 },
              }}
            />
            <Tooltip
              formatter={formatTooltip}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
              }}
            />
            <Bar dataKey="value" fill={barColor} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Bar key={`bar-${index}`} fill={entry.color || barColor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
