#!/bin/bash

# Knowledge Base Duplicate Files Enhancement - Setup Script
# This script sets up the database migration for enhanced file path display

set -e

echo "================================================"
echo "Knowledge Base: Duplicate Files Enhancement"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo -e "${BLUE}Step 1: Checking backend setup...${NC}"
cd backend

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Copying from .env.example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✓ Created .env file"
    else
        echo "❌ No .env.example found. Please configure database connection manually."
        exit 1
    fi
fi

# Source environment variables
export $(cat .env | grep -v '^#' | xargs)

echo -e "${GREEN}✓ Backend setup checked${NC}"
echo ""

echo -e "${BLUE}Step 2: Running database migration...${NC}"

# Check if database is accessible
if [ -z "$DB_HOST" ] || [ -z "$DB_NAME" ]; then
    echo -e "${YELLOW}⚠️  Database connection not configured in .env${NC}"
    echo "Please ensure these variables are set:"
    echo "  - DB_HOST"
    echo "  - DB_PORT"
    echo "  - DB_NAME"
    echo "  - DB_USER"
    echo "  - DB_PASSWORD"
    exit 1
fi

# Run the migration
MIGRATION_FILE="src/migrations/add-source-path-to-documents.sql"

if [ -f "$MIGRATION_FILE" ]; then
    echo "Running migration: $MIGRATION_FILE"
    
    # Try to run with psql if available
    if command -v psql &> /dev/null; then
        PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p ${DB_PORT:-5432} -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE
        echo -e "${GREEN}✓ Migration executed successfully${NC}"
    else
        echo -e "${YELLOW}⚠️  psql not found. Please run the migration manually:${NC}"
        echo "   psql -h $DB_HOST -p ${DB_PORT:-5432} -U $DB_USER -d $DB_NAME -f $MIGRATION_FILE"
        echo ""
        echo "Or copy and paste this SQL:"
        echo "---"
        cat $MIGRATION_FILE
        echo "---"
    fi
else
    echo "❌ Migration file not found: $MIGRATION_FILE"
    exit 1
fi

echo ""
echo -e "${BLUE}Step 3: Building backend...${NC}"
npm run build
echo -e "${GREEN}✓ Backend built successfully${NC}"
echo ""

cd ..

echo -e "${BLUE}Step 4: Building frontend...${NC}"
cd frontend
npm run build
echo -e "${GREEN}✓ Frontend built successfully${NC}"
echo ""

cd ..

echo ""
echo "================================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "================================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend:"
echo "   cd backend && npm run start:dev"
echo ""
echo "2. Start the frontend:"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Re-sync your data sources to populate paths:"
echo "   - Go to Knowledge Base → Data Sources"
echo "   - Click 'Sync Now' on each source"
echo ""
echo "4. View your documents:"
echo "   - Go to Knowledge Base → Documents"
echo "   - Files with duplicate names will show path context"
echo ""
echo "📚 Documentation:"
echo "   - Complete Guide: KNOWLEDGE-BASE-DUPLICATE-FILES-COMPLETE.md"
echo "   - Visual Guide: KNOWLEDGE-BASE-DUPLICATE-FILES-VISUAL-GUIDE.md"
echo "   - Overview: KNOWLEDGE-BASE-DUPLICATE-NAMES-ENHANCEMENT.md"
echo ""
