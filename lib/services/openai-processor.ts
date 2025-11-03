import type { OpenAIExtractionResult, OpenAIPromptContext } from "../types/openai-types"
import { processOrderTextAction, testOpenAIConnectionAction } from "../actions/openai-server-action"

export class OpenAIProcessor {
  constructor() {
    // No API key needed on client side - all processing happens on server
  }

  async processOrdenCompra(context: OpenAIPromptContext): Promise<OpenAIExtractionResult> {
    const startTime = Date.now()

    try {
      // Validar entrada
      if (!context.userText || context.userText.trim().length < 10) {
        throw new Error("El texto proporcionado es demasiado corto o vacío")
      }

      // Call server action instead of making direct API call
      return await processOrderTextAction(context.userText, context.customerId)
    } catch (error) {
      // Manejar errores y devolver resultado de error con estructura completa
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

  // Método para probar la conexión
  async testConnection(): Promise<boolean> {
    try {
      // Call server action instead of making direct API call
      return await testOpenAIConnectionAction()
    } catch (error) {
      console.error("Test connection failed:", error)
      return false
    }
  }
}

// Factory function para crear instancia
export const createOpenAIProcessor = () => {
  return new OpenAIProcessor()
}

// Función de utilidad para procesamiento rápido
export const processOrderText = async (text: string, customerId?: string): Promise<OpenAIExtractionResult> => {
  const processor = createOpenAIProcessor()
  return processor.processOrdenCompra({
    userText: text,
    customerId,
  })
}
