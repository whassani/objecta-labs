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

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<AgentForm>({
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
              <label htmlFor="systemPrompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                System Prompt *
              </label>
              <textarea
                {...register('systemPrompt')}
                id="systemPrompt"
                rows={6}
                placeholder="You are a helpful assistant that..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent font-mono text-sm"
              />
              {errors.systemPrompt && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.systemPrompt.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Model Configuration */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Model Configuration
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                        </optgroup>
                        <optgroup label="Ollama">
                          <option value="mistral">Mistral</option>
                          <option value="llama2">Llama 2</option>
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
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* RAG Settings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Knowledge Base (RAG) Settings
          </h2>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <input
                {...register('useKnowledgeBase')}
                type="checkbox"
                id="useKnowledgeBase"
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <label htmlFor="useKnowledgeBase" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Enable Knowledge Base (RAG)
                </label>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Allow agent to search and use information from your uploaded documents
                </p>
              </div>
            </div>

            {useKnowledgeBase && (
              <div className="ml-7 grid grid-cols-2 gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
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
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Minimum relevance score (0.0-1.0)
                  </p>
                  <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                    💡 Try 0.5-0.6 if agent can't find information
                  </p>
                </div>
              </div>
            )}
          </div>
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
