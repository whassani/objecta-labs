#!/bin/bash

# Configuration Management Migration Script
# Run this to set up the configuration system

echo "🔧 Configuration Management System - Migration Script"
echo "======================================================"
echo ""

# Load environment variables
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Database connection details
DB_HOST=${DATABASE_HOST:-localhost}
DB_PORT=${DATABASE_PORT:-5432}
DB_USER=${DATABASE_USER:-postgres}
DB_NAME=${DATABASE_NAME:-objecta-labs}
DB_PASSWORD=${DATABASE_PASSWORD:-postgres}

echo "📋 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ Error: psql command not found. Please install PostgreSQL client."
    exit 1
fi

echo "🔍 Testing database connection..."
export PGPASSWORD=$DB_PASSWORD

# Test connection
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "✅ Database connection successful"
else
    echo "❌ Error: Could not connect to database"
    echo "   Please check your database credentials in .env file"
    exit 1
fi

echo ""
echo "🚀 Running migration..."
echo ""

# Run the migration
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f src/migrations/013-create-settings-tables.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Created tables:"
    echo "   - system_settings"
    echo "   - feature_flags"
    echo "   - organization_settings"
    echo "   - admin_preferences"
    echo "   - settings_audit_log"
    echo ""
    echo "🌱 Seeded default data:"
    echo "   - Platform branding settings"
    echo "   - Contact information"
    echo "   - Default limits"
    echo "   - Security policies"
    echo "   - Billing settings"
    echo "   - 14 default feature flags"
    echo ""
    echo "🎉 Configuration system is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Start the backend: npm run start:dev"
    echo "2. Test the API: GET http://localhost:3001/v1/admin/settings/system"
    echo "3. View public settings: GET http://localhost:3001/v1/admin/settings/system/public/all"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "   Please check the error messages above"
    exit 1
fi

unset PGPASSWORD
