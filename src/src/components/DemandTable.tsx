import React from 'react';
import { Demand, DemandStatus } from '../types';
import { getPriorityBadge, getStatusBadge, getDaysRemainingText, formatDateBR } from '../utils/helpers';
import { Clock, User, ArrowUpDown, ChevronRight, CheckCircle2, Folder } from 'lucide-react';

interface DemandTableProps {
  demands: Demand[];
  onSelectDemand: (demand: Demand) => void;
  onStatusChange: (demandId: string, status: DemandStatus) => void;
}

export const DemandTable: React.FC<DemandTableProps> = ({
  demands,
  onSelectDemand,
  onStatusChange
}) => {
  if (demands.length === 0) {
    return (
      <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
        <p className="text-slate-500 text-sm font-medium">Nenhuma demanda encontrada com os filtros selecionados.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs sm:text-sm text-slate-700 dark:text-slate-300">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="px-4 py-3.5">Título & Solicitante</th>
              <th className="px-4 py-3.5">Pasta de Destino</th>
              <th className="px-4 py-3.5">Categoria</th>
              <th className="px-4 py-3.5">Prioridade</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5">Prazo / Alerta</th>
              <th className="px-4 py-3.5 text-center">Progresso</th>
              <th className="px-4 py-3.5 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
            {demands.map((demand) => {
              const priority = getPriorityBadge(demand.priority);
              const status = getStatusBadge(demand.status);
              const daysInfo = getDaysRemainingText(demand.deadline, demand.status);
              const completedActions = demand.actionItems.filter(a => a.completed).length;
              const totalActions = demand.actionItems.length;

              return (
                <tr
                  key={demand.id}
                  onClick={() => onSelectDemand(demand)}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3.5">
                    <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {demand.title}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span>{demand.requester || 'Solicitante N/I'}</span>
                      {demand.department && <span>• {demand.department}</span>}
                    </div>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-xs font-semibold border border-emerald-200/80 dark:border-emerald-900/80">
                      <Folder className="w-3 h-3 text-emerald-600" /> {demand.folder || 'Geral & Operações'}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className="px-2.5 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                      {demand.category}
                    </span>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`px-2.5 py-0.5 rounded text-xs font-bold border ${priority.bg} ${priority.border}`}>
                      {priority.text}
                    </span>
                  </td>

                  <td className="px-4 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={demand.status}
                      onChange={(e) => onStatusChange(demand.id, e.target.value as DemandStatus)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Pendente">Pendente</option>
                      <option value="Em Andamento">Em Andamento</option>
                      <option value="Aguardando Retorno">Aguardando Retorno</option>
                      <option value="Concluído">Concluído</option>
                    </select>
                  </td>

                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${daysInfo.colorClass}`}>
                      {daysInfo.text}
                    </span>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      {formatDateBR(demand.deadline)}
                    </div>
                  </td>

                  <td className="px-4 py-3.5 text-center font-mono text-xs">
                    {totalActions > 0 ? (
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                        {completedActions}/{totalActions}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => onSelectDemand(demand)}
                      className="p-1.5 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
