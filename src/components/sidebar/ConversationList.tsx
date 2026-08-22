import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext';
import { ConversationItem } from './ConversationItem';
import { UserProfileBar } from './UserProfileBar';
import { Search, Plus, MessageSquarePlus, Users, Hash, Globe, Radio } from 'lucide-react';
import { CreateGroupModal } from '../modals/CreateGroupModal';

interface ConversationListProps {
  onOpenSearch: () => void;
  onOpenSettings: () => void;
  onOpenAdmin?: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  onOpenSearch,
  onOpenSettings,
  onOpenAdmin,
}) => {
  const {
    conversations,
    activeConversation,
    selectConversation,
    groups,
    activeGroup,
    selectGroup,
    activeView,
    isLoadingConversations,
  } = useChat();

  const [filterQuery, setFilterQuery] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const generalGroup = groups.find((g) => g.is_general || g.id === 'group_general');
  const customGroups = groups.filter((g) => !g.is_general && g.id !== 'group_general');

  const filteredConversations = conversations.filter((c) => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      c.partner.username.toLowerCase().includes(q) ||
      (c.partner.custom_status && c.partner.custom_status.toLowerCase().includes(q))
    );
  });

  const filteredGroups = customGroups.filter((g) => {
    const q = filterQuery.trim().toLowerCase();
    if (!q) return true;
    return g.name.toLowerCase().includes(q) || g.description.toLowerCase().includes(q);
  });

  return (
    <div
      id="conversation-list-container"
      className="w-64 lg:w-72 bg-[#1A0D0D] border-r border-[#241212] flex flex-col h-full shrink-0 select-none overflow-hidden"
    >
      {/* Header with Sharp RedChat Title */}
      <div className="h-14 border-b border-[#241212] flex items-center justify-between px-4 shadow-sm bg-[#150909]">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E53935] shadow-[0_0_10px_#E53935]" />
          <h2 className="font-extrabold text-sm tracking-wide text-[#F5EEEE] uppercase">
            RedChat <span className="text-[#FF5252] text-[10px] font-normal lowercase">v2.5</span>
          </h2>
        </div>
        <button
          id="btn-new-conversation"
          onClick={onOpenSearch}
          className="p-1.5 rounded-lg text-[#A98F8F] hover:text-white hover:bg-[#A51D20] transition-colors cursor-pointer"
          title="Buscar usuário / Iniciar conversa"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Header Search Filter */}
      <div className="p-3 border-b border-[#241212]/70 bg-[#120707]/40">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A98F8F]" />
          <input
            id="conversations-filter-input"
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Filtrar conversas e grupos..."
            className="w-full pl-8 pr-3 py-1.5 bg-[#120707] border border-[#351717] rounded-xl text-xs text-[#F5EEEE] placeholder-[#A98F8F]/60 focus:outline-none focus:border-[#A51D20] transition-all"
          />
        </div>
      </div>

      {/* Main List Area */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 custom-scrollbar">
        {/* 1. Chat Geral (Pinned Community Channel) */}
        {generalGroup && (
          <div>
            <div className="px-2 pb-1.5 flex items-center justify-between">
              <span className="text-[#A98F8F] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3 h-3 text-[#FF5252]" /> Comunidade Global
              </span>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E53935] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E53935]" />
              </span>
            </div>

            <div
              id="general-chat-item"
              onClick={() => selectGroup(generalGroup)}
              className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition-all ${
                activeView === 'group' && activeGroup?.id === generalGroup.id
                  ? 'bg-[#A51D20] text-white shadow-[0_0_15px_rgba(165,29,32,0.4)]'
                  : 'hover:bg-[#241212] text-[#F5EEEE] border border-transparent hover:border-[#351717]'
              }`}
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#A51D20] to-[#E53935] flex items-center justify-center text-white font-bold text-base shadow-md shrink-0">
                🔴
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold truncate">Chat Geral</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/30 font-medium text-white/80">
                    Todos
                  </span>
                </div>
                <p className="text-[11px] text-white/70 truncate mt-0.5">
                  {generalGroup.last_message?.content || 'Bate-papo aberto para todos os membros'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. Custom Groups Section */}
        <div>
          <div className="px-2 pb-1.5 flex items-center justify-between">
            <span className="text-[#A98F8F] text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Grupos ({customGroups.length})
            </span>
            <button
              onClick={() => setIsCreateGroupOpen(true)}
              className="p-1 rounded hover:bg-[#241212] text-[#A98F8F] hover:text-white transition-colors cursor-pointer"
              title="Criar novo grupo"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1">
            {filteredGroups.length === 0 ? (
              <div className="px-3 py-2 text-[11px] text-[#A98F8F]/60 text-center bg-[#120707]/30 rounded-lg">
                Nenhum grupo adicional. Clique em "+" para criar um!
              </div>
            ) : (
              filteredGroups.map((grp) => {
                const isActive = activeView === 'group' && activeGroup?.id === grp.id;
                return (
                  <div
                    key={grp.id}
                    onClick={() => selectGroup(grp)}
                    className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#A51D20] text-white shadow-[0_0_12px_rgba(165,29,32,0.35)]'
                        : 'hover:bg-[#241212] text-[#F5EEEE]'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                      style={{ backgroundColor: grp.icon_color || '#A51D20' }}
                    >
                      <Hash className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold truncate">{grp.name}</span>
                        <span className="text-[10px] text-[#A98F8F]">{grp.member_ids.length}p</span>
                      </div>
                      <p className="text-[10px] text-white/60 truncate">
                        {grp.last_message?.content || grp.description || 'Canal criado'}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 3. Direct 1-on-1 Messages */}
        <div>
          <div className="px-2 pb-1.5 flex items-center justify-between">
            <span className="text-[#A98F8F] text-[10px] font-bold uppercase tracking-wider">
              Mensagens Diretas
            </span>
            <span className="text-[10px] px-1.5 py-0.2 bg-[#241212] text-[#FF5252] rounded font-semibold border border-[#351717]">
              {conversations.length}
            </span>
          </div>

          <div className="space-y-1">
            {isLoadingConversations ? (
              <div className="p-3 space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-[#241212]" />
                    <div className="flex-1 space-y-1">
                      <div className="w-20 h-2.5 bg-[#241212] rounded" />
                      <div className="w-28 h-2 bg-[#241212] rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="px-3 py-4 text-center bg-[#120707]/30 rounded-xl">
                <p className="text-xs text-[#F5EEEE] font-semibold">Nenhuma conversa direta</p>
                <button
                  onClick={onOpenSearch}
                  className="mt-2 text-[11px] text-[#FF5252] hover:underline"
                >
                  Buscar contatos
                </button>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={activeView === 'direct' && activeConversation?.id === conv.id}
                  onSelect={() => selectConversation(conv)}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Pinned Bottom User Bar */}
      <UserProfileBar onOpenSettings={onOpenSettings} onOpenAdmin={onOpenAdmin} />

      {/* Create Group Modal */}
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </div>
  );
};
