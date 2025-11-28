# Team Invitation Troubleshooting Guide

## Issue: "Failed to send invitation"

### Common Causes & Solutions

---

## 1. Backend Not Running ❌

**Check if backend is running:**
```bash
# Should show backend process
ps aux | grep "nest\|node.*backend"
```

**Start backend if not running:**
```bash
cd backend
npm run start:dev
```

**Verify backend is accessible:**
```bash
curl http://localhost:3001/api/v1/health
# Should return: {"status":"ok"}
```

---

## 2. Database Tables Not Created ❌

**Check if team tables exist:**
```bash
# Connect to your database
psql -U your_user -d your_database

# Check for tables
\dt team_invitations
\dt activity_logs
```

**If tables don't exist, run migrations:**
```bash
cd backend
psql -U your_user -d your_database < src/migrations/007-create-team-tables.sql
```

---

## 3. User Missing organizationId ❌

**This is the most common issue!**

The team invitation requires the user to have an `organizationId` in their JWT token.

**Check your JWT token:**
1. Open browser DevTools (F12)
2. Go to Application/Storage → Local Storage
3. Find the JWT token
4. Decode it at https://jwt.io
5. Check if it has `organizationId` field

**If organizationId is missing:**

You need to either:

### Option A: Update existing user
```sql
-- In your database
UPDATE users 
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE id = 'your-user-id';
```

### Option B: Create organization first
```sql
-- Create an organization
INSERT INTO organizations (id, name, slug, tier) 
VALUES (uuid_generate_v4(), 'My Company', 'my-company', 'professional');

-- Link user to organization
UPDATE users 
SET organization_id = (SELECT id FROM organizations WHERE slug = 'my-company')
WHERE email = 'your-email@example.com';
```

---

## 4. Email Service Not Configured ⚠️

**Note:** The backend will create the invitation but won't send an email.

The service has this line:
```typescript
// TODO: Send invitation email
this.logger.log(`Invitation sent to ${dto.email}...`);
```

**To enable email notifications:**
1. Configure email service in `backend/src/modules/email/email.service.ts`
2. Add SMTP settings to `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

---

## 5. CORS Issues ❌

**If you see CORS errors in console:**

**Check backend CORS settings:**
```typescript
// backend/src/main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'http://localhost:3003'],
  credentials: true,
});
```

---

## 6. Authentication Issues ❌

**Check if user is logged in:**
```javascript
// In browser console
console.log(localStorage.getItem('token'));
// Should show a JWT token
```

**If no token, log in again.**

---

## Testing the Fix

After making changes, test the invitation:

### 1. Check Browser Console
Open DevTools (F12) → Console tab before clicking "Send Invitation"

### 2. Fill Invitation Form
- Email: test@example.com
- Role: Member
- Message: (optional)

### 3. Click "Send Invitation"

### 4. Check Response

**Success:**
```
Invitation sent successfully: {id: "...", email: "test@example.com", ...}
Alert: "Invitation sent successfully!"
```

**Error:**
```
Failed to send invitation: [Error message here]
Alert: "Failed to send invitation: [specific error]"
```

---

## Detailed Error Messages

Now the frontend shows specific error messages. Here's what they mean:

### "User with this email already exists in the organization"
→ The email is already a team member

### "Pending invitation already exists for this email"
→ An invitation was already sent to this email

### "organizationId is required"
→ User doesn't have an organization (see Solution 3 above)

### "Cannot read properties of undefined"
→ Backend not running (see Solution 1 above)

### "Network Error"
→ Backend not accessible (check CORS, firewall)

### "401 Unauthorized"
→ JWT token expired or invalid (log in again)

---

## Quick Diagnostic Script

Run this to check everything:

```bash
#!/bin/bash

echo "=== Team Invitation Diagnostic ==="
echo ""

# Check backend
echo "1. Checking backend..."
if curl -s http://localhost:3001/api/v1/health > /dev/null; then
    echo "   ✅ Backend is running"
else
    echo "   ❌ Backend is NOT running"
    echo "   → Run: cd backend && npm run start:dev"
fi

# Check database
echo ""
echo "2. Checking database tables..."
# Add your database check here

# Check frontend
echo ""
echo "3. Checking frontend..."
if curl -s http://localhost:3003 > /dev/null; then
    echo "   ✅ Frontend is running"
else
    echo "   ❌ Frontend is NOT running"
    echo "   → Run: cd frontend && npm run dev"
fi

echo ""
echo "=== End Diagnostic ==="
```

---

## Manual Testing via API

Test the endpoint directly:

```bash
# Get your JWT token from browser localStorage
TOKEN="your-jwt-token-here"

# Send invitation
curl -X POST http://localhost:3001/api/v1/team/invite \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "role": "member",
    "message": "Welcome to the team!"
  }'
```

**Expected response:**
```json
{
  "id": "uuid",
  "organizationId": "uuid",
  "email": "test@example.com",
  "role": "member",
  "status": "pending",
  "expiresAt": "2024-12-XX",
  "createdAt": "2024-12-XX"
}
```

---

## Files Modified

1. **`frontend/src/app/(dashboard)/dashboard/team/page.tsx`**
   - Added better error handling
   - Shows specific error messages
   - Logs responses to console

---

## Next Steps

1. **Run diagnostics** to identify the issue
2. **Apply the appropriate fix** from above
3. **Test the invitation** again
4. **Check browser console** for detailed errors

---

## Still Not Working?

If you've tried all the above and it still doesn't work:

1. **Share the error message** from the browser console
2. **Check backend logs** for errors
3. **Verify database connection**
4. **Check if migrations ran successfully**

---

## Quick Fix Summary

Most likely cause → User missing organizationId

**Quick fix:**
```sql
-- Create org if needed
INSERT INTO organizations (id, name, slug, tier) 
VALUES (uuid_generate_v4(), 'Default Org', 'default', 'professional')
ON CONFLICT DO NOTHING;

-- Link user to org
UPDATE users 
SET organization_id = (SELECT id FROM organizations LIMIT 1)
WHERE organization_id IS NULL;
```

Then **log out and log in again** to get a new JWT token with organizationId.

---

**Status:** Ready for testing
**Date:** December 2024
