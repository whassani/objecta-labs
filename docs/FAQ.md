# Frequently Asked Questions (FAQ)

## General Questions

### What is a "Tool" in the AI Agent Platform?

A tool is an action that your AI agents can perform, such as calling an API, performing calculations, or fetching data. Tools enable agents to interact with external systems and services.

**Simple Analogy:** Think of tools like apps on a smartphone. Each tool gives your agent a specific capability, just like how apps give your phone new features.

---

### How many tools can I create?

There is no hard limit on the number of tools you can create. However, we recommend organizing tools logically and archiving unused ones to keep your workspace manageable.

**Best Practice:** Start with 5-10 essential tools and expand as needed.

---

### Are tools shared across my organization?

Yes, tools are organization-scoped. All users in your organization can see and use the tools you create (subject to permissions).

**Privacy Note:** Tools in different organizations are completely isolated.

---

### Can I use tools without assigning them to an agent?

Yes! You can test tools independently using the test modal. This is useful for:
- Verifying configuration
- Debugging issues
- Manual API testing
- Development workflows

---

## Tool Creation

### Which tool type should I choose?

**HTTP API** - For most web APIs (REST, GraphQL)
- ✅ Use for: Stripe, GitHub, OpenAI, any REST API
- Example: Weather data, user lookup, send email

**Calculator** - For mathematical operations
- ✅ Use for: Calculations, formulas, numeric processing
- Example: Tax calculations, unit conversions

**Custom** - For advanced scenarios (coming soon)
- Future support for: Database queries, file operations

**👉 Recommendation:** 95% of tools will be HTTP API type.

---

### What's the difference between action types?

**Read** - Gets data without changing anything
- GET requests
- Data fetching
- Queries
- Safe to run repeatedly

**Write** - Creates new data
- POST requests
- Creates resources
- Sends messages
- Consider requiring approval

**Update** - Modifies existing data
- PUT/PATCH requests
- Updates records
- Changes state
- Consider requiring approval

**Delete** - Removes data
- DELETE requests
- Destructive operations
- ⚠️ Always require approval

**👉 Recommendation:** Choose based on the HTTP method you're using.

---

### Can I change the tool type after creation?

No, tool type and action type are immutable after creation. This is a safety feature to prevent accidental changes that could break integrations.

**Workaround:** Duplicate the tool and create a new one with the correct type.

---

### What authentication types are supported?

**None** - Public APIs, no auth needed
- Example: Public weather data

**API Key** - Most common for modern APIs
- Example: OpenWeatherMap, most SaaS APIs
- Typically sent in headers: `X-API-Key: abc123`

**Bearer Token** - OAuth2, JWT tokens
- Example: GitHub, Auth0
- Format: `Authorization: Bearer token123`

**Basic Auth** - Legacy systems
- Example: Old enterprise APIs
- Username + Password encoded

**Custom Headers** - Non-standard auth
- Configure manually in headers

**👉 Recommendation:** Use API Key for most modern APIs.

---

## Tool Configuration

### How do I add custom headers?

1. In the Configuration step, find "Headers" section
2. Click "Add Header"
3. Enter key-value pairs:

```
Key: X-Custom-Header
Value: my-value

Key: Authorization
Value: Bearer token123
```

**Common Headers:**
- `Content-Type: application/json`
- `Accept: application/json`
- `User-Agent: MyApp/1.0`
- `X-API-Key: your-key`

---

### What's a good rate limit to set?

Start conservative and adjust based on monitoring:

**Low Volume (Personal use):**
- Rate Limit: 60 per minute
- ~1 request per second

**Medium Volume (Team use):**
- Rate Limit: 600 per minute
- ~10 requests per second

**High Volume (Production):**
- Rate Limit: 6000 per minute
- ~100 requests per second

**⚠️ Important:** Check your API provider's limits and stay well below them.

**Formula:**
```
Expected Users × Requests per User per Hour ÷ 60 = Requests per Minute

Example:
100 users × 30 requests/hour ÷ 60 = 50 requests/minute
Set limit to: 100/min (2x buffer)
```

---

### Should I require approval for my tool?

**Require Approval When:**
- ✅ Tool costs money (payments, SMS)
- ✅ Tool sends external communications (email, Slack)
- ✅ Tool modifies or deletes data
- ✅ Tool accesses sensitive information
- ✅ Tool has compliance requirements

**Don't Require Approval When:**
- ✅ Tool only reads public data
- ✅ Tool performs calculations
- ✅ Tool is for testing/development
- ✅ Operations are reversible

**Default Recommendation:**
- Read actions: No approval
- Write/Update: Consider approval
- Delete: Always require approval

---

## Testing

### Why does my test fail with "Connection timeout"?

**Common Causes:**

1. **API is down or slow**
   - Check API status page
   - Try in browser
   - Contact provider

2. **Wrong URL**
   - Verify endpoint spelling
   - Check for extra spaces
   - Confirm protocol (http vs https)

3. **Network/Firewall issues**
   - Try from different network
   - Check firewall rules
   - Contact IT if corporate network

4. **Timeout too short**
   - Increase timeout setting
   - Some APIs are slow (>5s)
   - Default: 30 seconds

**Solution Steps:**
```
1. Check API status
2. Verify URL in browser
3. Test with curl/Postman
4. Increase timeout to 60s
5. Contact support if persists
```

---

### Why do I get "401 Unauthorized"?

**Common Causes:**

1. **Invalid API Key**
   - Copy-paste error
   - Wrong key (dev vs prod)
   - Key has been regenerated

2. **Wrong Auth Type**
   - Using API Key instead of Bearer
   - Using Bearer instead of API Key
   - Needs Basic Auth

3. **Expired Credentials**
   - Token has expired
   - Key has been rotated
   - Subscription ended

4. **Wrong Header Name**
   - Should be `X-API-Key` not `API-Key`
   - Case-sensitive
   - Check API docs

**Solution Steps:**
```
1. Regenerate API key
2. Copy fresh key carefully
3. Verify auth type matches API docs
4. Check header name spelling
5. Test in Request/Response tab
```

---

### How do I test with different inputs?

**Method 1: Manual Entry**
1. Open test modal
2. Change input JSON
3. Click "Test Tool"
4. Repeat

**Method 2: Use History**
1. Run several tests
2. Click "History" tab
3. Click any previous test
4. It loads that input
5. Modify and re-test

**Method 3: Quick Examples**
For Calculator tools, use the quick examples provided.

**Pro Tip:** Keep a list of test cases in a text file for easy copy-paste.

---

### What does the Request/Response tab show?

**Request Section:**
- **Method:** GET, POST, PUT, DELETE
- **URL:** Full URL with query parameters
- **Headers:** All headers sent (including auth)
- **Body:** Request payload (for POST/PUT)
- **Params:** Query parameters

**Response Section:**
- **Status:** HTTP status code (200, 404, etc.)
- **Status Text:** OK, Not Found, etc.
- **Headers:** Response headers
- **Time:** Execution time in milliseconds

**Use Cases:**
- Debug authentication issues
- Verify correct endpoint
- Check request format
- Troubleshoot errors
- Learn API behavior

---

## Advanced Features

### What is Response Transformation?

Response Transformation automatically extracts or modifies API responses before returning them.

**Without Transformation:**
```json
{
  "status": "success",
  "data": {
    "users": [...100 fields...],
    "metadata": {...},
    "pagination": {...}
  }
}
```

**With JSONPath `$.data.users[*].name`:**
```json
["Alice", "Bob", "Charlie"]
```

**Benefits:**
- ✅ Simpler responses
- ✅ Faster processing
- ✅ Less bandwidth
- ✅ Easier to work with

---

### JSONPath vs JavaScript - which should I use?

**Use JSONPath when:**
- ✅ Simple data extraction
- ✅ Filtering by properties
- ✅ Selecting specific fields
- ✅ You want it fast and safe

**Use JavaScript when:**
- ✅ Complex calculations needed
- ✅ Custom logic required
- ✅ Combining multiple fields
- ✅ Advanced transformations

**Performance:**
- JSONPath: Very fast
- JavaScript: Slightly slower (sandboxed)

**Security:**
- Both are safe and sandboxed

**👉 Recommendation:** Start with JSONPath, switch to JavaScript if you need more power.

---

### How does Auto-Retry work?

**Basic Flow:**
```
Attempt 1: Run tool
    ↓ (fails with 503)
Wait [Retry Delay]ms
    ↓
Attempt 2: Retry
    ↓ (fails with 503)
Wait [Retry Delay × Backoff]ms
    ↓
Attempt 3: Retry
    ↓ (succeeds!)
Return Success ✅
```

**Configuration Example:**
```
Max Retries: 3
Retry Delay: 1000ms
Backoff Multiplier: 2
Retry On: 5xx, network
```

**Timeline:**
```
0ms: First attempt (fail)
1000ms: Second attempt (fail)
3000ms: Third attempt (fail)
7000ms: Fourth attempt (success!)
```

**When Retries Happen:**
- ✅ 5xx errors (server issues)
- ✅ Network timeouts
- ✅ Connection refused
- ❌ 4xx errors (client errors - won't retry)

---

### What are Environments and when should I use them?

**Environments** are different configurations of the same tool for different contexts (dev, staging, production).

**Use Cases:**

**1. Safe Testing**
```
Development: Test with fake data
Staging: Verify with production-like data
Production: Real operations
```

**2. Different API Keys**
```
Dev: dev_key_123 (free tier)
Prod: prod_key_456 (paid tier)
```

**3. Different Endpoints**
```
Dev: https://sandbox-api.example.com
Prod: https://api.example.com
```

**Workflow:**
```
1. Create in Development
2. Test thoroughly
3. Switch to Staging
4. Final verification
5. Switch to Production
6. Monitor closely
```

**👉 Recommendation:** Use environments if you have separate dev/prod APIs or want safe testing.

---

### How does versioning work?

**Automatic Snapshots:**
- Created on every tool update
- Includes all configuration
- Immutable (can't be changed)
- Tracked by version number

**What's Saved:**
- Name and description
- Configuration (URL, method, etc.)
- Retry settings
- Transformation rules
- All settings

**Use Cases:**

**1. Undo Mistakes**
```
You: Changed URL incorrectly
You: Tool stops working
You: Restore previous version ✅
```

**2. Track Changes**
```
What changed between v5 and v6?
- URL updated
- Retry enabled
- Transformation added
```

**3. Audit Trail**
```
Who changed it? John Doe
When? 2024-01-15 14:30
Why? "Updated to API v2"
```

**4. Safe Experimentation**
```
Try new configuration
Doesn't work?
Restore previous version
```

---

## Analytics & Monitoring

### What should my success rate be?

**Target Guidelines:**

**Excellent: >98%**
- Well-configured tool
- Reliable API
- Good error handling

**Good: 95-98%**
- Normal operations
- Occasional issues
- Acceptable

**Needs Attention: 90-95%**
- Investigate errors
- Review configuration
- Check API health

**Critical: <90%**
- Major issues
- Immediate action needed
- Check error breakdown

**Industry Standards:**
- Production APIs: >99%
- Development: >95%
- Experimental: >90%

---

### What's a good response time?

**Response Time Guidelines:**

**Excellent: <200ms**
- Fast API
- Good network
- Optimal configuration

**Good: 200-500ms**
- Normal for most APIs
- Acceptable user experience

**Acceptable: 500-1000ms**
- Slower APIs
- Consider optimization
- Monitor trends

**Slow: >1000ms**
- Performance issue
- User experience impacted
- Needs investigation

**Factors Affecting Speed:**
- API provider speed
- Network latency
- Response size
- Transformation complexity

---

### How often should I check analytics?

**Recommended Schedule:**

**Daily (2 minutes):**
- Quick dashboard check
- Verify success rates
- Note any anomalies

**Weekly (10 minutes):**
- Review trends
- Check error breakdown
- Identify slow tools
- Plan improvements

**Monthly (30 minutes):**
- Deep analysis
- Compare to baselines
- Review optimization opportunities
- Adjust configurations

**Real-time:**
- After deploying changes
- During incidents
- When issues reported
- System monitoring alerts

---

### What do the error categories mean?

**Timeout**
- Request took too long
- API didn't respond in time
- Solution: Increase timeout or enable retry

**Network Error**
- Connection failed
- DNS issues
- Solution: Check network, verify URL

**Authentication Error**
- Invalid credentials
- Expired token
- Solution: Update API key/token

**Permission Denied**
- Valid auth but insufficient permissions
- Solution: Check account permissions

**Not Found**
- Resource doesn't exist
- Wrong endpoint
- Solution: Verify URL and resource ID

**Rate Limit Exceeded**
- Too many requests
- Solution: Reduce frequency or increase limit

**Server Error**
- API provider issue
- Solution: Wait and retry, or contact provider

**Service Unavailable**
- API temporarily down
- Maintenance mode
- Solution: Wait or check status page

---

## Bulk Operations

### How do I select multiple tools?

**Method 1: Individual Selection**
- Click checkbox next to each tool
- Selected tools highlight in blue

**Method 2: Select All**
- Click "Select All" checkbox at top
- All visible tools selected

**Method 3: Range Selection**
- Click first tool's checkbox
- Hold Shift
- Click last tool's checkbox
- All tools in range selected

---

### Can I undo a bulk delete?

**No, bulk delete is permanent.** This is why we show a confirmation dialog.

**Protection Measures:**
1. Confirmation required
2. Shows count of tools to be deleted
3. Lists tool names
4. Must click "Confirm Delete"

**Alternative: Export First**
```
1. Select tools you might delete
2. Export them first (backup)
3. Then perform delete
4. Can re-import if needed
```

**👉 Recommendation:** Always export before bulk deleting.

---

### What happens when I bulk disable?

**Immediate Effects:**
- Tools stop working for agents
- Tests still work (for debugging)
- Analytics still tracked
- Configuration preserved

**Use Cases:**
- Maintenance window
- API provider downtime
- Testing new configurations
- Temporary shutdown

**Re-enabling:**
- Simply select and click "Enable"
- Takes effect immediately
- No configuration lost

---

## Import/Export

### What format is the export file?

**Format:** JSON (JavaScript Object Notation)

**Structure:**
```json
[
  {
    "name": "Tool 1",
    "description": "...",
    "toolType": "http-api",
    "config": {...},
    ...
  },
  {
    "name": "Tool 2",
    ...
  }
]
```

**File Naming:**
- Format: `tools-export-YYYY-MM-DD.json`
- Example: `tools-export-2024-01-15.json`

**Can I edit it?**
- Yes, it's plain text JSON
- Use any text editor
- Validate JSON before importing
- Be careful with syntax

---

### What's NOT included in exports?

**Excluded (Security):**
- Organization IDs
- Tool IDs (new ones generated)
- User IDs
- Timestamps
- Execution history

**Included:**
- Tool name and description
- Tool type and action type
- Complete configuration
- All settings
- Retry config
- Transformation rules

**Why?**
- Security (no sensitive IDs)
- Portability (works across orgs)
- Clean import (fresh IDs)

---

### Can I import tools from another platform?

**Direct Import:** No, only our JSON format supported.

**Workaround:**
1. Manually create a JSON file
2. Match our format (see export example)
3. Import the file

**Format Template:**
```json
[
  {
    "name": "Your Tool Name",
    "description": "Tool description",
    "toolType": "http-api",
    "actionType": "read",
    "config": {
      "url": "https://api.example.com",
      "method": "GET",
      "headers": {},
      "auth": {"type": "none"}
    },
    "requiresApproval": false,
    "rateLimit": 60,
    "isEnabled": true
  }
]
```

---

### Can I share tools with other organizations?

**Not Directly:** Tools are organization-scoped for security.

**Sharing Methods:**

**1. Export/Import**
```
Org A: Export tools
Send file to Org B
Org B: Import tools
```

**2. JSON Template**
```
Create generic template
Remove sensitive data
Share template file
Others customize and import
```

**3. Documentation**
```
Document configuration
Share instructions
Others recreate manually
```

**👉 Recommendation:** Use export/import for trusted partners, templates for public sharing.

---

## Troubleshooting

### My tool worked yesterday but fails today. Why?

**Common Causes:**

**1. API Provider Changes**
- API version updated
- Endpoint deprecated
- Authentication changed

**2. Credentials Expired**
- API key rotated
- Token expired
- Subscription ended

**3. Rate Limits Changed**
- Provider reduced limits
- Usage increased
- New restrictions

**4. Network Changes**
- Firewall rules updated
- IP whitelist changed
- Network configuration

**Investigation Steps:**
```
1. Check API provider status page
2. Review provider emails/announcements
3. Test with fresh credentials
4. Check error breakdown in analytics
5. Review request/response details
6. Contact provider support
```

---

### How do I debug a failing tool?

**Step-by-Step Debugging:**

**1. Open Test Modal**
- Click beaker icon on tool

**2. Run Test**
- Enter valid input
- Click "Test Tool"
- Note the error

**3. Check Request/Response Tab**
- View exact request sent
- See response received
- Check status code

**4. Common Issues:**

**401/403:** Authentication problem
```
Fix: Update credentials
```

**404:** Wrong endpoint
```
Fix: Verify URL
```

**429:** Rate limit
```
Fix: Enable retry, reduce frequency
```

**500-503:** Server error
```
Fix: Wait and retry, contact provider
```

**Timeout:** Too slow
```
Fix: Increase timeout, check API status
```

**5. Test Fixes**
- Make configuration changes
- Test again
- Verify in Request/Response tab

---

### Performance is suddenly slow. What should I check?

**Investigation Checklist:**

**1. Analytics Dashboard**
```
- Check avg response time trend
- When did slowdown start?
- Affecting all tools or specific ones?
```

**2. API Provider Status**
```
- Visit status.provider.com
- Check for incidents
- Review performance updates
```

**3. Response Size**
```
- View in Request/Response tab
- Has payload size increased?
- Can you apply transformation?
```

**4. Network**
```
- Test from different location
- Check internet speed
- Verify no proxy issues
```

**5. Configuration**
```
- Recently added transformation?
- Changed any settings?
- New headers added?
```

**Quick Fixes:**
- Enable response transformation
- Increase rate limit (if hitting ceiling)
- Disable unnecessary headers
- Contact API provider

---

## Getting Help

### Where can I find more help?

**Documentation:**
- 📚 User Guide (comprehensive)
- 🎯 Quick Start Tutorial (5 min)
- 📖 Tutorials Collection (all levels)
- ❓ This FAQ

**Support Channels:**
- 💬 In-app chat (fastest)
- 📧 Email: support@example.com
- 🎫 Support tickets
- 📞 Phone (enterprise plans)

**Community:**
- 💬 Community forum
- 👥 User groups
- 🐦 Twitter @example
- 💼 LinkedIn community

**Resources:**
- 🎥 Video tutorials
- 📝 Blog posts
- 🎤 Webinars
- 📊 Case studies

---

### What information should I include when asking for help?

**Essential Information:**

**1. Tool Details**
```
Tool Name: Weather Checker
Tool ID: (from URL)
Type: HTTP API
Action: Read
```

**2. Error Details**
```
Error Message: "401 Unauthorized"
When: Started 2024-01-15
Frequency: Every request
```

**3. What You've Tried**
```
- Regenerated API key
- Tested in browser (works)
- Checked Request/Response tab
- Reviewed documentation
```

**4. Request/Response Data**
```
Request URL: https://...
Request Headers: {...}
Response Status: 401
Response Body: {...}
```

**5. Screenshots**
- Error messages
- Configuration screens
- Analytics dashboard
- Request/Response tab

**What NOT to Include:**
- ❌ Actual API keys (use placeholders)
- ❌ Passwords
- ❌ Sensitive data
- ❌ Customer information

---

### Is there a status page for the platform?

Yes! Check **status.example.com** for:
- Platform uptime
- Ongoing incidents
- Scheduled maintenance
- Historical uptime data
- Subscribe to updates

---

## Still Have Questions?

**Can't find your answer?**

1. 📚 Search the [Complete User Guide](USER-GUIDE-COMPLETE.md)
2. 🎯 Try the [Quick Start Tutorial](QUICK-START-TUTORIAL.md)
3. 📖 Browse [Tutorials Collection](TUTORIALS-COLLECTION.md)
4. 💬 Contact support
5. 🤝 Ask the community

**We're here to help!** 🚀

---

**Last Updated:** 2024  
**Version:** 1.0  
**Feedback:** help@example.com
