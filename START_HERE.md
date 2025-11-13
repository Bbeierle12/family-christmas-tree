# 🎄 Gift Map Application - Quick Start Guide

Your enterprise-grade fullstack gift planning application is ready!

## 🚀 Quick Start (3 Steps)

### Step 1: Make Scripts Executable

```bash
chmod +x api/start.sh
chmod +x gift-mindmap/start.sh
```

### Step 2: Start Backend (Terminal 1)

```bash
cd api
./start.sh
```

This will:
- Start PostgreSQL and Redis with Docker
- Install dependencies
- Setup and seed the database
- Start the API on http://localhost:3000

### Step 3: Start Frontend (Terminal 2)

```bash
cd gift-mindmap
./start.sh
```

This will:
- Install dependencies
- Start the React app on http://localhost:5174

## 🎯 Access the App

Open your browser to: **http://localhost:5174**

**Login with demo account:**
- Email: `alice@example.com`
- Password: `Demo1234!`

## ✨ What You Can Do

1. **Manage Workspaces** - Create and organize multiple gift planning workspaces
2. **Create Gift Maps** - Plan for Christmas, birthdays, anniversaries, etc.
3. **Add People** - Add family members and friends
4. **Plan Gift Ideas** - Brainstorm and track gift ideas for each person
5. **Track Purchases** - Mark gifts as purchased
6. **Collaborate** - Share workspaces with family members (editor/viewer roles)

## 🛠️ Requirements

- **Node.js** 20+ (https://nodejs.org/)
- **Docker Desktop** (https://www.docker.com/products/docker-desktop)
- **Git** (https://git-scm.com/)

## 📖 Documentation

- `api/SETUP.md` - Detailed backend setup
- `api/TESTING.md` - Testing guide
- `FRONTEND_INTEGRATION.md` - Integration guide

## 🐛 Troubleshooting

### Backend won't start?
- Make sure Docker Desktop is running
- Check ports 3000, 5432, and 6379 are not in use
- Try: `docker compose down -v` then restart

### Frontend won't start?
- Check port 5174 is not in use
- Try: `rm -rf node_modules && npm install`

### Can't login?
- Make sure backend is running (check http://localhost:3000/health)
- Verify database was seeded (should see "✅ Database seeding complete!")
- Use demo account: alice@example.com / Demo1234!

### Changes not saving?
- Check browser console for errors (F12)
- Verify backend is running and responding
- Check network tab in DevTools for failed API calls

## 🎊 What You've Built

✅ **Enterprise-grade backend** with 45+ REST API endpoints
✅ **Modern React frontend** with TypeScript and React Query
✅ **Authentication system** with JWT tokens and automatic refresh
✅ **Multi-tenant workspaces** with role-based access control
✅ **Database persistence** with PostgreSQL and Prisma ORM
✅ **Comprehensive testing** with 130+ test cases
✅ **Production-ready architecture** with caching, security, and error handling

## 📊 Tech Stack

**Frontend:**
- React 18 + TypeScript
- React Query (TanStack Query)
- ReactFlow for graph visualization
- Axios for API calls
- Tailwind CSS + Radix UI

**Backend:**
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- Redis for caching
- JWT authentication
- Zod validation
- Vitest for testing

**DevOps:**
- Docker Compose for local development
- Hot reload for both frontend and backend
- Structured logging with Winston
- Environment-based configuration

---

**Need help?** Check the documentation files or open an issue!

**Enjoy planning your gifts!** 🎁✨
