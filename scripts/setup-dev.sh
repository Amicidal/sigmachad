#!/bin/bash

# Memento Development Environment Setup Script
# This script sets up the complete development environment for Memento

set -e

echo "🚀 Setting up Memento development environment..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "⚠️  pnpm not found. Installing pnpm..."
    npm install -g pnpm
fi

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env 2>/dev/null || echo "# Add your environment variables here" > .env
    echo "⚠️  Please configure your .env file with the appropriate values"
fi

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are healthy
echo "🔍 Checking service health..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Docker services are running"
else
    echo "❌ Docker services failed to start"
    exit 1
fi

# Run database setup
echo "🗄️  Setting up databases..."
pnpm run sync

# Build the application
echo "🔨 Building application..."
pnpm build

# Run tests
echo "🧪 Running tests..."
pnpm test

echo ""
echo "🎉 Memento development environment setup complete!"
echo ""
echo "📚 Available commands:"
echo "  pnpm dev          - Start development server with hot reload"
echo "  pnpm start        - Start production server"
echo "  pnpm test         - Run tests"
echo "  pnpm docker:up    - Start all Docker services"
echo "  pnpm docker:down  - Stop all Docker services"
echo "  pnpm health       - Check system health"
echo ""
echo "🌐 Application will be available at: http://localhost:3000"
echo "📊 Health check: http://localhost:3000/health"
echo "🔌 WebSocket: ws://localhost:3000/ws"
echo ""
echo "📖 For more information, see README.md"

