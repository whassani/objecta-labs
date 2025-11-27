#!/bin/bash

# Test Database Connection Script
# Use this to verify your database setup before creating admin users

echo "════════════════════════════════════════════════════════════"
echo "           🔍 Database Connection Test"
echo "════════════════════════════════════════════════════════════"
echo ""

# Load environment variables if .env exists
if [ -f ".env" ]; then
    echo "📄 Loading database config from .env file..."
    export $(grep -v '^#' .env | grep -E 'DATABASE_NAME|DATABASE_USER|DATABASE_HOST|DATABASE_PASSWORD' | xargs)
    echo "   DATABASE_NAME: ${DATABASE_NAME:-not set}"
    echo "   DATABASE_USER: ${DATABASE_USER:-not set}"
    echo "   DATABASE_HOST: ${DATABASE_HOST:-not set}"
    echo ""
fi

# Test 1: Check Docker
echo "Test 1: Checking for Docker PostgreSQL..."
if docker ps 2>/dev/null | grep -q postgres; then
    echo "✅ Found PostgreSQL container running"
    
    # Get container name
    container=$(docker ps --filter "name=postgres" --format "{{.Names}}" | head -1)
    echo "   Container: $container"
    
    # Test connection
    echo ""
    echo "Testing connection to database..."
    
    # Get database name from env or use common names
    db_user="${DATABASE_USER:-postgres}"
    
    # Try DATABASE_NAME from env first, then common names
    if [ -n "$DATABASE_NAME" ]; then
        db_names="$DATABASE_NAME objecta-labs objecta_labs postgres"
    else
        db_names="objecta-labs objecta_labs postgres"
    fi
    
    for dbname in $db_names; do
        echo -n "  Trying database '$dbname' with user '$db_user'... "
        if docker exec "$container" psql -U "$db_user" -d "$dbname" -c "SELECT 1;" &>/dev/null; then
            echo "✅ Connected!"
            
            # Check for users table
            echo "  Checking for 'users' table..."
            if docker exec "$container" psql -U "$db_user" -d "$dbname" -c "\dt users" 2>/dev/null | grep -q "users"; then
                echo "  ✅ Found 'users' table"
                
                # Count users
                user_count=$(docker exec "$container" psql -U "$db_user" -d "$dbname" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
                echo "  📊 Total users: $user_count"
                
                # Count admin users
                admin_count=$(docker exec "$container" psql -U "$db_user" -d "$dbname" -t -c "SELECT COUNT(*) FROM users WHERE \"isAdmin\" = true;" 2>/dev/null | tr -d ' ')
                echo "  👑 Admin users: $admin_count"
                
                # List users
                if [ "$user_count" -gt 0 ]; then
                    echo ""
                    echo "  📋 Registered users:"
                    docker exec "$container" psql -U "$db_user" -d "$dbname" -c "SELECT email, \"isAdmin\", \"adminRole\" FROM users ORDER BY \"createdAt\" DESC LIMIT 5;"
                fi
                
                echo ""
                echo "════════════════════════════════════════════════════════════"
                echo "✅ Database is ready!"
                echo "   Connection: Docker container '$container'"
                echo "   Database: $dbname"
                echo ""
                echo "To create an admin user, run:"
                echo "  cd backend"
                echo "  bash scripts/create-admin-simple.sh"
                echo "════════════════════════════════════════════════════════════"
                exit 0
            else
                echo "  ⚠️  No 'users' table found"
            fi
        else
            echo "❌ Failed"
        fi
    done
    
    echo ""
    echo "⚠️  Could not connect to any known database"
    echo "   Try running migrations first"
    
else
    echo "⚠️  No PostgreSQL container found"
    echo ""
    
    # Test 2: Check local psql
    echo "Test 2: Checking for local PostgreSQL..."
    if command -v psql &> /dev/null; then
        echo "✅ Found local psql command"
        echo ""
        echo "Attempting local connection..."
        
        # Get connection details from env or use defaults
        db_host="${DATABASE_HOST:-localhost}"
        db_user="${DATABASE_USER:-postgres}"
        db_pass="${DATABASE_PASSWORD:-postgres}"
        
        # Try DATABASE_NAME from env first, then common names
        if [ -n "$DATABASE_NAME" ]; then
            db_names="$DATABASE_NAME objecta-labs objecta_labs postgres"
        else
            db_names="objecta-labs objecta_labs postgres"
        fi
        
        for dbname in $db_names; do
            echo -n "  Trying database '$dbname' on $db_host with user '$db_user'... "
            if PGPASSWORD="$db_pass" psql -h "$db_host" -U "$db_user" -d "$dbname" -c "SELECT 1;" &>/dev/null; then
                echo "✅ Connected!"
                
                echo ""
                echo "════════════════════════════════════════════════════════════"
                echo "✅ Database is ready!"
                echo "   Connection: Local PostgreSQL"
                echo "   Host: localhost"
                echo "   Database: $dbname"
                echo ""
                echo "To create an admin user, run:"
                echo "  cd backend"
                echo "  bash scripts/create-admin-simple.sh"
                echo "════════════════════════════════════════════════════════════"
                exit 0
            else
                echo "❌ Failed"
            fi
        done
        
        echo ""
        echo "⚠️  Could not connect to any database"
        echo "   Check your PostgreSQL credentials"
        
    else
        echo "❌ psql command not found"
    fi
fi

echo ""
echo "════════════════════════════════════════════════════════════"
echo "❌ No working database connection found"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Please ensure PostgreSQL is running:"
echo ""
echo "Option 1: Using Docker Compose"
echo "  docker-compose up -d postgres"
echo ""
echo "Option 2: Local PostgreSQL"
echo "  sudo systemctl start postgresql"
echo "  OR"
echo "  brew services start postgresql"
echo ""
echo "Then run migrations:"
echo "  cd backend"
echo "  npm run migration:run"
echo ""
echo "════════════════════════════════════════════════════════════"
