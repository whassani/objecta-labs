# 🚀 Configuration System - Quick Start Guide

## ⚡ 5-Minute Setup

### Step 1: Run the Migration (2 minutes)

```bash
cd backend
chmod +x run-settings-migration.sh
./run-settings-migration.sh
```

**Expected output:**
```
✅ Migration completed successfully!
✅ Default settings seeded!
✅ Default feature flags created!
```

---

### Step 2: Start the Backend (1 minute)

```bash
npm run start:dev
```

**Check it's working:**
```bash
curl http://localhost:3001/v1/admin/settings/system/public/all
```

Should return platform settings as JSON.

---

### Step 3: Access the UI (2 minutes)

Open your browser:
- **Settings Page**: http://localhost:3000/admin/settings
- **Feature Flags Page**: http://localhost:3000/admin/features

---

## 🎯 What You Can Do Now

### 1. Update Platform Settings
1. Go to `/admin/settings`
2. Change "Platform Name" to your company name
3. Click "Save Changes"
4. Refresh - changes persist!

### 2. Toggle Feature Flags
1. Go to `/admin/features`
2. Find "Advanced Analytics"
3. Toggle the switch to enable/disable
4. Changes apply immediately!

### 3. Create New Feature Flag
1. Go to `/admin/features`
2. Click "Create Feature Flag"
3. Enter details:
   - Name: "My New Feature"
   - Key: "my_new_feature"
   - Strategy: "Percentage"
   - Rollout: 50%
4. Click "Create"
5. Use the slider to adjust rollout percentage!

### 4. Set Organization Overrides
```bash
curl -X POST http://localhost:3001/v1/admin/settings/organizations \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "org-uuid-here",
    "settingKey": "limits.max_users_per_org",
    "settingValue": "500",
    "valueType": "number",
    "notes": "Enterprise customer"
  }'
```

---

## 📋 Quick API Tests

### Test 1: Get All Settings
```bash
curl http://localhost:3001/v1/admin/settings/system
```

### Test 2: Get Settings by Category
```bash
curl http://localhost:3001/v1/admin/settings/system/category/platform
```

### Test 3: Update a Setting
```bash
curl -X PUT http://localhost:3001/v1/admin/settings/system/platform/name \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"value": "My Company"}'
```

### Test 4: Check Feature Flag
```bash
curl -X POST http://localhost:3001/v1/admin/settings/features/check \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "flagKey": "advanced_analytics",
    "organizationId": "org-uuid",
    "plan": "professional"
  }'
```

### Test 5: Clear Cache
```bash
curl -X POST http://localhost:3001/v1/admin/settings/cache/clear \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎨 UI Features

### Settings Page Features
- ✅ Platform branding (name, logo, colors)
- ✅ Contact information
- ✅ Default limits
- ✅ Security policies
- ✅ Maintenance mode with message
- ✅ Session timeouts
- ✅ Email/push notifications
- ✅ Real-time save indicator
- ✅ Cache management

### Feature Flags Page Features
- ✅ List all flags with status badges
- ✅ Toggle on/off with switch
- ✅ Rollout percentage slider
- ✅ Strategy indicators (All, Percentage, Plan, Whitelist)
- ✅ Create new flags
- ✅ Edit existing flags
- ✅ Delete flags
- ✅ Plan targeting

---

## 💡 Common Use Cases

### Use Case 1: Enable Maintenance Mode
1. Go to `/admin/settings`
2. Click "Security" tab
3. Toggle "Maintenance Mode" ON
4. Enter message: "We'll be back in 30 minutes"
5. Click "Save Changes"
6. ✅ All users see maintenance page (except admins)

### Use Case 2: Gradual Feature Rollout
1. Go to `/admin/features`
2. Find feature or create new one
3. Set strategy to "Percentage"
4. Start at 10% rollout
5. Monitor metrics
6. Gradually increase to 100%

### Use Case 3: Give Customer Higher Limits
```typescript
// In your code
await settingsService.createOrganizationSetting({
  organizationId: customerOrgId,
  settingKey: 'limits.max_users_per_org',
  settingValue: '1000',
  valueType: 'number',
  notes: 'Enterprise customer - custom limit'
}, adminId);
```

### Use Case 4: Check Feature in Code
```typescript
// In your service
const hasAdvancedAnalytics = await settingsService.checkFeatureFlag(
  'advanced_analytics',
  organizationId,
  organization.plan
);

if (hasAdvancedAnalytics) {
  // Show advanced analytics dashboard
}
```

---

## 🔒 Security Notes

- ✅ All endpoints require admin authentication
- ✅ Audit log tracks all changes
- ✅ IP addresses logged
- ✅ Sensitive settings (passwords) are masked
- ✅ Settings cached for 5 minutes
- ✅ Manual cache clear available

---

## 📊 What Gets Seeded

### Settings (50+)
- Platform branding (6 settings)
- Contact info (5 settings)
- Default limits (7 settings)
- Security policies (12 settings)
- Billing settings (6 settings)
- Maintenance mode (5 settings)
- API settings (5 settings)
- Analytics (4 settings)
- Email config (8 settings)
- Notifications (5 settings)

### Feature Flags (14)
- Workflow Automation ✅ Enabled
- Fine Tuning ✅ Enabled
- Knowledge Base ✅ Enabled
- Advanced Analytics ❌ Disabled (Pro/Enterprise)
- White Label ❌ Disabled (Enterprise)
- SSO ❌ Disabled (Enterprise)
- API Access ✅ Enabled
- Custom Domains ❌ Disabled (Pro/Enterprise)
- Priority Support ❌ Disabled (Pro/Enterprise)
- Beta Features ❌ Disabled (Whitelist)
- Team Collaboration ✅ Enabled
- Webhooks ✅ Enabled
- Data Export ✅ Enabled
- Advanced Security ❌ Disabled (Enterprise)

---

## ✅ Verification Checklist

After setup, verify:

```bash
# 1. Check database tables exist
psql -U postgres -d objecta-labs -c "\dt system_settings"

# 2. Check settings count
psql -U postgres -d objecta-labs -c "SELECT COUNT(*) FROM system_settings;"
# Should return ~50+

# 3. Check feature flags count
psql -U postgres -d objecta-labs -c "SELECT COUNT(*) FROM feature_flags;"
# Should return 14

# 4. Test API endpoint
curl http://localhost:3001/v1/admin/settings/system/public/all

# 5. Test frontend
# Open http://localhost:3000/admin/settings in browser
```

---

## 🐛 Troubleshooting

### Migration fails?
```bash
# Check database connection
psql -U postgres -d objecta-labs -c "SELECT 1;"

# Check if tables already exist
psql -U postgres -d objecta-labs -c "\dt"

# Drop and recreate (CAUTION: loses data)
psql -U postgres -d objecta-labs -c "DROP TABLE IF EXISTS system_settings CASCADE;"
./run-settings-migration.sh
```

### Backend won't start?
```bash
# Check for TypeScript errors
npm run build

# Check entity imports
grep -r "SystemSetting" backend/src/modules/admin/
```

### Frontend not loading settings?
```bash
# Check API is responding
curl http://localhost:3001/v1/admin/settings/system

# Check browser console for errors
# Check CORS configuration
# Verify admin token is valid
```

### Cache not updating?
```bash
# Clear cache manually
curl -X POST http://localhost:3001/v1/admin/settings/cache/clear \
  -H "Authorization: Bearer YOUR_TOKEN"

# Or restart backend
npm run start:dev
```

---

## 🎓 Learn More

- **Full Documentation**: `CONFIG-SYSTEM-COMPLETE.md`
- **API Reference**: `CONFIG-SYSTEM-COMPLETE.md#api-endpoints-reference`
- **Usage Examples**: `CONFIG-SYSTEM-COMPLETE.md#usage-examples`
- **Architecture**: `ADMIN-CONFIG-MANAGEMENT-ANALYSIS.md`

---

## 🎉 You're Done!

In just 5 minutes, you now have:
- ✅ Dynamic platform configuration
- ✅ Feature flag management
- ✅ Organization overrides
- ✅ Complete audit trail
- ✅ Performance caching
- ✅ Beautiful admin UI

**No more hardcoded configs!**
**No more redeployments!**

Start configuring your platform! 🚀
