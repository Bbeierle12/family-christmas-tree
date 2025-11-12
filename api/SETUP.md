# Gift Map API - Setup Guide

Complete guide to setting up and running the backend API locally.

## 📋 Prerequisites

- **Node.js** 20+ (with npm)
- **Docker** and **Docker Compose**
- **Git**

## 🚀 Quick Start

### 1. Environment Setup

Copy the example environment file:

```bash
cd api
cp .env.example .env
```

Update `.env` with your configuration (default values work for local development).

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Database Services

Start PostgreSQL and Redis using Docker Compose:

```bash
# From project root
docker compose up -d postgres redis
```

Verify services are running:

```bash
docker compose ps
```

You should see:
- `postgres` - Running on port 5432
- `redis` - Running on port 6379

### 4. Initialize Database

Generate Prisma client:

```bash
npm run db:generate
```

Push schema to database:

```bash
npm run db:push
```

Seed database with test data:

```bash
npm run db:seed
```

### 5. Start Development Server

```bash
npm run dev
```

The API will start on http://localhost:3000

## 🧪 Test Accounts

After seeding, you can log in with these accounts (password: `Demo1234!`):

| Email | Role | Access |
|-------|------|--------|
| alice@example.com | Owner | Full workspace access |
| bob@example.com | Editor | Can edit gift maps |
| carol@example.com | Viewer | Read-only access |

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api/v1
```

### Health Check

```bash
curl http://localhost:3000/health
```

### Authentication

Register a new user:

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test1234!",
    "displayName": "Test User"
  }'
```

Login:

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "Demo1234!"
  }'
```

Save the `accessToken` from the response for authenticated requests.

### Using the Access Token

Include the token in the Authorization header:

```bash
curl http://localhost:3000/api/v1/workspaces \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 🗂️ Database Management

### View Data

Open Prisma Studio to browse database:

```bash
npm run db:studio
```

This opens a web interface at http://localhost:5555

### Reset Database

To completely reset and reseed:

```bash
npm run db:push -- --force-reset
npm run db:seed
```

### Migrations (Production)

For production deployments:

```bash
npm run db:migrate:dev  # Create migration
npm run db:migrate      # Apply migration
```

## 🧩 Available Modules

The API includes 6 complete modules:

1. **Authentication** (`/api/v1/auth`)
   - Register, login, refresh tokens
   - Password management
   - Session handling

2. **Workspaces** (`/api/v1/workspaces`)
   - Multi-tenant workspace management
   - Member invitations
   - Role-based access (owner/editor/viewer)

3. **Gift Maps** (`/api/v1/gift-maps`)
   - Gift planning seasons
   - Duplication feature
   - Activity logs

4. **People** (`/api/v1/people`)
   - Gift recipients
   - Budget tracking
   - Interest categorization

5. **Gift Ideas** (`/api/v1/gift-ideas`)
   - Status workflow (idea → purchased → wrapped → given)
   - Purchase tracking
   - Priority levels

6. **Edges** (`/api/v1/edges`)
   - Graph connections
   - Visual styling
   - Node relationships

## 📊 Testing

### Run All Tests

```bash
npm test
```

### Run Unit Tests with Coverage

```bash
npm run test:unit
```

### Run Integration Tests

```bash
npm run test:integration
```

### Watch Mode

```bash
npm run test:watch
```

## 🔍 Code Quality

### Linting

```bash
npm run lint
npm run lint:fix  # Auto-fix issues
```

### Formatting

```bash
npm run format:check
npm run format      # Auto-format
```

### Type Checking

```bash
npm run type-check
```

## 🐳 Docker Commands

### Start all services (including API)

```bash
docker compose up -d
```

### View logs

```bash
docker compose logs -f api
docker compose logs -f postgres
docker compose logs -f redis
```

### Stop services

```bash
docker compose down
```

### Remove volumes (complete reset)

```bash
docker compose down -v
```

## 🔧 Troubleshooting

### Port Already in Use

If port 3000 is busy, change `PORT` in `.env`:

```env
PORT=3001
```

### Database Connection Failed

1. Check Docker services are running:
   ```bash
   docker compose ps
   ```

2. Check database URL in `.env` matches Docker config:
   ```env
   DATABASE_URL=postgresql://giftmap:password@localhost:5432/gift_map_dev
   ```

3. Try restarting postgres:
   ```bash
   docker compose restart postgres
   ```

### Redis Connection Failed

```bash
docker compose restart redis
```

### Prisma Client Issues

Regenerate the Prisma client:

```bash
npm run db:generate
```

### Fresh Start

Complete reset:

```bash
# Stop all services
docker compose down -v

# Remove node_modules
rm -rf node_modules package-lock.json

# Reinstall
npm install

# Restart services
docker compose up -d postgres redis

# Reinitialize database
npm run db:generate
npm run db:push
npm run db:seed

# Start dev server
npm run dev
```

## 📦 Project Structure

```
api/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── config/                # Configuration (env, db, redis, logger)
│   ├── middleware/            # Auth, validation, error handling
│   ├── modules/               # Feature modules
│   │   ├── auth/
│   │   ├── workspaces/
│   │   ├── gift-maps/
│   │   ├── people/
│   │   ├── gift-ideas/
│   │   └── edges/
│   ├── shared/                # Shared utilities
│   │   ├── errors/
│   │   └── utils/
│   ├── database/
│   │   └── seed.ts            # Database seeding
│   └── app.ts                 # Main application
├── .env.example               # Environment template
├── package.json
└── tsconfig.json
```

## 🚀 Next Steps

After completing setup:

1. ✅ Test API endpoints with curl or Postman
2. ✅ Explore data in Prisma Studio
3. ✅ Review module structure
4. ✅ Run test suite
5. ✅ Start building frontend integration

## 📝 Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| NODE_ENV | Environment mode | development |
| PORT | Server port | 3000 |
| HOST | Server host | 0.0.0.0 |
| DATABASE_URL | PostgreSQL connection | See .env.example |
| REDIS_URL | Redis connection | redis://localhost:6379 |
| JWT_SECRET | Access token secret | (change in production) |
| JWT_REFRESH_SECRET | Refresh token secret | (change in production) |
| JWT_EXPIRES_IN | Access token lifetime | 15m |
| JWT_REFRESH_EXPIRES_IN | Refresh token lifetime | 7d |
| ALLOWED_ORIGINS | CORS origins | http://localhost:5173,http://localhost:3000 |

## 🎯 Production Deployment

For production deployment:

1. Change all secrets in `.env`
2. Use strong JWT secrets (32+ characters)
3. Set `NODE_ENV=production`
4. Use proper database credentials
5. Configure CORS for your domain
6. Set up SSL/TLS
7. Configure monitoring (Sentry, etc.)
8. Set up backup strategy
9. Use migrations instead of `db:push`
10. Never expose Prisma Studio

---

**Need help?** Check the main README or open an issue.
