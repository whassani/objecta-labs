# Phase 2: Billing System Implementation Guide

## Overview

Implement Stripe integration for subscription management, payment processing, and usage tracking.

**Timeline:** 4 weeks
**Priority:** CRITICAL
**Dependencies:** None (can start immediately)

---

## Goals

### Primary Objectives
1. ✅ Integrate Stripe for payment processing
2. ✅ Implement subscription lifecycle management
3. ✅ Track usage for metered billing
4. ✅ Handle webhooks reliably
5. ✅ Generate and deliver invoices

### Success Metrics
- 99.9% payment success rate
- < 1% webhook processing failures
- 100% invoice delivery
- < 5% payment retry rate

---

## Architecture

### Tech Stack
- **Payment Provider:** Stripe
- **Libraries:** 
  - `stripe` (Node.js SDK)
  - `@nestjs/stripe` (NestJS wrapper)
- **Webhooks:** Stripe webhook endpoints
- **Queue:** Bull for async processing

### Component Structure

```
backend/src/modules/billing/
├── billing.controller.ts          # REST API endpoints
├── billing.service.ts             # Core business logic
├── billing.module.ts              # Module configuration
├── stripe-webhook.controller.ts   # Webhook handler
├── usage-tracking.service.ts      # Metered usage
├── invoice.service.ts             # Invoice generation
├── dto/
│   ├── subscription.dto.ts
│   ├── payment-method.dto.ts
│   └── usage.dto.ts
└── entities/
    ├── subscription.entity.ts
    ├── invoice.entity.ts
    ├── payment-method.entity.ts
    └── usage-record.entity.ts
```

---

## Database Schema

### Subscription Entity

```typescript
@Entity('subscriptions')
export class Subscription {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'stripe_customer_id' })
  stripeCustomerId: string;

  @Column({ name: 'stripe_subscription_id' })
  stripeSubscriptionId: string;

  @Column()
  plan: string; // starter, professional, enterprise

  @Column()
  status: string; // active, canceled, past_due, trialing

  @Column({ name: 'current_period_start' })
  currentPeriodStart: Date;

  @Column({ name: 'current_period_end' })
  currentPeriodEnd: Date;

  @Column({ name: 'cancel_at_period_end', default: false })
  cancelAtPeriodEnd: boolean;

  @Column({ name: 'trial_end', nullable: true })
  trialEnd: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

### Invoice Entity

```typescript
@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'stripe_invoice_id' })
  stripeInvoiceId: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column()
  status: string; // draft, open, paid, void, uncollectible

  @Column({ name: 'invoice_pdf', nullable: true })
  invoicePdf: string;

  @Column({ name: 'due_date' })
  dueDate: Date;

  @Column({ name: 'paid_at', nullable: true })
  paidAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Usage Record Entity

```typescript
@Entity('usage_records')
export class UsageRecord {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'subscription_id' })
  subscriptionId: string;

  @Column({ name: 'metric_type' })
  metricType: string; // messages, agents, storage, api_calls

  @Column({ type: 'integer' })
  quantity: number;

  @Column({ name: 'period_start' })
  periodStart: Date;

  @Column({ name: 'period_end' })
  periodEnd: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

## Implementation Steps

### Week 1: Stripe Setup & Basic Integration

#### Day 1-2: Project Setup
```bash
# Install dependencies
npm install stripe @nestjs/stripe

# Environment variables
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
```

#### Day 3-5: Core Billing Module
- Create billing module
- Implement Stripe service wrapper
- Create subscription entities
- Build basic CRUD operations

### Week 2: Subscription Management

#### Features to Implement
1. **Create Subscription**
   - Create Stripe customer
   - Attach payment method
   - Create subscription
   - Store in database

2. **Update Subscription**
   - Change plan
   - Update payment method
   - Prorate charges

3. **Cancel Subscription**
   - Immediate cancellation
   - Cancel at period end
   - Handle grace period

### Week 3: Webhooks & Usage Tracking

#### Webhook Events to Handle
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`
- `payment_method.attached`

#### Usage Tracking Implementation
- Track message counts
- Track API calls
- Track storage usage
- Aggregate daily/monthly

### Week 4: Testing & Polish

#### Testing Checklist
- [ ] Unit tests for all services
- [ ] Integration tests with Stripe test mode
- [ ] Webhook retry logic
- [ ] Payment failure handling
- [ ] Subscription upgrade/downgrade flows
- [ ] Edge cases (expired cards, declined payments)

---

## API Endpoints

### Customer-Facing APIs

```typescript
// Get subscription details
GET /api/v1/billing/subscription

// Get available plans
GET /api/v1/billing/plans

// Create subscription
POST /api/v1/billing/subscription
Body: {
  planId: string;
  paymentMethodId: string;
}

// Update subscription
PATCH /api/v1/billing/subscription
Body: {
  planId: string;
}

// Cancel subscription
DELETE /api/v1/billing/subscription
Query: {
  immediate?: boolean;
}

// Get invoices
GET /api/v1/billing/invoices

// Get usage
GET /api/v1/billing/usage
Query: {
  startDate: string;
  endDate: string;
}

// Update payment method
POST /api/v1/billing/payment-method
Body: {
  paymentMethodId: string;
}
```

### Webhook Endpoint

```typescript
// Stripe webhook handler
POST /api/v1/billing/webhooks/stripe
Headers: {
  'stripe-signature': string;
}
```

---

## Pricing Plans

### Tier Definitions

```typescript
export const PRICING_PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    features: {
      agents: 1,
      messagesPerMonth: 1000,
      users: 1,
      storage: 100, // MB
      knowledgeBase: false,
      workflows: false,
      support: 'community',
    },
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 29,
    interval: 'month',
    stripeProductId: 'prod_...',
    stripePriceId: 'price_...',
    features: {
      agents: 5,
      messagesPerMonth: 10000,
      users: 3,
      storage: 1000, // MB
      knowledgeBase: true,
      workflows: true,
      support: 'email',
    },
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 99,
    interval: 'month',
    stripeProductId: 'prod_...',
    stripePriceId: 'price_...',
    features: {
      agents: 25,
      messagesPerMonth: 100000,
      users: 10,
      storage: 10000, // MB
      knowledgeBase: true,
      workflows: true,
      fineTuning: true,
      support: 'priority',
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom pricing
    interval: 'month',
    features: {
      agents: -1, // Unlimited
      messagesPerMonth: -1,
      users: -1,
      storage: -1,
      knowledgeBase: true,
      workflows: true,
      fineTuning: true,
      sso: true,
      support: 'dedicated',
      sla: true,
    },
  },
};
```

---

## Error Handling

### Common Errors & Solutions

```typescript
export class BillingErrorHandler {
  static handle(error: Stripe.errors.StripeError) {
    switch (error.type) {
      case 'StripeCardError':
        return {
          message: 'Your card was declined. Please try another payment method.',
          code: 'CARD_DECLINED',
        };
      case 'StripeRateLimitError':
        return {
          message: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT',
        };
      case 'StripeInvalidRequestError':
        return {
          message: 'Invalid request. Please check your input.',
          code: 'INVALID_REQUEST',
        };
      case 'StripeAPIError':
        return {
          message: 'An error occurred with our payment provider. Please try again.',
          code: 'API_ERROR',
        };
      default:
        return {
          message: 'An unexpected error occurred. Please contact support.',
          code: 'UNKNOWN_ERROR',
        };
    }
  }
}
```

---

## Next Steps

After completing billing implementation:
1. Review [Team Collaboration Implementation](./PHASE-2-TEAM-IMPLEMENTATION.md)
2. Plan frontend billing UI
3. Set up Stripe test environment
4. Create migration scripts for existing users

---

## Resources

- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [NestJS Stripe Module](https://github.com/dhaspden/nestjs-stripe)
- [Stripe Testing](https://stripe.com/docs/testing)
