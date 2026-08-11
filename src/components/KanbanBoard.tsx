import React from 'react';
import { Demand, DemandStatus } from '../types';
import { getPriorityBadge, getDaysRemainingText, formatDateBR } from '../utils/helpers';
import { CheckCircle2, Clock, Calendar, User, AlertTriangle, ArrowRight, Folder } from 'lucide-react';

interface KanbanBoardProps {
  demands: Demand[];
  onSelectDemand: (demand: Demand) => void;
  onQuickStatusChange: (demandId: string, newStatus: DemandStatus) => void;
}

const COLUMNS: { id: DemandStatus; title: string; colorClass: string; bgClass: string }[] = [
  { id: 'Pendente', title: 'Pendente', colorClass: 'text-amber-700 dark:text-amber-400', bgClass: 'bg-amber-500/10' },
  { id: 'Em Andamento', title: 'Em Andamento', colorClass: 'text-blue-700 dark:text-blue-400', bgClass: 'bg-blue-500/10' },
  { id: 'Aguardando Retorno', title: 'Aguardando Retorno', colorClass: 'text-purple-700 dark:text-purple-400', bgClass: 'bg-purple-500/10' },
  { id: 'Concluído', title: 'Concluído', colorClass: 'text-emerald-700 dark:text-emerald-400', bgClass: 'bg-emerald-500/10' }
];

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  demands,
  onSelectDemand,
  onQuickStatusChange
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
      {COLUMNS.map((col) => {
        const colDemands = demands.filter((d) => d.status === col.id);

        return (
          <div
            key={col.id}
            className="bg-slate-100/70 dark:bg-slate-900/60 rounded-2xl p-3 border border-slate-200/80 dark:border-slate-800/80 flex flex-col min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200 dark:border-slate-800 px-1">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${col.bgClass.replace('/10', '')}`} />
                <h3 className={`font-bold text-xs uppercase tracking-wider ${col.colorClass}`}>
                  {col.title}
                </h3>
              </div>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-xs border border-slate-200 dark:border-slate-700">
                {colDemands.length}
              </span>
            </div>

            {/* Column Cards List */}
            <div className="flex-1 space-y-3 overflow-y-auto max-h-[calc(100vh-240px)] pr-0.5">
              {colDemands.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800/80 rounded-xl text-xs text-slate-400 font-medium">
                  Nenhuma demanda aqui
                </div>
              ) : (
                colDemands.map((demand) => {
                  const priority = getPriorityBadge(demand.priority);
                  const daysInfo = getDaysRemainingText(demand.deadline, demand.status);
                  const completedActions = demand.actionItems.filter(a => a.completed).length;
                  const totalActions = demand.actionItems.length;
                  const progressPct = totalActions > 0 ? Math.round((completedActions / totalActions) * 100) : 0;

                  return (
                    <div
                      key={demand.id}
                      onClick={() => onSelectDemand(demand)}
                      className="group bg-white dark:bg-slate-900 rounded-xl p-4 border border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3 relative overflow-hidden"
                    >
                      {/* Priority strip indicator */}
                      {daysInfo.isAlert && (
                        <div className="absolute top-0 left-0 right-0 h-1 bg-rose-500 animate-pulse" />
                      )}

                      {/* Folder & Category badges */}
                      <div className="flex items-center justify-between gap-1.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-900 px-2 py-0.5 rounded-full truncate max-w-[130px] flex items-center gap-1">
                          <Folder className="w-2.5 h-2.5" /> {demand.folder || 'Geral'}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priority.bg} ${priority.border}`}>
                          {priority.text}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {demand.title}
                      </h4>

                      {/* Action items progress */}
                      {totalActions > 0 && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-500">
                            <span>Checklist</span>
                            <span className="font-bold text-slate-700 dark:text-slate-300">{completedActions}/{totalActions} ({progressPct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-600 h-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer metadata */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px]">
                        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-semibold ${daysInfo.colorClass}`}>
                          {daysInfo.text}
                        </span>

                        {demand.requester && (
                          <span className="text-slate-400 truncate max-w-[100px] flex items-center gap-1">
                            <User className="w-3 h-3" /> {demand.requester.split(' ')[0]}
                          </span>
                        )}
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
