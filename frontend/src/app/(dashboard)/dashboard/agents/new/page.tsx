'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api, agentsApi } from '@/lib/api'
import toast from 'react-hot-toast'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

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

export default function NewAgentPage() {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors } } = useForm<AgentForm>({
    resolver: zodResolver(agentSchema),
    defaultValues: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      useKnowledgeBase: false,
      knowledgeBaseMaxResults: 3,
      knowledgeBaseThreshold: 0.7,
    },
  })

  // Fetch available models including fine-tuned models
  const { data: availableModels, isLoading: modelsLoading } = useQuery({
    queryKey: ['agents', 'available-models'],
    queryFn: () => api.get('/agents/available-models/list').then((res) => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: AgentForm) => agentsApi.create(data),
    onSuccess: () => {
      toast.success('Agent created successfully')
      router.push('/dashboard/agents')
    },
    onError: () => {
      toast.error('Failed to create agent')
    },
  })

  const onSubmit = (data: AgentForm) => {
    createMutation.mutate(data)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/agents"
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Create New Agent</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure your AI agent's behavior and capabilities
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
          {/* Basic Information */}
          <div>
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
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="e.g., Customer Support Agent"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  id="description"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  placeholder="Brief description of what this agent does"
                />
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              System Prompt
            </h2>
            <div>
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                System Prompt *
              </label>
              <textarea
                {...register('systemPrompt')}
                id="systemPrompt"
                rows={8}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent font-mono text-sm"
                placeholder="You are a helpful assistant that..."
              />
              {errors.systemPrompt && (
                <p className="mt-1 text-sm text-red-600">{errors.systemPrompt.message}</p>
              )}
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Define the agent's personality, role, and behavior guidelines
              </p>
            </div>
          </div>

          {/* Model Configuration */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Model Configuration
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                      {/* Base Models */}
                      {availableModels?.baseModels && availableModels.baseModels.length > 0 && (
                        <optgroup label="Base Models">
                          {availableModels.baseModels.map((model: any) => (
                            <option key={model.id} value={model.id}>
                              {model.name} ({model.provider})
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* Fine-Tuned Models */}
                      {availableModels?.fineTunedModels && availableModels.fineTunedModels.length > 0 && (
                        <optgroup label="🎯 Fine-Tuned Models (Your Custom Models)">
                          {availableModels.fineTunedModels.map((model: any) => (
                            <option key={model.id} value={model.id}>
                              {model.name} (based on {model.baseModel})
                            </option>
                          ))}
                        </optgroup>
                      )}

                      {/* Fallback if no models loaded */}
                      {!availableModels && (
                        <>
                          <optgroup label="OpenAI">
                            <option value="gpt-4">GPT-4</option>
                            <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                            <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                          </optgroup>
                          <optgroup label="Ollama (Local, Free)">
                            <option value="mistral">Mistral (7B)</option>
                            <option value="llama2">Llama 2 (7B)</option>
                          </optgroup>
                        </>
                      )}
                    </>
                  )}
                </select>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {availableModels?.fineTunedModels && availableModels.fineTunedModels.length > 0 
                    ? `${availableModels.fineTunedModels.length} fine-tuned model${availableModels.fineTunedModels.length > 1 ? 's' : ''} available`
                    : 'Select a model for your agent. Fine-tuned models will appear here once deployed.'}
                </p>
              </div>

              <div>
                <label htmlFor="temperature" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Temperature
                </label>
                <input
                  {...register('temperature', { valueAsNumber: true })}
                  type="number"
                  id="temperature"
                  step="0.1"
                  min="0"
                  max="2"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  0 = focused, 2 = creative
                </p>
              </div>

              <div>
                <label htmlFor="maxTokens" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Max Tokens
                </label>
                <input
                  {...register('maxTokens', { valueAsNumber: true })}
                  type="number"
                  id="maxTokens"
                  min="100"
                  max="4000"
                  step="100"
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                />
              </div>
            </div>

            {/* RAG Settings */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  {...register('useKnowledgeBase')}
                  type="checkbox"
                  id="useKnowledgeBase"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="useKnowledgeBase" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Knowledge Base (RAG)
                </label>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 ml-7">
                Allow agent to search and use information from your uploaded documents
              </p>

              <div className="ml-7 grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="knowledgeBaseMaxResults" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Max Results
                  </label>
                  <input
                    {...register('knowledgeBaseMaxResults', { valueAsNumber: true })}
                    type="number"
                    id="knowledgeBaseMaxResults"
                    min="1"
                    max="10"
                    defaultValue={3}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Number of document chunks to retrieve (1-10)
                  </p>
                </div>

                <div>
                  <label htmlFor="knowledgeBaseThreshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Similarity Threshold
                  </label>
                  <input
                    {...register('knowledgeBaseThreshold', { valueAsNumber: true })}
                    type="number"
                    id="knowledgeBaseThreshold"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue={0.7}
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Minimum relevance score (0.0-1.0)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/dashboard/agents"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Creating...' : 'Create Agent'}
          </button>
        </div>
      </form>
    </div>
  )
}
