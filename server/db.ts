import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  avatar: string;
  status: 'online' | 'idle' | 'dnd' | 'offline';
  custom_status: string;
  bio: string;
  role?: 'admin' | 'user';
  is_admin?: boolean;
  created_at: string;
  last_seen: string;
}

export interface ConversationRecord {
  id: string;
  created_at: string;
  updated_at: string;
  participant_ids: string[];
}

export interface GroupRecord {
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
}

export interface MessageReactionRecord {
  emoji: string;
  user_ids: string[];
}

export interface MessageRecord {
  id: string;
  conversation_id: string;
  group_id?: string;
  sender_id: string;
  recipient_id?: string;
  content: string;
  attachment_url?: string;
  attachment_name?: string;
  attachment_type?: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read';
  reactions: MessageReactionRecord[];
}

export interface PostCommentRecord {
  id: string;
  user_id: string;
  username: string;
  user_avatar: string;
  text: string;
  created_at: string;
}

export interface PostRecord {
  id: string;
  user_id: string;
  image_url: string;
  caption: string;
  likes: string[];
  comments: PostCommentRecord[];
  created_at: string;
}

interface DatabaseSchema {
  users: UserRecord[];
  conversations: ConversationRecord[];
  groups: GroupRecord[];
  messages: MessageRecord[];
  posts: PostRecord[];
}

const DB_FILE = path.join(process.cwd(), 'redchat_data.json');

class DatabaseService {
  private data: DatabaseSchema = {
    users: [],
    conversations: [],
    groups: [],
    messages: [],
    posts: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data.groups) this.data.groups = [];
        if (!this.data.posts) this.data.posts = [];
        this.ensureAdminUser();
        this.ensureGeneralGroup();
        this.ensureSeedPosts();
      } else {
        this.seedInitialData();
        this.save();
      }
    } catch (e) {
      console.error('Error loading database file, re-initializing:', e);
      this.seedInitialData();
      this.save();
    }
  }

  private ensureAdminUser() {
    const salt = bcrypt.genSaltSync(10);
    const adminPasswordHash = bcrypt.hashSync('RedChat#Admin2026!', salt);
    
    // Check if usr_admin_master exists
    let adminMaster = this.data.users.find((u) => u.id === 'usr_admin_master');
    if (!adminMaster) {
      adminMaster = {
        id: 'usr_admin_master',
        username: 'admin',
        email: 'admin@redchat.io',
        password_hash: adminPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        status: 'online',
        custom_status: '👑 Administrador Master • RedChat System',
        bio: 'Conta de Administração Master do RedChat. Acesso total a controles de sistema, moderação e configurações avançadas.',
        role: 'admin',
        is_admin: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
        last_seen: new Date().toISOString(),
      };
      this.data.users.unshift(adminMaster);
    } else {
      adminMaster.role = 'admin';
      adminMaster.is_admin = true;
      adminMaster.password_hash = adminPasswordHash;
    }

    // Also guarantee any existing accounts with username 'admin' or matching email have admin role
    this.data.users.forEach((u) => {
      if (u.username.toLowerCase() === 'admin' || u.email.toLowerCase() === 'admin@redchat.io' || u.email.toLowerCase() === 'etecrafaellawallcalejon@gmail.com') {
        u.role = 'admin';
        u.is_admin = true;
      }
    });

    this.save();
  }

  private ensureGeneralGroup() {
    const allUserIds = this.data.users.map((u) => u.id);
    let generalGroup = this.data.groups.find((g) => g.id === 'group_general' || g.is_general);

    if (!generalGroup) {
      generalGroup = {
        id: 'group_general',
        name: 'Chat Geral 🔴',
        description: 'Canal oficial aberto para todos os membros da comunidade RedChat!',
        avatar: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80',
        icon_color: '#E53935',
        created_by: 'usr_admin_master',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
        updated_at: new Date().toISOString(),
        is_general: true,
        member_ids: allUserIds,
      };
      this.data.groups.unshift(generalGroup);

      // Add welcome messages to general chat if none exist
      const existingMsgs = this.data.messages.filter((m) => m.group_id === 'group_general');
      if (existingMsgs.length === 0) {
        this.data.messages.push(
          {
            id: 'msg_gen_1',
            conversation_id: 'group_general',
            group_id: 'group_general',
            sender_id: 'usr_admin_master',
            content: '👋 Sejam todos bem-vindos ao Chat Geral do RedChat! Aqui todos os usuários cadastrados podem interagir, trocar ideias, marcar reuniões e compartilhar fotos.',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
            status: 'read',
            reactions: [{ emoji: '🎉', user_ids: ['usr_rafaela', 'usr_alex'] }],
          },
          {
            id: 'msg_gen_2',
            conversation_id: 'group_general',
            group_id: 'group_general',
            sender_id: 'usr_rafaela',
            content: 'Que legal esse espaço para toda a equipe! Já testaram a chamada de vídeo com compartilhamento de tela?',
            timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
            status: 'read',
            reactions: [{ emoji: '🚀', user_ids: ['usr_admin_master', 'usr_lucas'] }],
          },
          {
            id: 'msg_gen_3',
            conversation_id: 'group_general',
            group_id: 'group_general',
            sender_id: 'usr_alex',
            content: 'Testei aqui e a qualidade da voz e a transmissão de tela estão super rápidas! 🎙️🖥️',
            timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
            status: 'read',
            reactions: [{ emoji: '❤️', user_ids: ['usr_rafaela'] }],
          }
        );
      }
      this.save();
    } else {
      // Ensure all users are in general group
      for (const uid of allUserIds) {
        if (!generalGroup.member_ids.includes(uid)) {
          generalGroup.member_ids.push(uid);
        }
      }
      this.save();
    }
  }

  private ensureSeedPosts() {
    if (this.data.posts && this.data.posts.length > 0) return;

    this.data.posts = [
      {
        id: 'post_1',
        user_id: 'usr_rafaela',
        image_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        caption: 'Novo setup dark carmesim pronto para a maratona de desenvolvimento! 🔴💻 O que acharam das luzes?',
        likes: ['usr_alex', 'usr_lucas', 'usr_beatriz'],
        comments: [
          {
            id: 'cmt_1',
            user_id: 'usr_alex',
            username: 'alex_dev',
            user_avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
            text: 'Ficou sensacional! Combina 100% com a paleta do RedChat 🔥',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
          },
          {
            id: 'cmt_2',
            user_id: 'usr_beatriz',
            username: 'beatriz_art',
            user_avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
            text: 'Amei esse teclado mecânico e a iluminação!',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          },
        ],
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      },
      {
        id: 'post_2',
        user_id: 'usr_beatriz',
        image_url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
        caption: 'Explorando novas texturas e gradientes avermelhados na concept art de hoje 🎨✨',
        likes: ['usr_rafaela', 'usr_clara'],
        comments: [
          {
            id: 'cmt_3',
            user_id: 'usr_rafaela',
            username: 'rafaela',
            user_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
            text: 'Incrível essa harmonia de cores!',
            created_at: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
          },
        ],
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      },
      {
        id: 'post_3',
        user_id: 'usr_admin_master',
        image_url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=80',
        caption: '👑 Servidores RedChat atualizados com sucesso. WebSockets em baixa latência e suporte para chamadas de áudio, vídeo e compartilhamento de tela!',
        likes: ['usr_rafaela', 'usr_alex', 'usr_lucas', 'usr_clara', 'usr_beatriz'],
        comments: [],
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ];
    this.save();
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database file:', e);
    }
  }

  private seedInitialData() {
    const salt = bcrypt.genSaltSync(10);
    const defaultPasswordHash = bcrypt.hashSync('redchat123', salt);
    const adminPasswordHash = bcrypt.hashSync('RedChat#Admin2026!', salt);
    const now = new Date().toISOString();

    const users: UserRecord[] = [
      {
        id: 'usr_admin_master',
        username: 'admin',
        email: 'admin@redchat.io',
        password_hash: adminPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
        status: 'online',
        custom_status: '👑 Administrador Master • RedChat System',
        bio: 'Conta de Administração Master do RedChat. Acesso total a controles de sistema, moderação e configurações avançadas.',
        role: 'admin',
        is_admin: true,
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString(),
        last_seen: now,
      },
      {
        id: 'usr_rafaela',
        username: 'rafaela',
        email: 'rafaela@redchat.io',
        password_hash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        status: 'online',
        custom_status: 'Explorando o novo tema vermelho carmesim 🔴',
        bio: 'Desenvolvedora Full-Stack & Designer UI/UX. Apaixonada por interfaces elegantes e tecnologia.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        last_seen: now,
      },
      {
        id: 'usr_alex',
        username: 'alex_dev',
        email: 'alex@redchat.io',
        password_hash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
        status: 'online',
        custom_status: 'Codando em TypeScript e Python ⚡',
        bio: 'Engenheiro de Software Backend. Amante de WebSockets, bancos de dados distribuídos e café expresso.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        last_seen: now,
      },
      {
        id: 'usr_lucas',
        username: 'lucas_tech',
        email: 'lucas@redchat.io',
        password_hash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        status: 'idle',
        custom_status: 'Em reunião de sprint 🎧',
        bio: 'Tech Lead & entusiasta de código aberto. Sempre buscando performance máxima.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
        last_seen: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: 'usr_beatriz',
        username: 'beatriz_art',
        email: 'beatriz@redchat.io',
        password_hash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
        status: 'dnd',
        custom_status: 'Finalizando mockups (Não Perturbar) 🎨',
        bio: 'Concept Artist & Ilustradora Digital. Criando artes temáticas com paleta carmesim.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        last_seen: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      },
      {
        id: 'usr_clara',
        username: 'clara_code',
        email: 'clara@redchat.io',
        password_hash: defaultPasswordHash,
        avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
        status: 'offline',
        custom_status: 'Voltando mais tarde 🌙',
        bio: 'DevOps Specialist. Automatizando pipelines e garantindo estabilidade 24/7.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        last_seen: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
    ];

    const conversations: ConversationRecord[] = [
      {
        id: 'conv_rafaela_alex',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        participant_ids: ['usr_rafaela', 'usr_alex'],
      },
      {
        id: 'conv_rafaela_lucas',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        participant_ids: ['usr_rafaela', 'usr_lucas'],
      },
      {
        id: 'conv_rafaela_beatriz',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        participant_ids: ['usr_rafaela', 'usr_beatriz'],
      },
    ];

    const groups: GroupRecord[] = [
      {
        id: 'group_general',
        name: 'Chat Geral 🔴',
        description: 'Canal oficial aberto para todos os membros da comunidade RedChat!',
        avatar: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=150&auto=format&fit=crop&q=80',
        icon_color: '#E53935',
        created_by: 'usr_admin_master',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 100).toISOString(),
        updated_at: new Date().toISOString(),
        is_general: true,
        member_ids: users.map((u) => u.id),
      },
      {
        id: 'group_dev_team',
        name: 'Equipe de Devs 💻',
        description: 'Discussões técnicas sobre novas features, WebSockets e UI/UX.',
        avatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150&auto=format&fit=crop&q=80',
        icon_color: '#A51D20',
        created_by: 'usr_rafaela',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
        updated_at: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        is_general: false,
        member_ids: ['usr_rafaela', 'usr_alex', 'usr_lucas', 'usr_admin_master'],
      },
    ];

    const messages: MessageRecord[] = [
      {
        id: 'msg_1',
        conversation_id: 'conv_rafaela_alex',
        sender_id: 'usr_alex',
        recipient_id: 'usr_rafaela',
        content: 'Olá! Seja bem-vinda ao RedChat! O que achou da nova interface escura e vermelha?',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'read',
        reactions: [{ emoji: '🔥', user_ids: ['usr_rafaela'] }],
      },
      {
        id: 'msg_2',
        conversation_id: 'conv_rafaela_alex',
        sender_id: 'usr_rafaela',
        recipient_id: 'usr_alex',
        content: 'Ficou incrível! O contraste entre o preto #120707 e os toques em #E53935 traz uma pegada super moderna sem cansar a vista.',
        timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        status: 'read',
        reactions: [{ emoji: '❤️', user_ids: ['usr_alex'] }],
      },
      {
        id: 'msg_3',
        conversation_id: 'conv_rafaela_alex',
        sender_id: 'usr_alex',
        recipient_id: 'usr_rafaela',
        content: 'Perfeito! Vamos testar as chamadas de voz e vídeo também. O áudio está cristalino!',
        timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
        status: 'read',
        reactions: [],
      },
      {
        id: 'msg_4',
        conversation_id: 'conv_rafaela_lucas',
        sender_id: 'usr_lucas',
        recipient_id: 'usr_rafaela',
        content: 'Rafaela, vamos alinhar a próxima sprint hoje à tarde no chat de voz?',
        timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
        status: 'delivered',
        reactions: [{ emoji: '👍', user_ids: ['usr_rafaela'] }],
      },
      {
        id: 'msg_gen_1',
        conversation_id: 'group_general',
        group_id: 'group_general',
        sender_id: 'usr_admin_master',
        content: '👋 Sejam todos bem-vindos ao Chat Geral do RedChat! Aqui todos os usuários cadastrados podem interagir, trocar ideias, marcar reuniões e compartilhar fotos.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        status: 'read',
        reactions: [{ emoji: '🎉', user_ids: ['usr_rafaela', 'usr_alex'] }],
      },
      {
        id: 'msg_gen_2',
        conversation_id: 'group_general',
        group_id: 'group_general',
        sender_id: 'usr_rafaela',
        content: 'Que legal esse espaço para toda a equipe! Já testaram a chamada de vídeo com compartilhamento de tela?',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        status: 'read',
        reactions: [{ emoji: '🚀', user_ids: ['usr_admin_master', 'usr_lucas'] }],
      },
      {
        id: 'msg_grp_dev_1',
        conversation_id: 'group_dev_team',
        group_id: 'group_dev_team',
        sender_id: 'usr_alex',
        content: 'Subi o novo módulo de WebRTC e compartilhamento de tela. Está rodando 100%!',
        timestamp: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
        status: 'read',
        reactions: [{ emoji: '⚡', user_ids: ['usr_rafaela', 'usr_lucas'] }],
      },
    ];

    this.data = {
      users,
      conversations,
      groups,
      messages,
      posts: [],
    };
    this.ensureSeedPosts();
  }

  // Users
  public getUsers(): UserRecord[] {
    return this.data.users;
  }

  public getUserById(id: string): UserRecord | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getUserByUsername(username: string): UserRecord | undefined {
    return this.data.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
  }

  public getUserByEmail(email: string): UserRecord | undefined {
    return this.data.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
  }

  public getUserByUsernameOrEmail(identifier: string): UserRecord | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      (u) =>
        u.username.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        (clean.startsWith('@') && u.username.toLowerCase() === clean.slice(1))
    );
  }

  public createUser(user: UserRecord): UserRecord {
    this.data.users.push(user);
    // Automatically add to general group
    const generalGroup = this.data.groups.find((g) => g.id === 'group_general' || g.is_general);
    if (generalGroup && !generalGroup.member_ids.includes(user.id)) {
      generalGroup.member_ids.push(user.id);
    }
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<UserRecord>): UserRecord | undefined {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return undefined;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    this.save();
    return this.data.users[index];
  }

  public deleteUser(id: string): boolean {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return false;
    this.data.users.splice(index, 1);
    
    // Remove from groups
    this.data.groups.forEach((g) => {
      const memberIdx = g.member_ids.indexOf(id);
      if (memberIdx > -1) g.member_ids.splice(memberIdx, 1);
    });

    this.save();
    return true;
  }

  public searchUsers(query: string, currentUserId: string): UserRecord[] {
    const q = query.trim().toLowerCase().replace(/^@/, '');
    return this.data.users
      .filter((u) => u.id !== currentUserId)
      .filter(
        (u) =>
          u.username.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.custom_status && u.custom_status.toLowerCase().includes(q))
      );
  }

  // Conversations (1-on-1)
  public getConversationsForUser(userId: string): Array<ConversationRecord & { partner: UserRecord; last_message?: MessageRecord; unread_count: number }> {
    const userConvs = this.data.conversations.filter((c) =>
      c.participant_ids.includes(userId)
    );

    return userConvs.map((conv) => {
      const partnerId = conv.participant_ids.find((id) => id !== userId) || userId;
      const partner = this.getUserById(partnerId) || {
        id: partnerId,
        username: 'desconhecido',
        email: 'user@redchat.io',
        password_hash: '',
        avatar: '',
        status: 'offline',
        custom_status: '',
        bio: '',
        created_at: new Date().toISOString(),
        last_seen: new Date().toISOString(),
      };
      
      const convMessages = this.data.messages.filter((m) => m.conversation_id === conv.id);
      const last_message = convMessages.length > 0 ? convMessages[convMessages.length - 1] : undefined;
      const unread_count = convMessages.filter((m) => m.recipient_id === userId && m.status !== 'read').length;

      return {
        ...conv,
        partner,
        last_message,
        unread_count,
      };
    }).sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
  }

  public getOrCreateConversation(userId1: string, userId2: string): ConversationRecord {
    let conv = this.data.conversations.find(
      (c) =>
        (c.participant_ids[0] === userId1 && c.participant_ids[1] === userId2) ||
        (c.participant_ids[0] === userId2 && c.participant_ids[1] === userId1)
    );

    if (!conv) {
      const now = new Date().toISOString();
      conv = {
        id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        created_at: now,
        updated_at: now,
        participant_ids: [userId1, userId2],
      };
      this.data.conversations.unshift(conv);
      this.save();
    }

    return conv;
  }

  public getConversationById(id: string): ConversationRecord | undefined {
    return this.data.conversations.find((c) => c.id === id);
  }

  // Groups
  public getGroupsForUser(userId: string): Array<GroupRecord & { members: UserRecord[]; last_message?: MessageRecord; unread_count: number }> {
    // Ensure user is in general chat
    const general = this.data.groups.find((g) => g.is_general || g.id === 'group_general');
    if (general && !general.member_ids.includes(userId)) {
      general.member_ids.push(userId);
      this.save();
    }

    const userGroups = this.data.groups.filter((g) => g.is_general || g.member_ids.includes(userId));

    return userGroups.map((g) => {
      const members = g.member_ids.map((id) => this.getUserById(id)).filter(Boolean) as UserRecord[];
      const groupMsgs = this.data.messages.filter((m) => m.group_id === g.id || m.conversation_id === g.id);
      const last_message = groupMsgs.length > 0 ? groupMsgs[groupMsgs.length - 1] : undefined;
      const unread_count = 0; // Groups unread count handled client side or 0 for now

      return {
        ...g,
        members,
        last_message,
        unread_count,
      };
    }).sort((a, b) => {
      if (a.is_general) return -1;
      if (b.is_general) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    });
  }

  public getGroupById(id: string): GroupRecord | undefined {
    return this.data.groups.find((g) => g.id === id);
  }

  public createGroup(groupData: { name: string; description: string; avatar?: string; icon_color?: string; created_by: string; member_ids: string[] }): GroupRecord {
    const now = new Date().toISOString();
    const members = Array.from(new Set([groupData.created_by, ...(groupData.member_ids || [])]));
    
    const newGroup: GroupRecord = {
      id: `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: groupData.name.trim(),
      description: groupData.description?.trim() || '',
      avatar: groupData.avatar || `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(groupData.name)}&backgroundColor=1a0d0d,241212,351717`,
      icon_color: groupData.icon_color || '#E53935',
      created_by: groupData.created_by,
      created_at: now,
      updated_at: now,
      is_general: false,
      member_ids: members,
    };

    this.data.groups.push(newGroup);

    // Initial system message in the new group
    this.createMessage({
      conversation_id: newGroup.id,
      group_id: newGroup.id,
      sender_id: groupData.created_by,
      content: `🎉 Grupo "${newGroup.name}" foi criado!`,
    });

    this.save();
    return newGroup;
  }

  public addMemberToGroup(groupId: string, userId: string): boolean {
    const group = this.getGroupById(groupId);
    if (!group) return false;
    if (!group.member_ids.includes(userId)) {
      group.member_ids.push(userId);
      group.updated_at = new Date().toISOString();
      this.save();
    }
    return true;
  }

  public removeMemberFromGroup(groupId: string, userId: string): boolean {
    const group = this.getGroupById(groupId);
    if (!group || group.is_general) return false; // Cannot leave general chat
    const index = group.member_ids.indexOf(userId);
    if (index > -1) {
      group.member_ids.splice(index, 1);
      group.updated_at = new Date().toISOString();
      this.save();
      return true;
    }
    return false;
  }

  // Messages
  public getMessagesByConversationId(conversationId: string): Array<MessageRecord & { sender?: UserRecord }> {
    const msgs = this.data.messages.filter(
      (m) => m.conversation_id === conversationId || m.group_id === conversationId
    );

    return msgs.map((m) => {
      const sender = this.getUserById(m.sender_id);
      return {
        ...m,
        sender,
      };
    });
  }

  public createMessage(msg: Omit<MessageRecord, 'id' | 'timestamp' | 'status' | 'reactions'>): MessageRecord {
    const newMessage: MessageRecord = {
      ...msg,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      status: 'sent',
      reactions: [],
    };

    this.data.messages.push(newMessage);

    // Update conversation or group updated_at
    if (msg.group_id) {
      const grpIndex = this.data.groups.findIndex((g) => g.id === msg.group_id);
      if (grpIndex !== -1) {
        this.data.groups[grpIndex].updated_at = newMessage.timestamp;
      }
    } else {
      const convIndex = this.data.conversations.findIndex((c) => c.id === msg.conversation_id);
      if (convIndex !== -1) {
        this.data.conversations[convIndex].updated_at = newMessage.timestamp;
      }
    }

    this.save();
    return newMessage;
  }

  public markMessagesAsRead(conversationId: string, recipientId: string): void {
    let changed = false;
    for (const msg of this.data.messages) {
      if (
        (msg.conversation_id === conversationId || msg.group_id === conversationId) &&
        msg.recipient_id === recipientId &&
        msg.status !== 'read'
      ) {
        msg.status = 'read';
        changed = true;
      }
    }
    if (changed) {
      this.save();
    }
  }

  public toggleMessageReaction(messageId: string, userId: string, emoji: string): MessageRecord | undefined {
    const msg = this.data.messages.find((m) => m.id === messageId);
    if (!msg) return undefined;

    if (!msg.reactions) msg.reactions = [];

    const existingReactionIndex = msg.reactions.findIndex((r) => r.emoji === emoji);
    if (existingReactionIndex > -1) {
      const userIndex = msg.reactions[existingReactionIndex].user_ids.indexOf(userId);
      if (userIndex > -1) {
        msg.reactions[existingReactionIndex].user_ids.splice(userIndex, 1);
        if (msg.reactions[existingReactionIndex].user_ids.length === 0) {
          msg.reactions.splice(existingReactionIndex, 1);
        }
      } else {
        msg.reactions[existingReactionIndex].user_ids.push(userId);
      }
    } else {
      msg.reactions.push({ emoji, user_ids: [userId] });
    }

    this.save();
    return msg;
  }

  public deleteMessage(messageId: string, userId: string): boolean {
    const user = this.getUserById(userId);
    const isAdmin = user?.role === 'admin' || user?.is_admin || user?.username === 'admin';
    const index = this.data.messages.findIndex(
      (m) => m.id === messageId && (m.sender_id === userId || isAdmin)
    );
    if (index === -1) return false;
    this.data.messages.splice(index, 1);
    this.save();
    return true;
  }

  // Posts / Gallery Feed
  public getPosts(userId?: string): Array<PostRecord & { user: UserRecord }> {
    let list = this.data.posts;
    if (userId) {
      list = list.filter((p) => p.user_id === userId);
    }

    return list
      .map((p) => {
        const user = this.getUserById(p.user_id) || {
          id: p.user_id,
          username: 'usuario',
          email: '',
          password_hash: '',
          avatar: '',
          status: 'offline',
          custom_status: '',
          bio: '',
          created_at: '',
          last_seen: '',
        };
        return {
          ...p,
          user,
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public createPost(postData: { user_id: string; image_url: string; caption: string }): PostRecord & { user: UserRecord } {
    const newPost: PostRecord = {
      id: `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      user_id: postData.user_id,
      image_url: postData.image_url,
      caption: postData.caption || '',
      likes: [],
      comments: [],
      created_at: new Date().toISOString(),
    };

    this.data.posts.unshift(newPost);
    this.save();

    const user = this.getUserById(postData.user_id)!;
    return { ...newPost, user };
  }

  public togglePostLike(postId: string, userId: string): { likes: string[]; isLiked: boolean } | undefined {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) return undefined;

    const index = post.likes.indexOf(userId);
    let isLiked = false;
    if (index > -1) {
      post.likes.splice(index, 1);
      isLiked = false;
    } else {
      post.likes.push(userId);
      isLiked = true;
    }

    this.save();
    return { likes: post.likes, isLiked };
  }

  public addPostComment(postId: string, commentData: { user_id: string; text: string }): PostCommentRecord | undefined {
    const post = this.data.posts.find((p) => p.id === postId);
    if (!post) return undefined;

    const user = this.getUserById(commentData.user_id);
    if (!user) return undefined;

    const comment: PostCommentRecord = {
      id: `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      user_id: user.id,
      username: user.username,
      user_avatar: user.avatar,
      text: commentData.text.trim(),
      created_at: new Date().toISOString(),
    };

    post.comments.push(comment);
    this.save();
    return comment;
  }

  public deletePost(postId: string, userId: string): boolean {
    const user = this.getUserById(userId);
    const isAdmin = user?.role === 'admin' || user?.is_admin || user?.username === 'admin';
    const index = this.data.posts.findIndex(
      (p) => p.id === postId && (p.user_id === userId || isAdmin)
    );
    if (index === -1) return false;
    this.data.posts.splice(index, 1);
    this.save();
    return true;
  }
}

export const db = new DatabaseService();
