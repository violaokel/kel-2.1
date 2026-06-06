import React, { useState } from "react";
import { UserProfile, UserAccount } from "../types";
import { 
  Shield, 
  Key, 
  Eye, 
  EyeOff, 
  User, 
  BookOpen, 
  UserPlus, 
  CheckCircle2, 
  ArrowRight,
  UserCheck
} from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: UserProfile) => void;
  users?: UserAccount[];
  onRegisterUser?: (usr: Omit<UserAccount, 'id'>) => void;
}

export default function LoginView({ onLoginSuccess, users = [], onRegisterUser }: LoginViewProps) {
  const [activeSubTab, setActiveSubTab] = useState<'login' | 'register'>('login');
  
  // Login States
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Register States
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<'Chefe de Almoxarifado' | 'Coordenadora da Merenda Escolar' | 'Nutricionista'>('Coordenadora da Merenda Escolar');
  const [regSuccessMsg, setRegSuccessMsg] = useState("");
  const [regErrorMsg, setRegErrorMsg] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    if (!username.trim() || !password) {
      setErrorMsg("Por favor, preencha todos os campos.");
      return;
    }

    if (password.length < 4) {
      setErrorMsg("A senha deve conter pelo menos 4 caracteres.");
      return;
    }

    setIsLoading(true);

    const normalizedEmail = username.trim().toLowerCase();

    // Try finding in our synced list of accounts to inspect their registered role dynamically
    const matchedUser = users.find(u => 
      u.username.toLowerCase() === normalizedEmail
    );

    // GUARDA DE SEGURANÇA: Se for violaokel@gmail.com ou o matchedUser for Administrador, verifique a senha master obrigatoriamente
    const isMasterAdmin = normalizedEmail === 'violaokel@gmail.com' || (matchedUser && matchedUser.role === 'Administrador');

    if (isMasterAdmin) {
      if (normalizedEmail !== 'violaokel@gmail.com' || password !== '028089') {
        setErrorMsg("Acesso negado.");
        setIsLoading(false);
        return;
      }
    }

    if (matchedUser) {
      // Compare passwords
      if (matchedUser.password && matchedUser.password !== password) {
        setErrorMsg("Acesso negado.");
        setIsLoading(false);
        return;
      }

      // Login Successful!
      setTimeout(() => {
        onLoginSuccess({
          username: matchedUser.username,
          role: matchedUser.role,
          name: matchedUser.name
        });
        setIsLoading(false);
      }, 600);
      return;
    }

    // Fallback comparison for default user profiles (in case state is not fully loaded yet)
    const defaults = [
      { username: "violaokel@gmail.com", role: "Administrador", name: "Kel Gestor", pass: "028089" },
      { username: "maria_coordenadora", role: "Coordenadora da Merenda Escolar", name: "Maria Coordenadora", pass: "123456" },
      { username: "joao_almoxarife", role: "Chefe de Almoxarifado", name: "João Almoxarife", pass: "123456" },
      { username: "ana_nutricionista", role: "Nutricionista", name: "Ana Nutricionista", pass: "123455" }
    ];

    const fallbackMatch = defaults.find(d => 
      d.username.toLowerCase() === normalizedEmail && 
      d.pass === password
    );

    if (fallbackMatch) {
      setTimeout(() => {
        onLoginSuccess({
          username: fallbackMatch.username,
          role: fallbackMatch.role as any,
          name: fallbackMatch.name
        });
        setIsLoading(false);
      }, 600);
      return;
    }

    // If no local match, present general reject message denied
    setErrorMsg("Acesso negado.");
    setIsLoading(false);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegErrorMsg("");
    setRegSuccessMsg("");

    if (!regName.trim() || !regUsername.trim() || !regPassword.trim()) {
      setRegErrorMsg("Preencha todos os campos obrigatórios.");
      return;
    }

    const normalizedRegUser = regUsername.trim().toLowerCase();

    // Prevent duplicates
    const duplicate = users.find(u => u.username.toLowerCase() === normalizedRegUser);
    if (duplicate || normalizedRegUser === 'violaokel@gmail.com') {
      setRegErrorMsg("Este e-mail ou nome de usuário já está em uso.");
      return;
    }

    if (regPassword.length < 4) {
      setRegErrorMsg("A senha deve conter no mínimo 4 dígitos.");
      return;
    }

    // Call upstream registration trigger
    if (onRegisterUser) {
      onRegisterUser({
        name: regName.trim(),
        username: normalizedRegUser,
        role: regRole,
        password: regPassword
      });
    }

    setRegSuccessMsg("Sua conta de colaborador foi criada com sucesso! Entre usando a guia Acessar.");
    
    // Reset inputs
    setRegName("");
    setRegUsername("");
    setRegPassword("");
    setRegRole("Coordenadora da Merenda Escolar");

    // Smooth redirect back to login
    setTimeout(() => {
      setActiveSubTab("login");
      setRegSuccessMsg("");
    }, 3000);
  };



  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans" id="login-container">
      {/* Brand Header Logo */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center" id="login-header">
        <div className="inline-flex items-center justify-center p-3.5 bg-emerald-600 rounded-3xl text-white shadow-xs mb-4" id="school-logo">
          <BookOpen className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-gray-950 tracking-tight">Controle de Estoque Kel</h2>
        <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mt-1">(CAEF) Centro de Apoio ao Ensino Fundamental</p>
        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-0.5">Várzea Nova - BA</p>
      </div>

      {/* Primary login dynamic card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md" id="login-card-container">
        <div className="bg-white py-8 px-6 border border-gray-100 rounded-3xl shadow-xl space-y-6">
          
          {/* Sub-tab switcher */}
          <div className="flex border-b border-gray-100 pb-2.5 justify-around text-xs font-bold uppercase tracking-wider" id="auth-tab-bar">
            <button
              onClick={() => {
                setActiveSubTab('login');
                setErrorMsg("");
              }}
              className={`pb-1.5 px-4 cursor-pointer transition border-b-2 flex items-center space-x-1 ${
                activeSubTab === 'login' 
                  ? "border-emerald-600 text-emerald-700" 
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
              id="subtab-btn-login"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Acessar</span>
            </button>
            <button
              onClick={() => {
                setActiveSubTab('register');
                setRegErrorMsg("");
                setRegSuccessMsg("");
              }}
              className={`pb-1.5 px-4 cursor-pointer transition border-b-2 flex items-center space-x-1 ${
                activeSubTab === 'register' 
                  ? "border-emerald-600 text-emerald-700" 
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
              id="subtab-btn-register"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Cadastrar-se</span>
            </button>
          </div>

          {activeSubTab === 'login' ? (
            <>
              {/* Error HUD */}
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-650 font-semibold text-center" id="login-error">
                  ❌ {errorMsg}
                </div>
              )}

              {/* Custom login form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4" id="form-login">
                <div>
                  <label htmlFor="username-input" className="block text-xs font-semibold text-gray-600 mb-1.5">Usuário ou E-mail</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      id="username-input"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-800 font-medium"
                      placeholder="Identificador ou Email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password-input" className="block text-xs font-semibold text-gray-600 mb-1.5 font-sans">Senha (PIN)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                      <Key className="w-4 h-4" />
                    </div>
                    <input
                      id="password-input"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-850 font-mono tracking-wider"
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      id="btn-toggle-passwd"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 text-center">
                  <button
                    type="submit"
                    id="btn-submit-login"
                    disabled={isLoading}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Shield className="w-4 h-4" />
                    <span>{isLoading ? "Autenticando..." : "Entrar no Sistema"}</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <>
              {/* REGISTRATION COMPONENT VIEW */}
              <div id="box-register-form">
                <div className="mb-4">
                  <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5">
                    <UserPlus className="w-4.5 h-4.5 text-emerald-600" />
                    <span>Criar Perfil de Merenda Escolar</span>
                  </h3>
                  <p className="text-[10px] text-gray-400 mt-0.5 leading-relaxed font-semibold uppercase">
                    Cadastre-se localmente para apoiar a merendeira ou atuar no recebimento de cargas
                  </p>
                </div>

                {regErrorMsg && (
                  <div className="p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold text-center" id="reg-error">
                    ❌ {regErrorMsg}
                  </div>
                )}

                {regSuccessMsg && (
                  <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-bold text-center" id="reg-success">
                    <CheckCircle2 className="w-4 h-4 inline-block mr-1" />
                    <span>{regSuccessMsg}</span>
                  </div>
                )}

                <form onSubmit={handleRegisterSubmit} className="space-y-4" id="form-register">
                  <div>
                    <label htmlFor="reg-name-input" className="block text-xs font-semibold text-gray-600 mb-1">Nome Completo</label>
                    <input
                      id="reg-name-input"
                      type="text"
                      required
                      placeholder="Ex: Dona Helena"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-user-input" className="block text-xs font-semibold text-gray-600 mb-1">Nome de Usuário (Username)</label>
                    <input
                      id="reg-user-input"
                      type="text"
                      required
                      placeholder="Ex: helena_merenda"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-password-input" className="block text-xs font-semibold text-gray-600 mb-1">Crie seu PIN de Entrada</label>
                    <input
                      id="reg-password-input"
                      type="password"
                      required
                      placeholder="Dígitos de segurança"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800 font-mono tracking-wider"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-role-select" className="block text-xs font-semibold text-gray-600 mb-1">Seu Cargo Escolar</label>
                    <select
                      id="reg-role-select"
                      value={regRole}
                      onChange={(e: any) => setRegRole(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none text-gray-800"
                    >
                      <option value="Coordenadora da Merenda Escolar">🥦 Coordenadora da Merenda Escolar</option>
                      <option value="Chefe de Almoxarifado">📦 Chefe de Almoxarifado</option>
                      <option value="Nutricionista">🍎 Nutricionista</option>
                    </select>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      id="btn-submit-register"
                      className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs hover:shadow-md transition active:scale-95 flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>Finalizar Cadastro</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}

          {/* Neutral Municipal Credits Footer */}
          <div className="text-center pt-4 border-t border-gray-50">
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Secretaria Municipal de Educação • Várzea Nova - BA</p>
          </div>
        </div>
      </div>
    </div>
  );
}
