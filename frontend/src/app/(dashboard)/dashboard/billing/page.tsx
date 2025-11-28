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
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingData();
  }, [period]);

  const fetchBillingData = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(
        `${apiUrl}/api/v1/analytics/billing?period=${period}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch billing data');
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      console.error('Error fetching billing data:', err);
      setError('Failed to load billing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg text-gray-600">Loading billing data...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-red-600 text-lg mb-4">{error}</div>
          <Button onClick={fetchBillingData}>Retry</Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-gray-600">No billing data available</div>
          <p className="text-sm text-gray-500 mt-2">
            Start using AI agents to see your usage and costs here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Billing & Usage</h1>
          <p className="text-gray-600 mt-1">
            Track your token usage and costs across all AI conversations
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex gap-2 flex-wrap">
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
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="text-sm font-medium text-blue-900">Total Cost</div>
          <div className="text-3xl font-bold mt-2 text-blue-900">
            ${data.summary.totalCost.toFixed(2)}
          </div>
          <div className="text-xs text-blue-700 mt-1">
            {data.summary.totalMessages} messages
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="text-sm font-medium text-green-900">Total Tokens</div>
          <div className="text-3xl font-bold mt-2 text-green-900">
            {data.summary.totalTokens.toLocaleString()}
          </div>
          <div className="text-xs text-green-700 mt-1">
            Avg {data.summary.avgTokensPerMessage.toLocaleString()} per message
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <div className="text-sm font-medium text-purple-900">Avg Cost/Message</div>
          <div className="text-3xl font-bold mt-2 text-purple-900">
            ${data.summary.avgCostPerMessage.toFixed(4)}
          </div>
          <div className="text-xs text-purple-700 mt-1">
            Per message average
          </div>
        </Card>

        <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="text-sm font-medium text-orange-900">Conversations</div>
          <div className="text-3xl font-bold mt-2 text-orange-900">
            {data.summary.totalConversations}
          </div>
          <div className="text-xs text-orange-700 mt-1">
            Total conversations
          </div>
        </Card>
      </div>

      {/* Usage by Day Chart */}
      {data.usageByDay.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Daily Usage</h2>
          <div className="space-y-2">
            {data.usageByDay.map((day) => (
              <div
                key={day.date}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div>
                  <div className="font-medium text-gray-900">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <div className="text-sm text-gray-600">
                    {day.messageCount} messages • {day.promptTokens.toLocaleString()} prompt + {day.completionTokens.toLocaleString()} completion
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${day.cost.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">
                    {day.totalTokens.toLocaleString()} tokens
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Usage by Agent */}
      {data.usageByAgent.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Usage by Agent</h2>
          <div className="space-y-2">
            {data.usageByAgent.map((agent) => (
              <div
                key={agent.agentId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{agent.agentName}</div>
                  <div className="text-sm text-gray-600">
                    {agent.messageCount} messages • {agent.conversationCount} conversations
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${agent.cost.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">
                    {agent.totalTokens.toLocaleString()} tokens
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Usage by Model */}
      {data.usageByModel.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Usage by Model</h2>
          <div className="space-y-2">
            {data.usageByModel.map((model) => (
              <div
                key={model.model}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{model.model}</div>
                  <div className="text-sm text-gray-600">
                    {model.messageCount} messages • Avg {model.avgTokensPerMessage.toLocaleString()} tokens
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${model.cost.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">
                    {model.totalTokens.toLocaleString()} tokens
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Top Conversations */}
      {data.topConversations.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900">Top Conversations by Cost</h2>
          <div className="space-y-2">
            {data.topConversations.map((conv, index) => (
              <div
                key={conv.conversationId}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{conv.title}</div>
                    <div className="text-sm text-gray-600">
                      {conv.messageCount} messages
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">${conv.cost.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">
                    {conv.totalTokens.toLocaleString()} tokens
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {data.usageByDay.length === 0 && (
        <Card className="p-12 text-center">
          <div className="text-gray-400 text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No usage data for this period
          </h3>
          <p className="text-gray-600">
            Start conversations with AI agents to see your usage and costs here
          </p>
        </Card>
      )}
    </div>
  );
}
