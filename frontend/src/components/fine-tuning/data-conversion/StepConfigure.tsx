// Step 3: Configure Conversion Options

import { useState, useEffect } from 'react';
import { DataAnalysis, ConversionMode, ConversionTemplate, ConversionOptions, TemplateInfo } from './types';

interface StepConfigureProps {
  analysis: DataAnalysis;
  onNext: (options: ConversionOptions) => void;
  onBack: () => void;
  getTemplates: () => Promise<TemplateInfo[]>;
}

export function StepConfigure({ analysis, onNext, onBack, getTemplates }: StepConfigureProps) {
  const [mode, setMode] = useState<ConversionMode>('guided');
  const [template, setTemplate] = useState<ConversionTemplate>(analysis.suggestedTemplate || 'qa');
  const [keyColumn, setKeyColumn] = useState(analysis.suggestedKeyColumn || '');
  const [targetColumn, setTargetColumn] = useState(analysis.suggestedTargetColumn || '');
  const [systemMessage, setSystemMessage] = useState('');
  const [multiTurn, setMultiTurn] = useState(false);
  const [customUserPrompt, setCustomUserPrompt] = useState('');
  const [customAssistantResponse, setCustomAssistantResponse] = useState('');
  const [aiProvider, setAiProvider] = useState<'openai' | 'ollama'>('ollama');
  const [aiModel, setAiModel] = useState('llama3.2');
  const [maxExamplesPerRow, setMaxExamplesPerRow] = useState(3);
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);

  useEffect(() => {
    getTemplates().then(setTemplates);
  }, [getTemplates]);

  // Update default model when provider changes
  useEffect(() => {
    if (aiProvider === 'ollama') {
      setAiModel('llama3.2');
    } else {
      setAiModel('gpt-3.5-turbo');
    }
  }, [aiProvider]);

  // Available models based on provider
  const getAvailableModels = () => {
    if (aiProvider === 'ollama') {
      return [
        { id: 'llama3.2', name: 'Llama 3.2', description: 'Latest Llama model (Recommended)' },
        { id: 'llama2', name: 'Llama 2', description: 'Meta\'s Llama 2 model (7B)' },
        { id: 'mistral', name: 'Mistral', description: 'Mistral 7B model' },
        { id: 'phi', name: 'Phi', description: 'Microsoft Phi model (Compact)' },
        { id: 'gemma', name: 'Gemma', description: 'Google Gemma model' },
      ];
    }
    // OpenAI models
    return [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and cost-effective' },
      { id: 'gpt-4', name: 'GPT-4', description: 'Most capable model' },
    ];
  };

  const selectedTemplate = templates.find(t => t.name.toLowerCase().includes(template.replace('_', ' ')));

  const handleNext = () => {
    const options: ConversionOptions = {
      mode,
      template: mode === 'guided' ? template : undefined,
      keyColumn: mode === 'guided' ? keyColumn : undefined,
      targetColumn: mode === 'guided' ? targetColumn : undefined,
      systemMessage: systemMessage || undefined,
      multiTurn,
      customUserPrompt: template === 'custom' ? customUserPrompt : undefined,
      customAssistantResponse: template === 'custom' ? customAssistantResponse : undefined,
      aiProvider: mode === 'smart' ? aiProvider : undefined,
      aiModel: mode === 'smart' ? aiModel : undefined,
      maxExamplesPerRow: mode === 'smart' ? maxExamplesPerRow : undefined,
    };
    onNext(options);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configure Conversion</h2>
        <p className="text-gray-600">
          Choose how to convert your data to fine-tuning format
        </p>
      </div>

      {/* Mode Selection */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">Conversion Mode</label>
        
        {/* Guided Mode Card */}
        <div
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            mode === 'guided' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => setMode('guided')}
        >
          <div className="flex items-start space-x-3">
            <input
              type="radio"
              checked={mode === 'guided'}
              onChange={() => setMode('guided')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">🎯 Guided Conversion</h3>
                <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                  Recommended
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                Choose a template and configure options. Full control over the conversion process.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>✓ Multiple templates available</li>
                <li>✓ Customize prompts and patterns</li>
                <li>✓ Multi-turn conversation generation</li>
                <li>✓ Preview before converting</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Smart Mode Card */}
        <div
          className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
            mode === 'smart' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => setMode('smart')}
        >
          <div className="flex items-start space-x-3">
            <input
              type="radio"
              checked={mode === 'smart'}
              onChange={() => setMode('smart')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-lg">🤖 Smart Conversion</h3>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                  AI-Powered
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-1">
                AI analyzes your data and automatically generates optimal training examples.
              </p>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>✓ Automatic pattern detection</li>
                <li>✓ Context-aware questions</li>
                <li>✓ Multiple examples per row</li>
                <li>✓ Best quality results</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Guided Mode Options */}
      {mode === 'guided' && (
        <div className="space-y-4 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold">Guided Conversion Options</h3>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value as ConversionTemplate)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="qa">Q&A Format - Simple question-answer pairs</option>
              <option value="info_extraction">Information Extraction - Structured data presentation</option>
              <option value="classification">Classification - Categorization tasks</option>
              <option value="custom">Custom - Define your own patterns</option>
            </select>
            {selectedTemplate && (
              <p className="mt-1 text-sm text-gray-500">{selectedTemplate.description}</p>
            )}
          </div>

          {/* Key Column */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Key Column (Primary Identifier)
            </label>
            <select
              value={keyColumn}
              onChange={(e) => setKeyColumn(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">-- Select Column --</option>
              {analysis.columns.map((col) => (
                <option key={col.name} value={col.name}>
                  {col.name} {col.isKey && '(Suggested)'}
                </option>
              ))}
            </select>
          </div>

          {/* Target Column */}
          {template === 'classification' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Column (Classification Label)
              </label>
              <select
                value={targetColumn}
                onChange={(e) => setTargetColumn(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select Column --</option>
                {analysis.columns.filter(c => c.type === 'categorical').map((col) => (
                  <option key={col.name} value={col.name}>
                    {col.name} {col.isPotentialTarget && '(Suggested)'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* System Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              System Message (Optional)
            </label>
            <textarea
              value={systemMessage}
              onChange={(e) => setSystemMessage(e.target.value)}
              placeholder="e.g., You are a helpful assistant that provides accurate information..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Custom Prompts (for Custom template) */}
          {template === 'custom' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User Prompt Pattern
                </label>
                <textarea
                  value={customUserPrompt}
                  onChange={(e) => setCustomUserPrompt(e.target.value)}
                  placeholder="Use {{column_name}} for placeholders, e.g., 'What is {{name}}?'"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Available placeholders: {analysis.columns.map(c => `{{${c.name}}}`).join(', ')}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Assistant Response Pattern
                </label>
                <textarea
                  value={customAssistantResponse}
                  onChange={(e) => setCustomAssistantResponse(e.target.value)}
                  placeholder="e.g., '{{name}} is {{description}}. It costs {{price}}.'"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </>
          )}

          {/* Multi-turn */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={multiTurn}
              onChange={(e) => setMultiTurn(e.target.checked)}
              className="mt-1"
            />
            <div>
              <label className="font-medium text-sm text-gray-700">
                Generate multi-turn conversations
              </label>
              <p className="text-sm text-gray-500">
                Create 3-5 Q&A pairs per row for richer training data (recommended)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Smart Mode Options */}
      {mode === 'smart' && (
        <div className="space-y-4 bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold">Smart Conversion Options</h3>

          {/* AI Provider */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <div className="grid grid-cols-2 gap-4">
              {/* OpenAI Option */}
              <div
                onClick={() => setAiProvider('openai')}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  aiProvider === 'openai' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="radio"
                    value="openai"
                    checked={aiProvider === 'openai'}
                    onChange={(e) => setAiProvider(e.target.value as 'openai')}
                    className="cursor-pointer"
                  />
                  <span className="font-semibold">OpenAI</span>
                  <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-medium rounded">
                    API Key Required
                  </span>
                </div>
                <p className="text-sm text-gray-600 ml-6">Powerful cloud-based models</p>
              </div>

              {/* Ollama Option */}
              <div
                onClick={() => setAiProvider('ollama')}
                className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                  aiProvider === 'ollama' ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <input
                    type="radio"
                    value="ollama"
                    checked={aiProvider === 'ollama'}
                    onChange={(e) => setAiProvider(e.target.value as 'ollama')}
                    className="cursor-pointer"
                  />
                  <span className="font-semibold">Ollama</span>
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 text-xs font-medium rounded">
                    Free & Local
                  </span>
                </div>
                <p className="text-sm text-gray-600 ml-6">Run models locally on your machine</p>
              </div>
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Model
            </label>
            <div className="grid grid-cols-1 gap-3">
              {getAvailableModels().map((model) => (
                <div
                  key={model.id}
                  onClick={() => setAiModel(model.id)}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    aiModel === model.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <input
                        type="radio"
                        checked={aiModel === model.id}
                        onChange={() => setAiModel(model.id)}
                        className="cursor-pointer"
                      />
                      <div>
                        <h4 className="font-semibold text-gray-900">{model.name}</h4>
                        <p className="text-sm text-gray-600">{model.description}</p>
                      </div>
                    </div>
                    {aiModel === model.id && (
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Max Examples Per Row */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Max Examples Per Row: {maxExamplesPerRow}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={maxExamplesPerRow}
              onChange={(e) => setMaxExamplesPerRow(parseInt(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Fewer (faster)</span>
              <span>More (richer)</span>
            </div>
          </div>

          {/* Multi-turn */}
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              checked={multiTurn}
              onChange={(e) => setMultiTurn(e.target.checked)}
              className="mt-1"
            />
            <div>
              <label className="font-medium text-sm text-gray-700">
                Enable multi-turn conversations
              </label>
              <p className="text-sm text-gray-500">
                AI will generate diverse question types per row
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Template Preview */}
      {mode === 'guided' && selectedTemplate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">📖 Template Preview</h4>
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">User Pattern:</span>
              <code className="block mt-1 bg-white px-2 py-1 rounded text-xs">
                {selectedTemplate.userPromptPattern}
              </code>
            </div>
            <div>
              <span className="font-medium">Assistant Pattern:</span>
              <code className="block mt-1 bg-white px-2 py-1 rounded text-xs">
                {selectedTemplate.assistantPattern}
              </code>
            </div>
            {selectedTemplate.example && (
              <div>
                <span className="font-medium">Example:</span>
                <p className="mt-1 text-gray-700">{selectedTemplate.example}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
        >
          ← Back to Analysis
        </button>
        <button
          onClick={handleNext}
          disabled={mode === 'guided' && !keyColumn}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Preview Conversion →
        </button>
      </div>
    </div>
  );
}
