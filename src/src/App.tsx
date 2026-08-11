import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  Bell, 
  Sparkles, 
  Plus, 
  Cloud, 
  CloudCheck, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  CheckSquare, 
  Bot, 
  LayoutGrid, 
  ListFilter,
  FileSpreadsheet,
  Globe,
  Folder
} from 'lucide-react';
import { Demand, DemandCategory, DemandPriority, DemandStatus, DemandFilterOptions } from './types';
import { loadDemandsFromStorage, saveDemandsToStorage, getDaysRemainingText } from './utils/helpers';
import { subscribeToDemands, saveDemandToFirestore, deleteDemandFromFirestore, saveMultipleDemandsToFirestore } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { KanbanBoard } from './components/KanbanBoard';
import { DemandTable } from './components/DemandTable';
import { NewDemandModal } from './components/NewDemandModal';
import { DemandDetailModal } from './components/DemandDetailModal';
import { AlertsDrawer } from './components/AlertsDrawer';
import { AiAssistantDrawer } from './components/AiAssistantDrawer';
import { VercelDeployModal } from './components/VercelDeployModal';
import { ExportImportModal } from './components/ExportImportModal';

export default function App() {
  const [demands, setDemands] = useState<Demand[]>(loadDemandsFromStorage);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Modal / Drawer States
  const [isNewDemandOpen, setIsNewDemandOpen] = useState(false);
  const [selectedDemand, setSelectedDemand] = useState<Demand | null>(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [isVercelDeployOpen, setIsVercelDeployOpen] = useState(false);
  const [isExportImportOpen, setIsExportImportOpen] = useState(false);

  // Filters State
  const [filters, setFilters] = useState<DemandFilterOptions>({
    search: '',
    category: '',
    folder: '',
    priority: '',
    status: '',
    onlyAlerts: false,
    inputType: ''
  });

  // Firestore Real-Time Listener
  useEffect(() => {
    const unsubscribe = subscribeToDemands(
      (cloudDemands) => {
        if (cloudDemands && cloudDemands.length > 0) {
          setDemands(cloudDemands);
          saveDemandsToStorage(cloudDemands);
          setIsCloudSynced(true);
        } else if (cloudDemands && cloudDemands.length === 0) {
          // If Firestore is empty, seed initial demands to cloud
          const initial = loadDemandsFromStorage();
          saveMultipleDemandsToFirestore(initial);
          setIsCloudSynced(true);
        }
      },
      (err) => {
        console.warn('Utilizando modo local/offline do localStorage:', err);
        setIsCloudSynced(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Save/Update Demand
  const handleSaveDemand = async (newOrUpdated: Demand) => {
    // Optimistic state update
    const exists = demands.some(d => d.id === newOrUpdated.id);
    let updatedList: Demand[];
    if (exists) {
      updatedList = demands.map(d => d.id === newOrUpdated.id ? newOrUpdated : d);
    } else {
      updatedList = [newOrUpdated, ...demands];
    }

    setDemands(updatedList);
    saveDemandsToStorage(updatedList);

    // Save to Firestore Cloud
    try {
      await saveDemandToFirestore(newOrUpdated);
      setIsCloudSynced(true);
    } catch (err) {
      console.error('Falha ao sincronizar com Firestore Cloud:', err);
      setIsCloudSynced(false);
    }
  };

  // Batch Save Demands
  const handleBatchImportDemands = async (batch: Demand[]) => {
    const updatedList = [...batch, ...demands];
    setDemands(updatedList);
    saveDemandsToStorage(updatedList);

    try {
      await saveMultipleDemandsToFirestore(batch);
      setIsCloudSynced(true);
    } catch (err) {
      console.error('Falha ao salvar lote no Firestore:', err);
    }
  };

  // Delete Demand
  const handleDeleteDemand = async (demandId: string) => {
    const updatedList = demands.filter(d => d.id !== demandId);
    setDemands(updatedList);
    saveDemandsToStorage(updatedList);

    try {
      await deleteDemandFromFirestore(demandId);
    } catch (err) {
      console.error('Falha ao excluir do Firestore:', err);
    }
  };

  // Quick status change from Kanban or Table
  const handleQuickStatusChange = async (demandId: string, newStatus: DemandStatus) => {
    const target = demands.find(d => d.id === demandId);
    if (!target) return;

    const updated: Demand = {
      ...target,
      status: newStatus,
      updatedAt: new Date().toISOString()
    };

    handleSaveDemand(updated);
  };

  // Unique Folders List
  const availableFolders = Array.from(
    new Set(demands.map(d => d.folder || 'Geral & Operações'))
  ).filter(Boolean);

  // Filter demands
  const filteredDemands = demands.filter((d) => {
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const matchTitle = d.title.toLowerCase().includes(q);
      const matchDesc = d.description.toLowerCase().includes(q);
      const matchReq = (d.requester || '').toLowerCase().includes(q);
      const matchFolder = (d.folder || '').toLowerCase().includes(q);
      const matchTags = d.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchDesc && !matchReq && !matchFolder && !matchTags) return false;
    }

    if (filters.folder && (d.folder || 'Geral & Operações') !== filters.folder) return false;
    if (filters.category && d.category !== filters.category) return false;
    if (filters.priority && d.priority !== filters.priority) return false;
    if (filters.status && d.status !== filters.status) return false;
    if (filters.inputType && d.originalInputType !== filters.inputType) return false;

    if (filters.onlyAlerts) {
      if (d.status === 'Concluído' || d.status === 'Cancelado') return false;
      const daysInfo = getDaysRemainingText(d.deadline, d.status);
      if (!daysInfo.isAlert) return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalCount = demands.length;
  const pendingCount = demands.filter(d => d.status === 'Pendente').length;
  const inProgressCount = demands.filter(d => d.status === 'Em Andamento').length;
  const completedCount = demands.filter(d => d.status === 'Concluído').length;

  const alertDemandsCount = demands.filter(d => {
    if (d.status === 'Concluído' || d.status === 'Cancelado') return false;
    const daysInfo = getDaysRemainingText(d.deadline, d.status);
    return daysInfo.isAlert;
  }).length;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      
      {/* Top Navbar */}
      <Navbar
        onOpenNewDemand={() => setIsNewDemandOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenAiAssistant={() => setIsAiAssistantOpen(true)}
        onOpenExportImport={() => setIsExportImportOpen(true)}
        activeAlertCount={alertDemandsCount}
        viewMode={viewMode}
        onToggleViewMode={(mode) => setViewMode(mode)}
        totalDemandsCount={totalCount}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Banner: Cloud Persistence & Vercel Deploy Trigger */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 text-white shadow-md relative overflow-hidden border border-emerald-800/40">
          <div className="relative z-10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <CloudCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Armazenamento em Nuvem Ativo</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" /> Firestore Cloud
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Suas demandas estão sincronizadas em tempo real. Pronto para publicar na Vercel.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsVercelDeployOpen(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl font-bold text-xs shadow-md shadow-orange-500/20 transition-all cursor-pointer"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Link Vercel & Deploy</span>
            </button>
          </div>
        </div>

        {/* Dashboard Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Registrado
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {totalCount}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                Demandas
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
              Pendentes / Em Fila
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {pendingCount + inProgressCount}
              </span>
              <span className="text-xs font-semibold text-amber-600/80">
                {pendingCount} novas
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Concluídas
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {completedCount}
              </span>
              <span className="text-xs font-semibold text-emerald-600/80">
                {totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0}% resolução
              </span>
            </div>
          </div>

          <div 
            onClick={() => setIsAlertsOpen(true)}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-rose-200 dark:border-rose-950/60 shadow-2xs cursor-pointer hover:border-rose-400 transition-colors"
          >
            <span className="text-[11px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block flex items-center justify-between">
              <span>Alertas & Atrasos</span>
              {alertDemandsCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {alertDemandsCount}
              </span>
              <span className="text-xs font-semibold text-rose-600/80">
                ver detalhes &rarr;
              </span>
            </div>
          </div>
        </div>

        {/* Folder Pills Bar (Quick Navigation) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
            <Folder className="w-3.5 h-3.5 text-emerald-600" /> Pastas:
          </span>
          <button
            onClick={() => setFilters({ ...filters, folder: '' })}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer ${
              filters.folder === ''
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
            }`}
          >
            Todas ({demands.length})
          </button>
          {availableFolders.map((fName) => {
            const count = demands.filter(d => (d.folder || 'Geral & Operações') === fName).length;
            const isSelected = filters.folder === fName;
            return (
              <button
                key={fName}
                onClick={() => setFilters({ ...filters, folder: isSelected ? '' : fName })}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
                }`}
              >
                <span>{fName}</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row items-center gap-3">
            
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Buscar por título, palavra-chave, pasta, tag, solicitante..."
                className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            {/* Filter Selects */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              
              {/* Folder Filter */}
              <select
                value={filters.folder}
                onChange={(e) => setFilters({ ...filters, folder: e.target.value })}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Todas Pastas</option>
                {availableFolders.map(fName => (
                  <option key={fName} value={fName}>{fName}</option>
                ))}
              </select>

              {/* Category Filter */}
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="">Todas Categorias</option>
                <option value="Projeto">Projeto</option>
                <option value="Suporte/Bug">Suporte/Bug</option>
                <option value="Atendimento/Cliente">Atendimento/Cliente</option>
                <option value="Administrativo">Administrativo</option>
                <option value="Reunião/Alinhamento">Reunião/Alinhamento</option>
                <option value="Processos/Operacional">Processos/Operacional</option>
                <option value="Outros">Outros</option>
              </select>

              {/* Priority Filter */}
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="">Todas Prioridades</option>
                <option value="Crítica">Crítica 🚨</option>
                <option value="Alta">Alta</option>
                <option value="Média">Média</option>
                <option value="Baixa">Baixa</option>
              </select>

              {/* Formato de Entrada Filter */}
              <select
                value={filters.inputType}
                onChange={(e) => setFilters({ ...filters, inputType: e.target.value })}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
              >
                <option value="">Todos Formatos</option>
                <option value="texto">Texto Copiado</option>
                <option value="foto">Foto / Print</option>
                <option value="pdf">Documento PDF</option>
                <option value="planilha">Planilha</option>
              </select>

              {/* Only Alerts Toggle Button */}
              <button
                onClick={() => setFilters({ ...filters, onlyAlerts: !filters.onlyAlerts })}
                className={`px-3 py-2 text-xs font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
                  filters.onlyAlerts
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-rose-600'
                }`}
              >
                <Bell className="w-3.5 h-3.5" /> Apenas Alertas
              </button>

            </div>

          </div>
        </div>

        {/* View Mode Content (Kanban or Table) */}
        {viewMode === 'kanban' ? (
          <KanbanBoard
            demands={filteredDemands}
            onSelectDemand={(demand) => setSelectedDemand(demand)}
            onQuickStatusChange={handleQuickStatusChange}
          />
        ) : (
          <DemandTable
            demands={filteredDemands}
            onSelectDemand={(demand) => setSelectedDemand(demand)}
            onStatusChange={handleQuickStatusChange}
          />
        )}

      </main>

      {/* Modals & Drawers */}
      <NewDemandModal
        isOpen={isNewDemandOpen}
        onClose={() => setIsNewDemandOpen(false)}
        onSave={handleSaveDemand}
      />

      <DemandDetailModal
        demand={selectedDemand}
        isOpen={!!selectedDemand}
        onClose={() => setSelectedDemand(null)}
        onUpdate={handleSaveDemand}
        onDelete={handleDeleteDemand}
      />

      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        demands={demands}
        onSelectDemand={(demand) => setSelectedDemand(demand)}
      />

      <AiAssistantDrawer
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        demands={demands}
      />

      <VercelDeployModal
        isOpen={isVercelDeployOpen}
        onClose={() => setIsVercelDeployOpen(false)}
      />

      <ExportImportModal
        isOpen={isExportImportOpen}
        onClose={() => setIsExportImportOpen(false)}
        demands={demands}
        onImportDemands={handleBatchImportDemands}
      />

    </div>
  );
}
