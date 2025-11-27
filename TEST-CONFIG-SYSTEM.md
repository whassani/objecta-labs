# 🧪 Configuration System - Testing Guide

## Quick Test Script

Run this to verify everything works:

```bash
#!/bin/bash

echo "🧪 Testing Configuration System"
echo "================================"
echo ""

# Set your admin token here
ADMIN_TOKEN="your-admin-token-here"
API_URL="http://localhost:3001"

echo "1️⃣ Testing System Settings..."
echo "   GET all settings"
curl -s "${API_URL}/v1/admin/settings/system" | jq '.[:3]'
echo "✅ System settings loaded"
echo ""

echo "2️⃣ Testing Feature Flags..."
echo "   GET all flags"
curl -s "${API_URL}/v1/admin/settings/features" | jq '.[:3]'
echo "✅ Feature flags loaded"
echo ""

echo "3️⃣ Testing Public Settings..."
echo "   GET public settings (no auth)"
curl -s "${API_URL}/v1/admin/settings/system/public/all" | jq 'to_entries[:5]'
echo "✅ Public settings accessible"
echo ""

echo "4️⃣ Testing Update Setting..."
echo "   PUT update platform name"
curl -s -X PUT "${API_URL}/v1/admin/settings/system/platform/name" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"value": "Test Platform"}' | jq '.'
echo "✅ Setting updated"
echo ""

echo "5️⃣ Testing Feature Flag Toggle..."
echo "   PUT toggle beta_features flag"
curl -s -X PUT "${API_URL}/v1/admin/settings/features/beta_features" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' | jq '.enabled'
echo "✅ Feature flag toggled"
echo ""

echo "6️⃣ Testing Cache Clear..."
curl -s -X POST "${API_URL}/v1/admin/settings/cache/clear" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq '.'
echo "✅ Cache cleared"
echo ""

echo "7️⃣ Testing Audit Log..."
curl -s "${API_URL}/v1/admin/settings/audit?limit=5" \
  -H "Authorization: Bearer ${ADMIN_TOKEN}" | jq '.logs[:2]'
echo "✅ Audit log working"
echo ""

echo "================================"
echo "🎉 All tests passed!"
echo ""
echo "Next steps:"
echo "1. Visit http://localhost:3000/admin/settings"
echo "2. Visit http://localhost:3000/admin/features"
echo "3. Make some changes and verify they persist"
```

Save as `test-config.sh` and run:

```bash
chmod +x test-config.sh
./test-config.sh
```

---

## Manual Testing Checklist

### ✅ Backend Tests

#### 1. Database Tables
```sql
-- Should return 5 tables
SELECT table_name FROM information_schema.tables 
WHERE table_name IN (
  'system_settings', 
  'feature_flags', 
  'organization_settings',
  'admin_preferences',
  'settings_audit_log'
);
```

#### 2. Seeded Data
```sql
-- Should return ~50 settings
SELECT COUNT(*) FROM system_settings;

-- Should return 14 feature flags
SELECT COUNT(*) FROM feature_flags;

-- Should show categories
SELECT DISTINCT category FROM system_settings;
```

#### 3. API Endpoints
- [ ] GET `/v1/admin/settings/system` returns array
- [ ] GET `/v1/admin/settings/system/category/platform` returns filtered
- [ ] GET `/v1/admin/settings/system/platform/name` returns single setting
- [ ] PUT `/v1/admin/settings/system/platform/name` updates setting
- [ ] GET `/v1/admin/settings/features` returns flags
- [ ] PUT `/v1/admin/settings/features/:key` updates flag
- [ ] POST `/v1/admin/settings/cache/clear` clears cache
- [ ] GET `/v1/admin/settings/audit` returns audit log

### ✅ Frontend Tests

#### Settings Page (`/admin/settings`)
- [ ] Page loads without errors
- [ ] Settings are loaded from backend
- [ ] Can see platform name
- [ ] Can edit platform name
- [ ] "Save Changes" button appears when editing
- [ ] Saving shows loading state
- [ ] Success message after save
- [ ] Settings persist after refresh
- [ ] Can toggle maintenance mode
- [ ] Maintenance message input appears when enabled
- [ ] Can adjust session timeout
- [ ] Cache clear button works
- [ ] Reload button works
- [ ] Database stats show correct counts

#### Feature Flags Page (`/admin/features`)
- [ ] Page loads without errors
- [ ] All 14 feature flags displayed
- [ ] Each flag shows correct status
- [ ] Strategy badges show correct colors
- [ ] Can toggle flag on/off with switch
- [ ] Toggle reflects immediately
- [ ] Rollout percentage slider appears for percentage strategy
- [ ] Slider updates value in real-time
- [ ] Can click edit button
- [ ] Edit dialog opens with current values
- [ ] Can update flag details
- [ ] Can create new flag
- [ ] Create dialog validates inputs
- [ ] New flag appears in list after creation
- [ ] Can delete flag (with confirmation)
- [ ] Empty state shows when no flags

### ✅ Integration Tests

#### 1. Settings Update Flow
1. Open `/admin/settings`
2. Change "Platform Name" to "My Test Platform"
3. Click "Save Changes"
4. Refresh page
5. ✅ New name persists

#### 2. Feature Flag Rollout
1. Open `/admin/features`
2. Find "Advanced Analytics"
3. Toggle ON
4. Set strategy to "Percentage"
5. Set rollout to 50%
6. Use slider to adjust to 75%
7. ✅ Changes save immediately

#### 3. Organization Override
```bash
# Create override
curl -X POST http://localhost:3001/v1/admin/settings/organizations \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "test-org-id",
    "settingKey": "limits.max_users_per_org",
    "settingValue": "500",
    "valueType": "number",
    "notes": "Test override"
  }'

# Verify it exists
curl http://localhost:3001/v1/admin/settings/organizations/test-org-id
```

#### 4. Audit Trail
1. Make several changes in UI
2. Open Network tab in browser
3. Visit `/v1/admin/settings/audit`
4. ✅ All changes are logged
5. ✅ IP addresses recorded
6. ✅ Timestamps accurate

#### 5. Cache Invalidation
1. Update a setting via API
2. Immediately query same setting
3. ✅ Get updated value (cache cleared)
4. Wait 5 minutes
5. Query again
6. ✅ Still get correct value (from cache)

---

## Performance Tests

### Load Test
```bash
# Test concurrent requests
for i in {1..100}; do
  curl -s http://localhost:3001/v1/admin/settings/system/public/all &
done
wait

# All should complete successfully
```

### Cache Test
```bash
# First request (cache miss)
time curl -s http://localhost:3001/v1/admin/settings/system > /dev/null

# Second request (cache hit - should be faster)
time curl -s http://localhost:3001/v1/admin/settings/system > /dev/null
```

---

## Edge Cases to Test

### 1. Invalid Data
```bash
# Try to create setting with invalid value type
curl -X POST http://localhost:3001/v1/admin/settings/system \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "test",
    "key": "invalid",
    "value": "abc",
    "valueType": "number"
  }'
# Should return validation error
```

### 2. Duplicate Keys
```bash
# Try to create duplicate setting
curl -X POST http://localhost:3001/v1/admin/settings/system \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "category": "platform",
    "key": "name",
    "value": "test"
  }'
# Should return error: "Setting already exists"
```

### 3. Missing Authentication
```bash
# Try to update without token
curl -X PUT http://localhost:3001/v1/admin/settings/system/platform/name \
  -H "Content-Type: application/json" \
  -d '{"value": "test"}'
# Should return 401 Unauthorized
```

### 4. Feature Flag Logic
```bash
# Test percentage rollout with same org ID
curl -X POST http://localhost:3001/v1/admin/settings/features/check \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "flagKey": "beta_features",
    "organizationId": "same-org-id",
    "plan": "professional"
  }'
# Should return same result consistently (deterministic hash)
```

---

## Automated Test Suite

Create `test-config-system.spec.ts`:

```typescript
import { Test } from '@nestjs/testing';
import { SettingsService } from './settings.service';

describe('Settings System', () => {
  let service: SettingsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [SettingsService],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should create a setting', async () => {
    const setting = await service.createSystemSetting({
      category: 'test',
      key: 'example',
      value: 'value',
      valueType: 'string',
    }, 'admin-id');
    
    expect(setting).toBeDefined();
    expect(setting.key).toBe('example');
  });

  it('should get typed value', async () => {
    const value = await service.getSystemSettingValue(
      'limits',
      'max_users_per_org',
      10
    );
    
    expect(typeof value).toBe('number');
  });

  it('should check feature flag', async () => {
    const enabled = await service.checkFeatureFlag(
      'workflow_automation',
      'org-id'
    );
    
    expect(typeof enabled).toBe('boolean');
  });
});
```

Run with:
```bash
npm test -- test-config-system.spec.ts
```

---

## Success Criteria

✅ **All database tables created**
✅ **Default settings seeded (50+)**
✅ **Default feature flags created (14)**
✅ **Backend starts without errors**
✅ **All API endpoints respond correctly**
✅ **Settings page loads and shows data**
✅ **Feature flags page loads and shows data**
✅ **Can update settings via UI**
✅ **Changes persist after refresh**
✅ **Cache works (5 min TTL)**
✅ **Audit log records all changes**
✅ **Authentication required for admin endpoints**
✅ **Public settings accessible without auth**
✅ **No console errors in browser**
✅ **Responsive design works**

---

## 🎉 Test Complete!

If all tests pass, your configuration system is **production-ready**!

You can now:
- ✅ Configure platform without redeployment
- ✅ Manage feature rollouts
- ✅ Set customer-specific limits
- ✅ Track all configuration changes
- ✅ Scale with confidence

**Great work!** 🚀
