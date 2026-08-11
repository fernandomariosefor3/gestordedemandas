import { GoogleGenAI, Type } from '@google/genai';

// ------------------------------------------------------------------
// Shared Gemini Client Factory
// ------------------------------------------------------------------
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({ apiKey });
}

// ------------------------------------------------------------------
// Utility: Safe JSON Parser (handles markdown wrappers and empty strings)
// ------------------------------------------------------------------
export function safeParseJson<T>(raw: string | undefined | null, fallback: T): T {
  if (!raw || raw.trim() === '') {
    console.warn('[safeParseJson] Resposta vazia ou undefined recebida da API do Gemini.');
    return fallback;
  }

  // Remove blocos de markdown: ```json ... ``` ou ``` ... ```
  const cleaned = raw
    .replace(/^```[\w]*\n?/m, '')
    .replace(/\n?```$/m, '')
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch (parseError: any) {
    console.error('[safeParseJson] Falha ao fazer JSON.parse. Erro:', parseError.message);
    console.error('[safeParseJson] String bruta recebida (primeiros 500 chars):', raw.substring(0, 500));
    return fallback;
  }
}

// Re-export Type for use in serverless functions
export { Type };
