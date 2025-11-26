// Step 4: Preview Conversion Examples

import { ConversionPreview } from './types';

interface StepPreviewProps {
  preview: ConversionPreview;
  loading: boolean;
  onNext: () => void;
  onBack: () => void;
}

export function StepPreview({ preview, loading, onNext, onBack }: StepPreviewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold mb-2">Generating Preview...</h2>
          <p className="text-gray-600">
            Creating example conversions from your data
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Analyzing and generating examples...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Preview Conversion</h2>
        <p className="text-gray-600">
          Review example conversions before processing all data
        </p>
      </div>

      {/* Estimate Banner */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">📊 Estimated Output</h3>
            <p className="text-sm text-gray-600 mt-1">
              Approximately <span className="font-bold text-blue-600">{preview.estimatedTotal}</span> training examples
              will be generated from <span className="font-bold">{preview.analysis.totalRows}</span> rows
            </p>
          </div>
          {preview.estimatedTotal > preview.analysis.totalRows && (
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((preview.estimatedTotal / preview.analysis.totalRows) * 10) / 10}x
              </div>
              <div className="text-xs text-gray-600">multiplier</div>
            </div>
          )}
        </div>
      </div>

      {/* Examples */}
      <div className="space-y-4">
        <h3 className="font-semibold">Preview Examples ({preview.examples.length} shown)</h3>
        
        {preview.examples.map((example, index) => (
          <div key={index} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-2 border-b">
              <span className="font-medium text-sm">Example {index + 1} of {preview.examples.length}</span>
            </div>
            <div className="p-4 space-y-3">
              {example.messages.map((message, msgIndex) => (
                <div
                  key={msgIndex}
                  className={`rounded-lg p-3 ${
                    message.role === 'system'
                      ? 'bg-gray-100'
                      : message.role === 'user'
                      ? 'bg-blue-50'
                      : 'bg-green-50'
                  }`}
                >
                  <div className="flex items-center space-x-2 mb-1">
                    {message.role === 'system' && <span className="text-lg">⚙️</span>}
                    {message.role === 'user' && <span className="text-lg">👤</span>}
                    {message.role === 'assistant' && <span className="text-lg">🤖</span>}
                    <span className="text-xs font-semibold uppercase text-gray-600">
                      {message.role}
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{message.content}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex space-x-3">
          <span className="text-2xl">💡</span>
          <div className="flex-1">
            <h4 className="font-semibold text-yellow-900 mb-1">About These Examples</h4>
            <p className="text-sm text-yellow-800">
              These are preview examples from your first 5 rows. The actual conversion will process 
              all {preview.analysis.totalRows} rows and generate approximately {preview.estimatedTotal} training examples.
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          ← Back to Configuration
        </button>
        <button
          onClick={onNext}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Convert All Data →
        </button>
      </div>
    </div>
  );
}
