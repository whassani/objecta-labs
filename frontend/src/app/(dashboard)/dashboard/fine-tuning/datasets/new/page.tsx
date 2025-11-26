'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  CloudArrowUpIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

export default function NewDatasetPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [uploadMethod, setUploadMethod] = useState<'upload' | 'import' | null>(null);

  // Upload form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState('jsonl');

  // Import form state
  const [importName, setImportName] = useState('');
  const [importDescription, setImportDescription] = useState('');
  const [agentId, setAgentId] = useState('');
  const [maxExamples, setMaxExamples] = useState(100);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post('/fine-tuning/datasets', data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'datasets'] });
      router.push('/dashboard/fine-tuning/datasets');
    },
  });

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (data: any) => api.post('/fine-tuning/datasets/import-from-conversations', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fine-tuning', 'datasets'] });
      router.push('/dashboard/fine-tuning/datasets');
    },
  });

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('format', format);

    uploadMutation.mutate(formData);
  };

  const handleImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    importMutation.mutate({
      name: importName,
      description: importDescription,
      agentId: agentId || undefined,
      maxExamples,
    });
  };

  if (!uploadMethod) {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Training Dataset</h1>
          <p className="text-gray-600">
            Choose how you want to create your training dataset
          </p>
        </div>

        {/* Method Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Upload Method */}
          <button
            onClick={() => setUploadMethod('upload')}
            className="p-8 bg-white border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-lg transition-all text-left"
          >
            <CloudArrowUpIcon className="h-12 w-12 text-blue-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload File</h3>
            <p className="text-gray-600 mb-4">
              Upload a JSONL, CSV, or JSON file with your training data
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Best for prepared datasets</li>
              <li>• Supports JSONL, CSV, JSON formats</li>
              <li>• Up to 100MB file size</li>
              <li>• Minimum 10 examples required</li>
            </ul>
          </button>

          {/* Import Method */}
          <button
            onClick={() => setUploadMethod('import')}
            className="p-8 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-lg transition-all text-left"
          >
            <DocumentTextIcon className="h-12 w-12 text-purple-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Import from Conversations</h3>
            <p className="text-gray-600 mb-4">
              Convert your existing conversations into training data
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use existing chat history</li>
              <li>• Filter by agent or date range</li>
              <li>• Automatically formatted</li>
              <li>• No file preparation needed</li>
            </ul>
          </button>
        </div>
      </div>
    );
  }

  if (uploadMethod === 'upload') {
    return (
      <div className="p-6 max-w-2xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => setUploadMethod(null)}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to Methods
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Upload Training Dataset</h1>
          <p className="text-gray-600">
            Upload a file containing your training examples
          </p>
        </div>

        {/* Upload Form */}
        <form onSubmit={handleUploadSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dataset Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Customer Support Training Data"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your dataset and its purpose..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Training File *
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

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">JSONL Format Example:</h4>
              <pre className="text-xs bg-white p-3 rounded border border-blue-200 overflow-x-auto">
{`{"messages": [
  {"role": "system", "content": "You are a helpful assistant."},
  {"role": "user", "content": "Hello!"},
  {"role": "assistant", "content": "Hi! How can I help you?"}
]}`}
              </pre>
            </div>

            <div className="flex space-x-3 pt-4">
              <button
                type="button"
                onClick={() => router.push('/dashboard/fine-tuning/datasets')}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploadMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {uploadMutation.isPending ? 'Uploading...' : 'Upload Dataset'}
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Import form
  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => setUploadMethod(null)}
        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeftIcon className="h-4 w-4 mr-1" />
        Back to Methods
      </button>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import from Conversations</h1>
        <p className="text-gray-600">
          Convert your existing conversations into training data
        </p>
      </div>

      {/* Import Form */}
      <form onSubmit={handleImportSubmit} className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset Name *
            </label>
            <input
              type="text"
              value={importName}
              onChange={(e) => setImportName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Imported Conversations Dataset"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={importDescription}
              onChange={(e) => setImportDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Describe the source of this data..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Agent (optional)
            </label>
            <input
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Agent ID"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to import from all agents
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Examples
            </label>
            <input
              type="number"
              value={maxExamples}
              onChange={(e) => setMaxExamples(parseInt(e.target.value))}
              min={10}
              max={10000}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum 10, maximum 10,000 examples
            </p>
          </div>

          {/* Info Box */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2">How it works:</h4>
            <ul className="text-sm text-purple-800 space-y-1">
              <li>• Fetches recent conversations from your organization</li>
              <li>• Converts them to JSONL training format</li>
              <li>• Filters by your specified criteria</li>
              <li>• Creates a ready-to-use dataset</li>
            </ul>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={() => router.push('/dashboard/fine-tuning/datasets')}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={importMutation.isPending}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
            >
              {importMutation.isPending ? 'Importing...' : 'Import Conversations'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
