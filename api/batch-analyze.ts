import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient, safeParseJson, Type } from '../src/lib/gemini.js';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { content, fileName } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Conteúdo da planilha/texto em lote é obrigatório.' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Você é um especialista em processamento em lote de demandas corporativas.
Analise os dados da planilha/tabela ou lista fornecida e extraia TODAS as demandas individuais em um array estruturado.
A data de referência de hoje é ${new Date().toISOString().split('T')[0]}.`;

    const responseSchema = {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          description: { type: Type.STRING },
          category: { type: Type.STRING },
          priority: { type: Type.STRING },
          suggestedDeadline: { type: Type.STRING },
          requester: { type: Type.STRING },
          department: { type: Type.STRING },
          tags: { type: Type.ARRAY, items: { type: Type.STRING } },
          actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
          estimatedHours: { type: Type.NUMBER }
        },
        required: ['title', 'description', 'category', 'priority', 'tags', 'actionItems']
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
      contents: `Extraia cada uma das demandas presentes no seguinte conteúdo de arquivo/planilha (${fileName || 'lote'}):\n\n${content}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema
      }
    });

    console.log('[batch-analyze] Resposta bruta do Gemini:', response.text?.substring(0, 300));

    const demands = safeParseJson<any[]>(response.text, []);
    return res.json({ success: true, count: demands.length, demands });

  } catch (error: any) {
    const status = error?.status || error?.httpStatus || 500;
    console.error('[batch-analyze] ERRO:', {
      message: error.message,
      status,
      details: error?.errorDetails || error?.response || null
    });
    return res.status(500).json({ error: error.message || 'Erro no processamento em lote com Gemini.' });
  }
}
