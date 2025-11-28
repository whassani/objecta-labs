#!/bin/bash

# Secrets Vault Migration Script
# Run this to set up the encrypted secrets vault

echo "🔐 Secrets Vault - Migration Script"
echo "===================================="
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

# Check if SECRETS_MASTER_KEY is set
if [ -z "$SECRETS_MASTER_KEY" ]; then
    echo "⚠️  WARNING: SECRETS_MASTER_KEY is not set in .env file"
    echo ""
    echo "🔑 Generating a new master key..."
    NEW_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    echo ""
    echo "📝 Add this to your .env file:"
    echo ""
    echo "SECRETS_MASTER_KEY=$NEW_KEY"
    echo ""
    echo "⚠️  IMPORTANT: Save this key securely!"
    echo "   - NEVER commit it to version control"
    echo "   - Store it in a password manager"
    echo "   - Use different keys for dev/staging/production"
    echo ""
    read -p "Press Enter to continue after adding the key to .env, or Ctrl+C to exit..."
    echo ""
fi

echo "🚀 Running migration..."
echo ""

# Run the migration
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f src/migrations/014-create-secrets-vault.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Migration completed successfully!"
    echo ""
    echo "📊 Created tables:"
    echo "   - secrets_vault (encrypted storage)"
    echo "   - secrets_access_log (audit trail)"
    echo "   - secrets_rotation_history (rotation tracking)"
    echo ""
    echo "🔐 Security Features:"
    echo "   - AES-256-GCM encryption"
    echo "   - Complete audit logging"
    echo "   - IP address tracking"
    echo "   - Secret rotation support"
    echo ""
    echo "🎉 Secrets Vault is ready!"
    echo ""
    echo "Next steps:"
    echo "1. Ensure SECRETS_MASTER_KEY is set in .env"
    echo "2. Start the backend: npm run start:dev"
    echo "3. Access UI: http://localhost:3000/admin/secrets"
    echo "4. Add your API keys via the secure UI"
    echo ""
    echo "📚 Quick Examples:"
    echo "   - Stripe: stripe.secret_key, stripe.publishable_key"
    echo "   - SMTP: smtp.password"
    echo "   - OpenAI: openai.api_key"
    echo "   - Anthropic: anthropic.api_key"
    echo ""
else
    echo ""
    echo "❌ Migration failed!"
    echo "   Please check the error messages above"
    exit 1
fi

unset PGPASSWORD
