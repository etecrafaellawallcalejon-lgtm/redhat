import React from 'react';
import { useChat } from '../../context/ChatContext';
import { UserStatus } from '../../types';
import {
  Phone,
  Video,
  Search,
  PanelRight,
  Menu,
  Crown,
  Users,
  Hash,
  Globe,
} from 'lucide-react';

interface ChatHeaderProps {
  onToggleMobileSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onToggleMobileSidebar }) => {
  const {
    activeTarget,
    activeConversation,
    activeGroup,
    activeView,
    isUserDrawerOpen,
    toggleUserDrawer,
    openUserDrawer,
    startCall,
  } = useChat();

  if (!activeTarget) {
    return (
      <div className="h-14 px-4 bg-[#120707] border-b border-[#241212] flex items-center justify-between z-10">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-1.5 rounded-lg text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#241212]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="text-xs text-[#A98F8F]">Selecione uma conversa ou grupo</span>
      </div>
    );
  }

  const isGroup = activeTarget.isGroup;
  const partner = activeTarget.partner;
  const group = activeTarget.group;

  const isPartnerAdmin = partner?.role === 'admin' || partner?.is_admin || partner?.username === 'admin';

  const getStatusColor = (status?: UserStatus) => {
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

  const getStatusText = (status?: UserStatus) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'idle':
        return 'Ausente';
      case 'dnd':
        return 'Não Perturbar';
      case 'offline':
      default:
        return 'Offline';
    }
  };

  const handleAudioCall = () => {
    if (partner) {
      startCall(partner, 'audio');
    }
  };

  const handleVideoCall = () => {
    if (partner) {
      startCall(partner, 'video');
    }
  };

  return (
    <div id="chat-header-container" className="flex flex-col shrink-0">
      {/* Top Header Bar */}
      <div className="h-14 px-4 bg-[#120707] border-b border-[#241212] flex items-center justify-between z-10 shadow-sm">
        {/* Left Side: Mobile Menu + Channel/Partner Info */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="btn-mobile-sidebar-toggle"
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 rounded-lg text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#241212] transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          {isGroup && group ? (
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
                style={{ backgroundColor: group.icon_color || '#A51D20' }}
              >
                {group.is_general ? <Globe className="w-5 h-5" /> : <Hash className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-[#F5EEEE] truncate">{group.name}</h3>
                  {group.is_general && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#A51D20]/30 text-[#FF5252] font-semibold border border-[#A51D20]/40">
                      Geral
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-[#A98F8F] truncate flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>{group.member_ids.length} membros</span>
                  {group.description && <span className="hidden sm:inline">• {group.description}</span>}
                </div>
              </div>
            </div>
          ) : partner ? (
            <div
              onClick={() => openUserDrawer(partner)}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
            >
              <div className="relative">
                <img
                  src={partner.avatar}
                  alt={partner.username}
                  className="w-9 h-9 rounded-full object-cover border border-[#351717]"
                />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#120707] ${getStatusColor(
                    partner.status
                  )}`}
                />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-sm text-[#F5EEEE] group-hover:text-[#FF5252] transition-colors truncate">
                    @{partner.username}
                  </h3>
                  {isPartnerAdmin && (
                    <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Administrador Master" />
                  )}
                </div>
                <div className="text-[11px] text-[#A98F8F] truncate">
                  {partner.custom_status || getStatusText(partner.status)}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right Side: Action Icons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {!isGroup && partner && (
            <>
              <button
                id="chat-header-voice-call-button"
                onClick={handleAudioCall}
                className="p-2 rounded-xl text-[#A98F8F] hover:text-[#FF5252] hover:bg-[#1A0D0D] border border-transparent hover:border-[#351717] transition-all cursor-pointer"
                title="Iniciar Chamada de Voz"
              >
                <Phone className="w-4 h-4" />
              </button>

              <button
                id="chat-header-video-call-button"
                onClick={handleVideoCall}
                className="p-2 rounded-xl text-[#A98F8F] hover:text-[#FF5252] hover:bg-[#1A0D0D] border border-transparent hover:border-[#351717] transition-all cursor-pointer"
                title="Iniciar Chamada de Vídeo"
              >
                <Video className="w-4 h-4" />
              </button>

              <div className="w-[1px] h-5 bg-[#241212] mx-1" />
            </>
          )}

          <button
            id="chat-header-user-info-button"
            onClick={() => {
              if (partner) openUserDrawer(partner);
              else toggleUserDrawer();
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer border ${
              isUserDrawerOpen
                ? 'bg-[#351717] text-[#FF5252] border-[#A51D20]'
                : 'text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#1A0D0D] border-transparent'
            }`}
            title="Ver Detalhes do Perfil"
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
