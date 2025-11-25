# Tutorials Collection

## Beginner Tutorials

### 1. Your First Tool (5 min)
**What You'll Learn:** Create and test a simple tool
**Link:** [Quick Start Tutorial](QUICK-START-TUTORIAL.md)

### 2. Using Templates (3 min)
**What You'll Learn:** Quickly create tools from templates

**Steps:**
1. Click "Templates" button
2. Browse available options
3. Click "Use Template" on GitHub API
4. Fill in your GitHub token
5. Test it!

**Templates Available:**
- Weather API - Get weather data
- GitHub API - Fetch repository info
- Slack Message - Send notifications
- REST API GET - Generic GET requests
- REST API POST - Generic POST requests

---

## Intermediate Tutorials

### 3. Adding Response Transformation (10 min)

**Scenario:** Your API returns too much data. You only need specific fields.

**Example:** Weather API returns 50+ fields, you only want temperature.

**Steps:**

1. **Edit your Weather Checker tool**
2. **Go to "Advanced" step**
3. **Enable Response Transformation**
4. **Select Type:** JSONPath
5. **Enter Expression:**

**Get just temperature:**
```
$.main.temp
```

**Test it - Before:**
```json
{
  "coord": {...},
  "weather": [...],
  "main": {
    "temp": 15.23,
    "feels_like": 14.67,
    ...
  },
  ...
}
```

**After:**
```json
15.23
```

**More Examples:**

**Get temperature and description:**
```javascript
// Switch to JavaScript type
return {
  temp: data.main.temp,
  weather: data.weather[0].description
};
```

**Result:**
```json
{
  "temp": 15.23,
  "weather": "few clouds"
}
```

---

### 4. Setting Up Auto-Retry (10 min)

**Scenario:** Your API sometimes fails with 503 errors. You want automatic retries.

**Steps:**

1. **Edit your tool**
2. **Go to "Advanced" step**
3. **Enable Auto-Retry**
4. **Configure:**

```
Max Retries: 3
Retry Delay: 1000ms
Backoff Multiplier: 2
Retry On: 5xx, 503, network
```

**Test Behavior:**

**Without Retry:**
```
Request → 503 Error → ❌ Failed
```

**With Retry:**
```
Request → 503 Error
Wait 1s...
Retry → 503 Error
Wait 2s...
Retry → 200 OK ✅ Success!
```

**When to Use:**
- Unstable APIs
- Rate-limited services
- Network issues
- Temporary failures

---

### 5. Environment Management (15 min)

**Scenario:** You want to test in dev before going to production.

**Setup:**

**Step 1: Create Development Environment**

```
Name: Development
Description: For testing new features
Config:
  URL: https://dev-api.example.com
  API Key: dev_key_123
  Timeout: 10000
Active: Yes (for now)
```

**Step 2: Create Production Environment**

```
Name: Production
Description: Live production API
Config:
  URL: https://api.example.com
  API Key: prod_key_456
  Timeout: 5000
Active: No (not yet)
```

**Step 3: Test in Development**

1. Make sure "Development" is active
2. Run tests
3. Verify everything works
4. Fix any issues

**Step 4: Switch to Production**

1. Click "Activate" on Production environment
2. Run a test to confirm
3. Monitor analytics
4. Roll back to Dev if issues

**Best Practice Workflow:**
```
Development → Test → Fix
     ↓
  Staging → Verify → Adjust
     ↓
Production → Monitor → Succeed! 🎉
```

---

## Advanced Tutorials

### 6. Complex JSONPath Queries (20 min)

**Scenario:** Extract specific data from complex nested structures.

**Sample API Response:**
```json
{
  "status": "success",
  "data": {
    "users": [
      {
        "id": 1,
        "name": "Alice",
        "email": "alice@example.com",
        "active": true,
        "orders": [
          {"id": 101, "total": 50.00},
          {"id": 102, "total": 75.50}
        ]
      },
      {
        "id": 2,
        "name": "Bob",
        "email": "bob@example.com",
        "active": false,
        "orders": []
      },
      {
        "id": 3,
        "name": "Charlie",
        "email": "charlie@example.com",
        "active": true,
        "orders": [
          {"id": 201, "total": 120.00}
        ]
      }
    ]
  }
}
```

**Transformations:**

**1. Get all user names:**
```
$.data.users[*].name
Result: ["Alice", "Bob", "Charlie"]
```

**2. Get active users only:**
```
$.data.users[?(@.active==true)]
Result: [{"id":1,"name":"Alice",...}, {"id":3,"name":"Charlie",...}]
```

**3. Get active user names:**
```
$.data.users[?(@.active==true)].name
Result: ["Alice", "Charlie"]
```

**4. Get all order totals:**
```
$.data.users[*].orders[*].total
Result: [50.00, 75.50, 120.00]
```

**5. Get users with orders:**
```
$.data.users[?(@.orders.length>0)]
Result: [Alice, Charlie]
```

**6. Get first user's email:**
```
$.data.users[0].email
Result: "alice@example.com"
```

---

### 7. JavaScript Transformations (20 min)

**Scenario:** Complex logic that JSONPath can't handle.

**Example 1: Calculate Total Sales**

```javascript
return data.users.reduce((total, user) => {
  const userTotal = user.orders.reduce((sum, order) => {
    return sum + order.total;
  }, 0);
  return total + userTotal;
}, 0);
```

**Result:** `245.50`

**Example 2: User Summary Report**

```javascript
return data.users.map(user => ({
  name: user.name,
  email: user.email,
  status: user.active ? 'Active' : 'Inactive',
  orderCount: user.orders.length,
  totalSpent: user.orders.reduce((sum, o) => sum + o.total, 0)
}));
```

**Result:**
```json
[
  {
    "name": "Alice",
    "email": "alice@example.com",
    "status": "Active",
    "orderCount": 2,
    "totalSpent": 125.50
  },
  ...
]
```

**Example 3: Filter and Sort**

```javascript
return data.users
  .filter(user => user.active)
  .map(user => ({
    name: user.name,
    totalSpent: user.orders.reduce((sum, o) => sum + o.total, 0)
  }))
  .sort((a, b) => b.totalSpent - a.totalSpent);
```

**Result:** Active users sorted by spending (highest first)

---

### 8. Bulk Operations Workflow (15 min)

**Scenario:** You have 20 tools and need to update them all.

**Use Case 1: Bulk Disable for Maintenance**

1. **Select All Tools**
   - Click "Select All" checkbox

2. **Disable**
   - Click "Disable Selected"
   - Confirm

3. **Perform Maintenance**
   - Update API endpoints
   - Rotate keys
   - Test changes

4. **Re-enable**
   - Select all again
   - Click "Enable Selected"

**Use Case 2: Migrate to New API Version**

1. **Export Current Tools**
   - Select all tools
   - Click "Export Selected"
   - File downloads

2. **Edit JSON File**
   ```json
   // Change all URLs
   Find: "https://api.example.com/v1/"
   Replace: "https://api.example.com/v2/"
   ```

3. **Update Tool Names**
   ```json
   // Add version suffix
   "name": "Weather Checker" 
   → "name": "Weather Checker v2"
   ```

4. **Import Updated Tools**
   - Click "Import"
   - Upload modified file
   - New tools created

5. **Test New Tools**
   - Test a few to verify
   - Compare with old versions

6. **Delete Old Tools**
   - Select old tools
   - Click "Delete Selected"

**Use Case 3: Clone Tools to Another Environment**

1. Select production tools
2. Export
3. Modify environment configs in JSON
4. Import to dev environment
5. Update API keys for dev

---

### 9. Monitoring and Alerting (25 min)

**Scenario:** Set up proactive monitoring for your tools.

**Step 1: Baseline Performance**

1. Go to Analytics
2. Note your current metrics:
   ```
   Success Rate: 98.5%
   Avg Response Time: 245ms
   Error Rate: 1.5%
   ```

**Step 2: Regular Monitoring Schedule**

**Daily Check (2 min):**
- Open Analytics dashboard
- Check success rate (should be >95%)
- Review error breakdown
- Note any anomalies

**Weekly Review (10 min):**
- Compare week-over-week trends
- Identify slow tools
- Check for new error types
- Review top tools by usage

**Monthly Analysis (30 min):**
- Deep dive into performance trends
- Identify optimization opportunities
- Review and update rate limits
- Plan improvements

**Step 3: Identify Issues Early**

**Warning Signs:**

🟡 **Success Rate Drops Below 95%**
- Check error breakdown
- Test affected tools manually
- Review recent changes
- Contact API provider if external issue

🟡 **Response Time Increases >50%**
- Check API provider status
- Review recent changes
- Look for large payloads
- Consider optimization

🔴 **Complete Failure (0% success)**
- API is down
- Credentials expired
- Network issue
- Immediate action required

**Step 4: Response Playbook**

**Issue: Authentication Errors**
```
1. Check API key validity
2. Verify key hasn't expired
3. Test with fresh key
4. Update tool configuration
5. Verify fix with test
```

**Issue: Rate Limiting**
```
1. Check current usage
2. Enable auto-retry
3. Reduce request frequency
4. Request limit increase
5. Implement queuing if needed
```

**Issue: Timeouts**
```
1. Check API status
2. Increase timeout setting
3. Enable auto-retry
4. Optimize request payload
5. Contact provider
```

---

## Real-World Examples

### 10. Building a Weather Bot (30 min)

**Goal:** Create a complete weather checking system.

**Tools Needed:**
1. Weather Checker (data fetcher)
2. Temperature Converter (calculator)
3. Slack Notifier (messenger)

**Step 1: Weather Data Tool**

```
Name: Fetch Weather
URL: https://api.openweathermap.org/data/2.5/weather
Response Transform: 
  return {
    temp: data.main.temp,
    feels_like: data.main.feels_like,
    description: data.weather[0].description,
    city: data.name
  };
```

**Step 2: Test It**

Input:
```json
{"q": "London", "units": "metric"}
```

Output:
```json
{
  "temp": 15.23,
  "feels_like": 14.67,
  "description": "few clouds",
  "city": "London"
}
```

**Step 3: Create Alert Tool**

```
Name: Weather Alert
Logic: If temp < 10 or temp > 30, send alert
```

**Step 4: Monitor Usage**

Check analytics to see:
- How often weather is checked
- Success rate
- Response times
- Error patterns

---

### 11. User Management System (45 min)

**Goal:** Complete CRUD operations for user management.

**Tools to Create:**

**1. Get User**
```
Name: Get User Profile
Method: GET
URL: https://api.example.com/users/{userId}
Response Transform: Extract essential fields
```

**2. Create User**
```
Name: Create New User
Method: POST
URL: https://api.example.com/users
Requires Approval: Yes (creates data)
```

**3. Update User**
```
Name: Update User Profile
Method: PUT
URL: https://api.example.com/users/{userId}
Requires Approval: Yes
```

**4. Delete User**
```
Name: Delete User
Method: DELETE
URL: https://api.example.com/users/{userId}
Requires Approval: Yes (destructive)
```

**5. List Users**
```
Name: List All Users
Method: GET
URL: https://api.example.com/users
Response Transform: Paginate results
```

**Test Each Tool:**

1. Create test user
2. Get user profile
3. Update user info
4. List users (verify appears)
5. Delete user
6. Verify deletion

**Monitor:**
- Track which operations are most common
- Monitor for errors
- Check performance
- Review approval workflow

---

## Best Practices Workshop

### 12. Optimization Techniques (30 min)

**Technique 1: Response Transformation**

**Problem:** API returns 5KB, you need 50 bytes

**Solution:**
```javascript
// Before: Full response (5000 bytes)
{
  "data": { /* huge object */ },
  "metadata": { /* more data */ },
  "pagination": { /* even more */ }
}

// After: Transformed (50 bytes)
return data.data.items.map(i => i.id);
// Result: [1, 2, 3, 4, 5]
```

**Savings:** 99% bandwidth reduction

**Technique 2: Smart Retries**

**Problem:** API fails 5% of the time randomly

**Solution:**
```
Enable Auto-Retry
Max Retries: 2 (don't overdo it)
Retry On: 5xx, network (not 4xx)
Backoff: 2x (exponential)
```

**Result:** 5% failure → 0.25% failure

**Technique 3: Rate Limit Management**

**Problem:** Hitting rate limits frequently

**Solution:**
1. Monitor current usage in analytics
2. Calculate actual needs
3. Set appropriate limit
4. Add retry logic
5. Implement queuing if needed

**Technique 4: Environment Separation**

**Problem:** Breaking production while testing

**Solution:**
1. Test in Development environment
2. Verify in Staging
3. Deploy to Production
4. Monitor closely
5. Rollback if issues

---

## Troubleshooting Workshop

### 13. Common Error Scenarios (45 min)

**Scenario 1: Intermittent Failures**

**Symptoms:**
- Works 90% of the time
- Random failures
- No pattern to errors

**Investigation:**
1. Check error breakdown - mostly timeouts?
2. Check API provider status
3. Review response times in analytics
4. Test from different locations

**Solution:**
- Enable auto-retry
- Increase timeout
- Contact API provider
- Consider backup API

**Scenario 2: Sudden Success Rate Drop**

**Symptoms:**
- Was 99%, now 60%
- Started yesterday
- Affecting all tools

**Investigation:**
1. Check what changed yesterday
2. Review API provider announcements
3. Test authentication
4. Check rate limits

**Common Causes:**
- API key expired
- API version deprecated
- Rate limit reduced
- Network issue

**Solution:**
- Rotate API keys
- Update API version
- Adjust rate limits
- Contact provider

**Scenario 3: Slow Performance**

**Symptoms:**
- Response time increased 300%
- Users complaining
- No errors, just slow

**Investigation:**
1. Check analytics - when did it start?
2. Review API provider status
3. Check response payload size
4. Look for new transformations

**Solutions:**
- Optimize transformations
- Reduce payload size
- Contact API provider
- Add caching if possible

---

## Graduation Project

### 14. Build a Complete Integration (60 min)

**Project:** Customer Support Dashboard

**Requirements:**
1. Fetch customer data
2. Get support tickets
3. Send notifications
4. Update ticket status
5. Generate reports

**Tools to Build:**
- Get Customer (Salesforce API)
- List Tickets (Zendesk API)
- Send Email (SendGrid API)
- Update Ticket (Zendesk API)
- Analytics Report (Custom)

**Deliverables:**
1. All 5 tools created and tested
2. Auto-retry enabled on critical tools
3. Response transformations applied
4. Environments configured (dev/prod)
5. Monitoring dashboard reviewed
6. Documentation written

**Success Criteria:**
- All tools work reliably
- Success rate >98%
- Response time <500ms
- Zero manual intervention needed
- Analytics show healthy metrics

---

**🎓 Congratulations!**

You've completed all tutorials and are now an expert in:
- Creating and managing tools
- Testing and debugging
- Advanced configurations
- Performance optimization
- Monitoring and analytics
- Troubleshooting issues

**Keep Learning:**
- Explore new API integrations
- Share your solutions with the community
- Help others learn
- Build amazing things!

**Happy Building!** 🚀
