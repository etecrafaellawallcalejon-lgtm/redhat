import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { User, AdminStats } from '../../types';
import {
  X,
  Crown,
  Users,
  Shield,
  MessageSquare,
  Radio,
  Trash2,
  Send,
  Search,
  Activity,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Camera,
  RefreshCw,
  Lock,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, requestSwitchProfile } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'broadcast' | 'security'>('overview');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  // Security tab state
  const [currentAdminPassword, setCurrentAdminPassword] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');
  const [confirmAdminPassword, setConfirmAdminPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const loadData = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getAdminUsers(),
      ]);
      setStats(statsRes.stats);
      setUsers(usersRes.users);
    } catch (err: any) {
      console.error('Error loading admin data:', err);
      addToast({
        type: 'error',
        title: 'Erro de Administração',
        message: err.message || 'Não foi possível carregar os dados administrativos.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isAdmin) {
      loadData();
    }
  }, [isOpen, isAdmin]);

  if (!isOpen) return null;

  const handleToggleRole = async (targetUser: User) => {
    const newRole = targetUser.role === 'admin' ? 'user' : 'admin';
    try {
      await api.updateUserRole(targetUser.id, newRole);
      addToast({
        type: 'success',
        title: 'Privilégio Atualizado',
        message: `@${targetUser.username} agora é ${newRole === 'admin' ? 'Administrador' : 'Membro Comum'}.`,
      });
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Falha ao alterar função',
        message: err.message,
      });
    }
  };

  const handleDeleteUser = async (targetId: string) => {
    try {
      await api.deleteUser(targetId);
      addToast({
        type: 'success',
        title: 'Usuário Excluído',
        message: 'A conta foi removida com sucesso do RedChat.',
      });
      setDeletingUserId(null);
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao excluir usuário',
        message: err.message,
      });
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    setIsBroadcasting(true);
    try {
      await api.sendAdminBroadcast(broadcastText.trim());
      addToast({
        type: 'success',
        title: 'Comunicado Enviado',
        message: 'A mensagem oficial foi publicada no Chat Geral e entregue a todos.',
      });
      setBroadcastText('');
      loadData();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro no comunicado',
        message: err.message,
      });
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleUpdateAdminPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdminPassword || !newAdminPassword) {
      addToast({
        type: 'error',
        title: 'Campos Obrigatórios',
        message: 'Preencha a senha atual e a nova senha.',
      });
      return;
    }

    if (newAdminPassword.length < 6) {
      addToast({
        type: 'error',
        title: 'Senha muito curta',
        message: 'A nova senha deve possuir no mínimo 6 caracteres.',
      });
      return;
    }

    if (newAdminPassword !== confirmAdminPassword) {
      addToast({
        type: 'error',
        title: 'Senhas não coincidem',
        message: 'A confirmação de senha deve ser idêntica à nova senha.',
      });
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await api.changePassword({
        currentPassword: currentAdminPassword,
        newPassword: newAdminPassword,
      });
      addToast({
        type: 'success',
        title: 'Senha Master Alterada! 🔐',
        message: 'A nova credencial de Administrador foi gravada com criptografia de ponta a ponta.',
      });
      setCurrentAdminPassword('');
      setNewAdminPassword('');
      setConfirmAdminPassword('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Falha na alteração',
        message: err.message || 'Senha atual incorreta.',
      });
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (u.custom_status && u.custom_status.toLowerCase().includes(userSearch.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-4xl bg-[#1A0D0D] border border-[#A51D20]/50 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[650px] max-h-[92vh]"
      >
        {/* Top Master Header */}
        <div className="bg-gradient-to-r from-[#140a0a] via-[#241212] to-[#140a0a] p-4 border-b border-[#351717] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-[#E53935] flex items-center justify-center text-white shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#F5EEEE] tracking-tight">
                  Painel de Administração Master
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold uppercase tracking-wider">
                  Admin Privileges
                </span>
              </div>
              <p className="text-xs text-[#A98F8F]">
                Gestão central de usuários, moderação, comunicados e métricas do RedChat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 rounded-xl text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#241212] transition-colors cursor-pointer"
              title="Atualizar dados"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#241212] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-4 bg-[#140a0a] border-b border-[#241212] gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'border-[#E53935] text-[#FF5252]'
                : 'border-transparent text-[#A98F8F] hover:text-[#F5EEEE]'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Visão Geral & Métricas</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-[#E53935] text-[#FF5252]'
                : 'border-transparent text-[#A98F8F] hover:text-[#F5EEEE]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Gerenciar Usuários ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('broadcast')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'broadcast'
                ? 'border-[#E53935] text-[#FF5252]'
                : 'border-transparent text-[#A98F8F] hover:text-[#F5EEEE]'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Comunicado Geral 📢</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'security'
                ? 'border-[#E53935] text-[#FF5252]'
                : 'border-transparent text-[#A98F8F] hover:text-[#F5EEEE]'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Segurança & Senha Master 🔐</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#1A0D0D] custom-scrollbar">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#A98F8F] mb-2">
                    <span className="text-[11px] font-semibold uppercase">Total Usuários</span>
                    <Users className="w-4 h-4 text-[#FF5252]" />
                  </div>
                  <span className="text-2xl font-black text-[#F5EEEE]">
                    {stats?.totalUsers ?? users.length}
                  </span>
                </div>

                <div className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#A98F8F] mb-2">
                    <span className="text-[11px] font-semibold uppercase">Usuários Online</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <span className="text-2xl font-black text-emerald-400">
                    {stats?.onlineUsers ?? users.filter((u) => u.status === 'online').length}
                  </span>
                </div>

                <div className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#A98F8F] mb-2">
                    <span className="text-[11px] font-semibold uppercase">Canais / Grupos</span>
                    <MessageSquare className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-2xl font-black text-[#F5EEEE]">
                    {stats?.totalGroups ?? 2}
                  </span>
                </div>

                <div className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#A98F8F] mb-2">
                    <span className="text-[11px] font-semibold uppercase">Mensagens</span>
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <span className="text-2xl font-black text-[#F5EEEE]">
                    {stats?.totalMessages ?? '--'}
                  </span>
                </div>

                <div className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] flex flex-col justify-between">
                  <div className="flex items-center justify-between text-[#A98F8F] mb-2">
                    <span className="text-[11px] font-semibold uppercase">Fotos Postadas</span>
                    <Camera className="w-4 h-4 text-rose-400" />
                  </div>
                  <span className="text-2xl font-black text-[#F5EEEE]">
                    {stats?.totalPosts ?? '--'}
                  </span>
                </div>
              </div>

              {/* Server Information */}
              <div className="p-5 bg-[#140a0a] rounded-2xl border border-[#351717] space-y-3">
                <h4 className="text-xs font-bold text-[#F5EEEE] uppercase tracking-wider flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#FF5252]" />
                  Status do Servidor & Segurança
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-[#1A0D0D] rounded-xl border border-[#241212]">
                    <span className="text-[#A98F8F] block text-[10px]">Autenticação</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5" /> JWT Seguro + Bcrypt Salt
                    </span>
                  </div>
                  <div className="p-3 bg-[#1A0D0D] rounded-xl border border-[#241212]">
                    <span className="text-[#A98F8F] block text-[10px]">WebRTC & Áudio/Vídeo</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Peer-to-Peer + Tela Ativo
                    </span>
                  </div>
                  <div className="p-3 bg-[#1A0D0D] rounded-xl border border-[#241212]">
                    <span className="text-[#A98F8F] block text-[10px]">WebSockets Realtime</span>
                    <span className="font-semibold text-emerald-400 flex items-center gap-1.5 mt-0.5">
                      <CheckCircle className="w-3.5 h-3.5" /> Conexão Baixa Latência
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Admin Actions */}
              <div className="p-5 bg-[#140a0a] rounded-2xl border border-[#351717] space-y-3">
                <h4 className="text-xs font-bold text-[#F5EEEE] uppercase tracking-wider">
                  Ações Rápidas de Administrador
                </h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab('broadcast')}
                    className="px-4 py-2 bg-[#E53935] hover:bg-[#FF5252] text-white text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md shadow-[#E53935]/20 flex items-center gap-2"
                  >
                    <Radio className="w-4 h-4" />
                    <span>Publicar Comunicado no Chat Geral</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('users')}
                    className="px-4 py-2 bg-[#241212] hover:bg-[#351717] border border-[#351717] text-[#F5EEEE] text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Users className="w-4 h-4" />
                    <span>Ver e Promover Usuários</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: USERS MANAGEMENT */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A98F8F]" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Pesquisar por nome de usuário, e-mail ou status..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[#140a0a] border border-[#351717] rounded-xl text-xs text-[#F5EEEE] placeholder-[#A98F8F]/50 focus:outline-none focus:border-[#E53935]"
                />
              </div>

              {/* Users List */}
              <div className="space-y-2">
                {filteredUsers.map((u) => {
                  const isTargetAdmin = u.role === 'admin' || u.is_admin || u.username === 'admin';
                  const isCurrent = u.id === user?.id;

                  return (
                    <div
                      key={u.id}
                      className="p-3 bg-[#140a0a] rounded-xl border border-[#241212] hover:border-[#351717] flex items-center justify-between gap-3 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <img
                            src={u.avatar}
                            alt={u.username}
                            className="w-10 h-10 rounded-full object-cover bg-[#241212] border border-[#351717]"
                            referrerPolicy="no-referrer"
                          />
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#140a0a] ${
                              u.status === 'online'
                                ? 'bg-emerald-500'
                                : u.status === 'idle'
                                ? 'bg-amber-500'
                                : u.status === 'dnd'
                                ? 'bg-[#E53935]'
                                : 'bg-gray-500'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[#F5EEEE] truncate">
                              @{u.username}
                            </span>
                            {isTargetAdmin && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase flex items-center gap-1">
                                <Crown className="w-2.5 h-2.5" /> Admin
                              </span>
                            )}
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full bg-[#E53935]/20 text-[#FF5252] text-[9px] font-bold">
                                Você
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#A98F8F] truncate">{u.email}</p>
                          {u.custom_status && (
                            <p className="text-[10px] text-[#A98F8F]/70 italic truncate mt-0.5">
                              "{u.custom_status}"
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => requestSwitchProfile(u)}
                          className="px-2.5 py-1.5 bg-[#241212] hover:bg-[#351717] text-[#F5EEEE] text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                          title="Alternar para este usuário com validação de segurança"
                        >
                          Conectar
                        </button>

                        <button
                          onClick={() => handleToggleRole(u)}
                          disabled={isCurrent}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer disabled:opacity-40 ${
                            isTargetAdmin
                              ? 'bg-amber-500/20 text-amber-400 hover:bg-amber-500/30'
                              : 'bg-[#241212] text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#351717]'
                          }`}
                          title={isTargetAdmin ? 'Remover privilégio de Admin' : 'Tornar Administrador'}
                        >
                          {isTargetAdmin ? 'Remover Admin' : 'Dar Admin 👑'}
                        </button>

                        {deletingUserId === u.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold rounded"
                            >
                              Confirmar
                            </button>
                            <button
                              onClick={() => setDeletingUserId(null)}
                              className="px-1.5 py-1 text-[10px] text-[#A98F8F] hover:text-[#F5EEEE]"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeletingUserId(u.id)}
                            disabled={isCurrent}
                            className="p-1.5 text-[#A98F8F] hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                            title="Excluir conta do sistema"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: BROADCAST */}
          {activeTab === 'broadcast' && (
            <div className="max-w-2xl mx-auto space-y-4">
              <div className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <Radio className="w-5 h-5 animate-pulse" />
                  <h4 className="text-sm font-bold">Transmissão Global de Comunicado</h4>
                </div>
                <p className="text-xs text-[#A98F8F] leading-relaxed">
                  Envie avisos oficiais, novidades do servidor ou alertas de manutenção diretamente para o canal <strong>Chat Geral 🔴</strong>, visível em tempo real para todos os usuários cadastrados.
                </p>
              </div>

              <form onSubmit={handleSendBroadcast} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1.5">
                    Conteúdo do Comunicado
                  </label>
                  <textarea
                    rows={6}
                    required
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Exemplo: 📢 Olá comunidade! Realizamos uma atualização nos servidores de chamadas de voz e vídeo. O compartilhamento de tela já está disponível para todos!"
                    className="w-full p-3.5 bg-[#140a0a] border border-[#351717] rounded-xl text-xs text-[#F5EEEE] placeholder-[#A98F8F]/40 focus:outline-none focus:border-[#E53935] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastText('')}
                    className="px-4 py-2 text-xs text-[#A98F8F] hover:text-[#F5EEEE]"
                  >
                    Limpar
                  </button>
                  <button
                    type="submit"
                    disabled={isBroadcasting || !broadcastText.trim()}
                    className="px-6 py-2.5 bg-[#E53935] hover:bg-[#FF5252] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#E53935]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isBroadcasting ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Publicar Comunicado Geral</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: SECURITY & MASTER PASSWORD */}
          {activeTab === 'security' && (
            <div className="max-w-2xl mx-auto space-y-5">
              <div className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] space-y-2">
                <div className="flex items-center gap-2 text-amber-400">
                  <ShieldCheck className="w-5 h-5" />
                  <h4 className="text-sm font-bold">Segurança e Proteção da Conta Master</h4>
                </div>
                <p className="text-xs text-[#A98F8F] leading-relaxed">
                  A conta de Administrador Master possui acesso irrestrito às ferramentas do sistema. O acesso por 1-clique e bypasses estão desativados: é <strong>estritamente obrigatório</strong> digitar suas credenciais para entrar ou alternar para esta conta.
                </p>
              </div>

              {/* Password Change Form */}
              <div className="p-5 bg-[#140a0a] rounded-2xl border border-[#351717] space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-[#241212]">
                  <KeyRound className="w-4 h-4 text-[#FF5252]" />
                  <h5 className="text-xs font-bold uppercase tracking-wider text-[#F5EEEE]">
                    Redefinir Senha do Administrador
                  </h5>
                </div>

                <form onSubmit={handleUpdateAdminPassword} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-[#A98F8F] uppercase tracking-wider mb-1">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      required
                      value={currentAdminPassword}
                      onChange={(e) => setCurrentAdminPassword(e.target.value)}
                      placeholder="Digite a senha atual do Administrador"
                      className="w-full px-3.5 py-2 bg-[#1A0D0D] border border-[#351717] rounded-xl text-xs text-[#F5EEEE] placeholder-[#A98F8F]/40 focus:outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#A98F8F] uppercase tracking-wider mb-1">
                        Nova Senha Mestra
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={newAdminPassword}
                        onChange={(e) => setNewAdminPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-3.5 py-2 bg-[#1A0D0D] border border-[#351717] rounded-xl text-xs text-[#F5EEEE] placeholder-[#A98F8F]/40 focus:outline-none focus:border-[#E53935]"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#A98F8F] uppercase tracking-wider mb-1">
                        Confirmar Nova Senha
                      </label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        value={confirmAdminPassword}
                        onChange={(e) => setConfirmAdminPassword(e.target.value)}
                        placeholder="Repita a nova senha"
                        className="w-full px-3.5 py-2 bg-[#1A0D0D] border border-[#351717] rounded-xl text-xs text-[#F5EEEE] placeholder-[#A98F8F]/40 focus:outline-none focus:border-[#E53935]"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isUpdatingPassword}
                      className="px-5 py-2.5 bg-[#E53935] hover:bg-[#FF5252] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#E53935]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isUpdatingPassword ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Atualizar Senha de Administrador</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

              {/* Security Metrics & Architecture Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-[#140a0a] rounded-xl border border-[#241212] flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#F5EEEE] block text-[11px]">Bcrypt Salt Hashing</span>
                    <span className="text-[10px] text-[#A98F8F]">Senhas nunca são salvas em texto plano, utilizando salt rounds de proteção avançada.</span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#140a0a] rounded-xl border border-[#241212] flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#F5EEEE] block text-[11px]">Rotas com JWT Auth</span>
                    <span className="text-[10px] text-[#A98F8F]">Todas as chamadas de administração verificam tokens e permissões de perfil no servidor.</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
