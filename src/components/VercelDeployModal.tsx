import React, { useState } from 'react';
import { X, CloudCheck, ExternalLink, CheckCircle2, Copy, Sparkles, Server, ArrowRight } from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface VercelDeployModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const VercelDeployModal: React.FC<VercelDeployModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyEnv = () => {
    const envContent = `GEMINI_API_KEY=Sua_Chave_Gemini_Aqui
VITE_FIREBASE_PROJECT_ID=${firebaseConfig.projectId}
VITE_FIREBASE_API_KEY=${firebaseConfig.apiKey}
VITE_FIREBASE_AUTH_DOMAIN=${firebaseConfig.authDomain}
VITE_FIREBASE_FIRESTORE_DB_ID=${firebaseConfig.firestoreDatabaseId}`;

    navigator.clipboard.writeText(envContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <CloudCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Armazenamento em Nuvem & Deploy Vercel
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Seus dados já estão sincronizados no Firestore e prontos para publicação
            </p>
          </div>
        </div>

        {/* Cloud Status Banner */}
        <div className="mb-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="text-xs text-emerald-900 dark:text-emerald-200">
            <p className="font-semibold text-sm mb-1">🔥 Banco de Dados na Nuvem Ativo!</p>
            <p>
              Instância Cloud: <code className="bg-emerald-100 dark:bg-emerald-900/60 px-1.5 py-0.5 rounded font-mono font-bold">DemandFlow AI Firestore</code>
            </p>
            <p className="mt-1 opacity-90">
              Todas as demandas registradas por você ou sua equipe são armazenadas e sincronizadas em tempo real na nuvem.
            </p>
          </div>
        </div>

        {/* Steps for Vercel Deploy */}
        <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300">
          <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
            <Server className="w-4 h-4 text-indigo-500" />
            Como publicar seu link definitivo na Vercel:
          </h3>

          <ol className="space-y-3 pl-2">
            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <strong className="text-slate-900 dark:text-white">Exporte o projeto para o GitHub:</strong>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Clique no menu superior do AI Studio &gt; <em>Export to GitHub</em> ou faça o download em formato ZIP.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <strong className="text-slate-900 dark:text-white">Importe no Vercel (vercel.com):</strong>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Acesse sua conta Vercel, clique em <strong>"Add New..." &gt; "Project"</strong> e selecione o repositório do GitHub. O Vercel detectará as configurações do `vercel.json` automaticamente.
                </p>
              </div>
            </li>

            <li className="flex items-start gap-3">
              <span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <strong className="text-slate-900 dark:text-white">Adicione as Variáveis de Ambiente no Vercel:</strong>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Em <em>Environment Variables</em> no painel da Vercel, configure a chave da API Gemini:
                </p>

                <div className="relative bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-xs border border-slate-800">
                  <div>GEMINI_API_KEY = sua_chave_api</div>
                  <button
                    onClick={handleCopyEnv}
                    className="absolute top-2 right-2 flex items-center gap-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded transition-colors"
                  >
                    <Copy className="w-3 h-3" />
                    {copied ? 'Copiado!' : 'Copiar Variáveis'}
                  </button>
                </div>
              </div>
            </li>
          </ol>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <a
            href="https://vercel.com/new"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 rounded-xl font-semibold text-xs transition-all shadow-sm"
          >
            Acessar Vercel <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
