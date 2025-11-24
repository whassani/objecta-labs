# AgentForge Admin Platform Specification

## Overview

The **Admin Platform** is an internal tool for AgentForge team members to manage, monitor, and support the entire platform. This is separate from the customer-facing application.

**Access**: Internal team only (admin.agentforge.com)

---

## 1. Admin User Roles & Permissions

### Role Hierarchy

#### Super Admin (Founders/CTO)
**Full Access** to everything:
- ✅ All platform settings
- ✅ User management
- ✅ Financial data
- ✅ System configuration
- ✅ Database access
- ✅ Deploy & rollback
- ✅ Delete anything

#### Admin (Team Leads)
**Most Access**:
- ✅ User management
- ✅ Content moderation
- ✅ Support tickets
- ✅ Analytics & reports
- ✅ Feature flags
- ❌ System config
- ❌ Financial settings
- ❌ Deployments

#### Support Agent
**Customer Support**:
- ✅ View customer data
- ✅ Respond to tickets
- ✅ Impersonate users (with logging)
- ✅ Basic analytics
- ❌ Modify users
- ❌ Financial data
- ❌ Platform settings

#### Developer
**Technical Access**:
- ✅ System logs
- ✅ Error tracking
- ✅ API monitoring
- ✅ Performance metrics
- ✅ Feature flags
- ❌ User PII
- ❌ Financial data

#### Analyst
**Read-Only Analytics**:
- ✅ All analytics & reports
- ✅ User behavior data
- ✅ Business metrics
- ❌ Modify anything
- ❌ User management

---

## 2. Dashboard Overview

### Main Dashboard

**Metrics at a Glance**:
```
┌─────────────────────────────────────────────────────┐
│              AgentForge Admin Dashboard             │
├─────────────────────────────────────────────────────┤
│                                                     │
│  📊 Platform Health                                 │
│  ────────────────                                   │
│  ● Status: Operational                              │
│  ● Uptime: 99.98%                                   │
│  ● Active Tenants: 456 (↑ 8% vs yesterday)         │
│  ● Active Users: 1,247 (↑ 12% vs yesterday)        │
│  ● API Requests/min: 4,523                         │
│                                                     │
│  💰 Business Metrics (Today)                        │
│  ──────────────────────                            │
│  Revenue: $2,341                                    │
│  New Organizations: 12                              │
│  New Users: 47                                      │
│  Conversions: 7 (14.9%)                            │
│  Churn: 2 tenants (0.44%)                          │
│                                                     │
│  🏢 Multi-Tenant Stats                              │
│  ───────────────────                                │
│  Total Organizations: 456                           │
│  └─ Free: 312 (68%)                                 │
│  └─ Starter: 89 (20%)                               │
│  └─ Professional: 42 (9%)                           │
│  └─ Business: 10 (2%)                               │
│  └─ Enterprise: 3 (<1%)                             │
│                                                     │
│  🚨 Alerts & Issues                                 │
│  ─────────────────                                  │
│  ⚠️  3 High-Priority Support Tickets                │
│  ⚠️  API latency spike detected (2 min ago)         │
│  ⚠️  2 tenants near quota limits                    │
│  ✅ All systems operational                         │
│                                                     │
│  📈 Quick Stats (Last 7 Days)                       │
│  ──────────────────────────                         │
│  Total Organizations: 456 (+12)                     │
│  Total Users: 5,234 (+234)                         │
│  Paying Customers: 456 (+12)                       │
│  MRR: $45,600 (+$1,200)                            │
│  Agents Created: 12,456 (+892)                     │
│  Messages Processed: 2.4M (+234K)                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 3. Organization (Tenant) Management

### Organization List View

**Features**:
- Search organizations (by slug, name, ID)
- Filter by:
  - Plan type (Free, Starter, Professional, Business, Enterprise)
  - Status (Active, Suspended, Canceled)
  - Signup date
  - Last activity
  - MRR
- Sort by any column
- Bulk actions

**Organization Row Display**:
```
┌──────────────────────────────────────────────────────────────┐
│ 🏢 Acme Corp (acme-corp.agentforge.com)                      │
│ Plan: Professional | Status: ✅ Active | MRR: $299           │
│ Signup: 45 days ago | Last Active: 2 hours ago               │
│ Users: 3/5 | Agents: 7/10 | Messages: 24,567/50,000         │
│ Storage: 2.1GB/10GB | LTV: $2,691                            │
│ [View] [Edit] [Suspend] [Delete] [Login As]                  │
└──────────────────────────────────────────────────────────────┘
```

### Organization Detail Page

**Overview Tab**:
```
Organization: Acme Corp
Subdomain: acme-corp.agentforge.com
Status: Active
Created: 2024-03-15

Plan Details:
├─ Current Plan: Professional ($299/mo)
├─ Next Billing: 2024-05-15
├─ MRR: $299
└─ LTV: $2,691

Resource Usage (Current Period):
├─ Users: 3/5 ⚠️ 60% used
├─ Agents: 7/10 ⚠️ 70% used
├─ Messages: 24,567/50,000 ⚠️ 49% used
├─ Storage: 2.1GB/10GB ✅ 21% used
└─ API Calls: 145K (unlimited)

Team Members:
├─ john@acme.com (Owner)
├─ sarah@acme.com (Admin)
└─ mike@acme.com (Member)
```

**Actions**:
- ✅ **View Full Details** - Complete tenant information
- ✅ **Edit Organization** - Modify settings
- ✅ **Suspend Organization** - Temporarily disable all access
- ✅ **Delete Organization** - Permanent deletion (with confirmation)
- ✅ **Login As Organization** - Impersonate (view as their tenant)
- ✅ **Change Plan** - Upgrade/downgrade
- ✅ **Add Credits** - Give free usage credits
- ✅ **Adjust Limits** - Temporary limit increases
- ✅ **Reset Password** - For any user in org
- ✅ **Send Email** - Broadcast to all org users

### Multi-Tenant Isolation Features

**Tenant Context Switcher**:
```
┌─────────────────────────────────────────────┐
│ 🔍 View as Tenant:                          │
│ [Select Organization ▼]                     │
│                                             │
│ Currently viewing: Acme Corp                │
│ ⚠️  Admin impersonation active              │
│ [Exit Impersonation]                        │
└─────────────────────────────────────────────┘
```

**Tenant Activity Monitor**:
- Real-time active users per tenant
- Current API requests per tenant
- Resource usage per tenant
- Error rates per tenant

---

## 3a. User Management (Within Organizations)

### User List View

**Features**:
- Search users (by email, name, ID, organization)
- Filter by:
  - Organization
  - Role (Owner, Admin, Member, Viewer)
  - Status (Active, Suspended)
  - Last login
- Sort by any column
- Bulk actions

**User Row Display**:
```
┌──────────────────────────────────────────────────────────────┐
│ john@acme.com | John Doe | 🏢 Acme Corp                      │
│ Role: Owner | Status: Active | Last Login: 2 hours ago       │
│ Created: 45 days ago | Email Verified: ✅                     │
│ [View] [Edit] [Suspend] [Impersonate] [Delete]               │
└──────────────────────────────────────────────────────────────┘
```

### User Detail Page

**Tabs**:

#### 1. Overview
- Full profile information
- Account status
- Subscription details
- Billing information
- Payment history
- Usage statistics

#### 2. Activity
- Login history (IP, location, device)
- Actions timeline
- API usage
- Feature usage

#### 3. Agents
- List of all agents created
- Agent performance metrics
- Conversation summaries

#### 4. Support
- Open tickets
- Ticket history
- Internal notes (visible only to admins)
- Tags/labels

#### 5. Billing
- Current plan
- Payment methods
- Invoices (download)
- Usage & overages
- Subscription history
- Refunds

#### 6. Audit Log
- All actions on this account
- Who made changes
- Timestamp
- IP address
- Changes made

### User Actions

**Available Actions**:
- ✅ **View Full Profile** - See all user data
- ✅ **Edit User** - Modify user details
- ✅ **Suspend Account** - Temporarily disable
- ✅ **Delete Account** - Permanent deletion (with confirmation)
- ✅ **Impersonate User** - Log in as user (logged & time-limited)
- ✅ **Reset Password** - Send password reset
- ✅ **Change Plan** - Upgrade/downgrade manually
- ✅ **Add Credits** - Give free usage credits
- ✅ **Add Note** - Internal note about user
- ✅ **Send Email** - Manual email to user

---

## 4. Agent Management

### Agent Explorer

**View All Agents Across All Tenants**:
- Search by name, organization, user, ID
- Filter by:
  - Organization (multi-select)
  - Status (Active, Inactive, Deleted)
  - Model (GPT-4, GPT-3.5, Claude)
  - Usage (high, medium, low)
  - Created date
- Sort by creation date, usage, performance, organization

**Agent Row Display**:
```
┌──────────────────────────────────────────────────────────────┐
│ Customer Support Bot | 🏢 Acme Corp                          │
│ Owner: john@acme.com | Status: ✅ Active | Model: GPT-4     │
│ Usage: 24.5K msgs/mo | Cost: $234/mo | Uptime: 99.8%        │
│ [View] [Pause] [Delete] [View Logs]                          │
└──────────────────────────────────────────────────────────────┘
```

### Agent Detail View

**Information Displayed**:
```
Agent: Customer Support Bot
Owner: john@example.com (Acme Corp)
Created: 2024-03-15 | Last Modified: 2024-04-10
Status: Active | Model: GPT-4

Configuration:
├─ Temperature: 0.7
├─ Max Tokens: 512
├─ System Prompt: [View/Edit]
└─ Knowledge Base: 45 documents

Usage (Last 30 Days):
├─ Conversations: 1,245
├─ Messages: 8,734
├─ Avg Response Time: 1.2s
├─ Cost: $234.56
└─ Error Rate: 0.3%

Performance Metrics:
├─ User Satisfaction: 4.5/5 (234 ratings)
├─ Resolution Rate: 78%
└─ Handoff Rate: 12%
```

**Admin Actions**:
- View full configuration
- View sample conversations
- View error logs
- Pause/unpause agent
- Delete agent (with user notification)
- Export agent data

---

## 5. Financial Management

### Revenue Dashboard

**Key Metrics**:
```
Monthly Recurring Revenue (MRR)
├─ Current MRR: $45,600
├─ New MRR: +$3,200
├─ Expansion MRR: +$800
├─ Churned MRR: -$1,400
└─ Net New MRR: +$2,600 (↑ 6.0%)

Revenue Breakdown by Plan:
├─ Free: $0 (1,234 users)
├─ Starter ($99): $14,850 (150 users)
├─ Professional ($299): $23,920 (80 users)
├─ Business ($799): $6,392 (8 users)
└─ Enterprise (Custom): $8,438 (3 users)

Lifetime Value (LTV):
├─ Average LTV: $3,245
├─ Average CAC: $389
└─ LTV:CAC Ratio: 8.3:1
```

**Features**:
- Revenue trends (daily, weekly, monthly)
- Cohort analysis
- Churn analysis
- Forecast projections
- Export financial reports
- Failed payment tracking
- Refund management

### Subscription Management

**Bulk Operations**:
- Apply discount codes
- Upgrade/downgrade plans
- Extend trials
- Grant credits
- Cancel subscriptions
- Process refunds

---

## 6. Support & Tickets

### Support Ticket Queue

**Ticket List**:
```
┌──────────────────────────────────────────────────────────┐
│ Priority | Status | Subject | User | Created | Assigned  │
├──────────────────────────────────────────────────────────┤
│ 🔴 High  | Open   | Agent not responding | acme.com | 2h | Alice │
│ 🟡 Med   | Open   | Billing question | xyz.com | 5h | -     │
│ 🟢 Low   | Open   | Feature request | test.com | 1d | Bob   │
└──────────────────────────────────────────────────────────┘
```

**Filters**:
- Priority (High, Medium, Low)
- Status (Open, In Progress, Waiting, Resolved, Closed)
- Assigned to (me, team member, unassigned)
- Tags (billing, technical, feature request)
- Date range

### Ticket Detail

**Ticket View**:
- Full conversation history
- User information (sidebar)
- Quick user actions (view profile, impersonate)
- Internal notes (not visible to customer)
- Attached files/screenshots
- Related tickets
- Time tracking

**Actions**:
- Reply to customer
- Add internal note
- Change priority
- Assign to team member
- Add tags
- Mark as resolved
- Close ticket
- Escalate
- Create related task

### Canned Responses

**Pre-written Templates**:
- Common questions
- Troubleshooting steps
- Feature explanations
- Billing information
- Apology messages
- Feature announcements

---

## 7. Analytics & Reports

### Platform Analytics

**Usage Metrics**:
```
Platform Usage (Last 30 Days)
├─ Total Agents Created: 12,456
├─ Active Agents: 8,234 (66%)
├─ Total Conversations: 234,567
├─ Total Messages: 2.4M
├─ Avg Messages/Conversation: 10.2
└─ Total Tokens Used: 456M

User Engagement:
├─ Daily Active Users (DAU): 1,247
├─ Monthly Active Users (MAU): 4,523
├─ DAU/MAU Ratio: 27.6%
├─ Avg Session Duration: 12m 34s
└─ Stickiness Score: 8.2/10

Performance:
├─ Avg API Response Time: 234ms
├─ 95th Percentile: 1.2s
├─ Error Rate: 0.12%
├─ Uptime: 99.98%
└─ Incident Count: 2 (both resolved)
```

### Business Analytics

**Funnel Analysis**:
- Signups → Activation → Paid Conversion
- Conversion rates at each stage
- Drop-off analysis
- Time to convert

**Cohort Analysis**:
- Retention by signup cohort
- Revenue by cohort
- Churn rate trends
- LTV predictions

**Feature Usage**:
- Most used features
- Least used features
- Feature adoption rates
- Feature correlations with retention

### Custom Reports

**Report Builder**:
- Select metrics
- Choose date range
- Apply filters
- Group by dimensions
- Export (CSV, PDF, Excel)
- Schedule automated delivery

**Pre-built Reports**:
- Weekly executive summary
- Monthly revenue report
- Customer health score
- Support ticket summary
- System performance report

---

## 8. System Management

### System Health

**Infrastructure Monitoring**:
```
Backend Services:
├─ API Gateway: ✅ Healthy (3 instances)
├─ Agent Runtime: ✅ Healthy (5 instances)
├─ Document Processor: ⚠️ Warning (high CPU)
├─ Analytics Service: ✅ Healthy (2 instances)
└─ Billing Service: ✅ Healthy (2 instances)

Databases:
├─ PostgreSQL (Primary): ✅ Healthy
├─ PostgreSQL (Replica): ✅ Healthy
├─ Redis Cache: ✅ Healthy
└─ Pinecone Vector DB: ✅ Healthy

External Services:
├─ OpenAI API: ✅ Operational
├─ Anthropic API: ✅ Operational
├─ Stripe: ✅ Operational
└─ AWS Services: ✅ Operational
```

**System Actions**:
- View detailed logs
- Restart services
- Scale services up/down
- Clear caches
- Run database migrations
- Trigger backups

### Feature Flags

**Flag Management**:
```
Feature Flags:
├─ ✅ new_agent_builder (100% rollout)
├─ 🟡 voice_agents (10% rollout - testing)
├─ ❌ multi_agent_workflows (disabled)
└─ 🟡 gpt4_turbo (50% rollout)
```

**Actions per Flag**:
- Enable/disable globally
- Gradual rollout (% of users)
- Target specific users
- Target specific plans
- A/B testing setup
- View metrics by flag

### Configuration Management

**System Settings**:
- API rate limits
- Default resource quotas
- LLM provider settings
- Email templates
- Feature pricing
- Legal documents (ToS, Privacy Policy)
- Maintenance mode

---

## 9. Content Moderation

### Content Review Queue

**Flagged Content**:
- AI-generated content flagged by filters
- User-reported conversations
- Suspicious agent behaviors
- Policy violations

**Review Interface**:
```
┌──────────────────────────────────────────────────────┐
│ Agent: "Crypto Investment Bot"                       │
│ Owner: suspicious@email.com                          │
│ Flagged: Potential scam/fraud                        │
│                                                       │
│ Sample Conversation:                                 │
│ User: "Tell me about this investment"                │
│ Agent: "Guaranteed 10x returns in 30 days..."        │
│                                                       │
│ AI Confidence: High Risk (0.89)                      │
│ Reason: Financial scam indicators                    │
│                                                       │
│ [Approve] [Suspend Agent] [Suspend User] [Delete]    │
└──────────────────────────────────────────────────────┘
```

**Actions**:
- Approve content
- Delete content
- Suspend agent
- Suspend user
- Send warning
- Add to watchlist

### Policy Management

**Abuse Categories**:
- Spam/phishing
- Illegal content
- Harassment
- Misinformation
- Copyright infringement
- Adult content
- Violence

**Automated Filters**:
- Keyword detection
- Pattern matching
- AI-based classification
- Rate limiting
- Suspicious behavior detection

---

## 10. Developer Tools

### API Management

**API Keys**:
- View all API keys
- Revoke keys
- Monitor usage per key
- Rate limit per key

**API Monitoring**:
```
API Endpoints (Last Hour):
├─ POST /agents/{id}/chat: 45K requests (Avg: 234ms)
├─ GET /agents: 12K requests (Avg: 89ms)
├─ POST /agents: 2.3K requests (Avg: 456ms)
└─ GET /conversations: 8.9K requests (Avg: 123ms)

Error Rates:
├─ 4xx Errors: 0.8% (mostly 429 rate limits)
├─ 5xx Errors: 0.1% (database timeout)
└─ Top Errors: [View Details]
```

### Log Viewer

**Centralized Logging**:
- Filter by:
  - Service (API, Runtime, Documents, etc.)
  - Level (Debug, Info, Warning, Error, Critical)
  - Time range
  - User/Agent ID
  - Keyword search
- Real-time tail
- Download logs
- Advanced search with regex

### Error Tracking

**Error Dashboard**:
- Recent errors grouped by type
- Error frequency trends
- Stack traces
- Affected users
- Resolution status
- Link to GitHub issues

---

## 11. Communication Tools

### Broadcast Messages

**Send Platform-Wide Announcements**:
- In-app banners
- Email campaigns
- System notifications

**Targeting Options**:
- All users
- Specific plan tiers
- Active users only
- Inactive users (win-back)
- Custom segments

**Message Types**:
- Maintenance notifications
- New feature announcements
- Policy updates
- Service updates
- Promotional offers

### Email Templates

**Template Management**:
- Welcome email
- Email verification
- Password reset
- Subscription confirmation
- Invoice emails
- Feature announcements
- Upgrade prompts
- Churn prevention

**Template Editor**:
- WYSIWYG editor
- Variable insertion
- Preview with sample data
- Test send
- A/B testing

---

## 12. Security & Compliance

### Security Dashboard

**Security Metrics**:
```
Security Overview:
├─ Failed Login Attempts (24h): 234
├─ Suspicious Activities: 12 (under review)
├─ DDoS Attempts Blocked: 45
├─ Malware Scans: ✅ Clean
└─ SSL Certificates: ✅ Valid (expires in 87 days)

Recent Security Events:
├─ 2024-04-10 15:34: Brute force attempt blocked (IP: xxx.xxx)
├─ 2024-04-10 12:15: Unusual API usage pattern detected
└─ 2024-04-09 09:45: New admin login from unknown location
```

### Compliance Management

**Compliance Status**:
- GDPR compliance: ✅ Active
- CCPA compliance: ✅ Active
- SOC 2: 🟡 In Progress (audit Q3)
- HIPAA: ❌ Not Required
- PCI DSS: ✅ Stripe handles

**Data Subject Requests**:
- Data export requests
- Data deletion requests
- Request status tracking
- Automated fulfillment
- Audit trail

### Audit Logs

**System Audit Log**:
- All admin actions
- User impersonations
- System configuration changes
- Database operations
- Security events
- Export for compliance

---

## 13. Testing & QA Tools

### Test Users

**Create Test Accounts**:
- Pre-configured test users
- Different plan tiers
- Pre-loaded data
- Reset to defaults
- Isolated from production metrics

### Sandbox Environment

**Testing Tools**:
- API test console
- Agent simulator
- Conversation simulator
- Load testing tools
- Error injection

---

## 14. Admin Platform Technical Specs

### Technology Stack

**Backend**:
```typescript
// Admin API (separate from main API)
@Module({
  controllers: [
    AdminUsersController,
    AdminAnalyticsController,
    AdminSystemController,
  ],
  providers: [
    AdminAuthGuard,
    AdminAuditLogger,
  ],
})
export class AdminModule {}
```

**Frontend**:
- Next.js 14 (Admin portal)
- React 18
- TailwindCSS
- Recharts (analytics visualization)
- React Table (data tables)

**Authentication**:
- Separate admin authentication
- 2FA required for all admin users
- Session timeout (30 minutes)
- IP whitelist option
- Audit logging for all actions

### Security Measures

**Access Control**:
- Role-based permissions
- Resource-based permissions
- Action logging
- IP restrictions
- Time-based access

**Data Protection**:
- Encrypted at rest
- Encrypted in transit
- PII masking in logs
- Secure impersonation (time-limited, logged)
- No storing of user passwords

---

## 15. Mobile Admin App (Future)

**Mobile Features** (Phase 3):
- Real-time alerts
- Quick metrics view
- Support ticket responses
- User search
- System status
- Push notifications for critical issues

---

## 16. Admin Platform Roadmap

### Phase 1: MVP (Months 1-3)
- [ ] User management (view, search, edit)
- [ ] Basic dashboard metrics
- [ ] Support ticket system
- [ ] System health monitoring
- [ ] Audit logging
- [ ] Admin authentication

### Phase 2: Growth (Months 4-6)
- [ ] Advanced analytics
- [ ] Revenue dashboard
- [ ] Content moderation
- [ ] Feature flags
- [ ] Email templates
- [ ] Broadcast messages

### Phase 3: Scale (Months 7-12)
- [ ] Custom reports
- [ ] API management tools
- [ ] Advanced security
- [ ] Compliance tools
- [ ] Mobile app
- [ ] Automated workflows

---

## 17. Admin Platform UI Mockup

### Main Navigation

```
┌──────────────────────────────────────────────────────────┐
│  🏢 AgentForge Admin                    🔔 ⚙️ 👤 John    │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  [Dashboard] [Users] [Agents] [Support] [Analytics]      │
│  [Billing] [System] [Security] [Settings]                │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │                                                   │    │
│  │              Content Area                         │    │
│  │                                                   │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

---

## 18. Access URL Structure

**URLs**:
- Main App: `app.agentforge.com` (customers)
- Admin Panel: `admin.agentforge.com` (internal team)
- API: `api.agentforge.com` (public API)
- Admin API: `admin-api.agentforge.com` (admin backend)

---

## Next Steps

1. **Review this spec** and provide feedback
2. **Prioritize features** for MVP
3. **Add to roadmap** (likely Phase 2-3)
4. **Assign resources** when ready to build

---

**Would you like me to:**
- Add this to the main roadmap?
- Create detailed UI mockups?
- Add specific features you need?
- Integrate with the existing architecture docs?
