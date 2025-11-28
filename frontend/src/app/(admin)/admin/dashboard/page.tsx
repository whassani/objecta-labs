'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, Users, CheckCircle, AlertCircle, Activity, TrendingUp, ArrowUpRight, ArrowDownRight, Ticket, FileText, Settings as SettingsIcon } from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { ChartCard } from '@/components/admin/ChartCard';
import { ActivityFeed } from '@/components/admin/ActivityFeed';
import { QuickActions } from '@/components/admin/QuickActions';

interface DashboardMetrics {
  totalCustomers: number;
  activeCustomers: number;
  totalUsers: number;
  activeSubscriptions: number;
  mrr: number;
  systemHealth: {
    api: string;
    database: string;
    redis: string;
  };
}

export default function AdminDashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const { data } = await api.get('/v1/admin/dashboard');
      setMetrics(data);
    } catch (error) {
      console.error('Failed to load metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mock trend data - in production this would come from the backend
  const getTrend = (current: number, previous: number) => {
    const change = ((current - previous) / previous) * 100;
    return {
      value: Math.round(Math.abs(change)),
      isPositive: change > 0
    };
  };

  const HealthBadge = ({ status }: { status: string }) => (
    <span className={`px-2 py-1 rounded text-xs font-medium ${
      status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
    }`}>
      {status}
    </span>
  );

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
      <div className="border-b pb-4">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Platform overview and system health</p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatsCard
              title="Total Customers"
              value={metrics.totalCustomers}
              icon={Users}
              description={`${metrics.activeCustomers} active`}
              trend={getTrend(metrics.totalCustomers, Math.floor(metrics.totalCustomers * 0.9))}
              color="blue"
            />
            <StatsCard
              title="Monthly Recurring Revenue"
              value={`$${metrics.mrr.toLocaleString()}`}
              icon={DollarSign}
              description="Active subscriptions"
              trend={getTrend(metrics.mrr, Math.floor(metrics.mrr * 0.85))}
              color="green"
            />
            <StatsCard
              title="Total Users"
              value={metrics.totalUsers}
              icon={Users}
              description="Across all organizations"
              trend={getTrend(metrics.totalUsers, Math.floor(metrics.totalUsers * 0.92))}
              color="purple"
            />
            <StatsCard
              title="Active Subscriptions"
              value={metrics.activeSubscriptions}
              icon={CheckCircle}
              description="Paying customers"
              trend={getTrend(metrics.activeSubscriptions, Math.floor(metrics.activeSubscriptions * 0.88))}
              color="green"
            />
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Health
              </CardTitle>
              <CardDescription>Current status of all services</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium">API Server</span>
                  <HealthBadge status={metrics.systemHealth.api} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Database</span>
                  <HealthBadge status={metrics.systemHealth.database} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Redis Cache</span>
                  <HealthBadge status={metrics.systemHealth.redis} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ChartCard
              title="Customer Growth"
              description="Last 7 days"
              data={[
                { label: 'Mon', value: Math.floor(metrics.totalCustomers * 0.85) },
                { label: 'Tue', value: Math.floor(metrics.totalCustomers * 0.88) },
                { label: 'Wed', value: Math.floor(metrics.totalCustomers * 0.90) },
                { label: 'Thu', value: Math.floor(metrics.totalCustomers * 0.93) },
                { label: 'Fri', value: Math.floor(metrics.totalCustomers * 0.96) },
                { label: 'Sat', value: Math.floor(metrics.totalCustomers * 0.98) },
                { label: 'Sun', value: metrics.totalCustomers },
              ]}
            />
            <Card>
              <CardHeader>
                <CardTitle>Growth Metrics</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="font-bold text-blue-600">
                    {metrics.activeSubscriptions > 0 
                      ? Math.round((metrics.activeSubscriptions / metrics.totalCustomers) * 100)
                      : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                  <span className="text-sm font-medium">Avg Users per Org</span>
                  <span className="font-bold text-purple-600">
                    {metrics.totalCustomers > 0
                      ? Math.round(metrics.totalUsers / metrics.totalCustomers)
                      : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium">Avg Revenue per Customer</span>
                  <span className="font-bold text-green-600">
                    ${metrics.activeSubscriptions > 0
                      ? Math.round(metrics.mrr / metrics.activeSubscriptions)
                      : 0}
                  </span>
                </div>
              </CardContent>
            </Card>

            <QuickActions
              actions={[
                {
                  title: 'View All Customers',
                  description: 'Manage customer accounts',
                  href: '/admin/customers',
                  icon: Users,
                  color: 'blue'
                },
                {
                  title: 'Support Tickets',
                  description: 'Handle customer support',
                  href: '/admin/tickets',
                  icon: Ticket,
                  color: 'green'
                },
                {
                  title: 'Audit Logs',
                  description: 'View admin activity',
                  href: '/admin/audit',
                  icon: FileText,
                  color: 'purple'
                },
                {
                  title: 'System Settings',
                  description: 'Configure platform',
                  href: '/admin/settings',
                  icon: SettingsIcon,
                  color: 'orange'
                }
              ]}
            />
          </div>

          {/* Activity Feed */}
          <ActivityFeed
            activities={[
              {
                id: '1',
                type: 'user',
                message: 'New customer registration: Acme Corp',
                timestamp: new Date(Date.now() - 5 * 60000),
                status: 'success'
              },
              {
                id: '2',
                type: 'subscription',
                message: 'Subscription upgraded to Professional plan',
                timestamp: new Date(Date.now() - 15 * 60000),
                status: 'success'
              },
              {
                id: '3',
                type: 'ticket',
                message: 'New support ticket #1234 created',
                timestamp: new Date(Date.now() - 30 * 60000),
                status: 'warning'
              },
              {
                id: '4',
                type: 'system',
                message: 'Database backup completed successfully',
                timestamp: new Date(Date.now() - 60 * 60000),
                status: 'success'
              },
              {
                id: '5',
                type: 'user',
                message: 'Password reset requested for admin@example.com',
                timestamp: new Date(Date.now() - 90 * 60000)
              }
            ]}
            limit={5}
          />

          {/* Revenue Projection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Projection
              </CardTitle>
              <CardDescription>Based on current MRR</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold">${(metrics.mrr * 3).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Quarterly</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">${(metrics.mrr * 12).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Annual</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">${(metrics.mrr * 12 * 5).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">5-Year</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
