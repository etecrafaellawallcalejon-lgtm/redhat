export type UserStatus = 'online' | 'idle' | 'dnd' | 'offline';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar: string;
  status: UserStatus;
  custom_status?: string;
  bio?: string;
  role?: 'admin' | 'user';
  is_admin?: boolean;
  created_at: string;
  last_seen: string;
}

export interface MessageReaction {
  emoji: string;
  user_ids: string[];
}

export interface Message {
  id: string;
  conversation_id: string;
  group_id?: string;
  sender_id: string;
  sender?: User;
  recipient_id?: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  reactions?: MessageReaction[];
}

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
  participant_ids: string[];
  partner: User;
  last_message?: Message;
  unread_count: number;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  icon_color?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_general?: boolean;
  member_ids: string[];
  members?: User[];
  last_message?: Message;
  unread_count?: number;
}

export interface PostComment {
  id: string;
  user_id: string;
  username: string;
  user_avatar: string;
  text: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  user?: User;
  image_url: string;
  caption: string;
  likes: string[];
  comments: PostComment[];
  created_at: string;
}

export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

export interface ActiveCall {
  targetUser: User;
  isCaller: boolean;
  type: CallType;
  status: CallStatus;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  startedAt?: number;
}

export interface AdminStats {
  totalUsers: number;
  onlineUsers: number;
  totalGroups: number;
  totalMessages: number;
  totalPosts: number;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}
