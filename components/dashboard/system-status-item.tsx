import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type SystemStatusItemProps = {
  label: string
  status: string
  progress: number
  statusText: string
}

export function SystemStatusItem({ label, status, progress, statusText }: SystemStatusItemProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium">{label}</div>
        <Badge variant="outline" className="bg-green-100 text-green-800">
          {status}
        </Badge>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="text-xs text-muted-foreground">{statusText}</div>
    </div>
  )
}
