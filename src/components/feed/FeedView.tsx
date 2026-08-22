import React, { useState } from 'react';
import {
  Heart,
  MessageCircle,
  Share2,
  Trash2,
  Camera,
  Image as ImageIcon,
  Send,
  Sparkles,
  User as UserIcon,
  Globe,
  X,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { Post } from '../../types';

export const FeedView: React.FC = () => {
  const { posts, isLoadingPosts, createPost, toggleLikePost, addCommentPost, deletePost, openUserDrawer } = useChat();
  const { user: currentUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [isPostingModalOpen, setIsPostingModalOpen] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [openCommentsMap, setOpenCommentsMap] = useState<Record<string, boolean>>({});

  const filteredPosts = activeTab === 'all'
    ? posts
    : posts.filter((p) => p.user_id === currentUser?.id);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoUrl) return;

    try {
      setIsSubmitting(true);
      await createPost(photoUrl, caption);
      setPhotoUrl('');
      setCaption('');
      setIsPostingModalOpen(false);
    } catch (err) {
      console.error('Error publishing post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendComment = async (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    await addCommentPost(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
    setOpenCommentsMap((prev) => ({ ...prev, [postId]: true }));
  };

  const toggleComments = (postId: string) => {
    setOpenCommentsMap((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div id="feed-view-container" className="flex-1 flex flex-col h-full bg-[#0e0505] overflow-y-auto">
      {/* Header Banner */}
      <div className="sticky top-0 z-20 px-6 py-4 bg-[#120707]/90 backdrop-blur-md border-b border-[#241212] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#A51D20] to-[#E53935] flex items-center justify-center text-white shadow-[0_0_15px_rgba(229,57,53,0.35)]">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              Galeria & Feed RedChat 📸
            </h2>
            <p className="text-xs text-[#A98F8F]">Compartilhe momentos, setups e artes no estilo Instagram</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tabs */}
          <div className="flex bg-[#1a0d0d] p-1 rounded-xl border border-[#241212]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-[#A51D20] text-white shadow-sm'
                  : 'text-[#A98F8F] hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" /> Comunidade
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'my'
                  ? 'bg-[#A51D20] text-white shadow-sm'
                  : 'text-[#A98F8F] hover:text-white'
              }`}
            >
              <UserIcon className="w-3.5 h-3.5" /> Minhas Fotos
            </button>
          </div>

          {/* New Post Button */}
          <button
            id="open-new-post-button"
            onClick={() => setIsPostingModalOpen(true)}
            className="px-4 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(229,57,53,0.4)] flex items-center gap-2 transition-all cursor-pointer transform active:scale-95"
          >
            <Camera className="w-4 h-4" />
            <span>Publicar Foto</span>
          </button>
        </div>
      </div>

      {/* Main Feed Content */}
      <div className="max-w-2xl w-full mx-auto p-4 md:p-6 space-y-6 pb-20">
        {isLoadingPosts ? (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-3 border-[#E53935] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-[#A98F8F]">Carregando feed de fotos...</span>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="py-20 text-center bg-[#120707] border border-[#241212] rounded-3xl p-8 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-[#1a0d0d] flex items-center justify-center text-[#E53935] mb-4 border border-[#351717]">
              <Camera className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">Nenhuma foto postada ainda</h3>
            <p className="text-xs text-[#A98F8F] max-w-sm mb-6">
              Seja o primeiro a compartilhar uma foto com a comunidade RedChat!
            </p>
            <button
              onClick={() => setIsPostingModalOpen(true)}
              className="px-5 py-2.5 bg-[#A51D20] hover:bg-[#E53935] text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-lg"
            >
              Publicar Agora
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isLiked = post.likes.includes(currentUser?.id || '');
            const isAuthor = post.user_id === currentUser?.id || currentUser?.is_admin;
            const commentsOpen = openCommentsMap[post.id] ?? false;

            return (
              <div
                key={post.id}
                id={`post-card-${post.id}`}
                className="bg-[#120707] border border-[#241212] rounded-2xl overflow-hidden shadow-lg transition-all hover:border-[#351717]"
              >
                {/* Post Header */}
                <div className="px-4 py-3.5 flex items-center justify-between bg-[#150909]">
                  <div
                    onClick={() => openUserDrawer(post.user)}
                    className="flex items-center gap-3 cursor-pointer group"
                  >
                    <div className="relative">
                      <div className="w-9 h-9 rounded-full p-0.5 bg-gradient-to-tr from-[#A51D20] to-[#E53935]">
                        <img
                          src={post.user.avatar}
                          alt={post.user.username}
                          className="w-full h-full rounded-full object-cover bg-[#120707]"
                        />
                      </div>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-[#FF5252] transition-colors">
                        @{post.user.username}
                      </div>
                      <div className="text-[10px] text-[#A98F8F]">
                        {new Date(post.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>
                  </div>

                  {isAuthor && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="p-1.5 rounded-lg text-[#A98F8F]/60 hover:text-[#FF5252] hover:bg-[#241212] transition-colors cursor-pointer"
                      title="Excluir publicação"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Post Image with Double Click to Like */}
                <div
                  onDoubleClick={() => toggleLikePost(post.id)}
                  className="relative w-full aspect-square bg-[#0a0404] flex items-center justify-center overflow-hidden cursor-pointer"
                >
                  <img
                    src={post.image_url}
                    alt={post.caption || 'Foto do RedChat'}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-[1.02]"
                    loading="lazy"
                  />
                </div>

                {/* Post Actions */}
                <div className="px-4 pt-3 pb-2 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLikePost(post.id)}
                      className={`flex items-center gap-1.5 text-sm font-semibold transition-all cursor-pointer ${
                        isLiked ? 'text-[#FF5252] scale-110' : 'text-[#A98F8F] hover:text-white'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-[#FF5252]' : ''}`} />
                      <span>{post.likes.length}</span>
                    </button>

                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 text-sm font-semibold text-[#A98F8F] hover:text-white transition-colors cursor-pointer"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>{post.comments.length}</span>
                    </button>
                  </div>
                </div>

                {/* Caption */}
                {post.caption && (
                  <div className="px-4 pb-3 text-xs text-[#F5EEEE] leading-relaxed">
                    <span className="font-bold text-white mr-2">@{post.user.username}</span>
                    {post.caption}
                  </div>
                )}

                {/* Comments Section */}
                {commentsOpen && (
                  <div className="border-t border-[#241212] bg-[#0d0505] p-4 space-y-3">
                    {post.comments.length > 0 ? (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {post.comments.map((c) => (
                          <div key={c.id} className="flex items-start gap-2.5 text-xs">
                            <img src={c.user_avatar} alt={c.username} className="w-6 h-6 rounded-full mt-0.5" />
                            <div className="flex-1 bg-[#150909] p-2 rounded-xl border border-[#241212]">
                              <span className="font-bold text-white mr-1.5">@{c.username}:</span>
                              <span className="text-[#F5EEEE]">{c.text}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#A98F8F]/60 text-center py-2">
                        Nenhum comentário ainda. Seja o primeiro a comentar!
                      </p>
                    )}
                  </div>
                )}

                {/* Add Comment Input Bar */}
                <div className="px-4 py-2.5 border-t border-[#241212] bg-[#150909] flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => e.key === 'Enter' && handleSendComment(post.id)}
                    placeholder="Adicione um comentário..."
                    className="flex-1 bg-transparent text-xs text-white placeholder:text-[#A98F8F]/50 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendComment(post.id)}
                    disabled={!commentInputs[post.id]?.trim()}
                    className="p-1.5 text-[#E53935] hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* New Post Modal */}
      {isPostingModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
          onClick={() => setIsPostingModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-[#1a0d0d] border border-[#351717] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#241212] bg-[#120707]">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#FF5252]" />
                <h3 className="text-base font-bold text-white">Criar Nova Publicação</h3>
              </div>
              <button
                onClick={() => setIsPostingModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[#241212] text-[#A98F8F] hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreatePost} className="p-6 space-y-4">
              {/* Photo Upload / URL Selector */}
              <div>
                <label className="block text-xs font-semibold text-[#A98F8F] uppercase tracking-wider mb-2">
                  Foto da Publicação *
                </label>

                {photoUrl ? (
                  <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-[#351717] mb-3">
                    <img src={photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-[#E53935] text-white rounded-full transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#351717] rounded-2xl p-6 text-center bg-[#120707] hover:border-[#E53935] transition-colors">
                    <ImageIcon className="w-10 h-10 text-[#A98F8F] mx-auto mb-2" />
                    <p className="text-xs text-[#A98F8F] mb-3">
                      Arraste ou selecione uma imagem do seu computador
                    </p>
                    <label className="px-4 py-2 bg-[#241212] hover:bg-[#351717] text-white text-xs font-semibold rounded-xl cursor-pointer transition-colors inline-block">
                      Escolher Arquivo
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                )}

                <div className="mt-3">
                  <input
                    type="url"
                    value={photoUrl.startsWith('data:') ? '' : photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="Ou cole uma URL direta de imagem (https://...)"
                    className="w-full px-4 py-2 bg-[#120707] border border-[#241212] focus:border-[#E53935] rounded-xl text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-xs font-semibold text-[#A98F8F] uppercase tracking-wider mb-2">
                  Legenda
                </label>
                <textarea
                  rows={3}
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Escreva algo sobre esta foto..."
                  className="w-full px-4 py-2.5 bg-[#120707] border border-[#241212] focus:border-[#E53935] rounded-xl text-white text-xs focus:outline-none resize-none placeholder:text-[#A98F8F]/40"
                />
              </div>

              {/* Footer */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPostingModalOpen(false)}
                  className="px-4 py-2 bg-[#241212] text-[#A98F8F] hover:text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!photoUrl || isSubmitting}
                  className="px-6 py-2 bg-[#E53935] hover:bg-[#D32F2F] text-white rounded-xl text-xs font-bold shadow-[0_0_15px_rgba(229,57,53,0.4)] disabled:opacity-50 transition-all cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Publicando...</span>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Compartilhar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
