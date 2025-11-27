'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Users, 
  CreditCard, 
  Activity,
  DollarSign,
  Calendar,
  Mail,
  Globe,
  Ban,
  CheckCircle
} from 'lucide-react';

interface CustomerDetails {
  id: string;
  name: string;
  subdomain: string;
  plan: string;
  planStatus: string;
  createdAt: string;
  users: any[];
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
    amount: number;
  };
  usage: {
    agents: number;
    workflows: number;
    apiCalls: number;
  };
  activityLog: any[];
}

export default function CustomerDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      loadCustomer();
    }
  }, [params.id]);

  const loadCustomer = async () => {
    try {
      setLoading(true);
      const response: any = await api.get(`/admin/customers/${params.id}`);
      setCustomer(response.data);
    } catch (error) {
      console.error('Failed to load customer:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-gray-500">Customer not found</p>
          <Button onClick={() => router.back()} className="mt-4">
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{customer.name}</h1>
            <p className="text-gray-600">{customer.subdomain}.objecta-labs.com</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Contact
          </Button>
          {customer.planStatus === 'suspended' ? (
            <Button variant="outline">
              <CheckCircle className="h-4 w-4 mr-2" />
              Reactivate
            </Button>
          ) : (
            <Button variant="destructive">
              <Ban className="h-4 w-4 mr-2" />
              Suspend
            </Button>
          )}
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customer.users?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{customer.plan}</div>
            <Badge className={customer.planStatus === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
              {customer.planStatus}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${customer.subscription?.amount || 0}/mo
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Customer Since
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {new Date(customer.createdAt).toLocaleDateString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Info */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Organization Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm font-medium text-gray-500">Organization Name</div>
                  <div className="text-base">{customer.name}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Subdomain</div>
                  <div className="text-base">{customer.subdomain}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Current Plan</div>
                  <div className="text-base capitalize">{customer.plan}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Status</div>
                  <div className="text-base capitalize">{customer.planStatus}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Created</div>
                  <div className="text-base">{new Date(customer.createdAt).toLocaleDateString()}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-500">Total Users</div>
                  <div className="text-base">{customer.users?.length || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Team Members ({customer.users?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.users && customer.users.length > 0 ? (
                <div className="space-y-2">
                  {customer.users.map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">{user.fullName || 'No name'}</div>
                        <div className="text-sm text-gray-600">{user.email}</div>
                      </div>
                      <Badge>{user.role || 'member'}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No users found</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="usage">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <div className="font-medium">AI Agents</div>
                    <div className="text-sm text-gray-600">Active agents created</div>
                  </div>
                  <div className="text-2xl font-bold">{customer.usage?.agents || 0}</div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <div className="font-medium">Workflows</div>
                    <div className="text-sm text-gray-600">Total workflows</div>
                  </div>
                  <div className="text-2xl font-bold">{customer.usage?.workflows || 0}</div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded">
                  <div>
                    <div className="font-medium">API Calls</div>
                    <div className="text-sm text-gray-600">This month</div>
                  </div>
                  <div className="text-2xl font-bold">{customer.usage?.apiCalls || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.subscription ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-gray-500">Current Plan</div>
                      <div className="text-base capitalize">{customer.subscription.plan}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Status</div>
                      <div className="text-base capitalize">{customer.subscription.status}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Monthly Amount</div>
                      <div className="text-base">${customer.subscription.amount}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-500">Renewal Date</div>
                      <div className="text-base">
                        {new Date(customer.subscription.currentPeriodEnd).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No billing information</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              {customer.activityLog && customer.activityLog.length > 0 ? (
                <div className="space-y-2">
                  {customer.activityLog.map((log: any) => (
                    <div key={log.id} className="flex items-center gap-3 p-3 border rounded">
                      <Activity className="h-4 w-4 text-gray-400" />
                      <div className="flex-1">
                        <div className="text-sm">{log.action}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">No activity logs</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
