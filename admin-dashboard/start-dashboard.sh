#!/bin/bash

# 🚀 BGAPP Admin Dashboard - Smart Launcher
# Automatically finds available port and starts the dashboard

echo "🚀 BGAPP Enhanced Dashboard - Silicon Valley Edition"
echo "=================================================="

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Function to check if port is available
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 1  # Port is busy
    else
        return 0  # Port is available
    fi
}

# Array of ports to try
PORTS=(3000 3002 4000 8080 5000 3003 3004 3005)

echo "🔍 Checking for available ports..."

for port in "${PORTS[@]}"; do
    if check_port $port; then
        echo "✅ Port $port is available!"
        echo "🌟 Starting BGAPP Dashboard on http://localhost:$port"
        echo ""
        echo "🎯 Features Available:"
        echo "   • 🎨 Modern UI/UX with animations"
        echo "   • ⚡ Real-time metrics dashboard"
        echo "   • 📊 Advanced analytics (heatmaps, cohort, funnels)"
        echo "   • 🤖 AI Assistant with GPT-4"
        echo "   • 📱 Fully responsive design"
        echo ""
        echo "🚀 Launching in 3 seconds..."
        sleep 3
        
        npm run dev -- -p $port
        exit 0
    else
        echo "❌ Port $port is busy, trying next..."
    fi
done

echo "🚨 All common ports are busy!"
echo "💡 Try manually with: npm run dev -- -p [PORT_NUMBER]"
echo "📋 Available commands:"
echo "   npm run dev          # Port 3000"
echo "   npm run dev:3002     # Port 3002"  
echo "   npm run dev:4000     # Port 4000"
echo "   npm run dev:8080     # Port 8080"
