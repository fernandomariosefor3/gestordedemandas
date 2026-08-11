import React from 'react';
import { 
  PlusCircle, 
  Sparkles, 
  Bell, 
  LayoutGrid, 
  ListFilter, 
  Bot, 
  Download, 
  FileSpreadsheet,
  CheckSquare
} from 'lucide-react';

interface NavbarProps {
  onOpenNewDemand: () => void;
  onOpenAlerts: () => void;
  onOpenAiAssistant: () => void;
  onOpenExportImport: () => void;
  activeAlertCount: number;
  viewMode: 'kanban' | 'list';
  onToggleViewMode: (mode: 'kanban' | 'list') => void;
  totalDemandsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewDemand,
  onOpenAlerts,
  onOpenAiAssistant,
  onOpenExportImport,
  activeAlertCount,
  viewMode,
  onToggleViewMode,
  totalDemandsCount
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-slate-900 dark:text-white text-lg leading-none tracking-tight">
                Gestor de Demandas
              </h1>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <Sparkles className="w-2.5 h-2.5 text-orange-500" /> IA Gemini
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Análise multimídia de fotos, PDFs, planilhas e texto
            </p>
          </div>
        </div>

        {/* View mode toggle & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* View mode switcher */}
          <div className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onToggleViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Kanban
            </button>
            <button
              onClick={() => onToggleViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 font-bold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              Tabela
            </button>
          </div>

          {/* AI Assistant Drawer Trigger */}
          <button
            onClick={onOpenAiAssistant}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 rounded-lg border border-emerald-200 dark:border-emerald-800 transition-colors"
            title="Abrir Co-Piloto de IA"
          >
            <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline font-semibold text-emerald-800 dark:text-emerald-300">Assistente IA</span>
          </button>

          {/* Export / Backup Trigger */}
          <button
            onClick={onOpenExportImport}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Relatórios & Backup"
          >
            <Download className="w-4 h-4" />
          </button>

          {/* Alerts Bell Button */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors"
            title="Alertas & Prazos"
          >
            <Bell className="w-4 h-4 text-orange-500" />
            {activeAlertCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-900 animate-pulse">
                {activeAlertCount}
              </span>
            )}
          </button>

          {/* Primary Action Button: Nova Demanda */}
          <button
            onClick={onOpenNewDemand}
            className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm shadow-emerald-600/30 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4 text-orange-300" />
            <span>Registrar Demanda</span>
          </button>

        </div>
      </div>
    </header>
  );
};
