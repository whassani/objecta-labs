'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  XCircleIcon,
  DocumentTextIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DatasetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const datasetId = params.id as string;

  // Fetch dataset details
  const { data: dataset, isLoading } = useQuery({
    queryKey: ['fine-tuning', 'datasets', datasetId],
    queryFn: () => api.get(`/fine-tuning/datasets/${datasetId}`).then((res) => res.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/fine-tuning/datasets/${datasetId}`),
    onSuccess: () => {
      router.push('/dashboard/fine-tuning/datasets');
    },
  });

  // Validate mutation
  const validateMutation = useMutation({
    mutationFn: () => api.post(`/fine-tuning/datasets/${datasetId}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'datasets', datasetId] });
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <XCircleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-red-900 mb-2">Dataset Not Found</h3>
          <p className="text-red-700 mb-4">
            The dataset you're looking for doesn't exist or has been deleted.
          </p>
          <Link
            href="/dashboard/fine-tuning/datasets"
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Datasets
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Back Button */}
      <Link
        href="/dashboard/fine-tuning/datasets"
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Datasets
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <DocumentTextIcon className="h-10 w-10 text-blue-500" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{dataset.name}</h1>
              {dataset.description && (
                <p className="text-gray-600">{dataset.description}</p>
              )}
            </div>
          </div>
          {dataset.validated ? (
            <div className="flex items-center text-green-600">
              <CheckCircleIcon className="h-6 w-6 mr-2" />
              <span className="font-semibold">Validated</span>
            </div>
          ) : (
            <div className="flex items-center text-yellow-600">
              <XCircleIcon className="h-6 w-6 mr-2" />
              <span className="font-semibold">Not Validated</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Total Examples</div>
          <div className="text-3xl font-bold text-gray-900">{dataset.totalExamples.toLocaleString()}</div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">File Size</div>
          <div className="text-3xl font-bold text-gray-900">{formatBytes(dataset.fileSizeBytes)}</div>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="text-sm text-gray-600 mb-1">Format</div>
          <div className="text-3xl font-bold text-gray-900">{dataset.format.toUpperCase()}</div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Details</h2>
        
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-600">Dataset ID</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono">{dataset.id}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-600">Created At</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(dataset.createdAt)}</dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-600">Created By</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {dataset.creator?.name || dataset.creator?.email || 'Unknown'}
            </dd>
          </div>

          {dataset.source && (
            <div>
              <dt className="text-sm font-medium text-gray-600">Source</dt>
              <dd className="mt-1 text-sm text-gray-900 capitalize">{dataset.source}</dd>
            </div>
          )}

          <div>
            <dt className="text-sm font-medium text-gray-600">File Path</dt>
            <dd className="mt-1 text-sm text-gray-900 font-mono text-xs break-all">
              {dataset.filePath}
            </dd>
          </div>

          <div>
            <dt className="text-sm font-medium text-gray-600">Last Updated</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatDate(dataset.updatedAt)}</dd>
          </div>
        </dl>
      </div>

      {/* Source Filters (if imported) */}
      {dataset.sourceFilters && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-900">Import Filters</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(dataset.sourceFilters).map(([key, value]) => (
              <div key={key}>
                <dt className="text-sm font-medium text-blue-700 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </dt>
                <dd className="mt-1 text-sm text-blue-900">
                  {value ? String(value) : 'N/A'}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {/* Validation Errors */}
      {!dataset.validated && dataset.validationErrors && dataset.validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-red-900">Validation Errors</h2>
          <ul className="space-y-2">
            {dataset.validationErrors.map((error: string, index: number) => (
              <li key={index} className="text-sm text-red-800 flex items-start">
                <XCircleIcon className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex space-x-4">
        {!dataset.validated && (
          <button
            onClick={() => validateMutation.mutate()}
            disabled={validateMutation.isPending}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
          >
            {validateMutation.isPending ? 'Validating...' : 'Validate Dataset'}
          </button>
        )}

        {dataset.validated && (
          <Link
            href={`/dashboard/fine-tuning/jobs/new?datasetId=${dataset.id}`}
            className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 text-center"
          >
            Create Training Job
          </Link>
        )}

        <button
          onClick={() => {
            if (confirm('Are you sure you want to delete this dataset? This action cannot be undone.')) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending}
          className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center"
        >
          <TrashIcon className="h-5 w-5 mr-2" />
          {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
}
