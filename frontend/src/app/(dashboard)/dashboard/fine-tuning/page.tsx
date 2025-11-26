'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import {
  PlusIcon,
  FolderIcon,
  CpuChipIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ChatBubbleLeftRightIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';

interface DashboardStats {
  datasets: {
    total: number;
    validated: number;
  };
  jobs: {
    total: number;
    running: number;
    completed: number;
    failed: number;
  };
  models: {
    total: number;
    deployed: number;
    active: number;
  };
}

export default function FineTuningDashboard() {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'datasets' | 'jobs' | 'models'>('overview');

  // Fetch stats
  const { data: datasetStats, isLoading: loadingDatasets } = useQuery({
    queryKey: ['fine-tuning', 'datasets', 'stats'],
    queryFn: () => api.get('/fine-tuning/datasets/stats').then((res) => res.data),
  });

  const { data: modelStats, isLoading: loadingModels } = useQuery({
    queryKey: ['fine-tuning', 'models', 'stats'],
    queryFn: () => api.get('/fine-tuning/models/stats').then((res) => res.data),
  });

  const { data: jobs, isLoading: loadingJobs } = useQuery({
    queryKey: ['fine-tuning', 'jobs'],
    queryFn: () => api.get('/fine-tuning/jobs').then((res) => res.data),
  });

  const dashboardStats: DashboardStats = {
    datasets: {
      total: datasetStats?.totalDatasets || 0,
      validated: datasetStats?.validatedDatasets || 0,
    },
    jobs: {
      total: jobs?.length || 0,
      running: jobs?.filter((j: any) => ['running', 'queued'].includes(j.status)).length || 0,
      completed: jobs?.filter((j: any) => j.status === 'succeeded').length || 0,
      failed: jobs?.filter((j: any) => j.status === 'failed').length || 0,
    },
    models: {
      total: modelStats?.totalModels || 0,
      deployed: modelStats?.deployedModels || 0,
      active: modelStats?.activeModels || 0,
    },
  };

  const isLoading = loadingDatasets || loadingModels || loadingJobs;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Model Fine-Tuning</h1>
        <p className="text-gray-600">
          Customize AI models with your own training data to improve performance on specific tasks.
        </p>
      </div>

      {/* Educational Info Box */}
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="text-3xl">🎯</div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">How Fine-Tuning Works</h3>
            <p className="text-sm text-blue-800 mb-4">
              Fine-tuning adapts a pre-trained AI model to your specific use case by training it on your custom examples in conversation format (JSONL).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-sm font-semibold text-gray-900 mb-1">1️⃣ Prepare Dataset</p>
                <p className="text-xs text-gray-600">Upload conversation examples in JSONL format</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-sm font-semibold text-gray-900 mb-1">2️⃣ Start Training</p>
                <p className="text-xs text-gray-600">Create a fine-tuning job with your dataset</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-blue-200">
                <p className="text-sm font-semibold text-gray-900 mb-1">3️⃣ Deploy Model</p>
                <p className="text-xs text-gray-600">Use your custom model in agents</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <Link
          href="/dashboard/fine-tuning/datasets/new"
          className="flex flex-col items-center justify-center p-6 bg-blue-50 border-2 border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <FolderIcon className="h-8 w-8 text-blue-600 mb-2" />
          <div className="text-center">
            <div className="text-blue-900 font-semibold">Upload Dataset</div>
            <div className="text-xs text-blue-700 mt-1">JSONL format</div>
          </div>
        </Link>

        <Link
          href="/dashboard/fine-tuning/datasets/convert"
          className="flex flex-col items-center justify-center p-6 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
        >
          <ArrowPathIcon className="h-8 w-8 text-purple-600 mb-2" />
          <div className="text-center">
            <div className="text-purple-900 font-semibold">Convert Data</div>
            <div className="text-xs text-purple-700 mt-1">CSV/JSON to JSONL</div>
          </div>
        </Link>

        <Link
          href="/dashboard/fine-tuning/datasets?import=true"
          className="flex flex-col items-center justify-center p-6 bg-indigo-50 border-2 border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
        >
          <ChatBubbleLeftRightIcon className="h-8 w-8 text-indigo-600 mb-2" />
          <div className="text-center">
            <div className="text-indigo-900 font-semibold">Import Conversations</div>
            <div className="text-xs text-indigo-700 mt-1">Use chat history</div>
          </div>
        </Link>

        <Link
          href="/dashboard/fine-tuning/jobs/new"
          className="flex flex-col items-center justify-center p-6 bg-green-50 border-2 border-green-200 rounded-lg hover:bg-green-100 transition-colors"
        >
          <CpuChipIcon className="h-8 w-8 text-green-600 mb-2" />
          <div className="text-center">
            <div className="text-green-900 font-semibold">Start Training</div>
            <div className="text-xs text-green-700 mt-1">Fine-tune model</div>
          </div>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Datasets Card */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Training Datasets</h3>
              <p className="text-xs text-gray-500">Labeled examples</p>
            </div>
            <FolderIcon className="h-8 w-8 text-blue-500" />
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {dashboardStats.datasets.total}
              </div>
              <div className="text-sm text-gray-600">
                {dashboardStats.datasets.validated} validated for training
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard/fine-tuning/datasets"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all datasets →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Jobs Card */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Training Jobs</h3>
            <CpuChipIcon className="h-8 w-8 text-green-500" />
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {dashboardStats.jobs.total}
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex justify-between">
                  <span>Running:</span>
                  <span className="font-semibold text-yellow-600">
                    {dashboardStats.jobs.running}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-semibold text-green-600">
                    {dashboardStats.jobs.completed}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Failed:</span>
                  <span className="font-semibold text-red-600">
                    {dashboardStats.jobs.failed}
                  </span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard/fine-tuning/jobs"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all jobs →
                </Link>
              </div>
            </>
          )}
        </div>

        {/* Models Card */}
        <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Fine-Tuned Models</h3>
            <ChartBarIcon className="h-8 w-8 text-purple-500" />
          </div>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {dashboardStats.models.total}
              </div>
              <div className="text-sm text-gray-600">
                {dashboardStats.models.deployed} deployed • {dashboardStats.models.active} active
              </div>
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link
                  href="/dashboard/fine-tuning/models"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  View all models →
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Training Jobs</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex space-x-4">
                  <div className="h-12 w-12 bg-gray-200 rounded"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : jobs && jobs.length > 0 ? (
            jobs.slice(0, 5).map((job: any) => (
              <Link
                key={job.id}
                href={`/dashboard/fine-tuning/jobs/${job.id}`}
                className="p-6 hover:bg-gray-50 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center space-x-4">
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
                  <div>
                    <h4 className="font-semibold text-gray-900">{job.name}</h4>
                    <p className="text-sm text-gray-600">
                      {job.baseModel} • {job.dataset?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'succeeded'
                        ? 'bg-green-100 text-green-800'
                        : job.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : job.status === 'running'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {job.status}
                  </span>
                  {job.status === 'running' && (
                    <p className="text-sm text-gray-600 mt-1">{job.progressPercentage}%</p>
                  )}
                </div>
              </Link>
            ))
          ) : (
            <div className="p-12 text-center">
              <CpuChipIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No training jobs yet</h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first fine-tuning job
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
      </div>
    </div>
  );
}
