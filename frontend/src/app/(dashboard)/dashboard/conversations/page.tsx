'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { conversationsApi, agentsApi } from '@/lib/api'
import Link from 'next/link'
import { 
  PlusIcon, 
  ChatBubbleLeftRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'

export default function ConversationsPage() {
  const [selectedAgent, setSelectedAgent] = useState<string>('')

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', selectedAgent],
    queryFn: () => conversationsApi.getAll(selectedAgent || undefined).then(res => res.data),
  })

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.getAll().then(res => res.data),
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Conversations</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            View and manage your conversations with AI agents
          </p>
        </div>
        <Link
          href="/dashboard/conversations/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          New Conversation
        </Link>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-4">
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
        >
          <option value="">All Agents</option>
          {agents?.map((agent: any) => (
            <option key={agent.id} value={agent.id}>
              {agent.name}
            </option>
          ))}
        </select>
      </div>

      {/* Conversations List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : conversations && conversations.length > 0 ? (
        <div className="space-y-4">
          {conversations.map((conversation: any) => (
            <Link
              key={conversation.id}
              href={`/dashboard/conversations/${conversation.id}`}
              className="block bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-primary-300 dark:hover:border-primary-700 transition"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {conversation.title || 'Untitled Conversation'}
                    </h3>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(conversation.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                    <SparklesIcon className="h-4 w-4" />
                    <span>Agent: {conversation.agentId}</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No conversations</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Start a conversation with an AI agent.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/conversations/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Conversation
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
