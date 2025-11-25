'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Play, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { workflowsApi } from '@/lib/api';

export default function NewWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('manual');
  const [scheduleConfig, setScheduleConfig] = useState('');

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await workflowsApi.create(data);
      return response.data;
    },
    onSuccess: (data) => {
      // Redirect to the workflow builder with the new ID
      router.push(`/dashboard/workflows/${data.id}/edit`);
    },
    onError: (error) => {
      console.error('Error creating workflow:', error);
      alert('Failed to create workflow. Please try again.');
    },
  });

  const handleSave = () => {
    if (!name) {
      alert('Please enter a workflow name');
      return;
    }

    const triggerConfig: any = {};
    if (triggerType === 'schedule' && scheduleConfig) {
      triggerConfig.cron = scheduleConfig;
    }

    createMutation.mutate({
      name,
      description,
      triggerType,
      triggerConfig: Object.keys(triggerConfig).length > 0 ? triggerConfig : undefined,
      definition: {
        nodes: [],
        edges: [],
      },
    });
  };

  const handleCancel = () => {
    router.push('/dashboard/workflows');
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Workflow</h1>
            <p className="text-gray-600 mt-1">
              Build automated workflows with visual builder
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={createMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save size={18} />
                Continue to Builder
              </>
            )}
          </button>
        </div>
      </div>

      {/* Workflow Setup Form */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Panel - Configuration */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Workflow Settings
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workflow Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Customer Support Automation"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this workflow do?"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Trigger Type *
                </label>
                <select
                  value={triggerType}
                  onChange={(e) => setTriggerType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                  <option value="manual">🖱️ Manual</option>
                  <option value="schedule">⏰ Schedule</option>
                  <option value="webhook">🔗 Webhook</option>
                  <option value="event">⚡ Event</option>
                  <option value="database">🗄️ Database</option>
                  <option value="email">📧 Email</option>
                  <option value="form">📝 Form</option>
                </select>
              </div>

              {triggerType === 'schedule' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule (Cron)
                  </label>
                  <input
                    type="text"
                    value={scheduleConfig}
                    onChange={(e) => setScheduleConfig(e.target.value)}
                    placeholder="0 9 * * *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Example: 0 9 * * * (Every day at 9:00 AM)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel - Visual Builder */}
        <div className="col-span-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Workflow Builder
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
              <div className="max-w-md mx-auto">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play size={32} className="text-indigo-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Build!
                </h3>
                <p className="text-gray-600 mb-4">
                  Configure your workflow settings on the left, then click "Continue to Builder" 
                  to start designing your automation with our visual workflow builder.
                </p>
                <div className="text-sm text-gray-500">
                  <p className="font-semibold text-indigo-600 mb-2">✨ Visual Builder Features:</p>
                  <ul className="mt-2 space-y-1">
                    <li>✓ Drag-and-drop node placement</li>
                    <li>✓ 12 node types (triggers, actions, controls)</li>
                    <li>✓ Visual connections between nodes</li>
                    <li>✓ Node property editor</li>
                    <li>✓ Real-time canvas updates</li>
                  </ul>
                </div>
                <button
                  onClick={handleSave}
                  className="mt-6 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                >
                  Continue to Visual Builder →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
