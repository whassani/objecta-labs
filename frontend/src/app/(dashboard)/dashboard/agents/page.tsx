'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { agentsApi, workspacesApi } from '@/lib/api'
import Link from 'next/link'
import { 
  PlusIcon, 
  SparklesIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Badge } from '@/components/ui/badge'

export default function AgentsPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterWorkspace, setFilterWorkspace] = useState('')

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.getAll().then(res => res.data),
  })
  
  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesApi.getAll().then(res => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => agentsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents'] })
      toast.success('Agent deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete agent')
    },
  })

  const filteredAgents = agents?.filter((agent: any) => {
    const matchesSearch = agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesWorkspace = !filterWorkspace || agent.workspaceId === filterWorkspace || 
      (filterWorkspace === 'none' && !agent.workspaceId)
    return matchesSearch && matchesWorkspace
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Agents</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Create and manage your AI agents
          </p>
        </div>
        <Link
          href="/dashboard/agents/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Agent
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
          />
        </div>
        <select
          value={filterWorkspace}
          onChange={(e) => setFilterWorkspace(e.target.value)}
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
        >
          <option value="">All Workspaces</option>
          <option value="none">No Workspace</option>
          {workspaces?.map((ws: any) => (
            <option key={ws.id} value={ws.id}>
              {ws.icon} {ws.name}
            </option>
          ))}
        </select>
      </div>

      {/* Agents Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-full mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : filteredAgents && filteredAgents.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAgents.map((agent: any) => (
            <div
              key={agent.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-primary-300 dark:hover:border-primary-700 transition group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                  <SparklesIcon className="h-6 w-6 text-primary-600" />
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    href={`/dashboard/agents/${agent.id}`}
                    className="p-1 text-gray-400 hover:text-primary-600"
                    title="View"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </Link>
                  <Link
                    href={`/dashboard/agents/${agent.id}/edit`}
                    className="p-1 text-gray-400 hover:text-primary-600"
                    title="Edit"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this agent?')) {
                        deleteMutation.mutate(agent.id)
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {agent.name}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                {agent.description || 'No description'}
              </p>

              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">
                    {agent.model}
                  </span>
                  {agent.workspaceId && workspaces && (
                    <Badge variant="secondary" className="text-xs">
                      {workspaces.find((ws: any) => ws.id === agent.workspaceId)?.icon}{' '}
                      {workspaces.find((ws: any) => ws.id === agent.workspaceId)?.name}
                    </Badge>
                  )}
                </div>
                <span>{new Date(agent.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No agents</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first AI agent.
          </p>
          <div className="mt-6">
            <Link
              href="/dashboard/agents/new"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Agent
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
