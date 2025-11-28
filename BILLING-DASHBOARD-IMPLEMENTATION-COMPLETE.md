# Billing Dashboard Implementation - Complete Guide

## 🎉 Backend Complete! Frontend Ready to Build

---

## ✅ Backend Implementation (100% Complete)

### 1. API Endpoint
**URL:** `GET /api/v1/analytics/billing`

**Query Parameters:**
- `period`: `today`, `week`, `month`, `year`, `custom`
- `startDate`: ISO date string (for custom period)
- `endDate`: ISO date string (for custom period)

**Response:**
```json
{
  "summary": {
    "totalTokens": 125000,
    "totalCost": 3.75,
    "totalMessages": 50,
    "totalConversations": 10,
    "avgTokensPerMessage": 2500,
    "avgCostPerMessage": 0.075
  },
  "usageByDay": [
    {
      "date": "2024-01-01",
      "totalTokens": 12000,
      "promptTokens": 3000,
      "completionTokens": 9000,
      "cost": 0.36,
      "messageCount": 5
    }
  ],
  "usageByAgent": [
    {
      "agentId": "uuid",
      "agentName": "Customer Support Bot",
      "totalTokens": 50000,
      "cost": 1.50,
      "messageCount": 20,
      "conversationCount": 5
    }
  ],
  "usageByModel": [
    {
      "model": "gpt-4",
      "totalTokens": 80000,
      "cost": 2.40,
      "messageCount": 32,
      "avgTokensPerMessage": 2500
    }
  ],
  "topConversations": [
    {
      "conversationId": "uuid",
      "title": "Product Support Discussion",
      "totalTokens": 15000,
      "cost": 0.45,
      "messageCount": 6
    }
  ]
}
```

---

## 📱 Frontend Implementation

### Step 1: Create Billing Page

**File:** `frontend/src/app/(dashboard)/dashboard/billing/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface BillingData {
  summary: {
    totalTokens: number;
    totalCost: number;
    totalMessages: number;
    totalConversations: number;
    avgTokensPerMessage: number;
    avgCostPerMessage: number;
  };
  usageByDay: Array<{
    date: string;
    totalTokens: number;
    promptTokens: number;
    completionTokens: number;
    cost: number;
    messageCount: number;
  }>;
  usageByAgent: Array<{
    agentId: string;
    agentName: string;
    totalTokens: number;
    cost: number;
    messageCount: number;
    conversationCount: number;
  }>;
  usageByModel: Array<{
    model: string;
    totalTokens: number;
    cost: number;
    messageCount: number;
    avgTokensPerMessage: number;
  }>;
  topConversations: Array<{
    conversationId: string;
    title: string;
    totalTokens: number;
    cost: number;
    messageCount: number;
  }>;
}

type Period = 'today' | 'week' | 'month' | 'year';

export default function BillingPage() {
  const [period, setPeriod] = useState<Period>('month');
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, [period]);

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/v1/analytics/billing?period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading billing data...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">No billing data available</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Billing & Usage</h1>
          <p className="text-gray-600 mt-1">
            Track your token usage and costs
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2">
          {(['today', 'week', 'month', 'year'] as Period[]).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'default' : 'outline'}
              onClick={() => setPeriod(p)}
              className="capitalize"
            >
              {p}
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Cost</div>
          <div className="text-3xl font-bold mt-2">
            ${data.summary.totalCost.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.summary.totalMessages} messages
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600">Total Tokens</div>
          <div className="text-3xl font-bold mt-2">
            {data.summary.totalTokens.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Avg {data.summary.avgTokensPerMessage} per message
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600">Avg Cost/Message</div>
          <div className="text-3xl font-bold mt-2">
            ${data.summary.avgCostPerMessage.toFixed(4)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Per message average
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-sm text-gray-600">Conversations</div>
          <div className="text-3xl font-bold mt-2">
            {data.summary.totalConversations}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Total conversations
          </div>
        </Card>
      </div>

      {/* Usage by Day Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Daily Usage</h2>
        <div className="space-y-2">
          {data.usageByDay.map((day) => (
            <div
              key={day.date}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium">
                  {new Date(day.date).toLocaleDateString()}
                </div>
                <div className="text-sm text-gray-600">
                  {day.messageCount} messages
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${day.cost.toFixed(2)}</div>
                <div className="text-sm text-gray-600">
                  {day.totalTokens.toLocaleString()} tokens
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Usage by Agent */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Usage by Agent</h2>
        <div className="space-y-2">
          {data.usageByAgent.map((agent) => (
            <div
              key={agent.agentId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium">{agent.agentName}</div>
                <div className="text-sm text-gray-600">
                  {agent.messageCount} messages • {agent.conversationCount}{' '}
                  conversations
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${agent.cost.toFixed(2)}</div>
                <div className="text-sm text-gray-600">
                  {agent.totalTokens.toLocaleString()} tokens
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Usage by Model */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Usage by Model</h2>
        <div className="space-y-2">
          {data.usageByModel.map((model) => (
            <div
              key={model.model}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium">{model.model}</div>
                <div className="text-sm text-gray-600">
                  {model.messageCount} messages • Avg{' '}
                  {model.avgTokensPerMessage} tokens
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${model.cost.toFixed(2)}</div>
                <div className="text-sm text-gray-600">
                  {model.totalTokens.toLocaleString()} tokens
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Top Conversations */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Top Conversations</h2>
        <div className="space-y-2">
          {data.topConversations.map((conv) => (
            <div
              key={conv.conversationId}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
            >
              <div>
                <div className="font-medium">{conv.title}</div>
                <div className="text-sm text-gray-600">
                  {conv.messageCount} messages
                </div>
              </div>
              <div className="text-right">
                <div className="font-semibold">${conv.cost.toFixed(2)}</div>
                <div className="text-sm text-gray-600">
                  {conv.totalTokens.toLocaleString()} tokens
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
```

---

## 🚀 Deployment Steps

### 1. Run Migrations (if not done)

```bash
cd backend
psql $DATABASE_URL -f src/migrations/017-create-conversation-metrics-table.sql
psql $DATABASE_URL -f src/migrations/018-add-agent-token-budgets.sql
```

### 2. Start Backend

```bash
cd backend
npm run start:dev
```

### 3. Start Frontend

```bash
cd frontend
npm run dev
```

### 4. Access Billing Page

Navigate to: `http://localhost:3000/dashboard/billing`

---

## 🧪 Testing

### Test API Endpoint

```bash
TOKEN="your-jwt-token"

# Get this month's billing data
curl http://localhost:4000/api/v1/analytics/billing?period=month \
  -H "Authorization: Bearer $TOKEN"

# Get this week's billing data
curl http://localhost:4000/api/v1/analytics/billing?period=week \
  -H "Authorization: Bearer $TOKEN"

# Get today's billing data
curl http://localhost:4000/api/v1/analytics/billing?period=today \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Features

### Summary Statistics
- Total cost
- Total tokens used
- Average cost per message
- Total conversations

### Daily Usage
- Token usage per day
- Cost per day
- Message count per day
- Visual timeline

### Agent Analytics
- Usage breakdown by agent
- Cost per agent
- Message count per agent
- Conversation count per agent

### Model Analytics
- Usage breakdown by model (GPT-4, GPT-3.5, etc.)
- Cost per model
- Average tokens per model

### Top Conversations
- Most expensive conversations
- Token usage per conversation
- Quick identification of heavy usage

---

## 🎨 Enhancements (Optional)

### Add Charts

Install Chart.js:
```bash
cd frontend
npm install chart.js react-chartjs-2
```

Add line chart for daily usage:
```typescript
import { Line } from 'react-chartjs-2';

const chartData = {
  labels: data.usageByDay.map(d => d.date),
  datasets: [
    {
      label: 'Tokens',
      data: data.usageByDay.map(d => d.totalTokens),
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1
    },
    {
      label: 'Cost ($)',
      data: data.usageByDay.map(d => d.cost),
      borderColor: 'rgb(255, 99, 132)',
      tension: 0.1
    }
  ]
};

<Line data={chartData} />
```

### Add Export Feature

```typescript
const exportToCSV = () => {
  const csv = data.usageByDay
    .map(d => `${d.date},${d.totalTokens},${d.cost}`)
    .join('\n');
  
  const blob = new Blob([`Date,Tokens,Cost\n${csv}`], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `billing-${period}.csv`;
  a.click();
};
```

### Add Date Range Picker

```typescript
import DatePicker from 'react-datepicker';

const [customRange, setCustomRange] = useState({
  start: new Date(),
  end: new Date()
});

<DatePicker
  selectsRange
  startDate={customRange.start}
  endDate={customRange.end}
  onChange={(dates) => {
    const [start, end] = dates;
    setCustomRange({ start, end });
  }}
/>
```

---

## ✅ Checklist

- [x] Backend API endpoint created
- [x] Billing analytics service implemented
- [x] Database entities configured
- [x] Module dependencies added
- [x] API endpoint tested
- [ ] Frontend page created
- [ ] Test with real data
- [ ] Add to navigation menu

---

## 🎯 Summary

**Backend:** ✅ 100% Complete
- API endpoint: `GET /api/v1/analytics/billing`
- Full analytics calculation
- Multiple period filters
- Comprehensive data breakdown

**Frontend:** 📝 Ready to implement
- Complete React component provided
- Responsive design
- Period selector
- Summary cards
- Detailed breakdowns

**Next Step:** Create the frontend file and test!

---

**Need help?** The frontend code is ready to copy-paste into `frontend/src/app/(dashboard)/dashboard/billing/page.tsx`!
