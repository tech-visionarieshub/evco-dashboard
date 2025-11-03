import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { ReactNode } from "react"

type BadgeProps = {
  label: string
  variant?: "default" | "destructive" | "outline"
  className?: string
}

type StatCardProps = {
  label: string
  value: string
  icon: ReactNode
  subtext?: string
  badges?: BadgeProps[]
}

export function StatCard({ label, value, icon, subtext, badges }: StatCardProps) {
  return (
    <Card className="card-dashboard">
      <CardContent className="p-6">
        <div className="flex flex-col gap-2">
          <div className="text-label">{label}</div>
          <div className="flex items-end justify-between">
            <div className="text-value">{value}</div>
            {icon}
          </div>
          {subtext && <div className="text-xs text-muted-foreground">{subtext}</div>}
          {badges && badges.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              {badges.map((badge, index) => (
                <Badge key={index} variant={badge.variant} className={badge.className}>
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
