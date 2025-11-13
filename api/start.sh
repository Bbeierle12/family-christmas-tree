#!/bin/bash

echo "🎄 Starting Gift Map Application Backend..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Error: Docker is not installed"
    echo "Please install Docker Desktop from: https://www.docker.com/products/docker-desktop"
    exit 1
fi

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the 'api' directory"
    echo "Usage: cd api && ./start.sh"
    exit 1
fi

echo "📦 Step 1: Starting Docker services (PostgreSQL + Redis)..."
docker compose up -d postgres redis

echo "⏳ Waiting for databases to be ready..."
sleep 5

echo "🔧 Step 2: Installing dependencies..."
npm install

echo "🗄️  Step 3: Setting up database..."
npm run db:generate
npm run db:push

echo "🌱 Step 4: Seeding database with demo data..."
npm run db:seed

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting API server on http://localhost:3000"
echo "📧 Demo account: alice@example.com / Demo1234!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev
