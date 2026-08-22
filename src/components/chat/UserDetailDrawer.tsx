import React from 'react';
import { useChat } from '../../context/ChatContext';
import { UserStatus } from '../../types';
import {
  X,
  Calendar,
  Shield,
  Crown,
  Phone,
  Video,
  Camera,
  Image as ImageIcon,
} from 'lucide-react';
import { motion } from 'motion/react';

export const UserDetailDrawer: React.FC = () => {
  const {
    activeConversation,
    drawerUser,
    isUserDrawerOpen,
    closeUserDrawer,
    posts,
    startCall,
  } = useChat();

  if (!isUserDrawerOpen) return null;

  const targetUser = drawerUser || activeConversation?.partner;
  if (!targetUser) return null;

  const isAdmin = targetUser.role === 'admin' || targetUser.is_admin || targetUser.username === 'admin';

  // Filter photos published by this user (Instagram-style showcase)
  const userPhotos = posts.filter((p) => p.user_id === targetUser.id);

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

  const getStatusLabel = (status?: UserStatus) => {
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

  const formattedJoinDate = new Date(targetUser.created_at || Date.now()).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 320, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2 }}
      id="user-detail-drawer"
      className="bg-[#1A0D0D] border-l border-[#241212] flex flex-col h-full shrink-0 select-none overflow-y-auto custom-scrollbar"
    >
      {/* Header Close */}
      <div className="h-14 px-4 border-b border-[#241212] flex items-center justify-between shadow-sm bg-[#150909]">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#A98F8F]">Perfil do Usuário</h4>
        <button
          onClick={closeUserDrawer}
          className="p-1.5 rounded-lg text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#241212] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Decorative Red Banner */}
      <div className="h-24 bg-gradient-to-r from-[#A51D20] via-[#E53935] to-[#120707] relative shrink-0">
        <div className="absolute top-3 right-3 text-white/20">
          <Camera className="w-8 h-8" />
        </div>
      </div>

      {/* Profile Details */}
      <div className="px-4 pb-6 -mt-12 relative">
        {/* Avatar */}
        <div className="relative inline-block mb-2">
          <img
            src={targetUser.avatar}
            alt={targetUser.username}
            className="w-20 h-20 rounded-full object-cover bg-[#1A0D0D] border-4 border-[#120707] shadow-[0_0_25px_rgba(165,29,32,0.45)]"
            referrerPolicy="no-referrer"
          />
          <span
            className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#120707] ${getStatusColor(
              targetUser.status
            )}`}
          />
        </div>

        {/* User Handle & Status */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <h3 className="text-lg font-bold text-[#F5EEEE]">@{targetUser.username}</h3>
          {isAdmin && (
            <span className="bg-amber-950/80 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/40 flex items-center gap-1 shadow-sm">
              <Crown className="w-3 h-3 text-amber-400" />
              ADMIN
            </span>
          )}
          <span className="bg-[#351717] text-[#FF5252] text-[10px] font-medium px-2 py-0.5 rounded-full border border-[#A51D20]/50">
            {getStatusLabel(targetUser.status)}
          </span>
        </div>

        {targetUser.custom_status && (
          <div className="mt-2 p-2.5 bg-[#120707] border border-[#241212] rounded-xl text-xs text-[#F5EEEE] italic">
            "{targetUser.custom_status}"
          </div>
        )}

        {/* Quick Call Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={() => startCall(targetUser, 'audio')}
            className="py-2 bg-[#241212] hover:bg-[#351717] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-[#351717] cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5 text-[#FF5252]" />
            <span>Áudio</span>
          </button>

          <button
            onClick={() => startCall(targetUser, 'video')}
            className="py-2 bg-[#241212] hover:bg-[#351717] text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all border border-[#351717] cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-[#FF5252]" />
            <span>Vídeo</span>
          </button>
        </div>

        <div className="w-full h-px bg-[#241212] my-4" />

        {/* Instagram Photos Showcase by this User */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A98F8F] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-[#FF5252]" /> Galeria de Fotos ({userPhotos.length})
            </span>
          </div>

          {userPhotos.length === 0 ? (
            <div className="p-3 bg-[#120707] border border-[#241212] rounded-xl text-center text-[11px] text-[#A98F8F]">
              Nenhuma foto publicada ainda.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {userPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg overflow-hidden bg-black border border-[#241212] relative group"
                >
                  <img
                    src={photo.image_url}
                    alt={photo.caption || 'Foto'}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* About Info Cards */}
        <div className="space-y-3 text-xs">
          <div className="bg-[#120707] p-3 rounded-xl border border-[#241212]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A98F8F] block mb-1">
              Sobre mim
            </span>
            <p className="text-[#F5EEEE]/90 leading-relaxed">
              {targetUser.bio || 'Este usuário ainda não adicionou uma biografia.'}
            </p>
          </div>

          <div className="bg-[#120707] p-3 rounded-xl border border-[#241212]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A98F8F] block mb-1">
              Membro RedChat Desde
            </span>
            <div className="flex items-center gap-2 text-[#F5EEEE]/80">
              <Calendar className="w-4 h-4 text-[#FF5252]" />
              <span>{formattedJoinDate}</span>
            </div>
          </div>

          <div className="bg-[#120707] p-3 rounded-xl border border-[#241212]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#A98F8F] block mb-1">
              Segurança & Criptografia
            </span>
            <div className="flex items-center gap-2 text-[#F5EEEE]/80">
              <Shield className="w-4 h-4 text-emerald-500" />
              <span>Comunicação Segura JWT</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#241212]">
          <button
            onClick={closeUserDrawer}
            className="w-full bg-[#241212] hover:bg-[#351717] py-2 rounded-xl text-xs transition-colors border border-[#351717] text-[#F5EEEE] font-medium cursor-pointer"
          >
            Fechar Perfil
          </button>
        </div>
      </div>
    </motion.div>
  );
};
