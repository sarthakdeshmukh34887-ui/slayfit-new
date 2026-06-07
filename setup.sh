#!/bin/bash

echo "🚀 FitAI Tracker Setup Script"
echo "=============================="

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js 18+ required. Current: $(node -v)"
    exit 1
fi
echo "✅ Node.js version: $(node -v)"

# Check if .env exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from .env.example..."
    cp .env.example .env
    echo "📝 Please edit .env and add your Anthropic API key"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Verify installation
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
    echo ""
    echo "🎯 Next steps:"
    echo "   1. Add your Claude API key to .env"
    echo "   2. Run: npx expo start"
    echo ""
    echo "📱 Scan the QR code with Expo Go to run on your device"
else
    echo "❌ Installation failed. Please check the error messages above."
    exit 1
fi
