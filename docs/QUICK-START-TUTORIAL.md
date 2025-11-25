# Quick Start Tutorial - 5 Minutes to Your First Tool

## Tutorial Overview
In this tutorial, you'll:
1. Create your first tool in 2 minutes
2. Test it successfully
3. View it in analytics

**Time Required:** 5 minutes  
**Difficulty:** Beginner  
**What You'll Build:** A working weather API tool

---

## Step 1: Create a Tool (2 minutes)

### 1.1 Navigate to Tools
Click **"Tools & Actions"** in the left sidebar.

### 1.2 Click "Create Tool"
Click the blue **"Create Tool"** button in the top right.

### 1.3 Fill in Basic Info

**Tool Name:**
```
Weather Checker
```

**Description:**
```
Gets current weather for any city using OpenWeatherMap API
```

**Tool Type:** Select `HTTP API`

**Action Type:** Select `Read`

Click **"Next"**

### 1.4 Configure the API

**URL:**
```
https://api.openweathermap.org/data/2.5/weather
```

**Method:** Select `GET`

**Headers:** (Optional - we'll skip for now)

**Authentication:** Select `None` (we'll use query parameters)

**Parameters:** (The API needs these)
```
appid: your_api_key_here
units: metric
```

Click **"Next"**

### 1.5 Settings

**Rate Limit:**
```
60
```

**Requires Approval:**
```
☐ Unchecked
```

**Enabled:**
```
☑ Checked
```

Click **"Next"**

### 1.6 Advanced (Optional)

For now, skip this step. Click **"Create Tool"**

✅ **Success!** Your tool is created!

---

## Step 2: Test Your Tool (2 minutes)

### 2.1 Open Test Modal

Find your "Weather Checker" tool in the list.

Click the **beaker icon** 🧪 to open the test modal.

### 2.2 Enter Test Input

In the "Test" tab, enter:

```json
{
  "q": "London"
}
```

### 2.3 Run the Test

Click **"Test Tool"**

### 2.4 View Results

You should see:

```json
{
  "success": true,
  "result": {
    "coord": { "lon": -0.1257, "lat": 51.5085 },
    "weather": [
      {
        "id": 801,
        "main": "Clouds",
        "description": "few clouds"
      }
    ],
    "main": {
      "temp": 15.23,
      "feels_like": 14.67,
      "temp_min": 13.89,
      "temp_max": 16.11,
      "pressure": 1013,
      "humidity": 72
    },
    "name": "London"
  },
  "executionTime": 342
}
```

✅ **Success!** Your tool works!

### 2.5 Check Request/Response

Click the **"Request/Response"** tab to see:
- Exact URL called
- Headers sent
- Response status (200 OK)

### 2.6 View History

Click the **"History"** tab to see your test saved!

---

## Step 3: View Analytics (1 minute)

### 3.1 Switch to Analytics

Click the **"Analytics"** button at the top.

### 3.2 See Your Stats

You'll see:
- **Total Executions:** 1
- **Success Rate:** 100%
- **Avg Response Time:** ~342ms

### 3.3 Find Your Tool

Scroll to "Top Tools by Usage" table.

Your "Weather Checker" should be there with:
- 1 execution
- 100% success rate
- Response time shown

---

## 🎉 Congratulations!

You've successfully:
- ✅ Created a tool
- ✅ Tested it successfully
- ✅ Viewed analytics

---

## What's Next?

### Try These Next Steps:

#### 1. Add Response Transformation
Make the output cleaner:

1. Edit your tool
2. Go to "Advanced" step
3. Enable "Response Transformation"
4. Type: `JSONPath`
5. Expression: `$.main.temp`
6. Save and test again

Now you'll get just the temperature!

#### 2. Add Auto-Retry
Make it more reliable:

1. Edit your tool
2. Go to "Advanced" step
3. Enable "Auto-Retry"
4. Max Retries: `3`
5. Retry Delay: `1000`
6. Retry On: `5xx, network`
7. Save

Now it retries on failures!

#### 3. Create from Template
Try a pre-built tool:

1. Click "Templates"
2. Choose "GitHub API"
3. Click "Use Template"
4. Add your GitHub token
5. Test it!

#### 4. Test Different Cities
Go back to your weather tool:

Try these inputs:
```json
{"q": "Paris"}
{"q": "Tokyo"}
{"q": "New York"}
```

View all tests in History tab!

---

## Common Issues

### ❌ Error: "401 Unauthorized"
**Cause:** Invalid API key

**Fix:** Get a free key from https://openweathermap.org/api
```
1. Sign up for free
2. Get your API key
3. Add it to Parameters as "appid"
```

### ❌ Error: "Connection timeout"
**Cause:** API is slow or down

**Fix:** 
1. Check https://status.openweathermap.org
2. Try again in a few seconds
3. Increase timeout in settings

### ❌ No results showing
**Cause:** Wrong parameter name

**Fix:** Make sure you use `q` not `city`:
```json
{"q": "London"}  ✅ Correct
{"city": "London"}  ❌ Wrong
```

---

## Next Tutorials

### 📚 Continue Learning:

1. **[Advanced Tutorial]** - Create a multi-step workflow
2. **[API Integration]** - Connect to your own API
3. **[Error Handling]** - Handle failures gracefully
4. **[Best Practices]** - Production-ready tools

---

**Questions?** 
- Check the [Complete User Guide](USER-GUIDE-COMPLETE.md)
- Contact support
- Join our community

**Happy Building!** 🚀
