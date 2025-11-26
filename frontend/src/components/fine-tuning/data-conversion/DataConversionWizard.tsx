// Main Data Conversion Wizard Component

'use client';

import { useState } from 'react';
import { useDataConversion } from './useDataConversion';
import { StepUpload } from './StepUpload';
import { StepAnalysis } from './StepAnalysis';
import { StepConfigure } from './StepConfigure';
import { StepPreview } from './StepPreview';
import { StepConvert } from './StepConvert';
import { StepComplete } from './StepComplete';
import ConversionProgressModal from './ConversionProgressModal';
import {
  WizardStep,
  DataAnalysis,
  ConversionOptions,
  ConversionPreview,
} from './types';

export function DataConversionWizard() {
  // State
  const [currentStep, setCurrentStep] = useState<WizardStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<DataAnalysis | null>(null);
  const [options, setOptions] = useState<ConversionOptions | null>(null);
  const [preview, setPreview] = useState<ConversionPreview | null>(null);
  const [dataset, setDataset] = useState<any>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [conversionJobId, setConversionJobId] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Hooks
  const {
    loading,
    error,
    analyzeData,
    previewConversion,
    convertData,
    getTemplates,
    getSupportedFormats,
  } = useDataConversion();

  // Step handlers
  const handleAnalysisComplete = (uploadedFile: File, analysisResult: DataAnalysis) => {
    setFile(uploadedFile);
    setAnalysis(analysisResult);
    setCurrentStep('analyze');
  };

  const handleConfigureNext = async (conversionOptions: ConversionOptions) => {
    if (!file || !analysis) return;

    setOptions(conversionOptions);
    setCurrentStep('preview');
    setPreviewLoading(true);

    // Generate preview
    const previewResult = await previewConversion(file, conversionOptions);
    setPreviewLoading(false);

    if (previewResult) {
      setPreview(previewResult);
    }
  };

  const handlePreviewNext = () => {
    setCurrentStep('convert');
  };

  const handleConvert = async (name: string, description: string) => {
    if (!file || !options) return;

    const result = await convertData(file, name, description, options);

    if (result && result.jobId) {
      // Background job started - show progress modal
      setConversionJobId(result.jobId);
      setShowProgressModal(true);
    } else if (result) {
      // Immediate result (guided mode fallback)
      setDataset(result);
      setCurrentStep('complete');
    }
  };

  const handleCloseProgressModal = () => {
    setShowProgressModal(false);
    setConversionJobId(null);
    // Move to complete step
    setCurrentStep('complete');
  };

  const handleReset = () => {
    setCurrentStep('upload');
    setFile(null);
    setAnalysis(null);
    setOptions(null);
    setPreview(null);
    setDataset(null);
  };

  // Progress calculation
  const steps: WizardStep[] = ['upload', 'analyze', 'configure', 'preview', 'convert', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Data Conversion Wizard
          </h1>
          <p className="text-gray-600">
            Convert your CSV, JSON, or JSONL data to fine-tuning format
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Step Indicators */}
          <div className="flex justify-between mt-4">
            {[
              { step: 'upload', label: 'Upload', icon: '📤' },
              { step: 'analyze', label: 'Analyze', icon: '🔍' },
              { step: 'configure', label: 'Configure', icon: '⚙️' },
              { step: 'preview', label: 'Preview', icon: '👁️' },
              { step: 'convert', label: 'Convert', icon: '🔄' },
              { step: 'complete', label: 'Complete', icon: '✅' },
            ].map(({ step, label, icon }, index) => (
              <div
                key={step}
                className={`flex flex-col items-center ${
                  index <= currentStepIndex ? 'text-blue-600' : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-lg mb-1 ${
                    index <= currentStepIndex
                      ? 'bg-blue-100'
                      : 'bg-gray-100'
                  }`}
                >
                  {icon}
                </div>
                <span className="text-xs font-medium hidden sm:block">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Content Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 min-h-[500px]">
          {/* Step 1: Upload */}
          {currentStep === 'upload' && (
            <StepUpload
              onAnalysisComplete={handleAnalysisComplete}
              analyzeData={analyzeData}
              loading={loading}
              error={error}
            />
          )}

          {/* Step 2: Analysis */}
          {currentStep === 'analyze' && analysis && (
            <StepAnalysis
              analysis={analysis}
              onNext={() => setCurrentStep('configure')}
            />
          )}

          {/* Step 3: Configure */}
          {currentStep === 'configure' && analysis && (
            <StepConfigure
              analysis={analysis}
              onNext={handleConfigureNext}
              onBack={() => setCurrentStep('analyze')}
              getTemplates={getTemplates}
            />
          )}

          {/* Step 4: Preview */}
          {currentStep === 'preview' && preview && (
            <StepPreview
              preview={preview}
              loading={previewLoading}
              onNext={handlePreviewNext}
              onBack={() => setCurrentStep('configure')}
            />
          )}

          {/* Step 5: Convert */}
          {currentStep === 'convert' && (
            <ConvertStep
              file={file}
              options={options}
              onConversionComplete={(result) => {
                setDataset(result);
                setCurrentStep('complete');
              }}
              onBack={() => setCurrentStep('preview')}
              convertData={convertData}
              loading={loading}
              error={error}
            />
          )}

          {/* Step 6: Complete */}
          {currentStep === 'complete' && dataset && (
            <StepComplete
              dataset={dataset}
              onReset={handleReset}
            />
          )}

          {/* Error Display */}
          {error && currentStep !== 'upload' && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-900">{error}</p>
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need help? Check out our{' '}
            <a href="/docs/data-conversion" className="text-blue-600 hover:underline">
              documentation
            </a>{' '}
            or{' '}
            <a href="/support" className="text-blue-600 hover:underline">
              contact support
            </a>
          </p>
        </div>

        {/* Progress Modal */}
        {showProgressModal && conversionJobId && (
          <ConversionProgressModal
            jobId={conversionJobId}
            onClose={handleCloseProgressModal}
          />
        )}
      </div>
    </div>
  );
}

// Convert Step Component (combines form and conversion logic)
function ConvertStep({
  file,
  options,
  onConversionComplete,
  onBack,
  convertData,
  loading,
  error,
}: {
  file: File | null;
  options: ConversionOptions | null;
  onConversionComplete: (dataset: any) => void;
  onBack: () => void;
  convertData: (file: File, name: string, description: string, options: ConversionOptions) => Promise<any>;
  loading: boolean;
  error: string | null;
}) {
  const [name, setName] = useState(file?.name.replace(/\.(csv|json|jsonl)$/i, '') || '');
  const [description, setDescription] = useState('');
  const [converting, setConverting] = useState(false);

  const handleConvert = async () => {
    if (!file || !options || !name.trim()) return;

    setConverting(true);
    const result = await convertData(file, name, description, options);
    
    if (result) {
      onConversionComplete(result);
    } else {
      setConverting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Create Dataset</h2>
        <p className="text-gray-600">
          Name your dataset and start the conversion
        </p>
      </div>

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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
            <ul className="space-y-1 text-sm text-blue-800">
              <li>✓ Your data will be converted to JSONL format</li>
              <li>✓ A new dataset will be created</li>
              <li>✓ You can immediately use it for fine-tuning</li>
            </ul>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-900">{error}</p>
            </div>
          )}

          <div className="flex justify-between">
            <button
              onClick={onBack}
              disabled={loading}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium disabled:opacity-50"
            >
              ← Back to Preview
            </button>
            <button
              onClick={handleConvert}
              disabled={!name.trim() || loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Convert & Create Dataset
            </button>
          </div>
        </div>
      ) : (
        <div className="py-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Converting Your Data...
              </h3>
              <p className="text-gray-600">
                This may take a few moments
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
