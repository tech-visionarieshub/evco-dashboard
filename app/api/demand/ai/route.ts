import { type NextRequest, NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

export const runtime = "nodejs"

interface PartSeries {
  partNum: string
  series: Array<{ weekKey: string; qty: number }>
}

interface AiSignal {
  partNum: string
  weekKey: string
  predictedQty: number
  lower: number | null
  upper: number | null
  anomalyScore: number | null
  seasonalityTag: "peak" | "low" | null
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      horizonWeeks: number
      parts: PartSeries[]
    }

    // Validaciones defensivas
    const horizon = Math.min(Math.max(body.horizonWeeks ?? 8, 4), 12)
    const parts = (body.parts ?? []).slice(0, 20) // Reducir límite para evitar timeouts

    if (!parts.length) {
      return NextResponse.json({ signals: [] })
    }

    console.log(`[AI] Processing ${parts.length} parts for ${horizon} weeks horizon`)

    // System prompt más conciso para evitar timeouts
    const systemPrompt = `Eres un analista de demanda industrial. Devuelve SOLO JSON válido:

{
  "signals": [
    {
      "partNum": "string",
      "weekKey": "YYYY-Www", 
      "predictedQty": number,
      "lower": number | null,
      "upper": number | null,
      "anomalyScore": number | null,
      "seasonalityTag": "peak" | "low" | null
    }
  ]
}

REGLAS:
1. Analiza tendencia + estacionalidad
2. Predice ${horizon} semanas futuras por parte
3. anomalyScore > 2.0 = anomalía crítica
4. seasonalityTag: "peak" si >20% promedio, "low" si <80% promedio
5. NO texto explicativo, SOLO JSON`

    const userContent = `Analiza series semanales y predice ${horizon} semanas:

${JSON.stringify({ parts: parts.slice(0, 10) }, null, 1)}`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      temperature: 0.1,
      maxTokens: 2000,
      system: systemPrompt,
      prompt: userContent,
    })

    let parsed: { signals: AiSignal[] }
    try {
      parsed = JSON.parse(text)

      if (!parsed.signals || !Array.isArray(parsed.signals)) {
        throw new Error("Invalid signals structure")
      }

      // Filtrar señales válidas
      parsed.signals = parsed.signals.filter(
        (signal) =>
          signal.partNum && signal.weekKey && typeof signal.predictedQty === "number" && signal.predictedQty >= 0,
      )
    } catch (parseError) {
      console.error("[AI] JSON parsing failed:", parseError)
      console.error("[AI] Raw response:", text)
      parsed = { signals: [] }
    }

    console.log(`[AI] Generated ${parsed.signals.length} signals successfully`)

    return NextResponse.json({
      signals: parsed.signals,
      metadata: {
        totalParts: parts.length,
        horizon: horizon,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error: any) {
    console.error("[AI] Route error:", error)

    // Respuesta de error pero con status 200 para no romper el flujo
    return NextResponse.json(
      {
        signals: [],
        error: "AI_PROCESSING_FAILED",
        message: error.message || "Unknown error",
        metadata: {
          timestamp: new Date().toISOString(),
        },
      },
      { status: 200 },
    )
  }
}
