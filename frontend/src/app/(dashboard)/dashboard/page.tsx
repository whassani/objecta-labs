'use client'

import { useQuery } from '@tanstack/react-query'
import { agentsApi, conversationsApi, knowledgeBaseApi } from '@/lib/api'
import { 
  SparklesIcon, 
  ChatBubbleLeftRightIcon, 
  BookOpenIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'

export default function DashboardPage() {
  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.getAll().then(res => res.data),
  })

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => conversationsApi.getAll().then(res => res.data),
  })

  const { data: dataSources } = useQuery({
    queryKey: ['dataSources'],
    queryFn: () => knowledgeBaseApi.getDataSources().then(res => res.data),
  })

  const stats = [
    {
      name: 'Active Agents',
      value: agents?.length || 0,
      icon: SparklesIcon,
      href: '/dashboard/agents',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      name: 'Conversations',
      value: conversations?.length || 0,
      icon: ChatBubbleLeftRightIcon,
      href: '/dashboard/conversations',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
    {
      name: 'Data Sources',
      value: dataSources?.length || 0,
      icon: BookOpenIcon,
      href: '/dashboard/knowledge-base',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      name: 'Messages Today',
      value: 0,
      icon: ArrowTrendingUpIcon,
      href: '/dashboard/conversations',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Welcome back! Here's an overview of your AI agents.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition shadow-sm hover:shadow-md"
          >
            <div className="p-6">
              <div className="flex items-center">
                <div className={`flex-shrink-0 rounded-lg p-3 ${stat.bgColor}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-3xl font-semibold text-gray-900 dark:text-white">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            href="/dashboard/agents/new"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition group"
          >
            <SparklesIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600">
              Create New Agent
            </span>
          </Link>
          <Link
            href="/dashboard/knowledge-base"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition group"
          >
            <BookOpenIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600">
              Add Data Source
            </span>
          </Link>
          <Link
            href="/dashboard/conversations"
            className="flex items-center justify-center px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition group"
          >
            <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 group-hover:text-primary-600 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600">
              Start Conversation
            </span>
          </Link>
        </div>
      </div>

      {/* Recent Agents */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Agents</h2>
          <Link href="/dashboard/agents" className="text-sm text-primary-600 hover:text-primary-700">
            View all →
          </Link>
        </div>
        {agents && agents.length > 0 ? (
          <div className="space-y-3">
            {agents.slice(0, 5).map((agent: any) => (
              <Link
                key={agent.id}
                href={`/dashboard/agents/${agent.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{agent.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{agent.description}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {new Date(agent.createdAt).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <SparklesIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No agents yet</p>
            <Link
              href="/dashboard/agents/new"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Create your first agent
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
