export type DemandStatus = 'Pendente' | 'Em Andamento' | 'Aguardando Retorno' | 'Concluído' | 'Cancelado';

export type DemandPriority = 'Baixa' | 'Média' | 'Alta' | 'Crítica';

export type DemandCategory = 
  | 'Projeto'
  | 'Suporte/Bug'
  | 'Atendimento/Cliente'
  | 'Administrativo'
  | 'Reunião/Alinhamento'
  | 'Processos/Operacional'
  | 'Outros';

export interface ActionItem {
  id: string;
  title: string;
  completed: boolean;
}

export interface DemandNote {
  id: string;
  createdAt: string;
  text: string;
  author: string;
  statusChange?: DemandStatus;
}

export interface AlertConfig {
  enabled: boolean;
  notifyDaysBefore: number; // e.g. 1 day before deadline
  alertOnOverdue: boolean;
  customAlertDate?: string;
}

export interface Demand {
  id: string;
  title: string;
  description: string;
  originalInputType: 'texto' | 'foto' | 'pdf' | 'planilha' | 'manual';
  originalInputPreview?: string;
  category: DemandCategory;
  priority: DemandPriority;
  status: DemandStatus;
  requester?: string;
  department?: string;
  folder?: string;
  createdAt: string;
  updatedAt: string;
  deadline?: string; // ISO YYYY-MM-DD
  estimatedHours?: number;
  tags: string[];
  actionItems: ActionItem[];
  notes: DemandNote[];
  alertConfig: AlertConfig;
  resolutionSummary?: string;
}

export interface DemandAnalysisResult {
  title: string;
  description: string;
  category: DemandCategory;
  priority: DemandPriority;
  suggestedDeadline?: string;
  requester?: string;
  department?: string;
  folder?: string;
  tags: string[];
  actionItems: string[];
  estimatedHours?: number;
  summaryReasoning?: string;
}

export interface DemandFilterOptions {
  search: string;
  category: string;
  priority: string;
  status: string;
  folder: string;
  onlyAlerts: boolean;
  inputType: string;
}
