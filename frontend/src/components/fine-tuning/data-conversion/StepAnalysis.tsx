// Step 2: Show Analysis Results

import { DataAnalysis } from './types';

interface StepAnalysisProps {
  analysis: DataAnalysis;
  onNext: () => void;
}

export function StepAnalysis({ analysis, onNext }: StepAnalysisProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Data Analysis</h2>
        <p className="text-gray-600">
          Here's what we found in your data
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-blue-600 font-medium">Format</div>
          <div className="text-2xl font-bold text-blue-900">{analysis.detectedFormat.toUpperCase()}</div>
        </div>
        
        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-green-600 font-medium">Rows</div>
          <div className="text-2xl font-bold text-green-900">{analysis.totalRows}</div>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="text-sm text-purple-600 font-medium">Columns</div>
          <div className="text-2xl font-bold text-purple-900">{analysis.totalColumns}</div>
        </div>
        
        <div className="bg-orange-50 rounded-lg p-4">
          <div className="text-sm text-orange-600 font-medium">Structure</div>
          <div className="text-2xl font-bold text-orange-900">{analysis.wasNested ? 'Nested' : 'Flat'}</div>
        </div>
      </div>

      {/* Suggestions */}
      {(analysis.suggestedKeyColumn || analysis.suggestedTargetColumn || analysis.suggestedTemplate) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-3">💡 Suggestions</h3>
          <div className="space-y-2 text-sm">
            {analysis.suggestedKeyColumn && (
              <div>
                <span className="font-medium">Key Column:</span>{' '}
                <span className="text-blue-900">{analysis.suggestedKeyColumn}</span>
              </div>
            )}
            {analysis.suggestedTargetColumn && (
              <div>
                <span className="font-medium">Target Column:</span>{' '}
                <span className="text-blue-900">{analysis.suggestedTargetColumn}</span>
              </div>
            )}
            {analysis.suggestedTemplate && (
              <div>
                <span className="font-medium">Recommended Template:</span>{' '}
                <span className="text-blue-900">{analysis.suggestedTemplate.replace('_', ' ').toUpperCase()}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Columns Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold">Column Analysis</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Unique Values</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Samples</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {analysis.columns.map((column, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{column.name}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${column.type === 'categorical' ? 'bg-blue-100 text-blue-800' : ''}
                      ${column.type === 'numerical' ? 'bg-green-100 text-green-800' : ''}
                      ${column.type === 'text' ? 'bg-purple-100 text-purple-800' : ''}
                      ${column.type === 'date' ? 'bg-orange-100 text-orange-800' : ''}
                      ${column.type === 'boolean' ? 'bg-pink-100 text-pink-800' : ''}
                      ${column.type === 'unknown' ? 'bg-gray-100 text-gray-800' : ''}
                    `}>
                      {column.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{column.uniqueValues}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {column.samples.slice(0, 3).join(', ')}
                    {column.samples.length > 3 && '...'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {column.isKey && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          Key
                        </span>
                      )}
                      {column.isPotentialTarget && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Target
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Data Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-4 py-3 border-b">
          <h3 className="font-semibold">Data Preview (First 5 Rows)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                {analysis.columns.map((column, index) => (
                  <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    {column.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {analysis.dataPreview.slice(0, 5).map((row, rowIndex) => (
                <tr key={rowIndex} className="hover:bg-gray-50">
                  {analysis.columns.map((column, colIndex) => (
                    <td key={colIndex} className="px-4 py-2 text-gray-600">
                      {String(row[column.name] || '')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end">
        <button
          onClick={onNext}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          Continue to Configuration →
        </button>
      </div>
    </div>
  );
}
