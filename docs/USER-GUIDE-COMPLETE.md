# AI Agent Platform - Complete User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Tools & Actions](#tools--actions)
3. [Testing Tools](#testing-tools)
4. [Advanced Configuration](#advanced-configuration)
5. [Monitoring & Analytics](#monitoring--analytics)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

---

## Getting Started

### What are Tools?

Tools are actions that your AI agents can use to interact with external systems, APIs, and services. Think of them as superpowers for your agents - they enable them to:

- 🌐 Make HTTP API calls
- 🧮 Perform calculations
- 📊 Fetch and process data
- ✉️ Send notifications
- 🔄 Transform responses
- And much more!

### Quick Start

1. **Navigate to Tools** - Click "Tools & Actions" in the sidebar
2. **Create Your First Tool** - Click the "Create Tool" button
3. **Choose a Template** (optional) - Start with a pre-configured template
4. **Configure the Tool** - Follow the 4-step wizard
5. **Test It** - Verify it works before assigning to agents

---

## Tools & Actions

### Creating a Tool

#### Method 1: From Scratch

**Step 1: Basic Information**

```
Tool Name: Weather Checker
Description: Fetches current weather data for any city
Tool Type: HTTP API
Action Type: Read
```

**Step 2: Configuration**

```
URL: https://api.openweathermap.org/data/2.5/weather
Method: GET
Headers:
  X-API-Key: your_api_key_here
Authentication: API Key
```

**Step 3: Settings**

```
Rate Limit: 60 requests/minute
Requires Approval: No
Enabled: Yes
```

**Step 4: Advanced (Optional)**

```
Auto-Retry: Enabled
  Max Retries: 3
  Retry Delay: 1000ms
  Retry On: 5xx, network

Response Transform: Enabled
  Type: JSONPath
  Expression: $.weather[0].description
```

#### Method 2: From Template

1. Click **"Templates"** button
2. Browse available templates:
   - Weather API
   - GitHub API
   - Slack Message
   - REST API GET
   - REST API POST
3. Click **"Use Template"**
4. Customize as needed
5. Save

### Managing Tools

#### View All Tools

The tools page shows:
- ✅ Tool name and description
- 🔧 Tool type (HTTP API, Calculator, etc.)
- 📊 Action type (Read, Write, Update, Delete)
- ⚡ Status (Enabled/Disabled)
- 📅 Last updated

#### Edit a Tool

1. Find the tool in the list
2. Click the **pencil icon** (✏️)
3. Make your changes
4. Click **"Update Tool"**

**Note:** Tool Type and Action Type cannot be changed after creation.

#### Duplicate a Tool

1. Find the tool you want to copy
2. Click the **duplicate icon** (📋)
3. A copy is created with " (Copy)" suffix
4. Edit the copy as needed

#### Delete a Tool

1. Click the **trash icon** (🗑️)
2. Confirm deletion
3. Tool is permanently removed

### Bulk Operations

**Select Multiple Tools:**
1. Check the boxes next to tools you want to manage
2. Click "Select All" to select everything

**Bulk Actions:**
- **Enable** - Turn on multiple tools at once
- **Disable** - Turn off multiple tools
- **Export** - Download as JSON file
- **Delete** - Remove multiple tools (with confirmation)

### Import/Export

#### Export Tools

**Export Selected:**
1. Select tools with checkboxes
2. Click "Export Selected"
3. JSON file downloads automatically

**Export All:**
1. Click "Export" in bulk actions
2. Don't select any tools
3. All tools exported

**Export Format:**
```json
[
  {
    "name": "Weather API",
    "description": "Get weather data",
    "toolType": "http-api",
    "actionType": "read",
    "config": {
      "url": "https://api.example.com",
      "method": "GET",
      "headers": {},
      "auth": { "type": "api-key" }
    },
    "retryConfig": { "enabled": true },
    "responseTransform": { "enabled": false }
  }
]
```

#### Import Tools

1. Click **"Import"** button
2. Choose method:
   - **Upload file** - Drag & drop or click
   - **Paste JSON** - Copy/paste directly
3. Click **"Import Tools"**
4. Tools are created

**Tips:**
- Validate JSON before importing
- Review imported tools before using
- Credentials may need updating

---

## Testing Tools

### Why Test?

Testing ensures your tool works correctly before your agents use it. Always test after:
- Creating a new tool
- Editing configuration
- Changing API endpoints
- Updating authentication

### How to Test

1. Click the **beaker icon** (🧪) on any tool
2. The Test Modal opens with 3 tabs

### Test Tab

**Enter Input:**
```json
{
  "city": "London",
  "units": "metric"
}
```

**Click "Test Tool"**

**View Results:**
```json
{
  "success": true,
  "result": {
    "temp": 15.5,
    "description": "Partly cloudy",
    "humidity": 65
  },
  "executionTime": 342
}
```

**Quick Examples (for Calculator):**
- `2 + 2`
- `(15 * 23) + 100`
- `100 / 4 - 10`

### Request/Response Tab

See exactly what was sent and received:

**Request Details:**
- Method: GET
- URL: https://api.example.com/weather
- Headers: All headers sent
- Body: Request payload (if any)

**Response Details:**
- Status: 200 OK
- Headers: Response headers
- Timing: How long it took

**Use Cases:**
- Debug authentication issues
- Verify headers are correct
- Check request format
- Troubleshoot errors

### History Tab

View all previous test executions:

**Each Entry Shows:**
- ✅ Success or ❌ Failure
- ⏰ Timestamp
- ⚡ Execution time
- ⚠️ Error message (if failed)

**Click any entry to:**
- Reload its input
- View its result
- Re-run the test

**Benefits:**
- Compare different inputs
- Track what works
- Debug issues
- No need to re-type inputs

---

## Advanced Configuration

### Auto-Retry Logic

Automatically retry failed requests with smart backoff.

**When to Use:**
- Unreliable APIs
- Rate-limited endpoints
- Network instability
- Temporary failures

**Configuration:**

```
Enable Auto-Retry: ✓

Max Retries: 3
Retry Delay: 1000ms
Backoff Multiplier: 2

Retry On:
  - 5xx (server errors)
  - 429 (rate limit)
  - network (connection errors)
  - ETIMEDOUT (timeouts)
```

**How it Works:**
```
Attempt 1: Immediate
↓ (fails)
Attempt 2: Wait 1000ms
↓ (fails)
Attempt 3: Wait 2000ms (1000 × 2)
↓ (fails)
Attempt 4: Wait 4000ms (2000 × 2)
```

**Example Scenarios:**

**Scenario 1: Rate Limit Hit**
```
Request 1: 429 Too Many Requests
→ Wait 1 second
→ Retry: 200 OK ✓
```

**Scenario 2: Server Error**
```
Request 1: 503 Service Unavailable
→ Wait 1 second
→ Still 503
→ Wait 2 seconds
→ 200 OK ✓
```

### Response Transformation

Extract or transform API responses automatically.

#### JSONPath Transformation

**Use Case:** Extract specific data from complex responses

**Original Response:**
```json
{
  "status": "success",
  "data": {
    "users": [
      { "id": 1, "name": "Alice", "active": true },
      { "id": 2, "name": "Bob", "active": false },
      { "id": 3, "name": "Charlie", "active": true }
    ]
  }
}
```

**Transformations:**

1. **Get all user names:**
```
Expression: $.data.users[*].name
Result: ["Alice", "Bob", "Charlie"]
```

2. **Get active users only:**
```
Expression: $.data.users[?(@.active==true)]
Result: [{"id":1,"name":"Alice","active":true}, ...]
```

3. **Get first user's name:**
```
Expression: $.data.users[0].name
Result: "Alice"
```

4. **Get all IDs:**
```
Expression: $.data.users[*].id
Result: [1, 2, 3]
```

#### JavaScript Transformation

**Use Case:** Custom logic, filtering, calculations

**Configuration:**
```
Type: JavaScript
Expression:
  return data.users
    .filter(user => user.active)
    .map(user => user.name);
```

**Result:** `["Alice", "Charlie"]`

**More Examples:**

**Count items:**
```javascript
return {
  total: data.length,
  active: data.filter(x => x.active).length
};
```

**Calculate sum:**
```javascript
return data.reduce((sum, item) => sum + item.price, 0);
```

**Transform structure:**
```javascript
return data.map(item => ({
  label: item.name,
  value: item.id
}));
```

### Environment Management

Manage different configurations for dev, staging, and production.

**Why Use Environments?**
- Test in dev before production
- Different API keys per environment
- Separate staging and prod URLs
- Safe deployment workflow

**Setting Up Environments:**

1. **Click** tool settings
2. **Go to** "Environments" tab
3. **Create** new environment:

```
Name: Development
Description: For testing
Config:
  URL: https://dev-api.example.com
  API Key: dev_key_123
Active: No
```

```
Name: Production
Description: Live environment
Config:
  URL: https://api.example.com
  API Key: prod_key_456
Active: Yes
```

**Switching Environments:**
1. Select environment
2. Click "Activate"
3. Tool now uses that config

**Best Practice:**
1. Test in Development
2. Verify in Staging
3. Deploy to Production
4. Monitor results

### Tool Versioning

Track all changes with complete history.

**Automatic Snapshots:**
- Created every time you update a tool
- Includes all configuration
- Tracks who made changes
- Optional changelog message

**View Version History:**
1. Open tool settings
2. Click "Versions" tab
3. See all past versions

**Compare Versions:**
```
Version 5 → Version 6
Changes:
  - URL: changed
  - Retry Config: modified
  - Response Transform: added
```

**Restore Previous Version:**
1. Find the version you want
2. Click "Restore"
3. Confirm restoration
4. Tool reverts to that state

**Use Cases:**
- Undo mistakes
- See what changed
- Audit trail
- Rollback issues

---

## Monitoring & Analytics

### Switch to Analytics View

1. Click **"Analytics"** button at top
2. View comprehensive metrics
3. Click **"Tools"** to return to tool list

### Dashboard Overview

#### Stats Cards

**Total Executions**
- Count of all tool runs
- Includes successes and failures

**Success Rate**
- Percentage that succeeded
- Target: >95%
- Green = good, Red = issues

**Avg Response Time**
- Mean execution duration
- Lower is better
- Target: <500ms

**Total Retries**
- How many retries occurred
- High number may indicate issues

#### Last 7 Days Activity

Visual bar chart showing:
- 🟢 Green = Successful executions
- 🔴 Red = Failed executions
- Height = Number of executions

**What to Look For:**
- Sudden drops (service issues?)
- Spike in failures (API changes?)
- Usage patterns (peak times)

#### Error Breakdown

Shows top 5 error types:
- Timeout
- Network Error
- Authentication Error
- Rate Limit Exceeded
- Server Error

**Each Shows:**
- Error count
- Percentage of total errors
- Visual progress bar

**Action Items:**
- High timeouts → Increase timeout setting
- Auth errors → Check credentials
- Rate limits → Reduce frequency or increase limit
- Server errors → Contact API provider

#### Top Tools Table

| Tool Name | Executions | Success Rate | Avg Response | Errors |
|-----------|------------|--------------|--------------|--------|
| Weather API | 1,234 | 98.5% | 245ms | 18 |
| User Lookup | 892 | 95.2% | 180ms | 43 |
| Send Email | 567 | 99.1% | 320ms | 5 |

**Use This To:**
- Identify most-used tools
- Find problematic tools
- Prioritize optimizations
- Monitor performance trends

### Understanding Metrics

#### Success Rate Guidelines

- **>98%** - Excellent ✅
- **95-98%** - Good ✓
- **90-95%** - Needs attention ⚠️
- **<90%** - Critical issue 🚨

#### Response Time Guidelines

- **<200ms** - Excellent ✅
- **200-500ms** - Good ✓
- **500-1000ms** - Acceptable ⚠️
- **>1000ms** - Slow 🚨

#### When to Take Action

**High Error Rate:**
1. Check error breakdown
2. Review tool configuration
3. Test manually
4. Fix identified issues
5. Monitor improvement

**Slow Response:**
1. Check API provider status
2. Review response transformation
3. Consider caching
4. Optimize queries
5. Contact provider if needed

**Rate Limit Issues:**
1. Reduce request frequency
2. Implement retry logic
3. Request higher limits
4. Add request queuing
5. Monitor usage patterns

---

## Best Practices

### Tool Design

#### Naming Conventions

**Good Names:**
- ✅ "Get Weather Data"
- ✅ "Send Slack Notification"
- ✅ "Fetch User Profile"
- ✅ "Calculate Shipping Cost"

**Avoid:**
- ❌ "Tool 1"
- ❌ "API"
- ❌ "Test"
- ❌ "New Tool Copy Copy"

#### Descriptions

**Be Specific:**
```
Bad:  "Gets data"
Good: "Fetches current weather data from OpenWeatherMap 
       API for a specified city with temperature in Celsius"
```

### Configuration

#### Authentication

**API Key (Best for most APIs):**
```
Type: API Key
Header Name: X-API-Key
API Key: sk_live_abc123...
```

**Bearer Token (OAuth/JWT):**
```
Type: Bearer
Token: eyJhbGciOiJIUzI1NiIs...
```

**Basic Auth (Legacy systems):**
```
Type: Basic
Username: your_username
Password: your_password
```

#### Headers

**Always Include:**
```
Content-Type: application/json
Accept: application/json
User-Agent: AI-Agent/1.0
```

**For APIs that require it:**
```
Authorization: Bearer token
X-API-Version: 2023-10-01
X-Request-ID: unique-id
```

### Testing Strategy

**Test Progression:**

1. **Initial Test**
   - Simple happy path
   - Valid input
   - Expected success

2. **Edge Cases**
   - Empty input
   - Invalid data
   - Missing fields

3. **Error Scenarios**
   - Wrong credentials
   - Invalid URL
   - Timeout simulation

4. **Load Testing**
   - Multiple rapid requests
   - Rate limit testing
   - Concurrent execution

### Security

#### API Keys

**Do:**
- ✅ Use environment-specific keys
- ✅ Rotate keys regularly
- ✅ Use least-privilege keys
- ✅ Monitor key usage

**Don't:**
- ❌ Share keys in public docs
- ❌ Use production keys in dev
- ❌ Hardcode in applications
- ❌ Commit to version control

#### Permissions

**Set Appropriate Levels:**
- **Read-only** for data fetching
- **Write** for creating/updating
- **Delete** for destructive actions

**Require Approval For:**
- Financial transactions
- Data deletion
- External communications
- Sensitive operations

### Performance

#### Response Time Optimization

1. **Use Response Transformation**
   - Extract only needed data
   - Reduce payload size
   - Faster processing

2. **Enable Caching (if available)**
   - Cache frequently accessed data
   - Set appropriate TTL
   - Invalidate on updates

3. **Optimize Queries**
   - Request only needed fields
   - Use pagination
   - Limit result size

#### Rate Limiting

**Best Practices:**
- Start conservative (60/min)
- Monitor usage
- Increase if needed
- Respect API limits

**Calculate Needs:**
```
Users: 100
Avg requests/user/hour: 10
Total: 1,000 requests/hour
= 17 requests/minute
Recommendation: 30/min (buffer)
```

---

## Troubleshooting

### Common Issues

#### Tool Test Fails

**Error: "Connection timeout"**

**Causes:**
- API is down
- URL is incorrect
- Network issues
- Firewall blocking

**Solutions:**
1. Verify URL in browser
2. Check API status page
3. Test from different network
4. Contact API provider

---

**Error: "401 Unauthorized"**

**Causes:**
- Invalid API key
- Expired token
- Wrong authentication type

**Solutions:**
1. Verify API key is correct
2. Check key hasn't expired
3. Confirm auth type (API Key vs Bearer)
4. Regenerate key if needed

---

**Error: "404 Not Found"**

**Causes:**
- Wrong endpoint URL
- Resource doesn't exist
- API version changed

**Solutions:**
1. Check API documentation
2. Verify endpoint path
3. Confirm resource ID is valid
4. Update to correct API version

---

**Error: "429 Too Many Requests"**

**Causes:**
- Exceeded rate limit
- Too many rapid requests
- Shared rate limit hit

**Solutions:**
1. Enable auto-retry with delay
2. Reduce request frequency
3. Implement request queuing
4. Request higher rate limit

#### Slow Performance

**Symptom: Tool takes >5 seconds**

**Troubleshooting Steps:**

1. **Check API Response Time**
   - View Request/Response tab
   - Check execution time
   - Compare to API docs

2. **Review Response Size**
   - Large payloads take longer
   - Consider pagination
   - Use response transformation

3. **Test Network**
   - Try from different location
   - Check internet speed
   - Verify no proxy issues

4. **Optimize Configuration**
   - Reduce timeout if too high
   - Enable response transformation
   - Request fewer fields

#### Analytics Issues

**No Data Showing**

**Causes:**
- No tool executions yet
- Wrong date filter
- Cache not updated

**Solutions:**
1. Run some tool tests
2. Check date range filter
3. Refresh the page
4. Wait for cache to update (30s)

---

**Metrics Look Wrong**

**Causes:**
- Recent changes not reflected
- Cache timing
- Filter applied

**Solutions:**
1. Clear filters
2. Wait 30-60 seconds
3. Hard refresh (Ctrl+F5)
4. Check time range

### Getting Help

**Before Contacting Support:**

1. ✅ Check this documentation
2. ✅ Review error messages
3. ✅ Test in Request/Response tab
4. ✅ Check API provider status
5. ✅ Try with different input

**When Contacting Support, Include:**

- Tool name and ID
- Error message (full text)
- Request/Response details
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable

---

## Appendix

### Glossary

**Tool** - An action that agents can perform

**Action Type** - Category of operation (Read, Write, Update, Delete)

**Tool Type** - Implementation method (HTTP API, Calculator, Custom)

**Execution** - A single run of a tool

**Success Rate** - Percentage of executions that succeed

**Response Time** - How long a tool takes to complete

**TTL** - Time To Live (cache duration)

**Rate Limit** - Maximum requests per time period

**JSONPath** - Query language for JSON data

**Retry** - Attempting a failed request again

**Backoff** - Increasing delay between retries

### Quick Reference

**Keyboard Shortcuts:**
- `Ctrl/Cmd + K` - Search tools
- `Ctrl/Cmd + N` - New tool
- `Esc` - Close modals

**Common JSONPath Expressions:**
- `$.data` - Get data field
- `$[0]` - First item
- `$[-1]` - Last item
- `$[*]` - All items
- `$..[?(@.active)]` - Filter active

**HTTP Status Codes:**
- `200` - Success
- `201` - Created
- `400` - Bad request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not found
- `429` - Rate limited
- `500` - Server error
- `503` - Service unavailable

---

**Need More Help?**
- 📧 Email: support@example.com
- 💬 Chat: Available in dashboard
- 📚 Docs: https://docs.example.com
- 🎥 Videos: https://videos.example.com

**Version:** 1.0  
**Last Updated:** 2024  
**Feedback:** We'd love to hear from you!
