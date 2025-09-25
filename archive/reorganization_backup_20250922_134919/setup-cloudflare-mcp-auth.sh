#!/bin/bash

echo "🔧 Setting up Cloudflare MCP Authentication"
echo "==========================================="
echo ""

# Check if API token is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide your Cloudflare API token"
    echo ""
    echo "Usage: $0 <your_cloudflare_api_token>"
    echo ""
    echo "📋 To create an API token:"
    echo "1. Go to https://dash.cloudflare.com/profile/api-tokens"
    echo "2. Click 'Create Token'"
    echo "3. Use 'Custom token' with these permissions:"
    echo "   - Account:Read"
    echo "   - Workers Scripts:Edit"
    echo "   - D1:Edit"
    echo "   - Workers KV:Edit"
    echo "   - R2:Edit"
    echo "   - Queues:Edit"
    echo "   - Analytics:Read"
    echo "   - Logs:Read"
    echo "   - Zone:Read"
    echo "4. Set Account Resources to 'Include All accounts'"
    echo "5. Copy the token and run: $0 <token>"
    exit 1
fi

API_TOKEN="$1"

echo "🔑 Setting up API token..."

# Export for current session
export CLOUDFLARE_API_TOKEN="$API_TOKEN"

# Add to shell profiles
echo "" >> ~/.bashrc
echo "# Cloudflare API Token for MCP" >> ~/.bashrc
echo "export CLOUDFLARE_API_TOKEN=\"$API_TOKEN\"" >> ~/.bashrc

echo "" >> ~/.zshrc
echo "# Cloudflare API Token for MCP" >> ~/.zshrc
echo "export CLOUDFLARE_API_TOKEN=\"$API_TOKEN\"" >> ~/.zshrc

echo "✅ API token configured for current session and future shells"

# Test the token
echo "🧪 Testing API token..."
curl -s -H "Authorization: Bearer $API_TOKEN" \
     -H "Content-Type: application/json" \
     "https://api.cloudflare.com/client/v4/user/tokens/verify" | \
     python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    if data.get('success'):
        print('✅ Token is valid!')
        result = data.get('result', {})
        print(f'   Status: {result.get(\"status\", \"unknown\")}')
        print(f'   ID: {result.get(\"id\", \"unknown\")}')
    else:
        print('❌ Token validation failed!')
        for error in data.get('errors', []):
            print(f'   Error: {error.get(\"message\", \"Unknown error\")}')
except:
    print('❌ Failed to test token')
"

echo ""
echo "🚀 Next steps:"
echo "1. Restart your terminal or run: source ~/.bashrc (or ~/.zshrc)"
echo "2. Run: claude mcp restart"
echo "3. The Cloudflare MCPs should now authenticate properly!"