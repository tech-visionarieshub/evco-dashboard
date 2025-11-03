import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

type ForecastItemProps = {
  title: string
  status: string
  time: string
  progress: number
  id?: string // ID opcional para enlazar al detalle
}

export function ForecastItem({ title, status, time, progress, id = "" }: ForecastItemProps) {
  // Componente base que se renderizará
  const ForecastContent = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="font-medium">{title}</div>
          <Badge className="bg-green-500 text-white">{status}</Badge>
        </div>
        <div className="text-sm text-muted-foreground">{time}</div>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  )

  // Si tenemos un ID, hacemos que sea clickeable
  if (id) {
    return (
      <Link href={`/forecast/${id}`} className="block p-3 -mx-3 rounded-lg transition-colors hover:bg-gray-100">
        <ForecastContent />
      </Link>
    )
  }

  // Si no hay ID, simplemente mostramos el contenido sin enlace
  return <ForecastContent />
}
