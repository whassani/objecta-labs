'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  CpuChipIcon,
  StopCircleIcon,
  ArrowPathIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import { useEffect } from 'react';

const STATUS_COLORS = {
  pending: 'bg-gray-100 text-gray-800',
  validating: 'bg-blue-100 text-blue-800',
  queued: 'bg-yellow-100 text-yellow-800',
  running: 'bg-green-100 text-green-800 animate-pulse',
  succeeded: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const jobId = params.id as string;

  // Fetch job details
  const { data: job, isLoading, refetch } = useQuery({
    queryKey: ['fine-tuning', 'jobs', jobId],
    queryFn: () => api.get(`/fine-tuning/jobs/${jobId}`).then((res) => res.data),
    refetchInterval: (data) => {
      // Auto-refresh every 10 seconds if job is active
      if (data && ['running', 'queued', 'validating'].includes(data.status)) {
        return 10000;
      }
      return false;
    },
  });

  // Fetch events
  const { data: events } = useQuery({
    queryKey: ['fine-tuning', 'jobs', jobId, 'events'],
    queryFn: () => api.get(`/fine-tuning/jobs/${jobId}/events`).then((res) => res.data),
  });

  // Cancel mutation
  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/fine-tuning/jobs/${jobId}/cancel`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'jobs', jobId] });
    },
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: () => api.post(`/fine-tuning/jobs/${jobId}/sync`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'jobs', jobId] });
    },
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate).getTime();
    const end = endDate ? new Date(endDate).getTime() : Date.now();
    const duration = Math.floor((end - start) / 1000 / 60); // minutes
    
    if (duration < 1) return '< 1 min';
    if (duration < 60) return `${duration} min`;
    const hours = Math.floor(duration / 60);
    const mins = duration % 60;
    return `${hours}h ${mins}m`;
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Job Not Found</h3>
          <p className="text-red-700 mb-4">
            The training job you're looking for doesn't exist.
          </p>
          <Link
            href="/dashboard/fine-tuning/jobs"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const isActive = ['running', 'queued', 'validating'].includes(job.status);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <Link
        href="/dashboard/fine-tuning/jobs"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Jobs
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div
              className={`h-16 w-16 rounded-lg flex items-center justify-center ${
                job.status === 'succeeded'
                  ? 'bg-green-100 text-green-600'
                  : job.status === 'failed'
                  ? 'bg-red-100 text-red-600'
                  : job.status === 'running'
                  ? 'bg-yellow-100 text-yellow-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <CpuChipIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.name}</h1>
              {job.description && <p className="text-gray-600">{job.description}</p>}
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              STATUS_COLORS[job.status as keyof typeof STATUS_COLORS]
            }`}
          >
            {job.status}
          </span>
        </div>

        {/* Action Buttons */}
        {isActive && (
          <div className="flex space-x-3">
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <ArrowPathIcon className="h-5 w-5 mr-2" />
              {syncMutation.isPending ? 'Syncing...' : 'Sync Status'}
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to cancel this training job?')) {
                  cancelMutation.mutate();
                }
              }}
              disabled={cancelMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50 disabled:opacity-50"
            >
              <StopCircleIcon className="h-5 w-5 mr-2" />
              {cancelMutation.isPending ? 'Cancelling...' : 'Cancel Job'}
            </button>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {job.status === 'running' && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-gray-900">Training Progress</h3>
            <span className="text-2xl font-bold text-blue-600">{job.progressPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
            <div
              className="bg-blue-600 h-4 rounded-full transition-all duration-500"
              style={{ width: `${job.progressPercentage}%` }}
            ></div>
          </div>
          {job.currentEpoch && job.totalEpochs && (
            <p className="text-sm text-gray-600">
              Epoch {job.currentEpoch} of {job.totalEpochs}
            </p>
          )}
        </div>
      )}

      {/* Success Message */}
      {job.status === 'succeeded' && job.resultModelId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-green-900">Training Complete!</h3>
              <p className="text-sm text-green-700">Your fine-tuned model is ready to deploy.</p>
            </div>
          </div>
          <Link
            href={`/dashboard/fine-tuning/models/${job.resultModelId}`}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            View Model →
          </Link>
        </div>
      )}

      {/* Error Message */}
      {job.status === 'failed' && job.errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <div className="flex items-start">
            <XCircleIcon className="h-8 w-8 text-red-600 mr-4 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-2">Training Failed</h3>
              <p className="text-sm text-red-800 mb-2">
                <strong>Error:</strong> {job.errorMessage}
              </p>
              {job.errorCode && (
                <p className="text-xs text-red-700">Code: {job.errorCode}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Provider</div>
          <div className="text-2xl font-bold text-gray-900 capitalize">{job.provider}</div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Base Model</div>
          <div className="text-2xl font-bold text-gray-900">{job.baseModel}</div>
        </div>

        {job.estimatedCostUsd !== undefined && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Estimated Cost</div>
            <div className="text-2xl font-bold text-gray-900">
              ${job.estimatedCostUsd.toFixed(2)}
            </div>
          </div>
        )}

        {job.startedAt && (
          <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
            <div className="text-sm text-gray-600 mb-1">Duration</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatDuration(job.startedAt, job.completedAt || job.cancelledAt)}
            </div>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Configuration */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Configuration</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-600">Job ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{job.id}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-600">Dataset</dt>
              <dd className="mt-1">
                <Link
                  href={`/dashboard/fine-tuning/datasets/${job.datasetId}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {job.dataset?.name || job.datasetId}
                </Link>
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-600">Training Examples</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {job.dataset?.totalExamples?.toLocaleString() || 'N/A'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-600">Provider Job ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                {job.providerJobId || 'Not started'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-600">Created By</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {job.creator?.name || job.creator?.email || 'Unknown'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-600">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(job.createdAt)}</dd>
            </div>
          </dl>
        </div>

        {/* Hyperparameters */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Hyperparameters</h2>
          <dl className="space-y-3">
            {Object.entries(job.hyperparameters || {}).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm font-medium text-gray-600 capitalize">
                  {key.replace(/_/g, ' ')}
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{String(value)}</dd>
              </div>
            ))}
            {Object.keys(job.hyperparameters || {}).length === 0 && (
              <p className="text-sm text-gray-500">No hyperparameters configured</p>
            )}
          </dl>
        </div>
      </div>

      {/* Training Metrics */}
      {(job.trainedTokens || job.trainingLoss || job.validationLoss) && (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Training Metrics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {job.trainedTokens && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Tokens Trained</div>
                <div className="text-3xl font-bold text-gray-900">
                  {job.trainedTokens.toLocaleString()}
                </div>
              </div>
            )}
            {job.trainingLoss !== null && job.trainingLoss !== undefined && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Training Loss</div>
                <div className="text-3xl font-bold text-gray-900">
                  {job.trainingLoss.toFixed(4)}
                </div>
              </div>
            )}
            {job.validationLoss !== null && job.validationLoss !== undefined && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Validation Loss</div>
                <div className="text-3xl font-bold text-gray-900">
                  {job.validationLoss.toFixed(4)}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Events Log */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Event Log</h2>
          <button
            onClick={() => refetch()}
            className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
          >
            <ArrowPathIcon className="h-4 w-4 mr-1" />
            Refresh
          </button>
        </div>
        <div className="divide-y divide-gray-200 max-h-96 overflow-y-auto">
          {events && events.length > 0 ? (
            events.map((event: any) => (
              <div key={event.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {event.eventType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(event.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-900">{event.message}</p>
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">
                        {JSON.stringify(event.metadata, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-12 text-center">
              <p className="text-gray-500">No events yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
