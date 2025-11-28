# Admin Scripts - Environment Variables Guide 🔧

## Overview

The admin creation scripts now support **environment variables** for database configuration. This makes it easier to use the scripts without entering database credentials every time.

---

## 🎯 Supported Environment Variables

The scripts will automatically read these variables from your `.env` file:

```bash
DATABASE_HOST=localhost      # Database host (default: localhost)
DATABASE_PORT=5432          # Database port (default: 5432)
DATABASE_USER=postgres      # Database user (default: postgres)
DATABASE_PASSWORD=postgres  # Database password (default: empty)
DATABASE_NAME=objecta-labs    # Database name (default: objecta-labs)
```

---

## 🚀 Quick Setup

### Step 1: Configure Environment Variables

**Option A: Use existing .env file**

If you already have a `.env` file in the `backend/` directory, the scripts will automatically load these values.

**Option B: Create .env file**

```bash
cd backend
cp .env.example .env
```

Then edit `.env` with your database settings:

```bash
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=yourpassword
DATABASE_NAME=objecta-labs
```

### Step 2: Run the Script

```bash
cd backend
bash scripts/create-admin-simple.sh
```

The script will:
1. ✅ Load database config from `.env` automatically
2. ✅ Show the detected values
3. ✅ Allow you to override by pressing Enter or typing new value
4. ✅ Connect to database using these settings

---

## 📋 How It Works

### Script Behavior

1. **Loads .env file** (if exists)
   ```
   📄 Found .env file, loading database config...
   ```

2. **Shows detected values** as defaults in prompts
   ```
   Database name [objecta-labs]: 
   Database user [postgres]: 
   ```

3. **You can:**
   - Press Enter to use the default (from .env)
   - Type a different value to override

---

## 🔍 Scripts with Environment Variable Support

### 1. create-admin-simple.sh ⭐

**Environment variables used:**
- `DATABASE_NAME` - Database name
- `DATABASE_USER` - Database user
- `DATABASE_HOST` - Database host (for local psql)
- `DATABASE_PASSWORD` - Database password (for local psql)

**Example:**
```bash
cd backend

# Script will auto-load from .env
bash scripts/create-admin-simple.sh

# You'll see:
# 📄 Found .env file, loading database config...
# Database name [objecta-labs]: ← Press Enter to use default
# Database user [postgres]: ← Press Enter to use default
```

### 2. test-db-connection.sh

**Environment variables used:**
- `DATABASE_NAME` - Database name
- `DATABASE_USER` - Database user
- `DATABASE_HOST` - Database host
- `DATABASE_PASSWORD` - Database password

**Example:**
```bash
cd backend
bash scripts/test-db-connection.sh

# Output:
# 📄 Loading database config from .env file...
#    DATABASE_NAME: objecta-labs
#    DATABASE_USER: postgres
#    DATABASE_HOST: localhost
```

### 3. create-admin.sh

**Note:** The full-featured script also supports environment variables but requires manual setup since it has more options.

---

## 💡 Usage Examples

### Example 1: Using Default Values from .env

```bash
# .env file content:
DATABASE_NAME=objecta-labs
DATABASE_USER=postgres

# Run script:
cd backend
bash scripts/create-admin-simple.sh

# Prompts will show:
Database name [objecta-labs]: ← Just press Enter
Database user [postgres]: ← Just press Enter
```

### Example 2: Override Environment Variables

```bash
# .env has DATABASE_NAME=objecta-labs
# But you want to use a different database

cd backend
bash scripts/create-admin-simple.sh

# When prompted:
Database name [objecta-labs]: my_test_db ← Type to override
Database user [postgres]: ← Press Enter for default
```

### Example 3: No .env File

```bash
# If no .env file exists, scripts use hardcoded defaults

cd backend
bash scripts/create-admin-simple.sh

# Prompts will show:
Database name [objecta-labs]: ← Default is objecta-labs
Database user [postgres]: ← Default is postgres
```

---

## 🔐 Security Best Practices

### DO ✅

1. **Add .env to .gitignore**
   ```bash
   # Already in .gitignore
   .env
   ```

2. **Use .env.example as template**
   ```bash
   cp .env.example .env
   # Then edit .env with real values
   ```

3. **Keep sensitive data in .env**
   - Database passwords
   - API keys
   - JWT secrets

4. **Use different .env for different environments**
   ```
   .env.development
   .env.production
   .env.test
   ```

### DON'T ❌

1. **Don't commit .env to version control**
2. **Don't share .env files**
3. **Don't use production credentials in development**
4. **Don't hardcode passwords in scripts**

---

## 🛠️ Troubleshooting

### Issue: Script not reading .env file

**Check:**
```bash
# 1. Is .env file in the backend directory?
ls -la backend/.env

# 2. Does it have the right variables?
cat backend/.env | grep DATABASE

# 3. Are you running from backend directory?
cd backend
pwd  # Should show /path/to/backend
```

**Solution:**
```bash
# Make sure you're in backend directory
cd backend

# Then run the script
bash scripts/create-admin-simple.sh
```

### Issue: Wrong database name being used

**Symptoms:**
```
Trying database 'objecta_labs'... ❌ Failed
```

**Solution:**
```bash
# 1. Check your .env file
cat .env | grep DATABASE_NAME

# 2. Should be:
DATABASE_NAME=objecta-labs

# 3. Run test script to verify
bash scripts/test-db-connection.sh
```

### Issue: Authentication failed

**Symptoms:**
```
psql: FATAL: password authentication failed
```

**Solution:**

**For Docker:**
```bash
# Docker uses trust authentication by default
# No password needed, but check user
DATABASE_USER=postgres
```

**For Local PostgreSQL:**
```bash
# Add password to .env
DATABASE_PASSWORD=yourpassword

# Or use .pgpass file
echo "localhost:5432:objecta-labs:postgres:yourpassword" > ~/.pgpass
chmod 600 ~/.pgpass
```

### Issue: Can't find database

**Solution:**
```bash
# 1. Test connection first
cd backend
bash scripts/test-db-connection.sh

# 2. This will show you:
#    - Available databases
#    - Connection details
#    - User count

# 3. Update .env with correct database name
DATABASE_NAME=the_correct_name
```

---

## 📊 Comparison: With vs Without .env

### Without .env (Manual Entry)

```bash
cd backend
bash scripts/create-admin-simple.sh

# You must type:
Database name [objecta-labs]: objecta-labs
Database user [postgres]: postgres

# Every time you run the script
```

### With .env (Automatic)

```bash
# Setup once:
cat > backend/.env << EOF
DATABASE_NAME=objecta-labs
DATABASE_USER=postgres
EOF

# Then just:
cd backend
bash scripts/create-admin-simple.sh

# Press Enter twice, done! ✅
```

---

## 🔄 Migration Guide

If you're already using the scripts without .env:

### Step 1: Create .env file

```bash
cd backend
cat > .env << 'EOF'
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=
DATABASE_NAME=objecta-labs

# Add other variables as needed
JWT_SECRET=your-secret-key
EOF
```

### Step 2: Test the connection

```bash
bash scripts/test-db-connection.sh
```

### Step 3: Create admin using .env

```bash
bash scripts/create-admin-simple.sh

# Now much easier - just press Enter for defaults!
```

---

## 📝 .env File Template

Complete `.env` template for admin scripts:

```bash
# =================================================================
# DATABASE CONFIGURATION
# =================================================================
# Used by admin creation scripts (create-admin-simple.sh, etc.)
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=postgres
DATABASE_NAME=objecta-labs

# =================================================================
# JWT CONFIGURATION
# =================================================================
JWT_SECRET=your-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# =================================================================
# OPTIONAL: Other Backend Configuration
# =================================================================
# NODE_ENV=development
# PORT=3001
# FRONTEND_URL=http://localhost:3000

# =================================================================
# OPTIONAL: Email Configuration
# =================================================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-password

# =================================================================
# NOTES:
# - Copy this file to .env and update with your values
# - Never commit .env to version control
# - Use .env.example as a template
# =================================================================
```

---

## 🎯 Summary

### What Changed

✅ Scripts now read database config from `.env` file
✅ Shows detected values as defaults in prompts
✅ Still allows manual override
✅ Works with both Docker and local PostgreSQL
✅ Supports all database-related environment variables

### Benefits

✅ **Faster** - No need to type credentials every time
✅ **Safer** - Keep credentials in .env (not in scripts)
✅ **Flexible** - Can still override if needed
✅ **Consistent** - Same config across all scripts
✅ **Standard** - Follows .env best practices

### Scripts Updated

✅ `create-admin-simple.sh` - Now uses .env
✅ `test-db-connection.sh` - Now uses .env
✅ `create-admin.sh` - Supports .env (partial)

---

## 🚀 Quick Start Reminder

```bash
# 1. Setup .env (one time)
cd backend
cp .env.example .env
# Edit .env with your database settings

# 2. Test connection
bash scripts/test-db-connection.sh

# 3. Create admin
bash scripts/create-admin-simple.sh

# 4. Done! ✅
```

---

**Environment variable support makes admin creation faster and more secure! 🎉**
