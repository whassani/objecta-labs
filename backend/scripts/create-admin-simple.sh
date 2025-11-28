#!/bin/bash

# Simple Admin User Creation Script
# This version focuses on reliability and clear output

set -e

echo "════════════════════════════════════════════════════════════"
echo "           🔐 Admin User Creation (Simple Mode)"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the backend directory"
    echo "   cd backend && bash scripts/create-admin-simple.sh"
    exit 1
fi

# Get email
read -p "📧 Admin email: " email
if [ -z "$email" ]; then
    echo "❌ Email is required"
    exit 1
fi

# Get password
read -sp "🔑 Password: " password
echo ""
if [ -z "$password" ]; then
    echo "❌ Password is required"
    exit 1
fi

# Get role
echo ""
echo "Select role:"
echo "  1) super_admin (full access) - recommended"
echo "  2) admin (most features)"
echo "  3) support (tickets only)"
read -p "Choose [1]: " role_choice

case $role_choice in
    2) role="admin" ;;
    3) role="support" ;;
    *) role="super_admin" ;;
esac

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "Creating admin with:"
echo "  Email: $email"
echo "  Role:  $role"
echo "─────────────────────────────────────────────────────────────"
echo ""

# Generate SQL for Method 1 (existing user with admin flag)
sql="UPDATE users SET \"isAdmin\" = true, \"adminRole\" = '$role' WHERE email = '$email';"

echo "🔐 Generating password hash..."

# Check if Node.js bcrypt is available
if ! node -e "require('bcrypt')" 2>/dev/null; then
    echo "⚠️  bcrypt not available, using plain SQL method"
    echo ""
fi

# Save to temp file
tmpfile=$(mktemp)
echo "$sql" > "$tmpfile"

echo "✅ SQL command ready"
echo ""
echo "════════════════════════════════════════════════════════════"
echo "📝 SQL COMMAND:"
echo "════════════════════════════════════════════════════════════"
cat "$tmpfile"
echo "════════════════════════════════════════════════════════════"
echo ""

# Try to detect database connection
echo "🔍 Detecting database connection..."
echo ""

DB_FOUND=false

# Check for Docker Compose
if docker ps 2>/dev/null | grep -q postgres; then
    echo "✅ Found PostgreSQL in Docker"
    DB_FOUND=true
    
    read -p "Execute SQL now via Docker? (y/n) [y]: " execute
    execute=${execute:-y}
    
    if [ "$execute" = "y" ]; then
        echo ""
        # Check for environment variables first
        if [ -f ".env" ]; then
            echo "📄 Found .env file, loading database config..."
            export $(grep -v '^#' .env | grep -E 'DATABASE_NAME|DATABASE_USER' | xargs)
        fi
        
        read -p "Database name [${DATABASE_NAME:-objecta-labs}]: " dbname
        dbname=${dbname:-${DATABASE_NAME:-objecta-labs}}
        
        read -p "Database user [${DATABASE_USER:-postgres}]: " dbuser
        dbuser=${dbuser:-${DATABASE_USER:-postgres}}
        
        echo "🔄 Executing SQL via Docker..."
        echo "   Database: $dbname"
        echo "   User: $dbuser"
        echo ""
        
        # Try docker-compose first, then docker compose
        if command -v docker-compose &> /dev/null; then
            docker-compose exec -T postgres psql -U "$dbuser" -d "$dbname" < "$tmpfile"
        else
            docker compose exec -T postgres psql -U "$dbuser" -d "$dbname" < "$tmpfile"
        fi
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ SQL executed successfully!"
            
            # Verify
            echo "🔍 Verifying..."
            verify_sql="SELECT email, \"isAdmin\", \"adminRole\" FROM users WHERE email = '$email';"
            
            if command -v docker-compose &> /dev/null; then
                result=$(echo "$verify_sql" | docker-compose exec -T postgres psql -U "$dbuser" -d "$dbname" -t 2>&1)
            else
                result=$(echo "$verify_sql" | docker compose exec -T postgres psql -U "$dbuser" -d "$dbname" -t 2>&1)
            fi
            
            if echo "$result" | grep -q "t.*$role"; then
                echo "✅ Admin user verified in database!"
                echo ""
                echo "🎉 SUCCESS! Admin user is ready."
                echo ""
                echo "📌 NEXT STEPS:"
                echo "─────────────────────────────────────────────────────────────"
                echo "1. 🚪 Logout from http://localhost:3000"
                echo "2. 🔑 Login with email: $email"
                echo "3. 🌐 Go to: http://localhost:3000/admin/dashboard"
                echo "─────────────────────────────────────────────────────────────"
            else
                echo "⚠️  User updated but verification unclear"
                echo "   The user might not exist yet."
                echo ""
                echo "💡 TIP: Register a user with email '$email' first at:"
                echo "   http://localhost:3000/register"
                echo ""
                echo "   Then run this script again."
            fi
        else
            echo ""
            echo "❌ Error executing SQL"
            echo ""
            echo "Please try running manually:"
            echo "docker-compose exec postgres psql -U postgres -d $dbname"
            echo "Then paste: $sql"
        fi
    fi
elif command -v psql &> /dev/null; then
    echo "✅ Found local psql"
    DB_FOUND=true
    
    read -p "Execute SQL now via psql? (y/n) [y]: " execute
    execute=${execute:-y}
    
    if [ "$execute" = "y" ]; then
        echo ""
        # Check for environment variables first
        if [ -f ".env" ]; then
            echo "📄 Found .env file, loading database config..."
            export $(grep -v '^#' .env | grep -E 'DATABASE_HOST|DATABASE_NAME|DATABASE_USER|DATABASE_PASSWORD' | xargs)
        fi
        
        read -p "Database host [${DATABASE_HOST:-localhost}]: " dbhost
        dbhost=${dbhost:-${DATABASE_HOST:-localhost}}
        
        read -p "Database name [${DATABASE_NAME:-objecta_labs}]: " dbname
        dbname=${dbname:-${DATABASE_NAME:-objecta_labs}}
        
        read -p "Database user [${DATABASE_USER:-postgres}]: " dbuser
        dbuser=${dbuser:-${DATABASE_USER:-postgres}}
        
        read -sp "Database password [from .env or empty]: " dbpass
        dbpass=${dbpass:-${DATABASE_PASSWORD:-}}
        echo ""
        
        echo "🔄 Executing SQL via psql..."
        echo "   Host: $dbhost"
        echo "   Database: $dbname"
        echo "   User: $dbuser"
        echo ""
        
        if [ -n "$dbpass" ]; then
            PGPASSWORD="$dbpass" psql -h "$dbhost" -U "$dbuser" -d "$dbname" < "$tmpfile"
        else
            psql -h "$dbhost" -U "$dbuser" -d "$dbname" < "$tmpfile"
        fi
        
        if [ $? -eq 0 ]; then
            echo ""
            echo "✅ SQL executed successfully!"
            echo ""
            echo "🎉 SUCCESS! Admin user is ready."
            echo ""
            echo "📌 NEXT STEPS:"
            echo "─────────────────────────────────────────────────────────────"
            echo "1. 🚪 Logout from http://localhost:3000"
            echo "2. 🔑 Login with email: $email"
            echo "3. 🌐 Go to: http://localhost:3000/admin/dashboard"
            echo "─────────────────────────────────────────────────────────────"
        else
            echo ""
            echo "❌ Error executing SQL"
        fi
    fi
fi

if [ "$DB_FOUND" = false ]; then
    echo "⚠️  Could not detect database connection"
    echo ""
    echo "Please run SQL manually:"
    echo "─────────────────────────────────────────────────────────────"
    echo "1. Connect to your database:"
    echo "   docker-compose exec postgres psql -U postgres -d objecta-labs"
    echo "   OR"
    echo "   psql -h localhost -U postgres -d objecta-labs"
    echo ""
    echo "2. Run this command:"
    echo "   $sql"
    echo "─────────────────────────────────────────────────────────────"
fi

# Cleanup
rm -f "$tmpfile"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Done!"
echo "════════════════════════════════════════════════════════════"
