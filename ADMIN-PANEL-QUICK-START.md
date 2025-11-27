# Admin Panel Quick Start Guide 🚀

## Prerequisites
- Backend running on `http://localhost:3001`
- Frontend running on `http://localhost:3000`
- PostgreSQL database running

## Step 1: Grant Admin Access

### Option A: Using Docker
```bash
docker-compose exec postgres psql -U postgres -d objecta-labs
```

### Option B: Using psql directly
```bash
psql -h localhost -U postgres -d objecta-labs
```

### Run this SQL command:
```sql
-- Replace 'your-email@example.com' with your actual email
UPDATE users 
SET "isAdmin" = true, "adminRole" = 'super_admin' 
WHERE email = 'your-email@example.com';

-- Verify it worked
SELECT id, email, "isAdmin", "adminRole" FROM users WHERE "isAdmin" = true;
```

## Step 2: Login as Admin
1. **Logout** if you're currently logged in (important!)
2. **Login** with the email you just made admin
3. The JWT token will now include admin privileges

## Step 3: Access Admin Panel
Navigate to: **`http://localhost:3000/admin/dashboard`**

## Admin Panel Navigation

### Available Pages:

| Page | URL | Description |
|------|-----|-------------|
| **Dashboard** | `/admin/dashboard` | Overview metrics, charts, activity feed |
| **Customers** | `/admin/customers` | View and manage all customers |
| **Customer Details** | `/admin/customers/[id]` | Detailed customer information |
| **Support Tickets** | `/admin/tickets` | Manage customer support requests |
| **Audit Logs** | `/admin/audit` | View all admin actions and changes |
| **Settings** | `/admin/settings` | Platform configuration |

## Features Overview

### 📊 Dashboard
- **Metrics Cards** with trend indicators (↑12% from last month)
- **Customer Growth Chart** - 7-day visualization
- **KPI Cards** - Conversion rate, avg users, avg revenue
- **Real-time Activity Feed** - Latest 5 activities
- **Quick Actions Grid** - Navigate to common tasks
- **Revenue Projections** - Quarterly, annual, 5-year

### 👥 Customers Page
- **Search & Filter** by name, subdomain, plan, status
- **Customer Cards** with avatar, plan badge, status
- **Actions**: View details, Suspend account
- **Pagination** for large customer lists

### 🔍 Customer Details
- **Overview Tab** - Organization info
- **Users Tab** - Team members list
- **Usage Tab** - Agents, workflows, API calls
- **Billing Tab** - Subscription details
- **Activity Tab** - Recent actions

### 🎫 Support Tickets
- **Stats Cards** - Total, Open, In Progress, Resolved, Critical
- **Filter by Status** - open, in_progress, waiting, resolved, closed
- **Filter by Priority** - critical, high, medium, low
- **Quick Actions** - Assign to me, Resolve ticket
- **Ticket Details Modal** - Full ticket information

### 📝 Audit Logs
- **Date Range Filter** - Start and end date
- **Export to CSV** - Download audit trail
- **Stats Cards** - Total, Today, This Week, Unique Admins
- **Activity Timeline** - Chronological list with:
  - Action type badges
  - Admin user info
  - Timestamp
  - IP address
  - JSON change diff

### ⚙️ Settings
- **General Tab** - Platform name, support email, limits
- **Notifications Tab** - Email and security alerts toggles
- **Security Tab** - Maintenance mode, session timeout
- **System Tab** - Cache clearing, index rebuilding

## API Endpoints (Fixed ✅)

### Admin Endpoints
```
GET    /api/v1/admin/dashboard
GET    /api/v1/admin/customers
GET    /api/v1/admin/customers/:id
POST   /api/v1/admin/customers/:id/suspend
PATCH  /api/v1/admin/customers/:id
GET    /api/v1/admin/tickets
GET    /api/v1/admin/tickets/stats
GET    /api/v1/admin/tickets/:id
PATCH  /api/v1/admin/tickets/:id
POST   /api/v1/admin/tickets/:id/assign
POST   /api/v1/admin/tickets/:id/resolve
GET    /api/v1/admin/audit-logs
```

### Team Endpoints (Fixed ✅)
```
POST   /api/v1/team/invite
GET    /api/v1/team/members
GET    /api/v1/team/invitations
DELETE /api/v1/team/invitations/:id
PATCH  /api/v1/team/members/:id/role
DELETE /api/v1/team/members/:id
```

## Testing Checklist

### Basic Tests
- [ ] Can access `/admin/dashboard` after granting admin access
- [ ] Dashboard loads with metrics
- [ ] Stats cards show numbers and trends
- [ ] Chart displays customer growth
- [ ] Activity feed shows recent activities
- [ ] Quick actions navigate to correct pages

### Navigation Tests
- [ ] Sidebar collapses and expands
- [ ] All nav links work correctly
- [ ] User dropdown menu appears
- [ ] Logout button works
- [ ] Back to user dashboard link works

### Customer Management
- [ ] Customer list loads
- [ ] Search functionality works
- [ ] Filter by plan works
- [ ] Filter by status works
- [ ] Pagination works
- [ ] View customer details works
- [ ] Customer detail tabs work

### Support Tickets
- [ ] Ticket list loads
- [ ] Stats cards display
- [ ] Filter by status works
- [ ] Filter by priority works
- [ ] Assign to me works
- [ ] Ticket detail modal opens
- [ ] Update status works
- [ ] Resolve ticket works

### Audit Logs
- [ ] Logs list loads
- [ ] Date filter works
- [ ] Stats display correctly
- [ ] Export CSV works
- [ ] Timeline shows activities

### Settings
- [ ] All tabs accessible
- [ ] Toggle switches work
- [ ] Input fields work
- [ ] Save buttons work

## Troubleshooting

### Issue: 404 Not Found on `/admin/dashboard`
**Solution:** Make sure you logged out and back in after granting admin access

### Issue: "Admin access required" error
**Solution:** 
1. Check the database: `SELECT "isAdmin" FROM users WHERE email = 'your-email@example.com';`
2. Should return `true`
3. Logout and login again

### Issue: Admin routes don't load
**Solution:** 
- Clear browser cache and cookies
- Check that frontend is running on port 3000
- Check browser console for errors

### Issue: API returns 404
**Solution:**
- Backend was fixed to use `/api/v1/admin/*` (not `/api/api/v1/admin/*`)
- Restart backend after pulling changes
- Verify with: `curl http://localhost:3001/api/v1/admin/dashboard`

### Issue: Sidebar doesn't show
**Solution:**
- The layout checks for `isAdmin` in localStorage
- Make sure to login after granting admin access
- Check browser console for errors

## Advanced Usage

### Testing API Endpoints with curl
```bash
# Get auth token (replace credentials)
TOKEN=$(curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}' \
  | jq -r '.token')

# Test dashboard endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/admin/dashboard

# Test customers endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/admin/customers

# Test with filters
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/admin/customers?plan=professional&status=active"
```

### Creating Mock Data for Testing
```sql
-- Create a test customer
INSERT INTO organizations (name, subdomain, plan, "planStatus") 
VALUES ('Test Corp', 'testcorp', 'professional', 'active');

-- Create a test ticket
INSERT INTO support_tickets (subject, description, priority, status, "organizationId") 
VALUES ('Test Ticket', 'This is a test', 'high', 'open', 'ORG_ID_HERE');
```

## Component Usage for Developers

### Using StatsCard
```tsx
import { StatsCard } from '@/components/admin';
import { Users } from 'lucide-react';

<StatsCard
  title="Active Users"
  value={1234}
  icon={Users}
  description="Logged in today"
  trend={{ value: 15, isPositive: true }}
  color="blue"
/>
```

### Using ChartCard
```tsx
import { ChartCard } from '@/components/admin';

<ChartCard
  title="Weekly Signups"
  description="Last 7 days"
  data={[
    { label: 'Mon', value: 45 },
    { label: 'Tue', value: 52 },
    // ... more days
  ]}
/>
```

### Using ActivityFeed
```tsx
import { ActivityFeed } from '@/components/admin';

<ActivityFeed
  activities={activities}
  limit={10}
/>
```

### Using QuickActions
```tsx
import { QuickActions } from '@/components/admin';
import { Users, Settings } from 'lucide-react';

<QuickActions
  actions={[
    {
      title: 'Manage Users',
      description: 'View all users',
      href: '/admin/users',
      icon: Users,
      color: 'blue'
    }
  ]}
/>
```

## Next Steps

After verifying the admin panel works:

1. **Implement Real Data**
   - Replace mock trend data with actual historical data
   - Connect activity feed to real-time WebSocket
   - Add more chart types (line graphs, pie charts)

2. **Add More Features**
   - Bulk operations for customers
   - Advanced filtering and search
   - Email notification system
   - Custom reports generation

3. **Security Enhancements**
   - Add role-based permissions
   - Implement admin action confirmations
   - Add rate limiting for admin actions
   - Setup audit log retention policies

4. **UI/UX Improvements**
   - Dark mode support
   - Customizable dashboards
   - Saved filter presets
   - Keyboard shortcuts

## Support

If you encounter any issues:
1. Check the console logs (both browser and backend)
2. Verify database connections
3. Ensure all dependencies are installed
4. Review the full documentation in `ADMIN-PANEL-ENHANCEMENT-COMPLETE.md`

---

**Ready to test?** Follow Step 1 to grant admin access and get started! 🎉
