import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Modificar la función limpiarTexto para asegurar que siempre devuelva un string sin comas
export function limpiarTexto(valor: string | number | undefined | null): string {
  if (valor === undefined || valor === null) return ""

  // Convertir a string si es un número
  const textoStr = String(valor)

  // Eliminar comas y otros caracteres no deseados
  return textoStr.replace(/,/g, "")
}

// Alias para mantener compatibilidad con código existente
export const limpiarNumeroParte = limpiarTexto
export const limpiarCustomerId = limpiarTexto

// Función para obtener el nombre completo del tipo de forecast
export function getForecastTypeName(type: string) {
  switch (type) {
    case "monthly":
      return "Forecast Mensual"
    case "weekly":
      return "Forecast Semanal"
    default:
      return type
  }
}

// Función para generar un ID único
export function generarIdUnico(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// Asegurarnos de que la función convertToCSV maneje correctamente los valores nulos o undefined
export function convertToCSV(data: any[]): string {
  if (!data || data.length === 0) return ""

  // Obtener los encabezados (claves del primer objeto)
  const headers = Object.keys(data[0])

  // Crear la fila de encabezados
  const csvRows = [headers.join(",")]

  // Crear las filas de datos
  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header]
      // Manejar valores que contienen comas, comillas o saltos de línea
      if (value === null || value === undefined) {
        return ""
      }
      const valueStr = value.toString()
      if (valueStr.includes(",") || valueStr.includes('"') || valueStr.includes("\n")) {
        return `"${valueStr.replace(/"/g, '""')}"`
      }
      return valueStr
    })
    csvRows.push(values.join(","))
  }

  return csvRows.join("\n")
}

// Asegurarnos de que la función downloadFile funcione correctamente
export function downloadFile(content: string, fileName: string, contentType: string) {
  const blob = new Blob([content], { type: contentType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = fileName
  document.body.appendChild(a)
  a.click()

  // Limpiar
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 0)
}

/**
 * ISO Week helpers and normalization utilities
 */

// Returns ISO week number and ISO year for given date.
export function getISOWeek(date: Date) {
  const tmp = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  // Thursday in current week decides the year.
  tmp.setUTCDate(tmp.getUTCDate() + 4 - (tmp.getUTCDay() || 7))
  // Week number is 1 + number of weeks between this Thursday and first Thursday of the year
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1))
  const weekNo = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7)
  return { year: tmp.getUTCFullYear(), week: weekNo }
}

export function getISOWeekKey(date: Date) {
  const { year, week } = getISOWeek(date)
  return `${year}-W${String(week).padStart(2, "0")}`
}

// Returns all ISO week keys that overlap a given month
export function getISOWeeksInMonthKeys(year: number, monthIndex0: number) {
  const daysInMonth = new Date(year, monthIndex0 + 1, 0).getDate()
  const set = new Set<string>()
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, monthIndex0, day)
    set.add(getISOWeekKey(d))
  }
  return Array.from(set.values())
}

export function safeNumber(v: any): number {
  if (v === null || v === undefined || v === "") return 0
  const n = typeof v === "number" ? v : Number(String(v).toString().replace(/,/g, ""))
  return Number.isFinite(n) ? n : 0
}

export function guessPartId(row: Record<string, any>): string {
  const candidates = [
    "evcoPartNumber",
    "partNumber",
    "Part #",
    "Part Number",
    "Number",
    "No Parte EVCO",
    "No Parte Cliente",
    "clientPartNumber",
    "material_1",
    "item_1",
    "evcoNumber",
  ]
  for (const key of Object.keys(row)) {
    const exact = candidates.find((c) => c === key)
    if (exact && row[key]) return limpiarTexto(String(row[key]))
  }
  // heuristic by key name
  const byHint = Object.keys(row).find((k) => /part|parte|material|item/i.test(k))
  if (byHint && row[byHint]) return limpiarTexto(String(row[byHint]))
  return ""
}

/**
 * Compute SHA-256 hex string of given ArrayBuffer
 */
export async function computeSHA256Hex(buffer: ArrayBuffer) {
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}
