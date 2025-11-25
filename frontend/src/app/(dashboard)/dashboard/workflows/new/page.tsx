'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Play } from 'lucide-react';

export default function NewWorkflowPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [triggerType, setTriggerType] = useState('manual');

  const handleSave = () => {
    // TODO: Implement save workflow
    console.log('Save workflow:', { name, description, triggerType });
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
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            <Save size={18} />
            Save Workflow
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
                    placeholder="0 9 * * *"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Every day at 9:00 AM
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
                  Visual Builder Coming Soon
                </h3>
                <p className="text-gray-600 mb-4">
                  The drag-and-drop workflow builder will be available in Phase 1.
                  For now, save your workflow configuration.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Phase 1 will include:</p>
                  <ul className="mt-2 space-y-1">
                    <li>✓ ReactFlow canvas integration</li>
                    <li>✓ Drag-and-drop nodes</li>
                    <li>✓ Node connection system</li>
                    <li>✓ Real-time validation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
