import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Lock, X, ShieldAlert, ArrowRight, KeyRound, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const SwitchProfilePasswordModal: React.FC = () => {
  const { pendingSwitchUser, cancelSwitchProfile, switchProfileWithPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!pendingSwitchUser) return null;

  const isTargetAdmin =
    pendingSwitchUser.role === 'admin' ||
    pendingSwitchUser.is_admin ||
    pendingSwitchUser.username === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Por favor, informe a senha da conta.');
      return;
    }

    setError('');
    setIsLoading(true);
    try {
      await switchProfileWithPassword(pendingSwitchUser.id, password);
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Senha incorreta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        className="w-full max-w-md bg-[#1A0D0D] border border-[#351717] rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 bg-[#140a0a] border-b border-[#241212] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#E53935]/15 text-[#FF5252] border border-[#E53935]/30">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5EEEE]">Confirmação de Segurança</h3>
              <p className="text-[11px] text-[#A98F8F]">Autenticação necessária para trocar de perfil</p>
            </div>
          </div>
          <button
            onClick={cancelSwitchProfile}
            className="p-1.5 rounded-lg text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#241212] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Target Profile Card */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 p-3.5 bg-[#140a0a] rounded-xl border border-[#351717]">
            <img
              src={pendingSwitchUser.avatar}
              alt={pendingSwitchUser.username}
              className="w-12 h-12 rounded-full object-cover bg-[#241212] border border-[#E53935]"
              referrerPolicy="no-referrer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[#F5EEEE] truncate">
                  @{pendingSwitchUser.username}
                </span>
                {isTargetAdmin && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px] font-bold uppercase flex items-center gap-1">
                    <Crown className="w-2.5 h-2.5" /> Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-[#A98F8F] truncate">{pendingSwitchUser.email}</p>
            </div>
          </div>

          <div className="p-3 bg-[#241212]/50 border border-[#351717] rounded-xl text-xs text-[#A98F8F] space-y-1">
            <p className="flex items-center gap-1.5 text-amber-300 font-semibold">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              Proteção de Conta Ativa
            </p>
            <p className="text-[11px] leading-relaxed">
              Por segurança, contas pessoais e a conta de Administrador exigem confirmação de senha para troca rápida.
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/50 rounded-xl text-xs text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1.5">
                Senha da conta @{pendingSwitchUser.username}
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#A98F8F]" />
                <input
                  type="password"
                  autoFocus
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Digite a senha..."
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#140a0a] border border-[#351717] rounded-xl text-xs text-[#F5EEEE] focus:outline-none focus:border-[#E53935]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={cancelSwitchProfile}
                className="px-4 py-2 text-xs font-semibold text-[#A98F8F] hover:text-[#F5EEEE] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !password}
                className="px-5 py-2.5 bg-[#E53935] hover:bg-[#FF5252] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[#E53935]/25 flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Confirmar Troca</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
