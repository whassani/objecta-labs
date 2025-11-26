'use client';

import React, { useState, useEffect } from 'react';
import { useAllJobs } from '@/hooks/useJobProgress';
import { api } from '@/lib/api';
import JobProgressModal from '@/components/jobs/JobProgressModal';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

interface JobStats {
  total: number;
  pending: number;
  active: number;
  completed: number;
  failed: number;
  cancelled: number;
}

export default function JobsPage() {
  const [stats, setStats] = useState<JobStats | null>(null);
  const [allJobs, setAllJobs] = useState<any[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { jobs: liveJobs, isConnected } = useAllJobs();

  // Load initial jobs and stats
  useEffect(() => {
    loadJobs();
    loadStats();
  }, []);

  // Update jobs with live updates
  useEffect(() => {
    if (liveJobs.length > 0) {
      setAllJobs(prevJobs => {
        const updatedJobs = [...prevJobs];
        liveJobs.forEach(liveJob => {
          const index = updatedJobs.findIndex(j => j.id === liveJob.id);
          if (index >= 0) {
            updatedJobs[index] = liveJob;
          } else {
            updatedJobs.unshift(liveJob);
          }
        });
        return updatedJobs;
      });
    }
  }, [liveJobs]);

  // Apply filters
  useEffect(() => {
    let filtered = allJobs;

    if (filterStatus !== 'all') {
      filtered = filtered.filter(job => job.status === filterStatus);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(job => job.type === filterType);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(job =>
        job.name.toLowerCase().includes(query) ||
        job.description?.toLowerCase().includes(query) ||
        job.type.toLowerCase().includes(query)
      );
    }

    setFilteredJobs(filtered);
  }, [allJobs, filterStatus, filterType, searchQuery]);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const response = await api.get('/jobs');
      setAllJobs(response.data?.jobs || []);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await api.get('/jobs/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to cancel this job?')) return;

    try {
      await api.patch(`/jobs/${jobId}/cancel`);
      loadJobs();
      loadStats();
    } catch (error) {
      console.error('Failed to cancel job:', error);
      alert('Failed to cancel job');
    }
  };

  const handleRetryJob = async (jobId: string) => {
    try {
      await api.post(`/jobs/${jobId}/retry`);
      loadJobs();
      loadStats();
    } catch (error) {
      console.error('Failed to retry job:', error);
      alert('Failed to retry job');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      case 'active':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'active':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'data-conversion':
        return 'bg-purple-100 text-purple-800';
      case 'fine-tuning':
        return 'bg-indigo-100 text-indigo-800';
      case 'workflow-execution':
        return 'bg-cyan-100 text-cyan-800';
      case 'document-processing':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (startedAt?: string, completedAt?: string) => {
    if (!startedAt) return '-';
    const start = new Date(startedAt).getTime();
    const end = completedAt ? new Date(completedAt).getTime() : Date.now();
    const duration = Math.round((end - start) / 1000);
    
    if (duration < 60) return `${duration}s`;
    if (duration < 3600) return `${Math.floor(duration / 60)}m ${duration % 60}s`;
    return `${Math.floor(duration / 3600)}h ${Math.floor((duration % 3600) / 60)}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Background Jobs</h1>
              <p className="mt-2 text-sm text-gray-600">
                Monitor and manage all background jobs across the platform
              </p>
            </div>
            <div className="flex items-center space-x-2">
              {isConnected ? (
                <span className="flex items-center px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                  <span className="w-2 h-2 mr-2 bg-green-500 rounded-full animate-pulse"></span>
                  Live
                </span>
              ) : (
                <span className="flex items-center px-3 py-1 text-sm font-medium text-gray-600 bg-gray-100 rounded-full">
                  <span className="w-2 h-2 mr-2 bg-gray-400 rounded-full"></span>
                  Connecting...
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-600">Total</div>
              <div className="mt-2 text-2xl font-semibold text-gray-900">{stats.total}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-gray-600">Pending</div>
              <div className="mt-2 text-2xl font-semibold text-gray-600">{stats.pending}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-blue-600">Active</div>
              <div className="mt-2 text-2xl font-semibold text-blue-600">{stats.active}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-green-600">Completed</div>
              <div className="mt-2 text-2xl font-semibold text-green-600">{stats.completed}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-red-600">Failed</div>
              <div className="mt-2 text-2xl font-semibold text-red-600">{stats.failed}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <div className="text-sm font-medium text-yellow-600">Cancelled</div>
              <div className="mt-2 text-2xl font-semibold text-yellow-600">{stats.cancelled}</div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow mb-6 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="data-conversion">Data Conversion</option>
                <option value="fine-tuning">Fine-Tuning</option>
                <option value="workflow-execution">Workflow Execution</option>
                <option value="document-processing">Document Processing</option>
              </select>
            </div>
          </div>
        </div>

        {/* Jobs List */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <ArrowPathIcon className="w-8 h-8 mx-auto text-gray-400 animate-spin mb-4" />
              <p className="text-gray-600">Loading jobs...</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No jobs found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {getStatusIcon(job.status)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{job.name}</div>
                            {job.description && (
                              <div className="text-sm text-gray-500">{job.description}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(job.type)}`}>
                          {job.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {job.progress ? (
                          <div className="w-full">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>{job.progress.percentage}%</span>
                              <span>{job.progress.current}/{job.progress.total}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${job.progress.percentage}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-500">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDuration(job.startedAt, job.completedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(job.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => setSelectedJobId(job.id)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </button>
                        {job.status === 'active' || job.status === 'pending' ? (
                          <button
                            onClick={() => handleCancelJob(job.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Cancel
                          </button>
                        ) : job.status === 'failed' ? (
                          <button
                            onClick={() => handleRetryJob(job.id)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Retry
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Job Progress Modal */}
      {selectedJobId && (
        <JobProgressModal
          jobId={selectedJobId}
          onClose={() => {
            setSelectedJobId(null);
            loadJobs();
            loadStats();
          }}
        />
      )}
    </div>
  );
}
