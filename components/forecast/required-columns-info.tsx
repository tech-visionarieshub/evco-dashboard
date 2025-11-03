import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type RequiredColumnsInfoProps = {
  forecastType: string
}

export function RequiredColumnsInfo({ forecastType }: RequiredColumnsInfoProps) {
  // Definir columnas requeridas según el tipo de forecast
  const getRequiredColumns = () => {
    const commonColumns = ["Part Number", "Description", "Cust ID", "MOQ", "STD Pack"]

    switch (forecastType) {
      case "weekly":
        return [...commonColumns, "WK_01", "WK_02", "WK_03", "WK_04"]
      case "monthly":
        return [...commonColumns, "MM-YYYY (formato de mes)"]
      default:
        return commonColumns
    }
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50">
      <AlertCircle className="h-4 w-4 text-amber-600" />
      <AlertTitle className="text-amber-800 font-medium">Columnas obligatorias</AlertTitle>
      <AlertDescription className="text-amber-700">
        <p className="mb-2">
          Para el formato {forecastType === "weekly" ? "semanal" : "monthly" ? "mensual" : forecastType}, asegúrate de
          incluir las siguientes columnas:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          {getRequiredColumns().map((column, index) => (
            <li key={index}>{column}</li>
          ))}
        </ul>
      </AlertDescription>
    </Alert>
  )
}
