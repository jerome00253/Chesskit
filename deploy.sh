#!/bin/bash

# 🚀 Chess Application Deployment Script
# This script sets up and deploys the Chess application using Docker

set -e  # Exit on error

echo "🚀 Chess Application Deployment"
echo "================================"
echo ""

# Check if .env.docker already exists
if [ -f ".env.docker" ]; then
    echo "⚠️  .env.docker already exists!"
    read -p "Do you want to overwrite it? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled. Using existing .env.docker"
        echo ""
    else
        rm .env.docker
        echo "✅ Removed existing .env.docker"
    fi
fi

# Create .env.docker if it doesn't exist
if [ ! -f ".env.docker" ]; then
    echo "📝 Creating .env.docker configuration..."
    
    # Generate NEXTAUTH_SECRET
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "✅ Generated NEXTAUTH_SECRET"
    
    # Ask for server URL
    read -p "Enter your server URL (default: http://localhost:31312): " SERVER_URL
    SERVER_URL=${SERVER_URL:-http://localhost:31312}
    echo "✅ Server URL: $SERVER_URL"
    
    # Create .env.docker from template
    cp .env.docker.example .env.docker
    
    # Replace NEXTAUTH_SECRET
    sed -i "s|NEXTAUTH_SECRET=\"\"|NEXTAUTH_SECRET=\"$NEXTAUTH_SECRET\"|g" .env.docker
    
    # Replace NEXTAUTH_URL
    sed -i "s|NEXTAUTH_URL=\"http://localhost:3000\"|NEXTAUTH_URL=\"$SERVER_URL\"|g" .env.docker
    
    echo "✅ .env.docker created successfully!"
    echo ""
fi

# Ask for optional API keys
echo "🔑 Optional API Keys Configuration"
echo "You can press Enter to skip any API key"
echo ""

read -p "Chess.com API Key (optional): " CHESSCOM_KEY
if [ ! -z "$CHESSCOM_KEY" ]; then
    sed -i "s|CHESSCOM_API_KEY=\"\"|CHESSCOM_API_KEY=\"$CHESSCOM_KEY\"|g" .env.docker
    echo "✅ Chess.com API key configured"
fi

read -p "Lichess API Token (optional): " LICHESS_TOKEN
if [ ! -z "$LICHESS_TOKEN" ]; then
    sed -i "s|LICHESS_API_TOKEN=\"\"|LICHESS_API_TOKEN=\"$LICHESS_TOKEN\"|g" .env.docker
    echo "✅ Lichess API token configured"
fi

read -p "OpenAI API Key (optional): " OPENAI_KEY
if [ ! -z "$OPENAI_KEY" ]; then
    sed -i "s|OPENAI_API_KEY=\"\"|OPENAI_API_KEY=\"$OPENAI_KEY\"|g" .env.docker
    echo "✅ OpenAI API key configured"
fi

read -p "Google AI API Key (optional): " GOOGLE_AI_KEY
if [ ! -z "$GOOGLE_AI_KEY" ]; then
    sed -i "s|GOOGLE_GENERATIVE_AI_API_KEY=\"\"|GOOGLE_GENERATIVE_AI_API_KEY=\"$GOOGLE_AI_KEY\"|g" .env.docker
    echo "✅ Google AI API key configured"
fi

echo ""
echo "🐳 Starting Docker deployment..."
echo ""

# Stop any existing containers
if [ "$(docker compose ps -q)" ]; then
    echo "🛑 Stopping existing containers..."
    docker compose down
fi

# Build and start containers
echo "🏗️  Building and starting containers..."
docker compose up -d --build

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📍 Access points:"
echo "   - Application: http://localhost:31312"
echo "   - phpMyAdmin: http://localhost:1312"
echo "      Username: root"
echo "      Password: chessmysql"
echo ""
echo "📊 View logs with: docker compose logs -f"
echo "🛑 Stop containers with: docker compose down"
echo ""
echo "Happy Chess Analysis! ♟️"
