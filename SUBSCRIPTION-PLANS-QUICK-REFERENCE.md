# 📋 Subscription Plans - Quick Reference Card

## 🚀 Quick Start

### Access the Admin Panel
```
URL: http://localhost:3000/admin/plans
Auth: Admin credentials required
```

### Default Plans Available
- **Free**: $0/month - 2 agents, 100K tokens
- **Pro**: $49/month - 20 agents, 5M tokens ⭐ Popular
- **Pro Max**: $199/month - Unlimited everything

---

## 🔌 API Endpoints

**Base URL**: `http://localhost:3001/api/v1/admin/subscription-plans`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Get all plans |
| GET | `/active` | Get active plans |
| GET | `/:id` | Get single plan |
| GET | `/tier/:tier` | Get by tier |
| GET | `/:id/statistics` | Get usage stats |
| POST | `/` | Create plan |
| PUT | `/:id` | Update plan |
| DELETE | `/:id` | Delete plan |
| POST | `/:id/activate` | Activate plan |
| POST | `/:id/deactivate` | Deactivate plan |

**Auth**: Bearer token required (admin_token)

---

## 📊 Plan Configuration

### 17 Limits Available
```typescript
{
  maxAgents: number,              // -1 = unlimited
  maxConversations: number,
  maxWorkflows: number,
  maxTools: number,
  maxDataSources: number,
  maxDocuments: number,
  maxTeamMembers: number,
  monthlyTokenLimit: number,
  dailyTokenLimit: number,
  maxTokensPerRequest: number,
  maxDocumentSizeMB: number,
  maxKnowledgeBaseSizeMB: number,
  maxWorkflowExecutionsPerDay: number,
  maxApiCallsPerDay: number,
  maxFineTuningJobs: number,
  maxFineTuningDatasets: number,
  maxTrainingExamplesPerDataset: number
}
```

### 27 Features Available
- Agent Features (4): Basic/Advanced agents, Custom models, Fine-tuning
- Workflows (2): Basic/Advanced
- Knowledge Base (3): KB, Semantic search, Hybrid search
- Collaboration (3): Team, RBAC, Audit logs
- Integrations (3): API, Webhooks, Custom
- Analytics (4): Basic/Advanced, Reports, Monitoring
- Support (4): Email/Priority/Dedicated, SLA days
- Security (4): SSO, Custom domain, Retention days, Backup hours

---

## 💻 Code Examples

### Using the Hook
```typescript
import { usePlans } from '@/components/admin/plans';

function MyComponent() {
  const { plans, loading, error, refetch, togglePlanStatus, deletePlan } = usePlans();
  
  if (loading) return <PlansLoading />;
  if (error) return <PlansError error={error} onRetry={refetch} />;
  
  return <PlansGrid plans={plans} ... />;
}
```

### Using Individual Components
```typescript
import { PlanCard, PlansGrid, PlansHeader } from '@/components/admin/plans';

<PlansHeader onCreatePlan={() => setShowModal(true)} />
<PlansGrid 
  plans={plans}
  statistics={stats}
  onEdit={setEditingPlan}
  onToggleStatus={toggleStatus}
  onDelete={deletePlan}
/>
```

### API Call Example
```typescript
const response = await fetch('http://localhost:3001/api/v1/admin/subscription-plans', {
  headers: {
    'Authorization': `Bearer ${adminToken}`,
  }
});
const plans = await response.json();
```

---

## 🗂️ File Locations

### Backend
```
backend/src/
├── migrations/016-create-subscription-plans.sql
├── modules/admin/
│   ├── subscription-plans.controller.ts
│   ├── dto/subscription-plan.dto.ts
│   └── services/subscription-plans.service.ts
└── modules/billing/entities/subscription-plan.entity.ts
```

### Frontend
```
frontend/src/
├── app/(admin)/admin/plans/page.tsx
└── components/admin/
    ├── CreatePlanModal.tsx
    ├── EditPlanModal.tsx
    └── plans/
        ├── usePlans.ts
        ├── PlanCard.tsx
        ├── PlansGrid.tsx
        ├── PlansHeader.tsx
        ├── PlansLoading.tsx
        └── PlansError.tsx
```

---

## 🔧 Common Tasks

### Create a New Plan
```bash
curl -X POST http://localhost:3001/api/v1/admin/subscription-plans \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Starter",
    "tier": "pro",
    "description": "For small teams",
    "priceMonthly": 29,
    "priceYearly": 290,
    "limits": { ... },
    "features": { ... }
  }'
```

### Get Plan Statistics
```bash
curl http://localhost:3001/api/v1/admin/subscription-plans/:id/statistics \
  -H "Authorization: Bearer $TOKEN"
```

### Activate/Deactivate Plan
```bash
# Activate
curl -X POST http://localhost:3001/api/v1/admin/subscription-plans/:id/activate \
  -H "Authorization: Bearer $TOKEN"

# Deactivate
curl -X POST http://localhost:3001/api/v1/admin/subscription-plans/:id/deactivate \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🗄️ Database Commands

### View All Plans
```sql
SELECT name, tier, price_monthly, is_active 
FROM subscription_plans 
ORDER BY sort_order;
```

### Update Plan Pricing
```sql
UPDATE subscription_plans 
SET price_monthly = 59, price_yearly = 590 
WHERE tier = 'pro';
```

### Check Active Subscriptions
```sql
SELECT sp.name, COUNT(s.id) as subscription_count
FROM subscription_plans sp
LEFT JOIN subscriptions s ON s.plan = sp.tier
GROUP BY sp.id, sp.name;
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check TypeORM synchronize is disabled
grep "synchronize" backend/src/app.module.ts
# Should show: synchronize: false

# Check port 3001 is free
lsof -i :3001
```

### Frontend Shows 404
```bash
# Verify backend is running on 3001
curl http://localhost:3001/api/health

# Check API_URL environment variable
cat frontend/.env.local | grep API_URL
```

### Plans Not Loading
```bash
# Check database has plans
psql -d objecta_labs -c "SELECT COUNT(*) FROM subscription_plans;"

# Verify admin token
# In browser console:
localStorage.getItem('admin_token')
```

### Create Plan Fails
```bash
# Check backend logs
tail -f /tmp/nest.log

# Verify all required fields
# Required: name, tier, priceMonthly, priceYearly, limits, features
```

---

## 📈 Statistics

### Default Plan Limits

| Feature | Free | Pro | Pro Max |
|---------|------|-----|---------|
| Agents | 2 | 20 | ∞ |
| Conversations | 50 | ∞ | ∞ |
| Workflows | 2 | 50 | ∞ |
| Monthly Tokens | 100K | 5M | ∞ |
| Team Members | 1 | 10 | ∞ |
| Fine-tuning | ❌ | ✅ | ✅ |
| Priority Support | ❌ | ✅ | ✅ |
| SLA | 7 days | 2 days | 1 day |

---

## 🎯 Best Practices

### When Creating Plans
1. ✅ Use meaningful names (Free, Pro, Enterprise)
2. ✅ Set realistic limits
3. ✅ Use -1 for unlimited (not 999999)
4. ✅ Price yearly with 10-20% discount
5. ✅ Mark most popular plan with `isPopular: true`
6. ✅ Set appropriate sort order

### When Editing Plans
1. ⚠️ Cannot change tier after creation
2. ⚠️ Changing limits affects existing users
3. ⚠️ Price changes don't affect active subscriptions
4. ✅ Can activate/deactivate anytime
5. ✅ Test before activating

### When Deleting Plans
1. ❌ Cannot delete if active subscriptions exist
2. ✅ Deactivate first, then delete later
3. ✅ Migrate users to new plan first
4. ✅ Keep historical data

---

## 🔐 Security Notes

- All endpoints require admin authentication
- Use AdminGuard to protect routes
- Validate all inputs with DTOs
- Log all plan changes for audit
- Never expose sensitive data in API

---

## 📞 Quick Links

- **Admin Panel**: http://localhost:3000/admin/plans
- **API Docs**: (Swagger coming soon)
- **Database**: `objecta_labs` on localhost:5432
- **Logs**: `/tmp/nest.log`

---

## 🎓 Component Reference

### usePlans Hook
```typescript
const {
  plans,           // SubscriptionPlan[]
  loading,         // boolean
  error,           // string | null
  statistics,      // Record<string, PlanStatistics>
  refetch,         // () => Promise<void>
  togglePlanStatus, // (id, isActive) => Promise<boolean>
  deletePlan       // (id) => Promise<boolean>
} = usePlans();
```

### PlanCard Props
```typescript
{
  plan: SubscriptionPlan;
  statistics?: PlanStatistics;
  onEdit: (plan: any) => void;
  onToggleStatus: (id: string, isActive: boolean) => void;
  onDelete: (id: string) => void;
}
```

---

**Quick Reference Version**: 1.0  
**Last Updated**: Current Session  
**Status**: ✅ Production Ready

For detailed documentation, see:
- `SUBSCRIPTION-PLANS-IMPLEMENTATION.md`
- `SUBSCRIPTION-PLANS-FINAL-SUMMARY.md`
