import React, { useState } from 'react';
import { Lock, Eye, EyeOff, X, ShieldAlert, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { User } from '../../types';

interface PasswordConfirmModalProps {
  isOpen: boolean;
  targetUser: User;
  onClose: () => void;
}

export const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
  isOpen,
  targetUser,
  onClose,
}) => {
  const { switchProfileWithPassword } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError('Por favor, digite a senha da conta.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await switchProfileWithPassword(targetUser.id, password);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Senha incorreta para esta conta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="password-confirm-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="password-confirm-modal-card"
        className="w-full max-w-md bg-[#180b0b] border border-[#351717] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 bg-[#120707] border-b border-[#241212] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-[#FF5252]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Segurança de Troca de Perfil
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-[#A98F8F] hover:text-white hover:bg-[#241212] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-3 p-3 bg-[#120707] border border-[#241212] rounded-2xl">
            <img
              src={targetUser.avatar}
              alt={targetUser.username}
              className="w-12 h-12 rounded-full object-cover border-2 border-[#A51D20]"
            />
            <div className="min-w-0">
              <span className="text-xs text-[#A98F8F] block">Alternando para:</span>
              <span className="text-sm font-bold text-white truncate block">
                @{targetUser.username}
              </span>
              <span className="text-[10px] text-[#A98F8F]">{targetUser.email}</span>
            </div>
          </div>

          <p className="text-xs text-[#A98F8F] leading-relaxed">
            Esta conta é protegida por senha. Confirme a senha para concluir a troca de perfil com segurança.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-[#E53935]/15 border border-[#E53935]/40 text-[#FF5252] text-xs flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#A98F8F] uppercase tracking-wider mb-1.5">
              Senha da Conta
            </label>
            <div className="relative">
              <input
                id="profile-switch-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Digite a senha..."
                autoFocus
                className="w-full pl-3 pr-10 py-2.5 bg-[#120707] border border-[#351717] focus:border-[#E53935] rounded-xl text-xs text-white placeholder:text-[#A98F8F]/40 focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A98F8F] hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#241212] hover:bg-[#351717] text-[#A98F8F] hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-confirm-switch-profile"
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="px-5 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(229,57,53,0.4)] disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? 'Verificando...' : 'Confirmar e Trocar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
