export interface OpenAIExtractionResult {
  success: boolean
  confidence: number // 0-1
  extractedData: {
    orderInfo: {
      customerId?: string
      poNumber?: string | null
      orderDate?: string | null
      requiredDate?: string | null
      receptionChannel?: "Correo" | "Portal" | "EDI"
      customerAddress?: string
      shipTo?: string | null
      orderType?: "Nacional" | "Exportación" | "Express"
      notes?: string
      poTotal?: number | null
    }
    lineItems: Array<{
      lineNumber?: number
      customerSku?: string | null
      evcoSku?: string
      description?: string | null
      quantity: number
      price: number
      unit: string
      requestedDate?: string | null
    }>
  }
  fieldConfidence: Record<string, number> // confianza por campo (0-1)
  warnings: string[] // campos que no se pudieron extraer o son ambiguos
  rawText: string // texto original procesado
  processingTime: number // tiempo de procesamiento en ms
}

export interface OpenAIProcessorConfig {
  model: string
  temperature: number
  maxTokens: number
  timeout: number
}

export interface OpenAIPromptContext {
  userText: string
  customerId?: string
  additionalContext?: string
}

export interface OpenAIAPIResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content?: string
      function_call?: {
        name: string
        arguments: string
      }
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export interface ValidationError {
  field: string
  message: string
  severity: "error" | "warning"
}

export interface ProcessingError {
  code: string
  message: string
  details?: any
}

export interface OpenAIFunctionSchema {
  name: string
  description: string
  parameters: {
    type: string
    properties: Record<string, any>
    required: string[]
  }
}
