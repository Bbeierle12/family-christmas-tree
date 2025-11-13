#!/bin/bash

echo "🎄 Starting Gift Map Application Frontend..."
echo ""

# Check if in correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the 'gift-mindmap' directory"
    echo "Usage: cd gift-mindmap && ./start.sh"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Starting frontend on http://localhost:5174"
echo "📧 Demo account: alice@example.com / Demo1234!"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev -- --port 5174
