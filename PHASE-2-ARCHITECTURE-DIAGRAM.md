# Phase 2: Architecture Diagrams

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Phase 2 Architecture                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Frontend Layer                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Billing    │  │     Team     │  │  Analytics   │         │
│  │      UI      │  │      UI      │  │      UI      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Notifications │  │    Admin     │  │  Dashboard   │         │
│  │      UI      │  │   Portal     │  │      UI      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  Next.js 14 + React 18 + TailwindCSS + Socket.IO Client        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API Gateway                              │
│                    NestJS REST + WebSocket                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Billing    │  │     Team     │  │  Analytics   │         │
│  │   Service    │  │   Service    │  │   Service    │         │
│  │              │  │              │  │              │         │
│  │ • Stripe API │  │ • Invites    │  │ • Events     │         │
│  │ • Subscript. │  │ • Roles      │  │ • Metrics    │         │
│  │ • Usage      │  │ • Activity   │  │ • Reports    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Notifications │  │    Admin     │  │   Existing   │         │
│  │   Service    │  │   Service    │  │   Services   │         │
│  │              │  │              │  │              │         │
│  │ • WebSocket  │  │ • Customers  │  │ • Agents     │         │
│  │ • Email      │  │ • Tickets    │  │ • Workflows  │         │
│  │ • Prefs      │  │ • System     │  │ • Knowledge  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐  ┌──────────────────────┐            │
│  │   PostgreSQL         │  │      Redis           │            │
│  │                      │  │                      │            │
│  │ • Organizations      │  │ • Cache              │            │
│  │ • Users              │  │ • Sessions           │            │
│  │ • Subscriptions      │  │ • Real-time counters │            │
│  │ • Invoices           │  │ • Job queues         │            │
│  │ • Analytics Events   │  │ • WebSocket state    │            │
│  │ • Notifications      │  │                      │            │
│  │ • Activity Logs      │  │                      │            │
│  └──────────────────────┘  └──────────────────────┘            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   External Services                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Stripe    │  │   SendGrid   │  │    Sentry    │         │
│  │              │  │              │  │              │         │
│  │ • Payments   │  │ • Emails     │  │ • Errors     │         │
│  │ • Webhooks   │  │ • Templates  │  │ • Monitoring │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Billing Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    Subscription Creation Flow                    │
└─────────────────────────────────────────────────────────────────┘

    User                 Frontend              Backend            Stripe
     │                      │                     │                 │
     │  1. Select Plan      │                     │                 │
     ├─────────────────────>│                     │                 │
     │                      │                     │                 │
     │  2. Enter Payment    │                     │                 │
     ├─────────────────────>│                     │                 │
     │                      │                     │                 │
     │                      │  3. Create Sub      │                 │
     │                      ├────────────────────>│                 │
     │                      │                     │                 │
     │                      │                     │  4. Create      │
     │                      │                     │     Customer    │
     │                      │                     ├────────────────>│
     │                      │                     │                 │
     │                      │                     │  5. Attach      │
     │                      │                     │     Payment     │
     │                      │                     ├────────────────>│
     │                      │                     │                 │
     │                      │                     │  6. Create Sub  │
     │                      │                     ├────────────────>│
     │                      │                     │                 │
     │                      │                     │  7. Webhook     │
     │                      │                     │<────────────────┤
     │                      │                     │                 │
     │                      │  8. Save to DB      │                 │
     │                      │<────────────────────┤                 │
     │                      │                     │                 │
     │  9. Confirmation     │                     │                 │
     │<─────────────────────┤                     │                 │
     │                      │                     │                 │
     │ 10. Send Email       │                     │                 │
     │<─────────────────────┼─────────────────────┤                 │
     │                      │                     │                 │
```

---

## Team Collaboration Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Team Invitation Flow                          │
└─────────────────────────────────────────────────────────────────┘

   Owner              Backend            Email Service       New User
     │                   │                     │                 │
     │  1. Invite User   │                     │                 │
     ├──────────────────>│                     │                 │
     │                   │                     │                 │
     │                   │  2. Create Token    │                 │
     │                   │  3. Save to DB      │                 │
     │                   │                     │                 │
     │                   │  4. Send Email      │                 │
     │                   ├────────────────────>│                 │
     │                   │                     │                 │
     │                   │                     │  5. Email       │
     │                   │                     ├────────────────>│
     │                   │                     │                 │
     │                   │                     │  6. Click Link  │
     │                   │<────────────────────┼─────────────────┤
     │                   │                     │                 │
     │                   │  7. Validate Token  │                 │
     │                   │  8. Create User     │                 │
     │                   │  9. Assign Role     │                 │
     │                   │                     │                 │
     │  10. Notification │                     │                 │
     │<──────────────────┤                     │                 │
     │                   │                     │                 │
     │                   │                     │ 11. Welcome     │
     │                   │                     ├────────────────>│
     │                   │                     │                 │
```

---

## Analytics Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Analytics Pipeline                            │
└─────────────────────────────────────────────────────────────────┘

                              Events
                                │
                                ▼
                    ┌───────────────────────┐
                    │   Metrics Service     │
                    │   Track Event()       │
                    └───────────────────────┘
                                │
                    ┌───────────┴───────────┐
                    ▼                       ▼
         ┌──────────────────┐   ┌──────────────────┐
         │   PostgreSQL     │   │     Redis        │
         │ analytics_events │   │  Hot Counters    │
         └──────────────────┘   └──────────────────┘
                    │                       │
                    │                       ▼
                    │           ┌──────────────────┐
                    │           │   Real-time      │
                    │           │   Dashboard      │
                    │           └──────────────────┘
                    ▼
         ┌──────────────────┐
         │  Aggregation     │
         │  (Cron - 2 AM)   │
         └──────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │  daily_metrics   │
         │  agent_metrics   │
         └──────────────────┘
                    │
                    ▼
         ┌──────────────────┐
         │  Analytics       │
         │  Dashboard       │
         └──────────────────┘
```

---

## Notification System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Notification Delivery System                    │
└─────────────────────────────────────────────────────────────────┘

   Event Trigger            Notification Service          Channels
       │                           │                          │
       │  1. Agent Error           │                          │
       ├──────────────────────────>│                          │
       │                           │                          │
       │                           │  2. Create Notification  │
       │                           │     (Save to DB)         │
       │                           │                          │
       │                           │  3. Check Preferences    │
       │                           │                          │
       │                           ├──────────────────────────┤
       │                           │                          │
       │                           │  4. Send via WebSocket   │
       │                           ├─────────────────────────>│
       │                           │     (Real-time)          │
       │                           │                          │
       │                           │  5. Queue Email          │
       │                           ├─────────────────────────>│
       │                           │     (If enabled)         │
       │                           │                          │
       │                           │  6. Update Badge Count   │
       │                           ├─────────────────────────>│
       │                           │                          │

┌─────────────────────────────────────────────────────────────────┐
│                     Notification Types                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  System          Billing         Agent           Team           │
│  ───────         ───────         ─────           ────           │
│  • Maintenance   • Payment Due   • Error         • Invited      │
│  • Updates       • Failed        • Deployed      • Joined       │
│  • Downtime      • Trial End     • High Traffic  • Role Change  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Admin Platform Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                  Admin Platform Structure                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              admin.objecta-labs.com                                │
│              (Separate Authentication)                           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Admin Guard                                 │
│              (Verify Admin JWT Token)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐   ┌───────────────┐   ┌───────────────┐
│   Dashboard   │   │   Customers   │   │   Support     │
│               │   │               │   │               │
│ • Metrics     │   │ • List        │   │ • Tickets     │
│ • Health      │   │ • Detail      │   │ • Queue       │
│ • Activity    │   │ • Edit        │   │ • Assign      │
└───────────────┘   └───────────────┘   └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Admin Audit Logger                            │
│               (Log ALL admin actions)                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                 admin_audit_logs Table                           │
│  • Action type  • Resource  • Admin user  • IP  • Timestamp     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema Relationships

```
┌─────────────────────────────────────────────────────────────────┐
│                  Core Entity Relationships                       │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  organizations   │
    │  ─────────────   │
    │  • id            │
    │  • name          │
    │  • plan          │
    └────────┬─────────┘
             │ 1:N
             ├─────────────────────────────────┐
             │                                 │
             ▼                                 ▼
    ┌──────────────┐                 ┌──────────────────┐
    │    users     │                 │  subscriptions   │
    │  ──────────  │                 │  ──────────────  │
    │  • id        │                 │  • id            │
    │  • email     │                 │  • stripe_id     │
    │  • role      │                 │  • plan          │
    └──────┬───────┘                 │  • status        │
           │ 1:N                     └──────────────────┘
           │                                  │ 1:N
           │                                  ▼
           │                         ┌──────────────────┐
           │                         │    invoices      │
           │                         │  ──────────────  │
           │                         │  • id            │
           │                         │  • amount        │
           │                         │  • status        │
           │                         └──────────────────┘
           ▼
    ┌──────────────┐
    │   agents     │
    │  ──────────  │
    │  • id        │
    │  • name      │
    └──────┬───────┘
           │ 1:N
           ▼
    ┌──────────────┐
    │conversations │
    │  ──────────  │
    │  • id        │
    │  • status    │
    └──────┬───────┘
           │ 1:N
           ▼
    ┌──────────────┐
    │   messages   │
    │  ──────────  │
    │  • id        │
    │  • content   │
    └──────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                  Analytics & Tracking                            │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────────┐
    │  organizations   │
    └────────┬─────────┘
             │ 1:N
             ├─────────────────┬────────────────┐
             ▼                 ▼                ▼
    ┌──────────────┐  ┌──────────────┐  ┌─────────────┐
    │analytics     │  │daily_metrics │  │activity_logs│
    │events        │  │              │  │             │
    │              │  │              │  │             │
    └──────────────┘  └──────────────┘  └─────────────┘

             ┌──────────────────┐
             │     agents       │
             └────────┬─────────┘
                      │ 1:N
                      ▼
             ┌──────────────────┐
             │  agent_metrics   │
             │                  │
             └──────────────────┘
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Production Deployment                         │
└─────────────────────────────────────────────────────────────────┘

                         Load Balancer
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │Frontend │     │Frontend │     │Frontend │
        │Instance │     │Instance │     │Instance │
        └─────────┘     └─────────┘     └─────────┘
                              │
                              ▼
                         API Gateway
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐     ┌─────────┐     ┌─────────┐
        │Backend  │     │Backend  │     │Backend  │
        │Instance │     │Instance │     │Instance │
        └─────────┘     └─────────┘     └─────────┘
              │               │               │
              └───────────────┼───────────────┘
                              ▼
                    ┌──────────────────┐
                    │   Redis Cluster  │
                    │   (Cache + Jobs) │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  PostgreSQL DB   │
                    │  (Primary)       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  PostgreSQL DB   │
                    │  (Read Replica)  │
                    └──────────────────┘

External Services:
• Stripe API
• SendGrid API
• Sentry Monitoring
```

---

## Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Security Layers                               │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Network Security                                       │
│  • SSL/TLS (HTTPS)                                              │
│  • DDoS Protection                                              │
│  • Rate Limiting                                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: Authentication                                         │
│  • JWT Tokens                                                   │
│  • Password Hashing (bcrypt)                                    │
│  • 2FA (Admin only)                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: Authorization                                          │
│  • RBAC (Role-Based Access Control)                             │
│  • Permission Guards                                            │
│  • Organization Isolation                                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 4: Data Security                                          │
│  • Row-Level Security (RLS)                                     │
│  • Encrypted at Rest                                            │
│  • Encrypted in Transit                                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 5: Audit & Monitoring                                     │
│  • All Actions Logged                                           │
│  • Suspicious Activity Alerts                                   │
│  • Regular Security Audits                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│              External Service Integrations                       │
└─────────────────────────────────────────────────────────────────┘

    ObjectaLabs Platform
            │
            ├────────► Stripe
            │          • Payment Processing
            │          • Subscription Management
            │          • Webhook Events
            │
            ├────────► SendGrid
            │          • Transactional Emails
            │          • Marketing Emails
            │          • Email Templates
            │
            ├────────► Sentry
            │          • Error Tracking
            │          • Performance Monitoring
            │          • Release Tracking
            │
            ├────────► AWS S3
            │          • File Storage
            │          • Document Storage
            │          • Backup Storage
            │
            └────────► OpenAI / Anthropic
                       • LLM API Calls
                       • Embeddings
                       • Completions
```

---

## Scalability Strategy

```
Current (Phase 2)              Future (Phase 3+)
─────────────────              ─────────────────

Single Region                  Multi-Region
• US-East-1                    • US-East-1
                               • EU-West-1
                               • Asia-Pacific-1

Vertical Scaling               Horizontal Scaling
• Larger instances             • Auto-scaling groups
• More RAM/CPU                 • Load balancing
                               • Container orchestration

PostgreSQL                     Distributed Database
• Single instance              • Read replicas (3+)
• Read replica (1)             • Connection pooling
                               • Query optimization

Redis                          Redis Cluster
• Single instance              • Multi-node cluster
• 8GB RAM                      • Sharding
                               • Sentinel for HA

File Storage                   CDN + Object Storage
• S3 bucket                    • CloudFront CDN
                               • Multi-region S3
                               • Caching strategy
```

This architecture supports:
- **100+ customers** (Phase 2)
- **1,000+ customers** (Phase 3)
- **10,000+ customers** (Future)

