/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Product, SchoolMenu, StockTransaction, UserProfile, ActivityLog, SyncStatus, UserAccount } from "./types";
import DashboardView from "./components/DashboardView";
import InventoryView from "./components/InventoryView";
import MenuView from "./components/MenuView";
import ScannerView from "./components/ScannerView";
import AuditView from "./components/AuditView";
import LoginView from "./components/LoginView";
import UserManagementView from "./components/UserManagementView";
import { 
  LayoutDashboard, 
  Package, 
  Utensils, 
  Camera, 
  ShieldAlert, 
  BookOpen, 
  LogOut,
  RefreshCw,
  Sparkles,
  Award,
  Users
} from "lucide-react";

// Initial items to seed localStorage if empty (same as backend servers for consistency)
const DEFAULT_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    name: "Arroz Integral",
    barcode: "7891234567890",
    category: "Grãos e Cereais",
    quantity: 85.0,
    minQuantity: 20.0,
    unit: "kg",
    expiryDate: "2026-12-15",
    supplier: "Arroz do Sul S/A",
    location: "Despensa Secos A",
    wastage: 1.2,
  },
  {
    id: "prod-2",
    name: "Feijão Carioca",
    barcode: "7891234567891",
    category: "Grãos e Cereais",
    quantity: 45.0,
    minQuantity: 15.0,
    unit: "kg",
    expiryDate: "2026-10-30",
    supplier: "Feijão Verde Alimentos",
    location: "Despensa Secos A",
    wastage: 0.5,
  },
  {
    id: "prod-3",
    name: "Peito de Frango",
    barcode: "7891234567892",
    category: "Carnes e Frios",
    quantity: 32.5,
    minQuantity: 10.0,
    unit: "kg",
    expiryDate: "2026-07-20",
    supplier: "Frigorífico Kel Distribuidora",
    location: "Freezer Vertical 01",
    wastage: 0.8,
  },
  {
    id: "prod-4",
    name: "Óleo de Soja",
    barcode: "7891234567893",
    category: "Óleos e Gorduras",
    quantity: 18.0,
    minQuantity: 5.0,
    unit: "litros",
    expiryDate: "2026-09-12",
    supplier: "Distribuidora Vale Verde",
    location: "Armário de Temperos",
    wastage: 0.1,
  },
  {
    id: "prod-5",
    name: "Cebola",
    barcode: "7891234567894",
    category: "Hortifrúti",
    quantity: 12.0,
    minQuantity: 5.0,
    unit: "kg",
    expiryDate: "2026-06-18",
    supplier: "Horta Local e Cooperativa",
    location: "Caixa Plástica Geladeira 02",
    wastage: 2.1,
  },
  {
    id: "prod-6",
    name: "Alho Triturado",
    barcode: "7891234567895",
    category: "Hortifrúti",
    quantity: 4.5,
    minQuantity: 2.0,
    unit: "kg",
    expiryDate: "2026-08-01",
    supplier: "Horta Local e Cooperativa",
    location: "Armário de Temperos",
    wastage: 0.05,
  },
  {
    id: "prod-7",
    name: "Macarrão Parafuso",
    barcode: "7891234567896",
    category: "Grãos e Cereais",
    quantity: 60.0,
    minQuantity: 15.0,
    unit: "kg",
    expiryDate: "2026-11-20",
    supplier: "Arroz do Sul S/A",
    location: "Despensa Secos B",
    wastage: 0.3,
  },
  {
    id: "prod-8",
    name: "Molho de Tomate",
    barcode: "7891234567897",
    category: "Enlatados",
    quantity: 24.0,
    minQuantity: 8.0,
    unit: "unidades",
    expiryDate: "2027-02-10",
    supplier: "Distribuidora Vale Verde",
    location: "Despensa Secos B",
    wastage: 0.1,
  },
  {
    id: "prod-9",
    name: "Leite Integral UHT",
    barcode: "7891234567898",
    category: "Laticínios",
    quantity: 40.0,
    minQuantity: 12.0,
    unit: "litros",
    expiryDate: "2026-06-10",
    supplier: "Cooperativa de Laticínios Kel",
    location: "Geladeira Industrial 01",
    wastage: 0.2,
  },
  {
    id: "prod-10",
    name: "Maçã Gala",
    barcode: "7891234567899",
    category: "Hortifrúti",
    quantity: 2.5,
    minQuantity: 8.0,
    unit: "kg",
    expiryDate: "2026-06-14",
    supplier: "Horta Local e Cooperativa",
    location: "Caixa Plástica Geladeira 02",
    wastage: 0.4,
  },
];

const DEFAULT_MENUS: SchoolMenu[] = [
  {
    id: "menu-1",
    name: "Arroz, Feijão e Peito de Frango Grelhado",
    mealType: "almoco",
    date: "2026-06-06",
    ingredients: [
      { productId: "prod-1", name: "Arroz Integral", quantityPerPortion: 0.08, unit: "kg" },
      { productId: "prod-2", name: "Feijão Carioca", quantityPerPortion: 0.05, unit: "kg" },
      { productId: "prod-3", name: "Peito de Frango", quantityPerPortion: 0.10, unit: "kg" },
      { productId: "prod-4", name: "Óleo de Soja", quantityPerPortion: 0.005, unit: "litros" },
      { productId: "prod-5", name: "Cebola", quantityPerPortion: 0.01, unit: "kg" },
      { productId: "prod-6", name: "Alho Triturado", quantityPerPortion: 0.002, unit: "kg" },
    ],
    portionsCount: 150,
    served: false,
  },
  {
    id: "menu-2",
    name: "Macarronada de Frango ao Molho",
    mealType: "almoco",
    date: "2026-06-07",
    ingredients: [
      { productId: "prod-7", name: "Macarrão Parafuso", quantityPerPortion: 0.09, unit: "kg" },
      { productId: "prod-3", name: "Peito de Frango", quantityPerPortion: 0.08, unit: "kg" },
      { productId: "prod-8", name: "Molho de Tomate", quantityPerPortion: 0.15, unit: "unidades" },
      { productId: "prod-4", name: "Óleo de Soja", quantityPerPortion: 0.005, unit: "litros" },
      { productId: "prod-5", name: "Cebola", quantityPerPortion: 0.01, unit: "kg" },
      { productId: "prod-6", name: "Alho Triturado", quantityPerPortion: 0.002, unit: "kg" },
    ],
    portionsCount: 120,
    served: false,
  },
  {
    id: "menu-3",
    name: "Copo de Leite Integral e Fruta",
    mealType: "matutino",
    date: "2026-06-06",
    ingredients: [
      { productId: "prod-9", name: "Leite Integral UHT", quantityPerPortion: 0.20, unit: "litros" },
      { productId: "prod-10", name: "Maçã Gala", quantityPerPortion: 0.12, unit: "kg" },
    ],
    portionsCount: 80,
    served: true,
  },
];

const DEFAULT_TXS: StockTransaction[] = [
  {
    id: "tx-1",
    productId: "prod-9",
    productName: "Leite Integral UHT",
    type: "entrada",
    quantity: 50.0,
    unit: "litros",
    date: "2026-06-05T09:30:00Z",
    user: "kel_admin",
    notes: "Entrada via Fornecedor - Lote de Laticínios",
  },
  {
    id: "tx-2",
    productId: "prod-9",
    productName: "Leite Integral UHT",
    type: "saida",
    quantity: 16.0,
    unit: "litros",
    date: "2026-06-06T07:15:00Z",
    user: "maria_merenda",
    notes: "Consumo automático - Copo de Leite Integral e Fruta (80 porções)",
  },
  {
    id: "tx-3",
    productId: "prod-10",
    productName: "Maçã Gala",
    type: "saida",
    quantity: 9.6,
    unit: "kg",
    date: "2026-06-06T07:15:00Z",
    user: "maria_merenda",
    notes: "Consumo automático - Copo de Leite Integral e Fruta (80 porções)",
  },
  {
    id: "tx-4",
    productId: "prod-10",
    productName: "Maçã Gala",
    type: "desperdicio",
    quantity: 0.4,
    unit: "kg",
    date: "2026-06-05T14:40:00Z",
    user: "kel_admin",
    notes: "Produto machucado e impróprio para consumo na triagem",
  }
];

const DEFAULT_LOGS: ActivityLog[] = [
  {
    id: "log-1",
    timestamp: "2026-06-05T09:30:00.000Z",
    user: "kel_admin",
    role: "Administrador",
    action: "Entrada de Estoque",
    details: "Registrou entrada de 50.0 litros de Leite Integral UHT",
  },
  {
    id: "log-2",
    timestamp: "2026-06-05T14:42:00.000Z",
    user: "kel_admin",
    role: "Administrador",
    action: "Desperdício",
    details: "Registrou desperdício de 0.4 kg de Maçã Gala",
  },
  {
    id: "log-3",
    timestamp: "2026-06-06T07:15:00.000Z",
    user: "maria_merenda",
    role: "Merendeira",
    action: "Consumo de Cardápio",
    details: "Consumo automático do cardápio 'Copo de Leite Integral e Fruta'",
  }
];

const DEFAULT_USERS: UserAccount[] = [
  {
    id: "usr-admin",
    username: "violaokel@gmail.com",
    role: "Administrador",
    name: "Kel Gestor",
    password: "028089"
  },
  {
    id: "usr-merenda",
    username: "maria_coordenadora",
    role: "Coordenadora da Merenda Escolar",
    name: "Maria Coordenadora",
    password: "123456"
  },
  {
    id: "usr-auxiliar",
    username: "joao_almoxarife",
    role: "Chefe de Almoxarifado",
    name: "João Almoxarife",
    password: "123456"
  },
  {
    id: "usr-nutri",
    username: "ana_nutricionista",
    role: "Nutricionista",
    name: "Ana Nutricionista",
    password: "123455"
  }
];

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>("inicio"); // inicio, estoque, cardapio, leitor, configuracoes, usuarios
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  // Core Data States
  const [products, setProducts] = useState<Product[]>([]);
  const [menus, setMenus] = useState<SchoolMenu[]>([]);
  const [transactions, setTransactions] = useState<StockTransaction[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccount[]>([]);

  // Local storage initialization gate
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  // Synchronization status representation
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: true,
    pendingSyncCount: 0,
    lastSyncedAt: new Date().toISOString()
  });

  const [darkMode, setDarkMode] = useState<boolean>(false);

  // Pre-load saved or default data from local storage, then reconcile online database
  useEffect(() => {
    // Check local storage
    const storedProds = localStorage.getItem("kel_products");
    const storedMenus = localStorage.getItem("kel_menus");
    const storedTxs = localStorage.getItem("kel_transactions");
    const storedLogs = localStorage.getItem("kel_logs");
    const storedUser = localStorage.getItem("kel_logged_user");
    const storedUserAccounts = localStorage.getItem("kel_user_accounts");
    const storedDarkMode = localStorage.getItem("kel_dark_mode");

    if (storedProds) setProducts(JSON.parse(storedProds));
    else setProducts(DEFAULT_PRODUCTS);

    if (storedMenus) setMenus(JSON.parse(storedMenus));
    else setMenus(DEFAULT_MENUS);

    if (storedTxs) setTransactions(JSON.parse(storedTxs));
    else setTransactions(DEFAULT_TXS);

    if (storedLogs) setLogs(JSON.parse(storedLogs));
    else setLogs(DEFAULT_LOGS);

    if (storedUserAccounts) setUserAccounts(JSON.parse(storedUserAccounts));
    else setUserAccounts(DEFAULT_USERS);

    if (storedUser) setCurrentUser(JSON.parse(storedUser));
    if (storedDarkMode === "true") setDarkMode(true);

    setIsInitialized(true);

    // Initial API load attempt (Online Sync reconciliation)
    pullDataFromServer();
  }, []);

  // Save changes locally whenever states change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("kel_products", JSON.stringify(products));
    }
  }, [products, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("kel_menus", JSON.stringify(menus));
    }
  }, [menus, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("kel_transactions", JSON.stringify(transactions));
    }
  }, [transactions, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("kel_logs", JSON.stringify(logs));
    }
  }, [logs, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem("kel_user_accounts", JSON.stringify(userAccounts));
    }
  }, [userAccounts, isInitialized]);

  // Try to sync with server
  const pullDataFromServer = async () => {
    try {
      const res = await fetch("/api/data");
      if (res.ok) {
        const cloudData = await res.json();
        
        // Simple merge fallback: Cloud wins or joins
        if (cloudData.products && cloudData.products.length > 0) {
          setProducts(cloudData.products);
        }
        if (cloudData.schoolMenus && cloudData.schoolMenus.length > 0) {
          setMenus(cloudData.schoolMenus);
        }
        if (cloudData.transactions && cloudData.transactions.length > 0) {
          setTransactions(cloudData.transactions);
        }
        if (cloudData.userAccounts && cloudData.userAccounts.length > 0) {
          setUserAccounts(cloudData.userAccounts);
        }
        if (cloudData.logs && cloudData.logs.length > 0) {
          setLogs(cloudData.logs);
        }

        setSyncStatus({
          isOnline: true,
          pendingSyncCount: 0,
          lastSyncedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn("Utilizando banco offline integrado no navegador.", err);
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    }
  };

  const pushDataToServer = async (
    currentProds = products, 
    currentMenus = menus, 
    currentTxs = transactions, 
    currentLogs = logs, 
    currentUsers = userAccounts
  ) => {
    try {
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: currentProds,
          schoolMenus: currentMenus,
          transactions: currentTxs,
          logs: currentLogs,
          userAccounts: currentUsers
        })
      });
      if (res.ok) {
        setSyncStatus({
          isOnline: true,
          pendingSyncCount: 0,
          lastSyncedAt: new Date().toISOString()
        });
      } else {
        throw new Error();
      }
    } catch {
      setSyncStatus(prev => ({
        ...prev,
        isOnline: false,
        pendingSyncCount: prev.pendingSyncCount + 1
      }));
    }
  };

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    localStorage.setItem("kel_logged_user", JSON.stringify(user));
    
    // Log login activity
    writeAuditLog(
      user.username,
      user.role,
      "Acesso ao Sistema",
      `Efetuou login bem-sucedido no perfil ${user.role}.`
    );
  };

  const handleLogout = () => {
    if (currentUser) {
      writeAuditLog(
        currentUser.username,
        currentUser.role,
        "Saída do Sistema",
        `Logout efetuado com sucesso.`
      );
    }
    setCurrentUser(null);
    localStorage.removeItem("kel_logged_user");
  };

  const handleAddUser = (newUsr: Omit<UserAccount, 'id'>) => {
    const fresh: UserAccount = {
      ...newUsr,
      id: "usr-" + Date.now()
    };
    const updated = [...userAccounts, fresh];
    setUserAccounts(updated);
    
    if (currentUser) {
      writeAuditLog(
        currentUser.username,
        currentUser.role,
        "Cadastro de Usuário",
        `Cadastrou o novo usuário municipal: "${fresh.name}" com perfil ${fresh.role}.`
      );
    }
    pushDataToServer(products, menus, transactions, logs, updated);
  };

  const handleUpdateUser = (userId: string, updatedFields: Partial<UserAccount>) => {
    const updated = userAccounts.map(u => {
      if (u.id === userId) {
        return { ...u, ...updatedFields };
      }
      return u;
    });
    setUserAccounts(updated);

    // If edited user is currently logged in, update their local view as well
    const updatedUserObj = updated.find(u => u.id === userId);
    if (updatedUserObj && currentUser && currentUser.username === updatedUserObj.username) {
      const synchedProfile: UserProfile = {
        name: updatedUserObj.name,
        username: updatedUserObj.username,
        role: updatedUserObj.role
      };
      setCurrentUser(synchedProfile);
      localStorage.setItem("kel_logged_user", JSON.stringify(synchedProfile));
    }

    if (currentUser) {
      writeAuditLog(
        currentUser.username,
        currentUser.role,
        "Edição de Usuário",
        `Atualizou informações de cadastro para ID de usuário ${userId}.`
      );
    }
    pushDataToServer(products, menus, transactions, logs, updated);
  };

  const handleDeleteUser = (userId: string) => {
    const uName = userAccounts.find(u => u.id === userId)?.name || "";
    const updated = userAccounts.filter(u => u.id !== userId);
    setUserAccounts(updated);

    if (currentUser) {
      writeAuditLog(
        currentUser.username,
        currentUser.role,
        "Exclusão de Usuário",
        `Excluiu permanentemente a credencial do usuário municipal "${uName}".`
      );
    }
    pushDataToServer(products, menus, transactions, logs, updated);
  };

  const writeAuditLog = (username: string, role: string, action: string, details: string) => {
    const newLog: ActivityLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      user: username,
      role: role,
      action: action,
      details: details
    };

    setLogs(prev => {
      const updated = [newLog, ...prev];
      // Save directly
      localStorage.setItem("kel_logs", JSON.stringify(updated));
      return updated;
    });

    // Also push singly if server ready
    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newLog)
    }).catch(() => {});
  };

  // 1. ADD DYNAMIC PRODUCT FROM PANEL
  const handleAddProduct = (prod: Omit<Product, 'id' | 'wastage'>) => {
    const newProd: Product = {
      ...prod,
      id: "prod-" + Date.now(),
      wastage: 0
    };

    const updated = [newProd, ...products];
    setProducts(updated);
    
    if (currentUser) {
      writeAuditLog(
        currentUser.username,
        currentUser.role,
        "Cadastro de Produto",
        `Cadastrou novo material escolar: "${newProd.name}" com ${newProd.quantity} ${newProd.unit} em estoque inicial.`
      );
    }

    pushDataToServer(updated, menus, transactions, logs);
  };

  // 2. DELETE PRODUCT
  const handleDeleteProduct = (productId: string) => {
    const prodName = products.find(p => p.id === productId)?.name || "";
    const updated = products.filter(p => p.id !== productId);
    setProducts(updated);

    if (currentUser) {
      writeAuditLog(
        currentUser.username,
        currentUser.role,
        "Exclusão de Produto",
        `Excluiu permanentemente o produto "${prodName}" ID ${productId}.`
      );
    }

    pushDataToServer(updated, menus, transactions, logs);
  };

  // 3. ON UPDATE QUANTITY (manual entrada / saída / desperdício helper)
  const handleUpdateProductQuantity = (productId: string, quantityChange: number, type: 'entrada' | 'saida' | 'desperdicio', notes: string) => {
    const targetProduct = products.find(p => p.id === productId);
    if (!targetProduct) return;

    // Calculate final updated quantity safely
    let updatedQuantity = targetProduct.quantity;
    let updatedWastage = targetProduct.wastage;

    if (type === 'entrada') {
      updatedQuantity += quantityChange;
    } else if (type === 'saida') {
      updatedQuantity = Math.max(0, updatedQuantity - quantityChange);
    } else if (type === 'desperdicio') {
      updatedQuantity = Math.max(0, updatedQuantity - quantityChange);
      updatedWastage += quantityChange;
    }

    const updatedProds = products.map((p) => {
      if (p.id === productId) {
        return {
          ...p,
          quantity: updatedQuantity,
          wastage: updatedWastage
        };
      }
      return p;
    });

    // Create the transaction
    const newTx: StockTransaction = {
      id: "tx-" + Date.now(),
      productId: productId,
      productName: targetProduct.name,
      type: type,
      quantity: quantityChange,
      unit: targetProduct.unit,
      date: new Date().toISOString(),
      user: currentUser?.username || "sistema",
      notes: notes
    };

    const updatedTxs = [newTx, ...transactions];

    setProducts(updatedProds);
    setTransactions(updatedTxs);

    if (currentUser) {
      writeAuditLog(
        currentUser.username,
        currentUser.role,
        type === 'entrada' ? "Entrada de Estoque" : type === "saida" ? "Saída de Estoque" : "Desperdício Lançado",
        `Alinhou saldo do item "${targetProduct.name}" com movimentação de ${type.toUpperCase()}: ${quantityChange} ${targetProduct.unit}.`
      );
    }

    pushDataToServer(updatedProds, menus, updatedTxs, logs);
  };

  // 4. ADD MENU RECIPE
  const handleAddMenu = (menu: Omit<SchoolMenu, 'id' | 'served'>) => {
    const newMenu: SchoolMenu = {
      ...menu,
      id: "menu-" + Date.now(),
      served: false
    };

    const updated = [newMenu, ...menus];
    setMenus(updated);

    if (currentUser) {
      writeAuditLog(
        currentUser.username,
        currentUser.role,
        "Lançamento de Cardápio",
        `Agendou prato "${newMenu.name}" para o dia ${newMenu.date} (${newMenu.mealType}).`
      );
    }

    pushDataToServer(products, updated, transactions, logs);
  };

  // 5. SERVE MENU & DEDUCT FROM INVENTORY AUTOMATICALLY
  const handleServeMenu = (menuId: string) => {
    const menuObj = menus.find(m => m.id === menuId);
    if (!menuObj || menuObj.served) return;

    const portionsCount = menuObj.portionsCount;
    const updatedProductsList = [...products];
    const newTransactionsList = [...transactions];

    // Go over each recipe ingredient inside the served menu
    menuObj.ingredients.forEach((ing) => {
      // Net reduction
      const totalAmountToDeduct = ing.quantityPerPortion * portionsCount;

      const productToDeduct = updatedProductsList.find(p => p.id === ing.productId);
      if (productToDeduct) {
        // Safe subtraction
        productToDeduct.quantity = Math.max(0, productToDeduct.quantity - totalAmountToDeduct);

        // Add corresponding transaction movement
        const reductionTx: StockTransaction = {
          id: "tx-auto-" + Math.random().toString(36).substr(2, 9),
          productId: ing.productId,
          productName: ing.name,
          type: "saida",
          quantity: totalAmountToDeduct,
          unit: ing.unit,
          date: new Date().toISOString(),
          user: currentUser?.username || "sistema",
          notes: `Dedução automática via Cardápio: ${menuObj.name} (${portionsCount} alunos)`
        };

        newTransactionsList.unshift(reductionTx);
      }
    });

    // Mark menu served: true
    const updatedMenusList = menus.map((m) => {
      if (m.id === menuId) {
        return { ...m, served: true };
      }
      return m;
    });

    setProducts(updatedProductsList);
    setTransactions(newTransactionsList);
    setMenus(updatedMenusList);

    if (currentUser) {
      writeAuditLog(
        currentUser.username,
        currentUser.role,
        "Dedução de Cardápio",
        `Refeição "${menuObj.name}" servida! Ingredientes baixados proporcionalmente do estoque da cozinha.`
      );
    }

    pushDataToServer(updatedProductsList, updatedMenusList, newTransactionsList, logs);
  };

  // 6. DELETE MENU
  const handleDeleteMenu = (menuId: string) => {
    const updated = menus.filter(m => m.id !== menuId);
    setMenus(updated);

    if (currentUser) {
      writeAuditLog(
        currentUser.username,
        currentUser.role,
        "Exclusão de Cardápio",
        `Removeu refeição ID ${menuId} do calendário.`
      );
    }

    pushDataToServer(products, updated, transactions, logs);
  };

  // Force trigger sync check
  const handleTriggerManualSync = () => {
    pullDataFromServer();
    pushDataToServer();
  };

  // Redirect from scanner to create screen with predefined barcode
  const handleAddProductWithBarcodeRedirect = (barcode: string) => {
    setActiveTab("estoque");
    // Trigger modal alert or helper message will proceed automatically
    setTimeout(() => {
      const addBtn = document.getElementById("btn-open-add-product");
      if (addBtn) addBtn.click();
      
      // Auto-populate barcode in form if rendering
      setTimeout(() => {
        const barcodeInput = document.querySelector('input[placeholder="EAN-13 numérico"]') as HTMLInputElement;
        if (barcodeInput) {
          barcodeInput.value = barcode;
          // React synthetic event trigger simulation
          const tracker = (barcodeInput as any)._valueTracker;
          if (tracker) tracker.setValue("");
          barcodeInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
      }, 300);
    }, 150);
  };

  const toggleDarkModeStyle = (val: boolean) => {
    setDarkMode(val);
    localStorage.setItem("kel_dark_mode", String(val));
  };

  // Redirect user to login screen if not authenticated
  if (!currentUser) {
    return (
      <LoginView 
        onLoginSuccess={handleLogin} 
        users={userAccounts} 
        onRegisterUser={handleAddUser}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col font-sans transition ${darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-gray-900"}`}>
      
      {/* Header Bar */}
      <header className={`px-4 py-3.5 border-b sticky top-0 z-40 backdrop-blur-md flex items-center justify-between ${
        darkMode ? "bg-slate-900/95 border-slate-800" : "bg-white/95 border-gray-150"
      }`} id="app-header">
        
        {/* Title Brand */}
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-emerald-600 text-white rounded-2xl shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight flex items-center">
              <span>Controle de Estoque</span>
              <span className="ml-1.5 text-xs text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-mono">kel</span>
            </h1>
            <p className="text-[10px] text-gray-400 font-medium">Gestão Alimentar Escolar Municipal</p>
          </div>
        </div>

        {/* Sync & Profile HUD */}
        <div className="flex items-center space-x-3" id="header-hud">
          {/* Quick sync HUD icon */}
          <button 
            onClick={handleTriggerManualSync}
            id="hud-sync-trigger"
            className={`p-2 rounded-xl transition hover:bg-slate-100 ${
              syncStatus.isOnline ? "text-emerald-600" : "text-amber-600"
            }`}
            title="Sincronizar Cloud agora"
          >
            <RefreshCw className={`w-4 h-4 ${!syncStatus.isOnline ? "animate-pulse" : ""}`} />
          </button>

          <div className="hidden md:flex items-center space-x-2 py-1 px-3 bg-slate-100/75 dark:bg-slate-800/50 rounded-2xl text-xs font-semibold">
            <Award className="w-3.5 h-3.5 text-emerald-600 mr-1" />
            <span className="truncate max-w-[100px]">{currentUser.name}</span>
            <span className="text-[10px] text-gray-400 bg-white/50 px-1 py-0.5 rounded">
              {currentUser.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            id="btn-logout"
            className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl transition active:scale-95"
            title="Desconectar do terminal"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main viewport Container container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-24" id="main-content-viewport">
        
        {/* Navigation tabs for Desktop screens */}
        <nav className={`mb-6 p-1.5 rounded-2xl flex items-center justify-between border md:flex ${
          activeTab === "leitor" ? "mb-1" : ""
        } ${
          darkMode ? "bg-slate-900 border-slate-800" : "bg-white border-gray-150"
        }`} id="desktop-tabs-layout">
          <div className="flex items-center space-x-1 w-full overflow-x-auto">
            <button
              onClick={() => setActiveTab("inicio")}
              id="tab-btn-inicio"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "inicio"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-500 hover:bg-slate-100"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Painel Geral</span>
            </button>

            <button
              onClick={() => setActiveTab("estoque")}
              id="tab-btn-estoque"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "estoque"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-500 hover:bg-slate-100"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Estoques</span>
            </button>

            <button
              onClick={() => setActiveTab("cardapio")}
              id="tab-btn-cardapio"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "cardapio"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-500 hover:bg-slate-100"
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Cardápio escolar</span>
            </button>

            <button
              onClick={() => setActiveTab("leitor")}
              id="tab-btn-leitor"
              className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                activeTab === "leitor"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-500 hover:bg-slate-100"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Leitor de Barras</span>
            </button>

            {currentUser?.role === 'Administrador' && (
              <button
                onClick={() => setActiveTab("configuracoes")}
                id="tab-btn-configuracoes"
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === "configuracoes"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-500 hover:bg-slate-100"
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Auditoria & Configs</span>
              </button>
            )}

            {currentUser?.role === 'Administrador' && (
              <button
                onClick={() => setActiveTab("usuarios")}
                id="tab-btn-usuarios"
                className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeTab === "usuarios"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "text-gray-500 hover:bg-slate-100"
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Usuários</span>
              </button>
            )}
          </div>
        </nav>

        {/* RENDERING VIEWS */}
        <div id="active-tab-panel">
          {activeTab === "inicio" && (
            <DashboardView
              products={products}
              menus={menus}
              transactions={transactions}
              sync={syncStatus}
              currentUser={currentUser}
              onTriggerSync={handleTriggerManualSync}
              onNavigate={(tab) => setActiveTab(tab)}
              onQuickServe={handleServeMenu}
            />
          )}

          {activeTab === "estoque" && (
            <InventoryView
              products={products}
              currentUser={currentUser}
              transactions={transactions}
              menus={menus}
              onAddProduct={handleAddProduct}
              onUpdateQuantity={handleUpdateProductQuantity}
              onDeleteProduct={handleDeleteProduct}
            />
          )}

          {activeTab === "cardapio" && (
            <MenuView
              menus={menus}
              products={products}
              currentUser={currentUser}
              onAddMenu={handleAddMenu}
              onServeMenu={handleServeMenu}
              onDeleteMenu={handleDeleteMenu}
            />
          )}

          {activeTab === "leitor" && (
            <ScannerView
              products={products}
              onAddProductWithBarcode={handleAddProductWithBarcodeRedirect}
              onUpdateQuantity={handleUpdateProductQuantity}
            />
          )}

          {activeTab === "configuracoes" && currentUser?.role === 'Administrador' && (
            <AuditView
              logs={logs}
              transactions={transactions}
              products={products}
              currentUser={currentUser}
              darkMode={darkMode}
              onSetDarkMode={toggleDarkModeStyle}
              onClearLogs={() => setLogs([])}
              onUpdatePassword={(newPass) => {
                writeAuditLog(
                  currentUser.username,
                  currentUser.role,
                  "Alt. Senha",
                  "Senha/PIN administrador atualizado localmente neste dispositivo."
                );
              }}
            />
          )}

          {activeTab === "usuarios" && currentUser?.role === 'Administrador' && (
            <UserManagementView
              users={userAccounts}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onDeleteUser={handleDeleteUser}
            />
          )}
        </div>

      </main>

      {/* Floating Bottom Navigator for Android/iOS responsive screens */}
      <nav className={`fixed bottom-0 inset-x-0 border-t z-55 flex items-center justify-around py-2.5 px-2 backdrop-blur-md md:hidden ${
        darkMode ? "bg-slate-900 border-slate-800 text-slate-100" : "bg-white border-slate-150 text-gray-700"
      }`} id="mobile-tabs-bar">
        
        <button
          onClick={() => setActiveTab("inicio")}
          id="m-tab-inicio"
          className={`flex flex-col items-center space-y-1 ${
            activeTab === "inicio" ? "text-emerald-600 font-bold" : "text-gray-400"
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[9px]">Inicio</span>
        </button>

        <button
          onClick={() => setActiveTab("estoque")}
          id="m-tab-estoque"
          className={`flex flex-col items-center space-y-1 ${
            activeTab === "estoque" ? "text-emerald-600 font-bold" : "text-gray-400"
          }`}
        >
          <Package className="w-5 h-5" />
          <span className="text-[9px]">Estoque</span>
        </button>

        <button
          onClick={() => setActiveTab("cardapio")}
          id="m-tab-cardapio"
          className={`flex flex-col items-center space-y-1 ${
            activeTab === "cardapio" ? "text-emerald-600 font-bold" : "text-gray-400"
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span className="text-[9px]">Cardápio</span>
        </button>

        <button
          onClick={() => setActiveTab("leitor")}
          id="m-tab-leitor"
          className={`flex flex-col items-center space-y-1 ${
            activeTab === "leitor" ? "text-emerald-600 font-bold" : "text-gray-400"
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="text-[9px]">Leitor</span>
        </button>

        {currentUser?.role === 'Administrador' && (
          <button
            onClick={() => setActiveTab("configuracoes")}
            id="m-tab-configs"
            className={`flex flex-col items-center space-y-1 ${
              activeTab === "configuracoes" ? "text-emerald-600 font-bold" : "text-gray-400"
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[9px]">Painel</span>
          </button>
        )}

        {currentUser?.role === 'Administrador' && (
          <button
            onClick={() => setActiveTab("usuarios")}
            id="m-tab-usuarios"
            className={`flex flex-col items-center space-y-1 ${
              activeTab === "usuarios" ? "text-emerald-600 font-bold" : "text-gray-400"
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px]">Usuários</span>
          </button>
        )}

      </nav>

    </div>
  );
}
