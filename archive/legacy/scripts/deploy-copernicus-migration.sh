#!/bin/bash

# Deploy script for Copernicus migration from TOTP to simple auth
# This script helps with the gradual migration process

set -e

echo "🚀 Copernicus Authentication Migration Deployment"
echo "================================================"
echo ""

# Check if running in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from project root directory"
    exit 1
fi

# Function to check environment variables
check_env_vars() {
    local missing=0
    
    echo "📋 Checking required environment variables..."
    
    if [ -z "$COPERNICUS_USERNAME" ]; then
        echo "❌ Missing: COPERNICUS_USERNAME"
        missing=1
    else
        echo "✅ COPERNICUS_USERNAME: $COPERNICUS_USERNAME"
    fi
    
    if [ -z "$COPERNICUS_PASSWORD" ]; then
        echo "❌ Missing: COPERNICUS_PASSWORD"
        missing=1
    else
        echo "✅ COPERNICUS_PASSWORD: ***hidden***"
    fi
    
    if [ $missing -eq 1 ]; then
        echo ""
        echo "❌ Missing required environment variables!"
        echo "Please set them in your .env file or export them."
        exit 1
    fi
    
    echo "✅ All required variables present"
    echo ""
}

# Function to test authentication
test_auth() {
    echo "🔐 Testing simple authentication (no TOTP)..."
    
    if [ -f "scripts/test-simple-auth.js" ]; then
        node scripts/test-simple-auth.js
        if [ $? -eq 0 ]; then
            echo "✅ Authentication test passed!"
        else
            echo "❌ Authentication test failed!"
            exit 1
        fi
    else
        echo "⚠️ Test script not found, skipping auth test"
    fi
    echo ""
}

# Function to deploy webhook worker
deploy_webhook() {
    echo "🌐 Deploying webhook worker..."
    
    cd workers
    
    # Check if wrangler is installed
    if ! command -v wrangler &> /dev/null; then
        echo "❌ Wrangler CLI not found. Please install it first:"
        echo "npm install -g wrangler"
        exit 1
    fi
    
    # Deploy to staging first
    echo "📦 Deploying to staging environment..."
    wrangler deploy --config wrangler-webhook.toml --env development
    
    echo ""
    read -p "Deploy to production? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Deploying to production..."
        wrangler deploy --config wrangler-webhook.toml --env production
        
        # Set secrets
        echo "🔒 Setting production secrets..."
        echo "Please enter webhook authentication credentials:"
        read -p "Webhook username: " webhook_user
        read -s -p "Webhook password: " webhook_pass
        echo ""
        
        wrangler secret put WEBHOOK_AUTH_USERNAME --env production <<< "$webhook_user"
        wrangler secret put WEBHOOK_AUTH_PASSWORD --env production <<< "$webhook_pass"
        
        echo "✅ Webhook worker deployed!"
    else
        echo "⏭️ Skipping production deployment"
    fi
    
    cd ..
    echo ""
}

# Function to update main API worker
update_api_worker() {
    echo "🔄 Updating main API worker..."
    
    cd workers
    
    echo "📦 Deploying updated API worker (no TOTP)..."
    
    # Deploy to staging
    echo "Deploying to staging..."
    wrangler deploy --config wrangler.toml --env development
    
    echo ""
    read -p "Deploy to production? (y/N): " -n 1 -r
    echo ""
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "📦 Deploying to production..."
        wrangler deploy --config wrangler.toml --env production
        
        # Update secrets (remove TOTP-related ones)
        echo "🔒 Updating production secrets..."
        wrangler secret put COPERNICUS_USERNAME --env production <<< "$COPERNICUS_USERNAME"
        wrangler secret put COPERNICUS_PASSWORD --env production <<< "$COPERNICUS_PASSWORD"
        
        # Delete TOTP secret if it exists
        echo "🗑️ Removing TOTP secret..."
        wrangler secret delete COPERNICUS_TOTP_SECRET --env production 2>/dev/null || true
        
        echo "✅ API worker updated!"
    else
        echo "⏭️ Skipping production deployment"
    fi
    
    cd ..
    echo ""
}

# Function to create test subscription
create_subscription() {
    echo "📡 Creating test subscription..."
    
    read -p "Enter webhook URL (e.g., https://bgapp.ao/webhook/copernicus): " webhook_url
    
    if [ -z "$webhook_url" ]; then
        echo "⏭️ Skipping subscription creation"
        return
    fi
    
    # TODO: Implement subscription creation via API
    echo "✅ Subscription creation ready (implement via API)"
    echo ""
}

# Function to show migration summary
show_summary() {
    echo "📊 Migration Summary"
    echo "===================="
    echo ""
    echo "✅ Changes implemented:"
    echo "  - Removed TOTP dependency from authentication"
    echo "  - Created simple auth module (no TOTP required)"
    echo "  - Implemented webhook handler for PUSH subscriptions"
    echo "  - Updated API worker to use new auth method"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Monitor logs for any authentication errors"
    echo "  2. Create production subscriptions via API"
    echo "  3. Verify webhook is receiving notifications"
    echo "  4. Update STAC catalog processing"
    echo "  5. Remove old TOTP code after stable operation"
    echo ""
    echo "📚 Documentation:"
    echo "  - Spec: spec-kit/specs/20250917-copernicus-official-integration/"
    echo "  - Auth module: copernicus-official/auth/simple-auth.js"
    echo "  - Webhook: workers/copernicus-webhook.js"
    echo "  - Subscriptions: copernicus-official/subscriptions/manager.js"
    echo ""
}

# Main execution
main() {
    echo "Select deployment option:"
    echo "1) Full deployment (all components)"
    echo "2) Test authentication only"
    echo "3) Deploy webhook only"
    echo "4) Update API worker only"
    echo "5) Show migration summary"
    echo ""
    read -p "Option (1-5): " option
    echo ""
    
    case $option in
        1)
            check_env_vars
            test_auth
            deploy_webhook
            update_api_worker
            create_subscription
            show_summary
            ;;
        2)
            check_env_vars
            test_auth
            ;;
        3)
            deploy_webhook
            ;;
        4)
            check_env_vars
            update_api_worker
            ;;
        5)
            show_summary
            ;;
        *)
            echo "❌ Invalid option"
            exit 1
            ;;
    esac
    
    echo "✨ Done!"
}

# Run main function
main
