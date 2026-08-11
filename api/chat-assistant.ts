import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient } from './_gemini';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb'
    }
  }
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, demandsContext } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Mensagem é obrigatória.' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Você é o Co-Piloto Inteligente do Gestor de Demandas AI.
Você ajuda o usuário a:
1. Entender gargalos e demandas críticas/atrasadas.
2. Redigir respostas profissionais de resolução para clientes/requisitantes.
3. Gerar resumos executivos do status de trabalho atual.
4. Dar sugestões práticas de como resolver demandas específicas.

Responda sempre em português do Brasil, de forma profissional, direta e organizada (com markdown, bullet points e tópicos quando pertinente).`;

    const prompt = `Contexto atual de demandas do usuário:
${JSON.stringify(demandsContext || [], null, 2)}

Solicitação do usuário:
"${message}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: { systemInstruction }
    });

    if (!response.text) {
      console.warn('[chat-assistant] Gemini retornou resposta vazia.');
      return res.status(502).json({ error: 'A IA não gerou uma resposta. Tente novamente.' });
    }

    return res.json({ success: true, reply: response.text });

  } catch (error: any) {
    const status = error?.status || error?.httpStatus || 500;
    console.error('[chat-assistant] ERRO:', {
      message: error.message,
      status,
      details: error?.errorDetails || error?.response || null
    });
    return res.status(500).json({ error: error.message || 'Erro no assistente AI.' });
  }
}
