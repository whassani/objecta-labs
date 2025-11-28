# Phase 2: Admin Platform Implementation Guide

## Overview

Build an internal admin platform for customer support, system monitoring, and operational management.

**Timeline:** 3 weeks
**Priority:** MEDIUM
**Dependencies:** All other Phase 2 components

---

## Goals

### Primary Objectives
1. ✅ Admin dashboard for platform monitoring
2. ✅ Customer management interface
3. ✅ Support ticket system
4. ✅ System configuration tools
5. ✅ Analytics and reporting

### Success Metrics
- Support response time < 2 hours
- Admin actions logged 100%
- Support 1000+ customers
- Zero unauthorized access

---

## Architecture

### Access Control
- **Separate subdomain:** admin.objecta-labs.com
- **Admin roles:** Super Admin, Admin, Support Agent
- **All actions logged:** Complete audit trail

### Component Structure

```
backend/src/modules/admin/
├── admin.controller.ts          # Admin API endpoints
├── admin.service.ts             # Core admin logic
├── admin.module.ts              # Module config
├── customers.service.ts         # Customer management
├── support.service.ts           # Support tickets
├── system.service.ts            # System configuration
├── guards/
│   └── admin.guard.ts           # Admin access control
├── dto/
│   ├── admin-action.dto.ts
│   └── support-ticket.dto.ts
└── entities/
    ├── admin-user.entity.ts
    ├── support-ticket.entity.ts
    └── admin-audit-log.entity.ts
```

---

## Database Schema

### Admin User Entity

```typescript
@Entity('admin_users')
export class AdminUser {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  passwordHash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ name: 'admin_role' })
  adminRole: string; // super_admin, admin, support

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Support Ticket Entity

```typescript
@Entity('support_tickets')
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column()
  subject: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  priority: string; // low, medium, high, critical

  @Column()
  status: string; // open, in_progress, waiting, resolved, closed

  @Column({ name: 'assigned_to', nullable: true })
  assignedTo: string; // Admin user ID

  @Column({ type: 'jsonb', default: '[]' })
  tags: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'resolved_at', nullable: true })
  resolvedAt: Date;
}
```

### Admin Audit Log Entity

```typescript
@Entity('admin_audit_logs')
export class AdminAuditLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'admin_user_id' })
  adminUserId: string;

  @Column({ name: 'action_type' })
  actionType: string; // view_customer, update_subscription, impersonate, etc.

  @Column({ name: 'resource_type', nullable: true })
  resourceType: string;

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ type: 'jsonb', nullable: true })
  details: any;

  @Column({ name: 'ip_address' })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

## Implementation Steps

### Week 1: Admin Authentication & Dashboard

#### Day 1-2: Admin Auth System
```typescript
// admin/admin-auth.service.ts

@Injectable()
export class AdminAuthService {
  async login(email: string, password: string): Promise<AdminUser> {
    // 1. Validate credentials
    // 2. Check admin status
    // 3. Generate admin JWT (different from user JWT)
    // 4. Log login attempt
  }

  async validateAdminToken(token: string): Promise<AdminUser> {
    // Validate admin JWT
  }
}
```

#### Day 3-4: Admin Dashboard Backend
```typescript
// admin/admin.service.ts

@Injectable()
export class AdminService {
  async getDashboardMetrics(): Promise<AdminDashboardMetrics> {
    return {
      totalCustomers: await this.getTotalCustomers(),
      activeCustomers: await this.getActiveCustomers(),
      totalRevenue: await this.getTotalRevenue(),
      openTickets: await this.getOpenTickets(),
      systemHealth: await this.getSystemHealth(),
      recentSignups: await this.getRecentSignups(),
    };
  }

  async getSystemHealth(): Promise<SystemHealth> {
    return {
      api: await this.checkApiHealth(),
      database: await this.checkDatabaseHealth(),
      redis: await this.checkRedisHealth(),
      stripe: await this.checkStripeHealth(),
    };
  }
}
```

#### Day 5: Admin Dashboard UI
```typescript
// frontend-admin/src/pages/dashboard.tsx

export default function AdminDashboard() {
  return (
    <>
      <AdminHeader />
      <MetricsCards />
      <RevenueChart />
      <RecentCustomers />
      <OpenTickets />
      <SystemStatus />
    </>
  );
}
```

### Week 2: Customer Management & Support

#### Customer Management Features
```typescript
// admin/customers.service.ts

@Injectable()
export class CustomersService {
  async listCustomers(filters: CustomerFilters): Promise<CustomerList> {
    // Paginated customer list
    // Filter by plan, status, date
    // Search by email, name, domain
  }

  async getCustomerDetails(orgId: string): Promise<CustomerDetails> {
    // Organization details
    // Subscription info
    // Usage statistics
    // Agent list
    // Recent activity
  }

  async updateCustomer(
    orgId: string,
    updates: UpdateCustomerDto,
  ): Promise<Organization> {
    // Update organization details
    // Log admin action
  }

  async suspendCustomer(orgId: string, reason: string): Promise<void> {
    // Suspend organization
    // Send notification
    // Log action
  }

  async impersonateUser(adminId: string, userId: string): Promise<string> {
    // Generate impersonation token
    // Log action
    // Set expiration (1 hour)
  }
}
```

#### Support Ticket System
```typescript
// admin/support.service.ts

@Injectable()
export class SupportService {
  async createTicket(dto: CreateTicketDto): Promise<SupportTicket> {
    // Create ticket
    // Assign based on priority
    // Send notifications
  }

  async getTicketQueue(filters: TicketFilters): Promise<TicketList> {
    // Get tickets for admin
    // Filter by status, priority
    // Sort by creation date
  }

  async assignTicket(ticketId: string, adminId: string): Promise<void> {
    // Assign to admin
    // Update status
    // Notify admin
  }

  async addTicketComment(
    ticketId: string,
    comment: string,
    isInternal: boolean,
  ): Promise<void> {
    // Add comment
    // Internal notes not visible to customer
    // Send notification if public
  }

  async resolveTicket(ticketId: string, resolution: string): Promise<void> {
    // Mark as resolved
    // Send resolution to customer
    // Track resolution time
  }
}
```

### Week 3: System Tools & Polish

#### System Configuration
```typescript
// admin/system.service.ts

@Injectable()
export class SystemService {
  async getConfiguration(): Promise<SystemConfig> {
    // Get all system settings
  }

  async updateConfiguration(
    key: string,
    value: any,
  ): Promise<void> {
    // Update system setting
    // Validate changes
    // Log admin action
  }

  async getFeatureFlags(): Promise<FeatureFlag[]> {
    // List all feature flags
  }

  async toggleFeatureFlag(
    flag: string,
    enabled: boolean,
  ): Promise<void> {
    // Enable/disable feature
    // Log action
  }

  async runMaintenance(task: MaintenanceTask): Promise<void> {
    // Execute maintenance tasks
    // Clean up old data
    // Regenerate indexes
  }
}
```

---

## Admin UI Design

### Admin Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│  🛡️ ObjectaLabs Admin          Support (5)  [John Doe ▼]    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │Customers │  │  Revenue │  │ Tickets  │  │  Health  │   │
│  │  1,234   │  │  $125K   │  │    5     │  │  ✅ Good │   │
│  │  ↑ 23    │  │  ↑ 15%   │  │  2 High  │  │          │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                                              │
│  Revenue Trends (Last 30 Days)                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  📈 [Chart showing MRR growth]                        │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Recent Signups                    Open Tickets             │
│  ┌──────────────────────────┐  ┌────────────────────────┐  │
│  │ Acme Corp - Pro Plan     │  │ 🔴 Payment Failed      │  │
│  │ XYZ Inc - Enterprise     │  │ 🟡 Feature Request     │  │
│  │ Test Co - Starter        │  │ 🟢 General Question    │  │
│  └──────────────────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Customer Detail View

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Customers                                         │
├─────────────────────────────────────────────────────────────┤
│  Acme Corporation                    [Impersonate] [Edit]   │
│  acme.objecta-labs.com                                        │
│  Professional Plan - Active                                  │
├─────────────────────────────────────────────────────────────┤
│  📊 Overview   👥 Team   💳 Billing   📁 Support   📝 Notes │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Organization Details                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Created: Jan 15, 2024                                 │  │
│  │ Owner: john@acme.com                                  │  │
│  │ Users: 5 / 10                                         │  │
│  │ Agents: 12 / 25                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Subscription                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Plan: Professional ($99/month)                        │  │
│  │ Status: Active                                        │  │
│  │ Next billing: Feb 15, 2024                           │  │
│  │ MRR: $99                                              │  │
│  │ [Upgrade] [Extend Trial] [Cancel]                    │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Usage (This Month)                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Messages: 45,234 / 100,000 (45%)                     │  │
│  │ Storage: 2.1 GB / 10 GB (21%)                        │  │
│  │ API Calls: 12,456                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Support Ticket Queue

```
┌─────────────────────────────────────────────────────────────┐
│  Support Tickets                [Filters ▼] [New Ticket]    │
├─────────────────────────────────────────────────────────────┤
│  🔴 High (2)  🟡 Medium (3)  🟢 Low (0)                     │
├─────────────────────────────────────────────────────────────┤
│  Priority │ Status      │ Subject           │ Customer      │
├─────────────────────────────────────────────────────────────┤
│  🔴 High  │ Open        │ Payment Failed    │ Acme Corp    │
│           │ 2h ago      │ #1234             │ [View]       │
├─────────────────────────────────────────────────────────────┤
│  🔴 High  │ In Progress │ Agent Not Working │ XYZ Inc      │
│           │ 5h ago      │ #1233             │ [View]       │
│           │ Assigned: Me│                   │              │
├─────────────────────────────────────────────────────────────┤
│  🟡 Medium│ Waiting     │ Feature Request   │ Test Co      │
│           │ 1d ago      │ #1232             │ [View]       │
│           │ Assigned: Jane                  │              │
└─────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Admin Authentication

```typescript
POST /admin/auth/login
Body: {
  email: string;
  password: string;
}

GET /admin/auth/me
Response: {
  id: string;
  email: string;
  fullName: string;
  adminRole: string;
}
```

### Admin Dashboard

```typescript
GET /admin/dashboard/metrics
Response: {
  totalCustomers: number;
  activeCustomers: number;
  totalRevenue: number;
  openTickets: number;
  systemHealth: SystemHealth;
}

GET /admin/dashboard/revenue-chart
Query: {
  startDate: string;
  endDate: string;
}
```

### Customer Management

```typescript
GET /admin/customers
Query: {
  page: number;
  limit: number;
  plan?: string;
  status?: string;
  search?: string;
}

GET /admin/customers/:orgId
Response: {
  organization: Organization;
  subscription: Subscription;
  usage: UsageStats;
  team: User[];
  agents: Agent[];
  recentActivity: Activity[];
}

PATCH /admin/customers/:orgId
Body: {
  plan?: string;
  status?: string;
  limits?: object;
}

POST /admin/customers/:orgId/suspend
Body: {
  reason: string;
}

POST /admin/customers/:orgId/impersonate
Body: {
  userId: string;
}
Response: {
  impersonationToken: string;
  expiresAt: Date;
}
```

### Support Tickets

```typescript
GET /admin/tickets
Query: {
  status?: string;
  priority?: string;
  assignedTo?: string;
}

POST /admin/tickets
Body: {
  organizationId: string;
  subject: string;
  description: string;
  priority: string;
}

GET /admin/tickets/:ticketId

POST /admin/tickets/:ticketId/assign
Body: {
  adminUserId: string;
}

POST /admin/tickets/:ticketId/comments
Body: {
  comment: string;
  isInternal: boolean;
}

POST /admin/tickets/:ticketId/resolve
Body: {
  resolution: string;
}
```

---

## Admin Roles & Permissions

### Super Admin
- ✅ All customer management
- ✅ All support tickets
- ✅ System configuration
- ✅ Feature flags
- ✅ Admin user management
- ✅ Financial data access

### Admin
- ✅ Customer management
- ✅ Support tickets
- ✅ View system config
- ❌ Modify system config
- ❌ Manage admin users
- ✅ Limited financial data

### Support Agent
- ✅ View customer details
- ✅ Support tickets (assigned)
- ✅ Impersonate users
- ❌ Modify customers
- ❌ Financial data
- ❌ System configuration

---

## Security Measures

### Access Control
- Separate authentication system
- Admin JWT tokens (shorter expiration)
- IP whitelist for admin access
- 2FA required for admin login
- Session timeout (30 minutes)

### Audit Logging
- Log ALL admin actions
- Include IP address, user agent
- Immutable audit logs
- Regular audit reviews
- Alert on suspicious actions

### Impersonation Safety
- Time-limited tokens (1 hour)
- Clear visual indicator in UI
- Auto-logout after time limit
- Cannot impersonate other admins
- All actions logged

---

## Testing Checklist

### Functional Tests
- [ ] Admin login/logout
- [ ] Customer list and search
- [ ] Customer detail view
- [ ] Support ticket CRUD
- [ ] Impersonation flow
- [ ] System configuration
- [ ] Audit log creation

### Security Tests
- [ ] Non-admin cannot access
- [ ] Token validation
- [ ] Permission checks
- [ ] Audit log integrity
- [ ] Impersonation limits

### Performance Tests
- [ ] Dashboard loads < 2s
- [ ] Customer list with 1000+ customers
- [ ] Search responsiveness
- [ ] Concurrent admin users

---

## Deployment Notes

### Separate Deployment
```yaml
# admin-frontend deployment
domain: admin.objecta-labs.com
auth: admin-jwt
environment:
  - ADMIN_API_URL=https://api.objecta-labs.com/admin
  - SESSION_TIMEOUT=1800 # 30 minutes
```

### Access Restrictions
- IP whitelist (office, VPN)
- 2FA enforced
- Regular password rotation
- Separate admin database user

---

## Next Steps

After completing admin platform:
1. Train support team
2. Create admin user manual
3. Set up monitoring alerts
4. Establish escalation procedures
5. Begin Phase 2 testing

---

## Resources

- [Admin Dashboard Examples](https://www.creative-tim.com/templates/admin)
- [Support Ticket Best Practices](https://www.zendesk.com/blog/customer-support-best-practices/)
- [Audit Logging Standards](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
