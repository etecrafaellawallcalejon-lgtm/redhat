import React from 'react';
import { Conversation, UserStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Check, CheckCheck, Crown } from 'lucide-react';

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
}) => {
  const { user } = useAuth();
  const { partner, last_message, unread_count } = conversation;
  const isPartnerAdmin = partner.role === 'admin' || partner.is_admin || partner.username === 'admin';

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

  const formatTimestamp = (isoDate?: string) => {
    if (!isoDate) return '';
    const date = new Date(isoDate);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
  };

  const isSentByMe = last_message?.sender_id === user?.id;

  return (
    <div
      id={`conversation-item-${conversation.id}`}
      onClick={onSelect}
      className={`group relative flex items-center gap-3 px-2.5 py-2.5 rounded-xl cursor-pointer transition-all duration-150 ${
        isActive
          ? 'bg-[#351717] text-[#F5EEEE]'
          : 'text-[#A98F8F] hover:bg-[#241212] hover:text-[#F5EEEE]'
      }`}
    >
      {/* Active Left Indicator Bar */}
      {isActive && (
        <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#E53935] rounded-r-full" />
      )}

      {/* Partner Avatar with Presence Dot */}
      <div className="relative shrink-0">
        <img
          src={partner.avatar}
          alt={partner.username}
          className="w-10 h-10 rounded-full object-cover bg-[#1A0D0D] border border-[#351717]"
          referrerPolicy="no-referrer"
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#1A0D0D] ${getStatusColor(
            partner.status
          )}`}
        />
      </div>

      {/* Message Info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <span
            className={`text-xs font-semibold truncate flex items-center gap-1 ${
              isActive ? 'text-[#F5EEEE]' : 'group-hover:text-[#F5EEEE]'
            }`}
          >
            <span>@{partner.username}</span>
            {isPartnerAdmin && (
              <Crown className="w-3 h-3 text-amber-400 shrink-0" title="Administrador Master" />
            )}
          </span>
          {last_message && (
            <span className="text-[10px] text-[#A98F8F]/70 shrink-0">
              {formatTimestamp(last_message.timestamp)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-1">
          <p className="text-[11px] text-[#A98F8F] truncate flex items-center gap-1">
            {isSentByMe && (
              <span className="shrink-0 text-[#FF5252]">
                {last_message?.status === 'read' ? (
                  <CheckCheck className="w-3.5 h-3.5 inline" />
                ) : (
                  <Check className="w-3.5 h-3.5 inline" />
                )}
              </span>
            )}
            <span className="truncate">
              {last_message?.content ||
                (last_message?.attachment_name ? `📎 ${last_message.attachment_name}` : 'Sem mensagens')}
            </span>
          </p>

          {/* Unread Counter Badge */}
          {unread_count > 0 && (
            <span
              id={`unread-badge-${conversation.id}`}
              className="px-1.5 py-0.5 rounded-full bg-[#E53935] text-white text-[10px] font-bold shrink-0 shadow-sm animate-pulse"
            >
              {unread_count}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
