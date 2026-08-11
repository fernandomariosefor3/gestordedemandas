import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  User, 
  Building2, 
  Tag, 
  FileText, 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Loader2,
  Bell,
  MessageSquare,
  HelpCircle,
  XCircle,
  Edit3,
  Folder
} from 'lucide-react';
import { Demand, DemandStatus, DemandPriority } from '../types';
import { formatDateBR, getDaysRemainingText, getPriorityBadge, getStatusBadge } from '../utils/helpers';

interface DemandDetailModalProps {
  demand: Demand | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedDemand: Demand) => void;
  onDelete: (demandId: string) => void;
}

export const DemandDetailModal: React.FC<DemandDetailModalProps> = ({
  demand,
  isOpen,
  onClose,
  onUpdate,
  onDelete
}) => {
  if (!isOpen || !demand) return null;

  const [newNoteText, setNewNoteText] = useState('');
  const [isGeneratingResolution, setIsGeneratingResolution] = useState(false);
  const [copiedResolution, setCopiedResolution] = useState(false);
  const [resolutionDraft, setResolutionDraft] = useState(demand.resolutionSummary || '');

  const daysInfo = getDaysRemainingText(demand.deadline, demand.status);
  const priorityBadge = getPriorityBadge(demand.priority);
  const statusBadge = getStatusBadge(demand.status);

  // Toggle checklist completion
  const handleToggleActionItem = (actionId: string) => {
    const updatedActionItems = demand.actionItems.map(item => 
      item.id === actionId ? { ...item, completed: !item.completed } : item
    );

    const updated: Demand = {
      ...demand,
      actionItems: updatedActionItems,
      updatedAt: new Date().toISOString()
    };

    onUpdate(updated);
  };

  // Change Status
  const handleStatusChange = (newStatus: DemandStatus) => {
    const newNote = {
      id: 'n-stat-' + Date.now(),
      createdAt: new Date().toISOString(),
      text: `Status alterado de "${demand.status}" para "${newStatus}".`,
      author: 'Você',
      statusChange: newStatus
    };

    const updated: Demand = {
      ...demand,
      status: newStatus,
      notes: [newNote, ...demand.notes],
      updatedAt: new Date().toISOString()
    };

    onUpdate(updated);
  };

  // Add Progress Note
  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newNote = {
      id: 'n-' + Date.now(),
      createdAt: new Date().toISOString(),
      text: newNoteText.trim(),
      author: 'Você'
    };

    const updated: Demand = {
      ...demand,
      notes: [newNote, ...demand.notes],
      updatedAt: new Date().toISOString()
    };

    onUpdate(updated);
    setNewNoteText('');
  };

  // Generate AI Resolution Draft
  const handleGenerateAIResolution = async () => {
    setIsGeneratingResolution(true);
    try {
      const response = await fetch('/api/chat-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Por favor, elabore uma mensagem profissional de resolução/conclusão da seguinte demanda para enviar ao solicitante/cliente (${demand.requester || 'Solicitante'}):\n\nTítulo: ${demand.title}\nDescrição: ${demand.description}\nCategoria: ${demand.category}\nAções realizadas: ${demand.actionItems.map(a => `${a.completed ? '[X]' : '[ ]'} ${a.title}`).join(', ')}`,
          demandsContext: [demand]
        })
      });

      const data = await response.json();
      if (data.success && data.reply) {
        setResolutionDraft(data.reply);
        
        // Auto update resolution field in demand
        const updated: Demand = {
          ...demand,
          resolutionSummary: data.reply,
          updatedAt: new Date().toISOString()
        };
        onUpdate(updated);
      }
    } catch (err) {
      console.error('Erro ao gerar resolução com IA:', err);
      alert('Erro ao comunicar com a IA Gemini para gerar resolução.');
    } finally {
      setIsGeneratingResolution(false);
    }
  };

  const handleCopyResolution = () => {
    navigator.clipboard.writeText(resolutionDraft);
    setCopiedResolution(true);
    setTimeout(() => setCopiedResolution(false), 2000);
  };

  const completedActionsCount = demand.actionItems.filter(a => a.completed).length;
  const totalActionsCount = demand.actionItems.length;
  const progressPercent = totalActionsCount > 0 ? Math.round((completedActionsCount / totalActionsCount) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="space-y-1 pr-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${priorityBadge.bg} ${priorityBadge.border}`}>
                {priorityBadge.text}
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {demand.category}
              </span>
              <span className={`px-2.5 py-0.5 rounded-md text-xs font-semibold border ${daysInfo.colorClass}`}>
                {daysInfo.text}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mt-1">
              {demand.title}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span>ID: <code className="font-mono">{demand.id}</code></span>
              <span>•</span>
              <span>Registrado via: <strong>{demand.originalInputType.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Criado em: {formatDateBR(demand.createdAt)}</span>
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left / Center 2 Columns */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Change Selector Bar */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Status Atual da Demanda
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Pendente', 'Em Andamento', 'Aguardando Retorno', 'Concluído'] as DemandStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      demand.status === st
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-bold'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
                Descrição da Demanda
              </h3>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                {demand.description}
              </div>
            </div>

            {/* Checklist / Action Items */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Passos de Resolução ({completedActionsCount}/{totalActionsCount})
                </h3>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  {progressPercent}% Concluído
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden mb-3">
                <div 
                  className="bg-emerald-600 h-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="space-y-2">
                {demand.actionItems.map((act) => (
                  <label
                    key={act.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                      act.completed
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900/60 text-slate-500 dark:text-slate-400 line-through'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-emerald-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={act.completed}
                      onChange={() => handleToggleActionItem(act.id)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span className="text-xs sm:text-sm font-medium leading-tight">{act.title}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* AI Resolution Generator Box */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/70 via-teal-50/50 to-slate-50 dark:from-emerald-950/40 dark:to-slate-950 border border-emerald-200/80 dark:border-emerald-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  Gerador de Resolução & Devolutiva (IA Gemini)
                </h3>
                <button
                  type="button"
                  onClick={handleGenerateAIResolution}
                  disabled={isGeneratingResolution}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingResolution ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-300" /> Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-orange-300" /> {resolutionDraft ? 'Regerar Resposta' : 'Gerar Resposta'}
                    </>
                  )}
                </button>
              </div>

              {resolutionDraft ? (
                <div className="space-y-2">
                  <div className="relative bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed shadow-xs">
                    {resolutionDraft}
                    <button
                      onClick={handleCopyResolution}
                      className="absolute top-2 right-2 p-1.5 text-slate-500 hover:text-emerald-600 bg-slate-100 dark:bg-slate-800 rounded transition-colors"
                      title="Copiar texto de resolução"
                    >
                      {copiedResolution ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                    💡 Copie a resposta acima e envie diretamente para o solicitante via WhatsApp, e-mail ou ticket.
                  </p>
                </div>
              ) : (
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80">
                  Clique no botão acima para a IA redigir automaticamente uma mensagem de resolução formal, pronta para ser enviada ao cliente ou solicitante.
                </p>
              )}
            </div>

            {/* Notes Timeline */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-400" /> Histórico & Anotações de Progresso
              </h3>

              <form onSubmit={handleAddNote} className="mb-4 flex gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Adicionar nota de andamento ou atualização..."
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all flex items-center gap-1.5 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" /> Enviar
                </button>
              </form>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                {demand.notes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-slate-400 mb-1">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{note.author}</span>
                      <span>{new Date(note.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                    <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{note.text}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column: Metadata & Settings Sidebar */}
          <div className="space-y-6 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800 pt-6 lg:pt-0 lg:pl-6">
            
            {/* Properties List */}
            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-1">Pasta de Destino</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/80">
                  <Folder className="w-3.5 h-3.5 text-emerald-600" /> {demand.folder || 'Geral & Operações'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Solicitante</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" /> {demand.requester || 'Não informado'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Departamento</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" /> {demand.department || 'Geral'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Prazo Limite</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> {formatDateBR(demand.deadline)}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Horas Estimadas</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> {demand.estimatedHours || 0} hora(s)
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Tags</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {demand.tags.map(t => (
                    <span key={t} className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-slate-400 block mb-1">Preview de Entrada Original</span>
                <div className="p-2.5 rounded-lg bg-slate-100 dark:bg-slate-950 font-mono text-[11px] text-slate-600 dark:text-slate-400 truncate">
                  {demand.originalInputPreview || 'Sem prévia'}
                </div>
              </div>
            </div>

            {/* Alert Settings */}
            <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs">
                <Bell className="w-4 h-4 text-amber-600" /> Alerta de Prazo Ativo
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/80">
                Notificação automática quando o prazo estiver a {demand.alertConfig.notifyDaysBefore} dia(s) do vencimento ou atrasado.
              </p>
            </div>

            {/* Danger Zone / Delete */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  if (confirm('Tem certeza que deseja excluir esta demanda definitivamente?')) {
                    onDelete(demand.id);
                    onClose();
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-xl transition-colors border border-rose-200 dark:border-rose-900/60"
              >
                <Trash2 className="w-4 h-4" /> Excluir Demanda
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
