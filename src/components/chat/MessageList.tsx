import React, { useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { MessageBubble } from './MessageBubble';
import { MessageSquare, Users, Globe, Hash } from 'lucide-react';

export const MessageList: React.FC = () => {
  const {
    messages,
    activeTarget,
    activeConversation,
    activeGroup,
    isPartnerTyping,
    groupTypingUsernames,
    isLoadingMessages,
  } = useChat();
  const { user } = useAuth();
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    bottomRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom('auto');
  }, [activeTarget?.id]);

  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages.length, isPartnerTyping, groupTypingUsernames.length]);

  if (!activeTarget) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[#120707]">
        <div className="w-16 h-16 rounded-2xl bg-[#1A0D0D] border border-[#351717] flex items-center justify-center text-[#FF5252] shadow-2xl mb-4">
          <MessageSquare className="w-8 h-8 fill-[#E53935]/20 text-[#E53935]" />
        </div>
        <h3 className="text-lg font-bold text-[#F5EEEE] mb-1">Bem-vindo ao RedChat</h3>
        <p className="text-xs text-[#A98F8F] max-w-sm">
          Selecione o Chat Geral, um grupo ou uma conversa direta para interagir em tempo real.
        </p>
      </div>
    );
  }

  const isGroup = activeTarget.isGroup;
  const partner = activeTarget.partner;
  const group = activeTarget.group;

  return (
    <div
      id="message-list-scroll-area"
      className="flex-1 overflow-y-auto px-2 py-4 space-y-1 bg-[#120707] custom-scrollbar"
    >
      {/* Header Banner inside chat */}
      <div className="px-4 py-8 mb-4 border-b border-[#241212] flex flex-col items-center text-center">
        {isGroup && group ? (
          <>
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-3xl font-bold border-4 border-[#120707] shadow-[0_0_25px_rgba(229,57,53,0.35)] mb-3"
              style={{ backgroundColor: group.icon_color || '#E53935' }}
            >
              {group.is_general ? '🔴' : <Hash className="w-10 h-10" />}
            </div>
            <h2 className="text-xl font-bold text-[#F5EEEE] flex items-center gap-2 justify-center">
              <span>{group.name}</span>
              {group.is_general && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#E53935]/30 text-[#FF5252] font-semibold border border-[#E53935]/50">
                  Canal Oficial
                </span>
              )}
            </h2>
            <p className="text-xs text-[#A98F8F] mt-1 max-w-md">
              {group.description || 'Canal de comunicação aberto para membros autorizados.'}
            </p>
            <div className="mt-3 flex items-center gap-1.5 px-3 py-1 bg-[#1a0d0d] border border-[#351717] rounded-full text-xs text-[#A98F8F]">
              <Users className="w-3.5 h-3.5 text-[#FF5252]" />
              <span>{group.member_ids.length} participantes conectados</span>
            </div>
          </>
        ) : partner ? (
          <>
            <div className="relative inline-block mb-3">
              <img
                src={partner.avatar}
                alt={partner.username}
                className="w-20 h-20 rounded-full object-cover bg-[#1A0D0D] border-4 border-[#120707] shadow-[0_0_20px_rgba(165,29,32,0.35)]"
                referrerPolicy="no-referrer"
              />
            </div>
            <h2 className="text-xl font-bold text-[#F5EEEE]">
              Início do histórico com <span className="text-[#FF5252]">@{partner.username}</span>
            </h2>
            <p className="text-xs text-[#A98F8F] mt-1 max-w-md">
              Envie mensagens em tempo real, faça chamadas de áudio/vídeo e compartilhe sua tela.
            </p>
            {partner.bio && (
              <div className="mt-3 p-3 bg-[#1A0D0D] border border-[#351717] rounded-xl text-xs text-[#F5EEEE]/90 max-w-md text-left">
                <span className="text-[10px] text-[#A98F8F] uppercase font-bold tracking-wider block mb-1">
                  Sobre mim
                </span>
                {partner.bio}
              </div>
            )}
          </>
        ) : null}
      </div>

      {isLoadingMessages ? (
        <div className="py-12 flex justify-center items-center">
          <div className="w-6 h-6 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        messages.map((msg, index) => {
          const prevMsg = messages[index - 1];
          const isSameSender = prevMsg && prevMsg.sender_id === msg.sender_id;
          const timeDiff = prevMsg
            ? new Date(msg.timestamp).getTime() - new Date(prevMsg.timestamp).getTime()
            : Infinity;
          const isWithinFiveMins = timeDiff < 5 * 60 * 1000;
          const showSenderHeader = !isSameSender || !isWithinFiveMins;

          // Find sender info
          let senderUser = msg.sender;
          if (!senderUser) {
            if (msg.sender_id === user?.id) senderUser = user;
            else if (partner && msg.sender_id === partner.id) senderUser = partner;
          }

          const fallbackSender = senderUser || {
            id: msg.sender_id,
            username: 'membro',
            email: '',
            avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=user&backgroundColor=1a0d0d',
            status: 'online',
            custom_status: '',
            bio: '',
            created_at: '',
            last_seen: '',
          };

          return (
            <MessageBubble
              key={msg.id}
              message={msg}
              sender={fallbackSender}
              showSenderHeader={showSenderHeader}
            />
          );
        })
      )}

      {/* Typing Indicators */}
      {isPartnerTyping && partner && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-[#A98F8F] animate-pulse">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5252] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5252] animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5252] animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span>
            <strong className="text-[#F5EEEE]">@{partner.username}</strong> está digitando...
          </span>
        </div>
      )}

      {groupTypingUsernames.length > 0 && isGroup && (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-[#A98F8F] animate-pulse">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5252] animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5252] animate-bounce" style={{ animationDelay: '150ms' }} />
          </div>
          <span>Alguém está digitando no grupo...</span>
        </div>
      )}

      <div ref={bottomRef} className="h-2" />
    </div>
  );
};
