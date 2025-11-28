# 🏗️ Architecture Update: Multi-Tenant & Cloud-Native

## Summary of Changes

ObjectaLabs architecture has been updated to reflect **multi-tenant SaaS** and **cloud-native** design.

---

## ✅ What's Been Updated

### 1. **New Architecture Document**
📄 **[architecture/multi-tenant-architecture.md](./architecture/multi-tenant-architecture.md)**

**Complete guide covering:**
- ✅ Multi-tenancy model (shared database, row-level security)
- ✅ Tenant identification & isolation
- ✅ Cloud-native Kubernetes deployment
- ✅ Container strategy with Docker
- ✅ Horizontal pod autoscaling
- ✅ Tenant provisioning flow
- ✅ Resource quotas & limits
- ✅ Security & compliance (RLS)
- ✅ Monitoring per tenant
- ✅ Disaster recovery

### 2. **Updated Database Schema**
📄 **[architecture/database-schema.sql](./architecture/database-schema.sql)**

**Key changes:**
- ✅ Added `organizations` table (tenants)
- ✅ All tables now have `organization_id` foreign key
- ✅ Row-Level Security (RLS) policies enabled
- ✅ Tenant isolation at database level
- ✅ Composite indexes for performance
- ✅ Updated sample data with tenant context

### 3. **Updated Admin Platform**
📄 **[product/admin-platform-spec.md](./product/admin-platform-spec.md)**

**New features:**
- ✅ Organization (tenant) management
- ✅ Multi-tenant dashboard metrics
- ✅ Tenant context switcher
- ✅ Per-tenant resource monitoring
- ✅ Tenant impersonation (view as org)
- ✅ Quota enforcement UI

---

## 🏗️ Architecture Overview

### Multi-Tenancy Model

**Approach**: **Shared Database, Shared Schema with Row-Level Security**

```
┌────────────────────────────────────────────────┐
│             Multiple Tenants                    │
├────────────────────────────────────────────────┤
│                                                │
│  🏢 Acme Corp          🏢 XYZ Inc              │
│  (acme.objecta-labs)    (xyz.objecta-labs)         │
│  org_id: uuid-1       org_id: uuid-2           │
│                                                │
│  ┌──────────┐         ┌──────────┐            │
│  │ 3 Users  │         │ 5 Users  │            │
│  │ 7 Agents │         │ 12 Agents│            │
│  └──────────┘         └──────────┘            │
│        │                    │                  │
│        └────────┬───────────┘                  │
│                 ▼                              │
│  ┌───────────────────────────────────────┐    │
│  │     Shared PostgreSQL Database        │    │
│  │                                       │    │
│  │  • Row-Level Security (RLS)           │    │
│  │  • organization_id on every row       │    │
│  │  • Automatic filtering                │    │
│  └───────────────────────────────────────┘    │
└────────────────────────────────────────────────┘
```

### Cloud-Native Deployment

```
AWS/GCP Cloud
├─ Kubernetes Cluster (EKS/GKE)
│  ├─ API Gateway (NGINX Ingress)
│  ├─ Backend Pods (3-50 replicas)
│  │  └─ Horizontal Pod Autoscaler
│  ├─ Worker Pods (Bull Queue)
│  └─ WebSocket Pods
│
├─ Managed Services
│  ├─ PostgreSQL (RDS Multi-AZ)
│  ├─ Redis (ElastiCache)
│  ├─ S3 (Document Storage)
│  └─ CloudWatch/Datadog (Monitoring)
│
└─ Multi-Region (Optional)
   ├─ Primary: us-east-1
   └─ Secondary: us-west-2
```

---

## 🔑 Key Concepts

### 1. Organizations (Tenants)

Every customer is part of an **Organization**:

```typescript
// Organization = Tenant
{
  id: 'uuid',
  slug: 'acme-corp',  // Subdomain
  name: 'Acme Corporation',
  plan: 'professional',
  limits: {
    maxAgents: 10,
    maxMessages: 50000,
    maxUsers: 5,
    maxStorage: 10737418240  // 10GB
  }
}
```

### 2. Tenant Isolation

**Every query automatically filtered:**

```typescript
// Before (incorrect - no tenant isolation)
const agents = await agentRepository.find();

// After (correct - tenant isolated)
const agents = await agentRepository.find({
  where: { organizationId: currentTenant.id }
});
```

### 3. Subdomain-Based Access

**URL Structure:**
- `acme-corp.objecta-labs.com` → Acme Corp's instance
- `xyz-inc.objecta-labs.com` → XYZ Inc's instance
- `app.objecta-labs.com` → Main login/signup
- `admin.objecta-labs.com` → Admin panel

### 4. Resource Quotas

**Per-tenant limits enforced:**

```typescript
if (currentUsage.agents >= organization.limits.maxAgents) {
  throw new ForbiddenException(
    'Agent limit reached. Please upgrade your plan.'
  );
}
```

### 5. Cloud-Native Features

**Automatic scaling:**
- Min 3 pods, max 50 pods
- Scale based on CPU (70%) and memory (80%)
- Auto-healing (Kubernetes restarts failed pods)
- Zero-downtime deployments (rolling updates)

---

## 📊 Database Schema Changes

### New: Organizations Table

```sql
CREATE TABLE organizations (
  id UUID PRIMARY KEY,
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  limits JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Updated: All Tables Have organization_id

```sql
-- Example: Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  -- ... other fields
);

-- Critical index for performance
CREATE INDEX idx_agents_organization_id ON agents(organization_id);
```

### Row-Level Security (RLS)

```sql
-- Automatic tenant filtering
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON agents
  USING (organization_id = current_setting('app.current_tenant')::uuid);
```

---

## 💻 Implementation Examples

### NestJS Tenant Middleware

```typescript
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const user = req.user;
    
    if (user) {
      // Set tenant context
      req['tenantId'] = user.organizationId;
      req['tenant'] = await this.getOrganization(user.organizationId);
    }
    
    next();
  }
}
```

### Tenant-Aware Service

```typescript
@Injectable()
export class AgentsService {
  async findAll(tenantId: string): Promise<Agent[]> {
    // ALWAYS filter by tenant
    return this.agentRepository.find({
      where: { organizationId: tenantId },
    });
  }
  
  async create(tenantId: string, data: CreateAgentDto): Promise<Agent> {
    // Check quota first
    await this.enforceQuota(tenantId, 'agents');
    
    // Create with tenant context
    const agent = this.agentRepository.create({
      ...data,
      organizationId: tenantId,
    });
    
    return this.agentRepository.save(agent);
  }
}
```

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: objecta-labs-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: objecta-labs/api:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: objecta-labs-api-hpa
spec:
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        averageUtilization: 70
```

---

## 🔒 Security Features

### 1. Tenant Isolation
- ✅ Row-level security in database
- ✅ Middleware enforces tenant context
- ✅ Cross-tenant access prevention
- ✅ Audit logging per tenant

### 2. Resource Limits
- ✅ Quota enforcement per tenant
- ✅ Rate limiting per tenant
- ✅ Storage limits per tenant
- ✅ API rate limits per tenant

### 3. Data Privacy
- ✅ Complete data isolation
- ✅ No cross-tenant data leakage
- ✅ Encrypted at rest and in transit
- ✅ Compliant with GDPR/CCPA

---

## 📈 Benefits

### For Business
- 💰 **Cost-Effective**: Shared resources = lower costs
- 📊 **Scalable**: Easy to onboard thousands of tenants
- 🔧 **Maintainable**: Single codebase for all tenants
- 🚀 **Fast**: Quick tenant provisioning (<1 minute)

### For Development
- 🏗️ **Clear Architecture**: Well-defined tenant boundaries
- 🔒 **Secure by Default**: RLS prevents mistakes
- 📊 **Observable**: Metrics per tenant
- 🧪 **Testable**: Easy to test with multiple tenants

### For Operations
- ⚡ **Auto-Scaling**: Handles load automatically
- 🔄 **Self-Healing**: Kubernetes restarts failures
- 📦 **Zero-Downtime**: Rolling updates
- 🌍 **Multi-Region**: Can expand globally

---

## 🎯 What's Different Now?

### Before (Single-Tenant Thinking)
```typescript
// User owns agents directly
user.agents

// No tenant concept
const agents = await findAll();
```

### After (Multi-Tenant)
```typescript
// Organization owns everything
organization.users
organization.agents

// Always tenant-scoped
const agents = await findAll(tenantId);
```

---

## 📋 Migration Checklist

### Database
- [x] Add organizations table
- [x] Add organization_id to all tables
- [x] Create indexes
- [x] Enable RLS
- [ ] Migrate existing data (if any)

### Backend (NestJS)
- [ ] Implement tenant middleware
- [ ] Update all services to be tenant-aware
- [ ] Add quota enforcement guards
- [ ] Implement tenant provisioning
- [ ] Add tenant context to logging
- [ ] Update all queries to filter by tenant

### Frontend
- [ ] Add organization selector
- [ ] Show current tenant context
- [ ] Handle subdomain routing
- [ ] Display quota usage
- [ ] Tenant-specific branding (Phase 2)

### Infrastructure
- [ ] Set up Kubernetes cluster
- [ ] Configure autoscaling
- [ ] Set up monitoring per tenant
- [ ] Configure subdomain routing
- [ ] Set up backups per tenant

### Admin Panel
- [ ] Organization management UI
- [ ] Tenant impersonation
- [ ] Per-tenant metrics
- [ ] Quota management
- [ ] Tenant provisioning flow

---

## 🚀 Next Steps

1. **Review architecture** - Understand multi-tenancy model
2. **Update codebase** - Implement tenant middleware
3. **Test isolation** - Verify no cross-tenant access
4. **Set up K8s** - Deploy cloud-native infrastructure
5. **Build admin panel** - Manage tenants effectively

---

## 📚 Documentation

All details available in:
- **[architecture/multi-tenant-architecture.md](./architecture/multi-tenant-architecture.md)** - Complete guide
- **[architecture/database-schema.sql](./architecture/database-schema.sql)** - Updated schema
- **[product/admin-platform-spec.md](./product/admin-platform-spec.md)** - Admin features

---

**Status**: ✅ Architecture Updated & Ready for Implementation  
**Last Updated**: November 2024  
**Architecture**: Multi-Tenant, Cloud-Native, Production-Ready
