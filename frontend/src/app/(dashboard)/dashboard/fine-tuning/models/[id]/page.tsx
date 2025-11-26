'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  ArchiveBoxIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
  deprecated: 'bg-red-100 text-red-800',
};

export default function ModelDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const modelId = params.id as string;

  // Fetch model details
  const { data: model, isLoading } = useQuery({
    queryKey: ['fine-tuning', 'models', modelId],
    queryFn: () => api.get(`/fine-tuning/models/${modelId}`).then((res) => res.data),
  });

  // Deploy mutation
  const deployMutation = useMutation({
    mutationFn: () => api.post(`/fine-tuning/models/${modelId}/deploy`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'models', modelId] });
    },
  });

  // Archive mutation
  const archiveMutation = useMutation({
    mutationFn: () => api.post(`/fine-tuning/models/${modelId}/archive`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'models', modelId] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/fine-tuning/models/${modelId}`),
    onSuccess: () => {
      router.push('/dashboard/fine-tuning/models');
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

  const formatNumber = (num: number | string) => {
    return Number(num).toLocaleString();
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

  if (!model) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Model Not Found</h3>
          <p className="text-red-700 mb-4">
            The model you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            href="/dashboard/fine-tuning/models"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Models
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back Button */}
      <Link
        href="/dashboard/fine-tuning/models"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Models
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-4">
            <div className="h-16 w-16 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
              <ChartBarIcon className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{model.name}</h1>
              {model.description && <p className="text-gray-600">{model.description}</p>}
            </div>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              STATUS_COLORS[model.status as keyof typeof STATUS_COLORS]
            }`}
          >
            {model.status}
          </span>
        </div>

        {/* Deployment Badge */}
        {model.deployed && (
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircleIcon className="h-6 w-6 text-green-500" />
            <span className="text-sm font-medium text-green-700">
              Deployed ({model.deploymentCount} {model.deploymentCount === 1 ? 'agent' : 'agents'})
            </span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Provider</div>
          <div className="text-2xl font-bold text-gray-900 capitalize">{model.provider}</div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Base Model</div>
          <div className="text-2xl font-bold text-gray-900">{model.baseModel}</div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Version</div>
          <div className="text-2xl font-bold text-gray-900">v{model.version}</div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Requests</div>
          <div className="text-2xl font-bold text-gray-900">{formatNumber(model.totalRequests)}</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <div className="text-sm text-gray-600 mb-1">Tokens Used</div>
            <div className="text-3xl font-bold text-gray-900">
              {formatNumber(model.totalTokensUsed)}
            </div>
          </div>

          {model.averageLatencyMs && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Avg Latency</div>
              <div className="text-3xl font-bold text-gray-900">{model.averageLatencyMs}ms</div>
            </div>
          )}

          {model.finalLoss !== null && model.finalLoss !== undefined && (
            <div>
              <div className="text-sm text-gray-600 mb-1">Final Loss</div>
              <div className="text-3xl font-bold text-gray-900">
                {Number(model.finalLoss).toFixed(4)}
              </div>
            </div>
          )}
        </div>

        {(model.trainingAccuracy || model.validationAccuracy) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200">
            {model.trainingAccuracy && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Training Accuracy</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(Number(model.trainingAccuracy) * 100).toFixed(2)}%
                </div>
              </div>
            )}
            {model.validationAccuracy && (
              <div>
                <div className="text-sm text-gray-600 mb-1">Validation Accuracy</div>
                <div className="text-2xl font-bold text-gray-900">
                  {(Number(model.validationAccuracy) * 100).toFixed(2)}%
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Model Information */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Model Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-600">Model ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{model.id}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-600">Provider Model ID</dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono break-all">
                {model.providerModelId}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-600">Training Job</dt>
              <dd className="mt-1">
                <Link
                  href={`/dashboard/fine-tuning/jobs/${model.jobId}`}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {model.job?.name || model.jobId}
                </Link>
              </dd>
            </div>

            {model.job?.completedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Training Completed</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(model.job.completedAt)}</dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-600">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(model.createdAt)}</dd>
            </div>

            {model.deployedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Deployed At</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(model.deployedAt)}</dd>
              </div>
            )}

            {model.archivedAt && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Archived At</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(model.archivedAt)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Usage Statistics */}
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Usage Statistics</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-600">Total Requests</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatNumber(model.totalRequests)}</dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-600">Total Tokens</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatNumber(model.totalTokensUsed)}</dd>
            </div>

            {model.averageLatencyMs && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Average Latency</dt>
                <dd className="mt-1 text-sm text-gray-900">{model.averageLatencyMs}ms</dd>
              </div>
            )}

            <div>
              <dt className="text-sm font-medium text-gray-600">Deployment Count</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {model.deploymentCount} {model.deploymentCount === 1 ? 'agent' : 'agents'}
              </dd>
            </div>

            <div>
              <dt className="text-sm font-medium text-gray-600">Version</dt>
              <dd className="mt-1 text-sm text-gray-900">v{model.version}</dd>
            </div>

            {model.parentModelId && (
              <div>
                <dt className="text-sm font-medium text-gray-600">Parent Model</dt>
                <dd className="mt-1">
                  <Link
                    href={`/dashboard/fine-tuning/models/${model.parentModelId}`}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View Parent Model
                  </Link>
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {/* Actions */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <h2 className="text-xl font-semibold mb-4">Actions</h2>
        <div className="flex flex-wrap gap-3">
          {model.status === 'active' && !model.deployed && (
            <button
              onClick={() => {
                if (confirm('Deploy this model? You can assign it to agents after deployment.')) {
                  deployMutation.mutate();
                }
              }}
              disabled={deployMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              <RocketLaunchIcon className="h-5 w-5 mr-2" />
              {deployMutation.isPending ? 'Deploying...' : 'Deploy Model'}
            </button>
          )}

          {model.deployed && (
            <Link
              href={`/dashboard/agents`}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Manage Agents
            </Link>
          )}

          {model.status === 'active' && (
            <button
              onClick={() => {
                if (confirm('Archive this model? It will no longer be available for deployment.')) {
                  archiveMutation.mutate();
                }
              }}
              disabled={archiveMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
            >
              <ArchiveBoxIcon className="h-5 w-5 mr-2" />
              {archiveMutation.isPending ? 'Archiving...' : 'Archive Model'}
            </button>
          )}

          {!model.deployed && (
            <button
              onClick={() => {
                if (confirm('Delete this model? This action cannot be undone.')) {
                  deleteMutation.mutate();
                }
              }}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              <TrashIcon className="h-5 w-5 mr-2" />
              {deleteMutation.isPending ? 'Deleting...' : 'Delete Model'}
            </button>
          )}
        </div>

        {model.deployed && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This model is currently deployed and in use. To delete it, you must
              first undeploy it from all agents.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
