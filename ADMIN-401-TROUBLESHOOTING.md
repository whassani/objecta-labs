# Admin 401 Unauthorized - Troubleshooting Guide

## Current Situation

✅ Frontend recognizes you as admin
✅ admin_token exists in localStorage
✅ admin_user has isAdmin=true
❌ Backend returns 401 Unauthorized

## Most Likely Causes

### 1. JWT Secret Mismatch
Backend and token were created with different JWT secrets.

**Check:**
```bash
# Backend .env
grep JWT_SECRET backend/.env
```

### 2. Token Expired
Admin tokens expire after 8 hours.

**Check:**
Go to http://localhost:3000/admin-debug
Look at "Admin Token Status" - is it expired?

**Fix:**
Clear localStorage and login again.

### 3. JWT Strategy Not Recognizing Admin Token
The JWT strategy might not be handling the `type: 'admin'` field.

**Check backend/src/modules/auth/strategies/jwt.strategy.ts:**
Does it handle both user and admin tokens?

### 4. Backend Not Running
Simple but possible!

**Check:**
```bash
curl http://localhost:3001/api/health
```

## Quick Debug Steps

### Step 1: Check Token in Browser Console
```javascript
const token = localStorage.getItem('admin_token');
console.log('Token:', token);

// Decode JWT
const parts = token.split('.');
const payload = JSON.parse(atob(parts[1]));
console.log('Payload:', payload);
console.log('Expired?', payload.exp < Date.now()/1000);
```

### Step 2: Test Token with curl
```bash
# Replace TOKEN with your actual token
TOKEN="your-admin-token-here"

curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/admin/dashboard
```

### Step 3: Check Backend Logs
Look at your backend console when you try to access the dashboard.
It should log why the token is invalid.

### Step 4: Verify JWT Secret
```bash
# Check if JWT_SECRET is set
cd backend
grep JWT_SECRET .env

# If not set, the default is 'your-secret-key'
```

## Solutions

### Solution 1: Token Expired - Re-login
```
1. Go to http://localhost:3000/admin-debug
2. Click "Clear & Go to Admin Login"
3. Login again with your admin credentials
4. Try accessing dashboard again
```

### Solution 2: JWT Secret Mismatch
```bash
# Make sure backend/.env has JWT_SECRET set
cd backend
echo "JWT_SECRET=your-secret-key-change-in-production" >> .env

# Restart backend
npm run start:dev

# Login again to get new token with correct secret
```

### Solution 3: Backend JWT Strategy Issue
If the JWT strategy doesn't handle admin tokens, we need to update it.

Check if `backend/src/modules/auth/strategies/jwt.strategy.ts` validates the token properly.

## Next Steps

Please:
1. Go to http://localhost:3000/admin-debug
2. Check if token is expired
3. Check backend console logs when you get 401
4. Share what you see

