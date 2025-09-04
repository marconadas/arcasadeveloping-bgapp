@echo off
echo 🚀 BGAPP Admin Dashboard - Silicon Valley Edition
echo ==================================================

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

echo 🔍 Checking for available ports...

REM Try different ports
echo ✅ Trying port 3000...
netstat -an | findstr "3000" >nul
if errorlevel 1 (
    echo 🌟 Starting BGAPP Dashboard on http://localhost:3000
    echo.
    echo 🎯 Features Available:
    echo    • 🎨 Modern UI/UX with animations
    echo    • ⚡ Real-time metrics dashboard
    echo    • 📊 Advanced analytics (heatmaps, cohort, funnels)
    echo    • 🤖 AI Assistant with GPT-4
    echo    • 📱 Fully responsive design
    echo.
    npm run dev
    goto :end
)

echo ❌ Port 3000 is busy, trying 3002...
netstat -an | findstr "3002" >nul
if errorlevel 1 (
    echo 🌟 Starting BGAPP Dashboard on http://localhost:3002
    npm run dev:3002
    goto :end
)

echo ❌ Port 3002 is busy, trying 4000...
netstat -an | findstr "4000" >nul
if errorlevel 1 (
    echo 🌟 Starting BGAPP Dashboard on http://localhost:4000
    npm run dev:4000
    goto :end
)

echo ❌ Port 4000 is busy, trying 8080...
netstat -an | findstr "8080" >nul
if errorlevel 1 (
    echo 🌟 Starting BGAPP Dashboard on http://localhost:8080
    npm run dev:8080
    goto :end
)

echo 🚨 All common ports are busy!
echo 💡 Try manually with: npm run dev -- -p [PORT_NUMBER]
echo 📋 Available commands:
echo    npm run dev          # Port 3000
echo    npm run dev:3002     # Port 3002  
echo    npm run dev:4000     # Port 4000
echo    npm run dev:8080     # Port 8080

:end
pause
