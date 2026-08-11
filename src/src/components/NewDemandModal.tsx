import React, { useState, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  FileText, 
  Camera, 
  FileUp, 
  FileSpreadsheet, 
  Loader2, 
  AlertTriangle, 
  CheckCircle2, 
  Plus, 
  Trash2,
  Calendar,
  Clock,
  User,
  Building2,
  Tag,
  Folder
} from 'lucide-react';
import { Demand, DemandCategory, DemandPriority, DemandAnalysisResult } from '../types';

interface NewDemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (demand: Demand) => void;
  onBatchSave?: (demands: Demand[]) => void;
}

export const NewDemandModal: React.FC<NewDemandModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onBatchSave
}) => {
  const [activeTab, setActiveTab] = useState<'texto' | 'foto' | 'pdf' | 'planilha'>('texto');
  
  // Input contents
  const [textContent, setTextContent] = useState('');
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState('');
  const [fileMime, setFileMime] = useState('');
  const [fileBase64, setFileBase64] = useState('');

  // AI Loading & Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<DemandAnalysisResult | null>(null);

  // Editable Form State (populated by AI or manually edited)
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DemandCategory>('Processos/Operacional');
  const [folder, setFolder] = useState<string>('Geral & Operações');
  const [customFolder, setCustomFolder] = useState<string>('');
  const [priority, setPriority] = useState<DemandPriority>('Média');
  const [deadline, setDeadline] = useState<string>('');
  const [requester, setRequester] = useState('');
  const [department, setDepartment] = useState('');
  const [estimatedHours, setEstimatedHours] = useState<number>(2);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [actionItems, setActionItems] = useState<string[]>([]);
  const [newActionInput, setNewActionInput] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setTextContent('');
    setFilePreview(null);
    setFileName('');
    setFileMime('');
    setFileBase64('');
    setIsAnalyzing(false);
    setAnalysisError(null);
    setAnalysisResult(null);
    setTitle('');
    setDescription('');
    setCategory('Processos/Operacional');
    setFolder('Geral & Operações');
    setCustomFolder('');
    setPriority('Média');
    setDeadline('');
    setRequester('');
    setDepartment('');
    setEstimatedHours(2);
    setTags([]);
    setActionItems([]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setFileMime(file.type);

    const reader = new FileReader();
    
    if (file.type.startsWith('image/')) {
      reader.onload = () => {
        const result = reader.result as string;
        setFilePreview(result);
        setFileBase64(result);
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      reader.onload = () => {
        const result = reader.result as string;
        setFilePreview('PDF: ' + file.name);
        setFileBase64(result);
      };
      reader.readAsDataURL(file);
    } else {
      // Spreadsheet or text file
      reader.onload = () => {
        const result = reader.result as string;
        setFilePreview('Arquivo: ' + file.name);
        setTextContent(result);
      };
      reader.readAsText(file);
    }
  };

  const handleAnalyzeWithAI = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);

    try {
      let payloadContent = '';
      if (activeTab === 'texto') {
        if (!textContent.trim()) {
          throw new Error('Cole ou digite o texto da demanda.');
        }
        payloadContent = textContent;
      } else if (activeTab === 'foto' || activeTab === 'pdf') {
        if (!fileBase64) {
          throw new Error('Por favor, selecione um arquivo de imagem ou PDF.');
        }
        payloadContent = fileBase64;
      } else if (activeTab === 'planilha') {
        if (!textContent.trim() && !fileBase64) {
          throw new Error('Selecione uma planilha ou cole o conteúdo da tabela.');
        }
        payloadContent = textContent || fileBase64;
      }

      const response = await fetch('/api/gemini/analyze-demand', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          content: payloadContent,
          fileName,
          mimeType: fileMime
        })
      });

      const resData = await response.json();

      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Erro ao analisar com a Inteligência Artificial.');
      }

      const data: DemandAnalysisResult = resData.data;
      setAnalysisResult(data);

      // Populate form state with AI analysis
      setTitle(data.title || 'Demanda ' + new Date().toLocaleTimeString());
      setDescription(data.description || textContent);
      setCategory(data.category || 'Outros');
      if (data.folder) {
        setFolder(data.folder);
      } else {
        setFolder('Geral & Operações');
      }
      setPriority(data.priority || 'Média');
      if (data.suggestedDeadline) {
        setDeadline(data.suggestedDeadline);
      } else {
        // Default deadline: +2 days
        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 2);
        setDeadline(defaultDate.toISOString().split('T')[0]);
      }
      setRequester(data.requester || '');
      setDepartment(data.department || '');
      setEstimatedHours(data.estimatedHours || 2);
      setTags(data.tags || []);
      setActionItems(data.actionItems || []);

    } catch (err: any) {
      console.error('Erro de análise:', err);
      setAnalysisError(err.message || 'Falha na conexão com a IA Gemini.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAddTag = () => {
    if (newTagInput.trim() && !tags.includes(newTagInput.trim())) {
      setTags([...tags, newTagInput.trim()]);
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleAddAction = () => {
    if (newActionInput.trim()) {
      setActionItems([...actionItems, newActionInput.trim()]);
      setNewActionInput('');
    }
  };

  const handleRemoveAction = (idx: number) => {
    setActionItems(actionItems.filter((_, i) => i !== idx));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Informe um título para a demanda.');
      return;
    }

    const effectiveFolder = folder === 'custom' ? (customFolder.trim() || 'Geral & Operações') : folder;

    const newDemand: Demand = {
      id: 'dem-' + Date.now(),
      title: title.trim(),
      description: description.trim() || title.trim(),
      originalInputType: activeTab,
      originalInputPreview: fileName || (textContent.slice(0, 100) + (textContent.length > 100 ? '...' : '')),
      category,
      folder: effectiveFolder,
      priority,
      status: 'Pendente',
      requester: requester.trim(),
      department: department.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deadline: deadline || undefined,
      estimatedHours: Number(estimatedHours) || 2,
      tags,
      actionItems: actionItems.map((actTitle, index) => ({
        id: `act-${Date.now()}-${index}`,
        title: actTitle,
        completed: false
      })),
      notes: [
        {
          id: 'n-init-' + Date.now(),
          createdAt: new Date().toISOString(),
          text: `Demanda registrada via ${activeTab.toUpperCase()}${analysisResult ? ' com categorização via IA Gemini' : ''}.`,
          author: 'Sistema'
        }
      ],
      alertConfig: {
        enabled: true,
        notifyDaysBefore: 1,
        alertOnOverdue: true
      }
    };

    onSave(newDemand);
    resetForm();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden relative transition-colors">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-emerald-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                Registrar Nova Demanda
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                A IA do Gemini analisa qualquer texto, foto, PDF ou planilha para categorização imediata.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Tabs for Input Type */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              1. Selecione o formato de entrada
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => { setActiveTab('texto'); setFilePreview(null); }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeTab === 'texto'
                    ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileText className="w-4 h-4 text-emerald-600" /> Texto Copiado
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('foto'); fileInputRef.current?.click(); }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeTab === 'foto'
                    ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <Camera className="w-4 h-4 text-emerald-600" /> Foto / Print
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('pdf'); fileInputRef.current?.click(); }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeTab === 'pdf'
                    ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileUp className="w-4 h-4 text-emerald-600" /> Documento PDF
              </button>

              <button
                type="button"
                onClick={() => { setActiveTab('planilha'); fileInputRef.current?.click(); }}
                className={`flex items-center justify-center gap-2 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  activeTab === 'planilha'
                    ? 'border-emerald-600 bg-emerald-50/80 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 shadow-xs'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Planilha
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept={
                activeTab === 'foto'
                  ? 'image/*'
                  : activeTab === 'pdf'
                  ? 'application/pdf'
                  : activeTab === 'planilha'
                  ? '.csv,.xlsx,.xls,.txt'
                  : '*'
              }
              className="hidden"
            />
          </div>

          {/* Input Box based on Active Tab */}
          <div className="space-y-3">
            {activeTab === 'texto' ? (
              <div>
                <textarea
                  rows={4}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Cole aqui a demanda copiada do e-mail, WhatsApp, Teams ou anotação de reunião..."
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center bg-slate-50/50 dark:bg-slate-950/50">
                {filePreview ? (
                  <div className="space-y-3">
                    {filePreview.startsWith('data:image/') ? (
                      <img src={filePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain shadow" />
                    ) : (
                      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg text-emerald-700 dark:text-emerald-400 font-semibold text-xs inline-block">
                        {filePreview}
                      </div>
                    )}
                    <p className="text-xs text-slate-500">{fileName} ({fileMime || 'arquivo'})</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-emerald-600 dark:text-emerald-400 underline font-medium"
                    >
                      Trocar Arquivo
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    <FileUp className="w-8 h-8 mx-auto text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Clique para selecionar o arquivo ({activeTab.toUpperCase()})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Suporta PNG, JPG, PDF, CSV, Excel e arquivos de texto.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* AI Analyze Action Button */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleAnalyzeWithAI}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-orange-300" /> Analisando Conteúdo com Gemini...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-orange-300" /> Analisar & Categorizar com IA
                  </>
                )}
              </button>

              {analysisResult && (
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Analisado com Sucesso!
                </span>
              )}
            </div>

            {analysisError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{analysisError}</span>
              </div>
            )}
          </div>

          {/* Form for Demand Details (Editable) */}
          <form onSubmit={handleFormSubmit} className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              2. Dados da Demanda (Ajuste se necessário)
            </h3>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Título da Demanda *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Corrigir erro de emissão na nota fiscal #492"
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-900 dark:text-white"
              />
            </div>

            {/* Folder / Pasta & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Folder className="w-3.5 h-3.5 text-emerald-600" /> Pasta de Destino
                </label>
                <select
                  value={folder}
                  onChange={(e) => setFolder(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="Geral & Operações">Geral & Operações</option>
                  <option value="Jurídico & Contratos">Jurídico & Contratos</option>
                  <option value="Sistemas & TI">Sistemas & TI</option>
                  <option value="Projetos Especiais">Projetos Especiais</option>
                  <option value="Atendimento & Clientes">Atendimento & Clientes</option>
                  <option value="custom">+ Criar Nova Pasta...</option>
                </select>

                {folder === 'custom' && (
                  <input
                    type="text"
                    required
                    value={customFolder}
                    onChange={(e) => setCustomFolder(e.target.value)}
                    placeholder="Digite o nome da nova pasta..."
                    className="mt-2 w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium text-slate-900 dark:text-white"
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Categoria
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as DemandCategory)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="Processos/Operacional">Processos/Operacional</option>
                  <option value="Projeto">Projeto</option>
                  <option value="Suporte/Bug">Suporte/Bug</option>
                  <option value="Atendimento/Cliente">Atendimento/Cliente</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Reunião/Alinhamento">Reunião/Alinhamento</option>
                  <option value="Outros">Outros</option>
                </select>
              </div>
            </div>

            {/* Priority & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Prioridade
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as DemandPriority)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                >
                  <option value="Baixa">Baixa</option>
                  <option value="Média">Média</option>
                  <option value="Alta">Alta</option>
                  <option value="Crítica">Crítica 🚨</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Prazo Limite (Resolução)
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Requester, Department & Estimated Hours */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> Horas Estimadas
                </label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={estimatedHours}
                  onChange={(e) => setEstimatedHours(parseFloat(e.target.value))}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Solicitante / Cliente
                </label>
                <input
                  type="text"
                  value={requester}
                  onChange={(e) => setRequester(e.target.value)}
                  placeholder="Ex: Mariana Lima"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" /> Área / Departamento
                </label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Ex: Jurídico"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Descrição Detalhada
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição resumida do que precisa ser resolvido..."
                className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none text-slate-900 dark:text-white"
              />
            </div>

            {/* Action Items / Checklist */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Passos para Resolução (Checklist)
              </label>
              <div className="space-y-2 mb-2">
                {actionItems.map((act, index) => (
                  <div key={index} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                    <span className="w-4 text-center font-bold text-slate-400">{index + 1}.</span>
                    <span className="flex-1 text-slate-800 dark:text-slate-200">{act}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(index)}
                      className="text-slate-400 hover:text-rose-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newActionInput}
                  onChange={(e) => setNewActionInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddAction(); } }}
                  placeholder="Adicionar novo passo..."
                  className="flex-1 px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleAddAction}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg"
                >
                  <Plus className="w-3.5 h-3.5 inline text-emerald-600" /> Adicionar
                </button>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Salvar Demanda
              </button>
            </div>

          </form>

        </div>
      </div>
    </div>
  );
};
