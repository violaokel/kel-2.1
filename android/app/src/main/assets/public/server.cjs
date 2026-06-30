var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path = __toESM(require("path"), 1);
var import_fs = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
var import_supabase_js = require("@supabase/supabase-js");
var import_config = require("dotenv/config");
var SUPABASE_URL = process.env.SUPABASE_URL;
var SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
var isSupabaseConfigured = !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
var supabase = isSupabaseConfigured ? (0, import_supabase_js.createClient)(SUPABASE_URL, SUPABASE_ANON_KEY) : null;
var DB_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DB_DIR, "db.json");
var INITIAL_PRODUCTS = [
  {
    id: "prod-1",
    name: "Arroz Integral",
    barcode: "7891234567890",
    category: "Gr\xE3os e Cereais",
    quantity: 85,
    minQuantity: 20,
    unit: "kg",
    expiryDate: "2026-12-15",
    supplier: "Arroz do Sul S/A",
    location: "Despensa Secos A",
    wastage: 1.2
  },
  {
    id: "prod-2",
    name: "Feij\xE3o Carioca",
    barcode: "7891234567891",
    category: "Gr\xE3os e Cereais",
    quantity: 45,
    minQuantity: 15,
    unit: "kg",
    expiryDate: "2026-10-30",
    supplier: "Feij\xE3o Verde Alimentos",
    location: "Despensa Secos A",
    wastage: 0.5
  },
  {
    id: "prod-3",
    name: "Peito de Frango",
    barcode: "7891234567892",
    category: "Carnes e Frios",
    quantity: 32.5,
    minQuantity: 10,
    unit: "kg",
    expiryDate: "2026-07-20",
    supplier: "Frigor\xEDfico Kel Distribuidora",
    location: "Freezer Vertical 01",
    wastage: 0.8
  },
  {
    id: "prod-4",
    name: "\xD3leo de Soja",
    barcode: "7891234567893",
    category: "\xD3leos e Gorduras",
    quantity: 18,
    minQuantity: 5,
    unit: "litros",
    expiryDate: "2026-09-12",
    supplier: "Distribuidora Vale Verde",
    location: "Arm\xE1rio de Temperos",
    wastage: 0.1
  },
  {
    id: "prod-5",
    name: "Cebola",
    barcode: "7891234567894",
    category: "Hortifr\xFAti",
    quantity: 12,
    minQuantity: 5,
    unit: "kg",
    expiryDate: "2026-06-18",
    supplier: "Horta Local e Cooperativa",
    location: "Caixa Pl\xE1stica Geladeira 02",
    wastage: 2.1
  },
  {
    id: "prod-6",
    name: "Alho Triturado",
    barcode: "7891234567895",
    category: "Hortifr\xFAti",
    quantity: 4.5,
    minQuantity: 2,
    unit: "kg",
    expiryDate: "2026-08-01",
    supplier: "Horta Local e Cooperativa",
    location: "Arm\xE1rio de Temperos",
    wastage: 0.05
  },
  {
    id: "prod-7",
    name: "Macarr\xE3o Parafuso",
    barcode: "7891234567896",
    category: "Gr\xE3os e Cereais",
    quantity: 60,
    minQuantity: 15,
    unit: "kg",
    expiryDate: "2026-11-20",
    supplier: "Arroz do Sul S/A",
    location: "Despensa Secos B",
    wastage: 0.3
  },
  {
    id: "prod-8",
    name: "Molho de Tomate",
    barcode: "7891234567897",
    category: "Enlatados",
    quantity: 24,
    minQuantity: 8,
    unit: "unidades",
    expiryDate: "2027-02-10",
    supplier: "Distribuidora Vale Verde",
    location: "Despensa Secos B",
    wastage: 0.1
  },
  {
    id: "prod-9",
    name: "Leite Integral UHT",
    barcode: "7891234567898",
    category: "Latic\xEDnios",
    quantity: 40,
    minQuantity: 12,
    unit: "litros",
    expiryDate: "2026-06-10",
    // Vencendo logo
    supplier: "Cooperativa de Latic\xEDnios Kel",
    location: "Geladeira Industrial 01",
    wastage: 0.2
  },
  {
    id: "prod-10",
    name: "Ma\xE7\xE3 Gala",
    barcode: "7891234567899",
    category: "Hortifr\xFAti",
    quantity: 2.5,
    // Estoque Baixo!
    minQuantity: 8,
    unit: "kg",
    expiryDate: "2026-06-14",
    supplier: "Horta Local e Cooperativa",
    location: "Caixa Pl\xE1stica Geladeira 02",
    wastage: 0.4
  }
];
var INITIAL_MENUS = [
  {
    id: "menu-1",
    name: "Arroz, Feij\xE3o e Peito de Frango Grelhado",
    mealType: "almoco",
    date: "2026-06-06",
    // Today
    ingredients: [
      { productId: "prod-1", name: "Arroz Integral", quantityPerPortion: 0.08, unit: "kg" },
      { productId: "prod-2", name: "Feij\xE3o Carioca", quantityPerPortion: 0.05, unit: "kg" },
      { productId: "prod-3", name: "Peito de Frango", quantityPerPortion: 0.1, unit: "kg" },
      { productId: "prod-4", name: "\xD3leo de Soja", quantityPerPortion: 5e-3, unit: "litros" },
      { productId: "prod-5", name: "Cebola", quantityPerPortion: 0.01, unit: "kg" },
      { productId: "prod-6", name: "Alho Triturado", quantityPerPortion: 2e-3, unit: "kg" }
    ],
    portionsCount: 150,
    served: false
  },
  {
    id: "menu-2",
    name: "Macarronada de Frango ao Molho",
    mealType: "almoco",
    date: "2026-06-07",
    // Tomorrow
    ingredients: [
      { productId: "prod-7", name: "Macarr\xE3o Parafuso", quantityPerPortion: 0.09, unit: "kg" },
      { productId: "prod-3", name: "Peito de Frango", quantityPerPortion: 0.08, unit: "kg" },
      { productId: "prod-8", name: "Molho de Tomate", quantityPerPortion: 0.15, unit: "unidades" },
      { productId: "prod-4", name: "\xD3leo de Soja", quantityPerPortion: 5e-3, unit: "litros" },
      { productId: "prod-5", name: "Cebola", quantityPerPortion: 0.01, unit: "kg" },
      { productId: "prod-6", name: "Alho Triturado", quantityPerPortion: 2e-3, unit: "kg" }
    ],
    portionsCount: 120,
    served: false
  },
  {
    id: "menu-3",
    name: "Copo de Leite Integral e Fruta",
    mealType: "matutino",
    date: "2026-06-06",
    // Today morning
    ingredients: [
      { productId: "prod-9", name: "Leite Integral UHT", quantityPerPortion: 0.2, unit: "litros" },
      { productId: "prod-10", name: "Ma\xE7\xE3 Gala", quantityPerPortion: 0.12, unit: "kg" }
    ],
    portionsCount: 80,
    served: true
    // Already decremented!
  }
];
var INITIAL_TRANSACTIONS = [
  {
    id: "tx-1",
    productId: "prod-9",
    productName: "Leite Integral UHT",
    type: "entrada",
    quantity: 50,
    unit: "litros",
    date: "2026-06-05T09:30:00Z",
    user: "kel_admin",
    notes: "Entrada via Fornecedor - Lote de Latic\xEDnios"
  },
  {
    id: "tx-2",
    productId: "prod-9",
    productName: "Leite Integral UHT",
    type: "saida",
    quantity: 16,
    unit: "litros",
    date: "2026-06-06T07:15:00Z",
    user: "maria_merenda",
    notes: "Consumo autom\xE1tico - Copo de Leite Integral e Fruta (80 por\xE7\xF5es)"
  },
  {
    id: "tx-3",
    productId: "prod-10",
    productName: "Ma\xE7\xE3 Gala",
    type: "saida",
    quantity: 9.6,
    unit: "kg",
    date: "2026-06-06T07:15:00Z",
    user: "maria_merenda",
    notes: "Consumo autom\xE1tico - Copo de Leite Integral e Fruta (80 por\xE7\xF5es)"
  },
  {
    id: "tx-4",
    productId: "prod-10",
    productName: "Ma\xE7\xE3 Gala",
    type: "desperdicio",
    quantity: 0.4,
    unit: "kg",
    date: "2026-06-05T14:40:00Z",
    user: "kel_admin",
    notes: "Produto machucado e impr\xF3prio para consumo na triagem"
  }
];
var INITIAL_LOGS = [
  {
    id: "log-1",
    timestamp: "2026-06-05T09:30:00.000Z",
    user: "kel_admin",
    role: "Administrador",
    action: "Entrada de Estoque",
    details: "Registrou entrada de 50.0 litros de Leite Integral UHT"
  },
  {
    id: "log-2",
    timestamp: "2026-06-05T14:42:00.000Z",
    user: "kel_admin",
    role: "Administrador",
    action: "Desperd\xEDcio",
    details: "Registrou desperd\xEDcio de 0.4 kg de Ma\xE7\xE3 Gala"
  },
  {
    id: "log-3",
    timestamp: "2026-06-06T07:15:00.000Z",
    user: "maria_merenda",
    role: "Merendeira",
    action: "Consumo de Card\xE1pio",
    details: "Consumo autom\xE1tico do card\xE1pio 'Copo de Leite Integral e Fruta'"
  }
];
var DEFAULT_USER_ACCOUNTS = [
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
    name: "Jo\xE3o Almoxarife"
  },
  {
    id: "usr-nutri",
    username: "ana_nutricionista",
    password: "123456",
    role: "Nutricionista",
    name: "Ana Nutricionista"
  }
];
function loadDb() {
  try {
    if (!import_fs.default.existsSync(DB_DIR)) {
      import_fs.default.mkdirSync(DB_DIR, { recursive: true });
    }
    if (!import_fs.default.existsSync(DB_FILE)) {
      const initialDb = {
        products: INITIAL_PRODUCTS,
        schoolMenus: INITIAL_MENUS,
        transactions: INITIAL_TRANSACTIONS,
        logs: INITIAL_LOGS,
        userAccounts: DEFAULT_USER_ACCOUNTS
      };
      import_fs.default.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), "utf-8");
      return initialDb;
    }
    const data = import_fs.default.readFileSync(DB_FILE, "utf-8");
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
      userAccounts: DEFAULT_USER_ACCOUNTS
    };
  }
}
function saveDb(data) {
  try {
    if (!import_fs.default.existsSync(DB_DIR)) {
      import_fs.default.mkdirSync(DB_DIR, { recursive: true });
    }
    import_fs.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Erro ao salvar o banco de dados:", err);
  }
}
async function loadDbAsync() {
  if (!supabase) {
    return loadDb();
  }
  try {
    const { data, error } = await supabase.from("kel_app_store").select("*");
    if (error) {
      if (error.message && error.message.includes("fetch failed")) {
        console.log("[Supabase] Nota: Conex\xE3o offline ou projeto indispon\xEDvel. Operando localmente.");
      } else {
        console.log("[Supabase] Nota: Tabela 'kel_app_store' n\xE3o localizada ou n\xE3o criada no Supabase. Operando localmente.", error.message);
      }
      return loadDb();
    }
    if (!data || data.length === 0) {
      console.log("[Supabase] Tabela local com dados vazia no Supabase. Iniciando semeadura de dados...");
      const localDb = loadDb();
      await saveDbAsync(localDb);
      return localDb;
    }
    const db = {
      products: [],
      schoolMenus: [],
      transactions: [],
      logs: [],
      userAccounts: []
    };
    data.forEach((row) => {
      if (row.key === "products" && Array.isArray(row.val)) db.products = row.val;
      if (row.key === "school_menus" && Array.isArray(row.val)) db.schoolMenus = row.val;
      if (row.key === "transactions" && Array.isArray(row.val)) db.transactions = row.val;
      if (row.key === "logs" && Array.isArray(row.val)) db.logs = row.val;
      if (row.key === "user_accounts" && Array.isArray(row.val)) db.userAccounts = row.val;
    });
    const fallbackDb = loadDb();
    if (db.products.length === 0 && fallbackDb.products.length > 0) db.products = fallbackDb.products;
    if (db.schoolMenus.length === 0 && fallbackDb.schoolMenus.length > 0) db.schoolMenus = fallbackDb.schoolMenus;
    if (db.transactions.length === 0 && fallbackDb.transactions.length > 0) db.transactions = fallbackDb.transactions;
    if (db.logs.length === 0 && fallbackDb.logs.length > 0) db.logs = fallbackDb.logs;
    if ((!db.userAccounts || db.userAccounts.length === 0) && fallbackDb.userAccounts.length > 0) db.userAccounts = fallbackDb.userAccounts;
    saveDb(db);
    return db;
  } catch (err) {
    console.log("[Supabase] Nota: Erro ao conectar ao Supabase (operando em modo offline local).");
    return loadDb();
  }
}
async function saveDbAsync(data) {
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
    const promises = payloads.map(
      (payload) => supabase.from("kel_app_store").upsert(payload, { onConflict: "key" })
    );
    const results = await Promise.all(promises);
    const errors = results.filter((r) => r.error);
    if (errors.length > 0) {
      console.log(`[Supabase] Grava\xE7\xE3o local realizada. Sincroniza\xE7\xE3o em nuvem pendente.`);
    } else {
      console.log("[Supabase] Banco de dados totalmente sincronizado na nuvem com sucesso!");
    }
  } catch (err) {
    console.log("[Supabase] Nota: Conex\xE3o offline ou sem resposta do banco. Dados gravados localmente.");
  }
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
  });
  app.get("/api/health", async (req, res) => {
    if (!supabase) {
      res.json({
        status: "ok",
        message: "Servidor de Sincroniza\xE7\xE3o Kel Online",
        supabase: {
          configured: false,
          connected: false,
          status: "Modo Local Offline",
          table_active: false,
          instructions: "O Supabase n\xE3o est\xE1 configurado. O sistema est\xE1 salvando e operando localmente com total seguran\xE7a."
        }
      });
      return;
    }
    let supabaseStatus = "Sincronizado e Ativo";
    let checkExplanation = "Tudo funcionando perfeitamente.";
    let tableExists = true;
    try {
      const { error } = await supabase.from("kel_app_store").select("key").limit(1);
      if (error) {
        tableExists = false;
        supabaseStatus = "Instala\xE7\xE3o SQL Necess\xE1ria";
        checkExplanation = `A conex\xE3o com o Supabase foi bem-sucedida, mas a tabela 'kel_app_store' ainda n\xE3o existe no seu projeto. Por favor, execute a seguinte consulta SQL no painel SQL Editor do seu Supabase:

CREATE TABLE kel_app_store (
  key text PRIMARY KEY,
  val jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);`;
      }
    } catch (err) {
      tableExists = false;
      supabaseStatus = "Erro de Conex\xE3o";
      checkExplanation = `Erro de rede ou chaves inv\xE1lidas: ${err.message || err}`;
    }
    res.json({
      status: "ok",
      message: "Servidor de Sincroniza\xE7\xE3o Kel Online",
      supabase: {
        configured: true,
        connected: true,
        status: supabaseStatus,
        table_active: tableExists,
        instructions: checkExplanation
      }
    });
  });
  app.get("/api/data", async (req, res) => {
    const db = await loadDbAsync();
    res.json(db);
  });
  app.post("/api/sync", async (req, res) => {
    const { products, schoolMenus, transactions, logs, userAccounts } = req.body;
    const db = await loadDbAsync();
    if (Array.isArray(products)) {
      const merged = [...db.products];
      products.forEach((incoming) => {
        const index = merged.findIndex((p) => p.id === incoming.id);
        if (index > -1) {
          merged[index] = { ...merged[index], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      db.products = merged;
    }
    if (Array.isArray(schoolMenus)) {
      const merged = [...db.schoolMenus];
      schoolMenus.forEach((incoming) => {
        const index = merged.findIndex((m) => m.id === incoming.id);
        if (index > -1) {
          merged[index] = { ...merged[index], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      db.schoolMenus = merged;
    }
    if (Array.isArray(transactions)) {
      const merged = [...db.transactions];
      transactions.forEach((incoming) => {
        const index = merged.findIndex((t) => t.id === incoming.id);
        if (index > -1) {
          merged[index] = { ...merged[index], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      db.transactions = merged;
    }
    if (Array.isArray(logs)) {
      const merged = [...db.logs];
      logs.forEach((incoming) => {
        const index = merged.findIndex((l) => l.id === incoming.id);
        if (index > -1) {
          merged[index] = { ...merged[index], ...incoming };
        } else {
          merged.push(incoming);
        }
      });
      db.logs = merged;
    }
    if (Array.isArray(userAccounts)) {
      const merged = [...db.userAccounts];
      userAccounts.forEach((incoming) => {
        const index = merged.findIndex(
          (u) => u.id === incoming.id || incoming.username && u.username.toLowerCase() === incoming.username.toLowerCase()
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
    res.json({ success: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() });
  });
  app.post("/api/register", async (req, res) => {
    try {
      const { name, username, password, role } = req.body;
      if (!name || !username || !password || !role) {
        return res.status(400).json({ error: "Preencha todos os campos obrigat\xF3rios." });
      }
      const db = await loadDbAsync();
      const cleanUser = username.trim().toLowerCase();
      const duplicate = db.userAccounts.find((u) => u.username.toLowerCase() === cleanUser);
      if (duplicate || cleanUser === "violaokel@gmail.com") {
        return res.status(400).json({ error: "Este e-mail ou nome de usu\xE1rio j\xE1 est\xE1 associado a outra conta." });
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
    } catch (err) {
      res.status(500).json({ error: "Erro interno ao cadastrar: " + (err.message || err) });
    }
  });
  app.post("/api/logs", async (req, res) => {
    const log = req.body;
    const db = await loadDbAsync();
    db.logs.unshift({
      id: "log-" + Date.now(),
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
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
    return new import_genai.GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  };
  const fallbackSuggestion = (product, transactions) => {
    const minQuantity = product.minQuantity || 10;
    const currentQuantity = product.quantity || 0;
    const targetTxs = transactions.filter((t) => t.productId === product.id);
    const saidas = targetTxs.filter((t) => t.type === "saida" || t.type === "desperdicio");
    const totalSaida = saidas.reduce((acc, t) => acc + t.quantity, 0);
    const estimatedDaysOfStockLeft = totalSaida > 0 ? currentQuantity / (totalSaida / 7) * 7 : 14;
    const suggestedQuantity = Math.max(0, minQuantity * 2 - currentQuantity);
    return {
      suggestedQuantity: Math.round(suggestedQuantity * 10) / 10,
      justification: `[C\xE1lculo de Algoritmo de Conting\xEAncia] Com base no estoque cr\xEDtico m\xEDnimo de ${minQuantity} ${product.unit} e no saldo atual de ${currentQuantity} ${product.unit}, recomendamos a reposi\xE7\xE3o de ${Math.round(suggestedQuantity * 10) / 10} ${product.unit} para manter o n\xEDvel ideal de seguran\xE7a. (Defina a GEMINI_API_KEY no painel de Ajustes para uma an\xE1lise completa inteligente baseada em IA).`,
      safetyMargin: 20,
      riskScore: currentQuantity <= minQuantity ? 8 : 3,
      urgencyLevel: currentQuantity <= minQuantity ? "Alta" : "Baixa",
      estimatedDaysOfStockLeft: Math.round(estimatedDaysOfStockLeft || 10)
    };
  };
  app.post("/api/gemini/suggest-purchase", async (req, res) => {
    const { product, transactions, menus } = req.body;
    if (!product) {
      return res.status(400).json({ error: "Produto inv\xE1lido para an\xE1lise." });
    }
    const ai = getGeminiClient();
    if (!ai) {
      return res.json(fallbackSuggestion(product, transactions || []));
    }
    try {
      const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
      const model = "gemini-3.5-flash";
      const prompt = `
        Voc\xEA \xE9 um assistente de Intelig\xEAncia Artificial para alimenta\xE7\xE3o e log\xEDstica de merenda escolar.
        Seu objetivo \xE9 analisar os dados de um item de estoque, seu hist\xF3rico recente de transa\xE7\xF5es de consumo e sua data de validade para sugerir a quantidade ideal de compra para reposi\xE7\xE3o.

        Dados do Produto:
        - Nome: ${product.name}
        - Categoria: ${product.category}
        - Quantidade Atual no Estoque: ${product.quantity} ${product.unit}
        - Estoque M\xEDnimo Recomendado (Estoque Cr\xEDtico): ${product.minQuantity} ${product.unit}
        - Data de Validade: ${product.expiryDate} (Data de Hoje \xE9: ${today})
        - Desperd\xEDcio Acumulado: ${product.wastage} ${product.unit}
        
        Hist\xF3rico Recente de Transa\xE7\xF5es (Consumo, Entradas, Desperd\xEDcios):
        ${JSON.stringify(transactions || [])}

        Calend\xE1rio de Card\xE1pios Agendados contendo este ingrediente:
        ${JSON.stringify(menus || [])}

        Por favor, analise minuciosamente:
        1. Ritmo de consumo quinzenal/semanal baseado nas sa\xEDdas reais.
        2. Proximidade da Data de Validade (${product.expiryDate}). Se estiver muito perto de vencer (menos de 15 dias), evite sugerir compras grandes que causar\xE3o desperd\xEDcio!
        3. Estoque abaixo do limite cr\xEDtico.
        4. O valor recomendado de reposi\xE7\xE3o deve ser realista e bem fundamentado para o setor log\xEDstico e financeiro escolar.

        Forne\xE7a uma resposta detalhada em Portugu\xEAs do Brasil estritamente estruturada sob o schema JSON.
      `;
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: import_genai.Type.OBJECT,
            properties: {
              suggestedQuantity: {
                type: import_genai.Type.NUMBER,
                description: "Quantidade ideal recomendada de compra para reposi\xE7\xE3o."
              },
              justification: {
                type: import_genai.Type.STRING,
                description: "Justificativa detalhada em portugu\xEAs com base nas caracter\xEDsticas, consumos e validades do item."
              },
              safetyMargin: {
                type: import_genai.Type.NUMBER,
                description: "Margem de seguran\xE7a recomendada em percentual (ex: 15 para 15%)."
              },
              riskScore: {
                type: import_genai.Type.INTEGER,
                description: "Escala de risco de 1 a 10 para falta ou desperd\xEDcio."
              },
              urgencyLevel: {
                type: import_genai.Type.STRING,
                description: "N\xEDvel: Baixa, M\xE9dia, Alta"
              },
              estimatedDaysOfStockLeft: {
                type: import_genai.Type.NUMBER,
                description: "Estimativa de quantos dias o estoque restante ir\xE1 durar."
              }
            },
            required: ["suggestedQuantity", "justification", "safetyMargin", "riskScore", "urgencyLevel", "estimatedDaysOfStockLeft"]
          }
        }
      });
      const textOutput = response.text?.trim() || "{}";
      const parsed = JSON.parse(textOutput);
      res.json(parsed);
    } catch (error) {
      console.error("Erro na API do Gemini:", error);
      res.json(fallbackSuggestion(product, transactions || []));
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SERVER] Controle de Estoque rodando em http//0.0.0.0:${PORT}`);
  });
}
startServer();
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
//# sourceMappingURL=server.cjs.map
