import type { OpenAIExtractionResult, ValidationError } from "../types/openai-types"

export class OpenAIResponseValidator {
  // Unit mapping to standardize different unit formats
  private static readonly UNIT_MAPPING: Record<string, string> = {
    // Standard units
    EACH: "EACH",
    PCS: "PCS",
    KG: "KG",
    M: "M",

    // Common variations
    each: "EACH",
    pcs: "PCS",
    pieces: "PCS",
    piece: "PCS",
    pc: "PCS",
    kg: "KG",
    kilogram: "KG",
    kilograms: "KG",
    m: "M",
    meter: "M",
    meters: "M",
    metre: "M",
    metres: "M",

    // Additional common units
    EA: "EACH",
    ea: "EACH",
    unit: "EACH",
    units: "EACH",
    UNT: "EACH",
    unt: "EACH",
    SET: "EACH",
    set: "EACH",

    // Weight units
    LB: "KG", // Convert pounds to kg as default
    lb: "KG",
    pound: "KG",
    pounds: "KG",
    G: "KG", // Convert grams to kg
    g: "KG",
    gram: "KG",
    grams: "KG",

    // Length units
    CM: "M",
    cm: "M",
    MM: "M",
    mm: "M",
    FT: "M",
    ft: "M",
    foot: "M",
    feet: "M",
    IN: "M",
    in: "M",
    inch: "M",
    inches: "M",

    // Default fallback
    "": "EACH",
    null: "EACH",
    undefined: "EACH",
  }

  private static normalizeUnit(unit: string | null | undefined): string {
    if (!unit || unit === "null" || unit === "undefined") {
      return "EACH"
    }

    const cleanUnit = String(unit).trim()
    return this.UNIT_MAPPING[cleanUnit] || "EACH"
  }

  static validateResponse(response: any): {
    isValid: boolean
    errors: ValidationError[]
    result?: OpenAIExtractionResult
  } {
    const errors: ValidationError[] = []

    // Validar estructura básica
    if (!response || typeof response !== "object") {
      errors.push({
        field: "response",
        message: "La respuesta no es un objeto válido",
        severity: "error",
      })
      return { isValid: false, errors }
    }

    // Validar campos requeridos de primer nivel
    const requiredFields = ["success", "orderInfo", "lineItems"]
    for (const field of requiredFields) {
      if (!(field in response)) {
        errors.push({
          field,
          message: `Campo requerido '${field}' no encontrado`,
          severity: "error",
        })
      }
    }

    // Validar tipos de datos
    if (typeof response.success !== "boolean") {
      errors.push({
        field: "success",
        message: "El campo success debe ser boolean",
        severity: "error",
      })
    }

    if (
      response.confidence !== undefined &&
      (typeof response.confidence !== "number" || response.confidence < 0 || response.confidence > 1)
    ) {
      errors.push({
        field: "confidence",
        message: "El campo confidence debe ser un número entre 0 y 1",
        severity: "error",
      })
    }

    // Validar orderInfo - todos los campos son opcionales y nullable
    if (!response.orderInfo || typeof response.orderInfo !== "object") {
      errors.push({
        field: "orderInfo",
        message: "orderInfo debe ser un objeto",
        severity: "error",
      })
    } else {
      // Validar formato de fechas si están presentes
      const dateFields = ["orderDate", "requiredDate"]
      dateFields.forEach((field) => {
        const dateValue = response.orderInfo[field]
        if (dateValue && typeof dateValue === "string") {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/
          if (!dateRegex.test(dateValue)) {
            errors.push({
              field: `orderInfo.${field}`,
              message: `${field} debe estar en formato YYYY-MM-DD`,
              severity: "warning",
            })
          }
        }
      })

      // Validar enums si están presentes
      if (
        response.orderInfo.receptionChannel &&
        !["Correo", "Portal", "EDI"].includes(response.orderInfo.receptionChannel)
      ) {
        errors.push({
          field: "orderInfo.receptionChannel",
          message: "receptionChannel debe ser 'Correo', 'Portal' o 'EDI'",
          severity: "warning",
        })
      }

      if (
        response.orderInfo.orderType &&
        !["Nacional", "Exportación", "Express"].includes(response.orderInfo.orderType)
      ) {
        errors.push({
          field: "orderInfo.orderType",
          message: "orderType debe ser 'Nacional', 'Exportación' o 'Express'",
          severity: "warning",
        })
      }

      // Validar poTotal si está presente
      if (
        response.orderInfo.poTotal !== undefined &&
        response.orderInfo.poTotal !== null &&
        (typeof response.orderInfo.poTotal !== "number" || response.orderInfo.poTotal < 0)
      ) {
        errors.push({
          field: "orderInfo.poTotal",
          message: "poTotal debe ser un número mayor o igual a 0",
          severity: "warning",
        })
      }
    }

    // Validar lineItems
    if (!Array.isArray(response.lineItems)) {
      errors.push({
        field: "lineItems",
        message: "lineItems debe ser un array",
        severity: "error",
      })
    } else {
      // Validar cada line item
      response.lineItems.forEach((item: any, index: number) => {
        if (!item || typeof item !== "object") {
          errors.push({
            field: `lineItems[${index}]`,
            message: `Line item ${index} debe ser un objeto`,
            severity: "error",
          })
        } else {
          // Validar campos requeridos en line items con valores por defecto
          if (!item.quantity || typeof item.quantity !== "number" || item.quantity < 1) {
            errors.push({
              field: `lineItems[${index}].quantity`,
              message: `Línea ${index + 1}: quantity debe ser un número mayor a 0`,
              severity: "error",
            })
          }

          // Normalize and validate unit - more flexible approach
          const originalUnit = item.unit
          const normalizedUnit = this.normalizeUnit(originalUnit)

          // Update the item with normalized unit
          item.unit = normalizedUnit

          // Only warn if we couldn't map the unit (but still allow it)
          if (originalUnit && originalUnit !== normalizedUnit && !this.UNIT_MAPPING[originalUnit]) {
            errors.push({
              field: `lineItems[${index}].unit`,
              message: `Línea ${index + 1}: unit '${originalUnit}' fue normalizada a '${normalizedUnit}'`,
              severity: "warning",
            })
          }

          if (item.price !== undefined && (typeof item.price !== "number" || item.price < 0)) {
            errors.push({
              field: `lineItems[${index}].price`,
              message: `Línea ${index + 1}: price debe ser un número mayor o igual a 0`,
              severity: "warning",
            })
          }
        }
      })
    }

    // Validar fieldConfidence si existe
    if (response.fieldConfidence && typeof response.fieldConfidence === "object") {
      Object.entries(response.fieldConfidence).forEach(([field, confidence]) => {
        if (typeof confidence !== "number" || confidence < 0 || confidence > 1) {
          errors.push({
            field: `fieldConfidence.${field}`,
            message: `La confianza para ${field} debe ser un número entre 0 y 1`,
            severity: "warning",
          })
        }
      })
    }

    // Validar warnings si existe
    if (response.warnings && !Array.isArray(response.warnings)) {
      errors.push({
        field: "warnings",
        message: "warnings debe ser un array",
        severity: "warning",
      })
    }

    const hasErrors = errors.some((error) => error.severity === "error")

    return {
      isValid: !hasErrors,
      errors,
      result: hasErrors ? undefined : (response as any),
    }
  }

  static validateBusinessRules(result: any): ValidationError[] {
    const errors: ValidationError[] = []

    // Validar que haya al menos una línea de producto
    if (!result.lineItems || result.lineItems.length === 0) {
      errors.push({
        field: "lineItems",
        message: "No se encontraron líneas de productos en la orden",
        severity: "warning",
      })
    }

    // Validar confianza general si existe
    if (result.confidence !== undefined && result.confidence < 0.5) {
      errors.push({
        field: "confidence",
        message: "La confianza general de extracción es baja (< 50%)",
        severity: "warning",
      })
    }

    // Validar campos críticos - ahora todos son opcionales
    const criticalFields = ["poNumber", "orderDate"]
    criticalFields.forEach((field) => {
      if (!result.orderInfo || !result.orderInfo[field]) {
        errors.push({
          field,
          message: `Campo crítico '${field}' no fue encontrado`,
          severity: "warning",
        })
      }
    })

    // Validar líneas de productos
    if (result.lineItems) {
      result.lineItems.forEach((item: any, index: number) => {
        if (!item.customerSku && !item.evcoSku) {
          errors.push({
            field: `lineItems[${index}]`,
            message: `Línea ${index + 1}: No se encontró SKU del cliente ni SKU EVCO`,
            severity: "warning",
          })
        }

        if (!item.description) {
          errors.push({
            field: `lineItems[${index}]`,
            message: `Línea ${index + 1}: Descripción faltante`,
            severity: "warning",
          })
        }
      })
    }

    return errors
  }
}
