import { User, Conversation, Message, Group, Post, PostComment, AdminStats } from '../types';

const API_BASE = '/api';

function getHeaders(): HeadersInit {
  const token = localStorage.getItem('redchat_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || data.detail || 'Ocorreu um erro na requisição');
  }
  return data;
}

export const api = {
  // Auth
  async register(payload: { username: string; email: string; password: string; confirmPassword?: string }) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ token: string; user: User; message: string }>(res);
  },

  async login(payload: { identifier: string; password: string }) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse<{ token: string; user: User; message: string }>(res);
  },

  async getMe() {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  async updateProfile(updates: Partial<User>) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates),
    });
    return handleResponse<{ user: User; message: string }>(res);
  },

  async getDemoUsers() {
    const res = await fetch(`${API_BASE}/auth/demo-users`);
    return handleResponse<{ users: User[] }>(res);
  },

  async switchUser(userId: string, password?: string) {
    const res = await fetch(`${API_BASE}/auth/switch-user`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    });
    return handleResponse<{ token: string; user: User }>(res);
  },

  async changePassword(payload: { currentPassword: string; newPassword: string }) {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Admin APIs
  async getAdminStats() {
    const res = await fetch(`${API_BASE}/admin/stats`, {
      headers: getHeaders(),
    });
    return handleResponse<{ stats: AdminStats }>(res);
  },

  async getAdminUsers() {
    const res = await fetch(`${API_BASE}/admin/users`, {
      headers: getHeaders(),
    });
    return handleResponse<{ users: User[] }>(res);
  },

  async updateUserRole(userId: string, role: 'admin' | 'user') {
    const res = await fetch(`${API_BASE}/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse<{ user: User; message: string }>(res);
  },

  async deleteUser(userId: string) {
    const res = await fetch(`${API_BASE}/admin/users/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  async sendAdminBroadcast(content: string) {
    const res = await fetch(`${API_BASE}/admin/broadcast`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ content }),
    });
    return handleResponse<{ message: Message }>(res);
  },

  // Users
  async searchUsers(query: string) {
    const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`, {
      headers: getHeaders(),
    });
    return handleResponse<{ users: User[] }>(res);
  },

  async getUser(id: string) {
    const res = await fetch(`${API_BASE}/users/${id}`, {
      headers: getHeaders(),
    });
    return handleResponse<{ user: User }>(res);
  },

  // Conversations (1-on-1)
  async getConversations() {
    const res = await fetch(`${API_BASE}/conversations`, {
      headers: getHeaders(),
    });
    return handleResponse<{ conversations: Conversation[] }>(res);
  },

  async createConversation(recipientId: string) {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ recipient_id: recipientId }),
    });
    return handleResponse<{ conversation: Conversation }>(res);
  },

  // Groups (including Chat Geral)
  async getGroups() {
    const res = await fetch(`${API_BASE}/groups`, {
      headers: getHeaders(),
    });
    return handleResponse<{ groups: Group[] }>(res);
  },

  async createGroup(payload: { name: string; description: string; avatar?: string; icon_color?: string; member_ids: string[] }) {
    const res = await fetch(`${API_BASE}/groups`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ group: Group }>(res);
  },

  async addMemberToGroup(groupId: string, userId: string) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/members`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ userId }),
    });
    return handleResponse<{ message: string; group: Group }>(res);
  },

  async removeMemberFromGroup(groupId: string, userId: string) {
    const res = await fetch(`${API_BASE}/groups/${groupId}/members/${userId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Messages
  async getMessages(conversationOrGroupId: string) {
    const res = await fetch(`${API_BASE}/conversations/${conversationOrGroupId}/messages`, {
      headers: getHeaders(),
    });
    return handleResponse<{ messages: Message[] }>(res);
  },

  async sendMessage(conversationOrGroupId: string, payload: {
    content: string;
    attachment_url?: string;
    attachment_name?: string;
    attachment_type?: string;
  }) {
    const res = await fetch(`${API_BASE}/conversations/${conversationOrGroupId}/messages`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ message: Message }>(res);
  },

  async toggleReaction(messageId: string, emoji: string, recipientId?: string, groupId?: string) {
    const res = await fetch(`${API_BASE}/messages/${messageId}/reaction`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ emoji, recipient_id: recipientId, group_id: groupId }),
    });
    return handleResponse<{ message: Message }>(res);
  },

  async deleteMessage(messageId: string) {
    const res = await fetch(`${API_BASE}/messages/${messageId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },

  // Posts & Photo Gallery (Instagram Style)
  async getPosts(userId?: string) {
    const url = userId ? `${API_BASE}/posts?userId=${encodeURIComponent(userId)}` : `${API_BASE}/posts`;
    const res = await fetch(url, {
      headers: getHeaders(),
    });
    return handleResponse<{ posts: Post[] }>(res);
  },

  async createPost(payload: { image_url: string; caption: string }) {
    const res = await fetch(`${API_BASE}/posts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<{ post: Post }>(res);
  },

  async togglePostLike(postId: string) {
    const res = await fetch(`${API_BASE}/posts/${postId}/like`, {
      method: 'POST',
      headers: getHeaders(),
    });
    return handleResponse<{ likes: string[]; isLiked: boolean }>(res);
  },

  async addPostComment(postId: string, text: string) {
    const res = await fetch(`${API_BASE}/posts/${postId}/comment`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ text }),
    });
    return handleResponse<{ comment: PostComment }>(res);
  },

  async deletePost(postId: string) {
    const res = await fetch(`${API_BASE}/posts/${postId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse<{ message: string }>(res);
  },
};
