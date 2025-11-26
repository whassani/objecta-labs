'use client';

import { useState, useEffect } from 'react';
import { Link2, Copy, Eye, EyeOff, RefreshCw, Power, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';

interface WebhookPanelProps {
  workflowId: string;
}

interface WebhookData {
  id: string;
  webhookUrl: string;
  secretToken: string;
  isActive: boolean;
  createdAt: string;
  stats?: {
    totalCalls: number;
    lastUsed: string;
    successRate: number;
  };
  recentActivity?: Array<{
    timestamp: string;
    status: number;
    duration: number;
  }>;
}

export default function WebhookPanel({ workflowId }: WebhookPanelProps) {
  const [webhook, setWebhook] = useState<WebhookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedToken, setCopiedToken] = useState(false);
  const [copiedCurl, setCopiedCurl] = useState(false);

  useEffect(() => {
    loadWebhook();
  }, [workflowId]);

  const loadWebhook = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/webhooks/workflow/${workflowId}`);
      setWebhook(response.data);
    } catch (err: any) {
      if (err.response?.status === 404) {
        // No webhook exists yet
        setWebhook(null);
      } else {
        setError(err.response?.data?.message || 'Failed to load webhook');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateWebhook = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/webhooks/create/${workflowId}`);
      setWebhook(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate webhook');
    } finally {
      setLoading(false);
    }
  };

  const regenerateWebhook = async () => {
    if (!confirm('Regenerating will invalidate the old webhook URL. Continue?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      // Delete old webhook
      if (webhook?.id) {
        await api.delete(`/webhooks/manage/${webhook.id}`);
      }
      // Create new webhook
      const response = await api.post(`/webhooks/create/${workflowId}`);
      setWebhook(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to regenerate webhook');
    } finally {
      setLoading(false);
    }
  };

  const toggleWebhookStatus = async () => {
    if (!webhook) return;

    try {
      setLoading(true);
      setError(null);
      const response = await api.post(`/webhooks/manage/${webhook.id}/toggle`);
      setWebhook(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update webhook status');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string, type: 'url' | 'token' | 'curl') => {
    try {
      await navigator.clipboard.writeText(text);
      
      if (type === 'url') {
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
      } else if (type === 'token') {
        setCopiedToken(true);
        setTimeout(() => setCopiedToken(false), 2000);
      } else if (type === 'curl') {
        setCopiedCurl(true);
        setTimeout(() => setCopiedCurl(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const getFullWebhookUrl = () => {
    if (!webhook) return '';
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    return `${baseUrl}/api/webhooks/${webhook.webhookUrl}`;
  };

  const getCurlCommand = () => {
    const url = getFullWebhookUrl();
    return `curl -X POST ${url} \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: YOUR_SIGNATURE" \\
  -d '{"event": "test", "data": {}}'`;
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return 'text-green-600';
    if (status >= 400 && status < 500) return 'text-orange-600';
    if (status >= 500) return 'text-red-600';
    return 'text-gray-600';
  };

  const getStatusIcon = (status: number) => {
    if (status >= 200 && status < 300) return <CheckCircle size={16} className="text-green-600" />;
    if (status >= 400) return <XCircle size={16} className="text-red-600" />;
    return <Clock size={16} className="text-gray-600" />;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} min ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  if (loading && !webhook) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            <span className="font-medium">Error</span>
          </div>
          <p className="mt-2 text-sm text-red-700">{error}</p>
          <button
            onClick={loadWebhook}
            className="mt-3 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!webhook) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
            <Link2 size={32} className="text-indigo-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Webhook Configured
          </h3>
          <p className="text-sm text-gray-600 mb-6">
            Generate a webhook URL to trigger this workflow from external services.
          </p>
          <button
            onClick={generateWebhook}
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50"
          >
            {loading ? 'Generating...' : 'Generate Webhook URL'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">
          📡 Webhook Configuration
        </h3>
        <p className="text-sm text-gray-600">
          Trigger this workflow from external services
        </p>
      </div>

      {/* Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Status:</span>
            <span className={`flex items-center gap-1 text-sm font-semibold ${webhook.isActive ? 'text-green-600' : 'text-gray-500'}`}>
              <span className={`w-2 h-2 rounded-full ${webhook.isActive ? 'bg-green-600' : 'bg-gray-400'}`}></span>
              {webhook.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={regenerateWebhook}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Regenerate
          </button>
          <button
            onClick={toggleWebhookStatus}
            disabled={loading}
            className={`flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors text-sm font-medium disabled:opacity-50 ${
              webhook.isActive
                ? 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                : 'bg-green-600 border-green-600 text-white hover:bg-green-700'
            }`}
          >
            <Power size={16} />
            {webhook.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Webhook URL */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Webhook URL
        </label>
        <div className="bg-gray-50 rounded-lg p-3 mb-3 font-mono text-sm break-all">
          {getFullWebhookUrl()}
        </div>
        <button
          onClick={() => copyToClipboard(getFullWebhookUrl(), 'url')}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium w-full justify-center"
        >
          <Copy size={16} />
          {copiedUrl ? 'Copied!' : 'Copy URL'}
        </button>
      </div>

      {/* Secret Token */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Secret Token
        </label>
        <div className="bg-gray-50 rounded-lg p-3 mb-3 font-mono text-sm break-all flex items-center justify-between">
          <span>
            {showToken ? webhook.secretToken : '•'.repeat(40)}
          </span>
          <button
            onClick={() => setShowToken(!showToken)}
            className="ml-2 text-gray-500 hover:text-gray-700 transition-colors"
          >
            {showToken ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        <button
          onClick={() => copyToClipboard(webhook.secretToken, 'token')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium w-full justify-center"
        >
          <Copy size={16} />
          {copiedToken ? 'Copied!' : 'Copy Token'}
        </button>
      </div>

      {/* Testing */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">
          Testing Your Webhook
        </h4>
        <p className="text-xs text-blue-700 mb-3">
          Use this cURL command to test your webhook:
        </p>
        <div className="bg-white rounded-lg p-3 mb-3">
          <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap break-all">
            {getCurlCommand()}
          </pre>
        </div>
        <button
          onClick={() => copyToClipboard(getCurlCommand(), 'curl')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium w-full justify-center"
        >
          <Copy size={16} />
          {copiedCurl ? 'Copied!' : 'Copy Command'}
        </button>
      </div>

      {/* Statistics */}
      {webhook.stats && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Statistics
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Created:</span>
              <span className="font-medium text-gray-900">
                {formatDate(webhook.createdAt)}
              </span>
            </div>
            {webhook.stats.lastUsed && (
              <div className="flex justify-between">
                <span className="text-gray-600">Last Used:</span>
                <span className="font-medium text-gray-900">
                  {formatDate(webhook.stats.lastUsed)}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Total Calls:</span>
              <span className="font-medium text-gray-900">
                {webhook.stats.totalCalls.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Success Rate:</span>
              <span className="font-medium text-green-600">
                {webhook.stats.successRate.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      {webhook.recentActivity && webhook.recentActivity.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            Recent Activity
          </h4>
          <div className="space-y-2">
            {webhook.recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(activity.status)}
                  <span className="text-gray-600">
                    {formatDate(activity.timestamp)}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${getStatusColor(activity.status)}`}>
                    {activity.status}
                  </span>
                  <span className="text-gray-500 text-xs">
                    {activity.duration}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex gap-2">
          <AlertCircle size={16} className="text-yellow-700 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-800">
            <p className="font-medium mb-1">Security Note</p>
            <p className="text-xs text-yellow-700">
              Keep your secret token secure. Use it to verify webhook signatures
              and prevent unauthorized requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
