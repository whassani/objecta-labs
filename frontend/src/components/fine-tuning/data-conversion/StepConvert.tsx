// Step 5: Convert Data and Create Dataset

import { useState } from 'react';

interface StepConvertProps {
  onConversionComplete: (dataset: any) => void;
  onBack: () => void;
  defaultName?: string;
}

export function StepConvert({ onConversionComplete, onBack, defaultName }: StepConvertProps) {
  const [name, setName] = useState(defaultName || '');
  const [description, setDescription] = useState('');
  const [converting, setConverting] = useState(false);

  const handleConvert = () => {
    if (!name.trim()) {
      return;
    }
    setConverting(true);
    // Parent component will handle actual conversion
    // This is just the UI state
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create Dataset</h2>
        <p className="text-gray-600">
          Name your dataset and start the conversion
        </p>
      </div>

      {/* Dataset Info Form */}
      {!converting ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dataset Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Customer Support Training Data"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the purpose of this dataset..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✓ Your data will be converted to JSONL format</li>
              <li>✓ A new dataset will be created</li>
              <li>✓ You can immediately use it for fine-tuning</li>
              <li>✓ The original file structure is preserved in metadata</li>
            </ul>
          </div>

          {/* Navigation */}
          <div className="flex justify-between">
            <button
              onClick={onBack}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              ← Back to Preview
            </button>
            <button
              onClick={handleConvert}
              disabled={!name.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert & Create Dataset
            </button>
          </div>
        </div>
      ) : (
        /* Converting State */
        <div className="py-12">
          <div className="text-center space-y-6">
            {/* Spinner */}
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
            
            {/* Status */}
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Converting Your Data...
              </h3>
              <p className="text-gray-600">
                This may take a few moments depending on the size of your dataset
              </p>
            </div>

            {/* Progress Bar (Indeterminate) */}
            <div className="max-w-md mx-auto">
              <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-blue-600 h-full animate-pulse"></div>
              </div>
            </div>

            {/* Processing Steps */}
            <div className="max-w-md mx-auto text-left space-y-2 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xs">✓</span>
                </div>
                <span>Parsing data file</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-blue-500 animate-pulse"></div>
                <span>Generating training examples</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded-full bg-gray-300"></div>
                <span>Creating dataset</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
