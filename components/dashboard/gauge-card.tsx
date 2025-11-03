"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface GaugeCardProps {
  title: string
  percent: number
  threshold?: number
  description?: string
}

export function GaugeCard({ title, percent, threshold = 80, description }: GaugeCardProps) {
  const isLow = percent < threshold
  const circumference = 2 * Math.PI * 45
  const strokeDasharray = circumference
  const strokeDashoffset = circumference - (percent / 100) * circumference

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <div className="relative">
          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
            {/* Background circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-muted-foreground/20"
            />
            {/* Progress circle */}
            <circle
              cx="50"
              cy="50"
              r="45"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className={`transition-all duration-300 ${
                isLow ? "text-red-500" : percent < threshold + 10 ? "text-yellow-500" : "text-green-500"
              }`}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xl font-bold ${isLow ? "text-red-500" : "text-foreground"}`}>{percent}%</span>
          </div>
        </div>
        {description && <p className="text-xs text-muted-foreground mt-2">{description}</p>}
        {isLow && <div className="mt-2 text-xs text-red-500 font-medium">⚠️ Bajo umbral ({threshold}%)</div>}
      </CardContent>
    </Card>
  )
}
