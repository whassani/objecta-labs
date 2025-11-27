# Phase 2: Quick Start Guide

## Overview

This guide helps you get started with Phase 2 implementation. Follow this step-by-step guide to build billing, team collaboration, analytics, notifications, and admin features.

**Estimated Time:** 12-16 weeks
**Team Size:** 6 engineers + 2 designers + 1 PM

---

## Prerequisites

Before starting Phase 2, ensure Phase 1 is complete:
- ✅ Multi-tenant architecture working
- ✅ Authentication & RBAC implemented
- ✅ Agents with LLM integration
- ✅ Knowledge base with RAG
- ✅ Workflow automation
- ✅ Basic analytics (tools, documents)

---

## Implementation Order

Phase 2 should be implemented in this order to manage dependencies:

```
Week 1-4:   Billing System ⚠️ CRITICAL
Week 5-7:   Team Collaboration
Week 8-11:  Analytics & Insights
Week 12-13: Notifications System
Week 14-16: Admin Platform
```

---

## Quick Setup Checklist

### Week 0: Preparation (Before Starting)

#### 1. Create Stripe Account
```bash
# Sign up at https://stripe.com
# Get test keys from Dashboard > Developers > API keys

# Add to .env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

#### 2. Set Up Database Migration
```bash
# Install migration tools if not already
npm install --save typeorm

# Create Phase 2 migration
cd backend
npm run migration:create -- -n Phase2Features
```

#### 3. Install Dependencies
```bash
# Backend
cd backend
npm install stripe @nestjs/stripe bull @nestjs/bull socket.io

# Frontend
cd frontend
npm install recharts date-fns socket.io-client
```

#### 4. Update Environment Variables
```bash
# backend/.env
NODE_ENV=development
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
ADMIN_JWT_SECRET=admin-secret-key
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# frontend/.env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_WS_URL=ws://localhost:3001
```

---

## Phase 2.1: Billing System (Weeks 1-4)

### Step 1: Database Setup
```bash
# Run Phase 2 database migrations
cd backend
npm run migration:run

# Verify tables created
psql -d objecta-labs -c "\dt"
# Should see: subscriptions, invoices, payment_methods, usage_records
```

### Step 2: Create Billing Module
```bash
cd backend/src/modules
mkdir -p billing/entities billing/dto

# Create files (use PHASE-2-BILLING-IMPLEMENTATION.md as reference)
touch billing/billing.module.ts
touch billing/billing.service.ts
touch billing/billing.controller.ts
touch billing/stripe-webhook.controller.ts
touch billing/usage-tracking.service.ts
```

### Step 3: Integrate Stripe
```typescript
// billing/billing.module.ts
import { Module } from '@nestjs/common';
import { StripeModule } from '@nestjs/stripe';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    StripeModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        apiKey: configService.get('STRIPE_SECRET_KEY'),
        apiVersion: '2023-10-16',
      }),
      inject: [ConfigService],
    }),
  ],
})
export class BillingModule {}
```

### Step 4: Test Billing
```bash
# Start backend
cd backend
npm run start:dev

# Test Stripe integration
curl -X POST http://localhost:3001/api/v1/billing/subscription \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"planId": "starter", "paymentMethodId": "pm_card_visa"}'

# Set up Stripe webhook forwarding (for local testing)
stripe listen --forward-to localhost:3001/api/v1/billing/webhooks/stripe
```

### Step 5: Build Billing UI
```bash
cd frontend/src/app/(dashboard)/dashboard
mkdir -p billing/invoices billing/usage

# Create billing pages
touch billing/page.tsx
touch billing/invoices/page.tsx
touch billing/usage/page.tsx
```

**Completion Criteria:**
- [ ] Can create subscription via Stripe
- [ ] Webhooks processing correctly
- [ ] Usage tracking working
- [ ] Billing UI displays subscription info
- [ ] Can upgrade/downgrade plans

---

## Phase 2.2: Team Collaboration (Weeks 5-7)

### Step 1: Database Setup
```bash
# Tables should already exist from Phase 2 migration
# Verify: team_invitations, activity_logs
psql -d objecta-labs -c "SELECT * FROM team_invitations LIMIT 1;"
```

### Step 2: Create Team Module
```bash
cd backend/src/modules
mkdir -p team/entities team/dto

touch team/team.module.ts
touch team/team.service.ts
touch team/team.controller.ts
touch team/invitations.service.ts
touch team/activity-tracking.service.ts
```

### Step 3: Implement Invitation Flow
```typescript
// team/invitations.service.ts
@Injectable()
export class InvitationsService {
  async inviteUser(orgId: string, email: string, role: string) {
    // 1. Generate token
    // 2. Create invitation
    // 3. Send email
    // 4. Log activity
  }
}
```

### Step 4: Build Team UI
```bash
cd frontend/src/app/(dashboard)/dashboard
mkdir -p team

touch team/page.tsx
touch team/[memberId]/page.tsx
```

### Step 5: Test Team Features
```bash
# Invite user
curl -X POST http://localhost:3001/api/v1/team/invite \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"email": "newuser@example.com", "role": "member"}'

# Check invitation email was sent
```

**Completion Criteria:**
- [ ] Can invite team members
- [ ] Invitation emails sent
- [ ] Members can accept invitations
- [ ] Role-based permissions working
- [ ] Activity logs capturing actions

---

## Phase 2.3: Analytics & Insights (Weeks 8-11)

### Step 1: Set Up Analytics Tables
```bash
# Verify analytics tables exist
psql -d objecta-labs -c "SELECT * FROM analytics_events LIMIT 1;"
psql -d objecta-labs -c "SELECT * FROM daily_metrics LIMIT 1;"
```

### Step 2: Create Analytics Module
```bash
cd backend/src/modules
mkdir -p analytics/dto

touch analytics/analytics.module.ts
touch analytics/analytics.service.ts
touch analytics/analytics.controller.ts
touch analytics/metrics.service.ts
touch analytics/aggregation.service.ts
```

### Step 3: Implement Event Tracking
```typescript
// analytics/metrics.service.ts
@Injectable()
export class MetricsService {
  async trackEvent(orgId: string, eventType: string, properties: any) {
    // Store event
    await this.analyticsEvents.save({
      organizationId: orgId,
      eventType,
      properties,
      createdAt: new Date(),
    });
    
    // Update Redis counters
    await this.redis.incr(`analytics:${orgId}:${eventType}`);
  }
}
```

### Step 4: Set Up Data Aggregation
```typescript
// analytics/aggregation.service.ts
@Cron('0 2 * * *') // 2 AM daily
async aggregateDailyMetrics() {
  // Aggregate yesterday's data
  // Store in daily_metrics table
}
```

### Step 5: Build Analytics Dashboard
```bash
cd frontend/src/app/(dashboard)/dashboard
mkdir -p analytics/agents analytics/usage analytics/reports

touch analytics/page.tsx
touch analytics/agents/page.tsx
```

**Completion Criteria:**
- [ ] Events being tracked
- [ ] Daily aggregation running
- [ ] Dashboard displays metrics
- [ ] Charts rendering correctly
- [ ] Export functionality works

---

## Phase 2.4: Notifications System (Weeks 12-13)

### Step 1: Set Up WebSocket Gateway
```typescript
// notifications/notifications.gateway.ts
@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;
  
  sendToUser(userId: string, notification: Notification) {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }
}
```

### Step 2: Create Notification Service
```bash
cd backend/src/modules
mkdir -p notifications/entities notifications/dto

touch notifications/notifications.module.ts
touch notifications/notifications.service.ts
touch notifications/notifications.controller.ts
touch notifications/notifications.gateway.ts
```

### Step 3: Build Notification UI
```bash
cd frontend/src/components
mkdir -p notifications

touch notifications/NotificationBell.tsx
touch notifications/NotificationPanel.tsx
touch notifications/NotificationItem.tsx
```

### Step 4: Test Real-time Notifications
```javascript
// Test WebSocket connection
const socket = io('http://localhost:3001/notifications');
socket.emit('subscribe', { userId: 'user-id' });
socket.on('notification', (notification) => {
  console.log('Received:', notification);
});
```

**Completion Criteria:**
- [ ] Real-time notifications working
- [ ] Email notifications sent
- [ ] Notification preferences respected
- [ ] Unread count accurate
- [ ] Mark as read functional

---

## Phase 2.5: Admin Platform (Weeks 14-16)

### Step 1: Create Admin Module
```bash
cd backend/src/modules
mkdir -p admin/guards admin/dto

touch admin/admin.module.ts
touch admin/admin.service.ts
touch admin/admin.controller.ts
touch admin/customers.service.ts
touch admin/support.service.ts
```

### Step 2: Set Up Admin Authentication
```typescript
// admin/guards/admin.guard.ts
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    return user && user.isAdmin === true;
  }
}
```

### Step 3: Build Admin Dashboard
```bash
# Create separate frontend for admin (or use same with guards)
cd frontend/src/app/(admin)
mkdir -p dashboard customers tickets

touch dashboard/page.tsx
touch customers/page.tsx
touch customers/[orgId]/page.tsx
touch tickets/page.tsx
```

**Completion Criteria:**
- [ ] Admin authentication working
- [ ] Dashboard displays metrics
- [ ] Can view customer details
- [ ] Support tickets functional
- [ ] All actions logged

---

## Testing Phase 2

### Unit Tests
```bash
cd backend
npm run test

# Test specific module
npm run test -- billing.service.spec.ts
```

### Integration Tests
```bash
# Run E2E tests
cd backend
npm run test:e2e

# Test specific flow
npm run test:e2e -- billing-flow.e2e-spec.ts
```

### Manual Testing Checklist
```bash
# Use the test script
cd backend
node test-phase-2.js
```

---

## Deployment

### Step 1: Environment Setup
```bash
# Production environment variables
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_live_...
REDIS_URL=redis://production-redis:6379
DATABASE_URL=postgresql://production-db
```

### Step 2: Database Migration
```bash
# Backup production database first
pg_dump objecta-labs > backup_before_phase2.sql

# Run migrations
npm run migration:run
```

### Step 3: Deploy Services
```bash
# Deploy backend
npm run build
pm2 restart backend

# Deploy frontend
npm run build
pm2 restart frontend
```

### Step 4: Verify Deployment
```bash
# Health check
curl https://api.objecta-labs.com/health

# Test Stripe webhooks
stripe listen --forward-to https://api.objecta-labs.com/api/v1/billing/webhooks/stripe
```

---

## Monitoring & Maintenance

### Set Up Monitoring
```bash
# Install monitoring tools
npm install @sentry/node
npm install prom-client

# Configure alerts for:
# - Payment failures
# - High error rates
# - Webhook failures
# - Database performance
```

### Daily Checks
- [ ] Stripe webhooks processing
- [ ] Email delivery rate
- [ ] Analytics aggregation running
- [ ] No critical errors
- [ ] Database performance OK

### Weekly Tasks
- [ ] Review support tickets
- [ ] Check subscription metrics
- [ ] Analyze usage patterns
- [ ] Review admin audit logs

---

## Common Issues & Solutions

### Stripe Webhooks Not Working
```bash
# Check webhook secret
echo $STRIPE_WEBHOOK_SECRET

# Test webhook signature
stripe trigger payment_intent.succeeded
```

### Analytics Not Aggregating
```bash
# Check cron job
crontab -l

# Manually trigger
npm run analytics:aggregate
```

### WebSocket Connection Failing
```bash
# Check CORS settings
# Check WebSocket server running
# Verify port open in firewall
```

---

## Resources

### Documentation
- [Phase 2 Plan](./PHASE-2-PLAN.md)
- [Billing Implementation](./PHASE-2-BILLING-IMPLEMENTATION.md)
- [Team Implementation](./PHASE-2-TEAM-IMPLEMENTATION.md)
- [Analytics Implementation](./PHASE-2-ANALYTICS-IMPLEMENTATION.md)
- [Notifications Implementation](./PHASE-2-NOTIFICATIONS-IMPLEMENTATION.md)
- [Admin Implementation](./PHASE-2-ADMIN-IMPLEMENTATION.md)
- [Database Schema](./PHASE-2-DATABASE-SCHEMA.md)

### External Resources
- [Stripe Documentation](https://stripe.com/docs)
- [Socket.IO Guide](https://socket.io/docs/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## Getting Help

### Team Communication
- Daily standups: 9 AM
- Weekly planning: Monday 2 PM
- Code reviews: Required for all PRs
- Documentation: Update as you go

### Escalation Path
1. Check documentation
2. Ask team in Slack
3. Escalate to tech lead
4. Create support ticket

---

## Success Checklist

Before marking Phase 2 complete:

### Billing
- [ ] Stripe integration tested in production
- [ ] All webhook events handled
- [ ] Payment failures managed
- [ ] Usage tracking accurate
- [ ] Invoices generated correctly

### Team Collaboration
- [ ] Multi-user orgs working
- [ ] Invitations sent successfully
- [ ] Permissions enforced
- [ ] Activity logs complete

### Analytics
- [ ] Events tracked accurately
- [ ] Dashboards loading < 2s
- [ ] Aggregation running daily
- [ ] Reports exportable

### Notifications
- [ ] Real-time delivery < 500ms
- [ ] Email notifications sent
- [ ] Preferences respected
- [ ] Unread counts accurate

### Admin Platform
- [ ] Admin auth secure
- [ ] Customer management functional
- [ ] Support tickets working
- [ ] All actions audited

### Overall
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Team trained
- [ ] Monitoring set up
- [ ] Production deployment successful

---

## Next Steps

After Phase 2 completion:
1. Gather user feedback
2. Monitor key metrics
3. Plan Phase 3 (Enterprise features)
4. Continue iterating based on data

**Congratulations on completing Phase 2! 🎉**
