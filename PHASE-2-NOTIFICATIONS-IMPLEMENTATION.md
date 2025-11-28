# Phase 2: Notifications System Implementation Guide

## Overview

Build a comprehensive notification system for real-time alerts, updates, and user engagement.

**Timeline:** 2 weeks
**Priority:** MEDIUM
**Dependencies:** WebSocket (already available), Email service (already built)

---

## Goals

### Primary Objectives
1. ✅ Real-time in-app notifications
2. ✅ Email notifications
3. ✅ Notification preferences management
4. ✅ WebSocket integration
5. ✅ Notification history and read status

### Success Metrics
- < 500ms notification delivery
- 95% email delivery rate
- 70% notification open rate
- Zero missed critical alerts

---

## Architecture

### Tech Stack
- **Real-time:** WebSocket (Socket.IO)
- **Email:** NodeMailer (already in email service)
- **Storage:** PostgreSQL
- **Queue:** Bull (for async delivery)

### Component Structure

```
backend/src/modules/notifications/
├── notifications.controller.ts    # REST API
├── notifications.service.ts       # Core logic
├── notifications.gateway.ts       # WebSocket
├── notifications.module.ts        # Module config
├── email-notifier.service.ts      # Email delivery
├── dto/
│   ├── notification.dto.ts
│   └── preferences.dto.ts
└── entities/
    ├── notification.entity.ts
    └── notification-preference.entity.ts
```

---

## Database Schema

### Notification Entity

```typescript
@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column()
  type: string; // system, billing, agent, workflow, team

  @Column()
  category: string; // info, success, warning, error

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'jsonb', nullable: true })
  data: any; // Additional context

  @Column({ nullable: true })
  link: string; // Action URL

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @Column({ name: 'read_at', nullable: true })
  readAt: Date;

  @Column({ name: 'is_archived', default: false })
  isArchived: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Notification Preference Entity

```typescript
@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @Column({ name: 'notification_type' })
  notificationType: string;

  @Column({ name: 'in_app_enabled', default: true })
  inAppEnabled: boolean;

  @Column({ name: 'email_enabled', default: true })
  emailEnabled: boolean;

  @Column({ name: 'email_frequency', default: 'immediate' })
  emailFrequency: string; // immediate, daily, weekly, never

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

---

## Implementation Steps

### Week 1: Core Notification System

#### Day 1-2: Backend Infrastructure
```typescript
// notifications/notifications.service.ts

@Injectable()
export class NotificationsService {
  async create(
    userId: string,
    notification: CreateNotificationDto,
  ): Promise<Notification> {
    // 1. Create notification in DB
    // 2. Check user preferences
    // 3. Send via enabled channels
    // 4. Emit WebSocket event
    // 5. Queue email if needed
  }

  async sendToUser(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    data?: any,
  ): Promise<void> {
    // Helper for common pattern
  }

  async markAsRead(
    notificationId: string,
    userId: string,
  ): Promise<void> {
    // Update read status
  }

  async markAllAsRead(userId: string): Promise<void> {
    // Bulk update
  }

  async getUnreadCount(userId: string): Promise<number> {
    // Quick count query
  }
}
```

#### Day 3-4: WebSocket Gateway
```typescript
// notifications/notifications.gateway.ts

@WebSocketGateway({ namespace: '/notifications' })
export class NotificationsGateway {
  @WebSocketServer()
  server: Server;

  async sendToUser(userId: string, notification: Notification): Promise<void> {
    this.server.to(`user:${userId}`).emit('notification', notification);
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ): void {
    client.join(`user:${data.userId}`);
  }

  @SubscribeMessage('markAsRead')
  async handleMarkAsRead(
    @MessageBody() data: { notificationId: string },
  ): Promise<void> {
    // Mark notification as read
    // Broadcast update
  }
}
```

#### Day 5: Email Integration
```typescript
// notifications/email-notifier.service.ts

@Injectable()
export class EmailNotifierService {
  async sendNotificationEmail(
    user: User,
    notification: Notification,
  ): Promise<void> {
    // Use existing email service
    // Template-based emails
    // Include notification details
    // Add action link
  }

  async sendDigestEmail(
    user: User,
    notifications: Notification[],
  ): Promise<void> {
    // Daily/weekly digest
    // Group by category
    // Summary format
  }
}
```

### Week 2: UI & Preferences

#### Frontend Components
```typescript
// frontend/src/components/notifications/

// NotificationBell.tsx
- Bell icon with badge
- Unread count
- Dropdown panel
- Mark all as read

// NotificationItem.tsx
- Icon by type
- Title and message
- Timestamp
- Read/unread indicator
- Action link

// NotificationPanel.tsx
- List of notifications
- Filter by type
- Pagination
- Empty state

// NotificationPreferences.tsx
- Toggle switches
- Email frequency selector
- Save preferences
```

#### Notification Center Page
```typescript
// frontend/src/app/(dashboard)/dashboard/notifications/page.tsx

export default function NotificationsPage() {
  return (
    <div>
      <NotificationFilters />
      <NotificationList />
      <NotificationSettings />
    </div>
  );
}
```

---

## Notification Types

### System Notifications

```typescript
export enum NotificationType {
  // System
  SYSTEM_MAINTENANCE = 'system.maintenance',
  SYSTEM_UPDATE = 'system.update',
  
  // Billing
  PAYMENT_SUCCESS = 'billing.payment_success',
  PAYMENT_FAILED = 'billing.payment_failed',
  TRIAL_ENDING = 'billing.trial_ending',
  USAGE_LIMIT = 'billing.usage_limit',
  
  // Agent
  AGENT_ERROR = 'agent.error',
  AGENT_DEPLOYED = 'agent.deployed',
  HIGH_ERROR_RATE = 'agent.high_error_rate',
  
  // Workflow
  WORKFLOW_COMPLETED = 'workflow.completed',
  WORKFLOW_FAILED = 'workflow.failed',
  
  // Team
  USER_INVITED = 'team.user_invited',
  USER_JOINED = 'team.user_joined',
  ROLE_CHANGED = 'team.role_changed',
  
  // Knowledge Base
  DOCUMENT_PROCESSED = 'kb.document_processed',
  SYNC_COMPLETED = 'kb.sync_completed',
  SYNC_FAILED = 'kb.sync_failed',
}
```

### Notification Templates

```typescript
export const NOTIFICATION_TEMPLATES = {
  [NotificationType.PAYMENT_FAILED]: {
    title: 'Payment Failed',
    message: 'Your payment method was declined. Please update your billing information.',
    category: 'error',
    link: '/dashboard/billing',
  },
  [NotificationType.TRIAL_ENDING]: {
    title: 'Trial Ending Soon',
    message: 'Your trial ends in {days} days. Upgrade now to continue using all features.',
    category: 'warning',
    link: '/dashboard/billing',
  },
  [NotificationType.AGENT_DEPLOYED]: {
    title: 'Agent Deployed',
    message: 'Your agent "{agentName}" has been successfully deployed.',
    category: 'success',
    link: '/dashboard/agents/{agentId}',
  },
  // ... more templates
};
```

---

## API Endpoints

```typescript
// Get notifications
GET /api/v1/notifications
Query: {
  page: number;
  limit: number;
  type?: string;
  isRead?: boolean;
}
Response: {
  notifications: Notification[];
  total: number;
  unreadCount: number;
}

// Get unread count
GET /api/v1/notifications/unread-count
Response: {
  count: number;
}

// Mark as read
PATCH /api/v1/notifications/:id/read

// Mark all as read
POST /api/v1/notifications/mark-all-read

// Delete notification
DELETE /api/v1/notifications/:id

// Get preferences
GET /api/v1/notifications/preferences
Response: {
  preferences: NotificationPreference[];
}

// Update preferences
PUT /api/v1/notifications/preferences
Body: {
  type: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  emailFrequency: string;
}
```

---

## UI Design

### Notification Bell

```
┌─────────────────────────────────────────────┐
│  🔔 (3)                                     │
│  ┌───────────────────────────────────────┐ │
│  │  Notifications               Mark all │ │
│  ├───────────────────────────────────────┤ │
│  │  ⚠️  Payment Failed                   │ │
│  │     Update your payment method        │ │
│  │     2 minutes ago                     │ │
│  ├───────────────────────────────────────┤ │
│  │  ✅  Agent Deployed                   │ │
│  │     Support Bot is now live           │ │
│  │     10 minutes ago                    │ │
│  ├───────────────────────────────────────┤ │
│  │  👤  New Team Member                  │ │
│  │     John joined your team             │ │
│  │     1 hour ago                        │ │
│  ├───────────────────────────────────────┤ │
│  │              View All                 │ │
│  └───────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Notification Preferences

```
┌─────────────────────────────────────────────┐
│  Notification Preferences                   │
├─────────────────────────────────────────────┤
│                                             │
│  System Notifications                       │
│  ☑ In-app    ☑ Email [Immediate ▼]        │
│                                             │
│  Billing Alerts                             │
│  ☑ In-app    ☑ Email [Immediate ▼]        │
│                                             │
│  Agent Updates                              │
│  ☑ In-app    ☐ Email [Daily ▼]            │
│                                             │
│  Workflow Results                           │
│  ☑ In-app    ☐ Email [Never ▼]            │
│                                             │
│  Team Activity                              │
│  ☑ In-app    ☑ Email [Daily ▼]            │
│                                             │
│           [Cancel]  [Save Preferences]      │
└─────────────────────────────────────────────┘
```

---

## WebSocket Integration

### Client-Side Implementation

```typescript
// frontend/src/hooks/useNotifications.ts

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export function useNotifications(userId: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const newSocket = io(`${process.env.NEXT_PUBLIC_API_URL}/notifications`, {
      auth: { token: getAuthToken() },
    });

    newSocket.emit('subscribe', { userId });

    newSocket.on('notification', (notification: Notification) => {
      setNotifications(prev => [notification, ...prev]);
      // Show toast notification
      showToast(notification);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [userId]);

  return { notifications };
}
```

---

## Email Digest System

### Daily Digest

```typescript
// Cron job for daily digest
@Cron('0 9 * * *') // 9 AM daily
async sendDailyDigests(): Promise<void> {
  const users = await this.getUsersWithDailyDigest();
  
  for (const user of users) {
    const notifications = await this.getUnreadNotifications(
      user.id,
      'yesterday',
    );
    
    if (notifications.length > 0) {
      await this.emailNotifier.sendDigestEmail(user, notifications);
    }
  }
}
```

### Digest Email Template

```html
<!DOCTYPE html>
<html>
<head>
  <title>Your Daily Digest</title>
</head>
<body>
  <h1>Your Daily Digest</h1>
  <p>Here's what happened in the last 24 hours:</p>
  
  <h2>🚨 Important Updates (3)</h2>
  <ul>
    <li>Payment Failed - Update payment method</li>
    <li>Agent Error - Support Bot has errors</li>
  </ul>
  
  <h2>✅ Successes (5)</h2>
  <ul>
    <li>Workflow Completed - Lead Capture</li>
    <li>Document Processed - User Guide.pdf</li>
  </ul>
  
  <a href="https://app.objecta-labs.com/notifications">View All</a>
</body>
</html>
```

---

## Testing Checklist

### Functional Tests
- [ ] Create notification
- [ ] Real-time delivery via WebSocket
- [ ] Email notification delivery
- [ ] Mark as read
- [ ] Preferences update
- [ ] Daily digest generation

### Integration Tests
- [ ] Multiple users simultaneously
- [ ] WebSocket reconnection
- [ ] Email retry on failure
- [ ] Preference enforcement

### Performance Tests
- [ ] 1000+ notifications per user
- [ ] 100+ concurrent WebSocket connections
- [ ] Notification delivery < 500ms

---

## Best Practices

### Notification Design
- **Be actionable:** Include clear action links
- **Be timely:** Send immediately for critical issues
- **Be relevant:** Respect user preferences
- **Be clear:** Use simple, direct language

### Performance
- Index notifications by user_id and is_read
- Use pagination for notification lists
- Cache unread counts in Redis
- Clean up old notifications (retention policy)

---

## Next Steps

After completing notifications:
1. Review [Admin Platform Implementation](./PHASE-2-ADMIN-IMPLEMENTATION.md)
2. Add notification analytics
3. Integrate with mobile push (future)
4. Add SMS notifications (future)

---

## Resources

- [Socket.IO Documentation](https://socket.io/docs/)
- [Push Notification Best Practices](https://onesignal.com/blog/push-notification-best-practices/)
- [Email Templates](https://github.com/sendgrid/email-templates)
