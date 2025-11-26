// Step 6: Conversion Complete

import { useRouter } from 'next/navigation';

interface StepCompleteProps {
  dataset: any;
  onReset: () => void;
}

export function StepComplete({ dataset, onReset }: StepCompleteProps) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Success Animation */}
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <svg className="w-12 h-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          ✅ Dataset Created Successfully!
        </h2>
        <p className="text-gray-600">
          Your data has been converted and is ready for fine-tuning
        </p>
      </div>

      {/* Dataset Summary */}
      <div className="bg-gradient-to-br from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Dataset Summary</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Name</div>
            <div className="font-semibold text-gray-900">{dataset.name}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600">Format</div>
            <div className="font-semibold text-gray-900">JSONL</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600">Training Examples</div>
            <div className="font-semibold text-gray-900">{dataset.totalExamples || 'Processing...'}</div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600">File Size</div>
            <div className="font-semibold text-gray-900">
              {dataset.fileSizeBytes ? `${(dataset.fileSizeBytes / 1024).toFixed(2)} KB` : 'N/A'}
            </div>
          </div>
        </div>

        {dataset.description && (
          <div className="mt-4 pt-4 border-t border-blue-200">
            <div className="text-sm text-gray-600 mb-1">Description</div>
            <div className="text-gray-900">{dataset.description}</div>
          </div>
        )}
      </div>

      {/* Next Steps */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">🚀 What's Next?</h3>
        
        <div className="space-y-3">
          <button
            onClick={() => router.push(`/dashboard/fine-tuning/datasets/${dataset.id}`)}
            className="w-full flex items-center justify-between px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <span className="font-medium">View Dataset Details</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => router.push(`/dashboard/fine-tuning/jobs/new?datasetId=${dataset.id}`)}
            className="w-full flex items-center justify-between px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span className="font-medium">Start Fine-Tuning Job</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </button>

          <button
            onClick={onReset}
            className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">Convert Another File</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>

          <button
            onClick={() => router.push('/dashboard/fine-tuning/datasets')}
            className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <span className="font-medium">Go to All Datasets</span>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-semibold mb-2">💡 Pro Tips</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• Validate your dataset before starting a fine-tuning job</li>
          <li>• You can edit or delete the dataset from the datasets page</li>
          <li>• Consider starting with a smaller epoch count for testing</li>
          <li>• Use LoRA method for faster and more efficient training</li>
        </ul>
      </div>
    </div>
  );
}
