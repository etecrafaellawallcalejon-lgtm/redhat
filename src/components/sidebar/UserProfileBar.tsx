import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { UserStatus } from '../../types';
import { Mic, MicOff, Headphones, Settings, Circle, Check, Edit3, LogOut, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UserProfileBarProps {
  onOpenSettings: () => void;
  onOpenAdmin?: () => void;
}

export const UserProfileBar: React.FC<UserProfileBarProps> = ({ onOpenSettings, onOpenAdmin }) => {
  const { user, isAdmin, updateStatus, logout } = useAuth();
  const [isStatusMenuOpen, setIsStatusMenuOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [editingCustomStatus, setEditingCustomStatus] = useState(false);
  const [customStatusInput, setCustomStatusInput] = useState(user?.custom_status || '');
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomStatusInput(user?.custom_status || '');
  }, [user?.custom_status]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsStatusMenuOpen(false);
        setEditingCustomStatus(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const getStatusColor = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'bg-emerald-500';
      case 'idle':
        return 'bg-amber-500';
      case 'dnd':
        return 'bg-[#E53935]';
      case 'offline':
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: UserStatus) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'idle':
        return 'Ausente';
      case 'dnd':
        return 'Não Perturbar';
      case 'offline':
      default:
        return 'Invisível / Offline';
    }
  };

  const handleStatusSelect = async (status: UserStatus) => {
    await updateStatus(status, user.custom_status);
    setIsStatusMenuOpen(false);
  };

  const handleSaveCustomStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateStatus(user.status, customStatusInput);
    setEditingCustomStatus(false);
    setIsStatusMenuOpen(false);
  };

  return (
    <div
      id="user-profile-bar"
      className="h-14 bg-[#140a0a] px-2.5 flex items-center justify-between border-t border-[#241212] relative select-none"
    >
      {/* User Info & Status Trigger */}
      <div
        id="user-profile-trigger"
        onClick={() => setIsStatusMenuOpen(!isStatusMenuOpen)}
        className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#241212] transition-colors cursor-pointer min-w-0 flex-1 mr-1"
        title="Alterar status de presença"
      >
        {/* Avatar with status indicator */}
        <div className="relative shrink-0">
          <img
            src={user.avatar}
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover bg-[#241212] border border-[#351717]"
            referrerPolicy="no-referrer"
          />
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#140a0a] ${getStatusColor(
              user.status
            )}`}
          />
        </div>

        {/* Username & Status Subtext */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[#F5EEEE] truncate leading-tight flex items-center gap-1">
            <span>@{user.username}</span>
            {isAdmin && (
              <span className="inline-flex items-center text-amber-400" title="Administrador Master">
                <Crown className="w-3 h-3" />
              </span>
            )}
          </p>
          <p className="text-[10px] text-[#A98F8F] truncate leading-tight mt-0.5">
            {user.custom_status || getStatusLabel(user.status)}
          </p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex items-center gap-0.5 shrink-0">
        <button
          id="user-mic-toggle-button"
          onClick={() => setIsMuted(!isMuted)}
          className={`p-1.5 rounded-md hover:bg-[#241212] transition-colors cursor-pointer ${
            isMuted ? 'text-[#E53935]' : 'text-[#A98F8F] hover:text-[#F5EEEE]'
          }`}
          title={isMuted ? 'Microfone desativado' : 'Desativar microfone'}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        <button
          id="user-deafen-toggle-button"
          onClick={() => setIsDeafened(!isDeafened)}
          className={`p-1.5 rounded-md hover:bg-[#241212] transition-colors cursor-pointer ${
            isDeafened ? 'text-[#E53935]' : 'text-[#A98F8F] hover:text-[#F5EEEE]'
          }`}
          title={isDeafened ? 'Áudio ensurdecido' : 'Ensurdecer'}
        >
          <Headphones className="w-4 h-4" />
        </button>

        <button
          id="user-settings-bar-button"
          onClick={onOpenSettings}
          className="p-1.5 rounded-md text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#241212] transition-colors cursor-pointer"
          title="Configurações do Usuário"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Status Popover Menu */}
      <AnimatePresence>
        {isStatusMenuOpen && (
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            id="status-popover-menu"
            className="absolute bottom-16 left-2 w-64 bg-[#1A0D0D] border border-[#351717] rounded-xl shadow-2xl p-2 z-50 text-[#F5EEEE]"
          >
            <div className="px-2 py-1.5 border-b border-[#351717] mb-1.5">
              <span className="text-[10px] font-bold text-[#A98F8F] uppercase tracking-wider">
                Definir Status
              </span>
            </div>

            {/* Status Options */}
            <div className="space-y-1">
              <button
                id="status-opt-online"
                onClick={() => handleStatusSelect('online')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#241212] text-xs text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Online</span>
                </div>
                {user.status === 'online' && <Check className="w-3.5 h-3.5 text-[#FF5252]" />}
              </button>

              <button
                id="status-opt-idle"
                onClick={() => handleStatusSelect('idle')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#241212] text-xs text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Ausente</span>
                </div>
                {user.status === 'idle' && <Check className="w-3.5 h-3.5 text-[#FF5252]" />}
              </button>

              <button
                id="status-opt-dnd"
                onClick={() => handleStatusSelect('dnd')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#241212] text-xs text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#E53935]" />
                  <span>Não Perturbar</span>
                </div>
                {user.status === 'dnd' && <Check className="w-3.5 h-3.5 text-[#FF5252]" />}
              </button>

              <button
                id="status-opt-offline"
                onClick={() => handleStatusSelect('offline')}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#241212] text-xs text-left cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-500" />
                  <span>Invisível</span>
                </div>
                {user.status === 'offline' && <Check className="w-3.5 h-3.5 text-[#FF5252]" />}
              </button>
            </div>

            {/* Custom Status Editor */}
            <div className="mt-2 pt-2 border-t border-[#351717]">
              {editingCustomStatus ? (
                <form onSubmit={handleSaveCustomStatus} className="space-y-1.5">
                  <input
                    type="text"
                    autoFocus
                    value={customStatusInput}
                    onChange={(e) => setCustomStatusInput(e.target.value)}
                    placeholder="O que está acontecendo?"
                    className="w-full px-2.5 py-1.5 bg-[#241212] border border-[#351717] rounded-lg text-xs text-[#F5EEEE] placeholder-[#A98F8F]/50 focus:outline-none focus:border-[#E53935]"
                  />
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingCustomStatus(false)}
                      className="px-2 py-1 text-[11px] text-[#A98F8F] hover:text-[#F5EEEE]"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 bg-[#E53935] hover:bg-[#FF5252] text-white text-[11px] font-semibold rounded-md"
                    >
                      Salvar
                    </button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setEditingCustomStatus(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#241212] text-xs text-[#A98F8F] hover:text-[#F5EEEE] transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#FF5252]" />
                  <span className="truncate">
                    {user.custom_status ? `"${user.custom_status}"` : 'Definir status personalizado...'}
                  </span>
                </button>
              )}
            </div>

            {/* Admin Panel Quick Trigger */}
            {isAdmin && onOpenAdmin && (
              <div className="mt-2 pt-2 border-t border-[#351717]">
                <button
                  onClick={() => {
                    setIsStatusMenuOpen(false);
                    onOpenAdmin();
                  }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-xs text-amber-300 transition-colors cursor-pointer"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">Painel de Admin Master 👑</span>
                </button>
              </div>
            )}

            {/* Quick Logout */}
            <div className="mt-2 pt-2 border-t border-[#351717]">
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#351717] text-xs text-[#E53935] hover:text-[#FF5252] transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
