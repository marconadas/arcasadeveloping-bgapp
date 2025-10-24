#!/bin/bash

###############################################################################
# Initial Data Population Script
# Populates D1 database with high-quality NASA and Copernicus data
###############################################################################

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "========================================================================="
echo "    Initial Data Population for Realtime Angola"
echo "========================================================================="
echo ""

# Pre-flight check
print_step "Pre-flight check..."

# Check if workers are deployed
print_step "Checking if workers are deployed..."
NASA_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://nasa-data-populator.majearcasa.workers.dev/status)
if [ "$NASA_STATUS" != "200" ]; then
    print_error "NASA populator not accessible. Please deploy first:"
    echo "  ./deploy-d1-integration.sh"
    exit 1
fi
print_success "Workers are accessible"

# Check current data count
print_step "Checking current data..."
CURRENT_COUNT=$(curl -s https://diagnose-d1-data.majearcasa.workers.dev/diagnose | jq '.summary.total_records')
echo "Current records in database: $CURRENT_COUNT"

if [ "$CURRENT_COUNT" -gt 5000 ]; then
    print_warning "Database already has $CURRENT_COUNT records"
    read -p "Continue with population (will add more data)? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Population cancelled"
        exit 0
    fi
fi

# Population Step 1: NASA Data
print_step "Step 1/3: Populating NASA Data..."
echo "This will add:"
echo "  - 2000+ SST points (15-32°C)"
echo "  - 2000+ Ocean Color points (Chlorophyll-a)"
echo "  - 1500+ Salinity points (30-37 PSU)"
echo "  - 500+ Vessel Lights detections"
echo ""
echo "Estimated time: 2-5 minutes"
echo ""

read -p "Populate NASA data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Calling NASA populator..."
    
    RESPONSE=$(curl -X POST https://nasa-data-populator.majearcasa.workers.dev/populate \
      -H "Content-Type: application/json" \
      -d '{"dataTypes": "all"}' \
      -w "\nHTTP_STATUS:%{http_code}")
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
    
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "207" ]; then
        print_success "NASA data population completed"
        echo "$BODY" | jq '.summary'
        
        # Extract counts
        SST_COUNT=$(echo "$BODY" | jq '.summary.nasa_sst.rows_inserted // 0')
        OCEAN_COUNT=$(echo "$BODY" | jq '.summary.nasa_ocean_color.rows_inserted // 0')
        SALINITY_COUNT=$(echo "$BODY" | jq '.summary.nasa_salinity.rows_inserted // 0')
        
        echo ""
        print_success "Inserted: $SST_COUNT SST, $OCEAN_COUNT Ocean Color, $SALINITY_COUNT Salinity"
    else
        print_error "NASA population failed (HTTP $HTTP_STATUS)"
        echo "$BODY" | jq '.' || echo "$BODY"
        exit 1
    fi
else
    print_warning "NASA population skipped"
fi

echo ""

# Population Step 2: Copernicus Data
print_step "Step 2/3: Populating Copernicus Data..."
echo "This will add complementary data:"
echo "  - 1500+ SST points"
echo "  - 1200+ Chlorophyll points"
echo "  - 1000+ Salinity points"
echo ""
echo "Estimated time: 1-3 minutes"
echo ""

read -p "Populate Copernicus data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_step "Calling Copernicus populator..."
    
    RESPONSE=$(curl -X POST https://copernicus-data-populator.majearcasa.workers.dev/populate \
      -H "Content-Type: application/json" \
      -d '{"dataTypes": "all"}' \
      -w "\nHTTP_STATUS:%{http_code}")
    
    HTTP_STATUS=$(echo "$RESPONSE" | grep HTTP_STATUS | cut -d':' -f2)
    BODY=$(echo "$RESPONSE" | sed '/HTTP_STATUS/d')
    
    if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "207" ]; then
        print_success "Copernicus data population completed"
        echo "$BODY" | jq '.summary'
        
        COP_SST=$(echo "$BODY" | jq '.summary.copernicus_sst.rows_inserted // 0')
        COP_CHLOR=$(echo "$BODY" | jq '.summary.copernicus_chlorophyll.rows_inserted // 0')
        COP_SAL=$(echo "$BODY" | jq '.summary.copernicus_salinity.rows_inserted // 0')
        
        echo ""
        print_success "Inserted: $COP_SST SST, $COP_CHLOR Chlorophyll, $COP_SAL Salinity"
    else
        print_error "Copernicus population failed (HTTP $HTTP_STATUS)"
        echo "$BODY" | jq '.' || echo "$BODY"
        # Don't exit - NASA data might be enough
    fi
else
    print_warning "Copernicus population skipped"
fi

echo ""

# Step 3: Verification
print_step "Step 3/3: Verifying Population..."
echo ""

# Wait a moment for D1 to update
sleep 2

# Run diagnostic
FINAL_DIAGNOSTIC=$(curl -s https://diagnose-d1-data.majearcasa.workers.dev/diagnose)

FINAL_COUNT=$(echo "$FINAL_DIAGNOSTIC" | jq '.summary.total_records')
SST_FINAL=$(echo "$FINAL_DIAGNOSTIC" | jq '.tables.sst_data.record_count')
OCEAN_FINAL=$(echo "$FINAL_DIAGNOSTIC" | jq '.tables.ocean_color_data.record_count')
SAL_FINAL=$(echo "$FINAL_DIAGNOSTIC" | jq '.tables.salinity_data.record_count')

echo "========================================================================="
echo "  Population Results"
echo "========================================================================="
echo ""
echo "Total records: $FINAL_COUNT"
echo "  - SST:         $SST_FINAL points"
echo "  - Ocean Color: $OCEAN_FINAL points"
echo "  - Salinity:    $SAL_FINAL points"
echo ""

# Check if we meet minimum targets
SUCCESS=true

if [ "$SST_FINAL" -lt 1500 ]; then
    print_warning "SST count is below target (1500+)"
    SUCCESS=false
fi

if [ "$OCEAN_FINAL" -lt 1500 ]; then
    print_warning "Ocean Color count is below target (1500+)"
    SUCCESS=false
fi

if [ "$SAL_FINAL" -lt 1000 ]; then
    print_warning "Salinity count is below target (1000+)"
    SUCCESS=false
fi

if [ "$SUCCESS" = true ]; then
    print_success "All targets met! Database is ready."
else
    print_warning "Some targets not met. You may want to:"
    echo "  1. Run population again"
    echo "  2. Check worker logs: wrangler tail nasa-data-populator"
    echo "  3. Verify NASA proxy is accessible"
fi

echo ""

# Test API worker
print_step "Testing API Worker..."
API_TEST=$(curl -s "https://bgapp-api-worker.majearcasa.workers.dev/api/oceanographic?type=sst&limit=5")
API_COUNT=$(echo "$API_TEST" | jq '.metadata.counts.sst')

if [ "$API_COUNT" -gt 0 ]; then
    print_success "API worker is returning data ($API_COUNT points)"
else
    print_error "API worker returned no data"
    echo "Response:"
    echo "$API_TEST" | jq '.'
fi

echo ""
echo "========================================================================="
echo "  Next Steps"
echo "========================================================================="
echo ""
echo "1. Open Realtime Angola app:"
echo "   cd apps/realtime-angola && npm run dev"
echo ""
echo "2. Activate map layers (SST, Chlorophyll, Salinity)"
echo ""
echo "3. Verify points appear on the map"
echo ""
echo "4. Check DataQualityIndicator component for metrics"
echo ""
echo "5. Set up scheduled refresh for automatic updates (optional):"
echo "   See: REALTIME-ANGOLA-D1-INTEGRATION-SUMMARY.md"
echo ""

if [ "$SUCCESS" = true ]; then
    print_success "Population completed successfully! 🎉"
else
    print_warning "Population completed with warnings. Review output above."
fi

echo ""

