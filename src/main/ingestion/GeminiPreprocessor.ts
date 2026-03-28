import {
  buildGeminiPreprocessingPrompt,
  detectPreprocessingMode,
  parseGeminiResponse,
  type GeminiPreprocessingResult,
} from '../prompts/gemini-preprocessing.prompt'

export interface PreprocessResult {
  success: boolean
  cleanedText: string
  originalLength: number
  cleanedLength: number
  reductionPercent: number
  metadata?: {
    date?: string
    participants: string[]
    durationMinutes?: number
  }
  error?: string
}

function ts(): string {
  return new Date().toTimeString().slice(0, 12) // HH:MM:SS.mmm
}

/**
 * Pré-processa uma transcrição usando Gemini Flash via Google AI API.
 * Remove ruído, preenchedores e estrutura o conteúdo para reduzir tokens.
 *
 * @param apiKey - Google AI API Key (obtido em aistudio.google.com/app/apikey)
 * @param rawTranscript - Transcrição bruta (VOICE ou texto)
 * @param timeoutMs - Timeout em ms (padrão: 15s)
 * @returns Resultado do pré-processamento com texto limpo e estatísticas
 */
export async function preprocessTranscript(
  apiKey: string,
  rawTranscript: string,
  timeoutMs = 180_000,
  fileName?: string,
): Promise<PreprocessResult> {
  const originalLength = rawTranscript.length
  const mode = fileName ? detectPreprocessingMode(fileName) : 'full'

  console.log(`[GeminiPreprocessor] ${ts()} Iniciando pré-processamento (${originalLength} chars, modo: ${mode}${fileName ? `, arquivo: ${fileName}` : ''})`)

  // Limite de segurança: Gemini Flash tem contexto grande (1M tokens)
  // mas vamos truncar extremos para evitar timeouts
  const MAX_INPUT_LENGTH = 100_000 // ~25K tokens
  const truncatedText = rawTranscript.length > MAX_INPUT_LENGTH
    ? rawTranscript.slice(0, MAX_INPUT_LENGTH) + '\n\n[... texto truncado por limite de tamanho ...]'
    : rawTranscript

  if (truncatedText.length < rawTranscript.length) {
    console.log(`[GeminiPreprocessor] ${ts()} Texto truncado de ${rawTranscript.length} para ${truncatedText.length} chars`)
  }

  const prompt = buildGeminiPreprocessingPrompt(truncatedText, mode)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const startMs = Date.now()

  try {
    // Google AI API endpoint para Gemini Flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.1, // Baixa temperatura para respostas determinísticas
            topP: 0.95,
            topK: 40,
            maxOutputTokens: 65536,
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    const elapsed = ((Date.now() - startMs) / 1000).toFixed(2)
    console.log(`[GeminiPreprocessor] ${ts()} Resposta recebida em ${elapsed}s (status: ${response.status})`)

    if (!response.ok) {
      let errorMessage: string
      try {
        const errorBody = await response.json() as { error?: { message?: string; code?: number } }
        errorMessage = errorBody.error?.message ?? `HTTP ${response.status}`
        console.error(`[GeminiPreprocessor] ${ts()} Erro Google AI:`, errorBody)
      } catch {
        errorMessage = `HTTP ${response.status}`
      }
      return {
        success: false,
        cleanedText: rawTranscript, // Fallback: retorna texto original
        originalLength,
        cleanedLength: originalLength,
        reductionPercent: 0,
        error: `Google AI API error: ${errorMessage}`,
      }
    }

    const body = await response.json() as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>
        }
        finishReason?: string
      }>
      usageMetadata?: {
        promptTokenCount?: number
        candidatesTokenCount?: number
      }
    }

    const content = body.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const finishReason = body.candidates?.[0]?.finishReason

    if (finishReason === 'MAX_TOKENS') {
      console.warn(`[GeminiPreprocessor] ${ts()} Atenção: finishReason=MAX_TOKENS — tentando recuperar texto parcial`)
    } else if (finishReason && finishReason !== 'STOP') {
      console.warn(`[GeminiPreprocessor] ${ts()} Atenção: finishReason=${finishReason}`)
    }

    let parsed = parseGeminiResponse(content)

    // Recuperação parcial: quando MAX_TOKENS corta o JSON, tenta extrair texto_limpo
    if (!parsed && finishReason === 'MAX_TOKENS') {
      const partialMatch = content.match(/"texto_limpo"\s*:\s*"((?:[^"\\]|\\.)+)/)
      if (partialMatch) {
        const partialText = partialMatch[1]
          .replace(/\\n/g, '\n')
          .replace(/\\t/g, '\t')
          .replace(/\\"/g, '"')
          .replace(/\\\\/g, '\\')
        console.warn(`[GeminiPreprocessor] ${ts()} Recovery parcial: ${partialText.length} chars extraídos do JSON truncado`)
        parsed = {
          texto_limpo: partialText,
          metadados: { participantes: [] },
          estatisticas: { tokens_removidos: 0, percentual_economia: 0 },
        }
      }
    }

    if (!parsed) {
      console.error(`[GeminiPreprocessor] ${ts()} Falha ao parsear resposta do Gemini`)
      console.error('[GeminiPreprocessor] Resposta bruta:', content.slice(0, 500))
      return {
        success: false,
        cleanedText: rawTranscript, // Fallback
        originalLength,
        cleanedLength: originalLength,
        reductionPercent: 0,
        error: 'Falha ao parsear resposta do Gemini (JSON inválido)',
      }
    }

    const cleanedLength = parsed.texto_limpo.length
    const reductionPercent = parsed.estatisticas.percentual_economia

    console.log(
      `[GeminiPreprocessor] ${ts()} Sucesso: ${originalLength} → ${cleanedLength} chars ` +
      `(${reductionPercent.toFixed(1)}% economia)`
    )

    return {
      success: true,
      cleanedText: parsed.texto_limpo,
      originalLength,
      cleanedLength,
      reductionPercent,
      metadata: {
        date: parsed.metadados.data_reuniao,
        participants: parsed.metadados.participantes,
        durationMinutes: parsed.metadados.duracao_minutos,
      },
    }
  } catch (err: unknown) {
    const elapsed = ((Date.now() - startMs) / 1000).toFixed(2)
    const rawMessage = err instanceof Error ? err.message : String(err)
    const isTimeout = err instanceof Error && err.name === 'AbortError'
      || rawMessage.includes('aborted')
    const message = isTimeout
      ? `Timeout após ${elapsed}s — a transcrição (${originalLength} chars) pode ser grande demais ou o Gemini está lento`
      : rawMessage
    console.error(`[GeminiPreprocessor] ${ts()} ${isTimeout ? 'Timeout' : 'Erro'} após ${elapsed}s:`, message)

    return {
      success: false,
      cleanedText: rawTranscript, // Fallback crítico: nunca perder dados
      originalLength,
      cleanedLength: originalLength,
      reductionPercent: 0,
      error: message,
    }
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Verifica se uma API key do Google AI é válida fazendo uma chamada de teste.
 */
export async function validateGoogleAiKey(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite?key=${apiKey}`,
      { method: 'GET' },
    )
    return response.ok
  } catch {
    return false
  }
}
