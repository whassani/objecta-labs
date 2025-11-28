# Phase 2: Team Collaboration Implementation Guide

## Overview

Enable multiple users per organization with role-based permissions, team invitations, and activity tracking.

**Timeline:** 3 weeks
**Priority:** HIGH
**Dependencies:** Auth system (already built)

---

## Goals

### Primary Objectives
1. ✅ Support multiple users per organization
2. ✅ Implement team invitation system
3. ✅ Enhanced role-based permissions
4. ✅ Activity tracking and audit logs
5. ✅ Team member management UI

### Success Metrics
- Support 50+ users per organization
- < 2 seconds team page load time
- 80% invitation acceptance rate
- Zero permission bypass incidents

---

## Architecture

### Current State
- ✅ Organizations table exists
- ✅ Users table with organizationId
- ✅ Basic RBAC with roles and permissions
- ✅ Role entities and guards

### What Needs Enhancement
- ❌ Team invitation flow
- ❌ Multi-user management UI
- ❌ Activity tracking for team actions
- ❌ Team member profiles
- ❌ Last active tracking

---

## Database Schema

### Team Invitation Entity

```typescript
@Entity('team_invitations')
export class TeamInvitation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'invited_by' })
  invitedBy: string; // User ID

  @Column()
  email: string;

  @Column()
  role: string; // Role to assign

  @Column({ unique: true })
  token: string;

  @Column()
  status: string; // pending, accepted, expired, revoked

  @Column({ name: 'expires_at' })
  expiresAt: Date;

  @Column({ name: 'accepted_at', nullable: true })
  acceptedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### Activity Log Entity (Enhanced)

```typescript
@Entity('activity_logs')
export class ActivityLog {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'organization_id' })
  organizationId: string;

  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ name: 'actor_name' })
  actorName: string;

  @Column({ name: 'action_type' })
  actionType: string; // created, updated, deleted, invited, etc.

  @Column({ name: 'resource_type' })
  resourceType: string; // agent, workflow, user, etc.

  @Column({ name: 'resource_id', nullable: true })
  resourceId: string;

  @Column({ name: 'resource_name', nullable: true })
  resourceName: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any; // Additional context

  @Column({ name: 'ip_address', nullable: true })
  ipAddress: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
```

### User Entity Enhancement

```typescript
// Add to existing User entity
@Column({ name: 'last_active_at', nullable: true })
lastActiveAt: Date;

@Column({ name: 'avatar_url', nullable: true })
avatarUrl: string;

@Column({ name: 'job_title', nullable: true })
jobTitle: string;

@Column({ type: 'jsonb', default: '{}' })
preferences: any; // User preferences
```

---

## Implementation Steps

### Week 1: Team Invitation System

#### Day 1-2: Invitation Backend
```typescript
// team/invitations.service.ts

@Injectable()
export class InvitationsService {
  async inviteUser(
    organizationId: string,
    invitedBy: string,
    email: string,
    role: string,
  ): Promise<TeamInvitation> {
    // 1. Check if user already exists
    // 2. Check organization limits
    // 3. Generate secure token
    // 4. Create invitation
    // 5. Send invitation email
    // 6. Log activity
  }

  async acceptInvitation(token: string): Promise<User> {
    // 1. Validate token
    // 2. Check expiration
    // 3. Create user account
    // 4. Assign role
    // 5. Mark invitation as accepted
    // 6. Send welcome email
  }

  async revokeInvitation(invitationId: string): Promise<void> {
    // 1. Check permissions
    // 2. Update invitation status
    // 3. Log activity
  }
}
```

#### Day 3-4: Email Templates
Create email templates for:
- Team invitation
- Invitation reminder
- Invitation accepted (to inviter)

#### Day 5: Testing
- Unit tests for invitation service
- Integration tests for invitation flow
- Email delivery verification

### Week 2: Team Management UI

#### Frontend Components
```typescript
// frontend/src/components/team/

// TeamMemberList.tsx
- Display all team members
- Show role badges
- Last active status
- Quick actions menu

// InviteUserModal.tsx
- Email input
- Role selector
- Bulk invitation support
- Preview permissions

// TeamMemberCard.tsx
- Member profile
- Role management
- Activity summary
- Remove member action

// ActivityFeed.tsx
- Real-time activity stream
- Filter by user/action
- Export activity logs
```

#### Pages
```typescript
// frontend/src/app/(dashboard)/dashboard/team/

// page.tsx - Main team page
├── Active members list
├── Pending invitations
├── Invite button
└── Activity feed

// [memberId]/page.tsx - Member detail
├── Profile information
├── Role & permissions
├── Activity history
└── Actions (edit, remove)
```

### Week 3: Activity Tracking & Polish

#### Activity Tracking Implementation
```typescript
// team/activity-tracking.service.ts

@Injectable()
export class ActivityTrackingService {
  async logActivity(
    organizationId: string,
    userId: string,
    action: ActivityAction,
  ): Promise<void> {
    // Log to database
    // Emit real-time event
    // Update analytics
  }

  async getActivityFeed(
    organizationId: string,
    filters: ActivityFilters,
  ): Promise<ActivityLog[]> {
    // Fetch paginated activities
    // Support filtering
    // Include actor information
  }
}
```

#### Tracked Activities
- User actions: login, logout
- Agent actions: create, update, delete, deploy
- Workflow actions: create, execute, update
- Knowledge base: upload, delete documents
- Team actions: invite, remove, role change
- Settings: update organization settings

---

## API Endpoints

### Team Management

```typescript
// Get team members
GET /api/v1/team/members
Response: {
  members: [
    {
      id: string;
      email: string;
      name: string;
      role: string;
      avatar: string;
      lastActiveAt: Date;
      createdAt: Date;
    }
  ],
  total: number;
}

// Invite team member
POST /api/v1/team/invite
Body: {
  email: string;
  role: string;
  message?: string;
}

// Get pending invitations
GET /api/v1/team/invitations
Response: {
  invitations: [
    {
      id: string;
      email: string;
      role: string;
      invitedBy: string;
      expiresAt: Date;
      status: string;
    }
  ]
}

// Revoke invitation
DELETE /api/v1/team/invitations/:id

// Accept invitation
POST /api/v1/team/accept-invitation
Body: {
  token: string;
  name: string;
  password: string;
}

// Update member role
PATCH /api/v1/team/members/:id
Body: {
  role: string;
}

// Remove team member
DELETE /api/v1/team/members/:id

// Get activity feed
GET /api/v1/team/activity
Query: {
  page: number;
  limit: number;
  userId?: string;
  actionType?: string;
  startDate?: string;
  endDate?: string;
}
```

---

## Role Definitions

### Enhanced RBAC System

```typescript
export enum TeamRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  VIEWER = 'viewer',
}

export const ROLE_PERMISSIONS = {
  [TeamRole.OWNER]: {
    // Full access
    billing: ['read', 'write'],
    team: ['read', 'write', 'delete'],
    agents: ['read', 'write', 'delete'],
    workflows: ['read', 'write', 'delete'],
    knowledge: ['read', 'write', 'delete'],
    settings: ['read', 'write'],
  },
  [TeamRole.ADMIN]: {
    // No billing access
    billing: ['read'],
    team: ['read', 'write'],
    agents: ['read', 'write', 'delete'],
    workflows: ['read', 'write', 'delete'],
    knowledge: ['read', 'write', 'delete'],
    settings: ['read', 'write'],
  },
  [TeamRole.MEMBER]: {
    // Can create and edit own resources
    billing: ['read'],
    team: ['read'],
    agents: ['read', 'write'],
    workflows: ['read', 'write'],
    knowledge: ['read', 'write'],
    settings: ['read'],
  },
  [TeamRole.VIEWER]: {
    // Read-only access
    billing: [],
    team: ['read'],
    agents: ['read'],
    workflows: ['read'],
    knowledge: ['read'],
    settings: ['read'],
  },
};
```

---

## UI/UX Specifications

### Team Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Team Members                          [Invite Member]       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 👤 John Doe          Owner         Active 2 mins ago    │ │
│  │    john@example.com                                     │ │
│  │    [Edit] [Remove]                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 👤 Jane Smith        Admin         Active 1 hour ago    │ │
│  │    jane@example.com                                     │ │
│  │    [Edit] [Remove]                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│  Pending Invitations (2)                                    │
├─────────────────────────────────────────────────────────────┤
│  📧 bob@example.com (Member) - Invited 2 days ago [Revoke] │
│  📧 alice@example.com (Admin) - Invited 5 days ago [Revoke]│
├─────────────────────────────────────────────────────────────┤
│  Recent Activity                               [View All]   │
├─────────────────────────────────────────────────────────────┤
│  • John created agent "Support Bot" - 10 mins ago          │
│  • Jane updated workflow "Lead Capture" - 1 hour ago       │
│  • John invited bob@example.com - 2 days ago               │
└─────────────────────────────────────────────────────────────┘
```

### Invite Modal

```
┌─────────────────────────────────────────┐
│  Invite Team Member                   × │
├─────────────────────────────────────────┤
│                                          │
│  Email Address                           │
│  [bob@example.com              ]         │
│                                          │
│  Role                                    │
│  [Member ▼]                             │
│                                          │
│  ⓘ Members can create and edit agents  │
│     but cannot manage billing or users  │
│                                          │
│  Personal Message (Optional)             │
│  [─────────────────────────────────]    │
│  [                                  ]    │
│  [                                  ]    │
│                                          │
│           [Cancel]  [Send Invitation]   │
└─────────────────────────────────────────┘
```

---

## Security Considerations

### Access Control
- Validate organization membership on every request
- Check role permissions before actions
- Prevent privilege escalation
- Log all permission checks

### Invitation Security
- Use cryptographically secure tokens
- Set expiration (7 days default)
- One-time use tokens
- Email verification required

### Activity Logging
- Log all sensitive actions
- Include IP address and user agent
- Tamper-proof logs (append-only)
- Regular audit reviews

---

## Testing Checklist

### Functional Tests
- [ ] Invite user flow
- [ ] Accept invitation flow
- [ ] Revoke invitation
- [ ] Update member role
- [ ] Remove member
- [ ] Permission checks for each role
- [ ] Activity logging for all actions

### Edge Cases
- [ ] Invite existing user
- [ ] Expired invitation
- [ ] Invalid token
- [ ] Organization limit reached
- [ ] Owner cannot remove self
- [ ] Last owner protection

### Performance Tests
- [ ] Load 100+ team members
- [ ] Concurrent invitation sends
- [ ] Activity feed pagination
- [ ] Real-time updates

---

## Next Steps

After completing team collaboration:
1. Review [Analytics Implementation](./PHASE-2-ANALYTICS-IMPLEMENTATION.md)
2. Integrate with billing (team size limits)
3. Add team activity to analytics dashboard
4. Create user onboarding flow

---

## Resources

- [RBAC Best Practices](https://auth0.com/docs/manage-users/access-control/rbac)
- [Invitation Email Templates](https://github.com/sendgrid/email-templates)
- [Activity Feed UI Patterns](https://www.refactoringui.com/)
