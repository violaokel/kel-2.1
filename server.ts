/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Initialize Supabase Client
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
const supabase = isSupabaseConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;


interface ServerDatabase {
  products: any[];
  schoolMenus: any[];
  transactions: any[];
  logs: any[];
  userAccounts: any[];
}

const DB_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_DIR, "db.json");

// Default initial seed data for schools
const INITIAL_PRODUCTS = [
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
    expiryDate: "2026-06-10", // Vencendo logo
    supplier: "Cooperativa de Laticínios Kel",
    location: "Geladeira Industrial 01",
    wastage: 0.2,
  },
  {
    id: "prod-10",
    name: "Maçã Gala",
    barcode: "7891234567899",
    category: "Hortifrúti",
    quantity: 2.5, // Estoque Baixo!
    minQuantity: 8.0,
    unit: "kg",
    expiryDate: "2026-06-14",
    supplier: "Horta Local e Cooperativa",
    location: "Caixa Plástica Geladeira 02",
    wastage: 0.4,
  },
];

const INITIAL_MENUS = [
  {
    id: "menu-1",
    name: "Arroz, Feijão e Peito de Frango Grelhado",
    mealType: "almoco",
    date: "2026-06-06", // Today
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
    date: "2026-06-07", // Tomorrow
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
    date: "2026-06-06", // Today morning
    ingredients: [
      { productId: "prod-9", name: "Leite Integral UHT", quantityPerPortion: 0.20, unit: "litros" },
      { productId: "prod-10", name: "Maçã Gala", quantityPerPortion: 0.12, unit: "kg" },
    ],
    portionsCount: 80,
    served: true, // Already decremented!
  },
];

const INITIAL_TRANSACTIONS = [
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

const INITIAL_LOGS = [
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

const DEFAULT_USER_ACCOUNTS = [
  {
    id: "usr-admin",
    username: "violaokel@gmail.com",
    password: "028089",
    role: "Administrador",
    name: "Kel Gestor"
  },
  {
    id: "usr-merenda",
    username: "maria_coordenadora",
    password: "123456",
    role: "Coordenadora da Merenda Escolar",
    name: "Maria Coordenadora"
  },
  {
    id: "usr-auxiliar",
    username: "joao_almoxarife",
    password: "123456",
    role: "Chefe de Almoxarifado",
    name: "João Almoxarife"
  },
  {
    id: "usr-nutri",
    username: "ana_nutricionista",
    password: "123456",
    role: "Nutricionista",
    name: "Ana Nutricionista"
  }
];

// Read database file and parse
function loadDb(): ServerDatabase {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialDb: ServerDatabase = {
        products: INITIAL_PRODUCTS,
        schoolMenus: INITIAL_MENUS,
        transactions: INITIAL_TRANSACTIONS,
        logs: INITIAL_LOGS,
        userAccounts: DEFAULT_USER_ACCOUNTS,
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const data = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(data);
    if (!parsed.userAccounts || parsed.userAccounts.length === 0) {
      parsed.userAccounts = DEFAULT_USER_ACCOUNTS;
    }
    return parsed;
  } catch (err) {
    console.error("Erro ao carregar o banco de dados:", err);
    return {
      products: INITIAL_PRODUCTS,
      schoolMenus: INITIAL_MENUS,
      transactions: INITIAL_TRANSACTIONS,
      logs: INITIAL_LOGS,
      userAccounts: DEFAULT_USER_ACCOUNTS,
    };
  }
}

// Write database files
function saveDb(data: ServerDatabase) {
  try {
    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar o banco de dados:", err);
  }
}

// Supabase Async loading of the database state
async function loadDbAsync(): Promise<ServerDatabase> {
  if (!supabase) {
    return loadDb();
  }
  try {
    const { data, error } = await supabase
      .from("kel_app_store")
      .select("*");

    if (error) {
      if (error.message && error.message.includes("fetch failed")) {
        console.log("[Supabase] Nota: Conexão offline ou projeto indisponível. Operando localmente.");
      } else {
        console.log("[Supabase] Nota: Tabela 'kel_app_store' não localizada ou não criada no Supabase. Operando localmente.", error.message);
      }
      return loadDb();
    }

    if (!data || data.length === 0) {
      // Seed Supabase with local dataset if table is completely empty
      console.log("[Supabase] Tabela local com dados vazia no Supabase. Iniciando semeadura de dados...");
      const localDb = loadDb();
      await saveDbAsync(localDb);
      return localDb;
    }

    const db: ServerDatabase = {
      products: [],
      schoolMenus: [],
      transactions: [],
      logs: [],
      userAccounts: []
    };

    data.forEach((row: any) => {
      if (row.key === "products" && Array.isArray(row.val)) db.products = row.val;
      if (row.key === "school_menus" && Array.isArray(row.val)) db.schoolMenus = row.val;
      if (row.key === "transactions" && Array.isArray(row.val)) db.transactions = row.val;
      if (row.key === "logs" && Array.isArray(row.val)) db.logs = row.val;
      if (row.key === "user_accounts" && Array.isArray(row.val)) db.userAccounts = row.val;
    });

    // Merge check: if key rows are missing or unseeded, populate from local
    const fallbackDb = loadDb();
    if (db.products.length === 0 && fallbackDb.products.length > 0) db.products = fallbackDb.products;
    if (db.schoolMenus.length === 0 && fallbackDb.schoolMenus.length > 0) db.schoolMenus = fallbackDb.schoolMenus;
    if (db.transactions.length === 0 && fallbackDb.transactions.length > 0) db.transactions = fallbackDb.transactions;
    if (db.logs.length === 0 && fallbackDb.logs.length > 0) db.logs = fallbackDb.logs;
    if ((!db.userAccounts || db.userAccounts.length === 0) && fallbackDb.userAccounts.length > 0) db.userAccounts = fallbackDb.userAccounts;

    // Sync back to local backup file too
    saveDb(db);
    return db;
  } catch (err: any) {
    console.log("[Supabase] Nota: Erro ao conectar ao Supabase (operando em modo offline local).");
    return loadDb();
  }
}

// Supabase Async upsert payload database synchronizer (atomic rows upsert)
async function saveDbAsync(data: ServerDatabase) {
  // Always commit local backup for reliability
  saveDb(data);

  if (!supabase) {
    return;
  }

  try {
    const payloads = [
      { key: "products", val: data.products },
      { key: "school_menus", val: data.schoolMenus },
      { key: "transactions", val: data.transactions },
      { key: "logs", val: data.logs },
      { key: "user_accounts", val: data.userAccounts }
    ];

    const promises = payloads.map(payload => 
      supabase
        .from("kel_app_store")
        .upsert(payload, { onConflict: "key" })
    );

    const results = await Promise.all(promises);
    const errors = results.filter(r => r.error);

    if (errors.length > 0) {
      console.log(`[Supabase] Gravação local realizada. Sincronização em nuvem pendente.`);
    } else {
      console.log("[Supabase] Banco de dados totalmente sincronizado na nuvem com sucesso!");
    }
  } catch (err) {
    console.log("[Supabase] Nota: Conexão offline ou sem resposta do banco. Dados gravados localmente.");
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log API requests
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });

  // Endpoints: Health Check
  app.get("/api/health", async (req, res) => {
    if (!supabase) {
      res.json({
        status: "ok",
        message: "Servidor de Sincronização Kel Online",
        supabase: {
          configured: false,
          connected: false,
          status: "Modo Local Offline",
          table_active: false,
          instructions: "O Supabase não está configurado. O sistema está salvando e operando localmente com total segurança."
        }
      });
      return;
    }

    let supabaseStatus = "Sincronizado e Ativo";
    let checkExplanation = "Tudo funcionando perfeitamente.";
    let tableExists = true;

    try {
      const { error } = await supabase
        .from("kel_app_store")
        .select("key")
        .limit(1);

      if (error) {
        tableExists = false;
        supabaseStatus = "Instalação SQL Necessária";
        checkExplanation = `A conexão com o Supabase foi bem-sucedida, mas a tabela 'kel_app_store' ainda não existe no seu projeto. Por favor, execute a seguinte consulta SQL no painel SQL Editor do seu Supabase:\n\nCREATE TABLE kel_app_store (\n  key text PRIMARY KEY,\n  val jsonb NOT NULL,\n  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL\n);`;
      }
    } catch (err: any) {
      tableExists = false;
      supabaseStatus = "Erro de Conexão";
      checkExplanation = `Erro de rede ou chaves inválidas: ${err.message || err}`;
    }

    res.json({
      status: "ok",
      message: "Servidor de Sincronização Kel Online",
      supabase: {
        configured: true,
        connected: true,
        status: supabaseStatus,
        table_active: tableExists,
        instructions: checkExplanation
      }
    });
  });

  // Get complete database state (sync pull)
  app.get("/api/data", async (req, res) => {
    const db = await loadDbAsync();
    res.json(db);
  });

  // Save complete synchronized state (sync push with smart non-destructive merging)
  app.post("/api/sync", async (req, res) => {
    const { products, schoolMenus, transactions, logs, userAccounts } = req.body;
    
    const db = await loadDbAsync();
    
    // Merge Products by ID
    if (Array.isArray(products)) {
      const merged = [...db.products];
      products.forEach((incoming: any) => {
        const index = merged.findIndex((p: any) => p.id === incoming.id);
        if (index > -1) {
          merged[index] = { ...merged[index], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      db.products = merged;
    }

    // Merge School Menus by ID
    if (Array.isArray(schoolMenus)) {
      const merged = [...db.schoolMenus];
      schoolMenus.forEach((incoming: any) => {
        const index = merged.findIndex((m: any) => m.id === incoming.id);
        if (index > -1) {
          merged[index] = { ...merged[index], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      db.schoolMenus = merged;
    }

    // Merge Transactions by ID
    if (Array.isArray(transactions)) {
      const merged = [...db.transactions];
      transactions.forEach((incoming: any) => {
        const index = merged.findIndex((t: any) => t.id === incoming.id);
        if (index > -1) {
          merged[index] = { ...merged[index], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      db.transactions = merged;
    }

    // Merge Logs by ID
    if (Array.isArray(logs)) {
      const merged = [...db.logs];
      logs.forEach((incoming: any) => {
        const index = merged.findIndex((l: any) => l.id === incoming.id);
        if (index > -1) {
          merged[index] = { ...merged[index], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      db.logs = merged;
    }

    // Merge User Accounts by ID and Username to prevent landing-page register overwrites
    if (Array.isArray(userAccounts)) {
      const merged = [...db.userAccounts];
      userAccounts.forEach((incoming: any) => {
        const index = merged.findIndex((u: any) => 
          u.id === incoming.id || 
          (incoming.username && u.username.toLowerCase() === incoming.username.toLowerCase())
        );
        if (index > -1) {
          merged[index] = { ...merged[index], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      db.userAccounts = merged;
    }

    await saveDbAsync(db);
    res.json({ success: true, timestamp: new Date().toISOString() });
  });

  // Dedicated single user self-registration API (prevents client state conflicts)
  app.post("/api/register", async (req, res) => {
    try {
      const { name, username, password, role } = req.body;
      if (!name || !username || !password || !role) {
        return res.status(400).json({ error: "Preencha todos os campos obrigatórios." });
      }

      const db = await loadDbAsync();

      // Check duplicant
      const cleanUser = username.trim().toLowerCase();
      const duplicate = db.userAccounts.find((u: any) => u.username.toLowerCase() === cleanUser);
      if (duplicate || cleanUser === "violaokel@gmail.com") {
        return res.status(400).json({ error: "Este e-mail ou nome de usuário já está associado a outra conta." });
      }

      const freshUser = {
        id: "usr-" + Date.now(),
        name: name.trim(),
        username: cleanUser,
        password,
        role
      };

      db.userAccounts.push(freshUser);
      await saveDbAsync(db);

      res.json({ success: true, user: freshUser });
    } catch (err: any) {
      res.status(500).json({ error: "Erro interno ao cadastrar: " + (err.message || err) });
    }
  });

  // Log individual events from clients
  app.post("/api/logs", async (req, res) => {
    const log = req.body;
    const db = await loadDbAsync();
    db.logs.unshift({
      id: "log-" + Date.now(),
      timestamp: new Date().toISOString(),
      ...log
    });
    await saveDbAsync(db);
    res.json({ success: true });
  });

  const getGeminiClient = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      return null;
    }
    return new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  };

  const fallbackSuggestion = (product: any, transactions: any[]) => {
    const minQuantity = product.minQuantity || 10;
    const currentQuantity = product.quantity || 0;
    
    const targetTxs = transactions.filter(t => t.productId === product.id);
    const saidas = targetTxs.filter(t => t.type === 'saida' || t.type === 'desperdicio');
    const totalSaida = saidas.reduce((acc, t) => acc + t.quantity, 0);
    
    const estimatedDaysOfStockLeft = totalSaida > 0 ? (currentQuantity / (totalSaida / 7)) * 7 : 14;
    const suggestedQuantity = Math.max(0, (minQuantity * 2) - currentQuantity);
    
    return {
      suggestedQuantity: Math.round(suggestedQuantity * 10) / 10,
      justification: `[Cálculo de Algoritmo de Contingência] Com base no estoque crítico mínimo de ${minQuantity} ${product.unit} e no saldo atual de ${currentQuantity} ${product.unit}, recomendamos a reposição de ${Math.round(suggestedQuantity * 10) / 10} ${product.unit} para manter o nível ideal de segurança. (Defina a GEMINI_API_KEY no painel de Ajustes para uma análise completa inteligente baseada em IA).`,
      safetyMargin: 20,
      riskScore: currentQuantity <= minQuantity ? 8 : 3,
      urgencyLevel: currentQuantity <= minQuantity ? "Alta" : "Baixa",
      estimatedDaysOfStockLeft: Math.round(estimatedDaysOfStockLeft || 10)
    };
  };

  // Predict ideal purchase quantity with Gemini API
  app.post("/api/gemini/suggest-purchase", async (req, res) => {
    const { product, transactions, menus } = req.body;
    if (!product) {
      return res.status(400).json({ error: "Produto inválido para análise." });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.json(fallbackSuggestion(product, transactions || []));
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      const model = "gemini-3.5-flash";
      const prompt = `
        Você é um assistente de Inteligência Artificial para alimentação e logística de merenda escolar.
        Seu objetivo é analisar os dados de um item de estoque, seu histórico recente de transações de consumo e sua data de validade para sugerir a quantidade ideal de compra para reposição.

        Dados do Produto:
        - Nome: ${product.name}
        - Categoria: ${product.category}
        - Quantidade Atual no Estoque: ${product.quantity} ${product.unit}
        - Estoque Mínimo Recomendado (Estoque Crítico): ${product.minQuantity} ${product.unit}
        - Data de Validade: ${product.expiryDate} (Data de Hoje é: ${today})
        - Desperdício Acumulado: ${product.wastage} ${product.unit}
        
        Histórico Recente de Transações (Consumo, Entradas, Desperdícios):
        ${JSON.stringify(transactions || [])}

        Calendário de Cardápios Agendados contendo este ingrediente:
        ${JSON.stringify(menus || [])}

        Por favor, analise minuciosamente:
        1. Ritmo de consumo quinzenal/semanal baseado nas saídas reais.
        2. Proximidade da Data de Validade (${product.expiryDate}). Se estiver muito perto de vencer (menos de 15 dias), evite sugerir compras grandes que causarão desperdício!
        3. Estoque abaixo do limite crítico.
        4. O valor recomendado de reposição deve ser realista e bem fundamentado para o setor logístico e financeiro escolar.

        Forneça uma resposta detalhada em Português do Brasil estritamente estruturada sob o schema JSON.
      `;

      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestedQuantity: { 
                type: Type.NUMBER, 
                description: "Quantidade ideal recomendada de compra para reposição." 
              },
              justification: { 
                type: Type.STRING, 
                description: "Justificativa detalhada em português com base nas características, consumos e validades do item." 
              },
              safetyMargin: { 
                type: Type.NUMBER, 
                description: "Margem de segurança recomendada em percentual (ex: 15 para 15%)." 
              },
              riskScore: { 
                type: Type.INTEGER, 
                description: "Escala de risco de 1 a 10 para falta ou desperdício." 
              },
              urgencyLevel: { 
                type: Type.STRING, 
                description: "Nível: Baixa, Média, Alta" 
              },
              estimatedDaysOfStockLeft: { 
                type: Type.NUMBER, 
                description: "Estimativa de quantos dias o estoque restante irá durar." 
              }
            },
            required: ["suggestedQuantity", "justification", "safetyMargin", "riskScore", "urgencyLevel", "estimatedDaysOfStockLeft"]
          }
        }
      });

      const textOutput = response.text?.trim() || "{}";
      const parsed = JSON.parse(textOutput);
      res.json(parsed);
    } catch (error: any) {
      console.error("Erro na API do Gemini:", error);
      res.json(fallbackSuggestion(product, transactions || []));
    }
  });

  // Serve static files and handle Vite routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Controle de Estoque rodando em http//0.0.0.0:${PORT}`);
  });
}

startServer();
