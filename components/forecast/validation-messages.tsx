import { AlertCircle, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import type { ValidationError } from "@/lib/validations"

type ValidationMessagesProps = {
  errors: ValidationError[]
  warnings: ValidationError[]
}

export function ValidationMessages({ errors, warnings }: ValidationMessagesProps) {
  if (errors.length === 0 && warnings.length === 0) {
    return null
  }

  return (
    <div className="space-y-3 mb-6">
      {errors.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Errores de validación</AlertTitle>
          <AlertDescription>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {warnings.length > 0 && (
        <Alert variant="warning" className="bg-amber-50 border-amber-200 text-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-800">Advertencias</AlertTitle>
          <AlertDescription className="text-amber-700">
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {warnings.map((warning, index) => (
                <li key={index}>{warning.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
