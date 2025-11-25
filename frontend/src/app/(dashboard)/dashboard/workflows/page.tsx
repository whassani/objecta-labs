'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Filter, Play, Pause, Copy, Trash2, Edit, MoreVertical } from 'lucide-react';

interface Workflow {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'archived';
  triggerType: string;
  lastExecutedAt?: string;
  executionCount: number;
  createdAt: string;
  tags: string[];
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const handleCreateWorkflow = () => {
    router.push('/dashboard/workflows/new');
  };

  const handleEditWorkflow = (id: string) => {
    router.push(`/dashboard/workflows/${id}/edit`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTriggerTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      manual: '🖱️ Manual',
      schedule: '⏰ Schedule',
      webhook: '🔗 Webhook',
      event: '⚡ Event',
      database: '🗄️ Database',
      email: '📧 Email',
      form: '📝 Form',
    };
    return labels[type] || type;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflows</h1>
          <p className="text-gray-600 mt-1">
            Automate tasks with visual workflow builder
          </p>
        </div>
        <button
          onClick={handleCreateWorkflow}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          <Plus size={20} />
          New Workflow
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search workflows..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition">
            <Filter size={20} />
            More Filters
          </button>
        </div>
      </div>

      {/* Workflows List */}
      {workflows.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Play size={32} className="text-indigo-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No workflows yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first workflow to automate tasks and streamline your processes.
            </p>
            <button
              onClick={handleCreateWorkflow}
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus size={20} />
              Create Your First Workflow
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition cursor-pointer"
              onClick={() => handleEditWorkflow(workflow.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {workflow.name}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                        workflow.status,
                      )}`}
                    >
                      {workflow.status}
                    </span>
                  </div>

                  {workflow.description && (
                    <p className="text-gray-600 mb-3">{workflow.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{getTriggerTypeLabel(workflow.triggerType)}</span>
                    <span>•</span>
                    <span>{workflow.executionCount} executions</span>
                    {workflow.lastExecutedAt && (
                      <>
                        <span>•</span>
                        <span>
                          Last run: {new Date(workflow.lastExecutedAt).toLocaleString()}
                        </span>
                      </>
                    )}
                  </div>

                  {workflow.tags.length > 0 && (
                    <div className="flex gap-2 mt-3">
                      {workflow.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle execute
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title="Execute workflow"
                  >
                    <Play size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle duplicate
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title="Duplicate workflow"
                  >
                    <Copy size={18} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle more options
                    }}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                    title="More options"
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">Total Workflows</div>
          <div className="text-2xl font-bold text-gray-900">0</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">Active</div>
          <div className="text-2xl font-bold text-green-600">0</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">Total Executions</div>
          <div className="text-2xl font-bold text-indigo-600">0</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="text-sm text-gray-600 mb-1">Success Rate</div>
          <div className="text-2xl font-bold text-gray-900">--%</div>
        </div>
      </div>
    </div>
  );
}
