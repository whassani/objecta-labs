# 🤖 Agent Node Output Variables - Complete Guide

## Overview
When an agent node executes in a workflow, it produces output variables that can be used by subsequent nodes.

---

## 📊 Agent Output Structure

Based on the implementation in `agent-node.executor.ts`, here are the output variables:

### Success Response:
```javascript
{
  success: true,
  data: {
    agentId: "agent-123",              // ID of the agent that executed
    agentName: "My AI Assistant",      // Name of the agent
    prompt: "User prompt here",        // The actual prompt sent
    response: "AI response text...",   // The agent's response
    model: "gpt-4",                    // Model used (e.g., gpt-4, llama2)
    systemPrompt: "System context...", // System prompt/instructions
    temperature: 0.7,                  // Temperature setting (0-1)
    timestamp: "2024-01-15T10:30:00Z" // When executed
  }
}
```

### Error Response:
```javascript
{
  success: false,
  error: "Agent execution failed: error message"
}
```

---

## 🎯 Available Output Variables

### Core Variables:

| Variable | Type | Description | Example |
|----------|------|-------------|---------|
| `agentId` | String | Unique agent identifier | `"agent-abc123"` |
| `agentName` | String | Display name of agent | `"Customer Support Bot"` |
| `prompt` | String | Prompt sent to agent | `"Analyze this customer feedback"` |
| `response` | String | Agent's text response | `"The sentiment is positive..."` |
| `model` | String | LLM model used | `"gpt-4"`, `"llama2"`, `"claude-3"` |
| `systemPrompt` | String | System context/instructions | `"You are a helpful assistant"` |
| `temperature` | Number | Creativity setting (0-1) | `0.7` |
| `timestamp` | String | ISO 8601 timestamp | `"2024-01-15T10:30:00Z"` |

### Future Variables (Coming Soon):
| Variable | Type | Description |
|----------|------|-------------|
| `tokens` | Number | Tokens used in request |
| `completionTokens` | Number | Tokens in response |
| `cost` | Number | Estimated API cost |
| `latency` | Number | Response time (ms) |
| `actualResponse` | Object | Full LLM response object |

---

## 📝 How to Use Output Variables

### In Subsequent Nodes:

#### 1. Access Agent Response:
```javascript
// In next node's configuration
{{previousOutput.response}}
```

#### 2. Access Agent Name:
```javascript
{{previousOutput.agentName}}
```

#### 3. Access Model Used:
```javascript
{{previousOutput.model}}
```

#### 4. Check Success:
```javascript
{{previousOutput.success}}
```

---

## 🔗 Workflow Examples

### Example 1: Customer Support Flow

```
┌────────────────┐
│ Trigger:       │
│ New Ticket     │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Agent Node:    │ Output: { response: "Sentiment is negative..." }
│ Analyze        │
│ Sentiment      │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Condition:     │ Condition: {{previousOutput.response}} contains "negative"
│ Check Result   │
└────────┬───────┘
         │
    Yes  │  No
         ▼
```

**Variables Available:**
- `{{previousOutput.response}}` → Full AI analysis
- `{{previousOutput.agentName}}` → "Sentiment Analyzer"
- `{{previousOutput.timestamp}}` → When analyzed

---

### Example 2: Content Generation

```
┌────────────────┐
│ Agent: Write   │ Output: { response: "Blog post content..." }
│ Blog Post      │
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Agent: Review  │ Input: {{previousOutput.response}}
│ & Edit         │ Output: { response: "Edited version..." }
└────────┬───────┘
         │
         ▼
┌────────────────┐
│ Action: Save   │ Data: {{previousOutput.response}}
│ to Database    │
└────────────────┘
```

**Chained Variables:**
- First agent: `{{previousOutput.response}}` → Draft
- Second agent: Uses draft as input
- Save action: Uses final edited version

---

### Example 3: Multi-Agent Workflow

```
┌─────────────┐
│ Agent: Plan │ → planOutput
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Agent:      │ Input: {{planOutput.response}}
│ Research    │ → researchOutput
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Agent:      │ Input: {{planOutput.response}}, {{researchOutput.response}}
│ Write       │ → writeOutput
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Final       │ All outputs available:
│ Output      │ - {{planOutput.response}}
└─────────────┘ - {{researchOutput.response}}
                - {{writeOutput.response}}
```

---

## 🎨 Accessing Nested Variables

### Response Text:
```javascript
// Direct access
{{agentOutput.response}}

// Length
{{agentOutput.response.length}}

// Contains check (in condition)
agentOutput.response.includes("keyword")
```

### Agent Metadata:
```javascript
// Agent name
{{agentOutput.agentName}}

// Model used
{{agentOutput.model}}

// Temperature setting
{{agentOutput.temperature}}
```

### Timestamp:
```javascript
// Full timestamp
{{agentOutput.timestamp}}

// Format in JS
new Date(agentOutput.timestamp).toLocaleDateString()
```

---

## 🔍 Conditional Logic with Agent Output

### Example Conditions:

#### Check for Keywords:
```javascript
// Condition node
agentOutput.response.toLowerCase().includes("urgent")
```

#### Check Response Length:
```javascript
agentOutput.response.length > 100
```

#### Check Model Used:
```javascript
agentOutput.model === "gpt-4"
```

#### Check Success:
```javascript
agentOutput.success === true
```

---

## 💡 Common Use Cases

### 1. Sentiment Analysis
```javascript
Agent Output:
{
  response: "Sentiment: Negative. Customer is frustrated.",
  agentName: "Sentiment Analyzer"
}

Next Node:
if (agentOutput.response.includes("Negative")) {
  // Route to high-priority queue
}
```

### 2. Content Moderation
```javascript
Agent Output:
{
  response: "Content is safe. No policy violations detected.",
  agentName: "Content Moderator"
}

Next Node:
if (agentOutput.response.includes("safe")) {
  // Publish content
} else {
  // Flag for review
}
```

### 3. Data Extraction
```javascript
Agent Output:
{
  response: "Name: John Doe, Email: john@example.com, Phone: 555-0100",
  agentName: "Data Extractor"
}

Next Node:
// Parse extracted data from response
const email = extractEmail(agentOutput.response);
```

### 4. Translation
```javascript
Agent Output:
{
  response: "Hola, ¿cómo estás?",
  agentName: "Translator",
  model: "gpt-4"
}

Next Node:
// Use translated text
sendEmail(agentOutput.response);
```

---

## 🛠️ Variable Interpolation

### In Action Nodes:

**HTTP Request Body:**
```json
{
  "message": "{{agentOutput.response}}",
  "agent": "{{agentOutput.agentName}}",
  "timestamp": "{{agentOutput.timestamp}}"
}
```

**Email Content:**
```
Subject: Response from {{agentOutput.agentName}}

Body:
{{agentOutput.response}}

Powered by {{agentOutput.model}}
Timestamp: {{agentOutput.timestamp}}
```

**Log Message:**
```
Agent "{{agentOutput.agentName}}" executed using {{agentOutput.model}} 
and returned: {{agentOutput.response}}
```

---

## 🔄 Looping with Agent Output

### Process Multiple Items:

```javascript
Loop through items:
  For each item:
    Agent analyzes item
    Output: agentOutput.response
    Store result
    
After loop:
  All results available in array
```

**Example:**
```
Items: ["Review 1", "Review 2", "Review 3"]

Loop:
  Item 1 → Agent → Output: { response: "Positive" }
  Item 2 → Agent → Output: { response: "Negative" }
  Item 3 → Agent → Output: { response: "Neutral" }
  
Results: ["Positive", "Negative", "Neutral"]
```

---

## 📊 Output in Variable Inspector

When debugging with breakpoints and variable inspection, you'll see:

```javascript
Variables at Agent Node:
┌──────────────────────────────────────┐
│ Input:                               │
│ {                                    │
│   prompt: "Analyze this text..."    │
│ }                                    │
├──────────────────────────────────────┤
│ Output:                              │
│ {                                    │
│   success: true,                     │
│   data: {                            │
│     agentId: "agent-123",            │
│     agentName: "Analyzer",           │
│     response: "Analysis result...",  │
│     model: "gpt-4",                  │
│     timestamp: "2024-01-15..."       │
│   }                                  │
│ }                                    │
└──────────────────────────────────────┘
```

---

## 🚀 Best Practices

### Do:
✅ Store agent output in variables for later use
✅ Check `success` before using response
✅ Use descriptive agent names for clarity
✅ Log important responses
✅ Handle errors gracefully

### Don't:
❌ Assume agent always succeeds
❌ Ignore error messages
❌ Hardcode expected responses
❌ Forget to interpolate variables
❌ Lose track of which agent produced what

---

## 🔮 Future Enhancements

### Coming Soon:
- **Token Usage**: Track tokens consumed
- **Cost Tracking**: Monitor API costs
- **Latency Metrics**: Response times
- **Confidence Scores**: AI confidence levels
- **Citations**: Source references
- **Function Calls**: Tool usage by agent

---

## 📚 Quick Reference

### Most Common Variables:

```javascript
// Agent's text response
{{agentOutput.response}}

// Agent name
{{agentOutput.agentName}}

// Check if successful
{{agentOutput.success}}

// Model used
{{agentOutput.model}}

// When executed
{{agentOutput.timestamp}}
```

---

## ✨ Summary

### Agent Output Variables:
- ✅ `response` - Main AI response text
- ✅ `agentName` - Which agent executed
- ✅ `model` - Which model was used
- ✅ `prompt` - What was asked
- ✅ `temperature` - Creativity setting
- ✅ `timestamp` - When executed
- ✅ `success` - Whether it succeeded

### Use In:
- Condition nodes (if/else logic)
- Action nodes (HTTP, email, etc.)
- Other agent nodes (chaining)
- Loop nodes (iterate over results)
- Variables panel (debugging)

**Now you know exactly what variables are available from agent nodes!** 🤖✨
