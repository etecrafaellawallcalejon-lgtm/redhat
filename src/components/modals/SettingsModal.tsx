import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { api } from '../../services/api';
import { User } from '../../types';
import { sounds } from '../../services/audio';
import {
  X,
  User as UserIcon,
  Volume2,
  VolumeX,
  Users,
  LogOut,
  Check,
  Sparkles,
  Shield,
  Palette,
  Lock,
  KeyRound,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import { motion } from 'motion/react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  soundEnabled,
  onToggleSound,
}) => {
  const { user, updateProfile, switchUser, logout } = useAuth();
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'sounds' | 'demo' | 'about'>('profile');

  // Form states
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [customStatus, setCustomStatus] = useState(user?.custom_status || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [demoUsers, setDemoUsers] = useState<User[]>([]);

  // Security password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPass, setIsChangingPass] = useState(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username);
      setAvatar(user.avatar);
      setCustomStatus(user.custom_status || '');
      setBio(user.bio || '');
    }
  }, [user]);

  useEffect(() => {
    if (isOpen) {
      api.getDemoUsers().then((res) => setDemoUsers(res.users)).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !user) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        username: username.trim().replace(/^@/, ''),
        avatar: avatar.trim(),
        custom_status: customStatus.trim(),
        bio: bio.trim(),
      });
    } catch {
      // Handled in toast
    } finally {
      setIsSaving(false);
    }
  };

  const handleSwitchDemo = async (userId: string) => {
    await switchUser(userId);
    onClose();
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      addToast({
        type: 'error',
        title: 'Campos Obrigatórios',
        message: 'Preencha a senha atual e a nova senha.',
      });
      return;
    }

    if (newPassword.length < 6) {
      addToast({
        type: 'error',
        title: 'Senha Curta',
        message: 'A nova senha deve ter no mínimo 6 caracteres.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      addToast({
        type: 'error',
        title: 'Senhas Diferentes',
        message: 'A confirmação de senha não coincide com a nova senha.',
      });
      return;
    }

    setIsChangingPass(true);
    try {
      await api.changePassword({
        currentPassword,
        newPassword,
      });
      addToast({
        type: 'success',
        title: 'Senha Alterada! 🔐',
        message: 'Sua senha foi redefinida com sucesso com criptografia segura.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao alterar senha',
        message: err.message || 'Senha atual incorreta.',
      });
    } finally {
      setIsChangingPass(false);
    }
  };

  const isUserAdmin = user.role === 'admin' || user.is_admin || user.username.toLowerCase() === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-2xl bg-[#1A0D0D] border border-[#351717] rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-[560px] max-h-[90vh]"
      >
        {/* Left Navigation Tabs */}
        <div className="w-full md:w-52 bg-[#140a0a] border-r border-[#241212] p-4 flex flex-col justify-between shrink-0">
          <div className="space-y-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#A98F8F] px-2.5 mb-2">
              Configurações
            </h3>

            <button
              onClick={() => setActiveTab('profile')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'profile'
                  ? 'bg-[#351717] text-[#FF5252]'
                  : 'text-[#A98F8F] hover:bg-[#241212] hover:text-[#F5EEEE]'
              }`}
            >
              <UserIcon className="w-4 h-4" />
              <span>Meu Perfil</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'security'
                  ? 'bg-[#351717] text-[#FF5252]'
                  : 'text-[#A98F8F] hover:bg-[#241212] hover:text-[#F5EEEE]'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Segurança & Senha</span>
            </button>

            <button
              onClick={() => setActiveTab('sounds')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'sounds'
                  ? 'bg-[#351717] text-[#FF5252]'
                  : 'text-[#A98F8F] hover:bg-[#241212] hover:text-[#F5EEEE]'
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>Sons & Alertas</span>
            </button>

            <button
              onClick={() => setActiveTab('demo')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'demo'
                  ? 'bg-[#351717] text-[#FF5252]'
                  : 'text-[#A98F8F] hover:bg-[#241212] hover:text-[#F5EEEE]'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Trocar Conta Teste</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                activeTab === 'about'
                  ? 'bg-[#351717] text-[#FF5252]'
                  : 'text-[#A98F8F] hover:bg-[#241212] hover:text-[#F5EEEE]'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Sobre o RedChat</span>
            </button>
          </div>

          {/* Logout button at bottom of sidebar */}
          <div className="pt-3 border-t border-[#241212]">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-[#E53935] hover:bg-[#351717] transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sair da Conta</span>
            </button>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1A0D0D]">
          {/* Header Bar */}
          <div className="p-4 border-b border-[#241212] flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#F5EEEE]">
              {activeTab === 'profile' && 'Perfil do Usuário'}
              {activeTab === 'security' && 'Segurança da Conta & Senha'}
              {activeTab === 'sounds' && 'Sons e Notificações'}
              {activeTab === 'demo' && 'Contas de Demonstração'}
              {activeTab === 'about' && 'Arquitetura & Informações'}
            </h4>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#241212] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === 'profile' && (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* Avatar Preview + Input */}
                <div className="flex items-center gap-4 p-4 bg-[#140a0a] rounded-2xl border border-[#351717]">
                  <img
                    src={avatar || user.avatar}
                    alt={user.username}
                    className="w-16 h-16 rounded-full object-cover bg-[#241212] border-2 border-[#E53935]"
                    referrerPolicy="no-referrer"
                  />
                  <div className="flex-1 min-w-0">
                    <label className="block text-xs font-semibold text-[#A98F8F] mb-1">
                      URL do Avatar
                    </label>
                    <input
                      type="url"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 bg-[#241212] border border-[#351717] rounded-lg text-xs text-[#F5EEEE] focus:outline-none focus:border-[#E53935]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1">
                    Nome de Usuário
                  </label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2 bg-[#241212] border border-[#351717] rounded-xl text-sm text-[#F5EEEE] focus:outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1">
                    Status Personalizado
                  </label>
                  <input
                    type="text"
                    value={customStatus}
                    onChange={(e) => setCustomStatus(e.target.value)}
                    placeholder="ex: Codando ⚡"
                    className="w-full px-3.5 py-2 bg-[#241212] border border-[#351717] rounded-xl text-sm text-[#F5EEEE] focus:outline-none focus:border-[#E53935]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1">
                    Biografia / Sobre Mim
                  </label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Fale um pouco sobre você..."
                    className="w-full px-3.5 py-2 bg-[#241212] border border-[#351717] rounded-xl text-sm text-[#F5EEEE] focus:outline-none focus:border-[#E53935] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 bg-[#E53935] hover:bg-[#FF5252] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-[#E53935]/25 cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </form>
            )}

            {/* TAB: SECURITY */}
            {activeTab === 'security' && (
              <div className="space-y-4">
                {isUserAdmin && (
                  <div className="p-3.5 bg-amber-500/10 rounded-2xl border border-amber-500/30 flex items-center gap-3">
                    <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <h5 className="text-xs font-bold text-amber-300">Conta de Administrador Master</h5>
                      <p className="text-[11px] text-[#A98F8F]">
                        Para máxima segurança, mantenha uma senha forte com letras, números e símbolos.
                      </p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleChangePassword} className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] space-y-3.5">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#241212]">
                    <KeyRound className="w-4 h-4 text-[#FF5252]" />
                    <h5 className="text-xs font-bold uppercase tracking-wider text-[#F5EEEE]">
                      Alterar Senha de Acesso
                    </h5>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#A98F8F] uppercase tracking-wider mb-1">
                      Senha Atual
                    </label>
                    <input
                      type="password"
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Digite sua senha atual"
                      className="w-full px-3.5 py-2 bg-[#1A0D0D] border border-[#351717] rounded-xl text-xs text-[#F5EEEE] focus:outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#A98F8F] uppercase tracking-wider mb-1">
                      Nova Senha
                    </label>
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mínimo de 6 caracteres"
                      className="w-full px-3.5 py-2 bg-[#1A0D0D] border border-[#351717] rounded-xl text-xs text-[#F5EEEE] focus:outline-none focus:border-[#E53935]"
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
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="w-full px-3.5 py-2 bg-[#1A0D0D] border border-[#351717] rounded-xl text-xs text-[#F5EEEE] focus:outline-none focus:border-[#E53935]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isChangingPass}
                      className="px-5 py-2 bg-[#E53935] hover:bg-[#FF5252] text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-[#E53935]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isChangingPass ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5" />
                          <span>Salvar Nova Senha</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="p-3 bg-[#140a0a] rounded-xl border border-[#241212] flex items-center gap-2.5 text-xs text-[#A98F8F]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sua senha é protegida com hash Bcrypt e nunca é compartilhada.</span>
                </div>
              </div>
            )}

            {activeTab === 'sounds' && (
              <div className="space-y-4">
                <div className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {soundEnabled ? (
                      <Volume2 className="w-5 h-5 text-[#FF5252]" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-[#A98F8F]" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-[#F5EEEE]">Efeitos Sonoros</h4>
                      <p className="text-[11px] text-[#A98F8F]">
                        Sons de recebimento e envio de mensagens gerados com Web Audio API
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onToggleSound}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      soundEnabled
                        ? 'bg-[#E53935] text-white'
                        : 'bg-[#241212] text-[#A98F8F] hover:text-[#F5EEEE]'
                    }`}
                  >
                    {soundEnabled ? 'Ativado' : 'Desativado'}
                  </button>
                </div>

                <div className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] space-y-2">
                  <span className="text-xs font-bold text-[#F5EEEE] block">Testar Efeitos</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => sounds.playIncomingMessage()}
                      className="px-3 py-1.5 bg-[#241212] hover:bg-[#351717] text-xs text-[#F5EEEE] rounded-lg transition-colors cursor-pointer"
                    >
                      🔔 Mensagem Recebida
                    </button>
                    <button
                      onClick={() => sounds.playOutgoingMessage()}
                      className="px-3 py-1.5 bg-[#241212] hover:bg-[#351717] text-xs text-[#F5EEEE] rounded-lg transition-colors cursor-pointer"
                    >
                      ✉️ Mensagem Enviada
                    </button>
                    <button
                      onClick={() => sounds.playAlert()}
                      className="px-3 py-1.5 bg-[#241212] hover:bg-[#351717] text-xs text-[#F5EEEE] rounded-lg transition-colors cursor-pointer"
                    >
                      📞 Alerta de Chamada
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'demo' && (
              <div className="space-y-3">
                <p className="text-xs text-[#A98F8F] mb-3">
                  Alterne instantaneamente entre contas de teste para enviar e receber mensagens em tempo real:
                </p>
                {demoUsers.map((u) => {
                  const isCurrent = u.id === user.id;
                  return (
                    <div
                      key={u.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors ${
                        isCurrent
                          ? 'bg-[#351717] border-[#E53935]'
                          : 'bg-[#140a0a] border-[#241212] hover:bg-[#241212]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.username}
                          className="w-10 h-10 rounded-full object-cover bg-[#1A0D0D]"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h4 className="text-xs font-bold text-[#F5EEEE]">@{u.username}</h4>
                          <p className="text-[11px] text-[#A98F8F]">{u.email}</p>
                        </div>
                      </div>
                      {isCurrent ? (
                        <span className="px-2.5 py-1 bg-[#E53935]/20 text-[#FF5252] text-xs font-semibold rounded-lg flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Atual
                        </span>
                      ) : (
                        <button
                          onClick={() => handleSwitchDemo(u.id)}
                          className="px-3 py-1.5 bg-[#E53935] hover:bg-[#FF5252] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                        >
                          Trocar para @{u.username}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-4 text-xs text-[#F5EEEE]">
                <div className="p-4 bg-[#140a0a] rounded-2xl border border-[#351717] space-y-2">
                  <h4 className="font-bold text-[#FF5252] text-sm">RedChat v1.0.0</h4>
                  <p className="text-[#A98F8F] leading-relaxed">
                    Aplicativo completo de mensagens instantâneas em tempo real com arquitetura moderna, identidade visual carmesim e banco de dados SQLite.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 bg-[#140a0a] rounded-xl border border-[#241212]">
                    <span className="text-[#A98F8F] block text-[10px] uppercase font-bold">Frontend</span>
                    <p className="font-semibold text-[#F5EEEE]">React 19 + Vite + Tailwind</p>
                  </div>
                  <div className="p-3 bg-[#140a0a] rounded-xl border border-[#241212]">
                    <span className="text-[#A98F8F] block text-[10px] uppercase font-bold">Backend</span>
                    <p className="font-semibold text-[#F5EEEE]">FastAPI / Express + WebSockets</p>
                  </div>
                  <div className="p-3 bg-[#140a0a] rounded-xl border border-[#241212]">
                    <span className="text-[#A98F8F] block text-[10px] uppercase font-bold">Banco de Dados</span>
                    <p className="font-semibold text-[#F5EEEE]">SQLite + Persistência</p>
                  </div>
                  <div className="p-3 bg-[#140a0a] rounded-xl border border-[#241212]">
                    <span className="text-[#A98F8F] block text-[10px] uppercase font-bold">Autenticação</span>
                    <p className="font-semibold text-[#F5EEEE]">JWT + Senhas Bcrypt Hash</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
