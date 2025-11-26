'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useJobProgress } from '@/hooks/useJobProgress';

interface JobProgressModalProps {
  jobId: string;
  onClose: () => void;
  onComplete?: (result: any) => void;
}

export default function JobProgressModal({ jobId, onClose, onComplete }: JobProgressModalProps) {
  const router = useRouter();
  const { job, isConnected, isCompleted, isFailed, isActive, isPending, progress, result, error } = useJobProgress(jobId);

  React.useEffect(() => {
    if (isCompleted && result && onComplete) {
      onComplete(result);
    }
  }, [isCompleted, result, onComplete]);

  const handleClose = () => {
    if (isCompleted || isFailed) {
      onClose();
    }
  };

  const getStatusIcon = () => {
    if (isFailed) return <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />;
    if (isCompleted) return <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />;
    if (isPending) return <ClockIcon className="w-16 h-16 mx-auto mb-4 text-gray-400 animate-pulse" />;
    return <ArrowPathIcon className="w-16 h-16 mx-auto mb-4 text-blue-500 animate-spin" />;
  };

  const getStatusText = () => {
    if (isFailed) return 'Job Failed';
    if (isCompleted) return 'Job Completed!';
    if (isPending) return 'Job Queued';
    if (isActive) return 'Processing...';
    return 'Starting...';
  };

  const getStatusColor = () => {
    if (isFailed) return 'text-red-600';
    if (isCompleted) return 'text-green-600';
    if (isPending) return 'text-gray-600';
    return 'text-blue-600';
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="flex-1 w-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    {job?.name || 'Background Job'}
                  </h3>
                  {!isConnected && !isCompleted && !isFailed && (
                    <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                      Connecting...
                    </span>
                  )}
                </div>

                {/* Job Description */}
                {job?.description && (
                  <p className="text-sm text-gray-600 mb-4">{job.description}</p>
                )}

                {/* Progress Content */}
                <div className="text-center">
                  {getStatusIcon()}
                  <h4 className={`text-xl font-semibold mb-2 ${getStatusColor()}`}>
                    {getStatusText()}
                  </h4>

                  {/* Error Message */}
                  {error && (
                    <div className="mt-4 text-left">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-sm text-red-900 font-semibold mb-1">Error Details:</p>
                        <p className="text-sm text-red-800">{error.message || 'An unknown error occurred'}</p>
                      </div>
                    </div>
                  )}

                  {/* Success Result */}
                  {isCompleted && result && (
                    <div className="mt-4 text-left">
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <p className="text-sm text-green-900">
                          {result.message || 'Job completed successfully!'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Progress Bar and Message */}
                  {(isActive || isPending) && (
                    <>
                      {progress?.message && (
                        <p className="text-sm text-gray-600 mb-4">
                          {progress.message}
                        </p>
                      )}

                      {progress && (
                        <>
                          {/* Progress Bar */}
                          <div className="mb-4">
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">
                                Progress
                              </span>
                              <span className="text-sm font-medium text-gray-700">
                                {progress.percentage}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                                style={{ width: `${progress.percentage}%` }}
                              />
                            </div>
                          </div>

                          {/* Item Counter */}
                          {progress.total > 0 && (
                            <div className="flex justify-between text-sm text-gray-600">
                              <span>
                                Item {progress.current} of {progress.total}
                              </span>
                              <span>
                                {progress.total - progress.current} remaining
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}

                  {/* Job Metadata */}
                  {job && (
                    <div className="mt-6 text-left bg-gray-50 rounded-lg p-3">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Job Type:</span>
                          <p className="font-medium text-gray-900">{job.type}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Status:</span>
                          <p className="font-medium text-gray-900 capitalize">{job.status}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Started:</span>
                          <p className="font-medium text-gray-900">
                            {job.startedAt ? new Date(job.startedAt).toLocaleTimeString() : '-'}
                          </p>
                        </div>
                        <div>
                          <span className="text-gray-500">Duration:</span>
                          <p className="font-medium text-gray-900">
                            {job.startedAt && job.completedAt
                              ? `${Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 1000)}s`
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
            {isCompleted || isFailed ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-gray-400 bg-gray-200 border border-transparent rounded-md shadow-sm cursor-not-allowed sm:ml-3 sm:w-auto sm:text-sm"
              >
                Processing...
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
