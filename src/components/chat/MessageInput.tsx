import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '../../context/ChatContext';
import {
  Send,
  Paperclip,
  Smile,
  X,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const EMOJI_PALETTE = [
  '❤️', '🔥', '👍', '😂', '🚀', '⚡', '✨', '🎉',
  '😎', '👋', '💯', '🙌', '👀', '💡', '🤖', '🔴',
  '☕', '💻', '🎮', '🎯', '🌟', '💪', '🏆', '🍕',
];

export const MessageInput: React.FC = () => {
  const { activeTarget, sendMessage, sendTyping } = useChat();
  const [content, setContent] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachment, setAttachment] = useState<{
    url: string;
    name: string;
    type: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimerRef = useRef<any>(null);
  const isTypingRef = useRef<boolean>(false);

  useEffect(() => {
    setContent('');
    setAttachment(null);
    setShowEmojiPicker(false);
  }, [activeTarget?.id]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);

    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTyping(true);
    }

    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTyping(false);
    }, 2000);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmed = content.trim();
    if (!trimmed && !attachment) return;

    sendMessage(trimmed, attachment || undefined);
    setContent('');
    setAttachment(null);
    setShowEmojiPicker(false);

    if (isTypingRef.current) {
      isTypingRef.current = false;
      sendTyping(false);
    }

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        url: reader.result as string,
        name: file.name,
        type: file.type,
      });
    };
    reader.readAsDataURL(file);

    e.target.value = '';
  };

  const insertEmoji = (emoji: string) => {
    setContent((prev) => prev + emoji);
    setShowEmojiPicker(false);
    textareaRef.current?.focus();
  };

  if (!activeTarget) return null;

  const placeholderText = activeTarget.isGroup
    ? `Enviar mensagem em ${activeTarget.name}...`
    : `Conversar com @${activeTarget.name}...`;

  return (
    <div id="chat-message-input-container" className="p-4 bg-[#120707] shrink-0">
      {/* Attachment Preview Chip */}
      {attachment && (
        <div className="mb-2 p-2.5 bg-[#1A0D0D] border border-[#351717] rounded-xl flex items-center justify-between max-w-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            {attachment.type.startsWith('image/') ? (
              <img
                src={attachment.url}
                alt="preview"
                className="w-10 h-10 rounded-lg object-cover bg-black shrink-0"
              />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#241212] flex items-center justify-center text-[#FF5252] shrink-0">
                <FileCode className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-[#F5EEEE] truncate">{attachment.name}</p>
              <p className="text-[10px] text-[#A98F8F]">Pronto para enviar</p>
            </div>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="p-1 rounded-md text-[#A98F8F] hover:text-[#E53935] hover:bg-[#241212] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative bg-[#1A0D0D] border border-[#351717] rounded-xl focus-within:border-[#A51D20] focus-within:shadow-[0_0_15px_rgba(165,29,32,0.25)] transition-all flex items-center p-2 gap-2 shadow-lg">
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileSelected}
          accept="image/*,application/pdf,text/*"
        />

        {/* Attachment Button */}
        <button
          id="btn-attach-file"
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-lg text-[#A98F8F] hover:text-[#FF5252] hover:bg-[#241212] transition-colors cursor-pointer shrink-0"
          title="Anexar imagem ou arquivo"
        >
          <Paperclip className="w-4 h-4" />
        </button>

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          id="chat-textarea-input"
          value={content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={placeholderText}
          className="flex-1 bg-transparent text-[#F5EEEE] placeholder-[#A98F8F] text-sm focus:outline-none resize-none py-1 max-h-32 min-h-[36px] custom-scrollbar"
        />

        {/* Emoji Button */}
        <div className="relative shrink-0">
          <button
            id="btn-emoji-picker-toggle"
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              showEmojiPicker
                ? 'bg-[#351717] text-[#FF5252]'
                : 'text-[#A98F8F] hover:text-[#FF5252] hover:bg-[#241212]'
            }`}
            title="Escolher emoji"
          >
            <Smile className="w-4 h-4" />
          </button>

          {/* Emoji Popover */}
          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 bottom-full mb-3 w-64 bg-[#140a0a] border border-[#351717] rounded-xl shadow-2xl p-3 z-30"
              >
                <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#241212]">
                  <span className="text-[10px] font-bold text-[#A98F8F] uppercase tracking-wider">
                    Emojis Rápidos
                  </span>
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-[#A98F8F] hover:text-[#F5EEEE]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {EMOJI_PALETTE.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => insertEmoji(emoji)}
                      className="p-1.5 text-base hover:bg-[#241212] rounded-lg hover:scale-125 transition-all text-center cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Send Button */}
        <button
          id="btn-send-message"
          type="button"
          onClick={handleSend}
          disabled={!content.trim() && !attachment}
          className="bg-[#A51D20] hover:bg-[#E53935] text-white px-3 py-2 rounded-lg flex items-center gap-1.5 text-xs font-bold transition-all shadow-[0_0_12px_rgba(165,29,32,0.35)] cursor-pointer active:scale-95 disabled:opacity-40 shrink-0"
          title="Enviar mensagem (Enter)"
        >
          <Send className="w-3.5 h-3.5" />
          <span className="hidden sm:inline tracking-wider">ENVIAR</span>
        </button>
      </div>

      <div className="flex items-center justify-between px-2 pt-1 text-[10px] text-[#A98F8F]/60">
        <span>Pressione <strong>Enter</strong> para enviar, <strong>Shift + Enter</strong> para nova linha</span>
        <span className="flex items-center gap-1 text-[#FF5252]/80 font-mono">
          <Sparkles className="w-2.5 h-2.5" /> WebSocket Ativo
        </span>
      </div>
    </div>
  );
};
