// Step 1: Upload and Analyze File

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { DataAnalysis } from './types';

interface StepUploadProps {
  onAnalysisComplete: (file: File, analysis: DataAnalysis) => void;
  analyzeData: (file: File) => Promise<DataAnalysis | null>;
  loading: boolean;
  error: string | null;
}

export function StepUpload({ onAnalysisComplete, analyzeData, loading, error }: StepUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [analyzing, setAnalyzing] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const uploadedFile = acceptedFiles[0];
      setFile(uploadedFile);
      setAnalyzing(true);

      const analysis = await analyzeData(uploadedFile);
      
      setAnalyzing(false);

      if (analysis) {
        onAnalysisComplete(uploadedFile, analysis);
      }
    }
  }, [analyzeData, onAnalysisComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json', '.jsonl'],
      'application/x-ndjson': ['.ndjson'],
    },
    maxFiles: 1,
    disabled: analyzing || loading,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upload Your Data</h2>
        <p className="text-gray-600">
          Upload a CSV, JSON, or JSONL file to convert it to fine-tuning format
        </p>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
          transition-colors duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${(analyzing || loading) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          {/* Upload Icon */}
          <div className="flex justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>

          {file ? (
            <div>
              <p className="text-lg font-medium text-gray-900">{file.name}</p>
              <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(2)} KB</p>
            </div>
          ) : (
            <>
              <p className="text-lg text-gray-700">
                {isDragActive ? 'Drop file here' : 'Drag and drop file here, or click to browse'}
              </p>
              <p className="text-sm text-gray-500">
                Supported formats: CSV, JSON, JSONL
              </p>
            </>
          )}
        </div>
      </div>

      {/* Analyzing Status */}
      {analyzing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <span className="text-blue-900">Analyzing your data...</span>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-900">{error}</p>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold mb-2">What happens next?</h3>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>✓ Format will be auto-detected (CSV, JSON, or JSONL)</li>
          <li>✓ Columns will be analyzed for type and suggestions</li>
          <li>✓ Best template will be recommended</li>
          <li>✓ You'll preview examples before converting</li>
        </ul>
      </div>
    </div>
  );
}
