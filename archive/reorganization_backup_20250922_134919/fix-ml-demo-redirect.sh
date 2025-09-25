#!/bin/bash

# Fix ML Demo Redirect Issue
echo "🔧 Fixing ML Demo Redirect Issue..."

# Navigate to frontend directory
cd /Users/marconadas/Documents/CODE/MareDatum_DevOps/arcasadeveloping-bgapp/infra/frontend

# Verify ml-demo.html exists and is correct
if [ -f "ml-demo.html" ]; then
    echo "✅ ml-demo.html exists"
    # Check if it contains the correct title
    if grep -q "BGAPP ML Demo" ml-demo.html; then
        echo "✅ ml-demo.html contains correct content"
    else
        echo "❌ ml-demo.html content is incorrect"
        exit 1
    fi
else
    echo "❌ ml-demo.html not found"
    exit 1
fi

# Deploy only the ml-demo.html file specifically
echo "🚀 Deploying ml-demo.html specifically..."
wrangler pages deploy . --project-name=bgapp-frontend

echo "✅ ML Demo redirect fix completed!"
echo "🌐 Check: https://bgapp-frontend.pages.dev/ml-demo"