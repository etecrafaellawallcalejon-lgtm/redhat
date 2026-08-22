import React, { useState } from 'react';
import { Message, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import {
  Smile,
  Trash2,
  Copy,
  Check,
  FileText,
  Download,
  CheckCheck,
} from 'lucide-react';
import { motion } from 'motion/react';

interface MessageBubbleProps {
  message: Message;
  sender: User;
  showSenderHeader: boolean;
  onReply?: (message: Message) => void;
}

const COMMON_REACTIONS = ['❤️', '🔥', '👍', '😂', '🚀', '⚡'];

export const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  sender,
  showSenderHeader,
}) => {
  const { user } = useAuth();
  const { toggleReaction, deleteMessage } = useChat();
  const [showPicker, setShowPicker] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMe = message.sender_id === user?.id;

  const formatTime = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleReactionClick = (emoji: string) => {
    toggleReaction(message.id, emoji);
    setShowPicker(false);
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group relative flex gap-3 px-4 py-1.5 hover:bg-[#1A0D0D]/60 transition-colors ${
        showSenderHeader ? 'mt-2.5' : 'mt-0.5'
      }`}
    >
      {/* Sender Avatar */}
      {showSenderHeader ? (
        <img
          src={sender.avatar}
          alt={sender.username}
          className="w-10 h-10 rounded-full object-cover bg-[#241212] border border-[#351717] shrink-0 cursor-pointer"
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="w-10 shrink-0 flex items-center justify-end pr-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] text-[#A98F8F]/60">
            {formatTime(message.timestamp)}
          </span>
        </div>
      )}

      {/* Message Body */}
      <div className="flex-1 min-w-0">
        {showSenderHeader && (
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className={`text-xs font-bold ${
                isMe ? 'text-[#FF5252]' : 'text-[#F5EEEE]'
              } hover:underline cursor-pointer`}
            >
              @{sender.username}
            </span>
            <span className="text-[10px] text-[#A98F8F]/60">
              {new Date(message.timestamp).toLocaleDateString([], {
                day: '2-digit',
                month: '2-digit',
              })}{' '}
              às {formatTime(message.timestamp)}
            </span>
          </div>
        )}

        {/* Message Text Content */}
        {message.content && (
          <p className="text-sm text-[#F5EEEE] leading-relaxed whitespace-pre-wrap break-words selection:bg-[#E53935] selection:text-white">
            {message.content}
          </p>
        )}

        {/* Attachment Card if present */}
        {message.attachment_url && (
          <div className="mt-2 max-w-sm rounded-xl overflow-hidden border border-[#351717] bg-[#140a0a]">
            {message.attachment_type?.startsWith('image/') ? (
              <img
                src={message.attachment_url}
                alt={message.attachment_name || 'Anexo'}
                className="max-h-64 w-auto object-cover rounded-lg"
              />
            ) : (
              <div className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#241212] flex items-center justify-center text-[#FF5252] shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-[#F5EEEE] truncate">
                    {message.attachment_name || 'arquivo_anexo'}
                  </p>
                  <p className="text-[10px] text-[#A98F8F]">Anexo compartilhado</p>
                </div>
                <a
                  href={message.attachment_url}
                  download={message.attachment_name || 'download'}
                  className="p-2 rounded-lg hover:bg-[#241212] text-[#A98F8F] hover:text-[#F5EEEE] transition-colors"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {message.reactions.map((r, idx) => {
              const hasReacted = user && r.user_ids.includes(user.id);
              return (
                <button
                  key={idx}
                  onClick={() => handleReactionClick(r.emoji)}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs border transition-all cursor-pointer ${
                    hasReacted
                      ? 'bg-[#351717] border-[#E53935] text-[#FF5252]'
                      : 'bg-[#140a0a] border-[#241212] text-[#A98F8F] hover:bg-[#241212] hover:text-[#F5EEEE]'
                  }`}
                >
                  <span>{r.emoji}</span>
                  <span className="text-[10px] font-semibold">{r.user_ids.length}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Status indicator for user's own message */}
      {isMe && (
        <div className="shrink-0 self-end pb-1 text-[#A98F8F]/70">
          {message.status === 'read' ? (
            <CheckCheck className="w-3.5 h-3.5 text-[#FF5252]" title="Lida" />
          ) : (
            <Check className="w-3.5 h-3.5" title="Enviada" />
          )}
        </div>
      )}

      {/* Hover Action Bar (Discord-style) */}
      <div className="absolute right-4 -top-3.5 hidden group-hover:flex items-center bg-[#1A0D0D] border border-[#351717] rounded-lg shadow-xl px-1 py-0.5 z-10 text-[#A98F8F]">
        {/* Quick Reaction Emoji */}
        <div className="relative">
          <button
            onClick={() => setShowPicker(!showPicker)}
            className="p-1.5 hover:text-[#FF5252] hover:bg-[#241212] rounded-md transition-colors cursor-pointer"
            title="Adicionar Reação"
          >
            <Smile className="w-3.5 h-3.5" />
          </button>

          {showPicker && (
            <div className="absolute right-0 bottom-full mb-1 bg-[#140a0a] border border-[#351717] rounded-xl p-1.5 shadow-2xl flex items-center gap-1 z-30">
              {COMMON_REACTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReactionClick(emoji)}
                  className="p-1 hover:scale-125 transition-transform text-sm cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Copy text */}
        <button
          onClick={handleCopy}
          className="p-1.5 hover:text-[#F5EEEE] hover:bg-[#241212] rounded-md transition-colors cursor-pointer"
          title="Copiar texto"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        {/* Delete button if author */}
        {isMe && (
          <button
            onClick={() => deleteMessage(message.id)}
            className="p-1.5 hover:text-[#E53935] hover:bg-[#241212] rounded-md transition-colors cursor-pointer"
            title="Apagar mensagem"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
