import React from 'react';
import { X, AlertTriangle, Clock, Bell, CheckCircle2, ChevronRight, ShieldAlert } from 'lucide-react';
import { Demand } from '../types';
import { getDaysRemainingText, formatDateBR, getPriorityBadge } from '../utils/helpers';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  demands: Demand[];
  onSelectDemand: (demand: Demand) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  demands,
  onSelectDemand
}) => {
  if (!isOpen) return null;

  // Filter demands with active alerts (Overdue or Due Today or Due within 2 days)
  const alertDemands = demands.filter(d => {
    if (d.status === 'Concluído' || d.status === 'Cancelado') return false;
    const daysInfo = getDaysRemainingText(d.deadline, d.status);
    return daysInfo.isAlert;
  });

  const overdueCount = alertDemands.filter(d => {
    const daysInfo = getDaysRemainingText(d.deadline, d.status);
    return daysInfo.text.includes('Atrasado');
  }).length;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/50 backdrop-blur-xs">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 transition-colors">
        
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                Alertas de Prazos & Gargalos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {alertDemands.length} demanda(s) requerem atenção imediata
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Metric Strip */}
        <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
            <span className="text-[11px] font-bold uppercase text-rose-700 dark:text-rose-400 block">
              Atrasadas 🚨
            </span>
            <span className="text-xl font-black text-rose-900 dark:text-rose-200">
              {overdueCount}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60">
            <span className="text-[11px] font-bold uppercase text-amber-700 dark:text-amber-400 block">
              Vencem em Breve ⏳
            </span>
            <span className="text-xl font-black text-amber-900 dark:text-amber-200">
              {alertDemands.length - overdueCount}
            </span>
          </div>
        </div>

        {/* Demand Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alertDemands.length === 0 ? (
            <div className="p-8 text-center text-slate-400 space-y-2">
              <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-500" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Tudo sob controle!
              </p>
              <p className="text-xs">
                Nenhuma demanda está atrasada ou próxima do vencimento.
              </p>
            </div>
          ) : (
            alertDemands.map((demand) => {
              const priority = getPriorityBadge(demand.priority);
              const daysInfo = getDaysRemainingText(demand.deadline, demand.status);

              return (
                <div
                  key={demand.id}
                  onClick={() => {
                    onSelectDemand(demand);
                    onClose();
                  }}
                  className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-indigo-500 transition-all cursor-pointer space-y-2.5 shadow-2xs group"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${priority.bg} ${priority.border}`}>
                      {priority.text}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${daysInfo.colorClass}`}>
                      {daysInfo.text}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-indigo-600 transition-colors">
                    {demand.title}
                  </h4>

                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Solicitante: <strong>{demand.requester || 'N/I'}</strong></span>
                    <span>Prazo: {formatDateBR(demand.deadline)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};
