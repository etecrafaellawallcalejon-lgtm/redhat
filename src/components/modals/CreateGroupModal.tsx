import React, { useState, useEffect } from 'react';
import { X, Users, Check, Sparkles, Image as ImageIcon } from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { User } from '../../types';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_COLORS = ['#E53935', '#A51D20', '#D32F2F', '#C2185B', '#7B1FA2', '#303F9F', '#0288D1', '#00796B', '#388E3C', '#F57C00'];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({ isOpen, onClose }) => {
  const { createGroup } = useChat();
  const { user: currentUser } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconColor, setIconColor] = useState('#E53935');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName('');
      setDescription('');
      setIconColor('#E53935');
      setAvatarUrl('');
      setSelectedUserIds([]);
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      const data = await api.searchUsers('');
      setAvailableUsers(data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await createGroup({
        name: name.trim(),
        description: description.trim(),
        avatar: avatarUrl || undefined,
        icon_color: iconColor,
        member_ids: selectedUserIds,
      });
      onClose();
    } catch (err) {
      console.error('Error creating group:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="create-group-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        id="create-group-modal-container"
        className="w-full max-w-lg bg-[#1a0d0d] border border-[#351717] rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#241212] bg-[#120707]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#A51D20]/30 border border-[#A51D20] flex items-center justify-center text-[#FF5252]">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Criar Novo Grupo</h2>
              <p className="text-xs text-[#A98F8F]">Reúna sua equipe ou amigos em um canal exclusivo</p>
            </div>
          </div>
          <button
            id="close-create-group-modal"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#241212] text-[#A98F8F] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Group Name & Icon */}
          <div>
            <label className="block text-xs font-semibold text-[#A98F8F] uppercase tracking-wider mb-2">
              Nome do Grupo *
            </label>
            <div className="flex gap-3">
              <div className="relative">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg border border-[#351717] overflow-hidden"
                  style={{ backgroundColor: iconColor }}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span>{name.trim().charAt(0).toUpperCase() || '🔴'}</span>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 p-1 bg-[#241212] border border-[#351717] rounded-md text-[#A98F8F] hover:text-white cursor-pointer">
                  <ImageIcon className="w-3 h-3" />
                  <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <input
                id="group-name-input"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Squad de Front-End, Gamers RedChat..."
                className="flex-1 px-4 py-2.5 bg-[#120707] border border-[#241212] focus:border-[#E53935] rounded-xl text-white text-sm focus:outline-none transition-all placeholder:text-[#A98F8F]/40"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-[#A98F8F] uppercase tracking-wider mb-2">
              Descrição (Opcional)
            </label>
            <input
              id="group-description-input"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qual é o propósito deste canal?"
              className="w-full px-4 py-2.5 bg-[#120707] border border-[#241212] focus:border-[#E53935] rounded-xl text-white text-sm focus:outline-none transition-all placeholder:text-[#A98F8F]/40"
            />
          </div>

          {/* Icon Color Picker */}
          <div>
            <label className="block text-xs font-semibold text-[#A98F8F] uppercase tracking-wider mb-2">
              Cor de Destaque
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setIconColor(c)}
                  className={`w-7 h-7 rounded-lg transition-transform ${
                    iconColor === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-[#1a0d0d]' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Member Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-[#A98F8F] uppercase tracking-wider">
                Adicionar Membros ({selectedUserIds.length} selecionados)
              </label>
              <span className="text-[11px] text-[#A98F8F]/60">Você será o administrador do grupo</span>
            </div>

            <div className="bg-[#120707] border border-[#241212] rounded-xl max-h-48 overflow-y-auto divide-y divide-[#241212]/50 p-1">
              {isLoadingUsers ? (
                <div className="p-4 text-center text-xs text-[#A98F8F]">Carregando usuários...</div>
              ) : availableUsers.length === 0 ? (
                <div className="p-4 text-center text-xs text-[#A98F8F]">Nenhum usuário encontrado</div>
              ) : (
                availableUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u.id);
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleUserSelection(u.id)}
                      className={`flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-colors ${
                        isSelected ? 'bg-[#A51D20]/20' : 'hover:bg-[#1a0d0d]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={u.avatar} alt={u.username} className="w-8 h-8 rounded-full border border-[#351717]" />
                        <div>
                          <div className="text-xs font-semibold text-white">@{u.username}</div>
                          <div className="text-[10px] text-[#A98F8F] truncate max-w-[220px]">
                            {u.custom_status || u.bio || 'Membro do RedChat'}
                          </div>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                          isSelected
                            ? 'bg-[#E53935] border-[#E53935] text-white shadow-[0_0_8px_#E53935]'
                            : 'border-[#351717] bg-[#120707]'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#241212] hover:bg-[#351717] text-[#A98F8F] hover:text-white rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-5 py-2 bg-[#A51D20] hover:bg-[#E53935] text-white rounded-xl text-xs font-semibold shadow-[0_0_12px_rgba(165,29,32,0.4)] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Criando...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Criar Grupo</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
