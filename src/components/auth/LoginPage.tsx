import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { MessageSquare, Lock, User, Eye, EyeOff, Sparkles, ArrowRight, ShieldCheck, Crown } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onNavigateToRegister }) => {
  const { login, switchUser } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setIsSubmitting(true);
    try {
      await login({ identifier, password });
    } catch {
      // Error handled in toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLogin = (demoId: string) => {
    switchUser(demoId);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#120707] px-4 py-8 relative overflow-hidden">
      {/* Background ambient red glow */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#A51D20]/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#E53935]/15 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#1A0D0D] border border-[#351717] rounded-2xl p-8 shadow-2xl relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#E53935] to-[#A51D20] flex items-center justify-center shadow-lg shadow-[#E53935]/25 mb-4 ring-2 ring-[#FF5252]/30">
            <MessageSquare className="w-8 h-8 text-white fill-white/10" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5EEEE] tracking-tight flex items-center gap-2">
            RedChat
            <span className="text-xs uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#351717] text-[#FF5252] border border-[#A51D20]/40">
              Live
            </span>
          </h1>
          <p className="text-sm text-[#A98F8F] mt-1">
            Conecte-se e converse em tempo real
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1.5">
              Usuário ou E-mail
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A98F8F]">
                <User className="w-4 h-4" />
              </div>
              <input
                id="login-identifier-input"
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="rafaela ou rafaela@redchat.io"
                className="w-full pl-10 pr-4 py-2.5 bg-[#241212] border border-[#351717] rounded-xl text-[#F5EEEE] placeholder-[#A98F8F]/50 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#A98F8F] mb-1.5">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#A98F8F]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha secreta"
                className="w-full pl-10 pr-10 py-2.5 bg-[#241212] border border-[#351717] rounded-xl text-[#F5EEEE] placeholder-[#A98F8F]/50 focus:outline-none focus:border-[#E53935] focus:ring-1 focus:ring-[#E53935] transition-all text-sm"
              />
              <button
                type="button"
                id="login-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#A98F8F] hover:text-[#F5EEEE]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="login-submit-button"
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-[#E53935] hover:bg-[#FF5252] active:bg-[#A51D20] text-white font-semibold rounded-xl shadow-lg shadow-[#E53935]/25 transition-all flex items-center justify-center gap-2 text-sm disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Entrar no RedChat</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Switcher for 1-click test login */}
        <div className="mt-6 pt-6 border-t border-[#351717]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#FF5252]" />
              <span className="text-xs font-semibold text-[#A98F8F] uppercase tracking-wider">
                Contas de Teste (1-Clique)
              </span>
            </div>
            <span className="text-[10px] text-[#A98F8F]/60">Ambiente de Teste</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              id="demo-login-rafaela"
              type="button"
              onClick={() => handleQuickLogin('usr_rafaela')}
              className="px-3 py-2 bg-[#241212] hover:bg-[#351717] border border-[#351717] rounded-lg text-left text-xs text-[#F5EEEE] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-[#E53935]" />
              <span className="truncate">@rafaela</span>
            </button>
            <button
              id="demo-login-alex"
              type="button"
              onClick={() => handleQuickLogin('usr_alex')}
              className="px-3 py-2 bg-[#241212] hover:bg-[#351717] border border-[#351717] rounded-lg text-left text-xs text-[#F5EEEE] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="truncate">@alex_dev</span>
            </button>
            <button
              id="demo-login-lucas"
              type="button"
              onClick={() => handleQuickLogin('usr_lucas')}
              className="px-3 py-2 bg-[#241212] hover:bg-[#351717] border border-[#351717] rounded-lg text-left text-xs text-[#F5EEEE] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="truncate">@lucas_tech</span>
            </button>
            <button
              id="demo-login-beatriz"
              type="button"
              onClick={() => handleQuickLogin('usr_beatriz')}
              className="px-3 py-2 bg-[#241212] hover:bg-[#351717] border border-[#351717] rounded-lg text-left text-xs text-[#F5EEEE] flex items-center gap-2 transition-colors cursor-pointer"
            >
              <div className="w-2 h-2 rounded-full bg-rose-500" />
              <span className="truncate">@beatriz_art</span>
            </button>
          </div>

          <div className="mt-3 p-2.5 bg-[#140a0a] rounded-xl border border-[#241212] flex items-center justify-between text-[11px] text-[#A98F8F]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Contas particulares e Admin exigem credenciais</span>
            </span>
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="mt-6 text-center">
          <p className="text-xs text-[#A98F8F]">
            Novo por aqui?{' '}
            <button
              id="login-to-register-link"
              type="button"
              onClick={onNavigateToRegister}
              className="text-[#FF5252] hover:text-[#E53935] font-semibold underline underline-offset-4 transition-colors cursor-pointer"
            >
              Criar uma conta no RedChat
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
