/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Product, SchoolMenu, StockTransaction, SyncStatus, UserProfile } from "../types";
import { 
  AlertTriangle, 
  TrendingDown, 
  Package, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  Clock, 
  Utensils, 
  Share2, 
  RefreshCw, 
  Wifi, 
  WifiOff 
} from "lucide-react";
import { formatBRDate } from "../utils/reportGenerator";

interface DashboardViewProps {
  products: Product[];
  menus: SchoolMenu[];
  transactions: StockTransaction[];
  sync: SyncStatus;
  currentUser: UserProfile;
  onTriggerSync: () => void;
  onNavigate: (tab: string) => void;
  onQuickServe: (menuId: string) => void;
}

export default function DashboardView({
  products,
  menus,
  transactions,
  sync,
  currentUser,
  onTriggerSync,
  onNavigate,
  onQuickServe
}: DashboardViewProps) {
  const [activeAlertFilter, setActiveAlertFilter] = useState<'all' | 'low' | 'expiring' | 'expired'>('all');
  
  // Calculate statistics
  const totalProductsCount = products.length;
  const totalStockKgLitros = products.reduce((acc, p) => acc + (p.unit === "unidades" || p.unit === "caixas" ? 0 : p.quantity), 0);
  const totalStockUnits = products.reduce((acc, p) => acc + (p.unit === "unidades" || p.unit === "caixas" ? p.quantity : 0), 0);
  
  // Expiration / Alerts calculations
  const todayStr = "2026-06-06"; // Fixed mock today per app context
  const today = new Date(todayStr);

  const lowStockProducts = products.filter(p => p.quantity <= p.minQuantity);
  
  const expiredProducts = products.filter(p => {
    const expDate = new Date(p.expiryDate);
    return expDate < today;
  });

  const expiringSoonProducts = products.filter(p => {
    const expDate = new Date(p.expiryDate);
    if (expDate < today) return false;
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30; // Expiring in next 30 days
  });

  // Wastage (desperdício) tracker total
  const totalWastage = products.reduce((acc, p) => acc + p.wastage, 0);

  // Today's Menu planning
  const todayMenus = menus.filter(m => m.date === todayStr);

  // Recent transactions (last 4)
  const recentTransactions = transactions.slice(0, 4);

  // Helper calculation for days diff
  const getDaysDiff = (dateStr: string) => {
    const expDate = new Date(dateStr);
    const diffTime = expDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const alertItems: {
    product: Product;
    type: 'low' | 'expiring' | 'expired';
    title: string;
    description: string;
    badgeText: string;
    badgeClass: string;
    accentClass: string;
    bgClass: string;
    iconColor: string;
  }[] = [];

  // 1. Expired Products
  expiredProducts.forEach(p => {
    const daysAgo = Math.abs(getDaysDiff(p.expiryDate));
    alertItems.push({
      product: p,
      type: 'expired',
      title: p.name,
      badgeText: "❌ Vencido",
      badgeClass: "bg-rose-100 text-rose-800 border border-rose-200",
      description: `Insumo fora do prazo de validade desde ${formatBRDate(p.expiryDate)} (há ${daysAgo} ${daysAgo === 1 ? 'dia' : 'dias'}). Recomendável descartar preventivamente.`,
      accentClass: "border-l-4 border-l-rose-500",
      bgClass: "bg-rose-50/20 hover:bg-rose-50/30",
      iconColor: "text-rose-600"
    });
  });

  // 2. Expiring soon (< 30 days)
  expiringSoonProducts.forEach(p => {
    const daysLeft = getDaysDiff(p.expiryDate);
    alertItems.push({
      product: p,
      type: 'expiring',
      title: p.name,
      badgeText: `📅 Vence em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}`,
      badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
      description: `Atente-se à proximidade do vencimento em ${formatBRDate(p.expiryDate)}. Priorize o uso nos próximos cardápios.`,
      accentClass: "border-l-4 border-l-amber-500",
      bgClass: "bg-amber-50/15 hover:bg-amber-50/25",
      iconColor: "text-amber-600"
    });
  });

  // 3. Low stock levels
  lowStockProducts.forEach(p => {
    alertItems.push({
      product: p,
      type: 'low',
      title: p.name,
      badgeText: "📉 Estoque Baixo",
      badgeClass: "bg-indigo-100 text-indigo-850 border border-indigo-200",
      description: `Quantidade atual de ${p.quantity} ${p.unit} está inferior ao limite mínimo estipulado de ${p.minQuantity} ${p.unit}.`,
      accentClass: "border-l-4 border-l-indigo-500",
      bgClass: "bg-indigo-50/10 hover:bg-indigo-50/20",
      iconColor: "text-indigo-600"
    });
  });

  const filteredAlerts = alertItems.filter(item => {
    if (activeAlertFilter === 'all') return true;
    return item.type === activeAlertFilter;
  });

  return (
    <div className="space-y-6" id="dashboard-container">
      {/* Synchronization Bar Indicator */}
      <div className="flex flex-wrap items-center justify-between p-3.5 bg-white border border-gray-100 rounded-2xl shadow-xs" id="sync-bar">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-xl ${sync.isOnline ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
            {sync.isOnline ? <Wifi className="w-5 h-5 animate-pulse" /> : <WifiOff className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-gray-800">
                {sync.isOnline ? "Modo Online (Sincronizado)" : "Modo Offline (Local)"}
              </span>
              <span className={`w-2 h-2 rounded-full ${sync.isOnline ? "bg-emerald-500" : "bg-amber-500"}`}></span>
            </div>
            <p className="text-xs text-gray-500 font-mono">
              {sync.pendingSyncCount > 0 
                ? `${sync.pendingSyncCount} alterações pendentes para upload` 
                : `Backup seguro: ${sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleTimeString("pt-BR") : "Nenhum"}`
              }
            </p>
          </div>
        </div>
        
        <button
          onClick={onTriggerSync}
          id="btn-sync-trigger"
          className="flex items-center px-3.5 py-1.5 space-x-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition active:scale-95"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Sincronizar Cloud</span>
        </button>
      </div>

      {/* Main Grid Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="stats-grid">
        
        <div 
          onClick={() => onNavigate("estoque")} 
          id="stat-card-total"
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs cursor-pointer hover:border-emerald-200 transition duration-150 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition duration-150"></div>
          <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl w-fit relative z-10">
            <Package className="w-5 h-5" />
          </div>
          <p className="mt-3.5 text-xs text-gray-500 font-medium">Produtos Cadastrados</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalProductsCount}</p>
          <span className="text-[10px] text-gray-500 font-mono block mt-1">
            {totalStockKgLitros.toFixed(1)}kg/l + {totalStockUnits}un
          </span>
        </div>

        <div 
          onClick={() => onNavigate("estoque")} 
          id="stat-card-low-stock"
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs cursor-pointer hover:border-amber-200 transition duration-150 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition duration-150"></div>
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl w-fit relative z-10">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="mt-3.5 text-xs text-gray-500 font-medium">Estoque Baixo</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{lowStockProducts.length}</p>
          <span className="text-[10px] text-amber-600 font-semibold block mt-1 hover:underline">
            {lowStockProducts.length > 0 ? "Ação recomendada" : "Estoque ideal"}
          </span>
        </div>

        <div 
          onClick={() => onNavigate("estoque")} 
          id="stat-card-expired"
          className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs cursor-pointer hover:border-rose-200 transition duration-150 relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition duration-150"></div>
          <div className="p-2.5 bg-rose-50 text-rose-600 rounded-xl w-fit relative z-10">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <p className="mt-3.5 text-xs text-gray-500 font-medium">Produtos Vencidos</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{expiredProducts.length}</p>
          <span className="text-[10px] text-rose-600 font-semibold block mt-1">
            {expiringSoonProducts.length} à vencer em breve
          </span>
        </div>

        <div 
          onClick={() => currentUser?.role === 'Administrador' && onNavigate("configuracoes")} 
          id="stat-card-waste"
          className={`p-4 bg-white border border-gray-100 rounded-2xl shadow-xs transition duration-150 relative overflow-hidden group ${
            currentUser?.role === 'Administrador' ? 'cursor-pointer hover:border-orange-200' : ''
          }`}
        >
          <div className="absolute top-0 right-0 w-16 h-16 bg-orange-50 rounded-bl-full -mr-4 -mt-4 group-hover:scale-110 transition duration-150"></div>
          <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl w-fit relative z-10">
            <TrendingDown className="w-5 h-5" />
          </div>
          <p className="mt-3.5 text-xs text-gray-500 font-medium font-mono">Desperdício Medido</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{totalWastage.toFixed(1)} kg</p>
          <span className="text-[10px] text-orange-600 font-semibold block mt-1">
            Filtro de Descarte Ativo
          </span>
        </div>

      </div>

      {/* Critical Expiry Alerts Section */}
      <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-5" id="critical-alerts-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-2xl">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-sm sm:text-base">⚠️ Seção de Alertas Críticos de Estoque</h3>
              <p className="text-xs text-gray-500 mt-0.5">Gestão preventiva de produtos vencidos, próximos do vencimento ou abaixo do limite.</p>
            </div>
          </div>
          
          <button 
            onClick={() => onNavigate("estoque")} 
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 shrink-0 flex items-center hover:underline self-start sm:self-center"
          >
            Ajustar no Estoque Geral →
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap gap-2" id="alert-filter-tabs">
          <button
            onClick={() => setActiveAlertFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              activeAlertFilter === 'all' 
                ? 'bg-slate-900 text-white border-slate-950 shadow-xs' 
                : 'bg-slate-50 text-gray-600 border-gray-200/60 hover:bg-slate-100'
            }`}
          >
            Todos os Alertas ({alertItems.length})
          </button>
          
          <button
            onClick={() => setActiveAlertFilter('low')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              activeAlertFilter === 'low' 
                ? 'bg-indigo-600 text-white border-indigo-750 shadow-xs' 
                : 'bg-indigo-50/50 text-indigo-800 border-indigo-150/60 hover:bg-indigo-100'
            }`}
          >
            Estoque Crítico ({lowStockProducts.length})
          </button>

          <button
            onClick={() => setActiveAlertFilter('expiring')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              activeAlertFilter === 'expiring' 
                ? 'bg-amber-500 text-white border-amber-650 shadow-xs' 
                : 'bg-amber-50/50 text-amber-800 border-amber-150/60 hover:bg-amber-100'
            }`}
          >
            Vencendo em até 30 dias ({expiringSoonProducts.length})
          </button>

          <button
            onClick={() => setActiveAlertFilter('expired')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
              activeAlertFilter === 'expired' 
                ? 'bg-rose-600 text-white border-rose-750 shadow-xs' 
                : 'bg-rose-50/50 text-rose-800 border-rose-150/60 hover:bg-rose-100'
            }`}
          >
            Produtos Vencidos ({expiredProducts.length})
          </button>
        </div>

        {/* Alerts Grid/List */}
        {filteredAlerts.length === 0 ? (
          <div className="py-6 text-center text-gray-400 text-xs flex flex-col items-center justify-center space-y-2 bg-slate-50/50 border border-dashed border-gray-200 rounded-2xl">
            <svg className="w-8 h-8 text-emerald-500 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="font-semibold text-gray-800">Parabéns! Tudo em ordem.</p>
            <p className="text-[11px] text-gray-500">Nenhum produto correspondente a este filtro exige atenção imediata.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="alerts-grid-list">
            {filteredAlerts.map((item, idx) => (
              <div 
                key={`${item.product.id}-${item.type}-${idx}`} 
                className={`p-4 rounded-2xl border border-gray-100 flex flex-col justify-between space-y-3 transition group hover:shadow-xs ${item.bgClass} ${item.accentClass}`}
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-gray-400 font-mono uppercase">
                      {item.product.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${item.badgeClass}`}>
                      {item.badgeText}
                    </span>
                  </div>
                  
                  <h4 className="font-extrabold text-sm text-gray-900 leading-tight">
                    {item.title}
                  </h4>
                  
                  <p className="text-xs text-gray-650 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-bold">
                    Saldo: <b className="text-gray-800">{item.product.quantity} {item.product.unit}</b>
                  </span>
                  
                  <button
                    onClick={() => onNavigate("estoque")}
                    className="p-1 px-2.5 bg-white hover:bg-slate-100 active:scale-95 text-gray-700 font-bold border border-gray-200/70 rounded-xl text-[10px] flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
                  >
                    <span>Regularizar</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Layout Grid: Left Cardápios, Right Histórico */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="dashboard-widgets">
        
        {/* Cardápio do Dia (Lunch schedules) */}
        <div className="lg:col-span-7 bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4" id="widget-lunch-day">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Utensils className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">🍽️ Planejamento de Merenda (Hoje)</h3>
            </div>
            <button 
              onClick={() => onNavigate("cardapio")} 
              id="dash-go-to-menus"
              className="text-xs text-emerald-600 font-semibold hover:underline"
            >
              Calendário Completo →
            </button>
          </div>

          {todayMenus.length === 0 ? (
            <div className="py-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center space-y-2">
              <Calendar className="w-8 h-8 opacity-40 text-gray-500" />
              <p>Nenhuma refeição planejada para o dia de hoje.</p>
              <button
                onClick={() => onNavigate("cardapio")}
                id="dash-add-menu-empty"
                className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 mt-2"
              >
                Planejar Cardápio
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {todayMenus.map((m) => (
                <div 
                  key={m.id} 
                  className={`p-4 border rounded-xl flex flex-col justify-between md:flex-row md:items-center gap-3 transition ${
                    m.served 
                      ? "bg-slate-50 border-slate-200 opacity-80" 
                      : "bg-emerald-50/40 border-emerald-100 hover:border-emerald-200"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                        m.mealType === "matutino" ? "bg-amber-100 text-amber-800" :
                        m.mealType === "almoco" ? "bg-emerald-100 text-emerald-800" :
                        m.mealType === "vespertino" ? "bg-orange-100 text-orange-850" :
                        "bg-indigo-100 text-indigo-850"
                      }`}>
                        {m.mealType}
                      </span>
                      <span className="text-xs font-semibold text-gray-500 font-mono">
                        {m.portionsCount} Porções
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-800 text-sm">{m.name}</h4>
                    <p className="text-xs text-gray-500 max-w-sm truncate">
                      Gera redução automática de: {m.ingredients.map(i => i.name).join(", ")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-center" id={`actions-${m.id}`}>
                    {m.served ? (
                      <span className="flex items-center text-xs font-semibold text-gray-600 bg-emerald-100/60 border border-emerald-200 px-3 py-1.5 rounded-lg">
                        ✅ Estoque Deduzido
                      </span>
                    ) : (
                      <button
                        onClick={() => onQuickServe(m.id)}
                        id={`btn-serve-${m.id}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg text-xs transition active:scale-95 shadow-sm hover:shadow-md"
                      >
                        ⚡ Servir & Dar Baixa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Histórico Rápido de Entradas/Saídas (Transactions) */}
        <div className="lg:col-span-5 bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4" id="widget-history">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-gray-900 text-sm">⏱️ Registro Recente</h3>
            </div>
            {currentUser?.role === 'Administrador' && (
              <button 
                onClick={() => onNavigate("configuracoes")} 
                id="dash-go-to-logs"
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                Auditoria Geral →
              </button>
            )}
          </div>

          <div className="space-y-3">
            {recentTransactions.map((tx) => (
              <div key={tx.id} className="flex items-start justify-between p-3 bg-gray-50/50 hover:bg-gray-50 rounded-xl transition border border-gray-100">
                <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                  <p className="text-xs font-semibold text-gray-800 truncate">{tx.productName}</p>
                  <p className="text-[10px] text-gray-500 font-mono mt-0.5 truncate">{tx.notes}</p>
                  <p className="text-[9px] text-gray-400 font-mono">
                    {new Date(tx.date).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })} • por {tx.user}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-xs font-bold font-mono flex items-center justify-end ${
                    tx.type === "entrada" ? "text-emerald-600" : tx.type === "saida" ? "text-blue-600" : "text-amber-600"
                  }`}>
                    {tx.type === "entrada" ? <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" /> : <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />}
                    {tx.type === "entrada" ? "+" : "-"}{tx.quantity} {tx.unit}
                  </div>
                  <span className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded block mt-1 ${
                    tx.type === "entrada" ? "bg-emerald-50 text-emerald-700" : tx.type === "saida" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"
                  }`}>
                    {tx.type === "desperdicio" ? "Descarte" : tx.type}
                  </span>
                </div>
              </div>
            ))}
            
            {recentTransactions.length === 0 && (
              <p className="text-center py-6 text-xs text-gray-400 font-mono">Nenhuma transação efetuada até o momento.</p>
            )}
          </div>
        </div>

      </div>

      {/* Mini guide or quick help banner */}
      <div className="p-4 bg-emerald-800 text-white rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm" id="dashboard-onboarding">
        <div className="space-y-1">
          <h4 className="font-bold text-sm">💡 Cadastrou mercadorias novas para a escola?</h4>
          <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
            Aponte a câmera do celular com nossa ferramenta de leitura de código de barras ou use a busca direta para atualizar instantaneamente o estoque da escola, garantir alertas e evitar o desperdício!
          </p>
        </div>
        <button
          onClick={() => onNavigate("leitor")}
          id="btn-onboard-scan"
          className="flex-shrink-0 px-4 py-2 bg-white text-emerald-900 hover:bg-emerald-50 active:scale-95 transition rounded-xl text-xs font-bold cursor-pointer"
        >
          📷 Abrir Câmera Leitora
        </button>
      </div>
    </div>
  );
}
