#!/bin/bash

# Data Source Sync Setup Script
# This script installs dependencies and verifies the setup

set -e

echo "=================================================="
echo "🔄 Data Source Sync - Setup Script"
echo "=================================================="
echo ""

# Check if we're in the right directory
if [ ! -d "backend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend

echo ""
echo "Installing required packages:"
echo "  - @nestjs/schedule (for cron scheduling)"
echo "  - googleapis (for Google Drive)"
echo "  - @octokit/rest (for GitHub)"
echo "  - @notionhq/client (for Notion)"
echo ""

npm install @nestjs/schedule googleapis @octokit/rest @notionhq/client

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully!"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

cd ..

# Verify installation
echo ""
echo "=================================================="
echo "🔍 Verifying Installation"
echo "=================================================="
echo ""

# Check if files exist
FILES=(
    "backend/src/modules/knowledge-base/sync/base-sync-adapter.interface.ts"
    "backend/src/modules/knowledge-base/sync/data-source-sync.service.ts"
    "backend/src/modules/knowledge-base/sync/sync-scheduler.service.ts"
    "backend/src/modules/knowledge-base/sync/sync.controller.ts"
    "backend/src/modules/knowledge-base/sync/adapters/google-drive.adapter.ts"
    "backend/src/modules/knowledge-base/sync/adapters/confluence.adapter.ts"
    "backend/src/modules/knowledge-base/sync/adapters/github.adapter.ts"
    "backend/src/modules/knowledge-base/sync/adapters/notion.adapter.ts"
    "frontend/src/components/knowledge-base/DataSourceManager.tsx"
)

ALL_FILES_EXIST=true

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file"
    else
        echo "❌ Missing: $file"
        ALL_FILES_EXIST=false
    fi
done

echo ""

if [ "$ALL_FILES_EXIST" = true ]; then
    echo "✅ All files present!"
else
    echo "⚠️  Some files are missing. Please check the installation."
fi

# Check package.json
echo ""
echo "Checking package.json updates..."

if grep -q "@nestjs/schedule" backend/package.json; then
    echo "✅ @nestjs/schedule found in package.json"
else
    echo "⚠️  @nestjs/schedule not found in package.json"
fi

if grep -q "googleapis" backend/package.json; then
    echo "✅ googleapis found in package.json"
else
    echo "⚠️  googleapis not found in package.json"
fi

if grep -q "@octokit/rest" backend/package.json; then
    echo "✅ @octokit/rest found in package.json"
else
    echo "⚠️  @octokit/rest not found in package.json"
fi

if grep -q "@notionhq/client" backend/package.json; then
    echo "✅ @notionhq/client found in package.json"
else
    echo "⚠️  @notionhq/client not found in package.json"
fi

echo ""
echo "=================================================="
echo "📋 Next Steps"
echo "=================================================="
echo ""
echo "1. Start the backend server:"
echo "   cd backend && npm run start:dev"
echo ""
echo "2. The sync endpoints will be available at:"
echo "   http://localhost:3000/knowledge-base/sync/*"
echo ""
echo "3. Test the installation:"
echo "   cd backend && node test-data-source-sync.js"
echo "   (Remember to set JWT_TOKEN environment variable)"
echo ""
echo "4. Read the documentation:"
echo "   - Quick Start: ./DATA-SOURCE-SYNC-QUICK-START.md"
echo "   - Full Guide: ./DATA-SOURCE-SYNC-IMPLEMENTATION.md"
echo "   - Index: ./KNOWLEDGE-BASE-SYNC-INDEX.md"
echo ""
echo "5. Configure credentials for your platforms:"
echo "   - GitHub: Get token from https://github.com/settings/tokens"
echo "   - Confluence: Get token from Atlassian account settings"
echo "   - Notion: Create integration at https://www.notion.so/my-integrations"
echo "   - Google Drive: Set up OAuth2 in Google Cloud Console"
echo ""
echo "=================================================="
echo "✅ Setup Complete!"
echo "=================================================="
echo ""
