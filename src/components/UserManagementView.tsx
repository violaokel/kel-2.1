import React, { useState } from "react";
import { UserAccount, UserProfile } from "../types";
import { 
  Users, 
  UserPlus, 
  Trash2, 
  Edit3, 
  ShieldCheck, 
  Lock, 
  Check, 
  X, 
  ShieldAlert, 
  Search,
  CheckCircle2,
  LockKeyhole
} from "lucide-react";

interface UserManagementViewProps {
  users: UserAccount[];
  currentUser: UserProfile;
  onAddUser: (user: Omit<UserAccount, 'id'>) => void;
  onUpdateUser: (userId: string, updated: Partial<UserAccount>) => void;
  onDeleteUser: (userId: string) => void;
}

export default function UserManagementView({
  users,
  currentUser,
  onAddUser,
  onUpdateUser,
  onDeleteUser
}: UserManagementViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Create state
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<'Administrador' | 'Chefe de Almoxarifado' | 'Coordenadora da Merenda Escolar' | 'Nutricionista'>('Coordenadora da Merenda Escolar');
  const [showAddForm, setShowAddForm] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  // Edit states
  const [editName, setEditName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editRole, setEditRole] = useState<'Administrador' | 'Chefe de Almoxarifado' | 'Coordenadora da Merenda Escolar' | 'Nutricionista'>('Coordenadora da Merenda Escolar');
  const [editError, setEditError] = useState("");

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError("");
    setCreateSuccess("");

    if (!newName.trim() || !newUsername.trim() || !newPassword.trim()) {
      setCreateError("Preencha todos os campos obrigatórios.");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailPattern.test(newUsername.trim());
    
    // Normalization
    let usernameNormalized = newUsername.trim().toLowerCase();
    if (newRole === 'Administrador' && !isEmail) {
      setCreateError("Para Administradores, o nome de usuário deve ser um e-mail válido.");
      return;
    }

    // Check if duplicate username exists
    const duplicate = users.find(u => u.username.toLowerCase() === usernameNormalized);
    if (duplicate) {
      setCreateError("Este e-mail ou nome de usuário já está cadastrado.");
      return;
    }

    if (newPassword.length < 4) {
      setCreateError("A senha deve conter no mínimo 4 dígitos.");
      return;
    }

    onAddUser({
      name: newName.trim(),
      username: usernameNormalized,
      role: newRole,
      password: newPassword
    });

    setCreateSuccess(`Usuário ${newName} cadastrado com sucesso!`);
    // Reset form
    setNewName("");
    setNewUsername("");
    setNewPassword("");
    setNewRole("Coordenadora da Merenda Escolar");
    setTimeout(() => {
      setCreateSuccess("");
      setShowAddForm(false);
    }, 2000);
  };

  const startEdit = (user: UserAccount) => {
    setEditingUserId(user.id);
    setEditName(user.name);
    setEditUsername(user.username);
    setEditPassword(user.password || "");
    setEditRole(user.role);
    setEditError("");
  };

  const handleUpdateSubmit = (userId: string) => {
    setEditError("");
    
    if (!editName.trim() || !editUsername.trim()) {
      setEditError("Nome e Usuário/E-mail são obrigatórios.");
      return;
    }

    const usernameNormalized = editUsername.trim().toLowerCase();

    // Check duplicate
    const duplicate = users.find(u => u.id !== userId && u.username.toLowerCase() === usernameNormalized);
    if (duplicate) {
      setEditError("Este e-mail ou nome de usuário já está associado a outra conta.");
      return;
    }

    // Protection for Admin
    if (editRole === 'Administrador') {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(usernameNormalized)) {
        setEditError("Para Administradores, o nome de usuário deve ser um e-mail válido.");
        return;
      }
    }

    onUpdateUser(userId, {
      name: editName.trim(),
      username: usernameNormalized,
      role: editRole,
      password: editPassword || undefined
    });

    setEditingUserId(null);
  };

  // Filter users based on query
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadge = (role: 'Administrador' | 'Chefe de Almoxarifado' | 'Coordenadora da Merenda Escolar' | 'Nutricionista') => {
    switch (role) {
      case 'Administrador':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Lock className="w-3 h-3 text-amber-500" />
            <span>Administrador</span>
          </span>
        );
      case 'Coordenadora da Merenda Escolar':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Coordenadora da Merenda</span>
          </span>
        );
      case 'Chefe de Almoxarifado':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-800 border border-blue-200">
            <LockKeyhole className="w-3 h-3 text-blue-500" />
            <span>Chefe Almoxarifado</span>
          </span>
        );
      case 'Nutricionista':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200">
            <Users className="w-3 h-3 text-purple-500" />
            <span>Nutricionista</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6" id="user-management-section">
      {/* Upper header action board */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4" id="user-header">
        <div>
          <h2 className="text-xl font-black text-gray-950 flex items-center space-x-2">
            <Users className="w-6 h-6 text-emerald-600" />
            <span>Gestão & Controle de Usuários</span>
          </h2>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-higher font-bold">
            Cadastre novos colaboradores e defina suas credenciais municipais de acesso
          </p>
        </div>

        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setCreateError("");
            setCreateSuccess("");
          }}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 shadow-sm active:scale-95 cursor-pointer"
          id="btn-toggle-add-user"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          <span>{showAddForm ? "Fechar Cadastro" : "Cadastrar Novo Usuário"}</span>
        </button>
      </div>

      {/* Grid status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4" id="user-stats-grid">
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Total de Usuários</p>
          <p className="text-2xl font-black text-gray-955 mt-1 font-mono">{users.length}</p>
        </div>
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Administradores</p>
          <p className="text-2xl font-black text-amber-600 mt-1 font-mono">
            {users.filter(u => u.role === 'Administrador').length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Coord. de Merenda</p>
          <p className="text-2xl font-black text-emerald-600 mt-1 font-mono">
            {users.filter(u => u.role === 'Coordenadora da Merenda Escolar').length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Chefe Almoxarifado</p>
          <p className="text-2xl font-black text-blue-600 mt-1 font-mono">
            {users.filter(u => u.role === 'Chefe de Almoxarifado').length}
          </p>
        </div>
        <div className="p-4 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <p className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Nutricionistas</p>
          <p className="text-2xl font-black text-purple-600 mt-1 font-mono">
            {users.filter(u => u.role === 'Nutricionista').length}
          </p>
        </div>
      </div>

      {/* Creation form dropdown area */}
      {showAddForm && (
        <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-lg animate-fade-in" id="box-add-user-form">
          <h3 className="font-bold text-gray-900 text-sm flex items-center space-x-1.5 mb-4">
            <UserPlus className="w-4 h-4 text-emerald-600" />
            <span>Cadastrar Usuário Municipal</span>
          </h3>

          {createError && (
            <div className="p-3 mb-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold flex items-center space-x-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>{createError}</span>
            </div>
          )}

          {createSuccess && (
            <div className="p-3 mb-4 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-700 font-semibold flex items-center space-x-1.5">
              <CheckCircle2 className="w-4 h-4" />
              <span>{createSuccess}</span>
            </div>
          )}

          <form onSubmit={handleCreateUser} className="grid grid-cols-1 md:grid-cols-4 gap-4" id="form-create-new-user">
            <div>
              <label htmlFor="input-new-user-name" className="block text-xs font-semibold text-gray-650 mb-1.5">
                Nome do Colaborador
              </label>
              <input
                id="input-new-user-name"
                type="text"
                required
                placeholder="Ex: Dona Helena"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-sans text-gray-800"
              />
            </div>

            <div>
              <label htmlFor="input-new-user-username" className="block text-xs font-semibold text-gray-650 mb-1.5">
                Usuário ou E-mail
              </label>
              <input
                id="input-new-user-username"
                type="text"
                required
                placeholder={newRole === 'Administrador' ? "Deve ser um e-mail" : "Ex: helena_merenda"}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-sans text-gray-800"
              />
            </div>

            <div>
              <label htmlFor="input-new-user-password" className="block text-xs font-semibold text-gray-650 mb-1.5">
                Senha / PIN Inicial
              </label>
              <input
                id="input-new-user-password"
                type="password"
                required
                placeholder="Ex: 123456"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-gray-800"
              />
            </div>

            <div>
              <label htmlFor="select-new-user-role" className="block text-xs font-semibold text-gray-650 mb-1.5">
                Perfil de Acesso
              </label>
              <select
                id="select-new-user-role"
                value={newRole}
                onChange={(e: any) => setNewRole(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none font-sans text-gray-800"
              >
                <option value="Coordenadora da Merenda Escolar">🥦 Coordenadora da Merenda Escolar</option>
                <option value="Chefe de Almoxarifado">📦 Chefe de Almoxarifado</option>
                <option value="Nutricionista">🍎 Nutricionista</option>
                <option value="Administrador">🔑 Administrador</option>
              </select>
            </div>

            <div className="md:col-span-4 flex justify-end">
              <button
                type="submit"
                id="btn-submit-create-user"
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1 border border-emerald-600 cursor-pointer shadow-xs"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar Credencial</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search box and users list block */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-xs" id="box-user-list-wrapper">
        <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              id="search-user-input"
              type="text"
              placeholder="Buscar colaborador por nome, e-mail ou perfil..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-gray-200 rounded-xl text-xs text-gray-850 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="text-[10px] text-gray-400 font-semibold px-2">
            Mostrando {filteredUsers.length} de {users.length} usuários
          </div>
        </div>

        {/* Directory table/cards */}
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            Nenhum usuário foi encontrado com os dados digitados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="table-users-list">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-100 text-[10px] uppercase tracking-wider font-bold text-gray-400">
                  <th className="py-3 px-4">Nome do Colaborador</th>
                  <th className="py-3 px-4">E-mail / Usuário</th>
                  <th className="py-3 px-4">Senha (PIN)</th>
                  <th className="py-3 px-4">Perfil</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                {filteredUsers.map((user) => {
                  const isEditing = editingUserId === user.id;

                  return (
                    <tr 
                      key={user.id} 
                      className={`hover:bg-slate-50/50 transition ${isEditing ? "bg-emerald-50/20" : ""}`}
                    >
                      {/* Name Col */}
                      <td className="py-3 px-4 font-semibold text-gray-900">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 w-full"
                          />
                        ) : (
                          <span>{user.name}</span>
                        )}
                      </td>

                      {/* Username Col */}
                      <td className="py-3 px-4 font-mono text-gray-500">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editUsername}
                            disabled={user.username === 'violaokel@gmail.com'} // Protect original admin
                            onChange={(e) => setEditUsername(e.target.value)}
                            className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 w-full disabled:bg-slate-100 disabled:text-gray-400"
                          />
                        ) : (
                          <span>{user.username}</span>
                        )}
                      </td>

                      {/* Password PIN Col */}
                      <td className="py-3 px-4 font-mono text-gray-500">
                        {isEditing ? (
                          <div className="relative">
                            <LockKeyhole className="absolute left-2 top-2 w-3 h-3 text-gray-300" />
                            <input
                              type="password"
                              value={editPassword}
                              onChange={(e) => setEditPassword(e.target.value)}
                              placeholder="••••••"
                              className="pl-7 pr-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 w-full"
                            />
                          </div>
                        ) : (
                          <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[10px] font-bold text-gray-600">
                            {user.password ? "••••••" : "Livre"}
                          </span>
                        )}
                      </td>

                      {/* Role profile Col */}
                      <td className="py-3 px-4">
                        {isEditing ? (
                          <select
                            value={editRole}
                            disabled={user.username === 'violaokel@gmail.com'} // Protect original admin
                            onChange={(e: any) => setEditRole(e.target.value)}
                            className="px-2 py-1 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500 disabled:bg-slate-100"
                          >
                            <option value="Coordenadora da Merenda Escolar">Coordenadora da Merenda Escolar</option>
                            <option value="Chefe de Almoxarifado">Chefe de Almoxarifado</option>
                            <option value="Nutricionista">Nutricionista</option>
                            <option value="Administrador">Administrador</option>
                          </select>
                        ) : (
                          getRoleBadge(user.role)
                        )}
                      </td>

                      {/* Actions Buttons Col */}
                      <td className="py-3 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            {editError && (
                              <span className="text-[10px] text-red-650 font-semibold mr-2">{editError}</span>
                            )}
                            <button
                              onClick={() => handleUpdateSubmit(user.id)}
                              className="p-1 px-2.5 bg-emerald-600 text-white hover:bg-emerald-700 text-[10px] font-bold rounded-lg transition flex items-center space-x-0.5"
                              title="Salvar Alterações"
                            >
                              <Check className="w-3 h-3" />
                              <span>Salvar</span>
                            </button>
                            <button
                              onClick={() => setEditingUserId(null)}
                              className="p-1 px-2 bg-slate-200 text-gray-700 hover:bg-slate-300 text-[10px] font-semibold rounded-lg transition"
                              title="Cancelar edição"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              onClick={() => startEdit(user)}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-gray-400 rounded-lg transition"
                              title="Editar Perfil"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            {/* Safe Delete Protection for current logged user and supreme admin */}
                            {user.username === 'violaokel@gmail.com' ? (
                              <button
                                disabled
                                className="p-1.5 bg-slate-100 text-gray-200 rounded-lg cursor-not-allowed"
                                title="O Administrador Supremo não pode ser excluído"
                              >
                                <Trash2 className="w-3.5 h-3.5 opacity-30" />
                              </button>
                            ) : confirmDeleteId === user.id ? (
                              <div className="flex items-center space-x-1 animate-scale-in">
                                <button
                                  onClick={() => {
                                    onDeleteUser(user.id);
                                    setConfirmDeleteId(null);
                                  }}
                                  className="px-2 py-1 bg-red-650 text-white hover:bg-red-700 text-[10px] font-bold rounded-lg transition"
                                >
                                  Excluir
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="px-2 py-1 bg-slate-200 text-gray-700 hover:bg-slate-300 text-[10px] font-semibold rounded-lg transition"
                                >
                                  X
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(user.id)}
                                className="p-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-650 text-gray-400 rounded-lg transition"
                                title="Excluir Usuário"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex items-start space-x-3 text-xs text-orange-800">
        <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">⚠️ Diretriz de Segurança de Credenciais</p>
          <p className="mt-1 leading-relaxed text-[11px] font-medium">
            Por determinação de segurança local, apenas administradores devidamente cadastrados no e-mail violaokel@gmail.com correspondente com a respectiva chave privada podem usufruir da modificação geral de estoque e excluir registros históricos do portal.
          </p>
        </div>
      </div>
    </div>
  );
}
