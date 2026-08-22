import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Conversation, Message, User, Group, Post, ActiveCall, CallType, PostComment } from '../types';
import { api } from '../services/api';
import { wsClient } from '../services/websocket';
import { sounds } from '../services/audio';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';

interface IncomingCallPayload {
  callerId: string;
  caller: User;
  callType: CallType;
}

interface ChatContextType {
  // Navigation & Active View
  activeView: 'direct' | 'group' | 'feed';
  setActiveView: (view: 'direct' | 'group' | 'feed') => void;

  // Conversations (1-on-1)
  conversations: Conversation[];
  activeConversation: Conversation | null;
  selectConversation: (conversation: Conversation) => Promise<void>;
  startConversationWithUser: (recipientId: string) => Promise<void>;
  refreshConversations: () => Promise<void>;

  // Groups & Chat Geral
  groups: Group[];
  activeGroup: Group | null;
  selectGroup: (group: Group) => Promise<void>;
  createGroup: (payload: { name: string; description: string; avatar?: string; icon_color?: string; member_ids: string[] }) => Promise<Group | undefined>;
  refreshGroups: () => Promise<void>;

  // Active Chat Target
  activeTarget: { id: string; name: string; avatar: string; isGroup: boolean; partner?: User; group?: Group } | null;

  // Messages
  messages: Message[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isPartnerTyping: boolean;
  groupTypingUsernames: string[];
  sendMessage: (content: string, attachment?: { url: string; name: string; type: string }) => Promise<void>;
  sendTyping: (isTyping: boolean) => void;
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;
  deleteMessage: (messageId: string) => Promise<void>;

  // Profile Drawer
  isUserDrawerOpen: boolean;
  toggleUserDrawer: () => void;
  drawerUser: User | null;
  openUserDrawer: (user?: User) => void;

  // Feed & Posts (Instagram Style)
  posts: Post[];
  isLoadingPosts: boolean;
  refreshPosts: (userId?: string) => Promise<void>;
  createPost: (image_url: string, caption: string) => Promise<void>;
  toggleLikePost: (postId: string) => Promise<void>;
  addCommentPost: (postId: string, text: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;

  // Calling & Screen Sharing
  activeCall: ActiveCall | null;
  incomingCall: IncomingCallPayload | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  startCall: (targetUser: User, type: CallType) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleCallMute: () => void;
  toggleCallVideo: () => void;
  toggleScreenShare: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { addToast } = useToast();

  const [activeView, setActiveView] = useState<'direct' | 'group' | 'feed'>('group');

  // 1-on-1 Direct Conversations
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);

  // Groups
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);

  // Messages & UI State
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState<boolean>(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  const [groupTypingUsernames, setGroupTypingUsernames] = useState<string[]>([]);
  const [isUserDrawerOpen, setIsUserDrawerOpen] = useState<boolean>(false);
  const [drawerUser, setDrawerUser] = useState<User | null>(null);

  // Feed & Posts
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState<boolean>(false);

  // Calls & WebRTC
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [incomingCall, setIncomingCall] = useState<IncomingCallPayload | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const activeCallRef = useRef<ActiveCall | null>(null);
  activeCallRef.current = activeCall;

  const activeConvRef = useRef<Conversation | null>(null);
  activeConvRef.current = activeConversation;

  const activeGroupRef = useRef<Group | null>(null);
  activeGroupRef.current = activeGroup;

  const typingTimeoutRef = useRef<any>(null);

  // Computed Active Target for Chat Header and Inputs
  const activeTarget = activeView === 'group' && activeGroup
    ? {
        id: activeGroup.id,
        name: activeGroup.name,
        avatar: activeGroup.avatar || '',
        isGroup: true,
        group: activeGroup,
      }
    : activeConversation
    ? {
        id: activeConversation.id,
        name: activeConversation.partner.username,
        avatar: activeConversation.partner.avatar,
        isGroup: false,
        partner: activeConversation.partner,
      }
    : null;

  const toggleUserDrawer = () => {
    setIsUserDrawerOpen((prev) => !prev);
  };

  const openUserDrawer = (targetUser?: User) => {
    if (targetUser) {
      setDrawerUser(targetUser);
    } else if (activeConversation) {
      setDrawerUser(activeConversation.partner);
    } else if (user) {
      setDrawerUser(user);
    }
    setIsUserDrawerOpen(true);
  };

  // Load Groups
  const loadGroups = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await api.getGroups();
      setGroups(data.groups);

      // Default select general chat if none selected
      if (!activeGroupRef.current && data.groups.length > 0) {
        const general = data.groups.find((g) => g.is_general || g.id === 'group_general') || data.groups[0];
        setActiveGroup(general);
        if (activeView === 'group') {
          selectGroup(general);
        }
      }
    } catch (err) {
      console.error('Error loading groups:', err);
    }
  }, [isAuthenticated, activeView]);

  // Load Conversations
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setIsLoadingConversations(true);
      const data = await api.getConversations();
      setConversations(data.conversations);
    } catch (err: any) {
      console.error('Error loading conversations:', err);
    } finally {
      setIsLoadingConversations(false);
    }
  }, [isAuthenticated]);

  // Load Posts Feed
  const refreshPosts = useCallback(async (userId?: string) => {
    try {
      setIsLoadingPosts(true);
      const data = await api.getPosts(userId);
      setPosts(data.posts);
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      loadGroups();
      loadConversations();
      refreshPosts();
    } else {
      setConversations([]);
      setActiveConversation(null);
      setGroups([]);
      setActiveGroup(null);
      setMessages([]);
      setPosts([]);
    }
  }, [isAuthenticated, loadGroups, loadConversations, refreshPosts]);

  // Select 1-on-1 Conversation
  const selectConversation = async (conversation: Conversation) => {
    setActiveView('direct');
    setActiveConversation(conversation);
    setActiveGroup(null);
    setIsLoadingMessages(true);
    setIsPartnerTyping(false);

    try {
      const data = await api.getMessages(conversation.id);
      setMessages(data.messages);

      setConversations((prev) =>
        prev.map((c) => (c.id === conversation.id ? { ...c, unread_count: 0 } : c))
      );

      wsClient.send('mark_read', {
        conversation_id: conversation.id,
        partner_id: conversation.partner.id,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao carregar mensagens',
        message: err.message,
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Select Group (or Chat Geral)
  const selectGroup = async (group: Group) => {
    setActiveView('group');
    setActiveGroup(group);
    setActiveConversation(null);
    setIsLoadingMessages(true);
    setGroupTypingUsernames([]);

    try {
      const data = await api.getMessages(group.id);
      setMessages(data.messages);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao carregar grupo',
        message: err.message,
      });
    } finally {
      setIsLoadingMessages(false);
    }
  };

  const startConversationWithUser = async (recipientId: string) => {
    try {
      const data = await api.createConversation(recipientId);
      const newConv = data.conversation;

      setConversations((prev) => {
        const exists = prev.find((c) => c.id === newConv.id);
        if (exists) return prev;
        return [newConv, ...prev];
      });

      await selectConversation(newConv);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao iniciar conversa',
        message: err.message,
      });
    }
  };

  const createGroup = async (payload: { name: string; description: string; avatar?: string; icon_color?: string; member_ids: string[] }) => {
    try {
      const data = await api.createGroup(payload);
      setGroups((prev) => [data.group, ...prev]);
      await selectGroup(data.group);
      addToast({
        type: 'success',
        title: 'Grupo criado!',
        message: `O grupo "${data.group.name}" foi criado com sucesso.`,
      });
      return data.group;
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Erro ao criar grupo',
        message: err.message,
      });
    }
  };

  const sendMessage = async (content: string, attachment?: { url: string; name: string; type: string }) => {
    if (!user) return;

    sounds.playOutgoingMessage();

    if (activeView === 'group' && activeGroup) {
      wsClient.send('send_group_message', {
        group_id: activeGroup.id,
        content,
        attachment_url: attachment?.url,
        attachment_name: attachment?.name,
        attachment_type: attachment?.type,
      });
    } else if (activeConversation) {
      wsClient.send('send_message', {
        conversation_id: activeConversation.id,
        recipient_id: activeConversation.partner.id,
        content,
        attachment_url: attachment?.url,
        attachment_name: attachment?.name,
        attachment_type: attachment?.type,
      });
    }
  };

  const sendTyping = (isTyping: boolean) => {
    if (activeView === 'group' && activeGroup) {
      wsClient.send('typing', {
        group_id: activeGroup.id,
        is_typing: isTyping,
      });
    } else if (activeConversation) {
      wsClient.send('typing', {
        recipient_id: activeConversation.partner.id,
        conversation_id: activeConversation.id,
        is_typing: isTyping,
      });
    }
  };

  const toggleReaction = async (messageId: string, emoji: string) => {
    if (activeView === 'group' && activeGroup) {
      wsClient.send('toggle_reaction', {
        message_id: messageId,
        emoji,
        group_id: activeGroup.id,
      });
    } else if (activeConversation) {
      wsClient.send('toggle_reaction', {
        message_id: messageId,
        emoji,
        recipient_id: activeConversation.partner.id,
      });
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await api.deleteMessage(messageId);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      addToast({ type: 'info', title: 'Mensagem apagada' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro ao apagar mensagem', message: err.message });
    }
  };

  // Posts Feed Operations
  const createPost = async (image_url: string, caption: string) => {
    try {
      const data = await api.createPost({ image_url, caption });
      setPosts((prev) => [data.post, ...prev]);
      addToast({ type: 'success', title: 'Foto publicada no seu perfil!' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro ao publicar foto', message: err.message });
    }
  };

  const toggleLikePost = async (postId: string) => {
    try {
      const result = await api.togglePostLike(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: result.likes } : p))
      );
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro ao curtir foto', message: err.message });
    }
  };

  const addCommentPost = async (postId: string, text: string) => {
    try {
      const data = await api.addPostComment(postId, text);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, comments: [...p.comments, data.comment] } : p
        )
      );
      addToast({ type: 'success', title: 'Comentário enviado' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro ao comentar', message: err.message });
    }
  };

  const deletePost = async (postId: string) => {
    try {
      await api.deletePost(postId);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      addToast({ type: 'info', title: 'Publicação excluída' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Erro ao excluir', message: err.message });
    }
  };

  // CALLING & WEBRTC ENGINE
  const cleanupMediaStreams = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    setRemoteStream(null);
    sounds.stopIncomingRingtone();
    sounds.stopOutgoingRing();
  };

  const setupLocalMedia = async (type: CallType): Promise<MediaStream | null> => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('getUserMedia not supported in this environment');
        return null;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      return stream;
    } catch (err) {
      console.warn('Could not access microphone/camera. Proceeding with simulated call audio state.', err);
      return null;
    }
  };

  const startCall = async (targetUser: User, type: CallType) => {
    cleanupMediaStreams();
    sounds.startOutgoingRing();

    const newCall: ActiveCall = {
      targetUser,
      isCaller: true,
      type,
      status: 'calling',
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      startedAt: Date.now(),
    };

    setActiveCall(newCall);

    // Request stream
    await setupLocalMedia(type);

    // Send call request
    wsClient.send('call_request', {
      targetUserId: targetUser.id,
      callType: type,
    });
  };

  const acceptCall = async () => {
    if (!incomingCall) return;
    sounds.stopIncomingRingtone();
    sounds.playCallConnected();

    const newCall: ActiveCall = {
      targetUser: incomingCall.caller,
      isCaller: false,
      type: incomingCall.callType,
      status: 'connected',
      isMuted: false,
      isVideoOff: false,
      isScreenSharing: false,
      startedAt: Date.now(),
    };

    setActiveCall(newCall);
    const callerId = incomingCall.callerId;
    const callType = incomingCall.callType;
    setIncomingCall(null);

    await setupLocalMedia(callType);

    wsClient.send('call_accept', {
      callerId,
      callType,
    });
  };

  const rejectCall = () => {
    sounds.stopIncomingRingtone();
    if (incomingCall) {
      wsClient.send('call_reject', {
        callerId: incomingCall.callerId,
        reason: 'Chamada recusada',
      });
      setIncomingCall(null);
    }
  };

  const endCall = () => {
    sounds.stopIncomingRingtone();
    sounds.stopOutgoingRing();
    sounds.playCallEnded();

    if (activeCall) {
      wsClient.send('call_end', {
        targetUserId: activeCall.targetUser.id,
      });
    }

    cleanupMediaStreams();
    setActiveCall(null);
    setIncomingCall(null);
  };

  const toggleCallMute = () => {
    if (!activeCall) return;
    const newMuted = !activeCall.isMuted;
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !newMuted;
      });
    }
    setActiveCall((prev) => (prev ? { ...prev, isMuted: newMuted } : null));
    wsClient.send('call_media_toggle', {
      targetUserId: activeCall.targetUser.id,
      isMuted: newMuted,
      isVideoOff: activeCall.isVideoOff,
      isScreenSharing: activeCall.isScreenSharing,
    });
  };

  const toggleCallVideo = () => {
    if (!activeCall) return;
    const newVideoOff = !activeCall.isVideoOff;
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !newVideoOff;
      });
    }
    setActiveCall((prev) => (prev ? { ...prev, isVideoOff: newVideoOff } : null));
    wsClient.send('call_media_toggle', {
      targetUserId: activeCall.targetUser.id,
      isMuted: activeCall.isMuted,
      isVideoOff: newVideoOff,
      isScreenSharing: activeCall.isScreenSharing,
    });
  };

  const toggleScreenShare = async () => {
    if (!activeCall) return;

    if (activeCall.isScreenSharing) {
      // Stop screen sharing
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      setActiveCall((prev) => (prev ? { ...prev, isScreenSharing: false } : null));
      wsClient.send('call_media_toggle', {
        targetUserId: activeCall.targetUser.id,
        isMuted: activeCall.isMuted,
        isVideoOff: activeCall.isVideoOff,
        isScreenSharing: false,
      });
      addToast({ type: 'info', title: 'Compartilhamento de tela encerrado' });
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          addToast({
            type: 'warning',
            title: 'Recurso não suportado',
            message: 'O navegador não tem permissão para capturar a tela neste ambiente.',
          });
          return;
        }

        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        screenStreamRef.current = screenStream;
        setLocalStream(screenStream);

        screenStream.getVideoTracks()[0].onended = () => {
          setActiveCall((prev) => (prev ? { ...prev, isScreenSharing: false } : null));
          if (localStreamRef.current) setLocalStream(localStreamRef.current);
        };

        setActiveCall((prev) => (prev ? { ...prev, isScreenSharing: true } : null));
        wsClient.send('call_media_toggle', {
          targetUserId: activeCall.targetUser.id,
          isMuted: activeCall.isMuted,
          isVideoOff: activeCall.isVideoOff,
          isScreenSharing: true,
        });
        addToast({ type: 'success', title: 'Compartilhando sua tela em tempo real!' });
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          addToast({ type: 'error', title: 'Erro ao compartilhar tela', message: err.message });
        }
      }
    }
  };

  // Real-time WebSocket Listeners
  useEffect(() => {
    // Direct Message Listener
    const unsubNewMsg = wsClient.on('new_message', (data: { message: Message; conversationId: string }) => {
      const { message, conversationId } = data;
      const currentActiveConv = activeConvRef.current;

      if (currentActiveConv && (currentActiveConv.id === conversationId || currentActiveConv.id === message.conversation_id)) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });

        if (message.sender_id !== user?.id) {
          sounds.playIncomingMessage();
          wsClient.send('mark_read', {
            conversation_id: conversationId,
            partner_id: message.sender_id,
          });
        }
      } else {
        if (message.sender_id !== user?.id) {
          sounds.playIncomingMessage();
        }
      }

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId || c.id === message.conversation_id);
        if (idx > -1) {
          const updated = [...prev];
          const conv = updated[idx];
          const isCurrentlyActive = currentActiveConv?.id === conv.id;
          updated[idx] = {
            ...conv,
            last_message: message,
            updated_at: message.timestamp,
            unread_count: isCurrentlyActive || message.sender_id === user?.id ? 0 : (conv.unread_count || 0) + 1,
          };
          return updated.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
        }
        return prev;
      });
    });

    // Group Message Listener
    const unsubGroupMsg = wsClient.on('new_group_message', (data: { groupId: string; message: Message }) => {
      const { groupId, message } = data;
      const currentGroup = activeGroupRef.current;

      if (currentGroup && currentGroup.id === groupId) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        if (message.sender_id !== user?.id) {
          sounds.playIncomingMessage();
        }
      } else {
        if (message.sender_id !== user?.id) {
          sounds.playIncomingMessage();
        }
      }

      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId ? { ...g, last_message: message, updated_at: message.timestamp } : g
        )
      );
    });

    // Typing in Direct
    const unsubTyping = wsClient.on('typing_status', (data: { userId: string; conversation_id: string; is_typing: boolean }) => {
      const currentActiveConv = activeConvRef.current;
      if (currentActiveConv && currentActiveConv.partner.id === data.userId) {
        setIsPartnerTyping(data.is_typing);
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        if (data.is_typing) {
          typingTimeoutRef.current = setTimeout(() => {
            setIsPartnerTyping(false);
          }, 3500);
        }
      }
    });

    // Typing in Group
    const unsubGroupTyping = wsClient.on('group_typing_status', (data: { groupId: string; userId: string; is_typing: boolean }) => {
      const currentGroup = activeGroupRef.current;
      if (currentGroup && currentGroup.id === data.groupId) {
        setGroupTypingUsernames((prev) => {
          if (data.is_typing) {
            return prev.includes(data.userId) ? prev : [...prev, data.userId];
          } else {
            return prev.filter((id) => id !== data.userId);
          }
        });
      }
    });

    const unsubRead = wsClient.on('messages_read', (data: { conversation_id: string; reader_id: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.conversation_id === data.conversation_id ? { ...m, status: 'read' } : m))
      );
    });

    const unsubReaction = wsClient.on('reaction_updated', (data: { message: Message }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === data.message.id ? data.message : m))
      );
    });

    const unsubStatus = wsClient.on('user_status_changed', (data: { userId: string; status: any; custom_status?: string }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.partner.id === data.userId) {
            return {
              ...c,
              partner: {
                ...c.partner,
                status: data.status,
                custom_status: data.custom_status ?? c.partner.custom_status,
              },
            };
          }
          return c;
        })
      );
    });

    const unsubDeleted = wsClient.on('message_deleted', (data: { messageId: string }) => {
      setMessages((prev) => prev.filter((m) => m.id !== data.messageId));
    });

    // Feed real-time events
    const unsubPostCreated = wsClient.on('post_created', (data: { post: Post }) => {
      setPosts((prev) => [data.post, ...prev.filter((p) => p.id !== data.post.id)]);
    });

    const unsubPostLiked = wsClient.on('post_liked', (data: { postId: string; likes: string[] }) => {
      setPosts((prev) =>
        prev.map((p) => (p.id === data.postId ? { ...p, likes: data.likes } : p))
      );
    });

    const unsubPostCommented = wsClient.on('post_commented', (data: { postId: string; comment: PostComment }) => {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === data.postId ? { ...p, comments: [...p.comments, data.comment] } : p
        )
      );
    });

    const unsubPostDeleted = wsClient.on('post_deleted', (data: { postId: string }) => {
      setPosts((prev) => prev.filter((p) => p.id !== data.postId));
    });

    // CALL REAL-TIME SIGNALING
    const unsubIncomingCall = wsClient.on('incoming_call', (data: IncomingCallPayload) => {
      setIncomingCall(data);
      sounds.startIncomingRingtone();
    });

    const unsubCallAccepted = wsClient.on('call_accepted', (data: { responderId: string; responder: User; callType: CallType }) => {
      sounds.stopOutgoingRing();
      sounds.playCallConnected();
      setActiveCall((prev) => (prev ? { ...prev, status: 'connected', startedAt: Date.now() } : null));
    });

    const unsubCallRejected = wsClient.on('call_rejected', (data: { reason: string }) => {
      sounds.stopOutgoingRing();
      sounds.playCallEnded();
      addToast({ type: 'warning', title: 'Chamada recusada', message: data.reason });
      cleanupMediaStreams();
      setActiveCall(null);
    });

    const unsubCallEnded = wsClient.on('call_ended', () => {
      sounds.stopIncomingRingtone();
      sounds.stopOutgoingRing();
      sounds.playCallEnded();
      addToast({ type: 'info', title: 'Chamada encerrada' });
      cleanupMediaStreams();
      setActiveCall(null);
      setIncomingCall(null);
    });

    return () => {
      unsubNewMsg();
      unsubGroupMsg();
      unsubTyping();
      unsubGroupTyping();
      unsubRead();
      unsubReaction();
      unsubStatus();
      unsubDeleted();
      unsubPostCreated();
      unsubPostLiked();
      unsubPostCommented();
      unsubPostDeleted();
      unsubIncomingCall();
      unsubCallAccepted();
      unsubCallRejected();
      unsubCallEnded();
    };
  }, [user, addToast]);

  return (
    <ChatContext.Provider
      value={{
        activeView,
        setActiveView,
        conversations,
        activeConversation,
        selectConversation,
        startConversationWithUser,
        refreshConversations: loadConversations,
        groups,
        activeGroup,
        selectGroup,
        createGroup,
        refreshGroups: loadGroups,
        activeTarget,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        isPartnerTyping,
        groupTypingUsernames,
        sendMessage,
        sendTyping,
        toggleReaction,
        deleteMessage,
        isUserDrawerOpen,
        toggleUserDrawer,
        drawerUser,
        openUserDrawer,
        posts,
        isLoadingPosts,
        refreshPosts,
        createPost,
        toggleLikePost,
        addCommentPost,
        deletePost,
        activeCall,
        incomingCall,
        localStream,
        remoteStream,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleCallMute,
        toggleCallVideo,
        toggleScreenShare,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
