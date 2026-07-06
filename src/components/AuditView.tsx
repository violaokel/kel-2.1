/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { ActivityLog, StockTransaction, UserProfile, Product } from "../types";
import { 
  Shield, 
  Database, 
  Trash2, 
  ShieldAlert, 
  FileLock2, 
  Download, 
  BarChart3, 
  Moon, 
  Sun, 
  TrendingDown, 
  History,
  Activity,
  Award
} from "lucide-react";
import { downloadCSV, formatBRDateTime } from "../utils/reportGenerator";
import { getApiUrl } from "../utils/api";

interface AuditViewProps {
  logs: ActivityLog[];
  transactions: StockTransaction[];
  products: Product[];
  currentUser: UserProfile;
  darkMode: boolean;
  onSetDarkMode: (val: boolean) => void;
  onClearLogs: () => void;
  onUpdatePassword: (newPass: string) => void;
}

export default function AuditView({
  logs,
  transactions,
  products,
  currentUser,
  darkMode,
  onSetDarkMode,
  onClearLogs,
  onUpdatePassword
}: AuditViewProps) {
  const [newPIN, setNewPIN] = useState("");
  const [pinChangeMsg, setPinChangeMsg] = useState("");
  const [backupDownloadedMsg, setBackupDownloadedMsg] = useState(false);
  const [confirmClearLogs, setConfirmClearLogs] = useState(false);

  // Supabase monitoring state
  const [supabaseStatus, setSupabaseStatus] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  React.useEffect(() => {
    fetch(getApiUrl() + "/api/health")
      .then(res => res.json())
      .then(data => {
        setSupabaseStatus(data.supabase || data.firebase);
        setLoadingHealth(false);
      })
      .catch(err => {
        console.error("Erro ao ler integridade do Supabase:", err);
        setLoadingHealth(false);
      });
  }, []);

  // Grouped category wastage tracker for graph representation
  const wastageByCategory = products.reduce((acc: { [key: string]: number }, p) => {
    acc[p.category] = (acc[p.category] || 0) + p.wastage;
    return acc;
  }, {});

  const wastageCategories = Object.keys(wastageByCategory);
  const totalWastage = products.reduce((acc, p) => acc + p.wastage, 0);

  const handlePINSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPIN.length < 4) {
      setPinChangeMsg("O PIN de segurança do terminal deve possuir no mínimo 4 caracteres.");
      return;
    }
    onUpdatePassword(newPIN);
    setPinChangeMsg("🔒 Senha / PIN atualizado com sucesso para este dispositivo!");
    setNewPIN("");
    setTimeout(() => setPinChangeMsg(""), 3500);
  };

  // Run offline raw database backup download
  const downloadBackupJSON = () => {
    const backupState = {
      products,
      transactions,
      logs,
      backupTimestamp: new Date().toISOString(),
      authorizedSessionUser: currentUser
    };

    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(backupState, null, 2)], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = `backup-escolar-kel-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setBackupDownloadedMsg(true);
    setTimeout(() => setBackupDownloadedMsg(false), 4000);
  };

  return (
    <div className="space-y-6" id="audit-view-main">
      <div className="border-b border-gray-100 pb-3" id="audit-header">
        <h2 className="text-xl font-bold text-gray-900">🛡️ Painel Administrativo, Segurança & Gráficos</h2>
        <p className="text-xs text-gray-500">Histórico de alterações, permissões de usuários, relatórios de desperdício e backup offline.</p>
      </div>

      {/* Grid of panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="audit-panels-grid">
        
        {/* Profile Card & Local PIN password change */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Active profile review */}
          <div className="bg-white p-5 border border-gray-100 rounded-3xl shadow-xs" id="profile-audit-card">
            <h3 className="font-bold text-gray-800 text-sm mb-3 flex items-center">
              <Award className="w-4 h-4 mr-1 text-emerald-600" />
              Usuário Autenticado
            </h3>
            <div className="flex items-center space-x-3.5">
              <div className="p-3 bg-emerald-600 text-white rounded-2xl font-black text-sm">
                KES
              </div>
              <div>
                <h4 className="font-bold text-sm text-gray-900">{currentUser.name}</h4>
                <p className="text-xs text-gray-500 font-mono">@{currentUser.username}</p>
                <span className="inline-block mt-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  {currentUser.role}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-gray-100 text-xs text-gray-650 space-y-1">
              <p><b>Ações Permitidas para {currentUser.role}:</b></p>
              <ul className="list-disc pl-4 space-y-1 text-[11px] text-gray-500">
                {currentUser.role === "Administrador" && (
                  <>
                    <li>Deletar produtos permanentemente do terminal;</li>
                    <li>Sincronizar massivamente com a nuvem;</li>
                    <li>Gerar backups em arquivos de segurança.</li>
                  </>
                )}
                {currentUser.role !== "Administrador" && (
                  <>
                    <li>Lançar entradas/saídas por código de barras;</li>
                    <li>Visualizar o calendário de cardápio semanal;</li>
                    <li>Imprimir Fichas Técnicas das receitas.</li>
                  </>
                )}
              </ul>
            </div>
          </div>

          {/* Supabase Database Connection Status */}
          <div className="bg-white p-5 border border-gray-100 rounded-3xl shadow-xs space-y-3" id="supabase-status-board">
            <h3 className="font-bold text-gray-800 text-sm flex items-center">
              <Database className="w-4.5 h-4.5 mr-1.5 text-emerald-600" />
              Sincronização Supabase Ativa
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              O sistema sincroniza automaticamente todas as movimentações, cardápios e auditorias diretamente no seu banco de dados Supabase de forma nativa e segura.
            </p>

            {loadingHealth ? (
              <div className="text-xs text-gray-400 animate-pulse py-1">Verificando comunicação com Supabase...</div>
            ) : supabaseStatus ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-gray-55 pb-2">
                  <span className="text-xs text-gray-600 font-semibold">Status do Banco:</span>
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                    supabaseStatus.configured === false
                      ? "bg-slate-100 text-slate-700"
                      : supabaseStatus.table_active 
                        ? "bg-emerald-100 text-emerald-800" 
                        : "bg-amber-150 text-amber-900"
                  }`}>
                    {supabaseStatus.status}
                  </span>
                </div>

                {supabaseStatus.configured === false && (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-left space-y-1">
                    <span className="text-[10px] font-bold text-slate-700 block">📦 Armazenamento Local Seguro</span>
                    <p className="text-[10px] text-gray-550 leading-normal">
                      O sistema está salvando e operando de forma 100% autônoma e segura no banco de dados local do servidor.
                      Para habilitar a sincronização automática e backup em tempo real, certifique-se de que as chaves <code className="bg-slate-100 text-slate-800 px-1 py-0.2 rounded font-mono text-[9px]">SUPABASE_URL</code> e <code className="bg-slate-100 text-slate-800 px-1 py-0.2 rounded font-mono text-[9px]">SUPABASE_ANON_KEY</code> estejam devidamente configuradas no ambiente.
                    </p>
                  </div>
                )}

                {supabaseStatus.configured !== false && !supabaseStatus.table_active && (
                  <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2 text-left">
                    <span className="text-[10px] font-bold text-amber-800 block">⚠️ Conectando ao Supabase:</span>
                    <p className="text-[10px] text-gray-650 leading-normal">
                      As credenciais do Supabase estão presentes, mas não foi possível ler/gravar dados na tabela <code className="bg-amber-100 text-amber-800 px-1 py-0.2 rounded font-mono text-[9px]">kel_app_store</code>.
                      Por favor, crie a tabela no SQL Editor do seu painel Supabase.
                    </p>
                  </div>
                )}

                {supabaseStatus.configured !== false && supabaseStatus.table_active && (
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl text-left">
                    <span className="text-[10px] font-bold text-emerald-800 block">✓ Supabase Conectado</span>
                    <p className="text-[10px] text-gray-500 mt-1 leading-normal">
                      A tabela de nuvem <code className="bg-emerald-100 text-emerald-800 px-1 py-0.2 rounded font-mono text-[9px]">kel_app_store</code> está ativa e respondendo. Suas alterações são sincronizadas em tempo real automaticamente.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-rose-600 py-1 font-semibold">Não foi possível estabelecer contato com o serviço Firebase. Executando em modo de contingência local.</div>
            )}
          </div>

          {/* Secure PIN device update */}
          <div className="bg-white p-5 border border-gray-100 rounded-3xl shadow-xs space-y-3" id="pin-secure-board">
            <h3 className="font-bold text-gray-800 text-sm flex items-center">
              <FileLock2 className="w-4 h-4 mr-1 text-emerald-600" />
              Proteção de Senha e Recuperação
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Como administrador escolar, você pode redefinir o seu PIN secreto para garantir privacidade contra alterações indevidas de estoque no terminal físico.
            </p>

            <form onSubmit={handlePINSubmit} className="space-y-3" id="form-pin-update">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1">Novo Código PIN Secreto *</label>
                <input
                  type="password"
                  required
                  disabled={currentUser.role !== 'Administrador'}
                  placeholder={currentUser.role === 'Administrador' ? "Ex: 88769" : "Bloqueado para Merendeira/Auxiliar"}
                  value={newPIN}
                  onChange={(e) => setNewPIN(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-mono focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>

              {pinChangeMsg && (
                <p className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] text-emerald-700 font-semibold leading-normal">
                  {pinChangeMsg}
                </p>
              )}

              {currentUser.role !== 'Administrador' && (
                <p className="text-[10px] text-rose-600 font-semibold leading-relaxed">
                  ⚠️ Alteração de PIN restrita apenas para Administradores.
                </p>
              )}

              <button
                type="submit"
                id="btn-trigger-pin-update"
                disabled={currentUser.role !== 'Administrador'}
                className="w-full py-2 bg-slate-900 hover:bg-slate-950 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Atualizar Senha Local
              </button>
            </form>
          </div>

          {/* Cloud backups & Theme preferences */}
          <div className="bg-white p-5 border border-gray-100 rounded-3xl shadow-xs space-y-4" id="backup-theme-board">
            <div className="space-y-1.5">
              <h3 className="font-bold text-gray-800 text-sm flex items-center">
                <Database className="w-4 h-4 mr-1 text-emerald-600" />
                Backup Local Manual ou Download JSON
              </h3>
              <p className="text-xs text-gray-500">Exporte os dados completos salvos no cache para restauração ou auditoria independente.</p>
            </div>

            <button
              onClick={downloadBackupJSON}
              disabled={currentUser.role !== 'Administrador'}
              id="btn-trigger-local-backup"
              className="w-full py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:bg-slate-100 disabled:text-gray-400 disabled:cursor-not-allowed transition rounded-xl text-xs font-bold flex items-center justify-center space-x-1 border border-emerald-200 disabled:border-slate-200"
            >
              <Download className="w-4 h-4" />
              <span>Gerar Arquivo de Backup (.JSON)</span>
            </button>

            {backupDownloadedMsg && (
              <p className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-lg text-[10px] text-emerald-700 font-semibold animate-pulse" style={{ contentVisibility: "auto" }}>
                ✓ Arquivo baixado com sucesso! Salve em local seguro, pen-drive ou e-mail.
              </p>
            )}

            {/* Offline-online sync and Theme preset simulation toggle */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between" id="theme-settings-row">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-gray-700 flex items-center">
                  {darkMode ? <Moon className="w-4 h-4 mr-1 text-indigo-500" /> : <Sun className="w-4 h-4 mr-1 text-amber-500" />}
                  Tema Escuro do Android
                </span>
                <p className="text-[10px] text-gray-400">Otimizar consumo de bateria no tablet solar da cozinha</p>
              </div>

              <button
                onClick={() => onSetDarkMode(!darkMode)}
                id="btn-toggle-darkmode"
                className={`w-12 h-6 rounded-full p-0.5 transition duration-200 ${
                  darkMode ? "bg-emerald-600" : "bg-gray-300"
                }`}
              >
                <div 
                  className={`w-5 h-5 rounded-full bg-white shadow-md transform transition duration-200 ${
                    darkMode ? "translate-x-6" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

        </div>

        {/* Right Side: Waste Tracking Graphs & Detailed Security audit trail  */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Interactive Wastage breakdown charts representation using elegant pure html bars */}
          <div className="bg-white p-5 border border-gray-100 rounded-3xl shadow-xs space-y-4" id="wastage-chart-card">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <div className="flex items-center space-x-1.5">
                <BarChart3 className="w-4.5 h-4.5 text-orange-600" />
                <h3 className="font-bold text-gray-800 text-sm">🌱 Relatório de Controle de Desperdício</h3>
              </div>
              <span className="text-xs font-mono font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded">
                Total: {totalWastage.toFixed(1)} kg
              </span>
            </div>

            <p className="text-xs text-gray-500">
              Desperdício total registrado na triagem ou triagem de cozimento por categoria:
            </p>

            <div className="space-y-3.5">
              {wastageCategories.map((cat) => {
                const amount = wastageByCategory[cat];
                const pct = totalWastage > 0 ? (amount / totalWastage) * 100 : 0;
                
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-gray-700">
                      <span>{cat}</span>
                      <span className="font-mono text-gray-500">{amount.toFixed(1)} kg ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2">
                      <div 
                        className="bg-orange-500 rounded-full h-2 transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}

              {wastageCategories.length === 0 && (
                <p className="text-xs font-mono text-gray-400 italic text-center py-4">Nenhum desperdício registrado até o momento.</p>
              )}
            </div>
          </div>

          {/* Audit trail modification history logs */}
          <div className="bg-white p-5 border border-gray-100 rounded-3xl shadow-xs space-y-4" id="audit-trail-tracker">
            <div className="flex items-center justify-between border-b border-gray-50 pb-2">
              <div className="flex items-center space-x-1.5">
                <History className="w-4.5 h-4.5 text-emerald-600" />
                <h3 className="font-bold text-gray-800 text-sm">⏱️ Histórico Geral de Segurança & Alterações</h3>
              </div>
              
              {currentUser.role === "Administrador" && logs.length > 0 && (
                confirmClearLogs ? (
                  <div className="flex items-center space-x-1 animate-scale-in">
                    <button
                      onClick={() => {
                        onClearLogs();
                        setConfirmClearLogs(false);
                      }}
                      className="text-[10px] bg-red-600 text-white hover:bg-red-700 p-1 px-1.5 rounded font-bold"
                    >
                      Confirmar Limpeza
                    </button>
                    <button
                      onClick={() => setConfirmClearLogs(false)}
                      className="text-[10px] bg-slate-200 text-gray-700 hover:bg-slate-300 p-1 px-1.5 rounded font-bold"
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmClearLogs(true)}
                    id="btn-clear-logs"
                    className="text-[10px] text-red-600 hover:bg-red-50 p-1 px-2 rounded-lg font-bold"
                  >
                    Limpar Logs
                  </button>
                )
              )}
            </div>

            <div className="max-h-[280px] overflow-y-auto space-y-2.5 pr-2 font-mono scrollbar-thin">
              {logs.map((log) => (
                <div key={log.id} className="p-2.5 bg-slate-50 border border-gray-100 rounded-xl text-[11px] leading-relaxed relative hover:bg-slate-100/50">
                  <div className="flex justify-between items-start mb-1 text-[10px] text-gray-400">
                    <span className="font-bold text-emerald-700">{log.action}</span>
                    <span>{formatBRDateTime(log.timestamp)}</span>
                  </div>
                  <p className="text-gray-700 pl-1.5 border-l-2 border-emerald-500">{log.details}</p>
                  <p className="text-[10px] text-gray-500 mt-1 pl-1.5 text-right font-medium">
                    Efetuado por: <b className="text-gray-700">@{log.user} ({log.role})</b>
                  </p>
                </div>
              ))}

              {logs.length === 0 && (
                <p className="text-center text-xs text-gray-400 italic py-8">Nenhum registro de auditoria disponível no terminal.</p>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
