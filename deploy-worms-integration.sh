#!/bin/bash

##############################################################################
# BGAPP WoRMS Species Catalog Deployment Script
# ===============================================
# Purpose: Deploy complete WoRMS integration to Cloudflare infrastructure
# Components: D1 schema, API proxy worker, species populator worker
# Usage: bash deploy-worms-integration.sh
##############################################################################

set -e  # Exit on error

echo "🌊 BGAPP WoRMS Species Catalog Deployment"
echo "=========================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WORKERS_DIR="infrastructure/workers"
D1_DATABASE="bgapp-data"
D1_DATABASE_ID="46ed7435-1b25-498d-b832-7bef98061df3"

##############################################################################
# Step 1: Verify Prerequisites
##############################################################################
echo -e "${BLUE}Step 1: Verifying prerequisites...${NC}"

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}Error: wrangler CLI not found${NC}"
    echo "Install with: npm install -g wrangler"
    exit 1
fi

# Check if authenticated
if ! wrangler whoami &> /dev/null; then
    echo -e "${YELLOW}Warning: Not authenticated with Cloudflare${NC}"
    echo "Running: wrangler login"
    wrangler login
fi

echo -e "${GREEN}✓ Prerequisites verified${NC}"
echo ""

##############################################################################
# Step 2: Deploy D1 Database Schema
##############################################################################
echo -e "${BLUE}Step 2: Deploying D1 database schema...${NC}"

cd "$WORKERS_DIR"

# Check if schema file exists
if [ ! -f "schema-marine-species.sql" ]; then
    echo -e "${RED}Error: schema-marine-species.sql not found${NC}"
    exit 1
fi

echo "Applying schema to D1 database: $D1_DATABASE"
wrangler d1 execute "$D1_DATABASE" --remote --file=schema-marine-species.sql

echo "Verifying tables created..."
wrangler d1 execute "$D1_DATABASE" --remote --command="
SELECT name FROM sqlite_master
WHERE type='table' AND name LIKE '%species%'
ORDER BY name;"

echo "Checking priority species..."
wrangler d1 execute "$D1_DATABASE" --remote --command="
SELECT COUNT(*) as total_species,
       SUM(CASE WHEN priority_level = 1 THEN 1 ELSE 0 END) as priority_1,
       SUM(CASE WHEN priority_level = 2 THEN 1 ELSE 0 END) as priority_2,
       SUM(CASE WHEN priority_level = 3 THEN 1 ELSE 0 END) as priority_3
FROM angola_priority_species;"

echo -e "${GREEN}✓ D1 schema deployed successfully${NC}"
echo ""

##############################################################################
# Step 3: Update KV Namespace ID in Proxy Worker Config
##############################################################################
echo -e "${BLUE}Step 3: Configuring KV namespace...${NC}"

# Get KV namespaces
echo "Listing available KV namespaces:"
wrangler kv:namespace list

echo ""
echo -e "${YELLOW}Please update worms-api-proxy.toml with your KV namespace ID${NC}"
echo "Press Enter when ready to continue..."
read

##############################################################################
# Step 4: Deploy WoRMS API Proxy Worker
##############################################################################
echo -e "${BLUE}Step 4: Deploying WoRMS API Proxy Worker...${NC}"

if [ ! -f "worms-api-proxy.js" ] || [ ! -f "worms-api-proxy.toml" ]; then
    echo -e "${RED}Error: worms-api-proxy files not found${NC}"
    exit 1
fi

echo "Deploying worms-api-proxy worker..."
wrangler deploy worms-api-proxy.js --config worms-api-proxy.toml

echo "Testing deployment..."
sleep 2
echo "Health check:"
curl -s https://worms-api-proxy.majearcasa.workers.dev/health | jq '.'

echo "Testing species search:"
curl -s "https://worms-api-proxy.majearcasa.workers.dev/api/species/search?q=Sardinella&marine_only=true" | jq '.[0]'

echo -e "${GREEN}✓ WoRMS API Proxy deployed successfully${NC}"
echo ""

##############################################################################
# Step 5: Deploy Species Populator Worker
##############################################################################
echo -e "${BLUE}Step 5: Deploying Species Populator Worker...${NC}"

if [ ! -f "worms-species-populator.js" ] || [ ! -f "worms-species-populator.toml" ]; then
    echo -e "${RED}Error: worms-species-populator files not found${NC}"
    exit 1
fi

echo "Deploying worms-species-populator worker..."
wrangler deploy worms-species-populator.js --config worms-species-populator.toml

echo "Testing deployment..."
sleep 2
echo "Health check:"
curl -s https://worms-species-populator.majearcasa.workers.dev/health | jq '.'

echo "Initial status (should show 0% populated):"
curl -s https://worms-species-populator.majearcasa.workers.dev/status | jq '.'

echo -e "${GREEN}✓ Species Populator Worker deployed successfully${NC}"
echo ""

##############################################################################
# Step 6: Populate Priority Species
##############################################################################
echo -e "${BLUE}Step 6: Populating priority species catalog...${NC}"

echo -e "${YELLOW}Do you want to populate priority species now? (y/n)${NC}"
read -r POPULATE_NOW

if [ "$POPULATE_NOW" = "y" ] || [ "$POPULATE_NOW" = "Y" ]; then
    echo "Starting population of priority species..."
    echo "This will take approximately 1-2 minutes for 30+ species..."

    # Populate in 3 batches of 10 species each
    for i in {1..3}; do
        echo ""
        echo "Batch $i of 3..."
        curl -s https://worms-species-populator.majearcasa.workers.dev/populate?batch_size=10 | jq '{total, successful, failed}'
        sleep 3  # Delay between batches to respect rate limits
    done

    echo ""
    echo "Final population status:"
    curl -s https://worms-species-populator.majearcasa.workers.dev/status | jq '{
        total_priority_species,
        priority_populated,
        priority_remaining,
        total_species_in_catalog,
        population_progress
    }'

    echo ""
    echo "Sample species with Portuguese names:"
    wrangler d1 execute "$D1_DATABASE" --remote --command="
    SELECT
      scientific_name,
      common_name_pt,
      family,
      angola_eez_relevance
    FROM marine_species
    WHERE common_name_pt IS NOT NULL
    LIMIT 5;"

    echo -e "${GREEN}✓ Priority species populated${NC}"
else
    echo -e "${YELLOW}Skipping population. You can populate later with:${NC}"
    echo "curl https://worms-species-populator.majearcasa.workers.dev/populate?batch_size=10"
fi

echo ""

##############################################################################
# Deployment Summary
##############################################################################
echo ""
echo "=========================================="
echo -e "${GREEN}🎉 WoRMS Integration Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Deployed Components:"
echo "  ✅ D1 Database Schema (marine_species + 5 tables)"
echo "  ✅ WoRMS API Proxy Worker"
echo "  ✅ Species Populator Worker"
echo ""
echo "Deployed Workers:"
echo "  📡 https://worms-api-proxy.majearcasa.workers.dev"
echo "  🔧 https://worms-species-populator.majearcasa.workers.dev"
echo ""
echo "Next Steps:"
echo "  1. Review deployment guide: WORMS_INTEGRATION_GUIDE.md"
echo "  2. Monitor worker logs: wrangler tail worms-api-proxy"
echo "  3. Add species endpoints to bgapp-api-worker.js"
echo "  4. Enhance ML predictions with species taxonomy"
echo ""
echo "Quick Commands:"
echo "  # Check population status"
echo "  curl https://worms-species-populator.majearcasa.workers.dev/status | jq '.'"
echo ""
echo "  # Search for species"
echo "  curl 'https://worms-api-proxy.majearcasa.workers.dev/api/species/search?q=Sardinella' | jq '.'"
echo ""
echo "  # View catalog in D1"
echo "  wrangler d1 execute $D1_DATABASE --remote --command='SELECT COUNT(*) FROM marine_species;'"
echo ""
echo -e "${BLUE}For complete documentation, see: WORMS_INTEGRATION_GUIDE.md${NC}"
echo ""

# Return to project root
cd ../..

exit 0
