# SphereChat | Real-Time PERN Stack Messenger

A complete, production-ready, real-time chat application built using the **PERN stack** (PostgreSQL, Express.js, React, Node.js) and **WebSockets (Socket.IO)** with a modern **Material UI (MUI)** interface.

---

## 🌟 Key Features

- **⚡ Instant Messaging with Socket.IO**: Real-time bi-directional message broadcasting with sub-millisecond delivery without page refreshes.
- **🔐 JWT Authentication**: Secure password hashing with `bcryptjs`, JSON Web Token generation, protected REST endpoints, and handshake authentication on WebSockets.
- **👥 Private & Group Chats**:
  - **1-on-1 Direct Chats**: Automatic detection of existing direct rooms between two users (prevents duplicate direct conversations).
  - **Group Chats**: Create group channels with custom names and multiple members, complete with admin role assignment.
- **🟢 Live Online/Offline Presence Indicators**: Real-time tracking of active user socket sessions; automatically updates avatars with green status badges upon connect/disconnect.
- **✍️ Real-Time Typing Indicators**: Debounced `"Alice is typing..."` notifications with animated pulsing dots.
- **📅 Formatted Timestamps & Chat History**: Messages sorted chronologically with dynamic date dividers ("Today", "Yesterday", etc.) and read checkmarks.
- **🐘 Managed PostgreSQL Database**:
  - Fully compatible with managed PostgreSQL cloud providers (e.g., **Neon.tech**, **Supabase**, **Railway**, **Render**, **Aiven**) and local PostgreSQL.
  - Automatic SSL configuration (`rejectUnauthorized: false` for cloud pools).
  - Auto-initialization on startup (`CREATE TABLE IF NOT EXISTS...`).
- **🎨 Modern Material UI (MUI) Design**:
  - Dark mode by default with one-click Light Mode toggle.
  - Smooth glassmorphism, rounded chat bubbles, responsive layout for desktop and mobile devices.
  - Quick-start demo account autofill buttons for rapid testing.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   React 18 + Material UI (Client)           │
│  - Auth Context (JWT)   - Socket Context (Presence & Events) │
│  - Responsive Layout    - Chat Sidebar & Active Room Area   │
└──────────────┬──────────────────────────────┬───────────────┘
               │ HTTP REST (Axios)            │ WebSockets (Socket.IO)
               │ (Auth, Rooms, History)       │ (Live Messaging, Typing)
┌──────────────▼──────────────────────────────▼───────────────┐
│               Express.js + Node.js (Server)                 │
│  - JWT Middleware       - Socket Handshake Auth             │
│  - REST Controllers     - In-Memory Presence & Sockets Map  │
└──────────────────────────────┬──────────────────────────────┘
                               │ pg (Connection Pool with SSL)
┌──────────────────────────────▼──────────────────────────────┐
│                  PostgreSQL Database                        │
│  - users               - rooms                              │
│  - room_members        - messages                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 🗄️ PostgreSQL Database Schema

```sql
-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Chat Rooms Table
CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100), -- NULL for 1-on-1 direct; room name for groups
    type VARCHAR(20) NOT NULL CHECK (type IN ('direct', 'group')),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Room Members Junction Table
CREATE TABLE room_members (
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (room_id, user_id)
);

-- 4. Messages Table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18.x or higher)
- **PostgreSQL Database**:
  - **Managed (Recommended)**: Free PostgreSQL database on [Neon.tech](https://neon.tech/) or [Supabase](https://supabase.com/).
  - **Or Local**: A running PostgreSQL instance on `localhost:5432`.

---

### Step 1: Configure Environment Variables

Create a `.env` file in the project root (or inside `server/.env`) using `.env.example`:

```bash
cp .env.example .env
```

Edit `.env` with your PostgreSQL database connection:

#### Option A: Managed PostgreSQL (e.g. Neon.tech / Supabase / Render)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_pern_chat_2026_xyz!@#$
CLIENT_URL=http://localhost:5173

# Paste your managed connection string with sslmode=require
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sparkling-base-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### Option B: Local PostgreSQL
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=super_secret_jwt_key_pern_chat_2026_xyz!@#$
CLIENT_URL=http://localhost:5173

DB_HOST=localhost
DB_PORT=5432
DB_NAME=chatapp_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_SSL=false
```

---

### Step 2: Install Dependencies

From the project root:

```bash
# Install root, server, and client dependencies concurrently
npm run install:all
```

*(Alternatively, run `npm install` inside the root, `server/`, and `client/` directories.)*

---

### Step 3: Initialize and Seed the Database

Run the database schema setup and seed demo users:

```bash
# 1. Create tables and indexes in PostgreSQL
npm run db:init

# 2. Seed demo users and conversations
npm run db:seed
```

> **Seed Data Created:**
> - **Demo Users**: `alice`, `bob`, `charlie`, `diana` (Password: `Password123!`)
> - **Direct Chat**: Initial conversation between Alice & Bob
> - **Group Chat**: *"PERN Dev Team"* with all 4 participants

---

### Step 4: Run the Application

Start both the backend server and frontend development server simultaneously:

```bash
npm run dev
```

- **Backend API & WebSockets**: [http://localhost:5000](http://localhost:5000)
- **Frontend React UI**: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testing Real-Time Interactions

1. Open [http://localhost:5173](http://localhost:5173) in your normal browser window and click the **`alice`** demo button to sign in.
2. Open [http://localhost:5173](http://localhost:5173) in an **Incognito / Private Window** and click the **`bob`** demo button to sign in.
3. Observe:
   - **Online Status**: Alice sees Bob's status dot turn **Green** instantly.
   - **Live Messaging**: Type a message from Alice to Bob — it appears immediately on Bob's screen with no page refresh.
   - **Typing Indicator**: When Bob types, Alice sees `"Bob is typing..."` with animated bouncing dots in real time.
   - **Sidebar Sync**: The last message snippet and timestamp in the sidebar update immediately.

---

## 📡 Socket.IO Real-Time Events Reference

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join_room` | Client ➔ Server | `roomId` | Joins a Socket.IO room channel |
| `leave_room` | Client ➔ Server | `roomId` | Leaves a Socket.IO room channel |
| `send_message` | Client ➔ Server | `{ roomId, content }` | Persists message to DB & broadcasts to room |
| `receive_message` | Server ➔ Client | `messageObject` | Dispatched to all room members in real-time |
| `typing` | Client ➔ Server | `{ roomId }` | Emitted when user starts typing |
| `stop_typing` | Client ➔ Server | `{ roomId }` | Emitted when user stops typing |
| `user_typing` | Server ➔ Client | `{ roomId, userId, username, displayName }` | Broadcast to others in the room |
| `user_stop_typing` | Server ➔ Client | `{ roomId, userId }` | Broadcast to clear typing indicator |
| `user_presence_change` | Server ➔ Client | `{ userId, isOnline }` | Broadcasts global user online/offline status |
| `room_activity` | Server ➔ Client | `{ roomId, lastMessage }` | Updates sidebar previews in real-time |

---

## 🔌 REST API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and receive JWT token
- `GET /api/auth/me` - Retrieve current user profile (JWT required)
- `POST /api/auth/logout` - Set user offline and invalidate session

### Rooms & Chats (`/api/rooms`)
- `GET /api/rooms` - Get all rooms current user is a member of (with last message & recipient info)
- `POST /api/rooms/direct` - Find or create a direct 1-on-1 chat with `{ recipientId }`
- `POST /api/rooms/group` - Create a new group chat with `{ name, memberIds }`
- `GET /api/rooms/:roomId` - Get room details and full member list with roles

### Messages (`/api/messages`)
- `GET /api/messages/:roomId?limit=50&before=timestamp` - Retrieve message history
- `POST /api/messages/:roomId` - REST endpoint fallback to post a message

### Users (`/api/users`)
- `GET /api/users?search=query` - Search registered users for direct chats or group invitations
- `GET /api/users/:id` - Fetch user profile

---

## 📂 Project Structure

```
real-time-chat-app/
├── package.json              # Orchestrates server & client scripts
├── .env.example              # Environment variables template
├── .gitignore
├── README.md                 # Complete documentation
├── server/
│   ├── package.json          # Express, Socket.IO, pg, bcryptjs, jsonwebtoken
│   ├── .env.example
│   └── src/
│       ├── config/
│       │   └── db.js         # PostgreSQL pool with auto SSL for cloud & local
│       ├── database/
│       │   ├── schema.sql    # Pure PostgreSQL DDL schema & indexes
│       │   ├── initDb.js     # Automatic database table creation
│       │   └── seed.js       # Demo users & sample conversations seeder
│       ├── middleware/
│       │   ├── auth.js       # JWT authorization middleware
│       │   └── error.js      # Global error handler
│       ├── routes/
│       │   ├── auth.routes.js     # Authentication routes
│       │   ├── rooms.routes.js    # Direct & Group chat routes
│       │   ├── messages.routes.js # Message history & fallback routes
│       │   └── users.routes.js    # User discovery & search
│       ├── sockets/
│       │   ├── socketAuth.js      # Socket.IO JWT handshake verification
│       │   └── chatHandler.js     # Live presence & message broadcasting
│       └── index.js          # Express app & HTTP/Socket.IO server setup
└── client/
    ├── package.json          # React, Vite, Material UI, Socket.IO client, Axios
    ├── vite.config.js        # Vite dev server with proxy to backend
    ├── index.html            # HTML shell with Google Fonts
    └── src/
        ├── theme/
        │   └── theme.js      # Custom MUI theme (Dark & Light modes)
        ├── context/
        │   ├── AuthContext.jsx    # Session & JWT lifecycle
        │   └── SocketContext.jsx  # Socket connection & presence tracking
        ├── services/
        │   ├── api.js        # Axios instance with interceptors
        │   └── chatService.js# API methods for rooms, messages, users
        ├── components/
        │   ├── auth/
        │   │   └── AuthPage.jsx   # Sign in, Sign up & quick demo accounts
        │   ├── layout/
        │   │   ├── AppHeader.jsx  # User banner, online badge & theme toggle
        │   │   └── MainLayout.jsx # Responsive 2-column & mobile drawer layout
        │   ├── chat/
        │   │   ├── ChatSidebar.jsx# Search, tabs (All/Direct/Groups), room list
        │   │   ├── RoomListItem.jsx# Avatar, online badge, last message preview
        │   │   ├── ChatArea.jsx   # Message thread, header & Socket events
        │   │   ├── MessageBubble.jsx# Distinct sender/recipient bubbles
        │   │   ├── MessageInput.jsx # Multi-line input, emoji popover & typing
        │   │   ├── TypingIndicator.jsx # Live typing animation
        │   │   └── EmptyChatView.jsx  # Clean empty state placeholder
        │   └── modals/
        │       ├── NewChatModal.jsx   # Start direct chat or create group
        │       └── RoomInfoModal.jsx  # Member list, admin badge & presence
        ├── App.jsx           # Theme & provider wrapper
        ├── index.css         # Modern scrollbars & keyframes
        └── main.jsx          # React DOM entrypoint
```

---

## 🛡️ License

This project is licensed under the MIT License.
