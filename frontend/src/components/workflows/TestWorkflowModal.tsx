'use client';

import { useState } from 'react';
import { X, Play, Webhook, Calendar, Zap, FileJson, Copy, Check } from 'lucide-react';

interface TestWorkflowModalProps {
  workflowId: string;
  workflowName: string;
  triggerType: 'manual' | 'webhook' | 'schedule' | 'event';
  onClose: () => void;
  onTest: (testData: any) => void;
}

export default function TestWorkflowModal({
  workflowId,
  workflowName,
  triggerType,
  onClose,
  onTest,
}: TestWorkflowModalProps) {
  const [testData, setTestData] = useState('{\n  "message": "Hello World",\n  "userId": "test-123"\n}');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [copied, setCopied] = useState(false);

  const sampleData = {
    manual: {
      simple: '{\n  "test": true\n}',
      user: '{\n  "userId": "user-123",\n  "email": "test@example.com",\n  "name": "John Doe"\n}',
      order: '{\n  "orderId": "ORD-001",\n  "amount": 99.99,\n  "items": [\n    {"product": "Widget", "quantity": 2}\n  ]\n}',
      conversation: '{\n  "conversationId": "conv-123",\n  "message": "Hello, I need help",\n  "userId": "user-456"\n}',
    },
  };

  const handleQuickFill = (type: keyof typeof sampleData.manual) => {
    setTestData(sampleData.manual[type]);
  };

  const handleTest = () => {
    try {
      const data = JSON.parse(testData);
      onTest(data);
    } catch (error) {
      alert('Invalid JSON format. Please check your test data.');
    }
  };

  const createWebhook = async () => {
    setIsCreatingWebhook(true);
    try {
      const response = await fetch(`/api/webhooks/create/${workflowId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      setWebhookUrl(`${window.location.origin}/api/webhooks/${data.webhookUrl}`);
    } catch (error) {
      alert('Failed to create webhook');
    } finally {
      setIsCreatingWebhook(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Test Workflow</h2>
                <p className="text-sm text-gray-600">{workflowName}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/50 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Trigger Type Info */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              {triggerType === 'manual' && <Zap size={20} className="text-blue-600 mt-0.5" />}
              {triggerType === 'webhook' && <Webhook size={20} className="text-blue-600 mt-0.5" />}
              {triggerType === 'schedule' && <Calendar size={20} className="text-blue-600 mt-0.5" />}
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">
                  {triggerType === 'manual' && 'Manual Trigger'}
                  {triggerType === 'webhook' && 'Webhook Trigger'}
                  {triggerType === 'schedule' && 'Scheduled Trigger'}
                  {triggerType === 'event' && 'Event Trigger'}
                </h3>
                <p className="text-sm text-blue-700">
                  {triggerType === 'manual' && 'Test your workflow with sample data directly from here.'}
                  {triggerType === 'webhook' && 'Get a webhook URL to trigger this workflow from external systems.'}
                  {triggerType === 'schedule' && 'This workflow runs automatically based on schedule.'}
                  {triggerType === 'event' && 'This workflow is triggered by system events.'}
                </p>
              </div>
            </div>
          </div>

          {/* Manual/Webhook Test */}
          {(triggerType === 'manual' || triggerType === 'webhook') && (
            <>
              {/* Quick Fill Buttons */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quick Fill Sample Data:
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleQuickFill('simple')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Simple Test
                  </button>
                  <button
                    onClick={() => handleQuickFill('user')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    User Data
                  </button>
                  <button
                    onClick={() => handleQuickFill('order')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Order Data
                  </button>
                  <button
                    onClick={() => handleQuickFill('conversation')}
                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Conversation
                  </button>
                </div>
              </div>

              {/* Test Data Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileJson size={16} className="inline mr-1" />
                  Test Data (JSON format):
                </label>
                <textarea
                  value={testData}
                  onChange={(e) => setTestData(e.target.value)}
                  className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  placeholder="Enter your test data in JSON format"
                />
                <p className="mt-2 text-xs text-gray-500">
                  💡 Tip: This data will be available in your workflow as <code className="bg-gray-100 px-1 py-0.5 rounded">{'{{trigger.payload.fieldName}}'}</code>
                </p>
              </div>

              {/* Webhook Section */}
              {triggerType === 'webhook' && (
                <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                    <Webhook size={18} />
                    Webhook URL
                  </h3>
                  
                  {!webhookUrl ? (
                    <button
                      onClick={createWebhook}
                      disabled={isCreatingWebhook}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
                    >
                      {isCreatingWebhook ? 'Creating...' : 'Generate Webhook URL'}
                    </button>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          type="text"
                          value={webhookUrl}
                          readOnly
                          className="flex-1 px-3 py-2 bg-white border border-purple-300 rounded-lg font-mono text-sm"
                        />
                        <button
                          onClick={() => copyToClipboard(webhookUrl)}
                          className="px-3 py-2 border border-purple-300 rounded-lg hover:bg-purple-100 transition"
                          title="Copy to clipboard"
                        >
                          {copied ? <Check size={18} className="text-green-600" /> : <Copy size={18} />}
                        </button>
                      </div>
                      <p className="text-xs text-purple-700">
                        Share this URL with external systems to trigger your workflow.
                      </p>
                      
                      {/* cURL Example */}
                      <div className="mt-3 p-3 bg-gray-900 text-white rounded-lg text-xs font-mono overflow-x-auto">
                        <div className="text-gray-400 mb-1"># Example: Trigger via cURL</div>
                        <div>
                          curl -X POST {webhookUrl} \<br />
                          &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                          &nbsp;&nbsp;-d '{testData.replace(/\n/g, ' ')}'
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Schedule Info */}
          {triggerType === 'schedule' && (
            <div className="mb-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
              <Calendar size={48} className="text-yellow-600 mx-auto mb-3" />
              <h3 className="font-semibold text-yellow-900 mb-2">Scheduled Workflow</h3>
              <p className="text-sm text-yellow-700 mb-4">
                This workflow runs automatically based on its schedule.<br />
                You can still test it manually with sample data below.
              </p>
              <button
                onClick={handleTest}
                className="px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                Test Now with Sample Data
              </button>
            </div>
          )}

          {/* Event Info */}
          {triggerType === 'event' && (
            <div className="mb-6 p-6 bg-indigo-50 border border-indigo-200 rounded-lg text-center">
              <Zap size={48} className="text-indigo-600 mx-auto mb-3" />
              <h3 className="font-semibold text-indigo-900 mb-2">Event-Triggered Workflow</h3>
              <p className="text-sm text-indigo-700 mb-4">
                This workflow is triggered by system events.<br />
                You can test it manually with sample data to verify it works correctly.
              </p>
              <button
                onClick={handleTest}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                Test Now with Sample Data
              </button>
            </div>
          )}

          {/* Help Text */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 text-sm">How to test:</h4>
            <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
              <li>Choose a sample data template or enter your own</li>
              <li>Make sure the JSON format is correct</li>
              <li>Click "Run Test" to execute the workflow</li>
              <li>Watch the execution in the debug panel below</li>
              <li>Check if the results are what you expect</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={handleTest}
            className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
          >
            <Play size={18} />
            Run Test
          </button>
        </div>
      </div>
    </div>
  );
}
