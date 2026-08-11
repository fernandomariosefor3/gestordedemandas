import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeminiClient, safeParseJson, Type } from '../src/lib/gemini.js';

// Vercel Serverless: increase body size limit for PDF/image base64
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
    const { type, content, fileName, mimeType } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Conteúdo para análise é obrigatório.' });
    }

    const ai = getGeminiClient();

    const systemInstruction = `Você é um assistente especialista em gestão de projetos e organização do trabalho corporativo.
Sua missão é analisar entradas de qualquer tipo (texto copiado de e-mail/chat, fotos de anotações ou quadros, PDFs de relatórios ou contratos, planilhas CSV/Excel) e extrair os dados estruturados de UMA demanda de trabalho.

Diretrizes para os campos:
1. title: Um título claro, conciso e acionável em português (máx. 80 caracteres).
2. description: Resumo completo e estruturado da demanda com detalhes essenciais.
3. category: Escolha a mais adequada entre: 'Projeto', 'Suporte/Bug', 'Atendimento/Cliente', 'Administrativo', 'Reunião/Alinhamento', 'Processos/Operacional', 'Outros'. (NUNCA utilize a categoria Financeiro).
4. folder: Sugira o nome de uma pasta/agrupador lógico como 'Geral & Operações', 'Jurídico & Contratos', 'Sistemas & TI', 'Projetos Especiais', 'Atendimento & Clientes' ou crie um nome de pasta adequado em português (NUNCA utilize o nome 'Financeiro').
5. priority: 'Baixa', 'Média', 'Alta' ou 'Crítica' com base na urgência, prazos mencionados e impacto.
6. suggestedDeadline: Data limite estimada no formato ISO 'YYYY-MM-DD', considerando a data de hoje como referência (${new Date().toISOString().split('T')[0]}). Se não houver data explícita ou dedutível, retorne uma string vazia "".
7. requester: Nome do solicitante/cliente/gestor se mencionado no texto, ou string vazia "".
8. department: Departamento/área relacionada se identificado, ou string vazia "".
9. tags: Lista de até 5 palavras-chave relevantes.
10. actionItems: Lista de 2 a 5 sub-tarefas acionáveis (passos para resolução).
11. estimatedHours: Estimativa realista de horas para conclusão (número).
12. summaryReasoning: Breve justificativa de 1 frase explicando a categorização e prioridade definida.`;

    const responseSchema = {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        category: { type: Type.STRING },
        folder: { type: Type.STRING },
        priority: { type: Type.STRING },
        suggestedDeadline: { type: Type.STRING },
        requester: { type: Type.STRING },
        department: { type: Type.STRING },
        tags: { type: Type.ARRAY, items: { type: Type.STRING } },
        actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
        estimatedHours: { type: Type.NUMBER },
        summaryReasoning: { type: Type.STRING }
      },
      required: ['title', 'description', 'category', 'priority', 'tags', 'actionItems']
    };

    let contentsPayload: any;

    if (type === 'foto' || type === 'pdf') {
      const base64Data = content.includes('base64,') ? content.split('base64,')[1] : content;
      const effectiveMimeType = mimeType || (type === 'pdf' ? 'application/pdf' : 'image/jpeg');
      contentsPayload = {
        parts: [
          { inlineData: { mimeType: effectiveMimeType, data: base64Data } },
          { text: `Analise este arquivo (${fileName || type}) e extraia os dados detalhados da demanda de trabalho.` }
        ]
      };
    } else {
      contentsPayload = `Por favor, analise o seguinte registro de demanda de trabalho:\n\n---\n${content}\n---`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: contentsPayload,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema
      }
    });

    console.log('[analyze-demand] Resposta bruta do Gemini:', response.text?.substring(0, 300));

    const parsedData = safeParseJson<Record<string, any>>(response.text, {});

    if (!parsedData || Object.keys(parsedData).length === 0) {
      console.error('[analyze-demand] Gemini retornou objeto vazio ou falhou no parse.');
      return res.status(502).json({ error: 'A IA não conseguiu extrair dados do arquivo. Tente novamente ou use um arquivo diferente.' });
    }

    return res.json({ success: true, data: parsedData });

  } catch (error: any) {
    const status = error?.status || error?.httpStatus || 500;
    console.error('[analyze-demand] ERRO:', {
      message: error.message,
      status,
      details: error?.errorDetails || error?.response || null
    });
    return res.status(500).json({ error: error.message || 'Erro ao analisar demanda com Gemini.' });
  }
}
