/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { SchoolMenu, Product, MealType, UserProfile } from "../types";
import { 
  Calendar, 
  Plus, 
  Trash2, 
  Check, 
  Utensils, 
  Users, 
  Share2, 
  FileText, 
  Info,
  X 
} from "lucide-react";
import { formatBRDate, printReport } from "../utils/reportGenerator";

interface MenuViewProps {
  menus: SchoolMenu[];
  products: Product[];
  currentUser: UserProfile;
  onAddMenu: (menu: Omit<SchoolMenu, 'id' | 'served'>) => void;
  onServeMenu: (menuId: string) => void;
  onDeleteMenu: (menuId: string) => void;
}

export default function MenuView({
  menus,
  products,
  currentUser,
  onAddMenu,
  onServeMenu,
  onDeleteMenu
}: MenuViewProps) {
  const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getLocalDisplayDate = () => {
    const d = new Date();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${day}/${month}`;
  };

  const todayStr = getLocalDateString();
  const displayTodayStr = getLocalDisplayDate();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeDate, setActiveDate] = useState(todayStr); // Today state dynamic representation
  const [selectedMealTypeFilter, setSelectedMealTypeFilter] = useState<string>("all");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmServeId, setConfirmServeId] = useState<string | null>(null);

  // Form Fields
  const [newMenuName, setNewMenuName] = useState("");
  const [newMealType, setNewMealType] = useState<MealType>("almoco");
  const [newDate, setNewDate] = useState(todayStr);
  const [newPortionsCount, setNewPortionsCount] = useState<number>(100);
  const [selectedIngredients, setSelectedIngredients] = useState<Array<{productId: string, quantityPerPortion: number}>>([]);

  // Ingredient picker helper temp variables
  const [tempProductId, setTempProductId] = useState("");
  const [tempQuantity, setTempQuantity] = useState<number>(0.05); // Initial 50g

  const addIngredientField = () => {
    if (!tempProductId) return;
    const prod = products.find(p => p.id === tempProductId);
    if (!prod) return;

    // Check dupes
    if (selectedIngredients.some(item => item.productId === tempProductId)) {
      alert("Este ingrediente já foi adicionado ao cardápio!");
      return;
    }

    setSelectedIngredients([
      ...selectedIngredients,
      { productId: tempProductId, quantityPerPortion: tempQuantity }
    ]);

    setTempProductId("");
  };

  const removeIngredientField = (prodId: string) => {
    setSelectedIngredients(selectedIngredients.filter(item => item.productId !== prodId));
  };

  const handleMenuSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMenuName.trim() || selectedIngredients.length === 0) {
      alert("Escreva o nome do prato e selecione pelo menos um ingrediente do estoque escolar!");
      return;
    }

    // Map database labels
    const finishedIngredients = selectedIngredients.map(item => {
      const dbProd = products.find(p => p.id === item.productId);
      return {
        productId: item.productId,
        name: dbProd ? dbProd.name : "Item Desconhecido",
        quantityPerPortion: item.quantityPerPortion,
        unit: dbProd ? dbProd.unit : "kg"
      };
    });

    onAddMenu({
      name: newMenuName,
      mealType: newMealType,
      date: newDate,
      portionsCount: newPortionsCount,
      ingredients: finishedIngredients
    });

    // Reset fields
    setNewMenuName("");
    setNewDate(todayStr);
    setNewPortionsCount(100);
    setSelectedIngredients([]);
    setIsAddOpen(false);
  };

  // Filtered menu lists
  const filteredMenus = menus.filter(m => {
    const matchesMeal = selectedMealTypeFilter === "all" || m.mealType === selectedMealTypeFilter;
    const matchesDate = !activeDate || m.date === activeDate;
    return matchesMeal && matchesDate;
  });

  // Calculate ingredients report overview for printing
  const generateMenuPDFReport = (menu: SchoolMenu) => {
    const headers = ["Insumo/Ingrediente", "Qtd por Aluno", "Qtd Total Necessária", "Unidade", "Saldo Atual em Dispensa"];
    const rows = menu.ingredients.map(i => {
      const prodObj = products.find(p => p.id === i.productId);
      const totalAmount = i.quantityPerPortion * menu.portionsCount;
      return [
        i.name,
        String(i.quantityPerPortion),
        totalAmount.toFixed(2),
        i.unit,
        prodObj ? `${prodObj.quantity} ${prodObj.unit}` : "Sem Cadastro"
      ];
    });

    // Sort ingredients rows alphabetically by name (index 0)
    const sortedRows = [...rows].sort((a, b) => a[0].localeCompare(b[0], "pt-BR", { sensitivity: "base" }));

    printReport(
      `Ficha Técnica: ${menu.name}`,
      `Refeição agendada para ${formatBRDate(menu.date)} (${menu.mealType.toUpperCase()}) - Planejado para ${menu.portionsCount} estudantes`,
      headers,
      sortedRows
    );
  };

  return (
    <div className="space-y-6" id="menu-view-main">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="menu-view-header">
        <div>
          <h2 className="text-xl font-bold text-gray-900">🥗 Planejamento de Cardápios & Receitas</h2>
          <p className="text-xs text-gray-500">Crie refeições e deduzi automaticamente quantidades correspondentes de alimentos com a função Servir.</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          id="btn-open-add-menu"
          className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center space-x-1 hover:bg-emerald-700 active:scale-95 transition shadow-xs cursor-pointer self-start sm:self-center"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cardápio Diário</span>
        </button>
      </div>

      {/* Date Navigation & Shifts filter */}
      <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs space-y-4" id="calendar-filter-bar">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          
          {/* Quick Date Quick Switch buttons */}
          <div className="flex items-center space-x-2" id="date-shortcuts">
            <span className="text-xs font-semibold text-gray-500 flex items-center">
              <Calendar className="w-4 h-4 mr-1 text-gray-400" />
              Filtrar Data:
            </span>
            <input 
              type="date"
              value={activeDate}
              onChange={(e) => setActiveDate(e.target.value)}
              className="px-2 py-1 bg-slate-50 border border-gray-200 rounded-lg text-xs font-mono text-gray-700"
            />
            <button 
              onClick={() => setActiveDate(todayStr)}
              className={`px-2.5 py-1 text-xs rounded-lg border font-semibold ${
                activeDate === todayStr ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              Hoje ({displayTodayStr})
            </button>
            <button 
              onClick={() => setActiveDate("")}
              className={`px-2.5 py-1 text-xs rounded-lg border font-semibold ${
                activeDate === "" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-white text-gray-600 border-gray-200"
              }`}
            >
              Todos os Dias
            </button>
          </div>

          {/* Shifts Picker Filter */}
          <div className="flex items-center space-x-1.5" id="meal-type-shortcuts">
            <span className="text-xs font-semibold text-gray-500">Refeição:</span>
            <select
              value={selectedMealTypeFilter}
              onChange={(e) => setSelectedMealTypeFilter(e.target.value)}
              className="p-1 px-2.5 bg-slate-50 border border-gray-200 rounded-lg text-xs text-gray-700"
            >
              <option value="all">Todas as Refeições</option>
              <option value="matutino">🌅 Matutino</option>
              <option value="almoco">🍽️ Almoço</option>
              <option value="vespertino">🥪 Vespertino</option>
              <option value="noturno">🌙 Noturno</option>
            </select>
          </div>

        </div>
      </div>

      {/* Grid of Menus listings for the Day */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4" id="menus-planner-list">
        {filteredMenus.map((menu) => (
          <div 
            key={menu.id} 
            className={`p-5 bg-white border rounded-2xl shadow-xs space-y-4 flex flex-col justify-between relative ${
              menu.served ? "border-slate-200 bg-slate-50/50" : "border-emerald-150 bg-emerald-50/5"
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold tracking-wider ${
                      menu.mealType === "matutino" ? "bg-amber-100 text-amber-800" :
                      menu.mealType === "almoco" ? "bg-emerald-100 text-emerald-800" :
                      menu.mealType === "vespertino" ? "bg-orange-100 text-orange-850" :
                      "bg-indigo-100 text-indigo-850"
                    }`}>
                      {menu.mealType}
                    </span>
                    <span className="text-xs font-mono text-gray-400">
                      📅 {formatBRDate(menu.date)}
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-base mt-1.5 leading-snug">{menu.name}</h3>
                </div>

                {menu.served ? (
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-lg">
                    ✓ SERVIDO (Estoque Baixado)
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 font-semibold px-2 py-1 rounded-lg">
                    Pendente
                  </span>
                )}
              </div>

              {/* Servings portion size indicator */}
              <div className="flex items-center text-xs text-gray-600 bg-slate-50 rounded-xl p-2.5" id={`servings-row-${menu.id}`}>
                <Users className="w-4 h-4 text-gray-400 mr-2" />
                <span>Planejado para: <b className="text-gray-900">{menu.portionsCount} Alunos</b></span>
              </div>

              {/* Insumo ingredient checklist */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ingredientes & Consumo Previsto:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {menu.ingredients.map((ing) => {
                    const quantityNeeded = ing.quantityPerPortion * menu.portionsCount;
                    const stockItem = products.find(p => p.id === ing.productId);
                    const isSufficient = stockItem ? stockItem.quantity >= quantityNeeded : false;

                    return (
                      <div 
                        key={ing.productId} 
                        className={`p-2 border rounded-xl flex flex-col justify-between ${
                          menu.served ? "bg-slate-100 border-slate-250 text-gray-500" :
                          isSufficient ? "bg-gray-50 border-gray-150 text-gray-700" :
                          "bg-rose-50 border-rose-100 text-rose-900"
                        }`}
                      >
                        <div className="flex justify-between items-center w-full">
                          <span className="font-semibold truncate max-w-[130px]">{ing.name}</span>
                          <span className="font-mono font-bold text-[11px]">
                            {quantityNeeded.toFixed(2)} {ing.unit}
                          </span>
                        </div>
                        
                        {!menu.served && (
                          <div className="flex justify-between text-[10px] mt-1 text-gray-500">
                            <span>Dispensa: {stockItem ? `${stockItem.quantity} ${stockItem.unit}` : "N/A"}</span>
                            {!isSufficient && <span className="text-rose-600 font-bold">Saldo Insuficiente!</span>}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Print Recipe + Action Button */}
            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2" id={`mab-${menu.id}`}>
              <button
                onClick={() => generateMenuPDFReport(menu)}
                id={`btn-menu-pdf-${menu.id}`}
                className="p-1 px-2 text-slate-600 hover:bg-slate-100 hover:text-gray-800 text-[11px] font-bold rounded-lg flex items-center space-x-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Imprimir Ficha</span>
              </button>

              <div className="flex items-center space-x-2">
                {!menu.served && (
                  confirmServeId === menu.id ? (
                    <div className="flex items-center space-x-1 animate-scale-in">
                      <button
                        onClick={() => {
                          onServeMenu(menu.id);
                          setConfirmServeId(null);
                        }}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 transition"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Confirmar Baixa</span>
                      </button>
                      <button
                        onClick={() => setConfirmServeId(null)}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-gray-700 font-bold rounded-xl text-xs transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmServeId(menu.id)}
                      id={`btn-serve-trigger-${menu.id}`}
                      className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1 shadow-sm active:scale-95 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Dar Baixa Estoque</span>
                    </button>
                  )
                )}

                {currentUser.role === 'Administrador' ? (
                  confirmDeleteId === menu.id ? (
                    <div className="flex items-center space-x-1 animate-scale-in">
                      <button
                        onClick={() => {
                          onDeleteMenu(menu.id);
                          setConfirmDeleteId(null);
                        }}
                        className="px-2.5 py-1.5 bg-red-600 text-white font-bold rounded-xl text-xs transition"
                      >
                        Confirmar
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1.5 bg-slate-200 text-gray-700 font-bold rounded-xl text-xs transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(menu.id)}
                      id={`btn-delete-menu-${menu.id}`}
                      className="p-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-650 text-gray-400 rounded-xl transition"
                      title="Excluir Cardápio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="p-1.5 bg-slate-100 text-gray-300 rounded-xl cursor-not-allowed"
                    title="Exclusão de cardápio permitida apenas para Administradores"
                  >
                    <Trash2 className="w-4 h-4 opacity-40" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {filteredMenus.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-400 bg-white border border-gray-100 rounded-2xl flex flex-col items-center justify-center space-y-2">
            <Utensils className="w-10 h-10 opacity-30 text-emerald-800" />
            <p className="text-xs font-semibold">Nenhuma refeição cadastrada para este dia e turno.</p>
            <button
              onClick={() => setIsAddOpen(true)}
              id="btn-add-menu-missing"
              className="px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold rounded-xl text-xs hover:bg-emerald-100 transition mt-1"
            >
              Criar Primeiro Cardápio Diário
            </button>
          </div>
        )}
      </div>

      {/* MODAL: ADD MEAL WITH RECIPE */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="modal-add-menu">
          <div className="bg-white rounded-3xl border border-gray-100 max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsAddOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-bold text-gray-900 text-base mb-1">🍽️ Planejar Refeição no Cardápio</h3>
            <p className="text-xs text-gray-500 mb-4">Selecione o Prato principal e os ingredientes proporcionais por aluno para dar baixa automática.</p>

            <form onSubmit={handleMenuSubmit} className="space-y-4" id="form-add-menu">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Nome do Prato Principal *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Arroz Carreteiro com Legumes"
                  value={newMenuName}
                  onChange={(e) => setNewMenuName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Refeição / Turno</label>
                  <select
                    value={newMealType}
                    onChange={(e) => setNewMealType(e.target.value as MealType)}
                    className="w-full p-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-700 outline-none"
                  >
                    <option value="matutino">🌅 Café Matutino</option>
                    <option value="almoco">🍽️ Almoço Escolar</option>
                    <option value="vespertino">🥪 Lanche Vespertino</option>
                    <option value="noturno">🌙 Jantar Noturno</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">N° de Alimentados</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newPortionsCount}
                    onChange={(e) => setNewPortionsCount(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Data de Provimento</label>
                <input
                  type="date"
                  required
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-800 font-mono outline-none"
                />
              </div>

              {/* Ingredient selection widgets */}
              <div className="p-3 bg-emerald-50/30 border border-emerald-100 rounded-2xl space-y-3">
                <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide block">Configurar Receita (Fórmula de Redução)</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2" id="temp-ingredient-picker">
                  <div className="sm:col-span-6">
                    <select
                      value={tempProductId}
                      onChange={(e) => setTempProductId(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-700"
                    >
                      <option value="">-- Selecione o item do estoque --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({p.unit})</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-4 flex items-center space-x-1 bg-white border border-gray-200 rounded-xl px-2">
                    <input
                      type="number"
                      step="any"
                      placeholder="g / dose por aluno"
                      value={tempQuantity || ""}
                      onChange={(e) => setTempQuantity(Number(e.target.value))}
                      className="w-full p-1 bg-transparent text-xs text-right font-mono outline-none"
                    />
                    <span className="text-[10px] text-gray-400 font-bold whitespace-nowrap">
                      {tempProductId ? products.find(p => p.id === tempProductId)?.unit : "kg/l"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={addIngredientField}
                    id="btn-add-ingredient-to-menu-form"
                    className="sm:col-span-2 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl hover:bg-emerald-700"
                  >
                    Adicionar
                  </button>
                </div>

                {/* Added ingredients Checklist */}
                {selectedIngredients.length > 0 ? (
                  <div className="space-y-1.5 pt-1.5 border-t border-emerald-100">
                    <span className="text-[10px] font-semibold text-gray-500">Ingredientes Escolhidos para Dedução:</span>
                    <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                      {selectedIngredients.map((item) => {
                        const targetProd = products.find(p => p.id === item.productId);
                        const totalCalculated = item.quantityPerPortion * newPortionsCount;
                        return (
                          <div key={item.productId} className="flex items-center justify-between text-xs p-2 bg-white rounded-xl border border-gray-100">
                            <span>{targetProd?.name}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-gray-500 font-mono text-[10px]" title="Quantidade unitária de porção">
                                {item.quantityPerPortion} x {newPortionsCount} alunos =
                              </span>
                              <span className="font-bold text-emerald-800 font-mono text-[11px]">
                                {totalCalculated.toFixed(2)} {targetProd?.unit}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeIngredientField(item.productId)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded-lg"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-gray-500 italic text-center py-2">Nenhum ingrediente adicionado à receita ainda. Selecione na lista acima.</p>
                )}
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-gray-600 font-bold rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  id="btn-confirm-add-menu"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-sm"
                >
                  Salvar Refeição
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
