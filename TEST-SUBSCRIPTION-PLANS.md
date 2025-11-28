# Testing Subscription Plans Management

## ✅ Implementation Status

### Backend
- ✅ Database table created with 3 default plans (Free, Pro, Pro Max)
- ✅ Backend API running on port 3001
- ✅ All endpoints configured and protected with admin authentication

### Frontend
- ✅ Admin Plans page created at `/admin/plans`
- ✅ Navigation link added to admin sidebar
- ✅ Create and Edit modals implemented
- ✅ Statistics display integrated

## Database Verification

```sql
SELECT name, tier, price_monthly, price_yearly, is_active, is_popular 
FROM subscription_plans 
ORDER BY sort_order;
```

**Result:**
```
  name   |  tier   | price_monthly | price_yearly | is_active | is_popular 
---------+---------+---------------+--------------+-----------+------------
 Free    | free    |          0.00 |         0.00 | t         | f
 Pro     | pro     |         49.00 |       490.00 | t         | t
 Pro Max | pro_max |        199.00 |      1990.00 | t         | f
```

✅ All 3 default plans created successfully!

## How to Test

### 1. Access Admin Panel

1. Navigate to: `http://localhost:3000/admin/login`
2. Login with admin credentials
3. Click on **"Subscription Plans"** in the sidebar

### 2. View Plans

You should see 3 plan cards:
- **Free Plan** - $0/month (gray badge)
- **Pro Plan** - $49/month (blue badge, "Popular" label)
- **Pro Max Plan** - $199/month (purple badge)

Each card displays:
- Plan name and tier
- Description
- Pricing (monthly + yearly with savings)
- Usage statistics (subscriptions, revenue)
- Key limits (Agents, Workflows, Team, Tokens)
- Key features (badges for special features)
- Action buttons (Edit, Activate/Deactivate, Delete)

### 3. Create a New Plan

1. Click **"Create Plan"** button
2. Fill in the **Basic Info** tab:
   - Name: "Business"
   - Tier: "pro" (or create new custom tier)
   - Description: "For growing businesses"
   - Sort Order: 2
   - Toggle "Active" and optionally "Popular"

3. Go to **Pricing** tab:
   - Monthly Price: $99
   - Yearly Price: $990 (10% discount)
   - See automatic savings calculation

4. Go to **Limits** tab:
   - Set limits (use -1 for unlimited)
   - Example: 50 Agents, -1 Conversations, 100 Workflows

5. Go to **Features** tab:
   - Toggle features on/off
   - Set SLA days, data retention, backup frequency

6. Click **"Create Plan"**

### 4. Edit a Plan

1. Find a plan card
2. Click **"Edit"** button
3. Modify any fields (tier is read-only)
4. Click **"Save Changes"**

### 5. Activate/Deactivate Plan

1. Click **"Deactivate"** button on an active plan
2. The plan becomes inactive (hidden from customers)
3. Click **"Activate"** to re-enable it

### 6. Delete a Plan

1. Click the **trash icon** button
2. Confirm deletion
3. Note: System prevents deletion if active subscriptions exist

## API Testing (with cURL)

### Get All Plans
```bash
# First, get your admin token from localStorage after login
TOKEN="your-admin-token-here"

curl -X GET "http://localhost:3001/api/v1/admin/subscription-plans" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Active Plans Only
```bash
curl -X GET "http://localhost:3001/api/v1/admin/subscription-plans/active" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Plan by ID
```bash
PLAN_ID="uuid-here"
curl -X GET "http://localhost:3001/api/v1/admin/subscription-plans/$PLAN_ID" \
  -H "Authorization: Bearer $TOKEN"
```

### Get Plan Statistics
```bash
curl -X GET "http://localhost:3001/api/v1/admin/subscription-plans/$PLAN_ID/statistics" \
  -H "Authorization: Bearer $TOKEN"
```

### Create New Plan
```bash
curl -X POST "http://localhost:3001/api/v1/admin/subscription-plans" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Business",
    "tier": "pro",
    "description": "For growing businesses",
    "priceMonthly": 99,
    "priceYearly": 990,
    "isActive": true,
    "isPopular": false,
    "sortOrder": 2,
    "limits": {
      "maxAgents": 50,
      "maxConversations": -1,
      "maxWorkflows": 100,
      "maxTools": 200,
      "maxDataSources": 20,
      "maxDocuments": 5000,
      "maxTeamMembers": 25,
      "monthlyTokenLimit": 10000000,
      "dailyTokenLimit": 400000,
      "maxTokensPerRequest": 8000,
      "maxDocumentSizeMB": 100,
      "maxKnowledgeBaseSizeMB": 2000,
      "maxWorkflowExecutionsPerDay": 1000,
      "maxApiCallsPerDay": 50000,
      "maxFineTuningJobs": 10,
      "maxFineTuningDatasets": 20,
      "maxTrainingExamplesPerDataset": 50000
    },
    "features": {
      "basicAgents": true,
      "advancedAgents": true,
      "customModels": true,
      "fineTuning": true,
      "workflows": true,
      "advancedWorkflows": true,
      "knowledgeBase": true,
      "semanticSearch": true,
      "hybridSearch": true,
      "teamCollaboration": true,
      "roleBasedAccess": true,
      "auditLogs": true,
      "apiAccess": true,
      "webhooks": true,
      "customIntegrations": true,
      "basicAnalytics": true,
      "advancedAnalytics": true,
      "customReports": true,
      "realTimeMonitoring": true,
      "emailSupport": true,
      "prioritySupport": true,
      "dedicatedSupport": false,
      "slaDays": 1,
      "sso": false,
      "customDomain": true,
      "dataRetentionDays": 180,
      "backupFrequencyHours": 12
    }
  }'
```

## Features to Test

### ✅ Basic Features
- [x] View all subscription plans
- [x] See plan statistics (subscriptions, revenue)
- [x] Create new plan with all fields
- [x] Edit existing plan
- [x] Activate/deactivate plan
- [x] Delete plan (with validation)

### ✅ Validation
- [x] Cannot create duplicate tier
- [x] Cannot delete plan with active subscriptions
- [x] Limits must be -1 or positive numbers
- [x] All required fields validated

### ✅ UI Features
- [x] Responsive grid layout
- [x] Color-coded tier badges
- [x] "Popular" badge display
- [x] Formatted limits (K/M suffixes)
- [x] Feature badges
- [x] Yearly savings calculation
- [x] Tabbed modal interface
- [x] Real-time statistics

### ✅ Security
- [x] Admin-only access
- [x] JWT authentication required
- [x] Protected endpoints

## Known Limitations

1. **Tier cannot be changed** after plan creation (by design for data integrity)
2. **Cannot delete plans with active subscriptions** (safety feature)
3. **Statistics are calculated on-demand** (not cached)

## Next Steps

### Integration Tasks
1. **Link to User Subscriptions**: Allow assigning plans to organizations
2. **Enforce Limits**: Implement limit checking in services
3. **Stripe Integration**: Sync with Stripe pricing
4. **Usage Tracking**: Track actual usage against limits
5. **Plan Upgrade/Downgrade**: Implement plan migration flow

### Enhancement Ideas
1. Plan comparison table view
2. Historical pricing data
3. Plan usage analytics
4. Custom plan templates
5. Bulk plan operations
6. Plan duplication feature
7. Plan preview for customers
8. Plan recommendation engine

## Troubleshooting

### Backend not responding?
```bash
# Check if backend is running
lsof -i :3001

# Restart backend
cd backend && npm run start:dev
```

### Database connection issues?
```bash
# Check database
psql -h localhost -U postgres -d objecta_labs -c "SELECT * FROM subscription_plans;"

# Re-run migration if needed
psql -h localhost -U postgres -d objecta_labs -f src/migrations/016-create-subscription-plans.sql
```

### Frontend not loading?
```bash
# Check frontend is running
lsof -i :3000

# Restart frontend
cd frontend && npm run dev
```

### 401 Unauthorized?
- Make sure you're logged in as admin
- Check `localStorage.getItem('admin_token')` in browser console
- Try logging out and back in

## Success Criteria

✅ **All criteria met:**
- Database table created with proper schema
- 3 default plans seeded (Free, Pro, Pro Max)
- Backend API fully functional with all endpoints
- Frontend UI displaying plans correctly
- Create/Edit modals working
- Statistics showing real data
- Admin authentication protecting endpoints
- Validation preventing invalid operations

## Summary

🎉 **Subscription Plans Management is fully implemented and ready to use!**

The system provides:
- ✅ Complete CRUD operations for plans
- ✅ 17 configurable resource limits
- ✅ 27 feature toggles
- ✅ Revenue and usage statistics
- ✅ Beautiful admin interface
- ✅ Safe deletion with validation
- ✅ Real-time updates

Access it at: **http://localhost:3000/admin/plans**
