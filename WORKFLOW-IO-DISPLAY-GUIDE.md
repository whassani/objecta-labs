# 📊 Workflow Input/Output Display Guide

## 🎯 For Workflow Designers (Non-Technical Users)

Now you can easily see the input and output of your entire workflow AND each individual node - no coding required!

---

## ✨ New Features

### 1. **Workflow Result** (Overall Input/Output)

When your workflow completes, you'll see a **green section at the top** showing:

```
┌─────────────────────────────────────────┐
│ ✓ Workflow Result                       │
├─────────────────────────────────────────┤
│  📥 Input         │  📤 Output           │
│  {                │  {                   │
│    "message":...  │    "response":...    │
│  }                │  }                   │
└─────────────────────────────────────────┘
```

**What it shows:**
- **📥 Input:** The data you sent to the workflow (your test data)
- **📤 Output:** The final result from the workflow (what the workflow produced)

**When it appears:**
- Automatically shows when workflow completes
- Always at the top of the debug panel
- Side-by-side view for easy comparison

### 2. **Node Input/Output** (Individual Node Details)

Click on **any node** in the "Node Execution Status" section to see:

```
┌─────────────────────────────────────────┐
│ 👁 Agent Node - Input/Output            │
├─────────────────────────────────────────┤
│  📥 Input         │  📤 Output           │
│  {                │  {                   │
│    "prompt":...   │    "response":...    │
│  }                │    "usage": {...}    │
│                   │  }                   │
└─────────────────────────────────────────┘
```

**What it shows:**
- **📥 Input:** What data this node received
- **📤 Output:** What data this node produced

**How to use it:**
1. Look at the "Node Execution Status" section
2. Click on any node (Trigger, Agent, etc.)
3. A blue panel appears showing that node's I/O
4. Click another node to see its I/O

---

## 📖 How to Use

### Step-by-Step Example

**Scenario:** You created a simple workflow: Trigger → Agent

#### Step 1: Run Your Test

1. Click **"Test Workflow"**
2. Enter test data:
   ```json
   {
     "message": "Say hello",
     "userId": "test-123"
   }
   ```
3. Click **"Run Test"**
4. Wait for completion

#### Step 2: See Overall Results

After completion, the **green "Workflow Result"** section appears at top:

**Input (what you sent):**
```json
{
  "message": "Say hello",
  "userId": "test-123"
}
```

**Output (what you got back):**
```json
{
  "response": "Hello! 👋 It's wonderful to connect with you...",
  "agentId": "abc-123",
  "model": "mistral",
  "usage": {
    "totalTokens": 70
  }
}
```

✅ **Now you can see if the workflow produced the right output!**

#### Step 3: Debug Individual Nodes

Want to see what each node did? Click on them!

**Click "Trigger" node:**

Shows:
- **Input:** `{}` (trigger starts the flow)
- **Output:** Your test data

**Click "Agent" node:**

Shows:
- **Input:** The prompt given to the agent
- **Output:** The AI's response + metadata

✅ **Now you can debug exactly where data flows!**

---

## 💡 Common Use Cases

### Use Case 1: Verify Workflow Works Correctly

**Question:** "Did my workflow produce the right output?"

**Answer:**
1. Look at **Workflow Result** section
2. Check the **📤 Output** side
3. Compare with what you expected

✅ If output matches expectations → Workflow works!
❌ If output is wrong → Check individual nodes

### Use Case 2: Debug Where Things Go Wrong

**Question:** "Which node is producing bad data?"

**Answer:**
1. Click each node one by one
2. Check its **📤 Output**
3. See if it matches what you expected

**Example:**
- Trigger output: ✅ Correct
- Agent output: ❌ Wrong response
- **Problem found:** Agent node needs better prompt!

### Use Case 3: Understand Data Flow

**Question:** "How does data move through my workflow?"

**Answer:**
1. Click "Trigger" → See what starts the flow
2. Click "Agent" → See what agent received and produced
3. Click next nodes → Follow the data path

✅ **You can now trace data through your entire workflow!**

### Use Case 4: Share Results

**Question:** "How do I show my team what the workflow produces?"

**Answer:**
1. Run the workflow
2. Screenshot the **Workflow Result** section
3. Share the input/output with your team

✅ **Easy to communicate results!**

---

## 🎨 Visual Guide

### What You'll See After Execution:

```
┌────────────────────────────────────────────────────┐
│ ✓ Completed (12.5s)            [Controls]          │ ← Header
├────────────────────────────────────────────────────┤
│ ✓ Workflow Result                                  │ ← NEW!
│ ┌──────────────────┐  ┌──────────────────┐        │
│ │ 📥 Input         │  │ 📤 Output        │        │
│ │ { "message"...}  │  │ { "response"...} │        │
│ └──────────────────┘  └──────────────────┘        │
├────────────────────────────────────────────────────┤
│ Node Execution Status (Click to see I/O)          │ ← Instruction
│ [✓ Trigger] [✓ Agent]                             │ ← Clickable!
├────────────────────────────────────────────────────┤
│ 👁 Agent - Input/Output                            │ ← NEW! (appears when clicked)
│ ┌──────────────────┐  ┌──────────────────┐        │
│ │ 📥 Input         │  │ 📤 Output        │        │
│ │ { "prompt"...}   │  │ { "response"...} │        │
│ └──────────────────┘  └──────────────────┘        │
└────────────────────────────────────────────────────┘
```

---

## 🔍 Understanding the JSON Output

### For Non-Technical Users:

**JSON** is just a way to display data. Think of it like a structured list.

**Example:**
```json
{
  "message": "Hello",
  "count": 5,
  "isActive": true
}
```

**Means:**
- message = "Hello"
- count = 5
- isActive = true

**In the output, you'll see:**
- Names (like "message", "response")
- Values (like "Hello", numbers, true/false)
- Nested data (data inside data, shown with { } or [ ])

**Tip:** Just look for the field names you care about!

---

## 💡 Tips for Designers

### Tip 1: Start with Workflow Result

Always look at the **Workflow Result** first:
- ✅ Correct output? → Workflow works!
- ❌ Wrong output? → Dig into individual nodes

### Tip 2: Click Nodes to Debug

If something is wrong:
1. Click the first node
2. Check its output
3. Click the next node
4. Check its output
5. Find where the problem starts!

### Tip 3: Copy-Paste JSON

To share or document:
1. Highlight the JSON in the box
2. Copy it (Cmd+C / Ctrl+C)
3. Paste into your notes or Slack

### Tip 4: Compare Input vs Output

For each node, compare:
- What went IN (📥 Input)
- What came OUT (📤 Output)
- Does the transformation make sense?

### Tip 5: Use for Testing

Test your workflow with different inputs:
1. Run with input A → Check output
2. Run with input B → Check output
3. Run with edge case C → Check output

---

## 📊 Real Example

### E-Commerce Order Workflow

**Workflow:** Trigger → Agent (Process Order) → Email Node

**Test Input:**
```json
{
  "orderId": "ORD-123",
  "customer": "john@example.com",
  "items": [
    { "product": "Widget", "quantity": 2 }
  ],
  "total": 99.99
}
```

**Workflow Output:**
```json
{
  "orderProcessed": true,
  "confirmationEmail": "sent",
  "estimatedDelivery": "3-5 days"
}
```

**Individual Nodes:**

**Trigger:**
- Input: `{}`
- Output: The order data above

**Agent:**
- Input: Order data
- Output: Processed order + delivery estimate

**Email:**
- Input: Customer email + order details
- Output: `{ "emailSent": true }`

✅ **Now you can verify every step worked correctly!**

---

## ✅ Benefits for Designers

### Before (No I/O Display):
- ❌ Can't see what data flows where
- ❌ Hard to debug workflows
- ❌ Need developer to explain what happened
- ❌ Can't verify output is correct

### After (With I/O Display):
- ✅ See all inputs and outputs
- ✅ Easy to debug step-by-step
- ✅ Self-service debugging
- ✅ Verify results independently
- ✅ Share results with team
- ✅ Test with confidence

---

## 🆘 FAQ

**Q: Where is the Workflow Result section?**
A: At the very top of the debug panel, right after workflow completes. It has a green background.

**Q: How do I see a specific node's I/O?**
A: Click on the node in the "Node Execution Status" section. A blue panel will appear below.

**Q: Can I see multiple nodes at once?**
A: Click different nodes one at a time. The I/O panel updates to show the selected node.

**Q: What if I don't see any I/O?**
A: Make sure the workflow completed successfully and nodes have green checkmarks.

**Q: Can I copy the JSON output?**
A: Yes! Click in the JSON box, select all (Cmd+A / Ctrl+A), and copy (Cmd+C / Ctrl+C).

**Q: Is this the same as the Variables button?**
A: No! Variables button (👁) shows context/internal variables. The I/O display shows actual inputs and outputs.

---

## 🎉 Summary

**You now have:**
1. ✅ **Workflow Result** - Overall input/output at top
2. ✅ **Node I/O** - Click any node to see its data
3. ✅ **Side-by-side view** - Input next to output
4. ✅ **Clear labeling** - 📥 Input, 📤 Output
5. ✅ **Easy debugging** - See exactly what each node does

**No coding required!** Just click and view. Perfect for workflow designers! 🚀

---

**Try it now:**
1. Hard refresh browser (Cmd+Shift+R)
2. Run your workflow
3. Check the green "Workflow Result" section
4. Click on nodes to see their I/O
5. Debug like a pro! 💪
