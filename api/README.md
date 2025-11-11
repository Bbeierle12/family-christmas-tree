# Gift Map API

Enterprise-grade REST API for collaborative gift planning with real-time updates.

## Features

- 🔐 **Authentication**: JWT-based auth with access + refresh tokens
- 👥 **Multi-tenant**: Workspace-based organization with RBAC
- 🎁 **Gift Planning**: People, gift ideas, and collaborative planning
- ⚡ **Real-time**: WebSocket support for live collaboration
- 🔒 **Security**: Rate limiting, password hashing, input validation
- 📊 **Database**: PostgreSQL with Prisma ORM
- 💾 **Caching**: Redis for performance
- 📝 **Logging**: Winston for structured logs
- 🧪 **Testing**: Vitest for unit and integration tests

## Tech Stack

- **Runtime**: Node.js 20+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL 15+
- **ORM**: Prisma
- **Cache**: Redis 7+
- **Validation**: Zod
- **Authentication**: JWT (jsonwebtoken)
- **Real-time**: Socket.IO

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose (recommended)
- OR: PostgreSQL 15+ and Redis 7+ (manual setup)

### Option 1: Docker Compose (Recommended)

```bash
# From project root
docker-compose up
```

The API will be available at `http://localhost:3000`

### Option 2: Manual Setup

1. **Install dependencies**

```bash
cd api
npm install
```

2. **Set up environment**

```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Start PostgreSQL and Redis**

```bash
# Using Docker
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
docker run -d -p 6379:6379 redis:7
```

4. **Run database migrations**

```bash
npm run db:push
# Or for production
npm run db:migrate
```

5. **Start development server**

```bash
npm run dev
```

## Environment Variables

See `.env.example` for all available options. Key variables:

```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://giftmap:password@localhost:5432/gift_map_dev

# Redis
REDIS_URL=redis://localhost:6379

# JWT (CHANGE THESE IN PRODUCTION!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# CORS
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
```

## API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Health Check

```http
GET /health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-11T20:00:00.000Z",
  "uptime": 123.45,
  "version": "1.0.0"
}
```

### Authentication

#### Register

```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "displayName": "John Doe"
}
```

Response:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "displayName": "John Doe",
      "createdAt": "2025-11-11T20:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

#### Get Current User

```http
GET /api/v1/auth/me
Authorization: Bearer <access_token>
```

#### Refresh Token

```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout

```http
POST /api/v1/auth/logout
Authorization: Bearer <access_token>
```

#### Change Password

```http
POST /api/v1/auth/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

### Password Requirements

- Minimum 8 characters
- Maximum 128 characters
- At least one lowercase letter
- At least one uppercase letter
- At least one number
- At least one special character

### Rate Limiting

- **General API**: 100 requests per 15 minutes per IP
- **Auth endpoints**: 5 requests per 15 minutes per IP

### Error Responses

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message"
}
```

Validation errors include details:

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

Common status codes:
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (e.g., email already exists)
- `422` - Validation Error
- `429` - Too Many Requests
- `500` - Internal Server Error

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start with hot reload
npm run build            # Build TypeScript
npm run start            # Start production server

# Database
npm run db:push          # Push schema changes (dev)
npm run db:migrate       # Run migrations (prod)
npm run db:migrate:dev   # Create new migration
npm run db:studio        # Open Prisma Studio
npm run db:seed          # Seed database

# Testing
npm test                 # Run tests in watch mode
npm run test:unit        # Run unit tests with coverage
npm run test:integration # Run integration tests

# Code Quality
npm run lint             # Lint code
npm run lint:fix         # Fix linting issues
npm run format           # Format code
npm run format:check     # Check formatting
npm run type-check       # TypeScript type checking
```

### Project Structure

```
api/
├── src/
│   ├── config/           # Configuration (DB, Redis, Logger)
│   ├── middleware/       # Express middleware
│   ├── modules/          # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── workspaces/   # Workspace management
│   │   ├── gift-maps/    # Gift maps
│   │   ├── people/       # People management
│   │   └── gift-ideas/   # Gift ideas
│   ├── shared/           # Shared utilities
│   │   ├── errors/       # Custom error classes
│   │   ├── types/        # TypeScript types
│   │   └── utils/        # Utility functions
│   ├── websocket/        # WebSocket handlers
│   └── app.ts            # Main Express app
├── prisma/
│   └── schema.prisma     # Database schema
├── tests/                # Tests
├── Dockerfile            # Production Docker image
├── Dockerfile.dev        # Development Docker image
└── package.json
```

### Module Structure

Each feature module follows this structure:

```
modules/auth/
├── auth.schema.ts        # Zod validation schemas
├── auth.service.ts       # Business logic
├── auth.controller.ts    # HTTP request handlers
└── auth.routes.ts        # Route definitions
```

## Testing

### Unit Tests

```bash
npm run test:unit
```

### Integration Tests

```bash
npm run test:integration
```

### E2E Tests

```bash
npm run test:e2e
```

## Deployment

### Docker

Build and run with Docker:

```bash
# Build image
docker build -t gift-map-api .

# Run container
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  --name gift-map-api \
  gift-map-api
```

### Production Checklist

- [ ] Change `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Set `NODE_ENV=production`
- [ ] Use managed PostgreSQL (RDS, Neon, Supabase)
- [ ] Use managed Redis (ElastiCache, Upstash)
- [ ] Set up SSL/TLS
- [ ] Configure CORS for production domain
- [ ] Set up monitoring (Sentry, Datadog)
- [ ] Enable database backups
- [ ] Set up log aggregation
- [ ] Configure CDN for static assets
- [ ] Set up health check monitoring

## Contributing

1. Create a feature branch
2. Make your changes
3. Write tests
4. Ensure all tests pass
5. Submit a pull request

## License

MIT

## Support

For issues, please open a GitHub issue or contact the development team.
