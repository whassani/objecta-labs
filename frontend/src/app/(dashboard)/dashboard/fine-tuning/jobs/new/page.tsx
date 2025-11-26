'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

const STEPS = [
  { id: 1, name: 'Select Dataset', description: 'Choose training data' },
  { id: 2, name: 'Configure Model', description: 'Select base model and parameters' },
  { id: 3, name: 'Review & Launch', description: 'Review settings and estimate cost' },
];

export default function CreateJobPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    datasetId: '',
    baseModel: 'gpt-3.5-turbo-1106',
    provider: 'openai',
    hyperparameters: {
      n_epochs: 3,
      batch_size: 4,
      learning_rate_multiplier: 1.0,
    },
  });

  // Fetch datasets
  const { data: datasets } = useQuery({
    queryKey: ['fine-tuning', 'datasets'],
    queryFn: () => api.get('/fine-tuning/datasets').then((res) => res.data),
  });

  // Cost estimation
  const { data: costEstimate, isLoading: loadingCost } = useQuery({
    queryKey: ['fine-tuning', 'cost-estimate', formData.datasetId, formData.baseModel, formData.hyperparameters.n_epochs],
    queryFn: () =>
      api.post('/fine-tuning/jobs/estimate-cost', {
        datasetId: formData.datasetId,
        baseModel: formData.baseModel,
        epochs: formData.hyperparameters.n_epochs,
      }).then((res) => res.data),
    enabled: !!formData.datasetId && currentStep === 3,
  });

  // Create job mutation
  const createJobMutation = useMutation({
    mutationFn: (data: any) => api.post('/fine-tuning/jobs', data),
    onSuccess: (response) => {
      router.push(`/dashboard/fine-tuning/jobs/${response.data.id}`);
    },
  });

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    createJobMutation.mutate(formData);
  };

  const validatedDatasets = datasets?.filter((d: any) => d.validated);
  const selectedDataset = datasets?.find((d: any) => d.id === formData.datasetId);

  const canProceed = () => {
    if (currentStep === 1) return !!formData.datasetId;
    if (currentStep === 2) return !!formData.name && !!formData.baseModel;
    return true;
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Create Fine-Tuning Job</h1>
        <p className="text-gray-600">
          Configure and launch a new training job for your custom AI model
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {STEPS.map((step, stepIdx) => (
              <li
                key={step.id}
                className={`relative ${stepIdx !== STEPS.length - 1 ? 'pr-8 sm:pr-20 flex-1' : ''}`}
              >
                {step.id < currentStep ? (
                  <div className="flex items-center">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-green-600">
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{step.name}</p>
                    </div>
                    {stepIdx !== STEPS.length - 1 && (
                      <div className="absolute top-4 left-8 -ml-px mt-0.5 h-0.5 w-full bg-green-600" />
                    )}
                  </div>
                ) : step.id === currentStep ? (
                  <div className="flex items-center">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-blue-600 bg-white">
                      <span className="text-blue-600 font-semibold">{step.id}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600">{step.name}</p>
                    </div>
                    {stepIdx !== STEPS.length - 1 && (
                      <div className="absolute top-4 left-8 -ml-px mt-0.5 h-0.5 w-full bg-gray-300" />
                    )}
                  </div>
                ) : (
                  <div className="flex items-center">
                    <div className="relative flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white">
                      <span className="text-gray-500">{step.id}</span>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-500">{step.name}</p>
                    </div>
                    {stepIdx !== STEPS.length - 1 && (
                      <div className="absolute top-4 left-8 -ml-px mt-0.5 h-0.5 w-full bg-gray-300" />
                    )}
                  </div>
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6 mb-6">
        {currentStep === 1 && (
          <Step1SelectDataset
            datasets={validatedDatasets}
            selectedDatasetId={formData.datasetId}
            onSelect={(id) => setFormData({ ...formData, datasetId: id })}
          />
        )}

        {currentStep === 2 && (
          <Step2ConfigureModel
            formData={formData}
            onChange={(updates) => setFormData({ ...formData, ...updates })}
          />
        )}

        {currentStep === 3 && (
          <Step3Review
            formData={formData}
            dataset={selectedDataset}
            costEstimate={costEstimate}
            loading={loadingCost}
          />
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <button
          onClick={handleBack}
          disabled={currentStep === 1}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeftIcon className="h-5 w-5 mr-2" />
          Back
        </button>

        {currentStep < STEPS.length ? (
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
            <ChevronRightIcon className="h-5 w-5 ml-2" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={createJobMutation.isPending}
            className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
          >
            {createJobMutation.isPending ? 'Creating...' : 'Launch Training Job'}
          </button>
        )}
      </div>
    </div>
  );
}

// Step 1: Select Dataset
function Step1SelectDataset({ datasets, selectedDatasetId, onSelect }: any) {
  if (!datasets || datasets.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 mb-4">No validated datasets available.</p>
        <a
          href="/dashboard/fine-tuning/datasets/new"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          Upload a dataset first →
        </a>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Select Training Dataset</h2>
      <p className="text-gray-600 mb-6">
        Choose a validated dataset to use for fine-tuning your model
      </p>

      <div className="space-y-3">
        {datasets.map((dataset: any) => (
          <div
            key={dataset.id}
            onClick={() => onSelect(dataset.id)}
            className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
              selectedDatasetId === dataset.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900">{dataset.name}</h3>
                {dataset.description && (
                  <p className="text-sm text-gray-600 mt-1">{dataset.description}</p>
                )}
                <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                  <span>{dataset.totalExamples.toLocaleString()} examples</span>
                  <span>•</span>
                  <span>{dataset.format.toUpperCase()}</span>
                  {dataset.source && (
                    <>
                      <span>•</span>
                      <span className="capitalize">{dataset.source}</span>
                    </>
                  )}
                </div>
              </div>
              {selectedDatasetId === dataset.id && (
                <CheckCircleIcon className="h-6 w-6 text-blue-600" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Step 2: Configure Model (continued in next file due to size)
function Step2ConfigureModel({ formData, onChange }: any) {
  const availableModels = [
    { id: 'gpt-3.5-turbo-1106', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
    { id: 'gpt-3.5-turbo-0613', name: 'GPT-3.5 Turbo (Legacy)', description: 'Previous version' },
    { id: 'gpt-4-0613', name: 'GPT-4', description: 'Most capable, higher cost' },
  ];

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Configure Model Settings</h2>
      
      <div className="space-y-6">
        {/* Job Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onChange({ name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="My Fine-Tuning Job"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => onChange({ description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe the purpose of this training job..."
          />
        </div>

        {/* Base Model */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Model *
          </label>
          <div className="space-y-2">
            {availableModels.map((model) => (
              <div
                key={model.id}
                onClick={() => onChange({ baseModel: model.id })}
                className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.baseModel === model.id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="font-semibold text-gray-900">{model.name}</h4>
                    <p className="text-sm text-gray-600">{model.description}</p>
                  </div>
                  {formData.baseModel === model.id && (
                    <CheckCircleIcon className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hyperparameters */}
        <div>
          <h3 className="text-lg font-semibold mb-3">Hyperparameters</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Epochs: {formData.hyperparameters.n_epochs}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={formData.hyperparameters.n_epochs}
                onChange={(e) =>
                  onChange({
                    hyperparameters: {
                      ...formData.hyperparameters,
                      n_epochs: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                More epochs = better training but higher cost
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Learning Rate Multiplier: {formData.hyperparameters.learning_rate_multiplier}
              </label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.1"
                value={formData.hyperparameters.learning_rate_multiplier}
                onChange={(e) =>
                  onChange({
                    hyperparameters: {
                      ...formData.hyperparameters,
                      learning_rate_multiplier: parseFloat(e.target.value),
                    },
                  })
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Controls how quickly the model learns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step 3: Review
function Step3Review({ formData, dataset, costEstimate, loading }: any) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Review & Launch</h2>
      
      <div className="space-y-6">
        {/* Job Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3">Job Configuration</h3>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-gray-600">Job Name:</dt>
              <dd className="font-medium text-gray-900">{formData.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Base Model:</dt>
              <dd className="font-medium text-gray-900">{formData.baseModel}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Dataset:</dt>
              <dd className="font-medium text-gray-900">{dataset?.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Training Examples:</dt>
              <dd className="font-medium text-gray-900">
                {dataset?.totalExamples.toLocaleString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-gray-600">Epochs:</dt>
              <dd className="font-medium text-gray-900">{formData.hyperparameters.n_epochs}</dd>
            </div>
          </dl>
        </div>

        {/* Cost Estimate */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold mb-3 text-blue-900">Cost Estimate</h3>
          {loading ? (
            <p className="text-sm text-blue-800">Calculating cost...</p>
          ) : costEstimate ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-800">Estimated Cost:</span>
                <span className="font-bold text-blue-900 text-lg">
                  ${costEstimate.estimatedCostUsd.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>Training Tokens:</span>
                <span>{costEstimate.trainingTokens.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-blue-700">
                <span>Validation Tokens:</span>
                <span>{costEstimate.validationTokens.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-blue-800">Unable to estimate cost</p>
          )}
        </div>

        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> Training can take several hours to complete. You'll receive
            notifications about the job status. The actual cost may vary slightly from the estimate.
          </p>
        </div>
      </div>
    </div>
  );
}
