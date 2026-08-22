import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useChat } from '../../context/ChatContext';
import { User, UserStatus } from '../../types';
import { Search, X, MessageSquare, Sparkles, UserCheck, Crown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SearchUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SearchUsersModal: React.FC<SearchUsersModalProps> = ({ isOpen, onClose }) => {
  const { startConversationWithUser } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const timer = setTimeout(() => {
      handleSearch(query);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleSearch = async (searchTerm: string) => {
    try {
      setIsLoading(true);
      const data = await api.searchUsers(searchTerm);
      setResults(data.users);
    } catch (err) {
      console.error('Search users error', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async (user: User) => {
    await startConversationWithUser(user.id);
    onClose();
  };

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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg bg-[#1A0D0D] border border-[#351717] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="p-4 border-b border-[#241212] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#E53935] flex items-center justify-center text-white">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#F5EEEE]">Explorar & Iniciar Conversa</h3>
              <p className="text-[11px] text-[#A98F8F]">Busque por @username ou e-mail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#A98F8F] hover:text-[#F5EEEE] hover:bg-[#241212] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-[#241212] bg-[#140a0a]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A98F8F]" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite o nome de usuário (ex: alex, lucas, beatriz)..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#241212] border border-[#351717] rounded-xl text-sm text-[#F5EEEE] placeholder-[#A98F8F]/50 focus:outline-none focus:border-[#E53935] transition-all"
            />
          </div>
        </div>

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar min-h-[220px]">
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-[#E53935] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : results.length === 0 ? (
            <div className="py-10 text-center">
              <p className="text-xs text-[#A98F8F]">
                {query ? 'Nenhum usuário encontrado com este termo.' : 'Digite um termo para pesquisar ou explore os usuários cadastrados.'}
              </p>
            </div>
          ) : (
            results.map((user) => (
              <div
                key={user.id}
                className="p-3 bg-[#241212] hover:bg-[#351717] border border-[#351717] rounded-xl flex items-center justify-between transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                  <div className="relative shrink-0">
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-10 h-10 rounded-full object-cover bg-[#1A0D0D] border border-[#351717]"
                      referrerPolicy="no-referrer"
                    />
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#241212] ${getStatusColor(
                        user.status
                      )}`}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-[#F5EEEE] truncate flex items-center gap-1">
                      <span>@{user.username}</span>
                      {(user.role === 'admin' || user.is_admin || user.username === 'admin') && (
                        <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Administrador Master" />
                      )}
                    </h4>
                    <p className="text-[11px] text-[#A98F8F] truncate mt-0.5">
                      {user.custom_status || user.bio || user.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleStartChat(user)}
                  className="px-3 py-1.5 bg-[#E53935] hover:bg-[#FF5252] text-white text-xs font-semibold rounded-lg shadow-md shadow-[#E53935]/20 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Mensagem</span>
                </button>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
