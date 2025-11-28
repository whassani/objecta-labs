'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, agentsApi } from '@/lib/api'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'

const agentSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  systemPrompt: z.string().min(1, 'System prompt is required'),
  model: z.string().default('gpt-4'),
  temperature: z.number().min(0).max(2).default(0.7),
  maxTokens: z.number().min(100).max(4000).default(2000),
  useKnowledgeBase: z.boolean().optional().default(false),
  knowledgeBaseMaxResults: z.number().min(1).max(10).optional().default(3),
  knowledgeBaseThreshold: z.number().min(0).max(1).optional().default(0.7),
})

type AgentForm = z.infer<typeof agentSchema>

export default function EditAgentPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const agentId = params.id as string

  // Fetch agent data
  const { data: agent, isLoading } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: () => agentsApi.getOne(agentId).then(res => res.data),
  })

  // Fetch available models including fine-tuned models
  const { data: availableModels, isLoading: modelsLoading } = useQuery({
    queryKey: ['agents', 'available-models'],
    queryFn: () => api.get('/agents/available-models/list').then((res) => res.data),
  })

  // Local state for prompt builder (not sent to backend)
  const [promptRole, setPromptRole] = useState('')
  const [promptExpertise, setPromptExpertise] = useState('')
  const [promptBehavior, setPromptBehavior] = useState('')
  const [promptToneStyle, setPromptToneStyle] = useState('')
  const [promptOutputFormat, setPromptOutputFormat] = useState('')
  const [promptConstraints, setPromptConstraints] = useState('')
  const [promptExamples, setPromptExamples] = useState('')

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AgentForm>({
    resolver: zodResolver(agentSchema),
  })

  // Reset form when agent data loads
  useEffect(() => {
    if (agent) {
      reset({
        name: agent.name,
        description: agent.description || '',
        systemPrompt: agent.systemPrompt,
        model: agent.model || 'gpt-4',
        temperature: agent.temperature || 0.7,
        maxTokens: agent.maxTokens || 2000,
        useKnowledgeBase: agent.useKnowledgeBase || false,
        knowledgeBaseMaxResults: agent.knowledgeBaseMaxResults || 3,
        knowledgeBaseThreshold: agent.knowledgeBaseThreshold || 0.7,
      })
    }
  }, [agent, reset])

  // Auto-generate system prompt from individual fields
  useEffect(() => {
    const parts = []
    if (promptRole) parts.push(promptRole)
    if (promptExpertise) parts.push(`\n**Your Expertise:**\n${promptExpertise}`)
    if (promptBehavior) parts.push(`\n**Behavior Guidelines:**\n${promptBehavior}`)
    if (promptToneStyle) parts.push(`\n**Tone & Style:**\n${promptToneStyle}`)
    if (promptOutputFormat) parts.push(`\n**Output Format:**\n${promptOutputFormat}`)
    if (promptConstraints) parts.push(`\n**Constraints:**\n${promptConstraints}`)
    if (promptExamples) parts.push(`\n**Examples:**\n${promptExamples}`)

    const generated = parts.join('\n')
    if (generated) {
      setValue('systemPrompt', generated)
    }
  }, [promptRole, promptExpertise, promptBehavior, promptToneStyle, promptOutputFormat, promptConstraints, promptExamples, setValue])

  const updateMutation = useMutation({
    mutationFn: (data: AgentForm) => agentsApi.update(agentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      queryClient.invalidateQueries({ queryKey: ['agent', agentId] })
      toast.success('Agent updated successfully!')
      router.push('/dashboard/agents')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update agent')
    },
  })

  const onSubmit = (data: AgentForm) => {
    updateMutation.mutate(data)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!agent) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Agent not found</p>
      </div>
    )
  }

  const useKnowledgeBase = watch('useKnowledgeBase')

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/agents"
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Agent</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Update your agent configuration
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Basic Information
          </h2>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agent Name *
              </label>
              <input
                {...register('name')}
                type="text"
                id="name"
                placeholder="e.g., Documentation Assistant"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                id="description"
                rows={2}
                placeholder="Brief description of what this agent does"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  System Prompt Builder *
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setPromptRole('You are an expert customer support agent for a SaaS company.')
                    setPromptExpertise('Product features and capabilities\nCommon troubleshooting steps\nBilling and account management\nIntegration guides')
                    setPromptBehavior('Always greet customers warmly\nAsk clarifying questions if needed\nProvide step-by-step solutions\nInclude relevant links or documentation\nEnd with "Is there anything else I can help you with?"')
                    setPromptToneStyle('Professional yet conversational\nPatient and empathetic\nClear and concise\nAvoid technical jargon unless necessary')
                    setPromptOutputFormat('Use markdown formatting\nStructure responses with headings\nUse bullet points for lists\nInclude code blocks when relevant')
                    setPromptConstraints('Do not make promises about features not yet released\nNever share competitor information\nEscalate refund requests to billing team\nDo not provide legal or financial advice')
                    setPromptExamples('User: "How do I reset my password?"\nAgent: "I\'d be happy to help you reset your password! You can do this by clicking the \'Forgot Password\' link on the login page, then checking your email for reset instructions."')
                  }}
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 font-medium"
                >
                  📝 Load Example
                </button>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
                Fill in the sections below to build a comprehensive system prompt. The AI will use these instructions to understand its role and how to respond.
              </p>

              {/* Structured Prompt Fields */}
              <div className="space-y-4">
                {/* 1. Role */}
                <div className="bg-purple-50 dark:bg-purple-900/10 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">1️⃣</span>
                    <div className="flex-1">
                      <label htmlFor="promptRole" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Define the Role
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Start with "You are a [specific role]..." Be specific about who the agent is and what they do.
                      </p>
                      <input
                        value={promptRole}
                        onChange={(e) => setPromptRole(e.target.value)}
                        type="text"
                        id="promptRole"
                        placeholder="e.g., You are a helpful Python programming tutor specializing in beginners"
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Expertise */}
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">2️⃣</span>
                    <div className="flex-1">
                      <label htmlFor="promptExpertise" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Specify Expertise & Knowledge
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        What topics, domains, or areas does the agent know about? List the agent's knowledge areas.
                      </p>
                      <textarea
                        value={promptExpertise}
                        onChange={(e) => setPromptExpertise(e.target.value)}
                        id="promptExpertise"
                        rows={3}
                        placeholder="e.g., Expert in: Python fundamentals, data structures, common libraries..."
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Behavior */}
                <div className="bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">3️⃣</span>
                    <div className="flex-1">
                      <label htmlFor="promptBehavior" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Set Behavior Rules & Guidelines
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        How should the agent behave? What steps should it follow? Define the response workflow.
                      </p>
                      <textarea
                        value={promptBehavior}
                        onChange={(e) => setPromptBehavior(e.target.value)}
                        id="promptBehavior"
                        rows={4}
                        placeholder="e.g., Always greet warmly, ask clarifying questions, provide step-by-step solutions..."
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Tone & Style */}
                <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">4️⃣</span>
                    <div className="flex-1">
                      <label htmlFor="promptToneStyle" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Define Tone & Communication Style
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        How should the agent communicate? Formal? Casual? Technical? Friendly? Patient?
                      </p>
                      <textarea
                        value={promptToneStyle}
                        onChange={(e) => setPromptToneStyle(e.target.value)}
                        id="promptToneStyle"
                        rows={3}
                        placeholder="e.g., Friendly and encouraging, patient with beginners, use simple clear language..."
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Output Format */}
                <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">5️⃣</span>
                    <div className="flex-1">
                      <label htmlFor="promptOutputFormat" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Specify Output Format
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        How should responses be structured? Markdown? Bullet points? Code blocks? Headings?
                      </p>
                      <textarea
                        value={promptOutputFormat}
                        onChange={(e) => setPromptOutputFormat(e.target.value)}
                        id="promptOutputFormat"
                        rows={3}
                        placeholder="e.g., Use markdown with headings, include code blocks, use bullet points for lists..."
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Constraints */}
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">6️⃣</span>
                    <div className="flex-1">
                      <label htmlFor="promptConstraints" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Add Constraints (What NOT to do)
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Define boundaries. What should the agent avoid? What topics are off-limits?
                      </p>
                      <textarea
                        value={promptConstraints}
                        onChange={(e) => setPromptConstraints(e.target.value)}
                        id="promptConstraints"
                        rows={3}
                        placeholder="e.g., Never provide complete homework solutions, don't write code without explaining, if unsure say 'I don't know'..."
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Examples (Optional) */}
                <div className="bg-pink-50 dark:bg-pink-900/10 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-lg">7️⃣</span>
                    <div className="flex-1">
                      <label htmlFor="promptExamples" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        Provide Examples (Few-shot Learning) <span className="text-gray-500 font-normal">- Optional</span>
                      </label>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Show example interactions. How should the agent respond to typical questions?
                      </p>
                      <textarea
                        value={promptExamples}
                        onChange={(e) => setPromptExamples(e.target.value)}
                        id="promptExamples"
                        rows={4}
                        placeholder="e.g., Example Interaction:&#10;User: 'What is a variable?'&#10;Agent: 'Great question! A variable is like a labeled box where you store data.'"
                        className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden system prompt field - auto-generated */}
              <input type="hidden" {...register('systemPrompt')} />
              {errors.systemPrompt && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.systemPrompt.message}</p>
              )}

              {/* Preview Section */}
              <div className="mt-4 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  📄 Generated System Prompt Preview
                  <span className="text-xs font-normal text-gray-500">(Updates automatically)</span>
                </p>
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700 max-h-64 overflow-y-auto">
                  {watch('systemPrompt') || 'Start filling in the fields above to build your system prompt...'}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Model Configuration */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 p-6 rounded-lg border-2 border-green-200 dark:border-green-800 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Model Configuration
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Control how your agent generates responses - from factual and precise to creative and varied.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 space-y-4">
            <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
              🎛️ Configure Generation Parameters
            </p>

            <div className="grid grid-cols-1 gap-4">
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model
              </label>
              <select
                {...register('model')}
                id="model"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                disabled={modelsLoading}
              >
                {modelsLoading ? (
                  <option>Loading models...</option>
                ) : (
                  <>
                    {/* Fine-Tuned Models (Priority) */}
                    {availableModels?.fineTunedModels && availableModels.fineTunedModels.length > 0 && (
                      <optgroup label="🎯 Your Fine-Tuned Models">
                        {availableModels.fineTunedModels.map((model: any) => (
                          <option key={model.id} value={model.id}>
                            {model.name} (based on {model.baseModel})
                          </option>
                        ))}
                      </optgroup>
                    )}

                    {/* OpenAI */}
                    <optgroup label="OpenAI">
                      <option value="gpt-4-turbo">GPT-4 Turbo (Latest)</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                    </optgroup>

                    {/* Anthropic */}
                    <optgroup label="Anthropic (Claude)">
                      <option value="claude-3-opus">Claude 3 Opus</option>
                      <option value="claude-3-sonnet">Claude 3 Sonnet</option>
                      <option value="claude-3-haiku">Claude 3 Haiku</option>
                    </optgroup>

                    {/* Google Gemini */}
                    <optgroup label="Google Gemini">
                      <option value="gemini-pro">Gemini Pro</option>
                      <option value="gemini-pro-vision">Gemini Pro Vision</option>
                    </optgroup>

                    {/* Cohere */}
                    <optgroup label="Cohere">
                      <option value="command">Command</option>
                      <option value="command-light">Command Light</option>
                    </optgroup>

                    {/* Mistral AI */}
                    <optgroup label="Mistral AI">
                      <option value="mistral-large">Mistral Large</option>
                      <option value="mistral-medium">Mistral Medium</option>
                      <option value="mistral-small">Mistral Small</option>
                    </optgroup>

                    {/* Ollama (Local) */}
                    <optgroup label="Ollama (Local)">
                      <option value="llama2">Llama 2</option>
                      <option value="mistral">Mistral 7B</option>
                      <option value="codellama">Code Llama</option>
                      <option value="mixtral">Mixtral 8x7B</option>
                      <option value="neural-chat">Neural Chat</option>
                    </optgroup>
                  </>
                )}
              </select>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {availableModels?.fineTunedModels && availableModels.fineTunedModels.length > 0 
                  ? `${availableModels.fineTunedModels.length} fine-tuned model${availableModels.fineTunedModels.length > 1 ? 's' : ''} available • `
                  : ''}
                Models grouped by provider. Configure API keys in Settings.
              </p>
            </div>

            {/* Temperature */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="temperature" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Temperature (Creativity)
                </label>
                <span className="text-sm font-semibold text-primary-600">
                  {(watch('temperature') || 0.7).toFixed(1)}
                </span>
              </div>
              <input
                {...register('temperature', { valueAsNumber: true })}
                type="range"
                id="temperature"
                min="0"
                max="2"
                step="0.1"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0.0 (Precise)</span>
                <span>1.0 (Balanced)</span>
                <span>2.0 (Creative)</span>
              </div>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">💡 What this means:</p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• <strong>0.0-0.3:</strong> Deterministic, focused. Same input → same output. Good for factual tasks, data extraction.</li>
                  <li>• <strong>0.4-0.9:</strong> Balanced creativity. Some variation but still predictable. (Recommended: 0.7)</li>
                  <li>• <strong>1.0-2.0:</strong> Highly creative. Diverse outputs, more randomness. Good for brainstorming, creative writing.</li>
                </ul>
              </div>
            </div>

            {/* Max Tokens */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="maxTokens" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Max Tokens (Response Length)
                </label>
                <span className="text-sm font-semibold text-primary-600">
                  {watch('maxTokens') || 2000}
                </span>
              </div>
              <input
                {...register('maxTokens', { valueAsNumber: true })}
                type="range"
                id="maxTokens"
                min="100"
                max="4000"
                step="100"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>100 (Short)</span>
                <span>2000 (Medium)</span>
                <span>4000 (Long)</span>
              </div>
              <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">💡 What this means:</p>
                <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                  <li>• <strong>100-500:</strong> Short, concise responses. Quick answers, low cost. Good for simple Q&A.</li>
                  <li>• <strong>500-2000:</strong> Medium responses. Good balance. (Recommended: 2000)</li>
                  <li>• <strong>2000-4000:</strong> Long, detailed responses. In-depth explanations, essays, code generation.</li>
                </ul>
                <p className="mt-2 text-gray-500">
                  💰 Note: More tokens = higher API costs. 1 token ≈ 0.75 words.
                </p>
              </div>
            </div>

            </div>

            {/* Model Configuration Presets */}
            <div>
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                ⚡ Quick Presets:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setValue('temperature', 0.2)
                    setValue('maxTokens', 500)
                  }}
                  className={`px-3 py-2 text-xs bg-white dark:bg-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition ${
                    Math.abs((watch('temperature') || 0.7) - 0.2) < 0.1 && Math.abs((watch('maxTokens') || 2000) - 500) < 50
                      ? 'border-2 border-primary-500'
                      : 'border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="font-semibold">🎯 Precise</div>
                  <div className="text-gray-500">Temp 0.2, 500 tokens</div>
                  <div className="text-gray-400 text-[10px] mt-1">Facts, data extraction</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('temperature', 0.7)
                    setValue('maxTokens', 2000)
                  }}
                  className={`px-3 py-2 text-xs bg-white dark:bg-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition ${
                    Math.abs((watch('temperature') || 0.7) - 0.7) < 0.1 && Math.abs((watch('maxTokens') || 2000) - 2000) < 50
                      ? 'border-2 border-primary-500'
                      : 'border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="font-semibold">⚖️ Balanced</div>
                  <div className="text-gray-500">Temp 0.7, 2000 tokens</div>
                  <div className="text-gray-400 text-[10px] mt-1">General purpose</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue('temperature', 1.2)
                    setValue('maxTokens', 3000)
                  }}
                  className={`px-3 py-2 text-xs bg-white dark:bg-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition ${
                    Math.abs((watch('temperature') || 0.7) - 1.2) < 0.1 && Math.abs((watch('maxTokens') || 2000) - 3000) < 50
                      ? 'border-2 border-primary-500'
                      : 'border border-gray-300 dark:border-gray-600'
                  }`}
                >
                  <div className="font-semibold">🎨 Creative</div>
                  <div className="text-gray-500">Temp 1.2, 3000 tokens</div>
                  <div className="text-gray-400 text-[10px] mt-1">Writing, brainstorming</div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* RAG Settings */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 p-6 rounded-lg border-2 border-blue-200 dark:border-blue-800 space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Knowledge Base (RAG - Retrieval Augmented Generation)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enable your agent to search and reference information from uploaded documents for more accurate, context-aware responses.
            </p>
          </div>

          <div className="flex items-start space-x-3 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              {...register('useKnowledgeBase')}
              type="checkbox"
              id="useKnowledgeBase"
              className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <div className="flex-1">
              <label htmlFor="useKnowledgeBase" className="text-sm font-semibold text-gray-900 dark:text-white cursor-pointer">
                Enable Knowledge Base Search
              </label>
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                When enabled, the agent will search your documents before responding to find relevant information.
              </p>
            </div>
          </div>

          {useKnowledgeBase && (
            <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300">
                📊 Configure RAG Parameters
              </p>

              {/* Max Results */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="knowledgeBaseMaxResults" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Max Document Chunks
                  </label>
                  <span className="text-sm font-semibold text-primary-600">
                    {watch('knowledgeBaseMaxResults') || 3}
                  </span>
                </div>
                <input
                  {...register('knowledgeBaseMaxResults', { valueAsNumber: true })}
                  type="range"
                  id="knowledgeBaseMaxResults"
                  min="1"
                  max="10"
                  step="1"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>1 (Focused)</span>
                  <span>5 (Balanced)</span>
                  <span>10 (Comprehensive)</span>
                </div>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">💡 What this means:</p>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• <strong>1-2 chunks:</strong> Quick, focused answers. Lower token usage, faster responses.</li>
                    <li>• <strong>3-5 chunks:</strong> Balanced approach. Good for most use cases. (Recommended)</li>
                    <li>• <strong>6-10 chunks:</strong> Comprehensive context. Better for complex questions, higher token usage.</li>
                  </ul>
                </div>
              </div>

              {/* Similarity Threshold */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="knowledgeBaseThreshold" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Similarity Threshold
                  </label>
                  <span className="text-sm font-semibold text-primary-600">
                    {(watch('knowledgeBaseThreshold') || 0.7).toFixed(2)}
                  </span>
                </div>
                <input
                  {...register('knowledgeBaseThreshold', { valueAsNumber: true })}
                  type="range"
                  id="knowledgeBaseThreshold"
                  min="0.3"
                  max="0.95"
                  step="0.05"
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0.3 (Permissive)</span>
                  <span>0.7 (Balanced)</span>
                  <span>0.95 (Strict)</span>
                </div>
                <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-900 rounded text-xs">
                  <p className="font-medium text-gray-700 dark:text-gray-300 mb-1">💡 What this means:</p>
                  <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                    <li>• <strong>0.3-0.5 (Low):</strong> Include loosely related documents. May add noise but ensures coverage.</li>
                    <li>• <strong>0.6-0.8 (Medium):</strong> Good balance between relevance and recall. (Recommended: 0.7)</li>
                    <li>• <strong>0.85-0.95 (High):</strong> Only highly relevant documents. Fewer results but more precise.</li>
                  </ul>
                </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                <p className="text-xs font-medium text-blue-900 dark:text-blue-300 mb-2">
                  🎯 How RAG Works:
                </p>
                <ol className="text-xs text-blue-800 dark:text-blue-400 space-y-1 list-decimal list-inside">
                  <li>User asks a question</li>
                  <li>System searches your documents using semantic similarity</li>
                  <li>Top {watch('knowledgeBaseMaxResults') || 3} chunks above {((watch('knowledgeBaseThreshold') || 0.7) * 100).toFixed(0)}% similarity are retrieved</li>
                  <li>Retrieved context is injected into the agent's prompt</li>
                  <li>Agent generates response using both its knowledge and your documents</li>
                </ol>
              </div>

              {/* Recommended Presets */}
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  ⚡ Quick Presets:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('knowledgeBaseMaxResults', 2)
                      setValue('knowledgeBaseThreshold', 0.8)
                    }}
                    className={`px-3 py-2 text-xs bg-white dark:bg-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition ${
                      Math.abs((watch('knowledgeBaseMaxResults') || 3) - 2) < 1 && Math.abs((watch('knowledgeBaseThreshold') || 0.7) - 0.8) < 0.05
                        ? 'border-2 border-primary-500'
                        : 'border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold">🎯 Precise</div>
                    <div className="text-gray-500">2 chunks, 0.8</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('knowledgeBaseMaxResults', 3)
                      setValue('knowledgeBaseThreshold', 0.7)
                    }}
                    className={`px-3 py-2 text-xs bg-white dark:bg-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition ${
                      Math.abs((watch('knowledgeBaseMaxResults') || 3) - 3) < 1 && Math.abs((watch('knowledgeBaseThreshold') || 0.7) - 0.7) < 0.05
                        ? 'border-2 border-primary-500'
                        : 'border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold">⚖️ Balanced</div>
                    <div className="text-gray-500">3 chunks, 0.7</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue('knowledgeBaseMaxResults', 7)
                      setValue('knowledgeBaseThreshold', 0.6)
                    }}
                    className={`px-3 py-2 text-xs bg-white dark:bg-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition ${
                      Math.abs((watch('knowledgeBaseMaxResults') || 3) - 7) < 1 && Math.abs((watch('knowledgeBaseThreshold') || 0.7) - 0.6) < 0.05
                        ? 'border-2 border-primary-500'
                        : 'border border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    <div className="font-semibold">📚 Comprehensive</div>
                    <div className="text-gray-500">7 chunks, 0.6</div>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/dashboard/agents"
            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
