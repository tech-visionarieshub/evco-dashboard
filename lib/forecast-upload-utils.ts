import * as XLSX from "xlsx"

export type DetectedFormat = {
  format: "weekly" | "monthly" | null
  period: string | null
  year: number | null
}

export async function processExcelFile(file: File): Promise<any[]> {
  return new Promise<any[]>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = e.target?.result
        if (!data) {
          reject(new Error("No se pudo leer el archivo"))
          return
        }
        const workbook = XLSX.read(data, { type: "binary" })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet)
        resolve(jsonData)
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = reject
    reader.readAsBinaryString(file)
  })
}

// Detect format based on header keys
export function detectFileFormat(rows: any[]): DetectedFormat {
  if (!rows || rows.length === 0) {
    return { format: null, period: null, year: null }
  }
  const keys = Object.keys(rows[0]).map((k) => k.toLowerCase())
  const weeklyPattern = /^wk[_-]?\d{1,2}$/i
  const monthlyPattern = /^\d{2}-\d{4}$/i

  const hasWeekly = keys.some((k) => weeklyPattern.test(k))
  const hasMonthly = keys.some((k) => monthlyPattern.test(k))

  if (hasWeekly) {
    const year = new Date().getFullYear()
    return { format: "weekly", period: `Forecast Semanal ${year}`, year }
  }

  if (hasMonthly) {
    const key = keys.find((k) => monthlyPattern.test(k))!
    const [, y] = key.split("-")
    const year = Number.parseInt(y, 10)
    return { format: "monthly", period: `Forecast Mensual ${y}`, year: Number.isFinite(year) ? year : null }
  }

  return { format: null, period: null, year: null }
}
