'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, MessageSquare, Users, Bot, Zap, ArrowUp, ArrowDown } from 'lucide-react';

interface OverviewMetrics {
  current: {
    totalMessages: number;
    totalConversations: number;
    activeAgents: number;
    uniqueUsers: number;
    avgResponseTime: number;
  };
  changes: {
    messagesChange: number;
    conversationsChange: number;
  };
  timeSeries: Array<{
    date: string;
    messages: number;
    conversations: number;
  }>;
}

interface TopAgent {
  agentId: string;
  agentName: string;
  conversationCount: number;
  messageCount: number;
  avgResponseTime: number;
  satisfactionScore: number;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('30');
  const [overview, setOverview] = useState<OverviewMetrics | null>(null);
  const [topAgents, setTopAgents] = useState<TopAgent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [dateRange]);

  const loadData = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(dateRange));

      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const [overviewResponse, agentsResponse] = await Promise.all([
        api.get(`/analytics/overview?${params}`),
        api.get(`/analytics/top-agents?${params}&limit=10`),
      ]);

      setOverview(overviewResponse.data);
      setTopAgents(agentsResponse.data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    suffix = '' 
  }: { 
    title: string; 
    value: number; 
    change?: number; 
    icon: any; 
    suffix?: string;
  }) => {
    const isPositive = change && change > 0;
    const ChangeIcon = isPositive ? ArrowUp : ArrowDown;

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {value.toLocaleString()}{suffix}
          </div>
          {change !== undefined && (
            <p className={`text-xs flex items-center gap-1 mt-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
              <ChangeIcon className="h-3 w-3" />
              {Math.abs(change)}% from last period
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-2">Track your platform performance and insights</p>
        </div>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Metrics Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Total Messages"
            value={overview.current.totalMessages}
            change={overview.changes.messagesChange}
            icon={MessageSquare}
          />
          <MetricCard
            title="Conversations"
            value={overview.current.totalConversations}
            change={overview.changes.conversationsChange}
            icon={Users}
          />
          <MetricCard
            title="Active Agents"
            value={overview.current.activeAgents}
            icon={Bot}
          />
          <MetricCard
            title="Avg Response Time"
            value={Math.round(overview.current.avgResponseTime)}
            icon={Zap}
            suffix="ms"
          />
        </div>
      )}

      {/* Charts */}
      <Tabs defaultValue="messages" className="space-y-4">
        <TabsList>
          <TabsTrigger value="messages">Messages</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
        </TabsList>

        <TabsContent value="messages" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Message Trends</CardTitle>
              <CardDescription>Daily message volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.timeSeries && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={overview.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="messages" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Messages"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Conversation Trends</CardTitle>
              <CardDescription>Daily conversation volume over time</CardDescription>
            </CardHeader>
            <CardContent>
              {overview?.timeSeries && (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={overview.timeSeries}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="conversations" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Conversations"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Agents */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Agents</CardTitle>
          <CardDescription>Your best agents by conversation volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topAgents.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No agent data available</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-4">Agent</th>
                      <th className="text-right py-2 px-4">Conversations</th>
                      <th className="text-right py-2 px-4">Messages</th>
                      <th className="text-right py-2 px-4">Avg Response</th>
                      <th className="text-right py-2 px-4">Satisfaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAgents.map((agent, index) => (
                      <tr key={agent.agentId} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-semibold text-blue-600">
                              {index + 1}
                            </div>
                            <span className="font-medium">{agent.agentName}</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-4">{agent.conversationCount.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{agent.messageCount.toLocaleString()}</td>
                        <td className="text-right py-3 px-4">{Math.round(agent.avgResponseTime)}ms</td>
                        <td className="text-right py-3 px-4">
                          {agent.satisfactionScore ? (
                            <span className="inline-flex items-center gap-1">
                              {agent.satisfactionScore.toFixed(1)} ⭐
                            </span>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle>Export Data</CardTitle>
          <CardDescription>Download your analytics data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              Export CSV
            </button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              Export PDF Report
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
