#!/bin/bash

# Create Admin User Script
# This script helps create admin users with proper password hashing

set -e

echo "════════════════════════════════════════════════════════════"
echo "           🔐 Admin User Creation Wizard"
echo "════════════════════════════════════════════════════════════"
echo ""

# Check if we're in the backend directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: This script must be run from the backend directory"
    echo "   cd backend && bash scripts/create-admin.sh"
    exit 1
fi

# Check if bcrypt is installed
if ! node -e "require('bcrypt')" 2>/dev/null; then
    echo "❌ Error: bcrypt is not installed"
    echo "   Run: npm install bcrypt"
    exit 1
fi

# Prompt for information
read -p "📧 Admin email: " email
if [ -z "$email" ]; then
    echo "❌ Email is required"
    exit 1
fi

read -p "👤 Full name: " fullname
if [ -z "$fullname" ]; then
    fullname="Admin User"
fi

echo ""
echo "Select admin role:"
echo "  1) super_admin (full access)"
echo "  2) admin (most features)"
echo "  3) support (tickets only)"
read -p "Choose (1-3) [1]: " role_choice

case $role_choice in
    2) role="admin" ;;
    3) role="support" ;;
    *) role="super_admin" ;;
esac

read -sp "🔑 Password (will not be shown): " password
echo ""
if [ -z "$password" ]; then
    echo "❌ Password is required"
    exit 1
fi

read -sp "🔑 Confirm password: " password2
echo ""
if [ "$password" != "$password2" ]; then
    echo "❌ Passwords do not match"
    exit 1
fi

echo ""
echo "Method to create admin:"
echo "  1) Grant admin access to existing user (recommended)"
echo "  2) Create dedicated admin account"
read -p "Choose (1-2) [1]: " method

echo ""
echo "─────────────────────────────────────────────────────────────"
echo "📋 Summary:"
echo "─────────────────────────────────────────────────────────────"
echo "Email:  $email"
echo "Name:   $fullname"
echo "Role:   $role"
echo "Method: $([ "$method" = "2" ] && echo "Dedicated admin account" || echo "Existing user with admin flag")"
echo "─────────────────────────────────────────────────────────────"
echo ""
read -p "Proceed? (y/n) [y]: " confirm

if [ "$confirm" = "n" ]; then
    echo "❌ Cancelled"
    exit 0
fi

echo ""
echo "🔐 Generating password hash..."

# Generate hash using Node.js (wait for promise to resolve)
hash=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('$password', 10).then(h => { console.log(h); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });" 2>&1 | tail -1)

if [ $? -ne 0 ] || [ -z "$hash" ]; then
    echo "❌ Error generating password hash"
    echo "Hash output: $hash"
    exit 1
fi

echo "✅ Hash generated successfully!"
echo ""

# Generate SQL based on method
if [ "$method" = "2" ]; then
    # Method 2: Dedicated admin account
    sql="INSERT INTO admin_users (email, password_hash, full_name, admin_role, is_active)
VALUES (
  '$email',
  '$hash',
  '$fullname',
  '$role',
  true
);"
else
    # Method 1: Existing user with admin flag
    sql="UPDATE users 
SET \"isAdmin\" = true, \"adminRole\" = '$role'
WHERE email = '$email';"
fi

echo "════════════════════════════════════════════════════════════"
echo "📝 SQL COMMAND TO RUN:"
echo "════════════════════════════════════════════════════════════"
echo "$sql"
echo "════════════════════════════════════════════════════════════"
echo ""

# Ask if they want to run it now
read -p "Run this SQL command now? (requires psql) (y/n) [n]: " run_now

if [ "$run_now" = "y" ]; then
    echo ""
    read -p "Database host [localhost]: " db_host
    db_host=${db_host:-localhost}
    
    read -p "Database user [postgres]: " db_user
    db_user=${db_user:-postgres}
    
    read -p "Database name [objecta_labs]: " db_name
    db_name=${db_name:-objecta_labs}
    
    echo ""
    echo "🔄 Executing SQL..."
    
    # Check if running in Docker
    if docker ps 2>/dev/null | grep -q postgres; then
        echo "📦 Detected Docker container, using docker exec..."
        if command -v docker-compose &> /dev/null; then
            echo "$sql" | docker-compose exec -T postgres psql -U "$db_user" -d "$db_name"
        else
            # Try docker compose (without hyphen)
            echo "$sql" | docker compose exec -T postgres psql -U "$db_user" -d "$db_name"
        fi
    else
        echo "💻 Using local psql connection..."
        PGPASSWORD="${PGPASSWORD:-}" echo "$sql" | psql -h "$db_host" -U "$db_user" -d "$db_name"
    fi
    
    result=$?
    if [ $result -eq 0 ]; then
        echo ""
        echo "✅ SQL command executed!"
        echo ""
        echo "🔍 Verifying admin user was created..."
        
        # Verify the user was created/updated
        if [ "$method" = "2" ]; then
            verify_sql="SELECT email, full_name, admin_role, is_active FROM admin_users WHERE email = '$email';"
        else
            verify_sql="SELECT email, \"fullName\", \"isAdmin\", \"adminRole\" FROM users WHERE email = '$email';"
        fi
        
        # Run verification
        if docker ps 2>/dev/null | grep -q postgres; then
            if command -v docker-compose &> /dev/null; then
                verify_result=$(echo "$verify_sql" | docker-compose exec -T postgres psql -U "$db_user" -d "$db_name" -t 2>&1)
            else
                verify_result=$(echo "$verify_sql" | docker compose exec -T postgres psql -U "$db_user" -d "$db_name" -t 2>&1)
            fi
        else
            verify_result=$(PGPASSWORD="${PGPASSWORD:-}" echo "$verify_sql" | psql -h "$db_host" -U "$db_user" -d "$db_name" -t 2>&1)
        fi
        
        if echo "$verify_result" | grep -q "$email"; then
            echo "✅ Admin user verified in database!"
            echo ""
            echo "📌 NEXT STEPS:"
            echo "─────────────────────────────────────────────────────────────"
            echo "1. ✅ Admin user created and verified"
            echo "2. 🚪 Logout from the application"
            echo "3. 🔑 Login with: $email"
            echo "4. 🌐 Navigate to: http://localhost:3000/admin/dashboard"
            echo "─────────────────────────────────────────────────────────────"
        else
            echo "⚠️  SQL executed but user not found in verification."
            echo "   This might mean:"
            if [ "$method" = "1" ]; then
                echo "   - The user with email '$email' doesn't exist yet"
                echo "   - You need to create a regular user first, then grant admin access"
            fi
            echo ""
            echo "📋 Verification query result:"
            echo "$verify_result"
        fi
    else
        echo ""
        echo "❌ Error executing SQL (exit code: $result)"
        echo ""
        echo "Common issues:"
        echo "  - Database credentials incorrect"
        echo "  - Database not running"
        echo "  - User doesn't have permission"
        if [ "$method" = "1" ]; then
            echo "  - User with email '$email' doesn't exist (try Method 2 instead)"
        fi
        echo ""
        echo "Please run the SQL command manually:"
        echo "─────────────────────────────────────────────────────────────"
        echo "$sql"
        echo "─────────────────────────────────────────────────────────────"
    fi
else
    echo ""
    echo "📌 NEXT STEPS:"
    echo "─────────────────────────────────────────────────────────────"
    echo "1. Copy the SQL command above"
    echo "2. Connect to your database:"
    echo "   psql -h localhost -U postgres -d objecta-labs"
    echo "   OR"
    echo "   docker-compose exec postgres psql -U postgres -d objecta-labs"
    echo "3. Paste and run the SQL command"
    echo "4. Logout and login with: $email"
    echo "5. Navigate to: http://localhost:3000/admin/dashboard"
    echo "─────────────────────────────────────────────────────────────"
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Done!"
echo "════════════════════════════════════════════════════════════"
