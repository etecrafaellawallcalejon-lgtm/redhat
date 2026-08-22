import React from 'react';
import { MessageSquare, Camera, UserPlus, Compass, Settings, Volume2, VolumeX, Crown } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';

interface MainIconSidebarProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenAdmin?: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const MainIconSidebar: React.FC<MainIconSidebarProps> = ({
  onOpenSearch,
  onOpenSettings,
  onOpenAdmin,
  soundEnabled,
  onToggleSound,
}) => {
  const { conversations, activeView, setActiveView } = useChat();
  const { isAdmin } = useAuth();
  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  return (
    <div
      id="main-icon-sidebar"
      className="w-[72px] bg-[#0a0404] border-r border-[#241212] flex flex-col items-center py-4 gap-3 shrink-0 select-none z-20"
    >
      {/* Brand / Chat View Button */}
      <div className="relative group">
        {activeView !== 'feed' && (
          <div className="absolute -left-1 top-3.5 w-1 h-5 bg-[#FF5252] rounded-r-full shadow-[0_0_8px_#FF5252]" />
        )}
        <button
          id="sidebar-chat-button"
          onClick={() => setActiveView('group')}
          className={`w-12 h-12 rounded-[16px] flex items-center justify-center text-white font-bold text-xl transition-all transform active:scale-95 cursor-pointer ${
            activeView !== 'feed'
              ? 'bg-[#E53935] shadow-[0_0_20px_rgba(229,57,53,0.5)]'
              : 'bg-[#1A0D0D] hover:bg-[#A51D20] text-[#A98F8F] hover:text-white border border-[#241212]'
          }`}
          title="Bate-papo & Grupos"
        >
          <MessageSquare className="w-6 h-6" />
        </button>
        {totalUnread > 0 && (
          <span
            id="sidebar-total-unread-badge"
            className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-[#FF5252] text-white text-[10px] font-bold rounded-full border-2 border-[#0a0404] shadow-[0_0_8px_#FF5252]"
          >
            {totalUnread > 99 ? '99+' : totalUnread}
          </span>
        )}
      </div>

      {/* Feed / Instagram Photos View Button */}
      <div className="relative group">
        {activeView === 'feed' && (
          <div className="absolute -left-1 top-3.5 w-1 h-5 bg-[#FF5252] rounded-r-full shadow-[0_0_8px_#FF5252]" />
        )}
        <button
          id="sidebar-feed-button"
          onClick={() => setActiveView('feed')}
          className={`w-12 h-12 rounded-full hover:rounded-[16px] flex items-center justify-center transition-all cursor-pointer border ${
            activeView === 'feed'
              ? 'bg-[#E53935] text-white border-[#E53935] shadow-[0_0_20px_rgba(229,57,53,0.5)]'
              : 'bg-[#1A0D0D] hover:bg-[#A51D20] text-[#A98F8F] hover:text-white border-[#241212]'
          }`}
          title="Feed de Fotos (Estilo Instagram)"
        >
          <Camera className="w-5 h-5" />
        </button>
      </div>

      <div className="w-8 h-[2px] bg-[#351717] rounded-full my-0.5" />

      {/* Main Action Icons */}
      <div className="flex-1 flex flex-col items-center gap-3 w-full">
        {/* Admin Crown Button (if Admin) */}
        {isAdmin && (
          <div className="relative group">
            <button
              id="sidebar-admin-panel-button"
              onClick={onOpenAdmin}
              className="w-12 h-12 bg-gradient-to-br from-amber-500/20 to-[#E53935]/30 rounded-full hover:rounded-[16px] hover:from-amber-500 hover:to-[#E53935] text-amber-400 hover:text-white flex items-center justify-center transition-all cursor-pointer border border-amber-500/40 hover:shadow-[0_0_15px_rgba(245,158,11,0.5)]"
              title="Painel de Administração Master 👑"
            >
              <Crown className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* Search / Add Contact */}
        <div className="relative group">
          <button
            id="sidebar-search-users-button"
            onClick={onOpenSearch}
            className="w-12 h-12 bg-[#1A0D0D] rounded-full hover:rounded-[16px] hover:bg-[#A51D20] text-[#A98F8F] hover:text-white flex items-center justify-center transition-all cursor-pointer border border-[#241212] hover:border-[#A51D20] hover:shadow-[0_0_12px_rgba(165,29,32,0.35)]"
            title="Buscar Usuários / Iniciar Conversa"
          >
            <UserPlus className="w-5 h-5" />
          </button>
        </div>

        {/* Explore Community */}
        <div className="relative group">
          <button
            id="sidebar-explore-button"
            onClick={onOpenSearch}
            className="w-12 h-12 bg-[#1A0D0D] rounded-full hover:rounded-[16px] hover:bg-[#241212] hover:border-[#A51D20] text-[#A98F8F] hover:text-[#FF5252] flex items-center justify-center transition-all cursor-pointer border border-[#241212]"
            title="Explorar Comunidade"
          >
            <Compass className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="flex flex-col items-center gap-2.5 mt-auto">
        {/* Sound Toggle */}
        <button
          id="sidebar-toggle-sound-button"
          onClick={onToggleSound}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
            soundEnabled
              ? 'bg-[#1A0D0D] text-[#FF5252] border-[#351717] hover:bg-[#241212]'
              : 'bg-[#1A0D0D] text-[#A98F8F]/40 border-transparent hover:text-[#A98F8F]'
          }`}
          title={soundEnabled ? 'Sons ativados' : 'Sons desativados'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Settings */}
        <button
          id="sidebar-settings-button"
          onClick={onOpenSettings}
          className="w-10 h-10 rounded-xl bg-[#1A0D0D] hover:bg-[#351717] hover:text-[#FF5252] text-[#A98F8F] flex items-center justify-center transition-all cursor-pointer border border-[#241212]"
          title="Configurações do RedChat"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
