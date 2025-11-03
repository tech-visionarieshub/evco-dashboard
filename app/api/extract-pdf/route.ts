import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Verificar que sea un PDF
    if (!file.type.includes("pdf") && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json({ error: "Only PDF files are supported" }, { status: 400 })
    }

    console.log("Processing PDF file:", file.name, "Size:", file.size)

    // Crear FormData para el servicio externo
    const externalFormData = new FormData()
    externalFormData.append("file", file)

    // Llamar al servicio externo desde el servidor
    const response = await fetch("https://api-pdf-to-txt.onrender.com/extract/", {
      method: "POST",
      body: externalFormData,
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error")
      console.error("External service error:", response.status, errorText)
      return NextResponse.json(
        { error: `External service error: ${response.status} - ${errorText}` },
        { status: response.status },
      )
    }

    const result = await response.json()

    if (!result.text) {
      return NextResponse.json({ error: "No text extracted from PDF" }, { status: 400 })
    }

    console.log("Text extracted successfully, length:", result.text.length)

    return NextResponse.json({
      success: true,
      text: result.text,
    })
  } catch (error) {
    console.error("API route error:", error)
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : "Unknown error"}` },
      { status: 500 },
    )
  }
}
