# AgentForge Multi-Tenant Cloud-Native Architecture

## Overview

AgentForge is built as a **multi-tenant SaaS platform** with **cloud-native** architecture principles for scalability, isolation, and cost-efficiency.

---

## 1. Multi-Tenancy Model

### Tenancy Strategy: **Shared Database, Shared Schema**

**Why this approach?**
- ✅ Cost-efficient for SaaS
- ✅ Easy to scale horizontally
- ✅ Simpler maintenance
- ✅ Good for B2B SaaS with many small-medium customers
- ✅ Can migrate to dedicated later for enterprise

### Tenant Identification

**Every resource is tied to an Organization (Tenant)**:

```typescript
// Organization entity (Tenant)
@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string; // tenant_id

  @Column({ unique: true })
  slug: string; // acme-corp (for subdomain)

  @Column()
  name: string; // Acme Corporation

  @Column({ type: 'enum', enum: ['free', 'starter', 'pro', 'business', 'enterprise'] })
  plan: string;

  @Column({ type: 'jsonb', default: {} })
  settings: object; // Tenant-specific settings

  @Column({ type: 'jsonb', default: {} })
  limits: {
    maxAgents: number;
    maxMessages: number;
    maxUsers: number;
    maxStorage: number;
  };

  @OneToMany(() => User, user => user.organization)
  users: User[];

  @OneToMany(() => Agent, agent => agent.organization)
  agents: Agent[];

  @CreateDateColumn()
  createdAt: Date;
}

// User entity (belongs to Organization)
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string; // Foreign key to tenant

  @ManyToOne(() => Organization, org => org.users)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  email: string;

  @Column()
  role: string; // admin, editor, viewer within org

  // ... other fields
}

// Agent entity (belongs to Organization)
@Entity('agents')
export class Agent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  organizationId: string; // Tenant isolation

  @ManyToOne(() => Organization, org => org.agents)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @Column()
  name: string;

  // ... other fields
}
```

### Data Isolation

**Row-Level Security (RLS)**:
Every query automatically filtered by `organizationId`:

```typescript
// Tenant Context Interceptor
@Injectable()
export class TenantInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // Inject tenant context
    request.tenantId = user.organizationId;
    
    return next.handle();
  }
}

// Tenant-Aware Repository
@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
  ) {}

  async findAll(tenantId: string): Promise<Agent[]> {
    // ALWAYS filter by tenantId
    return this.agentRepository.find({
      where: { organizationId: tenantId },
    });
  }

  async findOne(id: string, tenantId: string): Promise<Agent> {
    // ALWAYS include tenant check
    const agent = await this.agentRepository.findOne({
      where: { 
        id,
        organizationId: tenantId, // Security: prevent cross-tenant access
      },
    });
    
    if (!agent) {
      throw new NotFoundException('Agent not found');
    }
    
    return agent;
  }
}
```

### Tenant Context Middleware

```typescript
// Global tenant context
@Injectable()
export class TenantContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const user = req.user; // From JWT
    
    if (user) {
      // Set tenant context for the entire request
      req['tenantId'] = user.organizationId;
      
      // Also set in async context (for logging, etc.)
      AsyncLocalStorage.run({ tenantId: user.organizationId }, () => {
        next();
      });
    } else {
      next();
    }
  }
}
```

---

## 2. Multi-Tenancy Options by Tier

### Free & Starter Tiers
- **Model**: Shared everything
- **Isolation**: Row-level (organizationId)
- **Resources**: Shared pool
- **Cost**: Lowest

### Professional & Business Tiers
- **Model**: Shared database, isolated compute
- **Isolation**: Row-level + dedicated workers
- **Resources**: Dedicated Bull queues per tenant
- **Cost**: Medium

### Enterprise Tier
- **Model**: Dedicated database per tenant (optional)
- **Isolation**: Complete separation
- **Resources**: Dedicated infrastructure
- **Cost**: Highest

---

## 3. Cloud-Native Architecture

### Kubernetes-Based Deployment

```yaml
# Deployment architecture
┌─────────────────────────────────────────────────────┐
│                   AWS/GCP Cloud                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │         Kubernetes Cluster (EKS/GKE)        │   │
│  │                                             │   │
│  │  ┌───────────┐  ┌───────────┐  ┌─────────┐│   │
│  │  │ Ingress   │  │   API     │  │ Workers ││   │
│  │  │ (NGINX)   │→ │ Gateway   │→ │ (Pods)  ││   │
│  │  └───────────┘  └───────────┘  └─────────┘│   │
│  │                                             │   │
│  │  ┌───────────────────────────────────────┐ │   │
│  │  │        Microservices                  │ │   │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐    │ │   │
│  │  │  │Auth │ │Agent│ │Docs │ │Bill │    │ │   │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘    │ │   │
│  │  └───────────────────────────────────────┘ │   │
│  │                                             │   │
│  │  ┌─────────────────────────────────────┐  │   │
│  │  │   Horizontal Pod Autoscaler (HPA)   │  │   │
│  │  │   Min: 3 pods | Max: 50 pods        │  │   │
│  │  └─────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────┘   │
│                                                      │
│  ┌─────────────────────────────────────────────┐   │
│  │         Managed Services                     │   │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │   │
│  │  │PostgreSQL│ │  Redis   │ │ S3/Storage  │ │   │
│  │  │   RDS    │ │ Elasticache│ │            │ │   │
│  │  └──────────┘ └──────────┘ └─────────────┘ │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### Container Strategy

**Dockerfile (Multi-stage build)**:
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

# Security: Run as non-root
USER node

EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node healthcheck.js

CMD ["node", "dist/main.js"]
```

### Kubernetes Manifests

**Deployment**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentforge-api
  namespace: agentforge
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agentforge-api
  template:
    metadata:
      labels:
        app: agentforge-api
    spec:
      containers:
      - name: api
        image: agentforge/api:latest
        ports:
        - containerPort: 4000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-credentials
              key: url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 4000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 4000
          initialDelaySeconds: 5
          periodSeconds: 5
```

**Horizontal Pod Autoscaler**:
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agentforge-api-hpa
  namespace: agentforge
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agentforge-api
  minReplicas: 3
  maxReplicas: 50
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 10
        periodSeconds: 60
```

**Service**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: agentforge-api
  namespace: agentforge
spec:
  selector:
    app: agentforge-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 4000
  type: ClusterIP
```

**Ingress**:
```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: agentforge-ingress
  namespace: agentforge
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-prod"
    nginx.ingress.kubernetes.io/rate-limit: "100"
spec:
  ingressClassName: nginx
  tls:
  - hosts:
    - api.agentforge.com
    - "*.agentforge.com"
    secretName: agentforge-tls
  rules:
  - host: api.agentforge.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: agentforge-api
            port:
              number: 80
```

---

## 4. Multi-Tenant Database Design

### Schema with Tenant Isolation

```sql
-- Organizations table (Tenants)
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  plan VARCHAR(50) NOT NULL,
  settings JSONB DEFAULT '{}',
  limits JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index on slug for subdomain lookup
CREATE INDEX idx_organizations_slug ON organizations(slug);

-- Users table (with tenant FK)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(organization_id, email) -- Email unique per tenant
);

-- Composite index for tenant-based queries
CREATE INDEX idx_users_org_id ON users(organization_id);

-- Agents table (with tenant FK)
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  system_prompt TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- CRITICAL: Index on organization_id for all tenant tables
CREATE INDEX idx_agents_org_id ON agents(organization_id);

-- Conversations table (with tenant FK)
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_conversations_org_id ON conversations(organization_id);
CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);

-- Messages table (with tenant FK for isolation)
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_messages_org_id ON messages(organization_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);

-- Row-Level Security (PostgreSQL feature)
-- Enable RLS on all tenant tables
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policy to enforce tenant isolation
CREATE POLICY tenant_isolation_policy ON agents
  USING (organization_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_policy ON conversations
  USING (organization_id = current_setting('app.current_tenant')::uuid);

CREATE POLICY tenant_isolation_policy ON messages
  USING (organization_id = current_setting('app.current_tenant')::uuid);
```

### Connection Pooling Strategy

```typescript
// Tenant-aware connection pooling
@Injectable()
export class TenantAwareDataSource {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = new DataSource({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      extra: {
        max: 100, // Connection pool size
        min: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
    });
  }

  // Set tenant context for query
  async executeWithTenant<T>(
    tenantId: string,
    operation: (queryRunner: QueryRunner) => Promise<T>,
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    
    try {
      await queryRunner.connect();
      
      // Set tenant context using PostgreSQL session variable
      await queryRunner.query(
        `SET app.current_tenant = '${tenantId}'`
      );
      
      const result = await operation(queryRunner);
      
      return result;
    } finally {
      await queryRunner.release();
    }
  }
}
```

---

## 5. Tenant Provisioning

### Auto-Provisioning Flow

```typescript
@Injectable()
export class TenantProvisioningService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    private emailService: EmailService,
  ) {}

  async provisionNewTenant(
    companyName: string,
    ownerEmail: string,
    plan: string = 'free',
  ): Promise<Organization> {
    // 1. Create organization (tenant)
    const slug = this.generateSlug(companyName);
    
    const organization = this.orgRepository.create({
      name: companyName,
      slug,
      plan,
      settings: this.getDefaultSettings(plan),
      limits: this.getLimitsForPlan(plan),
    });
    
    await this.orgRepository.save(organization);
    
    // 2. Create owner user
    const owner = await this.createOwnerUser(
      organization.id,
      ownerEmail,
    );
    
    // 3. Set up default resources
    await this.createDefaultResources(organization.id);
    
    // 4. Send welcome email
    await this.emailService.sendWelcome(ownerEmail, {
      organizationName: companyName,
      subdomain: slug,
    });
    
    // 5. Trigger analytics event
    await this.analyticsService.track('tenant_provisioned', {
      organizationId: organization.id,
      plan,
    });
    
    return organization;
  }

  private async createDefaultResources(orgId: string) {
    // Create sample agent, templates, etc.
    // Tenant-specific initialization
  }

  private getLimitsForPlan(plan: string) {
    const limits = {
      free: {
        maxAgents: 1,
        maxMessages: 1000,
        maxUsers: 1,
        maxStorage: 100 * 1024 * 1024, // 100MB
      },
      starter: {
        maxAgents: 3,
        maxMessages: 10000,
        maxUsers: 1,
        maxStorage: 1024 * 1024 * 1024, // 1GB
      },
      professional: {
        maxAgents: 10,
        maxMessages: 50000,
        maxUsers: 5,
        maxStorage: 10 * 1024 * 1024 * 1024, // 10GB
      },
      // ... other plans
    };
    
    return limits[plan];
  }
}
```

---

## 6. Tenant-Aware URL Structure

### Subdomain-Based Multi-Tenancy

**URL Pattern**:
- `acme.agentforge.com` - Acme Corp's instance
- `xyz.agentforge.com` - XYZ Inc's instance
- `app.agentforge.com` - Main login page

**DNS Configuration**:
```
*.agentforge.com → Load Balancer (Ingress)
```

**Tenant Resolution**:
```typescript
@Injectable()
export class TenantResolutionMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // Extract subdomain from hostname
    const hostname = req.hostname; // acme.agentforge.com
    const subdomain = hostname.split('.')[0];
    
    if (subdomain && subdomain !== 'app' && subdomain !== 'api') {
      // Resolve tenant by subdomain
      const organization = await this.orgRepository.findOne({
        where: { slug: subdomain },
      });
      
      if (!organization) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      
      // Attach tenant to request
      req['tenant'] = organization;
      req['tenantId'] = organization.id;
    }
    
    next();
  }
}
```

---

## 7. Resource Isolation & Limits

### Tenant Quota Enforcement

```typescript
@Injectable()
export class TenantQuotaGuard implements CanActivate {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>,
    private usageService: UsageTrackingService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;
    
    // Get tenant limits
    const org = await this.orgRepository.findOne({
      where: { id: tenantId },
    });
    
    // Check current usage
    const usage = await this.usageService.getCurrentUsage(tenantId);
    
    // Check quota based on endpoint
    const endpoint = request.route.path;
    
    if (endpoint.includes('/agents') && request.method === 'POST') {
      if (usage.agentCount >= org.limits.maxAgents) {
        throw new ForbiddenException(
          `Agent limit reached (${org.limits.maxAgents}). Please upgrade your plan.`
        );
      }
    }
    
    if (endpoint.includes('/chat')) {
      if (usage.messagesThisMonth >= org.limits.maxMessages) {
        throw new ForbiddenException(
          `Message limit reached. Please upgrade your plan.`
        );
      }
    }
    
    return true;
  }
}
```

### Rate Limiting Per Tenant

```typescript
// Tenant-specific rate limiting
@Injectable()
export class TenantRateLimiter {
  constructor(private redis: Redis) {}

  async checkRateLimit(
    tenantId: string,
    action: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const key = `ratelimit:${tenantId}:${action}`;
    const current = await this.redis.incr(key);
    
    if (current === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    
    return current <= limit;
  }
}

// Usage in controller
@Post('/agents/:id/chat')
@UseGuards(TenantRateLimiter)
async chat(
  @Param('id') agentId: string,
  @Body() message: ChatMessageDto,
  @Req() req,
) {
  const tenantId = req.tenantId;
  const limits = this.getLimitsForTenant(tenantId);
  
  const allowed = await this.rateLimiter.checkRateLimit(
    tenantId,
    'chat',
    limits.requestsPerMinute,
    60,
  );
  
  if (!allowed) {
    throw new TooManyRequestsException('Rate limit exceeded');
  }
  
  // Process chat...
}
```

---

## 8. Cloud-Native Features

### Service Mesh (Istio - Optional)

```yaml
apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: agentforge-api
spec:
  hosts:
  - api.agentforge.com
  http:
  - match:
    - headers:
        x-tenant-id:
          exact: enterprise-tenant-123
    route:
    - destination:
        host: agentforge-api-enterprise
        port:
          number: 80
  - route:
    - destination:
        host: agentforge-api
        port:
          number: 80
```

### Circuit Breaker Pattern

```typescript
@Injectable()
export class LLMService {
  private circuitBreaker: CircuitBreaker;

  constructor() {
    this.circuitBreaker = new CircuitBreaker(
      this.callLLM.bind(this),
      {
        timeout: 30000, // 30s
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      }
    );
  }

  async generateResponse(
    tenantId: string,
    prompt: string,
  ): Promise<string> {
    try {
      return await this.circuitBreaker.fire(tenantId, prompt);
    } catch (error) {
      // Fallback behavior
      return this.getFallbackResponse(tenantId);
    }
  }
}
```

### Distributed Tracing

```typescript
// OpenTelemetry for distributed tracing
import { trace } from '@opentelemetry/api';

@Injectable()
export class AgentsService {
  async createAgent(
    tenantId: string,
    data: CreateAgentDto,
  ): Promise<Agent> {
    const span = trace.getActiveSpan();
    
    span?.setAttribute('tenant.id', tenantId);
    span?.setAttribute('agent.name', data.name);
    
    try {
      // Create agent logic...
      span?.setStatus({ code: 0 }); // Success
      return agent;
    } catch (error) {
      span?.setStatus({ code: 2, message: error.message }); // Error
      throw error;
    }
  }
}
```

---

## 9. Disaster Recovery & Backup

### Multi-Region Deployment

```yaml
# Primary: us-east-1
# Secondary: us-west-2
# Tertiary: eu-west-1

# Global load balancer with health checks
# Automatic failover if region is down
```

### Backup Strategy

```typescript
@Injectable()
export class TenantBackupService {
  async backupTenant(tenantId: string): Promise<void> {
    // 1. Export all tenant data
    const data = await this.exportTenantData(tenantId);
    
    // 2. Encrypt backup
    const encrypted = await this.encrypt(data);
    
    // 3. Store in S3 with versioning
    await this.s3.upload({
      Bucket: 'agentforge-backups',
      Key: `tenants/${tenantId}/backup-${Date.now()}.enc`,
      Body: encrypted,
      StorageClass: 'GLACIER', // Cost-effective for backups
    });
    
    // 4. Update backup metadata
    await this.recordBackup(tenantId);
  }

  async restoreTenant(
    tenantId: string,
    backupId: string,
  ): Promise<void> {
    // Restore tenant from backup
    // Used for disaster recovery or tenant migration
  }
}
```

---

## 10. Monitoring & Observability

### Tenant-Specific Metrics

```typescript
// Prometheus metrics with tenant labels
@Injectable()
export class MetricsService {
  private requestCounter: Counter;
  private requestDuration: Histogram;

  constructor() {
    this.requestCounter = new Counter({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['tenant_id', 'method', 'path', 'status'],
    });

    this.requestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration',
      labelNames: ['tenant_id', 'method', 'path'],
      buckets: [0.1, 0.5, 1, 2, 5],
    });
  }

  trackRequest(
    tenantId: string,
    method: string,
    path: string,
    status: number,
    duration: number,
  ) {
    this.requestCounter.inc({
      tenant_id: tenantId,
      method,
      path,
      status: status.toString(),
    });

    this.requestDuration.observe(
      { tenant_id: tenantId, method, path },
      duration / 1000,
    );
  }
}
```

### Logging with Tenant Context

```typescript
// Winston logger with tenant context
@Injectable()
export class TenantAwareLogger {
  private logger: winston.Logger;

  log(
    level: string,
    message: string,
    tenantId: string,
    metadata?: any,
  ) {
    this.logger.log(level, message, {
      tenantId,
      timestamp: new Date().toISOString(),
      ...metadata,
    });
  }
}
```

---

## Summary

### Multi-Tenancy Benefits
- ✅ **Cost-Effective**: Shared resources reduce costs
- ✅ **Scalable**: Easy to onboard new tenants
- ✅ **Maintainable**: Single codebase, easier updates
- ✅ **Secure**: Proper isolation with row-level security

### Cloud-Native Benefits
- ✅ **Auto-Scaling**: HPA handles load automatically
- ✅ **High Availability**: Multi-replica, multi-zone
- ✅ **Self-Healing**: Kubernetes restarts failed pods
- ✅ **Zero-Downtime Deploys**: Rolling updates
- ✅ **Cost Optimization**: Pay for what you use

---

## Next Steps

1. **Review architecture** and provide feedback
2. **Update database schema** with organization_id
3. **Implement tenant middleware** in NestJS
4. **Set up Kubernetes** manifests
5. **Configure monitoring** with tenant labels

Would you like me to:
- Update the database schema SQL file?
- Add tenant middleware to NestJS getting started guide?
- Create Kubernetes deployment examples?
- Add admin panel tenant management features?
