import { Demand, DemandPriority, DemandStatus } from '../types';
import { INITIAL_DEMANDS } from '../data/initialData';

const LOCAL_STORAGE_KEY = 'gestor_demandas_ai_data';

export function loadDemandsFromStorage(): Demand[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    let parsed: Demand[] = INITIAL_DEMANDS;
    if (data) {
      parsed = JSON.parse(data);
    }
    // Clean up any legacy "Financeiro" references in folders or categories
    const sanitized = parsed.map(d => ({
      ...d,
      folder: (!d.folder || d.folder === 'Financeiro') ? 'Geral & Operações' : d.folder,
      category: (d.category as string) === 'Financeiro' ? 'Processos/Operacional' : d.category
    }));
    return sanitized;
  } catch (err) {
    console.error('Erro ao carregar demandas do localStorage:', err);
    return INITIAL_DEMANDS;
  }
}

export function saveDemandsToStorage(demands: Demand[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(demands));
  } catch (err) {
    console.error('Erro ao salvar demandas no localStorage:', err);
  }
}

export function isOverdue(deadline?: string, status?: DemandStatus): boolean {
  if (!deadline || status === 'Concluído' || status === 'Cancelado') return false;
  const todayStr = new Date().toISOString().split('T')[0];
  return deadline < todayStr;
}

export function isDueToday(deadline?: string, status?: DemandStatus): boolean {
  if (!deadline || status === 'Concluído' || status === 'Cancelado') return false;
  const todayStr = new Date().toISOString().split('T')[0];
  return deadline === todayStr;
}

export function isDueSoon(deadline?: string, status?: DemandStatus, daysThreshold = 2): boolean {
  if (!deadline || status === 'Concluído' || status === 'Cancelado') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const targetDate = new Date(deadline + 'T00:00:00');
  const diffTime = targetDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays >= 0 && diffDays <= daysThreshold;
}

export function formatDateBR(dateStr?: string): string {
  if (!dateStr) return 'Sem data definida';
  try {
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
}

export function getDaysRemainingText(deadline?: string, status?: DemandStatus): { text: string; colorClass: string; isAlert: boolean } {
  if (!deadline) return { text: 'Sem prazo', colorClass: 'text-slate-500 bg-slate-100 dark:bg-slate-800', isAlert: false };
  if (status === 'Concluído') return { text: 'Concluído', colorClass: 'text-emerald-700 bg-emerald-50 border-emerald-200', isAlert: false };
  if (status === 'Cancelado') return { text: 'Cancelado', colorClass: 'text-slate-500 bg-slate-100', isAlert: false };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(deadline + 'T00:00:00');
  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const overdue = Math.abs(diffDays);
    return {
      text: `Atrasado há ${overdue} dia${overdue > 1 ? 's' : ''}`,
      colorClass: 'text-rose-700 bg-rose-50 border-rose-300 font-semibold',
      isAlert: true
    };
  }

  if (diffDays === 0) {
    return {
      text: 'Vence Hoje!',
      colorClass: 'text-amber-700 bg-amber-50 border-amber-300 font-bold',
      isAlert: true
    };
  }

  if (diffDays === 1) {
    return {
      text: 'Vence Amanhã',
      colorClass: 'text-amber-800 bg-amber-50 border-amber-200',
      isAlert: true
    };
  }

  return {
    text: `${diffDays} dias restantes`,
    colorClass: 'text-slate-600 bg-slate-100 border-slate-200',
    isAlert: false
  };
}

export function getPriorityBadge(priority: DemandPriority): { bg: string; text: string; border: string } {
  switch (priority) {
    case 'Crítica':
      return { bg: 'bg-rose-100 text-rose-800', text: 'Crítica', border: 'border-rose-300' };
    case 'Alta':
      return { bg: 'bg-orange-100 text-orange-800', text: 'Alta', border: 'border-orange-300' };
    case 'Média':
      return { bg: 'bg-amber-100 text-amber-800', text: 'Média', border: 'border-amber-300' };
    case 'Baixa':
    default:
      return { bg: 'bg-slate-100 text-slate-700', text: 'Baixa', border: 'border-slate-200' };
  }
}

export function getStatusBadge(status: DemandStatus): { bg: string; text: string; icon: string } {
  switch (status) {
    case 'Concluído':
      return { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', text: 'Concluído', icon: 'CheckCircle' };
    case 'Em Andamento':
      return { bg: 'bg-blue-100 text-blue-800 border-blue-300', text: 'Em Andamento', icon: 'Clock' };
    case 'Aguardando Retorno':
      return { bg: 'bg-purple-100 text-purple-800 border-purple-300', text: 'Aguardando Retorno', icon: 'HelpCircle' };
    case 'Cancelado':
      return { bg: 'bg-slate-200 text-slate-600 border-slate-300', text: 'Cancelado', icon: 'XCircle' };
    case 'Pendente':
    default:
      return { bg: 'bg-amber-100 text-amber-800 border-amber-300', text: 'Pendente', icon: 'AlertCircle' };
  }
}

export function exportDemandsToCSV(demands: Demand[]) {
  const headers = ['ID', 'Título', 'Descrição', 'Categoria', 'Prioridade', 'Status', 'Solicitante', 'Departamento', 'Prazo', 'Tags', 'Horas Estimadas'];
  const rows = demands.map(d => [
    d.id,
    `"${d.title.replace(/"/g, '""')}"`,
    `"${d.description.replace(/"/g, '""')}"`,
    d.category,
    d.priority,
    d.status,
    `"${(d.requester || '').replace(/"/g, '""')}"`,
    `"${(d.department || '').replace(/"/g, '""')}"`,
    d.deadline || '',
    `"${d.tags.join(', ')}"`,
    d.estimatedHours || ''
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `relatorio_demandas_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
