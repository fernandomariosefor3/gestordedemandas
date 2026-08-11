import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// ------------------------------------------------------------------
// Utility: Safe JSON Parser (handles markdown wrappers and empty strings)
// ------------------------------------------------------------------
function safeParseJson<T>(raw: string | undefined | null, fallback: T): T {
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

const app = express();
const PORT = 3000;

// Increase JSON limit for base64 images / PDFs / spreadsheets
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Helper to get Gemini Client safely
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// ------------------------------------------------------------------
// API Route 1: Single Demand Analysis (Text, Photo, PDF, Spreadsheet)
// ------------------------------------------------------------------
app.post('/api/gemini/analyze-demand', async (req, res) => {
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
        tags: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        actionItems: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        },
        estimatedHours: { type: Type.NUMBER },
        summaryReasoning: { type: Type.STRING }
      },
      required: ['title', 'description', 'category', 'priority', 'tags', 'actionItems']
    };

    let contentsPayload: any;

    if (type === 'foto' || type === 'pdf') {
      // Multimodal payload (image or pdf base64)
      const base64Data = content.includes('base64,') ? content.split('base64,')[1] : content;
      const effectiveMimeType = mimeType || (type === 'pdf' ? 'application/pdf' : 'image/jpeg');

      contentsPayload = {
        parts: [
          {
            inlineData: {
              mimeType: effectiveMimeType,
              data: base64Data
            }
          },
          {
            text: `Análise este arquivo (${fileName || type}) e extraia os dados detalhados da demanda de trabalho.`
          }
        ]
      };
    } else {
      // Text or Spreadsheet string
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

    // Log da resposta bruta para diagnóstico no Vercel Functions
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
});

// ------------------------------------------------------------------
// API Route 2: Batch Analysis (Spreadsheet CSV/Excel or Multi-demand text)
// ------------------------------------------------------------------
app.post('/api/gemini/batch-analyze', async (req, res) => {
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
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          actionItems: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          estimatedHours: { type: Type.NUMBER }
        },
        required: ['title', 'description', 'category', 'priority', 'tags', 'actionItems']
      }
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Extraia cada uma das demandas presentes no seguinte conteúdo de arquivo/planilha (${fileName || 'lote'}):\n\n${content}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema
      }
    });

    // Log da resposta bruta para diagnóstico no Vercel Functions
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
});

// ------------------------------------------------------------------
// API Route 3: Smart AI Assistant & Resolution Drafting
// ------------------------------------------------------------------
app.post('/api/gemini/chat-assistant', async (req, res) => {
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
      config: {
        systemInstruction
      }
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
});

// ------------------------------------------------------------------
// Vite Middleware / Static File Serving
// ------------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server Gestor de Demandas AI rodando na porta ${PORT}`);
  });
}

startServer();
