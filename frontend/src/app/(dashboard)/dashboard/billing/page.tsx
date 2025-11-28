'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  CreditCardIcon, 
  DocumentTextIcon, 
  CheckIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  BanknotesIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import clsx from 'clsx';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  current?: boolean;
}

interface Invoice {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  created: number;
  invoice_pdf?: string;
  hosted_invoice_url?: string;
  number?: string;
  period_start: number;
  period_end: number;
}

interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  exp_month: number;
  exp_year: number;
  is_default: boolean;
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  // Fetch current subscription
  const { data: subscription } = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const response = await api.get('/billing/subscription');
      return response.data;
    },
  });

  // Fetch invoices
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await api.get('/billing/invoices');
      return response.data;
    },
  });

  // Fetch payment methods
  const { data: paymentMethods = [] } = useQuery<PaymentMethod[]>({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const response = await api.get('/billing/payment-methods');
      return response.data;
    },
  });

  // Plans data
  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      description: 'Perfect for trying out',
      price: 0,
      interval: 'month',
      features: [
        '5 agents',
        '100 conversations/month',
        '1 workspace',
        'Basic support',
      ],
      current: subscription?.plan === 'free',
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'For professionals',
      price: billingInterval === 'month' ? 29 : 290,
      interval: billingInterval,
      features: [
        'Unlimited agents',
        'Unlimited conversations',
        'Unlimited workspaces',
        'Priority support',
        'Advanced analytics',
        'Custom models',
      ],
      current: subscription?.plan === 'pro',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large teams',
      price: billingInterval === 'month' ? 99 : 990,
      interval: billingInterval,
      features: [
        'Everything in Pro',
        'SSO & SAML',
        'Dedicated support',
        'Custom contracts',
        'SLA guarantee',
        'On-premise deployment',
      ],
      current: subscription?.plan === 'enterprise',
    },
  ];

  // Subscribe mutation
  const subscribeMutation = useMutation({
    mutationFn: async (planId: string) => {
      const response = await api.post('/billing/subscribe', { planId, interval: billingInterval });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
      alert('Subscription updated successfully!');
    },
    onError: (error: any) => {
      alert(`Error: ${error.response?.data?.message || error.message}`);
    },
  });

  // Format currency
  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your subscription, payment methods, and invoices
        </p>
      </div>

      {/* Current Plan */}
      <div className="mb-8 bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl border border-primary-200 dark:border-primary-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-600 rounded-lg">
              <SparklesIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {subscription?.plan === 'pro' ? 'Pro Plan' : subscription?.plan === 'enterprise' ? 'Enterprise Plan' : 'Free Plan'}
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {subscription?.plan === 'free' 
                  ? 'Upgrade to unlock more features' 
                  : `Next billing date: ${subscription?.next_billing_date ? formatDate(subscription.next_billing_date) : 'N/A'}`
                }
              </p>
            </div>
          </div>
          {subscription?.plan !== 'enterprise' && (
            <button className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition">
              {subscription?.plan === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
            </button>
          )}
        </div>
      </div>

      {/* Plans */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Choose a Plan</h2>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setBillingInterval('month')}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-md transition',
                billingInterval === 'month'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('year')}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-md transition relative',
                billingInterval === 'year'
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              )}
            >
              Yearly
              <span className="ml-1.5 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={clsx(
                'relative rounded-xl border p-6 transition',
                plan.current
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300 dark:hover:border-primary-700'
              )}
            >
              {plan.current && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-600 text-white">
                    Current Plan
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{plan.description}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                  <span className="text-gray-600 dark:text-gray-400">/{plan.interval === 'month' ? 'mo' : 'yr'}</span>
                </div>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckIcon className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => subscribeMutation.mutate(plan.id)}
                disabled={plan.current || subscribeMutation.isPending}
                className={clsx(
                  'w-full px-4 py-2.5 text-sm font-medium rounded-lg transition',
                  plan.current
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-primary-600 hover:bg-primary-700 text-white'
                )}
              >
                {plan.current ? 'Current Plan' : subscribeMutation.isPending ? 'Processing...' : plan.id === 'free' ? 'Downgrade' : 'Upgrade'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Method */}
      <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Payment Method</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your payment methods</p>
          </div>
          <button className="px-4 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
            Add Payment Method
          </button>
        </div>
        <div className="px-6 py-5">
          {paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div key={method.id} className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CreditCardIcon className="w-6 h-6 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {method.brand} •••• {method.last4}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Expires {method.exp_month}/{method.exp_year}
                      </p>
                    </div>
                  </div>
                  {method.is_default && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                      Default
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No payment methods added</p>
          )}
        </div>
      </div>

      {/* Invoices */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-semibold text-gray-900 dark:text-white">Invoices</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Download and view your invoices</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Invoice
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.number || invoice.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(invoice.created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={clsx(
                          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                          invoice.status === 'paid'
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : invoice.status === 'open'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        )}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                          Download
                        </a>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                    No invoices yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
