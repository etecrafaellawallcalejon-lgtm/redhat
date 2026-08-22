import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import path from 'path';
import { WebSocketServer, WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import { db, UserRecord } from './server/db';

const JWT_SECRET = process.env.JWT_SECRET || 'redchat_secure_secret_2026_crimson_key';
const PORT = 3000;

interface AuthenticatedRequest extends Request {
  user?: UserRecord;
}

function generateToken(user: UserRecord): string {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || 'user',
      is_admin: user.is_admin || false,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
}

function hashPassword(password: string): string {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);

  app.use(express.json({ limit: '20mb' }));
  app.use(express.urlencoded({ extended: true, limit: '20mb' }));

  // WebSocket Server on the same HTTP server
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map<string, Set<WebSocket>>();

  function addClient(userId: string, socket: WebSocket) {
    if (!clients.has(userId)) {
      clients.set(userId, new Set());
    }
    clients.get(userId)!.add(socket);
  }

  function removeClient(userId: string, socket: WebSocket) {
    const userSockets = clients.get(userId);
    if (userSockets) {
      userSockets.delete(socket);
      if (userSockets.size === 0) {
        clients.delete(userId);
      }
    }
  }

  function broadcastToUser(userId: string, event: string, data: any) {
    const userSockets = clients.get(userId);
    if (userSockets) {
      const payload = JSON.stringify({ event, data });
      for (const socket of userSockets) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(payload);
        }
      }
    }
  }

  function broadcastToUsers(userIds: string[], event: string, data: any) {
    const payload = JSON.stringify({ event, data });
    for (const uid of userIds) {
      const userSockets = clients.get(uid);
      if (userSockets) {
        for (const socket of userSockets) {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(payload);
          }
        }
      }
    }
  }

  function broadcastToAll(event: string, data: any) {
    const payload = JSON.stringify({ event, data });
    for (const [_, sockets] of clients) {
      for (const socket of sockets) {
        if (socket.readyState === WebSocket.OPEN) {
          socket.send(payload);
        }
      }
    }
  }

  wss.on('connection', (ws: WebSocket, req) => {
    let currentUserId: string | null = null;

    // Try token from URL query
    try {
      const url = new URL(req.url || '', `http://${req.headers.host || 'localhost'}`);
      const token = url.searchParams.get('token');
      if (token) {
        const payload = verifyToken(token);
        if (payload) {
          currentUserId = payload.id;
          addClient(currentUserId, ws);
          const user = db.getUserById(currentUserId);
          if (user) {
            db.updateUser(currentUserId, { status: user.status === 'offline' ? 'online' : user.status, last_seen: new Date().toISOString() });
            broadcastToAll('user_status_changed', { userId: currentUserId, status: user.status === 'offline' ? 'online' : user.status });
          }
        }
      }
    } catch (e) {
      console.error('WS query parse error:', e);
    }

    ws.on('message', (messageRaw: string) => {
      try {
        const parsed = JSON.parse(messageRaw.toString());
        const { action, data } = parsed;

        if (action === 'auth') {
          const payload = verifyToken(data.token);
          if (payload) {
            currentUserId = payload.id;
            addClient(currentUserId, ws);
            ws.send(JSON.stringify({ event: 'auth_success', data: { userId: currentUserId } }));
            const user = db.getUserById(currentUserId);
            if (user) {
              db.updateUser(currentUserId, { status: user.status === 'offline' ? 'online' : user.status, last_seen: new Date().toISOString() });
              broadcastToAll('user_status_changed', { userId: currentUserId, status: user.status === 'offline' ? 'online' : user.status });
            }
          } else {
            ws.send(JSON.stringify({ event: 'auth_error', data: { error: 'Invalid token' } }));
          }
          return;
        }

        if (!currentUserId) {
          ws.send(JSON.stringify({ event: 'error', data: { error: 'Não autenticado' } }));
          return;
        }

        // Direct 1-on-1 Message
        if (action === 'send_message') {
          const { conversation_id, recipient_id, content, attachment_url, attachment_name, attachment_type } = data;
          if (!recipient_id || (!content && !attachment_url)) return;

          let conv = conversation_id ? db.getConversationById(conversation_id) : null;
          if (!conv) {
            conv = db.getOrCreateConversation(currentUserId, recipient_id);
          }

          const newMsg = db.createMessage({
            conversation_id: conv.id,
            sender_id: currentUserId,
            recipient_id,
            content: content || '',
            attachment_url,
            attachment_name,
            attachment_type,
          });

          const senderUser = db.getUserById(currentUserId)!;
          const recipientUser = db.getUserById(recipient_id)!;
          const msgWithSender = { ...newMsg, sender: senderUser };

          broadcastToUser(currentUserId, 'new_message', { message: msgWithSender, conversationId: conv.id });
          broadcastToUser(recipient_id, 'new_message', { message: msgWithSender, conversationId: conv.id });

          broadcastToUser(recipient_id, 'conversation_update', {
            conversationId: conv.id,
            last_message: msgWithSender,
            partner: senderUser,
          });
          broadcastToUser(currentUserId, 'conversation_update', {
            conversationId: conv.id,
            last_message: msgWithSender,
            partner: recipientUser,
          });
        } 
        // Group Message (including Chat Geral)
        else if (action === 'send_group_message') {
          const { group_id, content, attachment_url, attachment_name, attachment_type } = data;
          if (!group_id || (!content && !attachment_url)) return;

          const group = db.getGroupById(group_id);
          if (!group) return;

          const senderUser = db.getUserById(currentUserId)!;

          const newMsg = db.createMessage({
            conversation_id: group.id,
            group_id: group.id,
            sender_id: currentUserId,
            content: content || '',
            attachment_url,
            attachment_name,
            attachment_type,
          });

          const msgWithSender = { ...newMsg, sender: senderUser };

          // Broadcast to all members of the group
          broadcastToUsers(group.member_ids, 'new_group_message', {
            groupId: group.id,
            message: msgWithSender,
          });
        } 
        // Typing indicator
        else if (action === 'typing') {
          const { recipient_id, conversation_id, group_id, is_typing } = data;
          if (group_id) {
            const group = db.getGroupById(group_id);
            if (group) {
              const otherMembers = group.member_ids.filter((id) => id !== currentUserId);
              broadcastToUsers(otherMembers, 'group_typing_status', {
                groupId: group.id,
                userId: currentUserId,
                is_typing: !!is_typing,
              });
            }
          } else if (recipient_id) {
            broadcastToUser(recipient_id, 'typing_status', {
              userId: currentUserId,
              conversation_id,
              is_typing: !!is_typing,
            });
          }
        } 
        // Mark read
        else if (action === 'mark_read') {
          const { conversation_id, partner_id } = data;
          if (conversation_id) {
            db.markMessagesAsRead(conversation_id, currentUserId);
            if (partner_id) {
              broadcastToUser(partner_id, 'messages_read', {
                conversation_id,
                reader_id: currentUserId,
              });
            }
          }
        } 
        // Toggle reaction
        else if (action === 'toggle_reaction') {
          const { message_id, emoji, recipient_id, group_id } = data;
          if (message_id && emoji) {
            const updated = db.toggleMessageReaction(message_id, currentUserId, emoji);
            if (updated) {
              if (group_id) {
                const group = db.getGroupById(group_id);
                if (group) {
                  broadcastToUsers(group.member_ids, 'reaction_updated', { message: updated, groupId: group_id });
                }
              } else {
                broadcastToUser(currentUserId, 'reaction_updated', { message: updated });
                if (recipient_id) {
                  broadcastToUser(recipient_id, 'reaction_updated', { message: updated });
                }
              }
            }
          }
        } 
        // User Status
        else if (action === 'update_status') {
          const { status, custom_status } = data;
          if (status) {
            db.updateUser(currentUserId, { status, custom_status });
            broadcastToAll('user_status_changed', { userId: currentUserId, status, custom_status });
          }
        }
        // CALL SIGNALING: Call Request
        else if (action === 'call_request') {
          const { targetUserId, callType } = data;
          const caller = db.getUserById(currentUserId);
          if (caller && targetUserId) {
            broadcastToUser(targetUserId, 'incoming_call', {
              callerId: currentUserId,
              caller: {
                id: caller.id,
                username: caller.username,
                avatar: caller.avatar,
                status: caller.status,
                role: caller.role,
                is_admin: caller.is_admin,
              },
              callType: callType || 'video',
            });
          }
        }
        // CALL SIGNALING: Accept Call
        else if (action === 'call_accept') {
          const { callerId, callType } = data;
          const responder = db.getUserById(currentUserId);
          if (callerId && responder) {
            broadcastToUser(callerId, 'call_accepted', {
              responderId: currentUserId,
              responder: {
                id: responder.id,
                username: responder.username,
                avatar: responder.avatar,
                status: responder.status,
              },
              callType: callType || 'video',
            });
          }
        }
        // CALL SIGNALING: Reject Call
        else if (action === 'call_reject') {
          const { callerId, reason } = data;
          if (callerId) {
            broadcastToUser(callerId, 'call_rejected', {
              rejectedBy: currentUserId,
              reason: reason || 'Chamada recusada ou ocupada',
            });
          }
        }
        // CALL SIGNALING: End Call
        else if (action === 'call_end') {
          const { targetUserId } = data;
          if (targetUserId) {
            broadcastToUser(targetUserId, 'call_ended', {
              endedBy: currentUserId,
            });
          }
        }
        // CALL SIGNALING: WebRTC Offer / Answer / ICE Candidate
        else if (action === 'call_signal') {
          const { targetUserId, signal } = data;
          if (targetUserId && signal) {
            broadcastToUser(targetUserId, 'call_signal', {
              fromUserId: currentUserId,
              signal,
            });
          }
        }
        // CALL SIGNALING: Media toggles (mic mute, camera off, screen sharing)
        else if (action === 'call_media_toggle') {
          const { targetUserId, isMuted, isVideoOff, isScreenSharing } = data;
          if (targetUserId) {
            broadcastToUser(targetUserId, 'call_media_state', {
              fromUserId: currentUserId,
              isMuted,
              isVideoOff,
              isScreenSharing,
            });
          }
        }
      } catch (err) {
        console.error('WS message handling error:', err);
      }
    });

    ws.on('close', () => {
      if (currentUserId) {
        removeClient(currentUserId, ws);
        if (!clients.has(currentUserId)) {
          db.updateUser(currentUserId, { last_seen: new Date().toISOString() });
        }
      }
    });
  });

  // Authentication Middleware
  const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticação não fornecido.' });
    }

    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Sessão expirada ou token inválido.' });
    }

    const user = db.getUserById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'Usuário associado a esta sessão não encontrado.' });
    }

    req.user = user;
    next();
  };

  // REST API Routes
  const router = express.Router();

  // Public Health
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'RedChat API', time: new Date().toISOString() });
  });

  // Auth: Register
  router.post('/auth/register', (req, res) => {
    try {
      const { username, email, password, confirmPassword } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos os campos obrigatórios devem ser preenchidos.' });
      }

      if (confirmPassword && password !== confirmPassword) {
        return res.status(400).json({ error: 'A senha e a confirmação de senha não coincidem.' });
      }

      const cleanUsername = username.trim().toLowerCase().replace(/^@/, '');
      if (cleanUsername.length < 3 || cleanUsername.length > 20) {
        return res.status(400).json({ error: 'O nome de usuário deve ter entre 3 e 20 caracteres.' });
      }

      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return res.status(400).json({ error: 'O nome de usuário pode conter apenas letras, números e sublinhados (_).' });
      }

      const cleanEmail = email.trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        return res.status(400).json({ error: 'Endereço de e-mail inválido.' });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
      }

      if (db.getUserByUsername(cleanUsername)) {
        return res.status(400).json({ error: 'Este nome de usuário já está em uso.' });
      }

      if (db.getUserByEmail(cleanEmail)) {
        return res.status(400).json({ error: 'Este e-mail já está cadastrado.' });
      }

      const password_hash = hashPassword(password);
      const now = new Date().toISOString();
      const randomAvatarSeed = encodeURIComponent(cleanUsername);

      const newUser: UserRecord = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        username: cleanUsername,
        email: cleanEmail,
        password_hash,
        avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${randomAvatarSeed}&backgroundColor=1a0d0d,241212,351717`,
        status: 'online',
        custom_status: 'Novo no RedChat 🔴',
        bio: 'Membro entusiasta do RedChat!',
        created_at: now,
        last_seen: now,
      };

      db.createUser(newUser);
      const token = generateToken(newUser);

      const { password_hash: _, ...safeUser } = newUser;
      return res.status(201).json({
        message: 'Cadastro realizado com sucesso!',
        token,
        user: safeUser,
      });
    } catch (err: any) {
      console.error('Register error:', err);
      return res.status(500).json({ error: 'Erro interno ao processar cadastro.' });
    }
  });

  // Auth: Login
  router.post('/auth/login', (req, res) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ error: 'Informe seu usuário/e-mail e sua senha.' });
      }

      const user = db.getUserByUsernameOrEmail(identifier);
      if (!user) {
        return res.status(400).json({ error: 'Usuário ou e-mail não encontrado.' });
      }

      // Check password strictly using bcrypt hash comparison
      const isValid = comparePassword(password, user.password_hash);
      
      if (!isValid) {
        return res.status(400).json({ error: 'Credenciais incorretas. Verifique seu usuário/e-mail e senha.' });
      }

      db.updateUser(user.id, { status: 'online', last_seen: new Date().toISOString() });
      const token = generateToken(user);

      const { password_hash: _, ...safeUser } = user;
      return res.json({
        message: 'Login realizado com sucesso!',
        token,
        user: safeUser,
      });
    } catch (err: any) {
      console.error('Login error:', err);
      return res.status(500).json({ error: 'Erro interno ao processar login.' });
    }
  });

  // Auth: Change Password
  router.post('/auth/change-password', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const currentUser = req.user!;

      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Informe a senha atual e a nova senha.' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'A nova senha deve possuir no mínimo 6 caracteres.' });
      }

      const isCurrentValid = comparePassword(currentPassword, currentUser.password_hash);
      if (!isCurrentValid) {
        return res.status(400).json({ error: 'A senha atual informada está incorreta.' });
      }

      const salt = bcrypt.genSaltSync(10);
      const newHash = bcrypt.hashSync(newPassword, salt);
      db.updateUser(currentUser.id, { password_hash: newHash });

      return res.json({ message: 'Senha atualizada com sucesso!' });
    } catch (err: any) {
      console.error('Change password error:', err);
      return res.status(500).json({ error: 'Erro ao processar alteração de senha.' });
    }
  });

  // Auth: Current User Profile
  router.get('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { password_hash: _, ...safeUser } = req.user!;
    return res.json({ user: safeUser });
  });

  // Auth: Update Profile
  router.put('/auth/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { avatar, status, custom_status, bio, username } = req.body;
      const updates: Partial<UserRecord> = {};

      if (avatar !== undefined) updates.avatar = avatar;
      if (status !== undefined) updates.status = status;
      if (custom_status !== undefined) updates.custom_status = custom_status;
      if (bio !== undefined) updates.bio = bio;

      if (username && username.trim().toLowerCase() !== req.user!.username.toLowerCase()) {
        const clean = username.trim().toLowerCase().replace(/^@/, '');
        const existing = db.getUserByUsername(clean);
        if (existing && existing.id !== req.user!.id) {
          return res.status(400).json({ error: 'Nome de usuário já em uso.' });
        }
        updates.username = clean;
      }

      const updated = db.updateUser(req.user!.id, updates);
      if (!updated) return res.status(404).json({ error: 'Usuário não encontrado' });

      broadcastToAll('user_status_changed', {
        userId: req.user!.id,
        status: updated.status,
        custom_status: updated.custom_status,
      });

      const { password_hash: _, ...safeUser } = updated;
      return res.json({ user: safeUser, message: 'Perfil atualizado com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: 'Erro ao atualizar perfil' });
    }
  });

  // Auth: Demo users for multi-user testing (excluding Admin accounts for security)
  router.get('/auth/demo-users', (req, res) => {
    const demoIds = ['usr_rafaela', 'usr_alex', 'usr_lucas', 'usr_beatriz', 'usr_clara'];
    const users = db.getUsers()
      .filter((u) => demoIds.includes(u.id) && u.role !== 'admin' && !u.is_admin && u.username !== 'admin')
      .map(({ password_hash: _, ...u }) => u);
    return res.json({ users });
  });

  // Auth: Switch user profile
  router.post('/auth/switch-user', (req, res) => {
    const { userId, password } = req.body;
    const demoIds = ['usr_rafaela', 'usr_alex', 'usr_lucas', 'usr_beatriz', 'usr_clara'];
    
    const user = db.getUserById(userId);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado.' });
    
    const isTargetAdmin = user.role === 'admin' || user.is_admin || user.username.toLowerCase() === 'admin' || user.id === 'usr_admin_master';
    const isDemo = !isTargetAdmin && demoIds.includes(user.id);

    // If target is an admin or private user, password is strictly mandatory
    if (isTargetAdmin || !isDemo) {
      if (!password) {
        return res.status(403).json({ 
          error: isTargetAdmin 
            ? 'Acesso restrito: É obrigatório inserir as credenciais do Administrador Master.'
            : 'Para acessar esta conta particular, é obrigatório digitar a senha.' 
        });
      }
      
      const isValid = comparePassword(password, user.password_hash);
      if (!isValid) {
        return res.status(401).json({ error: 'Senha incorreta. Acesso negado à conta.' });
      }
    } else {
      // Standard demo account fallback check if password passed
      if (password) {
        const isValid = comparePassword(password, user.password_hash) || password === 'redchat123';
        if (!isValid) {
          return res.status(401).json({ error: 'Senha incorreta.' });
        }
      }
    }

    db.updateUser(user.id, { status: 'online', last_seen: new Date().toISOString() });
    const token = generateToken(user);
    const { password_hash: _, ...safeUser } = user;
    return res.json({ token, user: safeUser });
  });

  // Admin: Get statistics
  router.get('/admin/stats', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const isAdmin = currentUser.role === 'admin' || currentUser.is_admin || currentUser.username === 'admin';
    if (!isAdmin) return res.status(403).json({ error: 'Acesso restrito apenas ao Administrador Master.' });

    const allUsers = db.getUsers();
    const stats = {
      totalUsers: allUsers.length,
      onlineUsers: allUsers.filter((u) => u.status === 'online').length,
      totalGroups: (db as any).data.groups.length,
      totalMessages: (db as any).data.messages.length,
      totalPosts: (db as any).data.posts.length,
    };
    return res.json({ stats });
  });

  // Admin: Get all users list
  router.get('/admin/users', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const isAdmin = currentUser.role === 'admin' || currentUser.is_admin || currentUser.username === 'admin';
    if (!isAdmin) return res.status(403).json({ error: 'Acesso restrito apenas ao Administrador Master.' });

    const users = db.getUsers().map(({ password_hash: _, ...u }) => u);
    return res.json({ users });
  });

  // Admin: Update user role
  router.put('/admin/users/:id/role', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const isAdmin = currentUser.role === 'admin' || currentUser.is_admin || currentUser.username === 'admin';
    if (!isAdmin) return res.status(403).json({ error: 'Acesso restrito apenas ao Administrador Master.' });

    const { role } = req.body;
    const targetId = req.params.id;
    const updated = db.updateUser(targetId, {
      role: role === 'admin' ? 'admin' : 'user',
      is_admin: role === 'admin',
    });

    if (!updated) return res.status(404).json({ error: 'Usuário não encontrado.' });
    
    broadcastToAll('user_updated', { userId: targetId });
    const { password_hash: _, ...safeUser } = updated;
    return res.json({ user: safeUser, message: 'Função do usuário atualizada com sucesso!' });
  });

  // Admin: Delete user
  router.delete('/admin/users/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const isAdmin = currentUser.role === 'admin' || currentUser.is_admin || currentUser.username === 'admin';
    if (!isAdmin) return res.status(403).json({ error: 'Acesso restrito apenas ao Administrador Master.' });

    const targetId = req.params.id;
    if (targetId === currentUser.id) {
      return res.status(400).json({ error: 'Você não pode excluir sua própria conta de Administrador Master.' });
    }

    const success = db.deleteUser(targetId);
    if (!success) return res.status(404).json({ error: 'Usuário não encontrado.' });

    broadcastToAll('user_deleted', { userId: targetId });
    return res.json({ message: 'Usuário excluído com sucesso do RedChat.' });
  });

  // Admin: System Broadcast Message
  router.post('/admin/broadcast', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const currentUser = req.user!;
    const isAdmin = currentUser.role === 'admin' || currentUser.is_admin || currentUser.username === 'admin';
    if (!isAdmin) return res.status(403).json({ error: 'Acesso restrito apenas ao Administrador Master.' });

    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ error: 'O comunicado não pode estar vazio.' });
    }

    // Send official announcement into general chat
    const broadcastMsg = db.createMessage({
      conversation_id: 'group_general',
      group_id: 'group_general',
      sender_id: currentUser.id,
      content: `📢 [COMUNICADO OFICIAL DO ADMINISTRADOR 👑]\n\n${content.trim()}`,
    });

    const { password_hash: _pass, ...senderSafe } = currentUser;
    broadcastToAll('new_message', {
      message: { ...broadcastMsg, sender: senderSafe as any },
      groupId: 'group_general',
    });

    return res.status(201).json({ message: broadcastMsg });
  });

  // Users: Search
  router.get('/users/search', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const query = (req.query.q as string) || '';
    const results = db.searchUsers(query, req.user!.id).map(({ password_hash: _, ...u }) => u);
    return res.json({ users: results });
  });

  // Users: Get by ID
  router.get('/users/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const user = db.getUserById(req.params.id);
    if (!user) return res.status(404).json({ error: 'Usuário não encontrado' });
    const { password_hash: _, ...safeUser } = user;
    return res.json({ user: safeUser });
  });

  // Conversations: Get all for current user
  router.get('/conversations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const convs = db.getConversationsForUser(req.user!.id);
    return res.json({ conversations: convs });
  });

  // Conversations: Create or get
  router.post('/conversations', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { recipient_id } = req.body;
    if (!recipient_id) return res.status(400).json({ error: 'ID do destinatário é obrigatório' });
    if (recipient_id === req.user!.id) return res.status(400).json({ error: 'Não é possível iniciar conversa consigo mesmo' });

    const partner = db.getUserById(recipient_id);
    if (!partner) return res.status(404).json({ error: 'Destinatário não encontrado' });

    const conv = db.getOrCreateConversation(req.user!.id, recipient_id);
    const messages = db.getMessagesByConversationId(conv.id);
    const last_message = messages.length > 0 ? messages[messages.length - 1] : undefined;

    const { password_hash: _, ...safePartner } = partner;
    return res.json({
      conversation: {
        ...conv,
        partner: safePartner,
        last_message,
        unread_count: 0,
      },
    });
  });

  // Groups: List for user (including Chat Geral)
  router.get('/groups', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const groups = db.getGroupsForUser(req.user!.id);
    return res.json({ groups });
  });

  // Groups: Create group
  router.post('/groups', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name, description, avatar, icon_color, member_ids } = req.body;
      if (!name || name.trim().length === 0) {
        return res.status(400).json({ error: 'O nome do grupo é obrigatório.' });
      }

      const newGroup = db.createGroup({
        name,
        description,
        avatar,
        icon_color,
        created_by: req.user!.id,
        member_ids: member_ids || [],
      });

      const members = newGroup.member_ids.map((id) => db.getUserById(id)).filter(Boolean) as UserRecord[];
      broadcastToUsers(newGroup.member_ids, 'group_created', { group: { ...newGroup, members } });

      return res.status(201).json({ group: { ...newGroup, members } });
    } catch (err) {
      console.error('Create group error:', err);
      return res.status(500).json({ error: 'Erro ao criar grupo.' });
    }
  });

  // Groups: Add member
  router.post('/groups/:id/members', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: 'ID do usuário obrigatório' });

    const success = db.addMemberToGroup(req.params.id, userId);
    if (!success) return res.status(404).json({ error: 'Grupo não encontrado' });

    const group = db.getGroupById(req.params.id)!;
    broadcastToUsers(group.member_ids, 'group_member_added', { groupId: group.id, userId });
    return res.json({ message: 'Membro adicionado com sucesso', group });
  });

  // Groups: Leave / remove member
  router.delete('/groups/:id/members/:userId', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { id: groupId, userId } = req.params;
    const group = db.getGroupById(groupId);
    if (!group) return res.status(404).json({ error: 'Grupo não encontrado' });
    if (group.is_general) return res.status(400).json({ error: 'Não é possível sair do Chat Geral' });

    if (userId !== req.user!.id && group.created_by !== req.user!.id && !req.user!.is_admin) {
      return res.status(403).json({ error: 'Apenas o criador do grupo ou o próprio usuário pode realizar esta ação.' });
    }

    const success = db.removeMemberFromGroup(groupId, userId);
    if (!success) return res.status(400).json({ error: 'Erro ao remover membro' });

    broadcastToUsers(group.member_ids, 'group_member_removed', { groupId, userId });
    return res.json({ message: 'Membro removido com sucesso' });
  });

  // Messages: Get messages for conversation or group
  router.get('/conversations/:id/messages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const conversationId = req.params.id;
    
    // Check if it's a group
    const group = db.getGroupById(conversationId);
    if (group) {
      const messages = db.getMessagesByConversationId(group.id);
      return res.json({ messages });
    }

    // Direct conversation check
    const conv = db.getConversationById(conversationId);
    if (!conv || !conv.participant_ids.includes(req.user!.id)) {
      return res.status(403).json({ error: 'Acesso negado a esta conversa' });
    }

    const messages = db.getMessagesByConversationId(conv.id);
    db.markMessagesAsRead(conv.id, req.user!.id);

    return res.json({ messages });
  });

  // Messages: Send message via HTTP
  router.post('/conversations/:id/messages', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const conversationId = req.params.id;
    const { content, attachment_url, attachment_name, attachment_type } = req.body;

    if (!content && !attachment_url) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    // Check if group
    const group = db.getGroupById(conversationId);
    if (group) {
      const newMsg = db.createMessage({
        conversation_id: group.id,
        group_id: group.id,
        sender_id: req.user!.id,
        content: content || '',
        attachment_url,
        attachment_name,
        attachment_type,
      });

      const sender = req.user!;
      const msgWithSender = { ...newMsg, sender };

      broadcastToUsers(group.member_ids, 'new_group_message', {
        groupId: group.id,
        message: msgWithSender,
      });

      return res.status(201).json({ message: msgWithSender });
    }

    // 1-on-1 Conversation
    const conv = db.getConversationById(conversationId);
    if (!conv || !conv.participant_ids.includes(req.user!.id)) {
      return res.status(403).json({ error: 'Acesso negado a esta conversa' });
    }

    const partnerId = conv.participant_ids.find((id) => id !== req.user!.id) || req.user!.id;
    const newMsg = db.createMessage({
      conversation_id: conv.id,
      sender_id: req.user!.id,
      recipient_id: partnerId,
      content: content || '',
      attachment_url,
      attachment_name,
      attachment_type,
    });

    const msgWithSender = { ...newMsg, sender: req.user! };

    broadcastToUser(req.user!.id, 'new_message', { message: msgWithSender, conversationId: conv.id });
    broadcastToUser(partnerId, 'new_message', { message: msgWithSender, conversationId: conv.id });

    return res.status(201).json({ message: msgWithSender });
  });

  // Messages: Toggle Reaction
  router.post('/messages/:id/reaction', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { emoji, recipient_id, group_id } = req.body;
    if (!emoji) return res.status(400).json({ error: 'Emoji é obrigatório' });

    const updated = db.toggleMessageReaction(req.params.id, req.user!.id, emoji);
    if (!updated) return res.status(404).json({ error: 'Mensagem não encontrada' });

    if (group_id) {
      const group = db.getGroupById(group_id);
      if (group) {
        broadcastToUsers(group.member_ids, 'reaction_updated', { message: updated, groupId: group_id });
      }
    } else {
      broadcastToUser(req.user!.id, 'reaction_updated', { message: updated });
      if (recipient_id) {
        broadcastToUser(recipient_id, 'reaction_updated', { message: updated });
      }
    }

    return res.json({ message: updated });
  });

  // Messages: Delete Message
  router.delete('/messages/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const success = db.deleteMessage(req.params.id, req.user!.id);
    if (!success) return res.status(400).json({ error: 'Não foi possível deletar a mensagem' });

    broadcastToAll('message_deleted', { messageId: req.params.id });
    return res.json({ message: 'Mensagem deletada com sucesso' });
  });

  // Posts: Get feed or user posts
  router.get('/posts', (req, res) => {
    const userId = req.query.userId as string | undefined;
    const posts = db.getPosts(userId);
    return res.json({ posts });
  });

  // Posts: Create post
  router.post('/posts', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    try {
      const { image_url, caption } = req.body;
      if (!image_url) {
        return res.status(400).json({ error: 'A URL ou arquivo da foto é obrigatório.' });
      }

      const post = db.createPost({
        user_id: req.user!.id,
        image_url,
        caption: caption || '',
      });

      broadcastToAll('post_created', { post });
      return res.status(201).json({ post });
    } catch (err) {
      console.error('Create post error:', err);
      return res.status(500).json({ error: 'Erro ao publicar foto.' });
    }
  });

  // Posts: Toggle Like
  router.post('/posts/:id/like', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const result = db.togglePostLike(req.params.id, req.user!.id);
    if (!result) return res.status(404).json({ error: 'Publicação não encontrada' });

    broadcastToAll('post_liked', {
      postId: req.params.id,
      userId: req.user!.id,
      likes: result.likes,
      isLiked: result.isLiked,
    });

    return res.json(result);
  });

  // Posts: Add Comment
  router.post('/posts/:id/comment', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'O comentário não pode estar vazio.' });
    }

    const comment = db.addPostComment(req.params.id, {
      user_id: req.user!.id,
      text,
    });

    if (!comment) return res.status(404).json({ error: 'Publicação não encontrada' });

    broadcastToAll('post_commented', {
      postId: req.params.id,
      comment,
    });

    return res.status(201).json({ comment });
  });

  // Posts: Delete Post
  router.delete('/posts/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const success = db.deletePost(req.params.id, req.user!.id);
    if (!success) return res.status(403).json({ error: 'Não foi possível excluir esta publicação.' });

    broadcastToAll('post_deleted', { postId: req.params.id });
    return res.json({ message: 'Publicação excluída com sucesso.' });
  });

  app.use('/api', router);

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        watch: {
          ignored: ['**/redchat_data.json', '**/backend/**', '**/*.json'],
        },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[RedChat Server] Running on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
