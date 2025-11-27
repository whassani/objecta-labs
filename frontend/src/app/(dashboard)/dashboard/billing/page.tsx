'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreditCard, Check, Zap, Crown } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: string;
  features: {
    agents: number;
    messagesPerMonth: number;
    users: number;
    storage: number;
    knowledgeBase: boolean;
    workflows: boolean;
    fineTuning?: boolean;
    support: string;
  };
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export default function BillingPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Record<string, Plan>>({});
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansResponse, subResponse] = await Promise.all([
        api.get('/billing/plans'),
        api.get('/billing/subscription'),
      ]);
      setPlans(plansResponse.data);
      setSubscription(subResponse.data);
    } catch (error) {
      console.error('Failed to load billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    setSelectedPlan(planId);
    // In a real implementation, you would integrate Stripe Elements here
    alert(`Upgrade to ${planId} - Stripe integration coming soon!`);
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) return;

    try {
      await api.delete('/billing/subscription');
      await loadData();
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'free';
  const plansList = Object.values(plans);

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Billing & Subscription</h1>
        <p className="text-gray-600 mt-2">Manage your subscription and billing information</p>
      </div>

      {/* Current Subscription */}
      {subscription && subscription.plan !== 'free' && (
        <Card>
          <CardHeader>
            <CardTitle>Current Subscription</CardTitle>
            <CardDescription>Your active plan and billing details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-semibold capitalize">{subscription.plan} Plan</p>
                <p className="text-sm text-gray-600">
                  Status: <Badge variant={subscription.status === 'active' ? 'default' : 'secondary'}>
                    {subscription.status}
                  </Badge>
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">
                  ${plans[subscription.plan]?.price || 0}/month
                </p>
                <p className="text-sm text-gray-600">
                  Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <p className="text-sm text-yellow-800">
                  Your subscription will be canceled at the end of the current billing period.
                </p>
              </div>
            )}

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => router.push('/dashboard/billing/invoices')}>
                View Invoices
              </Button>
              <Button variant="outline" onClick={() => router.push('/dashboard/billing/usage')}>
                View Usage
              </Button>
              {!subscription.cancelAtPeriodEnd && (
                <Button variant="destructive" onClick={handleCancelSubscription}>
                  Cancel Subscription
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div>
        <h2 className="text-2xl font-bold mb-6">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plansList.map((plan) => {
            const isCurrent = plan.id === currentPlan;
            const isUpgrade = plansList.findIndex(p => p.id === currentPlan) < plansList.findIndex(p => p.id === plan.id);

            return (
              <Card key={plan.id} className={isCurrent ? 'border-blue-600 border-2' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {plan.id === 'free' && <Zap className="h-5 w-5" />}
                      {plan.id === 'starter' && <CreditCard className="h-5 w-5" />}
                      {plan.id === 'professional' && <Check className="h-5 w-5" />}
                      {plan.id === 'enterprise' && <Crown className="h-5 w-5" />}
                      {plan.name}
                    </CardTitle>
                    {isCurrent && <Badge>Current</Badge>}
                  </div>
                  <CardDescription>
                    {plan.price === 0 ? (
                      <span className="text-2xl font-bold">Free</span>
                    ) : plan.price === null ? (
                      <span className="text-2xl font-bold">Custom</span>
                    ) : (
                      <span className="text-2xl font-bold">${plan.price}<span className="text-sm font-normal">/mo</span></span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {plan.features.agents === -1 ? 'Unlimited' : plan.features.agents} agents
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {plan.features.messagesPerMonth === -1 
                        ? 'Unlimited messages' 
                        : `${plan.features.messagesPerMonth.toLocaleString()} messages/mo`}
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {plan.features.users === -1 ? 'Unlimited' : plan.features.users} users
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {plan.features.storage === -1 
                        ? 'Unlimited storage' 
                        : `${plan.features.storage} MB storage`}
                    </li>
                    {plan.features.knowledgeBase && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Knowledge Base
                      </li>
                    )}
                    {plan.features.workflows && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Workflows
                      </li>
                    )}
                    {plan.features.fineTuning && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600" />
                        Fine-tuning
                      </li>
                    )}
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      {plan.features.support} support
                    </li>
                  </ul>

                  {!isCurrent && (
                    <Button 
                      className="w-full" 
                      onClick={() => handleUpgrade(plan.id)}
                      disabled={plan.id === 'free' || selectedPlan === plan.id}
                      variant={isUpgrade ? 'default' : 'outline'}
                    >
                      {plan.id === 'free' ? 'Current Plan' : isUpgrade ? 'Upgrade' : 'Downgrade'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Info */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Contact our sales team for custom enterprise plans or if you have questions about billing.
          </p>
          <Button variant="outline" className="mt-4">
            Contact Sales
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
