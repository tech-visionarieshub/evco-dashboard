import type { ForecastComparisonItem } from "@/components/forecast/types"

// Tipos para validación
export type ValidationError = {
  field: string
  message: string
  type: "error" | "warning"
}

export type ValidationResult = {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
}

// Validar origen del pronóstico
export function validateForecastSource(source: string | undefined | null): ValidationResult {
  const errors: ValidationError[] = []
  if (source !== "client" && source !== "internal") {
    errors.push({
      field: "source",
      message: "Por favor selecciona el origen del pronóstico (Cliente o Interno)",
      type: "error",
    })
  }
  return { isValid: errors.length === 0, errors, warnings: [] }
}

// Validar parámetros del modelo (cuando el origen es interno)
export function validateModelParams(
  source: string | undefined | null,
  model: { name?: string; version?: string } = {}
): ValidationResult {
  const errors: ValidationError[] = []
  if (source === "internal") {
    if (!model.name || !model.name.trim()) {
      errors.push({ field: "model.name", message: "Ingresa el nombre del modelo interno", type: "error" })
    }
    if (!model.version || !model.version.trim()) {
      errors.push({ field: "model.version", message: "Ingresa la versión del modelo interno", type: "error" })
    }
  }
  return { isValid: errors.length === 0, errors, warnings: [] }
}

// Actualizar la función validateForecastForm para incluir 'source'
export function validateForecastForm(
  client: string,
  forecastType: string,
  file: File | null,
  selectedWeek: string,
  forecastNature: string,
  source?: "client" | "internal"
) {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Validar cliente
  if (!client) {
    errors.push({
      field: "client",
      message: "Por favor selecciona un cliente",
      type: "error",
    })
  }

  // Validar tipo de forecast
  if (!forecastType) {
    errors.push({
      field: "forecastType",
      message: "Por favor selecciona un tipo de forecast",
      type: "error",
    })
  }

  // Validar origen
  if (!source) {
    errors.push({
      field: "source",
      message: "Por favor selecciona el origen del pronóstico",
      type: "error",
    })
  }

  // Validar archivo
  if (!file) {
    errors.push({
      field: "file",
      message: "Por favor sube un archivo Excel válido (.xlsx)",
      type: "error",
    })
  } else {
    // Validar formato de archivo
    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      errors.push({
        field: "file",
        message: "El archivo debe ser de formato Excel (.xlsx)",
        type: "error",
      })
    }

    // Validar tamaño de archivo (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push({
        field: "file",
        message: "El archivo no debe superar los 5MB",
        type: "error",
      })
    }
  }

  // Validar semana (solo si el tipo es semanal)
  if (forecastType === "weekly" && !selectedWeek) {
    warnings.push({
      field: "week",
      message: "No se especificó semana seleccionada (opcional si el archivo ya incluye columnas WK_XX).",
      type: "warning",
    })
  }

  // Validar naturaleza del forecast
  if (!forecastNature) {
    warnings.push({
      field: "forecastNature",
      message: "No se ha especificado si es un nuevo forecast o una corrección",
      type: "warning",
    })
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Función para validar el contenido del archivo según el tipo de forecast
export function validateFileContent(forecastType: string, data: any[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Verificar si hay datos
  if (!data || data.length === 0) {
    errors.push({
      field: "fileContent",
      message: "El archivo no contiene datos",
      type: "error",
    })
    return { isValid: false, errors, warnings }
  }

  // Obtener las columnas requeridas según el tipo de forecast
  const requiredColumns = getRequiredColumns(forecastType)
  const firstRow = data[0]

  // Verificar si es un formato semanal con todas las semanas (WK_00 a WK_52)
  const hasWeeklyFormat = Object.keys(firstRow).some((key) => key.match(/^WK_\d+$/))

  if (hasWeeklyFormat && forecastType !== "weekly") {
    warnings.push({
      field: "forecastType",
      message: "Se ha detectado un formato semanal pero se seleccionó otro tipo de forecast",
      type: "warning",
    })
    // Ajustar el tipo de forecast automáticamente (upstream)
    forecastType = "weekly"
  }

  // Verificar columnas requeridas
  if (hasWeeklyFormat) {
    // Para formato semanal con todas las semanas, verificamos columnas básicas
    const basicColumns = ["Material Code", "Vendor Name", "Contents"]
    basicColumns.forEach((column) => {
      if (!Object.keys(firstRow).some((key) => key === column || key.toLowerCase().includes(column.toLowerCase()))) {
        warnings.push({
          field: "fileContent",
          message: `No se encontró la columna esperada: ${column}`,
          type: "warning",
        })
      }
    })

    // Verificar que haya al menos algunas columnas de semanas
    const weekColumns = Object.keys(firstRow).filter((key) => key.match(/^WK_\d+$/))
    if (weekColumns.length === 0) {
      errors.push({
        field: "fileContent",
        message: "No se encontraron columnas de semanas (WK_XX)",
        type: "error",
      })
    }
  } else {
    // Verificación estándar para otros formatos
    requiredColumns.forEach((column) => {
      if (!(column.field in firstRow)) {
        errors.push({
          field: "fileContent",
          message: `Falta la columna requerida: ${column.name}`,
          type: "error",
        })
      }
    })
  }

  // Validaciones específicas según el tipo de forecast
  switch (forecastType) {
    case "monthly":
      validateMonthlyData(data, errors, warnings)
      break
    case "weekly":
      if (hasWeeklyFormat) {
        validateExtendedWeeklyData(data, errors, warnings)
      } else {
        validateWeeklyData(data, errors, warnings)
      }
      break
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

// Añade esta nueva función para validar el formato extendido de semanas
function validateExtendedWeeklyData(data: any[], errors: ValidationError[], warnings: ValidationError[]) {
  data.forEach((row, index) => {
    // Verificar que haya al menos un valor numérico en alguna de las columnas de semanas
    const weekColumns = Object.keys(row).filter((key) => key.match(/^WK_\d+$/))
    const hasNumericValue = weekColumns.some((key) => typeof row[key] === "number")

    if (!hasNumericValue) {
      warnings.push({
        field: `data[${index}]`,
        message: `La fila ${index + 1} no tiene valores numéricos en ninguna semana`,
        type: "warning",
      })
    }

    // Verificar valores negativos
    weekColumns.forEach((weekCol) => {
      if (typeof row[weekCol] === "number" && row[weekCol] < 0) {
        errors.push({
          field: `data[${index}].${weekCol}`,
          message: `El valor de ${weekCol} no puede ser negativo en la fila ${index + 1}`,
          type: "error",
        })
      }
    })

    // Verificar que haya un identificador de material/parte
    if (
      !row["Material Code"] &&
      !row["Part Number"] &&
      !Object.keys(row).some((k) => k.toLowerCase().includes("part") || k.toLowerCase().includes("material"))
    ) {
      errors.push({
        field: `data[${index}]`,
        message: `No se encontró un identificador de material o número de parte en la fila ${index + 1}`,
        type: "error",
      })
    }
  })
}

// Función para validar datos de comparación
export function validateComparisonData(data: ForecastComparisonItem[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Verificar si hay datos
  if (!data || data.length === 0) {
    errors.push({
      field: "comparisonData",
      message: "No hay datos de comparación disponibles",
      type: "error",
    })
    return { isValid: false, errors, warnings }
  }

  // Verificar variaciones extremas (más del 50%)
  data.forEach((item, index) => {
    if (Math.abs(item.changePercentage) > 50) {
      warnings.push({
        field: `comparisonData[${index}]`,
        message: `Variación extrema (${item.changePercentage.toFixed(1)}%) en parte ${item.evcoPartNumber}`,
        type: "warning",
      })
    }
  })

  // Verificar si hay muchas variaciones críticas (más del 30% de los items)
  const criticalVariations = data.filter((item) => Math.abs(item.changePercentage) > 30)
  if (criticalVariations.length > data.length * 0.3) {
    warnings.push({
      field: "comparisonData",
      message: `El ${((criticalVariations.length / data.length) * 100).toFixed(0)}% de los items tienen variaciones críticas`,
      type: "warning",
    })
  }

  return {
    isValid: true, // Siempre válido, pero con posibles advertencias
    errors,
    warnings,
  }
}

// Funciones auxiliares para validaciones específicas
function getRequiredColumns(forecastType: string): { field: string; name: string }[] {
  switch (forecastType) {
    case "monthly":
      return [
        { field: "partNumber", name: "Número de Parte" },
        { field: "quantity", name: "Cantidad" },
        { field: "deliveryDate", name: "Fecha de Entrega" },
      ]
    case "weekly":
      return [
        { field: "partNumber", name: "Número de Parte" },
        { field: "description", name: "Descripción" },
        { field: "week1", name: "Semana 1" },
      ]
    default:
      return []
  }
}

function validateMonthlyData(data: any[], errors: ValidationError[], warnings: ValidationError[]) {
  data.forEach((row, index) => {
    // Validar que la cantidad sea un número positivo
    if (typeof row.quantity !== "number" || row.quantity <= 0) {
      // Suave: algunos archivos no tienen 'quantity' fija
      warnings.push({
        field: `data[${index}].quantity`,
        message: `No se detectó campo 'quantity' numérico en la fila ${index + 1} (se usará normalización por columnas mensuales)`,
        type: "warning",
      })
    }

    // Validar que el número de parte no esté vacío
    if (!row.partNumber && !row.evcoPartNumber) {
      errors.push({
        field: `data[${index}].partNumber`,
        message: `El número de parte no puede estar vacío en la fila ${index + 1}`,
        type: "error",
      })
    }
  })
}

function validateWeeklyData(data: any[], errors: ValidationError[], warnings: ValidationError[]) {
  data.forEach((row, index) => {
    // Validar que los valores semanales sean números positivos
    for (let i = 1; i <= 6; i++) {
      const weekField = `week${i}`
      if (weekField in row) {
        if (typeof row[weekField] !== "number") {
          errors.push({
            field: `data[${index}].${weekField}`,
            message: `El valor de la semana ${i} debe ser un número en la fila ${index + 1}`,
            type: "error",
          })
        } else if (row[weekField] < 0) {
          errors.push({
            field: `data[${index}].${weekField}`,
            message: `El valor de la semana ${i} no puede ser negativo en la fila ${index + 1}`,
            type: "error",
          })
        }
      }
    }

    // Validar que el número de parte no esté vacío
    if (!row.partNumber && !row.evcoPartNumber) {
      errors.push({
        field: `data[${index}].partNumber`,
        message: `El número de parte no puede estar vacío en la fila ${index + 1}`,
        type: "error",
      })
    }
  })
}

// Función auxiliar para validar formato de fecha
function isValidDate(dateString: string): boolean {
  // Aceptar formatos comunes como DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD
  const dateRegex = /^(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2})$/
  if (!dateRegex.test(dateString)) {
    return false
  }

  // Intentar crear un objeto Date
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

// Add this function to validate forecast data
export function validateForecastData(data: any[]): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  // Check if data exists
  if (!data || data.length === 0) {
    errors.push({
      field: "forecastData",
      message: "No hay datos para validar",
      type: "error",
    })
    return { isValid: false, errors, warnings }
  }

  // Validate each row
  data.forEach((row, index) => {
    // Check for required fields
    if (!row.partNumber && !row.evcoPartNumber) {
      errors.push({
        field: `data[${index}]`,
        message: `Falta el número de parte en la fila ${index + 1}`,
        type: "error",
      })
    }

    // Check for negative quantities
    const quantityFields = Object.keys(row).filter(
      (key) => key.startsWith("week") || key.startsWith("month") || key.startsWith("WK_") || key === "quantity"
    )

    quantityFields.forEach((field) => {
      if (typeof row[field] === "number" && row[field] < 0) {
        errors.push({
          field: `data[${index}].${field}`,
          message: `La cantidad no puede ser negativa en la fila ${index + 1}`,
          type: "error",
        })
      }
    })
  })

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}
