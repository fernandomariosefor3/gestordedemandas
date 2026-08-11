import { Demand } from '../types';

export const INITIAL_DEMANDS: Demand[] = [
  {
    id: 'dem-001',
    title: 'Ajuste de fórmula na Planilha de Metas Q3',
    description: 'Corrigir inconsistência no cálculo da comissão de vendas na aba "Resumo_Geral". O valor final está divergindo em 5% no acumulado.',
    originalInputType: 'planilha',
    originalInputPreview: 'Aba Resumo_Geral: =SOMA(C2:C40)*1.05 -> Verificar comissão',
    category: 'Processos/Operacional',
    priority: 'Crítica',
    status: 'Em Andamento',
    requester: 'Mariana Lima (Controladoria)',
    department: 'Operações',
    folder: 'Geral & Operações',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    deadline: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0], // Atrasado
    estimatedHours: 3,
    tags: ['Excel', 'Metas', 'Operacional'],
    actionItems: [
      { id: 'act-1', title: 'Validar fórmula da coluna K', completed: true },
      { id: 'act-2', title: 'Testar com amostra de dados do Q2', completed: false },
      { id: 'act-3', title: 'Enviar versão corrigida para aprovação', completed: false }
    ],
    notes: [
      {
        id: 'n-1',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        text: 'Identificado erro de arredondamento na célula K14.',
        author: 'Você',
        statusChange: 'Em Andamento'
      }
    ],
    alertConfig: {
      enabled: true,
      notifyDaysBefore: 1,
      alertOnOverdue: true
    }
  },
  {
    id: 'dem-002',
    title: 'Revisão do Contrato de Prestação de Serviços (Fornecedor X)',
    description: 'Analisar minuta enviada em PDF com foto do aditivo assinado. Verificar cláusulas de renovação automática e prazos de rescisão.',
    originalInputType: 'pdf',
    originalInputPreview: 'Contrato_Prestacao_Servico_v2.pdf',
    category: 'Administrativo',
    priority: 'Alta',
    status: 'Pendente',
    requester: 'Carlos Eduardo (Jurídico)',
    department: 'Jurídico',
    folder: 'Jurídico & Contratos',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
    deadline: new Date(Date.now() + 1 * 86400000).toISOString().split('T')[0], // Vence em breve
    estimatedHours: 4,
    tags: ['Contrato', 'Jurídico', 'Renovação'],
    actionItems: [
      { id: 'act-10', title: 'Conferir cláusula 7 (Rescisão)', completed: false },
      { id: 'act-11', title: 'Validar reajuste pelo IPCA', completed: false }
    ],
    notes: [],
    alertConfig: {
      enabled: true,
      notifyDaysBefore: 2,
      alertOnOverdue: true
    }
  },
  {
    id: 'dem-003',
    title: 'Atendimento: Erro no login do App Clientes VIP',
    description: 'Foto do erro anexada do quadro de ocorrências. Usuários estão recebendo mensagem de timeout ao autenticar via SS0.',
    originalInputType: 'foto',
    originalInputPreview: 'Foto do print de erro recebido no WhatsApp do suporte',
    category: 'Suporte/Bug',
    priority: 'Alta',
    status: 'Aguardando Retorno',
    requester: 'Juliana Costa (Atendimento)',
    department: 'Suporte Técnico',
    folder: 'Sistemas & TI',
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
    deadline: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    estimatedHours: 2,
    tags: ['Bug', 'Autenticação', 'Urgente'],
    actionItems: [
      { id: 'act-20', title: 'Verificar logs do servidor de Auth', completed: true },
      { id: 'act-21', title: 'Solicitar IP do usuário para rastreio', completed: true },
      { id: 'act-22', title: 'Aguardar resposta da equipe de Infra', completed: false }
    ],
    notes: [
      {
        id: 'n-2',
        createdAt: new Date(Date.now() - 12 * 3600000).toISOString(),
        text: 'Chamado aberto na Infraestrutura sob protocolo #88491.',
        author: 'Você',
        statusChange: 'Aguardando Retorno'
      }
    ],
    alertConfig: {
      enabled: true,
      notifyDaysBefore: 1,
      alertOnOverdue: true
    }
  },
  {
    id: 'dem-004',
    title: 'Apresentação da Proposta de Redesenho do Portal',
    description: 'Texto copiado do e-mail da diretoria com os tópicos exigidos para a reunião de alinhamento da próxima quinta-feira.',
    originalInputType: 'texto',
    originalInputPreview: 'Email da Diretoria: "Precisamos de 5 slides mostrando o roadmap..."',
    category: 'Projeto',
    priority: 'Média',
    status: 'Concluído',
    requester: 'Roberto Alves (Diretoria)',
    department: 'Produto',
    folder: 'Projetos Especiais',
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
    deadline: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    estimatedHours: 6,
    tags: ['Slides', 'Apresentação', 'Diretoria'],
    actionItems: [
      { id: 'act-30', title: 'Elaborar estrutura dos slides', completed: true },
      { id: 'act-31', title: 'Revisar métricas de conversão', completed: true },
      { id: 'act-32', title: 'Enviar para pré-aprovação', completed: true }
    ],
    notes: [
      {
        id: 'n-3',
        createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
        text: 'Apresentação realizada e aprovada por unanimidade.',
        author: 'Você',
        statusChange: 'Concluído'
      }
    ],
    alertConfig: {
      enabled: false,
      notifyDaysBefore: 1,
      alertOnOverdue: false
    },
    resolutionSummary: 'Apresentação aprovada pela diretoria. Projeto de redesenho iniciado em etapa 1.'
  }
];
