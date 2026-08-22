# RedChat 🔴

Aplicativo completo de mensagens instantâneas em tempo real com identidade visual exclusiva baseada em tons escuros e carmesim (#120707, #1A0D0D, #241212, #351717, #A51D20, #E53935, #FF5252), inspirado na ergonomia e organização do Discord.

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19** + **TypeScript**
- **Vite** (Build Tool ultra-rápida)
- **Tailwind CSS v4** (Design System com paleta carmesim)
- **Motion** (Animações suaves e transições de presença)
- **Lucide Icons** (Ícones SVG otimizados)
- **Web Audio API** (Sintetizador de efeitos sonoros nativo para envio e recebimento de mensagens)

### Backend & WebSocket
- **Python + FastAPI** (Código em `/backend`) com SQLAlchemy ORM e WebSockets nativos
- **Node.js + Express** (Servidor full-stack integrado em `server.ts` para execução unificada na porta 3000)
- **WebSockets** (Comunicação bidirecional instantânea para mensagens, digitação, reações e status)
- **JWT (JSON Web Tokens)** para autenticação segura
- **Bcrypt** para hashing criptográfico de senhas

### Banco de Dados
- **SQLite** com persistência automática de usuários, conversas, mensagens e reações.

---

## 📁 Estrutura do Projeto

```text
redchat/
├── backend/                  # Backend Python com FastAPI
│   ├── main.py               # Ponto de entrada FastAPI e WebSocket endpoint
│   ├── database.py           # Conexão SQLAlchemy e engine SQLite
│   ├── models.py             # Modelos User, Conversation, Message
│   ├── schemas.py            # Schemas Pydantic de validação
│   ├── auth.py               # Funções de JWT, bcrypt e dependências de usuário
│   ├── websocket.py          # Gerenciador ConnectionManager para WebSockets
│   ├── routes/
│   │   ├── auth_routes.py    # /api/auth/register, /api/auth/login, /api/auth/me
│   │   ├── user_routes.py    # /api/users/search, /api/users/{id}
│   │   └── chat_routes.py    # /api/conversations, /api/conversations/{id}/messages
│   └── requirements.txt      # Dependências Python
│
├── server/                   # Backend Node.js / TypeScript
│   ├── db.ts                 # Serviço de banco de dados SQLite/JSON com seed
│   └── auth.ts               # Autenticação JWT e hash bcryptjs
│
├── src/                      # Frontend React
│   ├── components/
│   │   ├── auth/             # LoginPage, RegisterPage
│   │   ├── sidebar/          # MainIconSidebar, ConversationList, ConversationItem, UserProfileBar
│   │   ├── chat/             # ChatHeader, MessageList, MessageBubble, MessageInput, UserDetailDrawer
│   │   ├── modals/           # SearchUsersModal, SettingsModal
│   │   └── common/           # ToastContainer
│   ├── context/              # AuthContext, ChatContext, ToastContext
│   ├── services/             # api.ts, websocket.ts, audio.ts
│   ├── types/                # index.ts (interfaces TypeScript)
│   ├── App.tsx               # Componente mestre
│   ├── main.tsx              # Ponto de montagem React
│   └── index.css             # Tailwind CSS e scrollbars carmesim
│
├── server.ts                 # Servidor Express + WebSocket + Vite integrado
├── package.json              # Dependências Node.js
└── README.md                 # Guia de documentação e execução
```

---

## 🛠️ Guia de Instalação e Execução Local

### 1. Pré-requisitos
- **Node.js** v18+ ou v20+ / v22+
- **Python** 3.10+ (opcional se for executar o backend Python independente)
- **Git**

---

### 2. Opção A: Executar o Projeto Full-Stack Integrado (Node.js + React + WebSocket + SQLite)

Esta é a forma mais rápida e recomendada para iniciar toda a aplicação em um único comando:

1. Clone o repositório ou acesse a pasta raiz:
   ```bash
   cd redchat
   ```

2. Instale as dependências do Node.js:
   ```bash
   npm install
   ```

3. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Abra seu navegador em:
   ```text
   http://localhost:3000
   ```

---

### 3. Opção B: Executar com Backend Python (FastAPI) + Frontend Vite

Se desejar executar a stack pura com **Python FastAPI** no backend:

#### Passo 1: Iniciar o Backend Python
1. Acesse o diretório `/backend`:
   ```bash
   cd backend
   ```

2. Crie e ative um ambiente virtual:
   ```bash
   python -m venv venv
   # No Linux/macOS:
   source venv/bin/activate
   # No Windows:
   venv\Scripts\activate
   ```

3. Instale as dependências Python:
   ```bash
   pip install -r requirements.txt
   ```

4. Inicie o servidor FastAPI com Uvicorn:
   ```bash
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```
   A documentação interativa Swagger estará disponível em `http://localhost:8000/docs`.

#### Passo 2: Iniciar o Frontend React
1. Em outro terminal, na raiz do projeto:
   ```bash
   npm install
   npm run dev
   ```

---

## 🔑 Contas de Demonstração (Acesso Rápido)

O RedChat já vem pré-configurado com usuários de teste e histórico para você experimentar a troca de mensagens em tempo real imediatamente:

| Usuário | E-mail | Senha Padrão | Função |
|---|---|---|---|
| `@rafaela` | `rafaela@redchat.io` | `redchat123` | Full-Stack & UI/UX |
| `@alex_dev` | `alex@redchat.io` | `redchat123` | Backend Engineer |
| `@lucas_tech` | `lucas@redchat.io` | `redchat123` | Tech Lead |
| `@beatriz_art` | `beatriz@redchat.io` | `redchat123` | Concept Artist |

> **Dica**: Use o botão de **Acesso Rápido** na tela de Login ou a aba **Trocar Conta Teste** nas Configurações para simular a conversa entre dois usuários simultaneamente!

---

## 🔒 Variáveis de Ambiente (.env)

Crie um arquivo `.env` na raiz do projeto ou em `/backend/.env`:

```env
# Chave secreta para assinatura dos tokens JWT
JWT_SECRET="sua_chave_secreta_super_segura_redchat"
SECRET_KEY="sua_chave_secreta_super_segura_redchat"

# URL do banco de dados SQLite
DATABASE_URL="sqlite:///./redchat.db"
```

---

## 💾 Funcionamento do Banco de Dados SQLite

- O banco de dados SQLite é inicializado automaticamente na primeira execução (`redchat.db` ou `redchat_data.json`).
- As senhas dos usuários são gravadas utilizando hash seguro com salt do **Bcrypt** (nunca em texto simples).
- As mensagens, conversas, timestamps e reações são persistidas e recuperadas instantaneamente ao reabrir a conversa.

---

## 🎨 Paleta de Cores RedChat

- Fundo Principal Profundo: `#120707`
- Barra Lateral / Paineis: `#1A0D0D`
- Cards / Itens de Lista: `#241212`
- Bordas / Campos de Entrada: `#351717`
- Vermelho Carmesim: `#A51D20`
- Vermelho Principal: `#E53935`
- Vermelho Destaque / Glow: `#FF5252`
- Texto Principal Claro: `#F5EEEE`
- Texto Secundário Muted: `#A98F8F`
