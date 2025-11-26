'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircleIcon, XCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import { useConversionProgress } from '@/hooks/useConversionProgress';

interface ConversionProgressModalProps {
  jobId: string;
  onClose: () => void;
}

export default function ConversionProgressModal({ jobId, onClose }: ConversionProgressModalProps) {
  const router = useRouter();
  const { progress, isCompleted, datasetId, error, isConnected } = useConversionProgress(jobId);

  const handleViewDataset = () => {
    if (datasetId) {
      router.push(`/dashboard/fine-tuning/datasets/${datasetId}`);
      onClose();
    }
  };

  const handleClose = () => {
    if (isCompleted || error) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleClose} />

        <div className="inline-block overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="px-4 pt-5 pb-4 bg-white sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">
                    Converting Data
                  </h3>
                  {!isConnected && !isCompleted && !error && (
                    <span className="px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded">
                      Connecting...
                    </span>
                  )}
                </div>

                {/* Progress Content */}
                {error ? (
                  // Error State
                  <div className="text-center">
                    <XCircleIcon className="w-16 h-16 mx-auto mb-4 text-red-500" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Conversion Failed</h4>
                    <p className="text-sm text-gray-600 mb-4">{error}</p>
                  </div>
                ) : isCompleted ? (
                  // Completed State
                  <div className="text-center">
                    <CheckCircleIcon className="w-16 h-16 mx-auto mb-4 text-green-500" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Conversion Complete!</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Your dataset has been created successfully.
                    </p>
                  </div>
                ) : (
                  // In Progress State
                  <>
                    {/* Status Message */}
                    <div className="mb-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />
                        <span className="text-sm font-medium text-gray-700">
                          {progress?.status === 'analyzing' ? 'Analyzing data...' : 'Converting rows...'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {progress?.message || 'Starting conversion...'}
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          Progress
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          {progress?.percentage || 0}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                          style={{ width: `${progress?.percentage || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Row Counter */}
                    {progress && progress.totalRows > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>
                          Row {progress.currentRow} of {progress.totalRows}
                        </span>
                        <span>
                          {progress.totalRows - progress.currentRow} remaining
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse">
            {isCompleted && datasetId ? (
              <>
                <button
                  type="button"
                  onClick={handleViewDataset}
                  className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  View Dataset
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex justify-center w-full px-4 py-2 mt-3 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
                >
                  Close
                </button>
              </>
            ) : error ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex justify-center w-full px-4 py-2 text-base font-medium text-white bg-red-600 border border-transparent rounded-md shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
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
