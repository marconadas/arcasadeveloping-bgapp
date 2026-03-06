#!/bin/bash

# BGAPP Public Services Test Script
# Comprehensive testing of all deployed services for client access
# MareDatum Consultoria e Gestão de Projectos Unipessoal LDA

set -e

echo "🧪 BGAPP Public Services Test Suite"
echo "===================================="
echo "Testing all deployed services for client access..."
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED_TESTS++))
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED_TESTS++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local expected_status=${2:-200}
    local description=$3
    
    ((TOTAL_TESTS++))
    print_status "Testing: $description"
    echo "URL: $url"
    
    # Test with curl
    response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 30 "$url")
    
    if [ "$response" = "$expected_status" ]; then
        print_success "$description - HTTP $response"
        return 0
    else
        print_error "$description - HTTP $response (expected $expected_status)"
        return 1
    fi
}

# Function to test JSON endpoint
test_json_endpoint() {
    local url=$1
    local expected_field=$2
    local description=$3
    
    ((TOTAL_TESTS++))
    print_status "Testing JSON: $description"
    echo "URL: $url"
    
    # Test JSON response
    if response=$(curl -s --max-time 30 "$url" 2>/dev/null); then
        if echo "$response" | jq -e ".$expected_field" > /dev/null 2>&1; then
            print_success "$description - Valid JSON with $expected_field"
            return 0
        else
            print_error "$description - Invalid JSON or missing $expected_field"
            return 1
        fi
    else
        print_error "$description - Failed to fetch JSON"
        return 1
    fi
}

# Function to test CORS
test_cors() {
    local url=$1
    local description=$2
    
    ((TOTAL_TESTS++))
    print_status "Testing CORS: $description"
    echo "URL: $url"
    
    # Test CORS headers
    cors_headers=$(curl -s -I --max-time 30 -H "Origin: https://example.com" "$url" | grep -i "access-control-allow-origin" || echo "")
    
    if [ -n "$cors_headers" ]; then
        print_success "$description - CORS headers present"
        return 0
    else
        print_error "$description - CORS headers missing"
        return 1
    fi
}

echo "Starting comprehensive service testing..."
echo ""

# 1. Test Main Workflow
echo "📊 Testing Main Workflow Service"
echo "================================"
test_endpoint "https://bgapp-workflow.majearcasa.workers.dev/" 200 "Main workflow endpoint"
test_json_endpoint "https://bgapp-workflow.majearcasa.workers.dev/" "success" "Main workflow JSON response"
test_json_endpoint "https://bgapp-workflow.majearcasa.workers.dev/client-info" "company" "Client information endpoint"
test_json_endpoint "https://bgapp-workflow.majearcasa.workers.dev/services" "services" "Services list endpoint"
test_cors "https://bgapp-workflow.majearcasa.workers.dev/" "Main workflow CORS"

echo ""

# 2. Test Admin Dashboard
echo "🔧 Testing Admin Dashboard"
echo "=========================="
test_endpoint "https://bgapp-admin.pages.dev/" 200 "Admin dashboard homepage"
test_endpoint "https://bgapp-admin.pages.dev/manifest.json" 200 "Admin dashboard manifest"
test_cors "https://bgapp-admin.pages.dev/" "Admin dashboard CORS"

echo ""

# 3. Test API Admin
echo "🚀 Testing API Admin"
echo "===================="
test_endpoint "https://bgapp-api.majearcasa.workers.dev/" 200 "API admin endpoint"
test_cors "https://bgapp-api.majearcasa.workers.dev/" "API admin CORS"

echo ""

# 4. Test STAC API
echo "🗺️  Testing STAC API"
echo "===================="
test_endpoint "https://bgapp-stac.majearcasa.workers.dev/" 200 "STAC API endpoint"
test_json_endpoint "https://bgapp-stac.majearcasa.workers.dev/" "stac_version" "STAC API JSON response"
test_cors "https://bgapp-stac.majearcasa.workers.dev/" "STAC API CORS"

echo ""

# 5. Test PyGeoAPI
echo "🌍 Testing PyGeoAPI"
echo "==================="
test_endpoint "https://bgapp-geoapi.majearcasa.workers.dev/" 200 "PyGeoAPI endpoint"
test_json_endpoint "https://bgapp-geoapi.majearcasa.workers.dev/" "title" "PyGeoAPI JSON response"
test_cors "https://bgapp-geoapi.majearcasa.workers.dev/" "PyGeoAPI CORS"

echo ""

# 6. Test STAC Browser
echo "📚 Testing STAC Browser"
echo "======================="
test_endpoint "https://bgapp-browser.majearcasa.workers.dev/" 200 "STAC browser endpoint"
test_cors "https://bgapp-browser.majearcasa.workers.dev/" "STAC browser CORS"

echo ""

# 7. Test Authentication
echo "🔐 Testing Authentication Service"
echo "================================="
test_endpoint "https://bgapp-auth.majearcasa.workers.dev/" 200 "Authentication endpoint"
test_json_endpoint "https://bgapp-auth.majearcasa.workers.dev/" "realm" "Authentication JSON response"
test_cors "https://bgapp-auth.majearcasa.workers.dev/" "Authentication CORS"

echo ""

# 8. Test Monitoring
echo "🌸 Testing Monitoring Service"
echo "============================="
test_endpoint "https://bgapp-monitor.majearcasa.workers.dev/" 200 "Monitoring endpoint"
test_json_endpoint "https://bgapp-monitor.majearcasa.workers.dev/" "status" "Monitoring JSON response"
test_cors "https://bgapp-monitor.majearcasa.workers.dev/" "Monitoring CORS"

echo ""

# 9. Test Frontend (if deployed)
echo "🌐 Testing Frontend"
echo "==================="
if test_endpoint "https://bgapp-frontend.pages.dev/" 200 "Frontend homepage"; then
    test_endpoint "https://bgapp-frontend.pages.dev/manifest.json" 200 "Frontend manifest"
    test_cors "https://bgapp-frontend.pages.dev/" "Frontend CORS"
else
    print_warning "Frontend not deployed yet - skipping frontend tests"
fi

echo ""

# 10. Test Health Check Workflow
echo "🏥 Testing Health Check Workflow"
echo "================================"
print_status "Initiating health check workflow..."
health_response=$(curl -s --max-time 60 "https://bgapp-workflow.majearcasa.workers.dev/health-check")

if echo "$health_response" | jq -e ".success" > /dev/null 2>&1; then
    print_success "Health check workflow initiated successfully"
    instance_id=$(echo "$health_response" | jq -r ".instanceId")
    echo "Instance ID: $instance_id"
    
    # Wait a moment and check status
    sleep 5
    status_response=$(curl -s "https://bgapp-workflow.majearcasa.workers.dev/status?instanceId=$instance_id")
    
    if echo "$status_response" | jq -e ".success" > /dev/null 2>&1; then
        print_success "Health check status retrieved successfully"
    else
        print_warning "Health check status not available yet"
    fi
else
    print_error "Health check workflow failed to initiate"
fi

echo ""

# 11. Test Service Integration
echo "🔗 Testing Service Integration"
echo "=============================="
print_status "Testing service integration and data flow..."

# Test if services can communicate
services=(
    "https://bgapp-workflow.majearcasa.workers.dev/services"
    "https://bgapp-stac.majearcasa.workers.dev/"
    "https://bgapp-geoapi.majearcasa.workers.dev/"
    "https://bgapp-monitor.majearcasa.workers.dev/"
)

all_services_responding=true
for service in "${services[@]}"; do
    if ! curl -s --max-time 10 "$service" > /dev/null; then
        all_services_responding=false
        break
    fi
done

if [ "$all_services_responding" = true ]; then
    print_success "All services responding to requests"
else
    print_error "Some services not responding properly"
fi

echo ""

# 12. Performance Testing
echo "⚡ Performance Testing"
echo "====================="
print_status "Testing response times..."

services=(
    "https://bgapp-workflow.majearcasa.workers.dev/"
    "https://bgapp-stac.majearcasa.workers.dev/"
    "https://bgapp-geoapi.majearcasa.workers.dev/"
    "https://bgapp-monitor.majearcasa.workers.dev/"
)

for service in "${services[@]}"; do
    response_time=$(curl -s -o /dev/null -w "%{time_total}" --max-time 30 "$service")
    if (( $(echo "$response_time < 5.0" | bc -l) )); then
        print_success "$service - Response time: ${response_time}s (Good)"
    else
        print_warning "$service - Response time: ${response_time}s (Slow)"
    fi
done

echo ""

# Final Test Summary
echo "📊 Test Results Summary"
echo "======================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $PASSED_TESTS"
echo "Failed: $FAILED_TESTS"

if [ $FAILED_TESTS -eq 0 ]; then
    echo ""
    print_success "🎉 All tests passed! BGAPP services are ready for client access."
    echo ""
    echo "✅ Services Status:"
    echo "   - Main Workflow: Operational"
    echo "   - Admin Dashboard: Operational"
    echo "   - API Admin: Operational"
    echo "   - STAC API: Operational"
    echo "   - PyGeoAPI: Operational"
    echo "   - STAC Browser: Operational"
    echo "   - Authentication: Operational"
    echo "   - Monitoring: Operational"
    echo ""
    echo "🌐 Client Access URLs:"
    echo "   - Main App: https://bgapp-frontend.pages.dev"
    echo "   - Admin: https://bgapp-admin.pages.dev"
    echo "   - API Docs: https://bgapp-api.majearcasa.workers.dev"
    echo "   - STAC API: https://bgapp-stac.majearcasa.workers.dev"
    echo "   - Client Info: https://bgapp-workflow.majearcasa.workers.dev/client-info"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Share client access URLs with clients"
    echo "   2. Configure custom domains (optional)"
    echo "   3. Set up monitoring alerts"
    echo "   4. Update client documentation"
    echo ""
    print_success "BGAPP is ready for production use! 🚀"
else
    echo ""
    print_error "❌ Some tests failed. Please review the issues above."
    echo ""
    echo "🔧 Troubleshooting:"
    echo "   1. Check if all services are deployed"
    echo "   2. Verify Cloudflare Workers are running"
    echo "   3. Check DNS resolution"
    echo "   4. Review service logs"
    echo ""
    exit 1
fi

echo ""
echo "📞 Support: info@maredatum.pt"
echo "🌐 Website: https://maredatum.pt"
echo ""
