# Phase 2: Analytics & Insights Implementation Guide

## Overview

Build comprehensive analytics dashboards to provide actionable insights for users and the business.

**Timeline:** 4 weeks
**Priority:** HIGH
**Dependencies:** Usage tracking (from billing), activity logs (from team)

---

## Goals

### Primary Objectives
1. ✅ Platform-wide analytics dashboard
2. ✅ Agent performance metrics
3. ✅ Usage analytics and trends
4. ✅ Custom reports and exports
5. ✅ Real-time metrics

### Success Metrics
- Dashboard loads in < 2 seconds
- 60% of users check analytics weekly
- 90% data accuracy
- Support 1M+ events per day

---

## Architecture

### Analytics Stack
- **Time-series Data:** TimescaleDB (PostgreSQL extension)
- **Caching:** Redis for hot metrics
- **Aggregation:** Daily cron jobs
- **Visualization:** Recharts (React)
- **Export:** CSV, PDF reports

### Component Structure

```
backend/src/modules/analytics/
├── analytics.controller.ts      # API endpoints
├── analytics.service.ts         # Core analytics logic
├── analytics.module.ts          # Module config
├── metrics.service.ts           # Metrics collection
├── reports.service.ts           # Report generation
├── aggregation.service.ts       # Data aggregation
├── dto/
│   ├── analytics-query.dto.ts
│   └── report.dto.ts
└── entities/
    ├── analytics-event.entity.ts
    ├── daily-metrics.entity.ts
    └── report.entity.ts
```

---

## Database Schema

### Analytics Event Entity

```typescript
@Entity('analytics_events')
export class AnalyticsEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'event_type' })
  eventType: string; // message_sent, agent_created, workflow_executed

  @Column({ name: 'resource_type' })
  resourceType: string; // agent, workflow, conversation

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ type: 'jsonb', default: '{}' })
  properties: any; // Event-specific data

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// Indexes for performance
CREATE INDEX idx_analytics_events_org_created ON analytics_events(organization_id, created_at);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_resource ON analytics_events(resource_type, resource_id);
```

### Daily Metrics Entity (Aggregated)

```typescript
@Entity('daily_metrics')
export class DailyMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'total_messages', default: 0 })
  totalMessages: number;

  @Column({ name: 'total_conversations', default: 0 })
  totalConversations: number;

  @Column({ name: 'total_tokens', default: 0 })
  totalTokens: number;

  @Column({ name: 'unique_users', default: 0 })
  uniqueUsers: number;

  @Column({ name: 'avg_response_time', type: 'decimal', default: 0 })
  avgResponseTime: number;

  @Column({ name: 'agent_count', default: 0 })
  agentCount: number;

  @Column({ name: 'workflow_executions', default: 0 })
  workflowExecutions: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Agent Metrics Entity

```typescript
@Entity('agent_metrics')
export class AgentMetrics {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'agent_id' })
  agentId: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ name: 'conversation_count', default: 0 })
  conversationCount: number;

  @Column({ name: 'message_count', default: 0 })
  messageCount: number;

  @Column({ name: 'avg_response_time', type: 'decimal' })
  avgResponseTime: number;

  @Column({ name: 'total_tokens', default: 0 })
  totalTokens: number;

  @Column({ name: 'error_count', default: 0 })
  errorCount: number;

  @Column({ name: 'satisfaction_score', type: 'decimal', nullable: true })
  satisfactionScore: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

---

## Implementation Steps

### Week 1: Data Collection Infrastructure

#### Day 1-2: Event Tracking System
```typescript
// analytics/metrics.service.ts

@Injectable()
export class MetricsService {
  async trackEvent(
    organizationId: string,
    eventType: string,
    properties: any,
  ): Promise<void> {
    // 1. Validate event
    // 2. Store in analytics_events table
    // 3. Update real-time counters in Redis
    // 4. Emit to WebSocket for live updates
  }

  async incrementCounter(
    key: string,
    value: number = 1,
  ): Promise<void> {
    // Redis INCR for real-time metrics
  }

  async getRealtimeMetrics(
    organizationId: string,
  ): Promise<RealtimeMetrics> {
    // Fetch from Redis cache
  }
}
```

#### Day 3-4: Data Aggregation
```typescript
// analytics/aggregation.service.ts

@Injectable()
export class AggregationService {
  @Cron('0 2 * * *') // Run at 2 AM daily
  async aggregateDailyMetrics(): Promise<void> {
    // 1. Get all organizations
    // 2. For each org, aggregate yesterday's data
    // 3. Store in daily_metrics table
    // 4. Calculate agent-specific metrics
    // 5. Clean up old raw events (retention policy)
  }

  async aggregateAgentMetrics(
    agentId: string,
    date: Date,
  ): Promise<AgentMetrics> {
    // Aggregate metrics for a specific agent
  }
}
```

#### Day 5: Testing
- Event tracking tests
- Aggregation logic tests
- Performance tests with large datasets

### Week 2: Analytics API & Queries

#### Core Analytics Endpoints
```typescript
// analytics/analytics.controller.ts

@Controller('api/v1/analytics')
export class AnalyticsController {
  // Overview dashboard
  @Get('overview')
  async getOverview(
    @CurrentUser() user: User,
    @Query() query: AnalyticsQueryDto,
  ): Promise<OverviewMetrics> {
    // Return key metrics for date range
  }

  // Agent analytics
  @Get('agents/:agentId')
  async getAgentAnalytics(
    @Param('agentId') agentId: string,
    @Query() query: AnalyticsQueryDto,
  ): Promise<AgentAnalytics> {
    // Agent-specific metrics
  }

  // Usage trends
  @Get('usage')
  async getUsageTrends(
    @CurrentUser() user: User,
    @Query() query: AnalyticsQueryDto,
  ): Promise<UsageTrends> {
    // Time-series usage data
  }

  // Conversation analytics
  @Get('conversations')
  async getConversationAnalytics(
    @CurrentUser() user: User,
    @Query() query: AnalyticsQueryDto,
  ): Promise<ConversationAnalytics> {
    // Conversation patterns and insights
  }

  // Top performing agents
  @Get('top-agents')
  async getTopAgents(
    @CurrentUser() user: User,
    @Query() query: TopAgentsQueryDto,
  ): Promise<AgentRanking[]> {
    // Ranked by performance metrics
  }
}
```

### Week 3: Frontend Dashboard

#### Dashboard Components
```typescript
// frontend/src/components/analytics/

// OverviewDashboard.tsx
- Key metrics cards (messages, conversations, users)
- Trend indicators (% change)
- Quick insights

// UsageChart.tsx
- Time-series line chart
- Multiple metrics overlay
- Date range selector

// AgentPerformanceTable.tsx
- Sortable table
- Performance indicators
- Click to details

// ConversationInsights.tsx
- Popular topics
- User satisfaction
- Response times

// ExportButton.tsx
- CSV export
- PDF report generation
- Scheduled reports
```

#### Analytics Pages
```typescript
// frontend/src/app/(dashboard)/dashboard/analytics/

// page.tsx - Overview Dashboard
├── Key metrics cards
├── Usage trends chart
├── Top agents table
└── Recent activity

// agents/page.tsx - Agent Analytics
├── Agent performance comparison
├── Individual agent metrics
├── Time-series charts
└── Export options

// usage/page.tsx - Usage Analytics
├── Resource usage breakdown
├── Cost analysis
├── Quota tracking
└── Predictions

// reports/page.tsx - Custom Reports
├── Report builder
├── Saved reports
├── Schedule reports
└── Report history
```

### Week 4: Advanced Features & Polish

#### Advanced Analytics Features
1. **Predictive Analytics**
   - Usage forecasting
   - Churn prediction
   - Growth projections

2. **Custom Reports**
   - Report builder UI
   - Save and share reports
   - Scheduled email reports

3. **Real-time Dashboard**
   - WebSocket updates
   - Live metrics
   - Alert notifications

4. **Export & Integration**
   - CSV/Excel export
   - PDF reports
   - API access to analytics
   - Webhook notifications

---

## Analytics Metrics Definitions

### Platform Metrics

```typescript
export interface OverviewMetrics {
  // Current period
  totalMessages: number;
  totalConversations: number;
  activeAgents: number;
  uniqueUsers: number;
  
  // Comparisons (vs previous period)
  messagesChange: number; // %
  conversationsChange: number; // %
  usersChange: number; // %
  
  // Performance
  avgResponseTime: number; // ms
  errorRate: number; // %
  satisfactionScore: number; // 1-5
  
  // Usage
  tokenUsage: number;
  storageUsed: number; // bytes
  apiCalls: number;
}
```

### Agent Metrics

```typescript
export interface AgentAnalytics {
  agentId: string;
  agentName: string;
  
  // Volume
  conversationCount: number;
  messageCount: number;
  uniqueUsers: number;
  
  // Performance
  avgResponseTime: number;
  errorRate: number;
  satisfactionScore: number;
  
  // Efficiency
  avgConversationLength: number;
  resolutionRate: number;
  handoffRate: number;
  
  // Trends (7 days)
  conversationTrend: TimeSeriesData[];
  responseTrend: TimeSeriesData[];
  satisfactionTrend: TimeSeriesData[];
}
```

### Usage Metrics

```typescript
export interface UsageTrends {
  period: DateRange;
  
  // Time-series data
  dailyMessages: TimeSeriesData[];
  dailyConversations: TimeSeriesData[];
  dailyTokens: TimeSeriesData[];
  
  // Resource usage
  storageBreakdown: {
    documents: number;
    uploads: number;
    backups: number;
  };
  
  // Cost estimates
  estimatedCost: number;
  costByResource: {
    llmCalls: number;
    storage: number;
    bandwidth: number;
  };
}
```

---

## Dashboard UI Design

### Overview Dashboard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Analytics Overview                    [Last 30 Days ▼]     │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Messages │  │   Convos │  │  Agents  │  │  Users   │   │
│  │  12,543  │  │   1,234  │  │    15    │  │   456    │   │
│  │  ↑ 23%   │  │  ↑ 18%   │  │  ↑ 3    │  │  ↑ 12%   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Usage Trends                                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │     📈 [Chart: Messages over time]                   │   │
│  │                                                       │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│  Top Performing Agents                    [View All →]     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Agent Name      │ Messages │ Avg Time │ Satisfaction│   │
│  │ Support Bot     │  5,234   │  1.2s    │   4.8 ⭐   │   │
│  │ Sales Assistant │  3,456   │  0.9s    │   4.7 ⭐   │   │
│  │ FAQ Helper      │  2,123   │  0.5s    │   4.9 ⭐   │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Event Tracking Implementation

### Events to Track

```typescript
export enum AnalyticsEventType {
  // Agent events
  AGENT_CREATED = 'agent.created',
  AGENT_UPDATED = 'agent.updated',
  AGENT_DELETED = 'agent.deleted',
  AGENT_DEPLOYED = 'agent.deployed',
  
  // Conversation events
  CONVERSATION_STARTED = 'conversation.started',
  CONVERSATION_ENDED = 'conversation.ended',
  MESSAGE_SENT = 'message.sent',
  MESSAGE_RECEIVED = 'message.received',
  
  // Workflow events
  WORKFLOW_CREATED = 'workflow.created',
  WORKFLOW_EXECUTED = 'workflow.executed',
  WORKFLOW_FAILED = 'workflow.failed',
  
  // Knowledge base events
  DOCUMENT_UPLOADED = 'document.uploaded',
  DOCUMENT_DELETED = 'document.deleted',
  SEARCH_PERFORMED = 'search.performed',
  
  // User events
  USER_LOGGED_IN = 'user.logged_in',
  USER_INVITED = 'user.invited',
  
  // Billing events
  SUBSCRIPTION_CREATED = 'subscription.created',
  PAYMENT_SUCCEEDED = 'payment.succeeded',
  PAYMENT_FAILED = 'payment.failed',
}
```

### Tracking Helper

```typescript
// Common pattern for tracking events
export class AnalyticsTracker {
  constructor(private metricsService: MetricsService) {}

  trackAgentMessage(
    organizationId: string,
    agentId: string,
    responseTime: number,
    tokens: number,
  ): void {
    this.metricsService.trackEvent(organizationId, AnalyticsEventType.MESSAGE_SENT, {
      agentId,
      responseTime,
      tokens,
    });
  }

  trackConversation(
    organizationId: string,
    agentId: string,
    duration: number,
    messageCount: number,
  ): void {
    this.metricsService.trackEvent(organizationId, AnalyticsEventType.CONVERSATION_ENDED, {
      agentId,
      duration,
      messageCount,
    });
  }
}
```

---

## Performance Optimization

### Caching Strategy
```typescript
// Cache hot metrics in Redis
const cacheKeys = {
  overview: (orgId: string) => `analytics:overview:${orgId}`,
  agent: (agentId: string) => `analytics:agent:${agentId}`,
  realtime: (orgId: string) => `analytics:realtime:${orgId}`,
};

// TTL: 5 minutes for overview, 1 minute for realtime
const cacheTTL = {
  overview: 300,
  realtime: 60,
};
```

### Query Optimization
```sql
-- Use materialized views for expensive queries
CREATE MATERIALIZED VIEW agent_performance_summary AS
SELECT 
  a.id as agent_id,
  a.name as agent_name,
  COUNT(DISTINCT c.id) as conversation_count,
  COUNT(m.id) as message_count,
  AVG(m.response_time_ms) as avg_response_time,
  AVG(f.rating) as avg_satisfaction
FROM agents a
LEFT JOIN conversations c ON a.id = c.agent_id
LEFT JOIN messages m ON c.id = m.conversation_id
LEFT JOIN feedback f ON m.id = f.message_id
WHERE m.created_at > NOW() - INTERVAL '30 days'
GROUP BY a.id, a.name;

-- Refresh periodically
REFRESH MATERIALIZED VIEW agent_performance_summary;
```

---

## Testing Checklist

### Functional Tests
- [ ] Event tracking accuracy
- [ ] Data aggregation correctness
- [ ] Dashboard data display
- [ ] Export functionality
- [ ] Real-time updates

### Performance Tests
- [ ] Handle 1M+ events per day
- [ ] Dashboard loads < 2s
- [ ] Aggregation completes < 5 min
- [ ] Concurrent users (100+)

### Data Quality Tests
- [ ] No duplicate events
- [ ] Accurate calculations
- [ ] Proper time zone handling
- [ ] Data retention policy

---

## Next Steps

After completing analytics:
1. Review [Admin Platform Implementation](./PHASE-2-ADMIN-IMPLEMENTATION.md)
2. Integrate analytics with billing (usage-based)
3. Add predictive features
4. Create customer-facing reports

---

## Resources

- [Recharts Documentation](https://recharts.org/)
- [TimescaleDB Guide](https://docs.timescale.com/)
- [Analytics Best Practices](https://segment.com/academy/collecting-data/)
