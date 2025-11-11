# Enterprise Architecture Plan
## Family Gift Mind Map - Fullstack Transformation

> **Goal**: Transform the MVP into a production-grade, enterprise-ready collaborative gift planning platform

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Technology Stack](#technology-stack)
3. [Database Design](#database-design)
4. [Backend API](#backend-api)
5. [Authentication & Authorization](#authentication--authorization)
6. [Real-time Collaboration](#real-time-collaboration)
7. [Frontend Enhancements](#frontend-enhancements)
8. [Testing Strategy](#testing-strategy)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Deployment Architecture](#deployment-architecture)
11. [Monitoring & Observability](#monitoring--observability)
12. [Security Hardening](#security-hardening)
13. [Performance Optimization](#performance-optimization)
14. [Implementation Phases](#implementation-phases)

---

## System Architecture

### High-Level Architecture

```
┌─────────────────┐
│   CDN / Edge    │  (Cloudflare, CloudFront)
└────────┬────────┘
         │
┌────────▼────────────────────────────────────┐
│         Load Balancer (ALB/NGINX)          │
└────────┬────────────────────────────────────┘
         │
    ┌────┴────┐
    │         │
┌───▼──┐  ┌──▼───┐
│ Web  │  │ Web  │  React SPA (Vite build)
│ App  │  │ App  │
└───┬──┘  └──┬───┘
    │         │
    └────┬────┘
         │
┌────────▼────────────────────────────────────┐
│        API Gateway (Optional)               │
└────────┬────────────────────────────────────┘
         │
    ┌────┴────────────┐
    │                 │
┌───▼──────┐    ┌────▼─────┐
│  API     │    │ WebSocket│  Node.js/Express
│  Server  │    │ Server   │  TypeScript
└───┬──────┘    └────┬─────┘
    │                │
    └────┬───────────┘
         │
    ┌────┼──────────────┬──────────────┐
    │    │              │              │
┌───▼────▼──┐  ┌────────▼──────┐  ┌───▼──────┐
│ PostgreSQL│  │ Redis Cache   │  │  S3/R2   │
│  Primary  │  │ + Sessions    │  │  Assets  │
└───────────┘  └───────────────┘  └──────────┘
         │
    ┌────▼────┐
    │Postgres │
    │ Replica │
    └─────────┘
```

### Microservices vs Monolith

**Phase 1**: Start with a **modular monolith**
- Faster to develop and deploy
- Easier to debug and maintain
- Can split into microservices later if needed

**Phase 2+**: Consider microservices for:
- `auth-service`: Authentication & user management
- `graph-service`: Graph operations & permissions
- `realtime-service`: WebSocket connections
- `export-service`: PDF/image generation (CPU-intensive)

---

## Technology Stack

### Frontend (Enhanced)

```json
{
  "framework": "React 18 + TypeScript",
  "bundler": "Vite",
  "state": "Zustand + React Query",
  "ui": "Radix UI + Tailwind CSS",
  "graph": "React Flow",
  "realtime": "Socket.io-client",
  "forms": "React Hook Form + Zod",
  "testing": "Vitest + Testing Library + Playwright",
  "monitoring": "Sentry"
}
```

### Backend (New)

```json
{
  "runtime": "Node.js 20+ LTS",
  "framework": "Express or Fastify",
  "language": "TypeScript",
  "orm": "Prisma or Drizzle",
  "validation": "Zod",
  "auth": "Passport.js + JWT",
  "realtime": "Socket.io",
  "queue": "BullMQ + Redis",
  "caching": "Redis",
  "storage": "AWS S3 or Cloudflare R2"
}
```

### Database

```json
{
  "primary": "PostgreSQL 15+",
  "cache": "Redis 7+",
  "search": "PostgreSQL Full Text Search (or Meilisearch)",
  "migrations": "Prisma Migrate"
}
```

### Infrastructure

```json
{
  "hosting": "AWS / Vercel / Railway / Fly.io",
  "cdn": "Cloudflare",
  "ci_cd": "GitHub Actions",
  "containers": "Docker + Docker Compose",
  "orchestration": "Kubernetes (optional, later)",
  "monitoring": "Datadog / New Relic / Grafana",
  "logging": "Winston + Loki or ELK",
  "secrets": "AWS Secrets Manager / Vault"
}
```

---

## Database Design

### Entity Relationship Diagram

```sql
-- Users & Authentication
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255), -- NULL for OAuth users
  display_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  role VARCHAR(20) DEFAULT 'user' -- user, admin
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);

-- OAuth Providers (Google, GitHub, etc.)
CREATE TABLE oauth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- google, github, apple
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, provider_user_id)
);

-- Session Management
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);

-- Workspaces (formerly "profiles")
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE CASCADE,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_workspaces_owner_id ON workspaces(owner_id);
CREATE INDEX idx_workspaces_slug ON workspaces(slug);

-- Workspace Members & Permissions
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL DEFAULT 'viewer', -- owner, editor, viewer
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'pending', -- pending, active, declined
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);

-- Gift Maps (formerly root nodes)
CREATE TABLE gift_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  year INTEGER,
  occasion VARCHAR(50), -- christmas, birthday, anniversary
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  is_archived BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_gift_maps_workspace ON gift_maps(workspace_id);
CREATE INDEX idx_gift_maps_year ON gift_maps(year);

-- People (recipients)
CREATE TABLE people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_map_id UUID REFERENCES gift_maps(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  interests TEXT,
  age_group VARCHAR(20), -- child, teen, adult, senior
  relationship VARCHAR(50), -- parent, sibling, friend, etc.
  budget_min DECIMAL(10,2),
  budget_max DECIMAL(10,2),
  notes TEXT,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  color VARCHAR(7), -- hex color
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_people_gift_map ON people(gift_map_id);

-- Gift Ideas
CREATE TABLE gift_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id UUID REFERENCES people(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  notes TEXT,
  url TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'idea', -- idea, considering, decided, purchased, wrapped, given
  priority INTEGER DEFAULT 0, -- 0=normal, 1=high, -1=low
  image_url TEXT,
  purchased_at TIMESTAMPTZ,
  purchased_by UUID REFERENCES users(id),
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

CREATE INDEX idx_gift_ideas_person ON gift_ideas(person_id);
CREATE INDEX idx_gift_ideas_status ON gift_ideas(status);

-- Tags for categorization
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(50) NOT NULL,
  color VARCHAR(7),
  UNIQUE(workspace_id, name)
);

-- Gift Ideas Tags (many-to-many)
CREATE TABLE gift_idea_tags (
  gift_idea_id UUID REFERENCES gift_ideas(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (gift_idea_id, tag_id)
);

-- Edges (connections between nodes)
CREATE TABLE edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_map_id UUID REFERENCES gift_maps(id) ON DELETE CASCADE,
  source_type VARCHAR(20) NOT NULL, -- root, person, idea
  source_id UUID NOT NULL,
  target_type VARCHAR(20) NOT NULL,
  target_id UUID NOT NULL,
  label TEXT,
  style JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_edges_gift_map ON edges(gift_map_id);
CREATE INDEX idx_edges_source ON edges(source_type, source_id);
CREATE INDEX idx_edges_target ON edges(target_type, target_id);

-- Activity Log (audit trail)
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  gift_map_id UUID REFERENCES gift_maps(id) ON DELETE SET NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL, -- created, updated, deleted, shared
  entity_type VARCHAR(50) NOT NULL, -- person, gift_idea, workspace
  entity_id UUID,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_workspace ON activity_log(workspace_id);
CREATE INDEX idx_activity_user ON activity_log(user_id);
CREATE INDEX idx_activity_created_at ON activity_log(created_at DESC);

-- Comments (collaboration)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_idea_id UUID REFERENCES gift_ideas(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE, -- for threaded comments
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_deleted BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_comments_gift_idea ON comments(gift_idea_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- comment, mention, share, purchase
  title VARCHAR(200) NOT NULL,
  message TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- File Uploads (images, attachments)
CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  filename VARCHAR(255) NOT NULL,
  storage_key VARCHAR(500) NOT NULL,
  mime_type VARCHAR(100),
  size_bytes BIGINT,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uploads_workspace ON uploads(workspace_id);
```

### Indexes & Performance

```sql
-- Full-text search indexes
CREATE INDEX idx_people_name_search ON people USING gin(to_tsvector('english', name));
CREATE INDEX idx_gift_ideas_title_search ON gift_ideas USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Partial indexes for active records
CREATE INDEX idx_active_workspaces ON workspaces(id) WHERE is_archived = FALSE;
CREATE INDEX idx_active_gift_maps ON gift_maps(id) WHERE is_archived = FALSE;

-- Composite indexes for common queries
CREATE INDEX idx_workspace_members_active ON workspace_members(workspace_id, user_id) WHERE status = 'active';
CREATE INDEX idx_gift_ideas_person_status ON gift_ideas(person_id, status);
```

---

## Backend API

### Tech Stack

**Framework**: Express.js (familiar) or Fastify (faster)

```bash
gift-map-api/
├── src/
│   ├── config/
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   └── env.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   ├── rateLimit.ts
│   │   ├── validation.ts
│   │   └── cors.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   └── auth.schema.ts
│   │   ├── workspaces/
│   │   │   ├── workspaces.controller.ts
│   │   │   ├── workspaces.service.ts
│   │   │   ├── workspaces.routes.ts
│   │   │   └── workspaces.schema.ts
│   │   ├── gift-maps/
│   │   ├── people/
│   │   ├── gift-ideas/
│   │   ├── comments/
│   │   └── uploads/
│   ├── shared/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── constants/
│   │   └── errors/
│   ├── database/
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   └── migrations/
│   ├── websocket/
│   │   ├── handlers/
│   │   └── events.ts
│   ├── jobs/
│   │   ├── email.job.ts
│   │   └── cleanup.job.ts
│   └── app.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── package.json
├── tsconfig.json
├── docker-compose.yml
└── Dockerfile
```

### API Endpoints

```typescript
// Auth
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
GET    /api/v1/auth/oauth/:provider
GET    /api/v1/auth/oauth/:provider/callback

// Workspaces
GET    /api/v1/workspaces
POST   /api/v1/workspaces
GET    /api/v1/workspaces/:id
PATCH  /api/v1/workspaces/:id
DELETE /api/v1/workspaces/:id

// Workspace Members
GET    /api/v1/workspaces/:id/members
POST   /api/v1/workspaces/:id/members/invite
PATCH  /api/v1/workspaces/:id/members/:userId
DELETE /api/v1/workspaces/:id/members/:userId

// Gift Maps
GET    /api/v1/workspaces/:workspaceId/gift-maps
POST   /api/v1/workspaces/:workspaceId/gift-maps
GET    /api/v1/gift-maps/:id
PATCH  /api/v1/gift-maps/:id
DELETE /api/v1/gift-maps/:id
POST   /api/v1/gift-maps/:id/duplicate

// People
GET    /api/v1/gift-maps/:mapId/people
POST   /api/v1/gift-maps/:mapId/people
GET    /api/v1/people/:id
PATCH  /api/v1/people/:id
DELETE /api/v1/people/:id

// Gift Ideas
GET    /api/v1/people/:personId/gift-ideas
POST   /api/v1/people/:personId/gift-ideas
GET    /api/v1/gift-ideas/:id
PATCH  /api/v1/gift-ideas/:id
DELETE /api/v1/gift-ideas/:id
POST   /api/v1/gift-ideas/:id/purchase
POST   /api/v1/gift-ideas/:id/unpurchase

// Edges
GET    /api/v1/gift-maps/:mapId/edges
POST   /api/v1/gift-maps/:mapId/edges
DELETE /api/v1/edges/:id

// Comments
GET    /api/v1/gift-ideas/:id/comments
POST   /api/v1/gift-ideas/:id/comments
PATCH  /api/v1/comments/:id
DELETE /api/v1/comments/:id

// Uploads
POST   /api/v1/uploads
DELETE /api/v1/uploads/:id

// Export
GET    /api/v1/gift-maps/:id/export/json
GET    /api/v1/gift-maps/:id/export/pdf
GET    /api/v1/gift-maps/:id/export/png

// Activity
GET    /api/v1/workspaces/:id/activity
GET    /api/v1/gift-maps/:id/activity

// Notifications
GET    /api/v1/notifications
PATCH  /api/v1/notifications/:id/read
PATCH  /api/v1/notifications/read-all

// Search
GET    /api/v1/workspaces/:id/search?q=...
```

### Example Controller (TypeScript)

```typescript
// src/modules/gift-ideas/gift-ideas.controller.ts
import { Request, Response, NextFunction } from 'express';
import { GiftIdeasService } from './gift-ideas.service';
import { CreateGiftIdeaSchema, UpdateGiftIdeaSchema } from './gift-ideas.schema';
import { ForbiddenError, NotFoundError } from '@/shared/errors';

export class GiftIdeasController {
  constructor(private giftIdeasService: GiftIdeasService) {}

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const { personId } = req.params;
      const userId = req.user!.id;

      // Check permissions
      const canAccess = await this.giftIdeasService.canAccessPerson(userId, personId);
      if (!canAccess) {
        throw new ForbiddenError('No access to this person');
      }

      const ideas = await this.giftIdeasService.listByPerson(personId, {
        status: req.query.status as string,
        sortBy: req.query.sortBy as string,
      });

      res.json({ data: ideas });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { personId } = req.params;
      const userId = req.user!.id;

      // Validate input
      const validated = CreateGiftIdeaSchema.parse(req.body);

      // Check permissions
      const canEdit = await this.giftIdeasService.canEditPerson(userId, personId);
      if (!canEdit) {
        throw new ForbiddenError('No edit access to this person');
      }

      const idea = await this.giftIdeasService.create(personId, userId, validated);

      // Emit WebSocket event
      req.io.to(`person:${personId}`).emit('gift-idea:created', idea);

      res.status(201).json({ data: idea });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const validated = UpdateGiftIdeaSchema.parse(req.body);

      const canEdit = await this.giftIdeasService.canEdit(userId, id);
      if (!canEdit) {
        throw new ForbiddenError('No edit access');
      }

      const idea = await this.giftIdeasService.update(id, validated);
      if (!idea) {
        throw new NotFoundError('Gift idea not found');
      }

      // Emit WebSocket event
      req.io.to(`gift-idea:${id}`).emit('gift-idea:updated', idea);

      res.json({ data: idea });
    } catch (error) {
      next(error);
    }
  }

  async purchase(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const idea = await this.giftIdeasService.markPurchased(id, userId);

      // Emit WebSocket event
      req.io.to(`gift-idea:${id}`).emit('gift-idea:purchased', idea);

      // Create notification for workspace members
      await this.giftIdeasService.notifyPurchase(idea);

      res.json({ data: idea });
    } catch (error) {
      next(error);
    }
  }
}
```

---

## Authentication & Authorization

### Authentication Strategy

**Multi-provider authentication:**

1. **Email/Password** (with bcrypt, 12+ rounds)
2. **OAuth 2.0** (Google, GitHub, Apple)
3. **Magic Links** (passwordless email)
4. **JWT** for API tokens

### Implementation

```typescript
// src/modules/auth/auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { sendEmail } from '@/shared/utils/email';

export class AuthService {
  private JWT_SECRET = process.env.JWT_SECRET!;
  private JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;

  async register(email: string, password: string, displayName: string) {
    // Check if user exists
    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.users.create({
      data: {
        email,
        password_hash: passwordHash,
        display_name: displayName,
      },
    });

    // Create default workspace
    await prisma.workspaces.create({
      data: {
        name: `${displayName}'s Workspace`,
        slug: this.generateSlug(displayName),
        owner_id: user.id,
      },
    });

    // Send verification email
    await this.sendVerificationEmail(user);

    return user;
  }

  async login(email: string, password: string) {
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user || !user.password_hash) {
      throw new Error('Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    if (!user.is_active) {
      throw new Error('Account is inactive');
    }

    // Update last login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id);
    const refreshToken = this.generateRefreshToken(user.id);

    // Store session
    await this.createSession(user.id, refreshToken);

    return { user, accessToken, refreshToken };
  }

  private generateAccessToken(userId: string) {
    return jwt.sign({ userId, type: 'access' }, this.JWT_SECRET, {
      expiresIn: '15m',
    });
  }

  private generateRefreshToken(userId: string) {
    return jwt.sign({ userId, type: 'refresh' }, this.JWT_REFRESH_SECRET, {
      expiresIn: '7d',
    });
  }

  async verifyAccessToken(token: string) {
    try {
      const payload = jwt.verify(token, this.JWT_SECRET) as { userId: string };
      return payload.userId;
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // ... more methods
}
```

### Authorization (RBAC)

**Workspace Roles:**
- `owner`: Full control, can delete workspace
- `editor`: Can create/edit/delete content
- `viewer`: Read-only access

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '@/modules/auth/auth.service';

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7);
    const authService = new AuthService();
    const userId = await authService.verifyAccessToken(token);

    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid user' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export async function requireWorkspaceRole(role: 'owner' | 'editor' | 'viewer') {
  return async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.params.workspaceId || req.params.id;
    const userId = req.user!.id;

    const member = await prisma.workspace_members.findFirst({
      where: {
        workspace_id: workspaceId,
        user_id: userId,
        status: 'active',
      },
    });

    if (!member) {
      return res.status(403).json({ error: 'Not a member of this workspace' });
    }

    const roles = { owner: 3, editor: 2, viewer: 1 };
    if (roles[member.role as keyof typeof roles] < roles[role]) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    req.workspaceMember = member;
    next();
  };
}
```

---

## Real-time Collaboration

### WebSocket Events

```typescript
// src/websocket/events.ts
export const EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  JOIN_WORKSPACE: 'join:workspace',
  LEAVE_WORKSPACE: 'leave:workspace',
  JOIN_GIFT_MAP: 'join:gift-map',

  // Gift Ideas
  GIFT_IDEA_CREATED: 'gift-idea:created',
  GIFT_IDEA_UPDATED: 'gift-idea:updated',
  GIFT_IDEA_DELETED: 'gift-idea:deleted',
  GIFT_IDEA_PURCHASED: 'gift-idea:purchased',

  // People
  PERSON_CREATED: 'person:created',
  PERSON_UPDATED: 'person:updated',
  PERSON_DELETED: 'person:deleted',

  // Edges
  EDGE_CREATED: 'edge:created',
  EDGE_DELETED: 'edge:deleted',

  // Comments
  COMMENT_CREATED: 'comment:created',
  COMMENT_UPDATED: 'comment:updated',
  COMMENT_DELETED: 'comment:deleted',

  // Presence
  USER_JOINED: 'user:joined',
  USER_LEFT: 'user:left',
  CURSOR_MOVE: 'cursor:move',
  USER_TYPING: 'user:typing',

  // Notifications
  NOTIFICATION: 'notification',
} as const;
```

### WebSocket Server

```typescript
// src/websocket/server.ts
import { Server } from 'socket.io';
import { verifyJWT } from '@/shared/utils/jwt';
import { prisma } from '@/config/database';

export function setupWebSocket(io: Server) {
  // Middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const userId = await verifyJWT(token);

      const user = await prisma.users.findUnique({ where: { id: userId } });
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.data.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.user.email}`);

    // Join workspace room
    socket.on(EVENTS.JOIN_WORKSPACE, async (workspaceId: string) => {
      // Verify membership
      const member = await prisma.workspace_members.findFirst({
        where: {
          workspace_id: workspaceId,
          user_id: socket.data.user.id,
          status: 'active',
        },
      });

      if (!member) {
        socket.emit('error', { message: 'Not a member of this workspace' });
        return;
      }

      socket.join(`workspace:${workspaceId}`);

      // Notify others
      socket.to(`workspace:${workspaceId}`).emit(EVENTS.USER_JOINED, {
        userId: socket.data.user.id,
        displayName: socket.data.user.display_name,
      });
    });

    // Join gift map room
    socket.on(EVENTS.JOIN_GIFT_MAP, async (giftMapId: string) => {
      socket.join(`gift-map:${giftMapId}`);
    });

    // Cursor tracking
    socket.on(EVENTS.CURSOR_MOVE, (data: { x: number; y: number; giftMapId: string }) => {
      socket.to(`gift-map:${data.giftMapId}`).emit(EVENTS.CURSOR_MOVE, {
        userId: socket.data.user.id,
        displayName: socket.data.user.display_name,
        x: data.x,
        y: data.y,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user.email}`);
    });
  });
}
```

### Frontend Integration

```typescript
// src/hooks/useRealtimeSync.ts
import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGiftStore } from '@/store/giftStore';

let socket: Socket | null = null;

export function useRealtimeSync(giftMapId: string) {
  const store = useGiftStore();

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    socket = io(process.env.VITE_WS_URL!, {
      auth: { token },
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket');
      socket!.emit('join:gift-map', giftMapId);
    });

    // Listen for updates
    socket.on('gift-idea:created', (idea) => {
      store.addIdeaFromWS(idea);
    });

    socket.on('gift-idea:updated', (idea) => {
      store.updateIdeaFromWS(idea);
    });

    socket.on('gift-idea:deleted', ({ id }) => {
      store.deleteIdeaFromWS(id);
    });

    socket.on('person:created', (person) => {
      store.addPersonFromWS(person);
    });

    // Presence
    socket.on('user:joined', (user) => {
      store.addOnlineUser(user);
    });

    socket.on('cursor:move', (data) => {
      store.updateCursor(data);
    });

    return () => {
      socket?.disconnect();
    };
  }, [giftMapId]);

  return socket;
}
```

---

## Frontend Enhancements

### State Management Upgrade

**React Query** for server state + **Zustand** for client state

```typescript
// src/api/queries/giftIdeas.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';

export function useGiftIdeas(personId: string) {
  return useQuery({
    queryKey: ['gift-ideas', personId],
    queryFn: () => api.get(`/people/${personId}/gift-ideas`),
  });
}

export function useCreateGiftIdea(personId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateGiftIdeaInput) =>
      api.post(`/people/${personId}/gift-ideas`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gift-ideas', personId] });
    },
  });
}

export function useUpdateGiftIdea() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGiftIdeaInput }) =>
      api.patch(`/gift-ideas/${id}`, data),
    onMutate: async ({ id, data }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['gift-idea', id] });

      const previous = queryClient.getQueryData(['gift-idea', id]);

      queryClient.setQueryData(['gift-idea', id], (old: any) => ({
        ...old,
        ...data,
      }));

      return { previous };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      queryClient.setQueryData(['gift-idea', variables.id], context?.previous);
    },
  });
}
```

### Error Boundaries

```typescript
// src/components/ErrorBoundary.tsx
import React from 'react';
import * as Sentry from '@sentry/react';

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md p-8 bg-white rounded-lg shadow">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Oops! Something went wrong</h1>
            <p className="text-gray-600 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### Toast Notifications

Replace `alert()` with proper notifications:

```typescript
// src/components/ui/toaster.tsx
import { Toaster } from 'sonner';

export function ToastProvider() {
  return <Toaster position="top-right" richColors />;
}

// Usage:
import { toast } from 'sonner';

toast.success('Gift idea created!');
toast.error('Failed to delete person');
toast.loading('Saving...');
```

---

## Testing Strategy

### Test Pyramid

```
        /\
       /E2E\         <- 10% (Playwright)
      /------\
     /  API   \      <- 30% (Supertest + Vitest)
    /----------\
   / Unit Tests \    <- 60% (Vitest + Testing Library)
  /--------------\
```

### Unit Tests (Backend)

```typescript
// tests/unit/auth.service.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '@/modules/auth/auth.service';
import { prisma } from '@/config/database';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create a new user', async () => {
      const user = await authService.register(
        'test@example.com',
        'password123',
        'Test User'
      );

      expect(user.email).toBe('test@example.com');
      expect(user.display_name).toBe('Test User');
      expect(user.password_hash).toBeTruthy();
    });

    it('should throw error if user exists', async () => {
      await authService.register('test@example.com', 'password123', 'Test User');

      await expect(
        authService.register('test@example.com', 'password123', 'Test User')
      ).rejects.toThrow('User already exists');
    });

    it('should hash password with bcrypt', async () => {
      const user = await authService.register(
        'test@example.com',
        'password123',
        'Test User'
      );

      expect(user.password_hash).not.toBe('password123');
      expect(user.password_hash?.startsWith('$2b$')).toBe(true);
    });
  });
});
```

### Integration Tests (API)

```typescript
// tests/integration/gift-ideas.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '@/app';
import { createTestUser, createTestWorkspace } from '../helpers';

describe('Gift Ideas API', () => {
  let token: string;
  let workspaceId: string;
  let giftMapId: string;
  let personId: string;

  beforeEach(async () => {
    const user = await createTestUser();
    token = user.token;
    workspaceId = user.workspaceId;

    // Create gift map and person
    const map = await request(app)
      .post(`/api/v1/workspaces/${workspaceId}/gift-maps`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Christmas 2025' });

    giftMapId = map.body.data.id;

    const person = await request(app)
      .post(`/api/v1/gift-maps/${giftMapId}/people`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'John Doe' });

    personId = person.body.data.id;
  });

  describe('POST /api/v1/people/:personId/gift-ideas', () => {
    it('should create a gift idea', async () => {
      const response = await request(app)
        .post(`/api/v1/people/${personId}/gift-ideas`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Cozy Socks',
          description: 'Warm wool socks',
          price: 15.99,
        });

      expect(response.status).toBe(201);
      expect(response.body.data.title).toBe('Cozy Socks');
      expect(response.body.data.price).toBe(15.99);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post(`/api/v1/people/${personId}/gift-ideas`)
        .send({ title: 'Test' });

      expect(response.status).toBe(401);
    });

    it('should validate input', async () => {
      const response = await request(app)
        .post(`/api/v1/people/${personId}/gift-ideas`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title: '' }); // Invalid: empty title

      expect(response.status).toBe(400);
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// tests/e2e/gift-planning.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Gift Planning Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Login
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'password123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/workspaces');
  });

  test('should create a gift idea for a person', async ({ page }) => {
    // Navigate to gift map
    await page.click('text=Christmas 2025');

    // Click on a person node
    await page.click('[data-node-id^="person"]').first();

    // Add gift idea
    await page.click('text=Add Idea');
    await page.fill('[placeholder="Idea title"]', 'Wool Sweater');
    await page.fill('[placeholder="Notes"]', 'Size L, blue color');
    await page.click('button:has-text("Add Idea")');

    // Verify idea appears on canvas
    await expect(page.locator('text=Wool Sweater')).toBeVisible();
  });

  test('should mark gift as purchased', async ({ page }) => {
    await page.click('text=Christmas 2025');
    await page.click('[data-node-id^="idea"]').first();
    await page.click('button:has-text("Mark purchased")');

    // Verify purchase badge
    await expect(page.locator('[data-status="purchased"]')).toBeVisible();
  });

  test('should support real-time collaboration', async ({ browser }) => {
    // Open two browser contexts (two users)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();

    const context2 = await browser.newContext();
    const page2 = await context2.newPage();

    // User 1 creates idea
    await page1.goto('http://localhost:5173/gift-maps/123');
    await page1.click('[data-node-id="person-1"]');
    await page1.fill('[placeholder="Idea title"]', 'Gift from User 1');
    await page1.click('button:has-text("Add Idea")');

    // User 2 should see it instantly
    await page2.goto('http://localhost:5173/gift-maps/123');
    await expect(page2.locator('text=Gift from User 1')).toBeVisible({ timeout: 3000 });
  });
});
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user flows

```json
// package.json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  NODE_VERSION: '20'
  POSTGRES_VERSION: '15'

jobs:
  lint:
    name: Lint & Format
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Check formatting
        run: npm run format:check

      - name: TypeScript check
        run: npm run type-check

  test-backend:
    name: Backend Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: gift_map_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run migrations
        run: npm run db:migrate
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/gift_map_test

      - name: Run unit tests
        run: npm run test:unit
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/gift_map_test
          REDIS_URL: redis://localhost:6379

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/gift_map_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./coverage/backend/lcov.info

  test-frontend:
    name: Frontend Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci
        working-directory: ./gift-mindmap

      - name: Run unit tests
        run: npm run test:run
        working-directory: ./gift-mindmap

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./gift-mindmap/coverage/lcov.info

  test-e2e:
    name: E2E Tests
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: gift_map_test
        ports:
          - 5432:5432

      redis:
        image: redis:7
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Build frontend
        run: npm run build
        working-directory: ./gift-mindmap

      - name: Start backend
        run: |
          npm run db:migrate
          npm run start:test &
          npx wait-on http://localhost:3000/health
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/gift_map_test
          REDIS_URL: redis://localhost:6379

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  build:
    name: Build & Push Images
    runs-on: ubuntu-latest
    needs: [lint, test-backend, test-frontend, test-e2e]
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Login to DockerHub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend
        uses: docker/build-push-action@v5
        with:
          context: ./api
          push: true
          tags: |
            yourusername/gift-map-api:latest
            yourusername/gift-map-api:${{ github.sha }}
          cache-from: type=registry,ref=yourusername/gift-map-api:buildcache
          cache-to: type=registry,ref=yourusername/gift-map-api:buildcache,mode=max

      - name: Build and push frontend
        uses: docker/build-push-action@v5
        with:
          context: ./gift-mindmap
          push: true
          tags: |
            yourusername/gift-map-web:latest
            yourusername/gift-map-web:${{ github.sha }}

  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [build]
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
      - name: Deploy to Railway/Fly.io/AWS
        run: |
          # Example: Railway deployment
          curl -X POST ${{ secrets.RAILWAY_WEBHOOK_URL }}
```

### Pre-commit Hooks

```yaml
# .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npm run lint-staged
npm run type-check
```

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
```

---

## Deployment Architecture

### Option 1: Serverless (Vercel + Railway)

**Frontend**: Vercel
**Backend**: Railway
**Database**: Railway Postgres or Supabase
**Cache**: Upstash Redis

**Pros**: Easy to set up, auto-scaling, low maintenance
**Cons**: Vendor lock-in, costs can grow

### Option 2: Containerized (AWS/GCP)

**Frontend**: CloudFront + S3
**Backend**: ECS Fargate or EKS
**Database**: RDS Postgres
**Cache**: ElastiCache Redis
**Load Balancer**: ALB

**Pros**: Full control, better pricing at scale
**Cons**: More complex, requires DevOps expertise

### Option 3: Hybrid (Recommended)

**Frontend**: Vercel or Cloudflare Pages
**Backend**: Fly.io or Railway
**Database**: Neon or Supabase (serverless Postgres)
**Cache**: Upstash Redis
**Storage**: Cloudflare R2

**Pros**: Best of both worlds, good DX, reasonable cost
**Cons**: Multiple vendors

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.9'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: giftmap
      POSTGRES_PASSWORD: password
      POSTGRES_DB: gift_map_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  api:
    build:
      context: ./api
      dockerfile: Dockerfile.dev
    ports:
      - '3000:3000'
    environment:
      DATABASE_URL: postgresql://giftmap:password@postgres:5432/gift_map_dev
      REDIS_URL: redis://redis:6379
      JWT_SECRET: dev-secret-change-in-prod
    volumes:
      - ./api:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    command: npm run dev

  web:
    build:
      context: ./gift-mindmap
      dockerfile: Dockerfile.dev
    ports:
      - '5173:5173'
    environment:
      VITE_API_URL: http://localhost:3000/api/v1
      VITE_WS_URL: http://localhost:3000
    volumes:
      - ./gift-mindmap:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
  redis_data:
```

### Kubernetes (Production)

```yaml
# k8s/deployment.yml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gift-map-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: gift-map-api
  template:
    metadata:
      labels:
        app: gift-map-api
    spec:
      containers:
      - name: api
        image: yourusername/gift-map-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: gift-map-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: gift-map-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: gift-map-api
spec:
  selector:
    app: gift-map-api
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

---

## Monitoring & Observability

### Application Performance Monitoring (APM)

**Options**: Datadog, New Relic, Sentry, or Grafana Cloud

```typescript
// src/config/monitoring.ts
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

export function setupMonitoring(app: Express) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ app }),
      new ProfilingIntegration(),
    ],
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    profilesSampleRate: 0.1,
  });

  // Request handler must be first
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());

  // ... your routes ...

  // Error handler must be last
  app.use(Sentry.Handlers.errorHandler());
}
```

### Logging

```typescript
// src/config/logger.ts
import winston from 'winston';
import 'winston-daily-rotate-file';

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'gift-map-api' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '14d',
    }),
    new winston.transports.DailyRotateFile({
      filename: 'logs/combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});
```

### Metrics

```typescript
// src/middleware/metrics.ts
import promClient from 'prom-client';

const register = new promClient.Registry();

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics({ register });

// Custom metrics
export const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const giftIdeasCreated = new promClient.Counter({
  name: 'gift_ideas_created_total',
  help: 'Total number of gift ideas created',
  labelNames: ['workspace_id'],
  registers: [register],
});

// Middleware
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, String(res.statusCode))
      .observe(duration);
  });

  next();
}

// Endpoint to expose metrics
export function metricsEndpoint(req: Request, res: Response) {
  res.set('Content-Type', register.contentType);
  res.end(register.metrics());
}
```

### Health Checks

```typescript
// src/routes/health.ts
import { Router } from 'express';
import { prisma } from '@/config/database';
import { redis } from '@/config/redis';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis
    await redis.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.APP_VERSION,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
    });
  }
});

router.get('/ready', async (req, res) => {
  // More comprehensive readiness check
  const checks = {
    database: false,
    redis: false,
    migrations: false,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;

    await redis.ping();
    checks.redis = true;

    // Check if all migrations are applied
    // ... migration check logic ...
    checks.migrations = true;

    const allReady = Object.values(checks).every(Boolean);

    res.status(allReady ? 200 : 503).json({
      ready: allReady,
      checks,
    });
  } catch (error) {
    res.status(503).json({ ready: false, checks, error: error.message });
  }
});

export default router;
```

---

## Security Hardening

### Best Practices Checklist

- [ ] **HTTPS only** (enforce with HSTS)
- [ ] **CORS** properly configured
- [ ] **Rate limiting** (per IP, per user)
- [ ] **Input validation** (Zod on all endpoints)
- [ ] **SQL injection prevention** (Prisma parameterized queries)
- [ ] **XSS prevention** (CSP headers, DOMPurify)
- [ ] **CSRF tokens** for state-changing operations
- [ ] **Password policies** (min 12 chars, complexity)
- [ ] **2FA support** (TOTP)
- [ ] **Session management** (secure cookies, rotation)
- [ ] **Secrets rotation** (JWT keys, API keys)
- [ ] **Dependency scanning** (npm audit, Snyk)
- [ ] **Security headers** (Helmet.js)
- [ ] **Data encryption at rest** (database encryption)
- [ ] **Audit logging** (all sensitive operations)

### Implementation

```typescript
// src/middleware/security.ts
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

export function setupSecurity(app: Express) {
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
  });
  app.use('/api/', limiter);

  // Slow down brute force attempts
  const authLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 5,
    delayMs: 500,
  });
  app.use('/api/v1/auth/', authLimiter);

  // CORS
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    maxAge: 86400,
  }));
}
```

---

## Performance Optimization

### Backend Optimizations

1. **Database query optimization**
   - Use `SELECT` specific fields, not `*`
   - Add indexes for common queries
   - Use connection pooling
   - Implement query result caching

2. **Redis caching strategy**
   ```typescript
   // Cache frequently accessed data
   async function getWorkspace(id: string) {
     const cacheKey = `workspace:${id}`;

     // Try cache first
     const cached = await redis.get(cacheKey);
     if (cached) return JSON.parse(cached);

     // Fetch from DB
     const workspace = await prisma.workspaces.findUnique({ where: { id } });

     // Cache for 5 minutes
     await redis.setex(cacheKey, 300, JSON.stringify(workspace));

     return workspace;
   }
   ```

3. **Background jobs** for heavy operations
   ```typescript
   // Use BullMQ for async tasks
   import { Queue } from 'bullmq';

   const exportQueue = new Queue('exports', {
     connection: { host: 'localhost', port: 6379 },
   });

   // Enqueue PDF export
   await exportQueue.add('generate-pdf', { giftMapId: '123' });
   ```

4. **Compression**
   ```typescript
   import compression from 'compression';
   app.use(compression());
   ```

### Frontend Optimizations

1. **Code splitting**
   ```typescript
   // Lazy load routes
   const GiftMapEditor = lazy(() => import('@/pages/GiftMapEditor'));
   const Settings = lazy(() => import('@/pages/Settings'));
   ```

2. **Image optimization**
   - Use WebP format
   - Lazy load images
   - Responsive images with `srcset`

3. **Bundle analysis**
   ```bash
   npm run build -- --analyze
   ```

4. **Virtual scrolling** for large lists
   ```typescript
   import { useVirtualizer } from '@tanstack/react-virtual';
   ```

5. **Memoization**
   ```typescript
   const visibleNodes = useMemo(() => {
     return nodes.filter(n => allowedProfileIds.has(n.data?.owner));
   }, [nodes, allowedProfileIds]);
   ```

---

## Implementation Phases

### Phase 1: Foundation (4-6 weeks)

**Week 1-2: Backend Setup**
- [ ] Initialize Node.js/Express project
- [ ] Set up PostgreSQL + Prisma
- [ ] Implement database schema + migrations
- [ ] Create authentication system (email/password)
- [ ] Set up JWT authentication

**Week 3-4: Core API**
- [ ] Workspaces CRUD
- [ ] Gift Maps CRUD
- [ ] People CRUD
- [ ] Gift Ideas CRUD
- [ ] Permissions system

**Week 5-6: Frontend Integration**
- [ ] Replace localStorage with API calls
- [ ] Add React Query for server state
- [ ] Implement authentication UI
- [ ] Connect existing components to API
- [ ] Error handling & loading states

**Deliverables:**
- Working authentication
- Multi-workspace support
- Data persisted in PostgreSQL
- Basic API test coverage (60%+)

---

### Phase 2: Collaboration (3-4 weeks)

**Week 7-8: WebSocket**
- [ ] Set up Socket.io
- [ ] Implement real-time sync
- [ ] Presence indicators
- [ ] Cursor tracking

**Week 9-10: Social Features**
- [ ] Workspace invitations
- [ ] Role-based permissions
- [ ] Comments on gift ideas
- [ ] Activity feed
- [ ] Notifications

**Deliverables:**
- Real-time collaboration
- Multi-user support with permissions
- Activity logging

---

### Phase 3: Polish & Deploy (3-4 weeks)

**Week 11-12: Testing & CI/CD**
- [ ] Increase test coverage to 80%+
- [ ] Set up GitHub Actions
- [ ] E2E tests with Playwright
- [ ] Performance testing

**Week 13-14: Production**
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] Deploy to production (Railway/Fly.io)
- [ ] Configure CDN
- [ ] SSL certificates
- [ ] Database backups

**Deliverables:**
- Production deployment
- Monitoring & alerting
- Documentation

---

### Phase 4: Advanced Features (Ongoing)

- [ ] OAuth providers (Google, GitHub)
- [ ] File uploads (images for gifts)
- [ ] PDF/PNG export
- [ ] Budget tracking
- [ ] Email notifications
- [ ] Mobile app (React Native)
- [ ] AI gift suggestions
- [ ] Price tracking integration

---

## Next Steps

To begin implementation, we should:

1. **Create backend repository structure**
2. **Set up local development environment** (Docker Compose)
3. **Implement database schema** (Prisma)
4. **Build authentication system** first
5. **Create API endpoints** one module at a time
6. **Migrate frontend** to use API
7. **Add WebSocket** for real-time features
8. **Deploy** to staging environment

---

## Questions to Answer

Before starting, let's decide:

1. **Deployment platform**: Railway, Fly.io, AWS, or other?
2. **Database**: Managed (Supabase, Neon) or self-hosted?
3. **Authentication**: OAuth only, email/password, or both?
4. **Monorepo**: Keep frontend/backend together or separate repos?
5. **Domain**: Do you have a domain name?

---

**Ready to build enterprise-grade fullstack glory?** 🚀

Let me know which phase you want to start with, and I'll begin implementation!
