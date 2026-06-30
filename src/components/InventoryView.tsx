/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Product, SchoolMenu, StockTransaction, UserProfile, ActivityLog } from "../types";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  TrendingDown, 
  ArrowUp, 
  ArrowDown, 
  Calendar, 
  Tag, 
  MapPin, 
  FileText, 
  Download, 
  AlertTriangle,
  Barcode,
  X,
  Sparkles
} from "lucide-react";
import { 
  exportProductsCSV, 
  exportAlertsCSV, 
  printReport, 
  formatBRDate,
  formatBRDateTime
} from "../utils/reportGenerator";

interface InventoryViewProps {
  products: Product[];
  currentUser: UserProfile;
  transactions: StockTransaction[];
  menus: SchoolMenu[];
  logs?: ActivityLog[];
  onAddProduct: (prod: Omit<Product, 'id' | 'wastage'>) => void;
  onUpdateQuantity: (productId: string, quantityChange: number, type: 'entrada' | 'saida' | 'desperdicio', notes: string) => void;
  onDeleteProduct: (productId: string) => void;
}

export default function InventoryView({
  products,
  currentUser,
  transactions,
  menus,
  logs = [],
  onAddProduct,
  onUpdateQuantity,
  onDeleteProduct
}: InventoryViewProps) {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all"); // all, low, expired, regular
  
  // Modals / forms state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [focusedProduct, setFocusedProduct] = useState<Product | null>(null);
  const [actionType, setActionType] = useState<'entrada' | 'saida' | 'desperdicio'>('entrada');
  const [quantityInput, setQuantityInput] = useState<number>(0);
  const [transactionNotes, setTransactionNotes] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // New product form states
  const [newName, setNewName] = useState("");
  const [newBarcode, setNewBarcode] = useState("");
  const [newCategory, setNewCategory] = useState("Grãos e Cereais");
  const [newQuantity, setNewQuantity] = useState<number>(10);
  const [newMinQuantity, setNewMinQuantity] = useState<number>(5);
  const [newUnit, setNewUnit] = useState("kg");
  const [newExpiryDate, setNewExpiryDate] = useState("2026-12-31");
  const [newSupplier, setNewSupplier] = useState("");
  const [newLocation, setNewLocation] = useState("Despensa Secos A");

  // AI Purchase Suggestion states
  const [isAISuggestLoading, setIsAISuggestLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{
    suggestedQuantity: number;
    justification: string;
    safetyMargin: number;
    riskScore: number;
    urgencyLevel: string;
    estimatedDaysOfStockLeft: number;
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiProductFocus, setAiProductFocus] = useState<Product | null>(null);

  // PDF Customs Report Generation Modal State
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportType, setReportType] = useState<'inventory' | 'transactions' | 'logs'>('inventory');
  const [reportCategory, setReportCategory] = useState("all");
  const [reportStatus, setReportStatus] = useState("all");
  const [reportTxType, setReportTxType] = useState<string>('all');
  const [reportLogRole, setReportLogRole] = useState<string>('all');

  const fetchAISuggestion = async (prod: Product) => {
    setAiProductFocus(prod);
    setIsAISuggestLoading(true);
    setAiError(null);
    setAiSuggestion(null);

    try {
      const prodTransactions = transactions.filter(t => t.productId === prod.id).slice(0, 50);
      const prodMenus = menus.filter(m => m.ingredients.some(i => i.productId === prod.id));

      const response = await fetch("/api/gemini/suggest-purchase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product: prod,
          transactions: prodTransactions,
          menus: prodMenus
        })
      });
      
      if (!response.ok) {
        throw new Error(`Erro na rede do servidor (${response.status})`);
      }

      const data = await response.json();
      setAiSuggestion(data);
    } catch (err: any) {
      console.error("Erro ao carregar sugestão:", err);
      setAiError(err.message || "Erro inesperado ao consultar a API do Gemini.");
    } finally {
      setIsAISuggestLoading(false);
    }
  };

  const categories = Array.from(new Set(products.map(p => p.category)));

  // Filter products list
  const filteredProducts = products.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    
    const today = new Date("2026-06-06");
    const isExpired = new Date(p.expiryDate) < today;
    const isLow = p.quantity <= p.minQuantity;

    let matchesStatus = true;
    if (selectedStatus === "low") {
      matchesStatus = isLow;
    } else if (selectedStatus === "expired") {
      matchesStatus = isExpired;
    } else if (selectedStatus === "regular") {
      matchesStatus = !isLow && !isExpired;
    }

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Filter products list for custom PDF report modal
  const reportFilteredProducts = products.filter((p) => {
    const matchesCategory = reportCategory === "all" || p.category === reportCategory;
    
    const today = new Date("2026-06-06");
    const isExpired = new Date(p.expiryDate) < today;
    const isLow = p.quantity <= p.minQuantity;
    
    const diffTime = new Date(p.expiryDate).getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const isExpiring = !isExpired && diffDays <= 30;

    let matchesStatus = true;
    if (reportStatus === "low") {
      matchesStatus = isLow;
    } else if (reportStatus === "expiring") {
      matchesStatus = isExpiring;
    } else if (reportStatus === "expired") {
      matchesStatus = isExpired;
    } else if (reportStatus === "regular") {
      matchesStatus = !isLow && !isExpired;
    }

    return matchesCategory && matchesStatus;
  });

  // Handle Add Product Submission
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCategory) return;

    onAddProduct({
      name: newName,
      barcode: newBarcode,
      category: newCategory,
      quantity: Number(newQuantity) || 0,
      minQuantity: Number(newMinQuantity) || 0,
      unit: newUnit,
      expiryDate: newExpiryDate,
      supplier: newSupplier || "Fornecedor Escolar Padrão",
      location: newLocation || "Depósito Geral",
    });

    // Reset Form
    setNewName("");
    setNewBarcode("");
    setNewQuantity(10);
    setNewMinQuantity(5);
    setNewSupplier("");
    setIsAddOpen(false);
  };

  // Submit Quantity shift (movement adjustment)
  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!focusedProduct || quantityInput <= 0) return;

    onUpdateQuantity(
      focusedProduct.id, 
      quantityInput, 
      actionType, 
      transactionNotes || `${actionType.toUpperCase()} registrada manualmente em painel de estoque`
    );

    // Reset
    setFocusedProduct(null);
    setQuantityInput(0);
    setTransactionNotes("");
  };

  const triggerQuantityAdjustment = (p: Product, type: 'entrada' | 'saida' | 'desperdicio') => {
    setFocusedProduct(p);
    setActionType(type);
    setQuantityInput(type === 'desperdicio' ? 1 : 5);
    setTransactionNotes(
      type === 'entrada' ? "Entrada de mercadoria" :
      type === 'saida' ? "Consumo de mantimentos" : "Descarte de ingrediente danificado"
    );
  };

  // Filter transactions list for custom PDF report modal
  const reportFilteredTransactions = transactions.filter((t) => {
    if (reportTxType === "all") return true;
    return t.type === reportTxType;
  });

  // Filter logs list for custom PDF report modal
  const reportFilteredLogs = logs.filter((l) => {
    if (reportLogRole === "all") return true;
    return l.role === reportLogRole;
  });

  // Sync page filters to report modal and open it
  const openReportWizard = () => {
    setReportType("inventory");
    setReportCategory(selectedCategory);
    setReportStatus(selectedStatus);
    setIsReportModalOpen(true);
  };

  // Custom PDF report printer with specified filters in the Modal
  const triggerCustomPdfReport = () => {
    if (reportType === 'inventory') {
      const headers = [
        "Produto", "Código Barras", "Categoria", "Estoque Atual", 
        "Mínimo Segurança", "Validade", "Fornecedor", "Localização"
      ];
      const rows = reportFilteredProducts.map(p => {
        const today = new Date("2026-06-06");
        const isExpired = new Date(p.expiryDate) < today;
        const diffDays = Math.ceil((new Date(p.expiryDate).getTime() - today.getTime()) / (1000 * 3600 * 24));
        
        let valStatus = formatBRDate(p.expiryDate);
        if (isExpired) {
          valStatus += " (VENCIDO)";
        } else if (diffDays <= 30) {
          valStatus += ` (Vence em ${diffDays}d)`;
        }

        return [
          p.name, 
          p.barcode || "-", 
          p.category, 
          `${p.quantity} ${p.unit}`, 
          `${p.minQuantity} ${p.unit}`, 
          valStatus, 
          p.supplier, 
          p.location
        ];
      });

      const catLabel = reportCategory === "all" ? "Todas as Categorias" : reportCategory;
      const statusLabel = 
        reportStatus === "all" ? "Todos os Status de Validade" :
        reportStatus === "low" ? "Alerta de Estoque Baixo" :
        reportStatus === "expiring" ? "Alerta de Vencimento de 30 dias" :
        reportStatus === "expired" ? "Alerta de Produtos Vencidos" : "Insumos com Estoque Adequado";

      printReport(
        `Relatório de Inventário - ${catLabel}`, 
        `Filtro aplicado: ${statusLabel} (${reportFilteredProducts.length} itens listados)`, 
        headers, 
        rows
      );
    } else if (reportType === 'transactions') {
      const headers = [
        "Data/Hora", "Produto", "Movimentação", "Quantidade", "Unidade", "Responsável", "Observações"
      ];
      const rows = reportFilteredTransactions.map(t => {
        return [
          formatBRDateTime(t.date),
          t.productName,
          t.type.toUpperCase(),
          String(t.quantity),
          t.unit,
          t.user,
          t.notes || "-"
        ];
      });

      const txLabel = 
        reportTxType === "all" ? "Todos os Fluxos" :
        reportTxType === "entrada" ? "Apenas Entradas" :
        reportTxType === "saida" ? "Apenas Saídas" : "Apenas Desperdícios/Perdas";

      printReport(
        `Prestação de Contas - Movimentações de Estoque`,
        `Fluxo de Carga: ${txLabel} (${reportFilteredTransactions.length} registros listados)`,
        headers,
        rows
      );
    } else if (reportType === 'logs') {
      const headers = [
        "Data/Hora", "Usuário", "Perfil/Cargo", "Ação Executada", "Detalhes do Evento"
      ];
      const rows = reportFilteredLogs.map(l => {
        return [
          formatBRDateTime(l.timestamp),
          l.user,
          l.role,
          l.action,
          l.details
        ];
      });

      const roleLabel = reportLogRole === "all" ? "Todos os Perfis" : reportLogRole;

      printReport(
        `Prestação de Contas - Auditoria e Logs de Atividades`,
        `Operador Responsável: ${roleLabel} (${reportFilteredLogs.length} eventos registrados)`,
        headers,
        rows
      );
    }
  };

  return (
    <div className="space-y-6" id="inventory-view-main">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="inventory-toolbar">
        <div>
          <h2 className="text-xl font-bold text-gray-900">📦 Controle de Estoque (kel)</h2>
          <p className="text-xs text-gray-500">Cadastre, dê entradas, saídas e previna desperdícios alimentares.</p>
        </div>

        {/* Action buttons (Add and exports) */}
        <div className="flex items-center gap-2 flex-wrap" id="action-buttons-group">
          <button
            onClick={() => setIsAddOpen(true)}
            id="btn-open-add-product"
            className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1 hover:bg-emerald-700 active:scale-95 transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Produto</span>
          </button>

          <button
            onClick={openReportWizard}
            id="btn-export-pdf"
            className="p-2 bg-white text-rose-700 border border-gray-200 rounded-xl hover:bg-rose-50 transition active:scale-95 text-xs font-semibold flex items-center space-x-1 cursor-pointer"
            title="Exportar Relatório PDF"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden md:inline">Imprimir PDF</span>
          </button>

          <button
            onClick={() => exportProductsCSV(products)}
            id="btn-export-excel"
            className="p-2 bg-white text-indigo-700 border border-gray-200 rounded-xl hover:bg-indigo-50 transition active:scale-95 text-xs font-semibold flex items-center space-x-1"
            title="Exportar XLS/CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Filters Shelf */}
      <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-3" id="filters-shelf">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Text Search */}
          <div className="md:col-span-5 relative" id="search-box">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nome, código de barras ou fornecedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3 inline-flex items-center space-x-2" id="category-filter">
            <Filter className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Grãos e Cereais">Grãos e Cereais</option>
              <option value="Carnes e Frios">Carnes e Frios</option>
              <option value="Laticínios">Laticínios</option>
              <option value="Hortifrúti">Hortifrúti</option>
              <option value="Óleos e Gorduras">Óleos e Gorduras</option>
              <option value="Enlatados">Enlatados</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          {/* Expiry Alarm Alert dropdown */}
          <div className="md:col-span-4" id="alert-status-filter">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Todos os Status (Resumo)</option>
              <option value="low">🟡 Somente Estoque Baixo</option>
              <option value="expired">🔴 Somente Vencidos</option>
              <option value="regular">🟢 Estoque Adequado</option>
            </select>
          </div>

        </div>
      </div>

      {/* Grid of Stock Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" id="stock-products-grid">
        {filteredProducts.map((p) => {
          const today = new Date("2026-06-06");
          const pExpDate = new Date(p.expiryDate);
          const isExpired = pExpDate < today;
          const isLow = p.quantity <= p.minQuantity;

          // Days left indicator
          const diffDays = Math.ceil((pExpDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
          const isNearExpiry = !isExpired && diffDays <= 14;

          return (
            <div 
              key={p.id} 
              id={`item-card-${p.id}`}
              className={`p-4 bg-white border rounded-2xl shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 ${
                isExpired ? "border-rose-200 bg-rose-50/10" : "border-gray-100"
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold text-gray-400 bg-gray-100 rounded px-1.5 py-0.5 tracking-wider uppercase">
                    {p.category}
                  </span>
                  
                  {/* Alarm Indicator pills */}
                  <div className="flex flex-col space-y-1 text-right">
                    {isExpired ? (
                      <span className="text-[9px] font-bold text-rose-700 bg-rose-100 rounded-md px-1.5 py-0.5 animate-pulse uppercase tracking-wider">
                        🔴 VENCIDO
                      </span>
                    ) : isNearExpiry ? (
                      <span className="text-[9px] font-semibold text-amber-700 bg-amber-100 rounded-md px-1.5 py-0.5 uppercase">
                        ⚠️ Atenção: {diffDays} dias restam
                      </span>
                    ) : null}

                    {isLow ? (
                      <span className="text-[9px] font-bold text-amber-700 bg-amber-100 rounded-md px-1.5 py-0.5 uppercase">
                        🟡 BAIXO ({p.quantity}/{p.minQuantity})
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h3 className="font-bold text-gray-800 text-sm">{p.name}</h3>
                  <div className="flex items-center text-[10px] text-gray-500 font-mono space-x-1" title="Código de barras lido">
                    <Barcode className="w-3.5 h-3.5" />
                    <span>{p.barcode || "Nenhum código cadastrado"}</span>
                  </div>
                </div>

                {/* Meter graphic indicating stock vs min safety boundary */}
                <div className="py-1">
                  <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                    <span>Quantidade:</span>
                    <span className={`font-mono text-xs font-bold ${isLow ? "text-amber-600" : "text-emerald-700"}`}>
                      {p.quantity} {p.unit}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        isExpired ? "bg-rose-500" : isLow ? "bg-amber-500" : "bg-emerald-600"
                      }`}
                      style={{ width: `${Math.min(100, (p.quantity / (p.minQuantity * 3)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                {/* Product specifics (validity, location, supplier) */}
                <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 pt-2 border-t border-gray-50 text-[11px] text-gray-500">
                  <div className="flex items-center space-x-1 font-sans">
                    <Calendar className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate">Val: <b className="text-gray-700 font-mono">{formatBRDate(p.expiryDate)}</b></span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate" title={p.location}>{p.location}</span>
                  </div>
                  <div className="col-span-2 flex items-center space-x-1">
                    <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                    <span className="truncate" title={p.supplier}>Forn: {p.supplier}</span>
                  </div>
                  {p.wastage > 0 && (
                    <div className="col-span-2 py-0.5 px-2 bg-orange-50 border border-orange-100 text-[10px] text-orange-850 font-semibold rounded-md flex items-center">
                      🌱 Desperdício acumulado registrado: {p.wastage} {p.unit}
                    </div>
                  )}
                </div>
              </div>

              {/* Movement Adjustment button layout */}
              <div className="pt-2 border-t border-gray-50 flex items-center justify-between gap-1.5" id={`mvia-${p.id}`}>
                 <div className="flex items-center space-x-1">
                  <button
                    onClick={() => triggerQuantityAdjustment(p, 'entrada')}
                    className="p-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-700 font-bold rounded-lg text-xs flex items-center space-x-0.5"
                    title="Adicionar Estoque"
                  >
                    <ArrowUp className="w-3 h-3 text-emerald-600" />
                    <span>Entrar</span>
                  </button>

                  <button
                    onClick={() => triggerQuantityAdjustment(p, 'saida')}
                    className="p-1 px-2.5 bg-blue-50 hover:bg-blue-100 active:scale-95 text-blue-700 font-bold rounded-lg text-xs flex items-center space-x-0.5"
                    title="Registrar Saída"
                  >
                    <ArrowDown className="w-3 h-3 text-blue-600" />
                    <span>Saída</span>
                  </button>

                  <button
                    onClick={() => fetchAISuggestion(p)}
                    className="p-1 px-2.5 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-850 active:scale-95 text-indigo-700 font-bold rounded-lg text-xs flex items-center space-x-0.5 border border-indigo-100"
                    title="Sugestão de Compra Inteligente com Gemini"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-500 animate-pulse" />
                    <span>Sugestão IA</span>
                  </button>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => triggerQuantityAdjustment(p, 'desperdicio')}
                    className="p-1 bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-600 rounded-lg"
                    title="Registrar Desperdício / Danificado"
                  >
                    <TrendingDown className="w-3.5 h-3.5" />
                  </button>

                  {currentUser.role === 'Administrador' ? (
                    confirmDeleteId === p.id ? (
                      <div className="flex items-center space-x-1.5 animate-scale-in">
                        <button
                          onClick={() => {
                            onDeleteProduct(p.id);
                            setConfirmDeleteId(null);
                          }}
                          className="px-2 py-1 bg-red-650 text-white hover:bg-red-700 text-[10px] font-bold rounded-lg transition"
                          title="Confirmar exclusão permanente"
                        >
                          Excluir
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2 py-1 bg-slate-200 text-gray-700 hover:bg-slate-300 text-[10px] font-semibold rounded-lg transition"
                          title="Cancelar exclusão"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(p.id)}
                        className="p-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition"
                        title="Excluir Produto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  ) : (
                    <button
                      disabled
                      className="p-1.5 bg-slate-100 text-gray-300 rounded-lg cursor-not-allowed"
                      title="Exclusão permitida apenas para Administradores"
                    >
                      <Trash2 className="w-3.5 h-3.5 opacity-40" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white border border-gray-100 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto opacity-70 mb-2" />
            <p className="text-xs font-semibold">Nenhum produto atendeu a busca e aos filtros atuais.</p>
            <p className="text-[10px] text-gray-500 mt-1">Experimente limpar a palavra-chave ou alterar o filtro de categoria.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: ADD NEW PRODUCT */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-add-product">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-md w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-gray-900 text-base mb-1">📦 Cadastrar Insumo Escolar</h3>
            <p className="text-xs text-gray-500 mb-4">Insira os dados corretos conforme a nota de abastecimento ou fornecedor.</p>

            <form onSubmit={handleCreateProduct} className="space-y-4" id="form-add-product">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Ingrediente ou Produto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arroz Agulhinha Tipo 1"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Código de Barras</label>
                  <input
                    type="text"
                    placeholder="EAN-13 numérico"
                    value={newBarcode}
                    onChange={(e) => setNewBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Categoria</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="Grãos e Cereais">Grãos e Cereais</option>
                    <option value="Carnes e Frios">Carnes e Frios</option>
                    <option value="Laticínios">Laticínios</option>
                    <option value="Hortifrúti">Hortifrúti</option>
                    <option value="Óleos e Gorduras">Óleos e Gorduras</option>
                    <option value="Enlatados">Enlatados</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Qtd Inicial</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Mín Segurança</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newMinQuantity}
                    onChange={(e) => setNewMinQuantity(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Unidade</label>
                  <select
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="kg">kg</option>
                    <option value="litros">litros</option>
                    <option value="unidades">unidades</option>
                    <option value="caixas">caixas</option>
                    <option value="pacotes">pacotes</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Data de Validade</label>
                  <input
                    type="date"
                    required
                    value={newExpiryDate}
                    onChange={(e) => setNewExpiryDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Local Despensa</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Freezer 01"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Fornecedor / Cooperativa</label>
                <input
                  type="text"
                  placeholder="Ex: Horta Local & Agricultores Familiares"
                  value={newSupplier}
                  onChange={(e) => setNewSupplier(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-gray-600 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirm-add"
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QUANTITY ADJUSTMENT (Entrada, Saída, Desperdício) */}
      {focusedProduct && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-quick-tx">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-sm w-full p-6 shadow-2xl relative md:mb-20">
            <button 
              onClick={() => setFocusedProduct(null)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-gray-900 text-base mb-1">
              {actionType === "entrada" ? "📈 Registrar Entrada" : actionType === "saida" ? "📉 Registrar Saída" : "🌱 Comunicar Desperdício / Perda"}
            </h3>
            <p className="text-xs text-gray-500 mb-4 truncate text-emerald-800 font-medium">Produto: {focusedProduct.name}</p>

            <form onSubmit={handleTransactionSubmit} className="space-y-4" id="form-quick-tx">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Quantidade ({focusedProduct.unit})
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  autoFocus
                  min="0.01"
                  value={quantityInput || ""}
                  onChange={(e) => setQuantityInput(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                {actionType === "saida" && quantityInput > focusedProduct.quantity && (
                  <p className="text-rose-600 text-[10px] font-semibold mt-1">
                    ⚠️ Quantidade excede o saldo atual em estoque ({focusedProduct.quantity} {focusedProduct.unit})!
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Breve Observação / Justificativa
                </label>
                <textarea
                  rows={2}
                  placeholder={actionType === "entrada" ? "Ex: Lote n° 12 enviado pela Prefeitura" : "Ex: Merenda escolar matutina da 4ª série"}
                  value={transactionNotes}
                  onChange={(e) => setTransactionNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setFocusedProduct(null)}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-gray-600 font-semibold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirm-tx"
                  disabled={actionType === 'saida' && quantityInput > focusedProduct.quantity}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs"
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AI PURCHASE SUGGESTION (Gemini API) */}
      {(isAISuggestLoading || aiProductFocus) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-ai-suggestion">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => {
                setAiProductFocus(null);
                setAiSuggestion(null);
                setAiError(null);
              }}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            {isAISuggestLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 animate-pulse">
                    <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="absolute w-20 h-20 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <div className="text-center">
                  <h4 className="text-sm font-bold text-gray-800">Consultando a Inteligência Logística</h4>
                  <p className="text-xs text-gray-500 mt-1.5 max-w-[280px] leading-relaxed mx-auto">
                    O Gemini está analisando os cardápios escolares, o histórico de consumo recente e os prazos de validade para sugerir a compra ideal de <b className="text-indigo-700">{aiProductFocus?.name}</b>...
                  </p>
                </div>
              </div>
            ) : aiError ? (
              <div className="py-6 text-center">
                <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-3" />
                <h4 className="text-sm font-black text-gray-800">Ocorreu um erro na análise de IA</h4>
                <p className="text-xs text-gray-500 mt-1 max-w-[320px] mx-auto leading-relaxed">{aiError}</p>
                <div className="flex space-x-2 justify-center mt-6">
                  <button
                    onClick={() => aiProductFocus && fetchAISuggestion(aiProductFocus)}
                    className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-xl text-xs hover:bg-indigo-700 transition"
                  >
                    Tentar Novamente
                  </button>
                  <button
                    onClick={() => {
                      setAiProductFocus(null);
                      setAiError(null);
                    }}
                    className="px-4 py-2 bg-slate-100 text-gray-600 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : aiSuggestion ? (
              <div className="space-y-5 animate-scale-in">
                <div className="flex items-center space-x-2">
                  <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-2xl">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-base">Recomendação IA - Gemini</h3>
                    <p className="text-[10px] text-indigo-700 font-bold uppercase tracking-wider">Métrica de Compra Preditiva Inteligente</p>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Análise para o produto:</span>
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-extrabold text-gray-800 leading-none">{aiProductFocus?.name}</h4>
                    <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-lg text-gray-600 font-mono">
                      Estoque Atual: <b>{aiProductFocus?.quantity} {aiProductFocus?.unit}</b> (Mín: {aiProductFocus?.minQuantity})
                    </span>
                  </div>
                </div>

                {/* Bento Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <div className="bg-indigo-50/50 border border-indigo-100/70 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wider">Quantidade Sugerida</span>
                    <p className="text-xl font-black text-indigo-850">
                      {aiSuggestion.suggestedQuantity} <span className="text-xs font-bold text-indigo-600">{aiProductFocus?.unit}</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Nível de Urgência</span>
                    <div className="pt-1">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-lg ${
                        aiSuggestion.urgencyLevel.toLowerCase().includes('alta') ? "bg-rose-100 text-rose-800" :
                        aiSuggestion.urgencyLevel.toLowerCase().includes('méd') || aiSuggestion.urgencyLevel.toLowerCase().includes('med') ? "bg-amber-100 text-amber-800" :
                        "bg-emerald-100 text-emerald-800"
                      }`}>
                        {aiSuggestion.urgencyLevel}
                      </span>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Estoque Restante</span>
                    <p className="text-xl font-black text-gray-800">
                      ~ {aiSuggestion.estimatedDaysOfStockLeft} <span className="text-xs font-bold text-gray-500">dias</span>
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Grau de Risco</span>
                    <div className="flex items-center space-x-2">
                      <p className="text-xl font-black text-gray-800">{aiSuggestion.riskScore}<span className="text-xs text-gray-400 font-bold">/10</span></p>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            aiSuggestion.riskScore >= 7 ? "bg-rose-500" : aiSuggestion.riskScore >= 4 ? "bg-amber-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${aiSuggestion.riskScore * 10}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-3.5 col-span-2 space-y-1">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Margem de Segurança (Apoio Logístico)</span>
                    <p className="text-xs font-extrabold text-gray-700">
                      + {aiSuggestion.safetyMargin}% <span className="text-[10px] text-gray-400 font-medium">calculados para precaver oscilações de consumo</span>
                    </p>
                  </div>
                </div>

                {/* Justification bubble */}
                <div className="p-4 bg-indigo-50/20 border border-indigo-100/50 rounded-2xl space-y-1.5">
                  <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider block">Por que comprar apenas esta quantidade?</span>
                  <p className="text-xs text-gray-650 leading-relaxed text-left font-medium whitespace-pre-line">{aiSuggestion.justification}</p>
                </div>

                {/* Pre-fill restock action workflow */}
                <div className="flex space-x-2.5 pt-2">
                  <button
                    onClick={() => {
                      setAiProductFocus(null);
                      setAiSuggestion(null);
                    }}
                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-gray-700 font-extrabold text-xs rounded-xl"
                  >
                    Fechar Guia
                  </button>

                  <button
                    onClick={() => {
                      if (aiProductFocus) {
                        setActionType('entrada');
                        setQuantityInput(aiSuggestion.suggestedQuantity);
                        setTransactionNotes(`Lançamento preventivo recomendado pelo assistente de IA Gemini.`);
                        setFocusedProduct(aiProductFocus);
                        // Close suggest overlay first
                        setAiProductFocus(null);
                        setAiSuggestion(null);
                      }
                    }}
                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center space-x-1.5 shadow-md shadow-indigo-150 active:scale-95 transition"
                  >
                    <span>Lançar Entrada Recomendada</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* MODAL 4: CUSTOM PDF REPORT WIZARD */}
      {isReportModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-report-wizard">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-sm w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full cursor-pointer"
              title="Fechar"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-2.5 mb-2">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-gray-900 text-base">📋 Emitir Relatório PDF</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Configuração de prestação de contas</p>
              </div>
            </div>

            <p className="text-xs text-gray-500 mb-3 leading-relaxed text-left">
              Selecione o tipo de relatório oficial que deseja compilar e exportar em formato PDF para fins de prestação de contas.
            </p>

            {/* Tab Selector */}
            <div className="flex bg-slate-100 p-1 rounded-xl gap-1 mb-4">
              <button
                type="button"
                onClick={() => setReportType('inventory')}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                  reportType === 'inventory' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Insumos
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.role === 'Administrador') {
                    setReportType('transactions');
                  }
                }}
                disabled={currentUser?.role !== 'Administrador'}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-0.5 ${
                  currentUser?.role !== 'Administrador' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  reportType === 'transactions' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                }`}
                title={currentUser?.role !== 'Administrador' ? "Apenas para Administradores" : "Exportar Movimentações"}
              >
                Movimentações
              </button>
              <button
                type="button"
                onClick={() => {
                  if (currentUser?.role === 'Administrador') {
                    setReportType('logs');
                  }
                }}
                disabled={currentUser?.role !== 'Administrador'}
                className={`flex-1 py-1.5 text-[10px] font-bold rounded-lg transition-all flex items-center justify-center gap-0.5 ${
                  currentUser?.role !== 'Administrador' ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
                } ${
                  reportType === 'logs' ? 'bg-white text-gray-800 shadow-xs' : 'text-gray-500 hover:text-gray-700'
                }`}
                title={currentUser?.role !== 'Administrador' ? "Apenas para Administradores" : "Exportar Auditoria de Logs"}
              >
                Logs
              </button>
            </div>

            <div className="space-y-4" id="form-report-wizard">
              {reportType === 'inventory' && (
                <>
                  {/* Category selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Filtrar por Categoria</label>
                    <select
                      value={reportCategory}
                      onChange={(e) => setReportCategory(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-sans"
                    >
                      <option value="all">📁 Todas as Categorias</option>
                      <option value="Grãos e Cereais">Grãos e Cereais</option>
                      <option value="Carnes e Frios">Carnes e Frios</option>
                      <option value="Laticínios">Laticínios</option>
                      <option value="Hortifrúti">Hortifrúti</option>
                      <option value="Óleos e Gorduras">Óleos e Gorduras</option>
                      <option value="Enlatados">Enlatados</option>
                      <option value="Outros">Outros</option>
                    </select>
                  </div>

                  {/* Status de Validade selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Status de Validade & Consumo</label>
                    <select
                      value={reportStatus}
                      onChange={(e) => setReportStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-sans"
                    >
                      <option value="all">📦 Todos os Insumos (Resumo Completo)</option>
                      <option value="expired">🔴 Somente Insumos VENCIDOS</option>
                      <option value="expiring">⏰ Vencendo em até 30 dias (Alerta Validade)</option>
                      <option value="low">📉 Somente Estoque Baixo (Alerta Reposição)</option>
                      <option value="regular">🟢 Estoque Adequado & Dentro do Prazo</option>
                    </select>
                  </div>
                </>
              )}

              {reportType === 'transactions' && (
                <>
                  {/* Fluxo selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Filtrar por Fluxo de Estoque</label>
                    <select
                      value={reportTxType}
                      onChange={(e) => setReportTxType(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-sans"
                    >
                      <option value="all">🔄 Todas as Movimentações</option>
                      <option value="entrada">📥 Apenas Entradas de Insumos</option>
                      <option value="saida">📤 Apenas Saídas / Consumo</option>
                      <option value="desperdicio">⚠️ Apenas Desperdícios / Descartes</option>
                    </select>
                  </div>
                </>
              )}

              {reportType === 'logs' && (
                <>
                  {/* Operator / Role selector */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Filtrar por Perfil de Operador</label>
                    <select
                      value={reportLogRole}
                      onChange={(e) => setReportLogRole(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:ring-2 focus:ring-emerald-500 outline-none cursor-pointer font-sans"
                    >
                      <option value="all">👥 Todos os Cargos/Operadores</option>
                      <option value="Administrador">Administrador</option>
                      <option value="Chefe de Almoxarifado">Chefe de Almoxarifado</option>
                      <option value="Coordenadora da Merenda Escolar">Coordenadora da Merenda Escolar</option>
                      <option value="Nutricionista">Nutricionista</option>
                    </select>
                  </div>
                </>
              )}

              {/* Live Preview Summary card */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl text-left">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Resumo de Impressão</span>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-650">Registros contemplados:</span>
                  <span className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                    (reportType === 'inventory' ? reportFilteredProducts.length : reportType === 'transactions' ? reportFilteredTransactions.length : reportFilteredLogs.length) > 0 
                      ? "bg-emerald-100 text-emerald-800" 
                      : "bg-rose-100 text-rose-800"
                  }`}>
                    {reportType === 'inventory' 
                      ? `${reportFilteredProducts.length} ${reportFilteredProducts.length === 1 ? "produto" : "produtos"}` 
                      : reportType === 'transactions'
                      ? `${reportFilteredTransactions.length} ${reportFilteredTransactions.length === 1 ? "movimentação" : "movimentações"}`
                      : `${reportFilteredLogs.length} ${reportFilteredLogs.length === 1 ? "evento" : "eventos"}`
                    }
                  </span>
                </div>

                <p className="text-[10px] text-gray-400 mt-2 leading-tight">
                  * O PDF será automaticamente otimizado e estruturado em formato tabular, com cabeçalhos oficiais e áreas destinadas para assinaturas físicas.
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-650 font-bold rounded-xl text-xs cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    triggerCustomPdfReport();
                    setIsReportModalOpen(false);
                  }}
                  disabled={
                    (reportType === 'inventory' ? reportFilteredProducts.length : reportType === 'transactions' ? reportFilteredTransactions.length : reportFilteredLogs.length) === 0
                  }
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs shadow-sm flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <FileText className="w-4 h-4" />
                  <span>Gerar e Imprimir</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
