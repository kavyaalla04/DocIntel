#!/bin/bash

# Document Intelligence Platform - FastAPI Quick Start

set -e

echo ""
echo "🚀 Document Intelligence Platform (FastAPI) - Quick Start"
echo "=========================================================="
echo ""

# Check Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed."
    exit 1
fi

echo "✓ Docker and Docker Compose found"
echo ""

# Check for .env file
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    
    if [ -z "$OPENROUTER_API_KEY" ]; then
        echo ""
        echo "⚠️  OPENROUTER_API_KEY not set!"
        echo "   Get a free key from https://openrouter.io"
        echo ""
        echo "   Set it with:"
        echo "   export OPENROUTER_API_KEY='sk-or-v1-YOUR_KEY_HERE'"
        echo ""
        echo "   OR edit: .env"
        echo ""
        read -p "   Enter your OpenRouter API key (or press Enter for demo): " api_key
        if [ ! -z "$api_key" ]; then
            export OPENROUTER_API_KEY="$api_key"
        fi
    fi
fi

echo "🔧 Starting FastAPI services..."
echo ""

# Stop existing containers
docker-compose down 2>/dev/null || true

# Start services
docker-compose up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 5

echo ""
echo "🏥 Checking service health..."

# Check MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.runCommand('ping').ok" &>/dev/null; then
    echo "✓ MongoDB is ready"
else
    echo "⚠️  MongoDB is starting..."
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping &>/dev/null; then
    echo "✓ Redis is ready"
else
    echo "⚠️  Redis is starting..."
fi

# Wait for backend
sleep 3

# Check Backend
if curl -s http://localhost:3000/health > /dev/null 2>&1; then
    echo "✓ FastAPI Backend is ready"
else
    echo "⚠️  Backend is starting..."
fi

echo ""
echo "=========================================================="
echo "✅ FastAPI Platform is starting!"
echo "=========================================================="
echo ""
echo "📍 Access the application at:"
echo ""
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3000"
echo "   API Docs: http://localhost:3000/docs"
echo ""
echo "🔑 OpenRouter API Key: ${OPENROUTER_API_KEY:0:20}..."
echo ""
echo "📚 Documentation: README.md"
echo ""
echo "💡 Tips:"
echo "   - Check logs: docker-compose logs -f backend"
echo "   - Stop:       docker-compose down"
echo "   - Reset:      docker-compose down -v"
echo ""
echo "🎉 Happy documenting with FastAPI!"
echo ""

# Show logs
echo "📋 Recent backend logs:"
docker-compose logs backend | tail -5
