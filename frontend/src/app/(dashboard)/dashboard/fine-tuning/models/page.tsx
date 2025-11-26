'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  ChartBarIcon,
  CheckCircleIcon,
  ArchiveBoxIcon,
  TrashIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
  deprecated: 'bg-red-100 text-red-800',
};

export default function ModelsPage() {
  const [filter, setFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch models
  const { data: models, isLoading } = useQuery({
    queryKey: ['fine-tuning', 'models'],
    queryFn: () => api.get('/fine-tuning/models').then((res) => res.data),
  });

  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: (id: string) => api.post(`/fine-tuning/models/${id}/deploy`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'models'] });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: (id: string) => api.post(`/fine-tuning/models/${id}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'models'] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fine-tuning/models/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'models'] });
    },
  });

  const filteredModels = models?.filter((model: any) => {
    if (filter === 'all') return true;
    if (filter === 'active') return model.status === 'active';
    if (filter === 'deployed') return model.deployed;
    if (filter === 'archived') return model.status === 'archived';
    return true;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Fine-Tuned Models</h1>
        <p className="text-gray-600">
          Manage and deploy your trained AI models
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        {[
          { key: 'all', label: 'All Models' },
          { key: 'active', label: 'Active' },
          { key: 'deployed', label: 'Deployed' },
          { key: 'archived', label: 'Archived' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Models Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : filteredModels && filteredModels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model: any) => (
            <div
              key={model.id}
              className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <ChartBarIcon className="h-8 w-8 text-purple-500 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{model.name}</h3>
                      <p className="text-xs text-gray-500">{model.baseModel}</p>
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      STATUS_COLORS[model.status as keyof typeof STATUS_COLORS]
                    }`}
                  >
                    {model.status}
                  </span>
                </div>

                {model.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {model.description}
                  </p>
                )}

                {/* Deployment Badge */}
                {model.deployed && (
                  <div className="mb-4 flex items-center space-x-2">
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    <span className="text-sm font-medium text-green-700">
                      Deployed ({model.deploymentCount} agents)
                    </span>
                  </div>
                )}

                {/* Stats */}
                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-semibold text-gray-900">v{model.version}</span>
                  </div>
                  {model.finalLoss && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Final Loss:</span>
                      <span className="font-semibold text-gray-900">
                        {model.finalLoss.toFixed(4)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Requests:</span>
                    <span className="font-semibold text-gray-900">
                      {model.totalRequests.toLocaleString()}
                    </span>
                  </div>
                  {model.averageLatencyMs && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Avg Latency:</span>
                      <span className="font-semibold text-gray-900">
                        {model.averageLatencyMs}ms
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">{formatDate(model.createdAt)}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  {model.status === 'active' && !model.deployed && (
                    <button
                      onClick={() => deployMutation.mutate(model.id)}
                      disabled={deployMutation.isPending}
                      className="w-full px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
                    >
                      <RocketLaunchIcon className="h-5 w-5 mr-2" />
                      Deploy Model
                    </button>
                  )}
                  
                  <div className="flex space-x-2">
                    <Link
                      href={`/dashboard/fine-tuning/models/${model.id}`}
                      className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 text-center"
                    >
                      View Details
                    </Link>
                    
                    {model.status === 'active' && (
                      <button
                        onClick={() => {
                          if (confirm('Archive this model?')) {
                            archiveMutation.mutate(model.id);
                          }
                        }}
                        disabled={archiveMutation.isPending}
                        className="px-3 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 rounded hover:bg-yellow-100 disabled:opacity-50"
                        title="Archive"
                      >
                        <ArchiveBoxIcon className="h-5 w-5" />
                      </button>
                    )}
                    
                    {!model.deployed && (
                      <button
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this model?')) {
                            deleteMutation.mutate(model.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                        title="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <ChartBarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No models yet' : `No ${filter} models`}
          </h3>
          <p className="text-gray-600 mb-6">
            Models will appear here once your training jobs are completed
          </p>
          <Link
            href="/dashboard/fine-tuning/jobs/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Training Job
          </Link>
        </div>
      )}
    </div>
  );
}
