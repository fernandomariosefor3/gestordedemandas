import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, Upload, Check, Loader2, Sparkles, AlertCircle } from 'lucide-react';
import { Demand } from '../types';
import { exportDemandsToCSV } from '../utils/helpers';

interface ExportImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  demands: Demand[];
  onImportDemands: (demands: Demand[]) => void;
}

export const ExportImportModal: React.FC<ExportImportModalProps> = ({
  isOpen,
  onClose,
  demands,
  onImportDemands
}) => {
  const [batchText, setBatchText] = useState('');
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);
  const [batchSuccessMsg, setBatchSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBatchProcess = async () => {
    if (!batchText.trim()) return;
    setIsProcessingBatch(true);
    setBatchSuccessMsg(null);

    try {
      const response = await fetch('/api/gemini/batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: batchText,
          fileName: 'Lote de Planilha / Lista'
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Erro ao processar lote.');
      }

      const rawDemands = resData.demands || [];
      const newDemands: Demand[] = rawDemands.map((d: any, idx: number) => ({
        id: 'dem-batch-' + Date.now() + '-' + idx,
        title: d.title || 'Demanda ' + (idx + 1),
        description: d.description || d.title,
        originalInputType: 'planilha',
        originalInputPreview: 'Lote importado',
        category: d.category || 'Outros',
        priority: d.priority || 'Média',
        status: 'Pendente',
        requester: d.requester || '',
        department: d.department || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        deadline: d.suggestedDeadline || undefined,
        estimatedHours: d.estimatedHours || 2,
        tags: d.tags || [],
        actionItems: (d.actionItems || []).map((actTitle: string, actIdx: number) => ({
          id: `act-${Date.now()}-${idx}-${actIdx}`,
          title: actTitle,
          completed: false
        })),
        notes: [
          {
            id: 'n-batch-' + Date.now() + '-' + idx,
            createdAt: new Date().toISOString(),
            text: 'Demanda importada em lote e categorizada via IA Gemini.',
            author: 'Sistema'
          }
        ],
        alertConfig: {
          enabled: true,
          notifyDaysBefore: 1,
          alertOnOverdue: true
        }
      }));

      onImportDemands(newDemands);
      setBatchSuccessMsg(`Sucesso! ${newDemands.length} demandas foram criadas e salvas em nuvem.`);
      setBatchText('');
    } catch (err: any) {
      alert('Erro ao processar lote: ' + err.message);
    } finally {
      setIsProcessingBatch(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-xl w-full p-6 relative space-y-6">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Relatórios & Processamento em Lote
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exporte seus relatórios em CSV ou importe listas de planilhas com IA
            </p>
          </div>
        </div>

        {/* Section 1: CSV Export */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-600" /> Exportar Dados de Demandas
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Gere um arquivo CSV completo com todas as {demands.length} demandas registradas para análise no Excel ou Google Sheets.
          </p>
          <button
            onClick={() => exportDemandsToCSV(demands)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" /> Baixar Relatório CSV
          </button>
        </div>

        {/* Section 2: Batch Import with AI */}
        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/80 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-orange-500" /> Importar Planilha / Lista em Lote
          </h3>
          <p className="text-xs text-emerald-900/80 dark:text-emerald-200/80">
            Cole abaixo uma lista de várias demandas ou conteúdo de tabela CSV/Excel. A IA Gemini irá extrair, categorizar e salvar todas individualmente.
          </p>

          <textarea
            rows={4}
            value={batchText}
            onChange={(e) => setBatchText(e.target.value)}
            placeholder="Exemplo de colar várias linhas:&#10;1. Atualizar contrato do fornecedor B até sexta&#10;2. Resolver bug na tela de checkout para o cliente X&#10;3. Enviar relatório semanal de progresso para a diretoria"
            className="w-full p-3 bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />

          {batchSuccessMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" /> {batchSuccessMsg}
            </div>
          )}

          <button
            onClick={handleBatchProcess}
            disabled={isProcessingBatch || !batchText.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
          >
            {isProcessingBatch ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-orange-300" /> Criando Demandas em Lote com Gemini...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-orange-300" /> Processar e Salvar Lote
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
