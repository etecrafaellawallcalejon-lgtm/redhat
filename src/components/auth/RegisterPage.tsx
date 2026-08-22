import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Lock, Mail, User as UserIcon, Eye, EyeOff, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface RegisterPageProps {
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onNavigateToLogin }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Live Validations
  const isUsernameValid = username.length >= 3 && username.length <= 20 && /^[a-zA-Z0-9_]+$/.test(username.replace(/^@/, ''));
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPasswordValid = password.length >= 6;
  const isPasswordMatch = password.length > 0 && password === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!isUsernameValid) {
      setLocalError('O nome de usuário deve ter entre 3 e 20 caracteres (apenas letras, números e _).');
      return;
    }

    if (!isEmailValid) {
      setLocalError('Por favor, informe um endereço de e-mail válido.');
      return;
    }

    if (!isPasswordValid) {
      setLocalError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (!isPasswordMatch) {
      setLocalError('A confirmação de senha não coincide com a senha informada.');
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username: username.trim().replace(/^@/, ''),
        email: email.trim(),
        password,
        confirmPassword,
      });
    } catch (err: any) {
      setLocalError(err.message || 'Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#120707] px-4 py-8 relative overflow-hidden">
      {/* Background ambient red glow */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#A51D20]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#E53935]/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#1A0D0D] border border-[#351717] rounded-2xl p-8 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#A51D20] flex items-center justify-center shadow-lg shadow-[#E53935]/25 mb-3 ring-2 ring-[#FF5252]/30">
            <MessageSquare className="w-7 h-7 text-white fill-white/10" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5EEEE] tracking-tight">Criar Conta no RedChat</h1>
          <p className="text-xs text-[#A98F8F] mt-1">
            Junte-se à rede de comunicação com visual carmesim
          </p>
        </div>

        {localError && (
          <div className="mb-4 p-3 rounded-xl bg-[#351717]/80 border border-[#E53935]/50 text-xs text-[#FF5252] flex items-center gap-2">
            <XCircle className="w-4 h-4 shrink-0" />
            <span>{localError}</span>
          </div>
        )}

        {/* Register Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1">
              Nome de Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A98F8F]">
                <UserIcon className="w-4 h-4" />
              </div>
              <input
                id="register-username-input"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: mariana_silva"
                className="w-full pl-10 pr-10 py-2.5 bg-[#241212] border border-[#351717] rounded-xl text-[#F5EEEE] placeholder-[#A98F8F]/50 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all text-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                {username.length > 0 && (
                  isUsernameValid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-[#E53935]" />
                )}
              </div>
            </div>
            <p className="text-[10px] text-[#A98F8F]/70 mt-1">Será exibido como @{username || 'usuario'}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1">
              E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A98F8F]">
                <Mail className="w-4 h-4" />
              </div>
              <input
                id="register-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full pl-10 pr-10 py-2.5 bg-[#241212] border border-[#351717] rounded-xl text-[#F5EEEE] placeholder-[#A98F8F]/50 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all text-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                {email.length > 0 && (
                  isEmailValid ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-[#E53935]" />
                )}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A98F8F]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className="w-full pl-10 pr-10 py-2.5 bg-[#241212] border border-[#351717] rounded-xl text-[#F5EEEE] placeholder-[#A98F8F]/50 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all text-sm"
              />
              <button
                type="button"
                id="register-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A98F8F] hover:text-[#F5EEEE]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1">
              Confirmar Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A98F8F]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="register-confirm-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita sua senha"
                className="w-full pl-10 pr-10 py-2.5 bg-[#241212] border border-[#351717] rounded-xl text-[#F5EEEE] placeholder-[#A98F8F]/50 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all text-sm"
              />
              <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                {confirmPassword.length > 0 && (
                  isPasswordMatch ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-[#E53935]" />
                )}
              </div>
            </div>
          </div>

          <button
            id="register-submit-button"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-3 py-3 px-4 bg-[#E53935] hover:bg-[#FF5252] active:bg-[#A51D20] text-white font-semibold rounded-xl shadow-lg shadow-[#E53935]/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <span>Finalizar Cadastro</span>
            )}
          </button>
        </form>

        {/* Return to login */}
        <div className="mt-6 text-center">
          <button
            id="register-to-login-link"
            type="button"
            onClick={onNavigateToLogin}
            className="inline-flex items-center gap-1.5 text-xs text-[#A98F8F] hover:text-[#FF5252] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Já possui uma conta? Fazer Login</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
