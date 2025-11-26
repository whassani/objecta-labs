'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  PlusIcon,
  FolderIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function DatasetsPage() {
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState<any>(null);
  const queryClient = useQueryClient();

  // Fetch datasets
  const { data: datasets, isLoading } = useQuery({
    queryKey: ['fine-tuning', 'datasets'],
    queryFn: () => api.get('/fine-tuning/datasets').then((res) => res.data),
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/fine-tuning/datasets/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'datasets'] });
    },
  });

  // Validate mutation
  const validateMutation = useMutation({
    mutationFn: (id: string) => api.post(`/fine-tuning/datasets/${id}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'datasets'] });
    },
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

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
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Training Datasets</h1>
          <p className="text-gray-600">
            Manage your training datasets for fine-tuning AI models
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setImportModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Import from Conversations
          </button>
          <button
            onClick={() => setUploadModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Upload Dataset
          </button>
        </div>
      </div>

      {/* Datasets Grid */}
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
      ) : datasets && datasets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {datasets.map((dataset: any) => (
            <div
              key={dataset.id}
              className="bg-white rounded-lg shadow border border-gray-200 hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <FolderIcon className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <h3 className="font-semibold text-gray-900">{dataset.name}</h3>
                      <p className="text-xs text-gray-500">{dataset.format.toUpperCase()}</p>
                    </div>
                  </div>
                  {dataset.validated ? (
                    <CheckCircleIcon className="h-6 w-6 text-green-500" title="Validated" />
                  ) : (
                    <XCircleIcon className="h-6 w-6 text-gray-400" title="Not validated" />
                  )}
                </div>

                {dataset.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {dataset.description}
                  </p>
                )}

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Examples:</span>
                    <span className="font-semibold text-gray-900">
                      {dataset.totalExamples.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Size:</span>
                    <span className="font-semibold text-gray-900">
                      {formatBytes(dataset.fileSizeBytes)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="text-gray-900">{formatDate(dataset.createdAt)}</span>
                  </div>
                  {dataset.source && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Source:</span>
                      <span className="text-gray-900 capitalize">{dataset.source}</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-200 flex space-x-2">
                  {!dataset.validated && (
                    <button
                      onClick={() => validateMutation.mutate(dataset.id)}
                      disabled={validateMutation.isPending}
                      className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 disabled:opacity-50"
                    >
                      Validate
                    </button>
                  )}
                  <Link
                    href={`/dashboard/fine-tuning/datasets/${dataset.id}`}
                    className="flex-1 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 text-center"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this dataset?')) {
                        deleteMutation.mutate(dataset.id);
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100 disabled:opacity-50"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow border border-gray-200 p-12 text-center">
          <FolderIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No datasets yet</h3>
          <p className="text-gray-600 mb-6">
            Upload your first training dataset or import from conversations
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => setUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Upload Dataset
            </button>
            <button
              onClick={() => setImportModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
              Import from Conversations
            </button>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <UploadDatasetModal
          isOpen={uploadModalOpen}
          onClose={() => setUploadModalOpen(false)}
          onSuccess={() => {
            setUploadModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'datasets'] });
          }}
        />
      )}

      {/* Import Modal */}
      {importModalOpen && (
        <ImportFromConversationsModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onSuccess={() => {
            setImportModalOpen(false);
            queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'datasets'] });
          }}
        />
      )}
    </div>
  );
}

// Upload Dataset Modal Component
function UploadDatasetModal({ isOpen, onClose, onSuccess }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('jsonl');

  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post('/fine-tuning/datasets', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('format', format);

    uploadMutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold mb-4">Upload Training Dataset</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dataset Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="My Training Dataset"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your dataset..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="jsonl">JSONL (Recommended)</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                File *
              </label>
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                accept=".jsonl,.json,.csv"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max file size: 100MB. Format: JSONL with messages array.
              </p>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Import from Conversations Modal Component
function ImportFromConversationsModal({ isOpen, onClose, onSuccess }: any) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState('');
  const [maxExamples, setMaxExamples] = useState(100);

  const importMutation = useMutation({
    mutationFn: (data: any) => api.post('/fine-tuning/datasets/import-from-conversations', data),
    onSuccess,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    importMutation.mutate({
      name,
      description,
      agentId: agentId || undefined,
      maxExamples,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <h2 className="text-xl font-bold mb-4">Import from Conversations</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dataset Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Imported Dataset"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Filter by Agent (optional)
              </label>
              <input
                type="text"
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Agent ID"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Max Examples
              </label>
              <input
                type="number"
                value={maxExamples}
                onChange={(e) => setMaxExamples(parseInt(e.target.value))}
                min={10}
                max={10000}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={importMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {importMutation.isPending ? 'Importing...' : 'Import'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
