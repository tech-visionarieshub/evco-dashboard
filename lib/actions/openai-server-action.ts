"use server"

import type {
  OpenAIExtractionResult,
  OpenAIProcessorConfig,
  OpenAIPromptContext,
  OpenAIFunctionSchema,
} from "../types/openai-types"
import { SISTEMA_PROMPT_BILINGUE, buildUserPrompt } from "../prompts/orden-compra-prompts"
import { OpenAIResponseValidator } from "../validators/openai-response-validator"

class ServerOpenAIProcessor {
  private config: OpenAIProcessorConfig
  private apiKey: string
  private functions: OpenAIFunctionSchema[]

  constructor() {
    // Use server-side environment variable (without NEXT_PUBLIC prefix)
    this.apiKey = process.env.OPENAI_API_KEY || ""
    this.config = {
      model: "gpt-4",
      temperature: 0.1,
      maxTokens: 2000,
      timeout: 30000,
    }

    if (!this.apiKey) {
      throw new Error("OpenAI API key is required")
    }

    // Definir la función de extracción con JSON Schema - incluyendo poTotal y requestedDate
    this.functions = [
      {
        name: "extractOrder",
        description: "Extrae los campos específicos de una orden de compra en inglés o español",
        parameters: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            orderInfo: {
              type: "object",
              properties: {
                poNumber: { type: ["string", "null"] },
                orderDate: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                requiredDate: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                shipTo: { type: ["string", "null"] },
                poTotal: { type: ["number", "null"], minimum: 0 },
                receptionChannel: { type: "string", enum: ["Correo", "Portal", "EDI"] },
                orderType: { type: "string", enum: ["Nacional", "Exportación", "Express"] },
                customerAddress: { type: "string" },
                notes: { type: "string" },
              },
              required: [],
            },
            lineItems: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  lineNumber: { type: "integer", minimum: 1 },
                  customerSku: { type: ["string", "null"] },
                  evcoSku: { type: "string" },
                  description: { type: ["string", "null"] },
                  quantity: { type: "number", minimum: 0 },
                  price: { type: "number", minimum: 0 },
                  unit: { type: "string" },
                  requestedDate: { type: ["string", "null"], pattern: "^\\d{4}-\\d{2}-\\d{2}$" },
                },
                required: ["quantity", "unit"],
              },
            },
            fieldConfidence: {
              type: "object",
              additionalProperties: { type: "number", minimum: 0, maximum: 1 },
            },
            warnings: {
              type: "array",
              items: { type: "string" },
            },
          },
          required: ["success", "orderInfo", "lineItems"],
        },
      },
    ]
  }

  async processOrdenCompra(context: OpenAIPromptContext): Promise<OpenAIExtractionResult> {
    const startTime = Date.now()

    try {
      // Validar entrada
      if (!context.userText || context.userText.trim().length < 10) {
        throw new Error("El texto proporcionado es demasiado corto o vacío")
      }

      // Construir el prompt
      const userPrompt = buildUserPrompt(context)

      // Llamar a OpenAI API con Function Calling
      const response = await this.callOpenAIWithFunctions(userPrompt)

      // Parsear respuesta JSON desde function_call.arguments
      let parsedResponse: any
      try {
        parsedResponse = JSON.parse(response)
      } catch (parseError) {
        throw new Error(`Error al parsear respuesta JSON: ${parseError}`)
      }

      // Validar estructura de respuesta
      const validation = OpenAIResponseValidator.validateResponse(parsedResponse)
      if (!validation.isValid) {
        const errorMessages = validation.errors
          .filter((e) => e.severity === "error")
          .map((e) => e.message)
          .join(", ")
        throw new Error(`Respuesta inválida de OpenAI: ${errorMessages}`)
      }

      // Construir el resultado final con solo los campos específicos - forzar null en lugar de ""
      const result: OpenAIExtractionResult = {
        success: parsedResponse.success,
        confidence: parsedResponse.confidence || 0.5,
        extractedData: {
          orderInfo: {
            poNumber: parsedResponse.orderInfo.poNumber || null,
            orderDate: parsedResponse.orderInfo.orderDate || null,
            requiredDate: parsedResponse.orderInfo.requiredDate || null,
            shipTo: parsedResponse.orderInfo.shipTo || null,
            poTotal: parsedResponse.orderInfo.poTotal || null,
            receptionChannel: parsedResponse.orderInfo.receptionChannel || undefined,
            orderType: parsedResponse.orderInfo.orderType || undefined,
            customerAddress: parsedResponse.orderInfo.customerAddress || undefined,
            notes: parsedResponse.orderInfo.notes || undefined,
          },
          lineItems:
            parsedResponse.lineItems.map((item: any) => ({
              lineNumber: item.lineNumber || undefined,
              customerSku: item.customerSku || null,
              evcoSku: item.evcoSku || undefined,
              description: item.description || null,
              quantity: item.quantity || 0,
              price: item.price || 0,
              unit: item.unit || "EACH",
              requestedDate: item.requestedDate || null,
            })) || [],
        },
        fieldConfidence: parsedResponse.fieldConfidence || {},
        warnings: parsedResponse.warnings || [],
        rawText: context.userText,
        processingTime: Date.now() - startTime,
      }

      // Validar reglas de negocio
      const businessErrors = OpenAIResponseValidator.validateBusinessRules(parsedResponse)
      if (businessErrors.length > 0) {
        result.warnings.push(...businessErrors.map((e) => e.message))
      }

      return result
    } catch (error) {
      // Manejar errores y devolver resultado de error
      const processingTime = Date.now() - startTime

      return {
        success: false,
        confidence: 0,
        extractedData: {
          orderInfo: {
            poNumber: null,
            orderDate: null,
            requiredDate: null,
            shipTo: null,
            poTotal: null,
          },
          lineItems: [],
        },
        fieldConfidence: {},
        warnings: [`Error de procesamiento: ${error instanceof Error ? error.message : "Error desconocido"}`],
        rawText: context.userText,
        processingTime,
      }
    }
  }

  private async callOpenAIWithFunctions(userPrompt: string): Promise<string> {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            {
              role: "system",
              content: SISTEMA_PROMPT_BILINGUE,
            },
            {
              role: "user",
              content: userPrompt,
            },
          ],
          functions: this.functions,
          function_call: { name: "extractOrder" }, // forzamos el uso de la función
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens,
        }),
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`)
      }

      const data = await response.json()

      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error("Respuesta inválida de OpenAI API")
      }

      const message = data.choices[0].message

      // Verificar que tenemos function_call
      if (!message.function_call || !message.function_call.arguments) {
        throw new Error("OpenAI no devolvió una llamada de función válida")
      }

      // Verificar que es la función correcta
      if (message.function_call.name !== "extractOrder") {
        throw new Error(`OpenAI devolvió función incorrecta: ${message.function_call.name}`)
      }

      return message.function_call.arguments
    } catch (error) {
      clearTimeout(timeoutId)

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Timeout: La solicitud a OpenAI tardó demasiado")
      }

      throw error
    }
  }
}

// Server action to process order text
export async function processOrderTextAction(text: string, customerId?: string): Promise<OpenAIExtractionResult> {
  const processor = new ServerOpenAIProcessor()
  return processor.processOrdenCompra({
    userText: text,
    customerId,
  })
}

// Server action to test connection
export async function testOpenAIConnectionAction(): Promise<boolean> {
  try {
    const processor = new ServerOpenAIProcessor()
    const testResult = await processor.processOrdenCompra({
      userText:
        "Test connection - PO: TEST-001, Order Date: 2025-01-15, Required Date: 2025-01-20, Quantity: 1 EACH, Item: Test Item, Total: $100.00",
    })
    return testResult.success
  } catch (error) {
    console.error("Test connection failed:", error)
    return false
  }
}
