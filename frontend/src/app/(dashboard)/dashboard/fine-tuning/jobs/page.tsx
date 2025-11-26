'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  PlusIcon,
  CpuChipIcon,
  StopCircleIcon,
  ChartBarIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  validating: 'bg-blue-100 text-blue-800',
  queued: 'bg-yellow-100 text-yellow-800',
  running: 'bg-green-100 text-green-800 animate-pulse',
  succeeded: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function JobsPage() {
  const [filter, setFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  // Fetch jobs
  const { data: jobs, isLoading } = useQuery({
    queryKey: ['fine-tuning', 'jobs'],
    queryFn: () => api.get('/fine-tuning/jobs').then((res) => res.data),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.post(`/fine-tuning/jobs/${id}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'jobs'] });
    },
  });

  // Sync status mutation
  const syncMutation = useMutation({
    mutationFn: (id: string) => api.post(`/fine-tuning/jobs/${id}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'jobs'] });
    },
  });

  const filteredJobs = jobs?.filter((job: any) => {
    if (filter === 'all') return true;
    if (filter === 'active') return ['running', 'queued', 'validating'].includes(job.status);
    if (filter === 'completed') return job.status === 'succeeded';
    if (filter === 'failed') return job.status === 'failed';
    return true;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000 / 60); // minutes
    
    if (duration < 60) return `${duration}m`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Fine-Tuning Jobs</h1>
          <p className="text-gray-600">
            Monitor and manage your AI model training jobs
          </p>
        </div>
        <Link
          href="/dashboard/fine-tuning/jobs/new"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Training Job
        </Link>
      </div>

      {/* Filters */}
      <div className="mb-6 flex space-x-2">
        {[
          { key: 'all', label: 'All Jobs' },
          { key: 'active', label: 'Active' },
          { key: 'completed', label: 'Completed' },
          { key: 'failed', label: 'Failed' },
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

      {/* Jobs List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow border border-gray-200 p-6 animate-pulse">
              <div className="flex items-center justify-between mb-4">
                <div className="flex-1">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-6 w-20 bg-gray-200 rounded"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredJobs && filteredJobs.length > 0 ? (
        <div className="space-y-4">
          {filteredJobs.map((job: any) => (
            <div
              key={job.id}
              className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4 flex-1">
                    <div
                      className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        job.status === 'succeeded'
                          ? 'bg-green-100 text-green-600'
                          : job.status === 'failed'
                          ? 'bg-red-100 text-red-600'
                          : job.status === 'running'
                          ? 'bg-yellow-100 text-yellow-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <CpuChipIcon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <Link
                          href={`/dashboard/fine-tuning/jobs/${job.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {job.name}
                        </Link>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STATUS_COLORS[job.status as keyof typeof STATUS_COLORS]
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      {job.description && (
                        <p className="text-sm text-gray-600 mb-2">{job.description}</p>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span>Model: <strong>{job.baseModel}</strong></span>
                        <span>•</span>
                        <span>Dataset: <strong>{job.dataset?.name || 'Unknown'}</strong></span>
                        {job.estimatedCostUsd && (
                          <>
                            <span>•</span>
                            <span>Cost: <strong>${job.estimatedCostUsd.toFixed(2)}</strong></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    {['running', 'queued', 'validating'].includes(job.status) && (
                      <>
                        <button
                          onClick={() => syncMutation.mutate(job.id)}
                          disabled={syncMutation.isPending}
                          className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
                          title="Sync Status"
                        >
                          Sync
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to cancel this job?')) {
                              cancelMutation.mutate(job.id);
                            }
                          }}
                          disabled={cancelMutation.isPending}
                          className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                          title="Cancel Job"
                        >
                          <StopCircleIcon className="h-5 w-5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {job.status === 'running' && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Training Progress</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {job.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${job.progressPercentage}%` }}
                      ></div>
                    </div>
                    {job.currentEpoch && job.totalEpochs && (
                      <div className="text-xs text-gray-600 mt-1">
                        Epoch {job.currentEpoch} of {job.totalEpochs}
                      </div>
                    )}
                  </div>
                )}

                {/* Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Created</div>
                    <div className="text-sm font-medium text-gray-900">
                      {formatDate(job.createdAt)}
                    </div>
                  </div>
                  {job.startedAt && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Duration</div>
                      <div className="text-sm font-medium text-gray-900">
                        {formatDuration(job.startedAt, job.completedAt)}
                      </div>
                    </div>
                  )}
                  {job.trainedTokens && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Tokens Trained</div>
                      <div className="text-sm font-medium text-gray-900">
                        {job.trainedTokens.toLocaleString()}
                      </div>
                    </div>
                  )}
                  {job.trainingLoss && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Training Loss</div>
                      <div className="text-sm font-medium text-gray-900">
                        {job.trainingLoss.toFixed(4)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Error Message */}
                {job.status === 'failed' && job.errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-sm text-red-800">
                      <strong>Error:</strong> {job.errorMessage}
                    </div>
                  </div>
                )}

                {/* Success Message */}
                {job.status === 'succeeded' && job.resultModelId && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                    <div className="text-sm text-green-800">
                      <strong>Success!</strong> Model trained and ready to deploy.
                    </div>
                    <Link
                      href={`/dashboard/fine-tuning/models/${job.resultModelId}`}
                      className="text-sm font-medium text-green-700 hover:text-green-800"
                    >
                      View Model →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <CpuChipIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === 'all' ? 'No training jobs yet' : `No ${filter} jobs`}
          </h3>
          <p className="text-gray-600 mb-6">
            Create your first fine-tuning job to train a custom AI model
          </p>
          <Link
            href="/dashboard/fine-tuning/jobs/new"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Training Job
          </Link>
        </div>
      )}
    </div>
  );
}
