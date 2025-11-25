'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { conversationsApi, agentsApi } from '@/lib/api'
import Link from 'next/link'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

export default function NewConversationPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [selectedAgentId, setSelectedAgentId] = useState('')

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.getAll().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (agentId: string) => conversationsApi.create({ agentId }),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['conversations'] })
      toast.success('Conversation created!')
      router.push(`/dashboard/conversations/${response.data.id}`)
    },
    onError: () => {
      toast.error('Failed to create conversation')
    },
  })

  const handleCreate = () => {
    if (!selectedAgentId) {
      toast.error('Please select an agent')
      return
    }
    createMutation.mutate(selectedAgentId)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/conversations"
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Conversation</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Select an agent to start chatting
          </p>
        </div>
      </div>

      {/* Agent Selection */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Agent
        </h2>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Loading agents...</p>
          </div>
        ) : agents && agents.length > 0 ? (
          <div className="space-y-3">
            {agents.map((agent: any) => (
              <label
                key={agent.id}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${
                  selectedAgentId === agent.id
                    ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                <input
                  type="radio"
                  name="agent"
                  value={agent.id}
                  checked={selectedAgentId === agent.id}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="mr-4"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {agent.name}
                  </h3>
                  {agent.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {agent.description}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                    Model: {agent.model}
                  </p>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              No agents available. Create an agent first.
            </p>
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Create Agent
            </Link>
          </div>
        )}
      </div>

      {/* Actions */}
      {agents && agents.length > 0 && (
        <div className="flex items-center justify-end space-x-4">
          <Link
            href="/dashboard/conversations"
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </Link>
          <button
            onClick={handleCreate}
            disabled={!selectedAgentId || createMutation.isPending}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending ? 'Creating...' : 'Start Conversation'}
          </button>
        </div>
      )}
    </div>
  )
}
