'use client'

import { useQuery } from '@tanstack/react-query'
import { agentsApi, conversationsApi, knowledgeBaseApi, workspacesApi } from '@/lib/api'
import { 
  SparklesIcon, 
  ChatBubbleLeftRightIcon, 
  BookOpenIcon,
  ArrowTrendingUpIcon,
  RocketLaunchIcon,
  FolderIcon,
  BoltIcon,
  ClockIcon,
  FireIcon,
  ChartBarIcon,
  UserGroupIcon,
  CpuChipIcon,
} from '@heroicons/react/24/outline'
import Link from 'next/link'
import { Card } from '@/components/ui/card'

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

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesApi.getAll().then(res => res.data),
  })

  const isNewUser = !agents?.length && !workspaces?.length

  // Calculate additional stats
  const totalMessages = conversations?.reduce((sum: number, conv: any) => 
    sum + (conv.messages?.length || 0), 0) || 0
  const activeAgents = agents?.filter((a: any) => a.isActive).length || 0
  const recentConversations = conversations?.filter((c: any) => {
    const date = new Date(c.updatedAt)
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }).length || 0

  const stats = [
    {
      name: 'Workspaces',
      value: workspaces?.length || 0,
      icon: FolderIcon,
      href: '/dashboard/workspaces',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      change: workspaces?.length > 0 ? '+' + workspaces.length : null,
    },
    {
      name: 'Active Agents',
      value: activeAgents,
      icon: SparklesIcon,
      href: '/dashboard/agents',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
      change: agents?.length > 0 ? `${activeAgents}/${agents.length}` : null,
    },
    {
      name: 'Conversations',
      value: conversations?.length || 0,
      icon: ChatBubbleLeftRightIcon,
      href: '/dashboard/conversations',
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      change: recentConversations > 0 ? `${recentConversations} today` : null,
    },
    {
      name: 'Total Messages',
      value: totalMessages,
      icon: ArrowTrendingUpIcon,
      href: '/dashboard/analytics',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20',
      change: totalMessages > 0 ? '↑' : null,
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

      {/* Getting Started Banner for New Users */}
      {isNewUser && (
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <RocketLaunchIcon className="h-12 w-12 flex-shrink-0" />
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">🚀 Welcome! Let's Get You Started</h2>
              <p className="text-blue-100 mb-4">
                Start your AI journey in just 3 simple steps. It takes less than 3 minutes!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="font-semibold mb-1">Step 1: Create Workspace</div>
                  <div className="text-sm text-blue-100">Organize your AI agents by team or project</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="font-semibold mb-1">Step 2: Build Agent</div>
                  <div className="text-sm text-blue-100">Create your first AI assistant</div>
                </div>
                <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                  <div className="font-semibold mb-1">Step 3: Start Chatting</div>
                  <div className="text-sm text-blue-100">Test your agent and see it in action</div>
                </div>
              </div>
              <Link
                href="/dashboard/getting-started"
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-semibold rounded-lg hover:bg-blue-50 transition"
              >
                Get Started Now →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.name}
            href={stat.href}
            className="bg-white dark:bg-gray-800 overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700 transition shadow-sm hover:shadow-md group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`flex-shrink-0 rounded-lg p-3 ${stat.bgColor} group-hover:scale-110 transition-transform`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                {stat.change && (
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {stat.change}
                  </span>
                )}
              </div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                {stat.name}
              </dt>
              <dd className="text-3xl font-bold text-gray-900 dark:text-white">
                {stat.value}
              </dd>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <FireIcon className="h-5 w-5 text-orange-500" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/dashboard/workspaces"
            className="flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition group"
          >
            <FolderIcon className="h-8 w-8 text-gray-400 group-hover:text-blue-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600 text-center">
              Create Workspace
            </span>
          </Link>
          <Link
            href="/dashboard/agents/new"
            className="flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition group"
          >
            <SparklesIcon className="h-8 w-8 text-gray-400 group-hover:text-purple-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-purple-600 text-center">
              Create Agent
            </span>
          </Link>
          <Link
            href="/dashboard/workflows"
            className="flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 transition group"
          >
            <BoltIcon className="h-8 w-8 text-gray-400 group-hover:text-green-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-green-600 text-center">
              Create Workflow
            </span>
          </Link>
          <Link
            href="/dashboard/conversations"
            className="flex flex-col items-center justify-center px-4 py-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition group"
          >
            <ChatBubbleLeftRightIcon className="h-8 w-8 text-gray-400 group-hover:text-orange-600 mb-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-orange-600 text-center">
              Start Chat
            </span>
          </Link>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Workspaces */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <FolderIcon className="h-5 w-5 text-blue-500" />
              Your Workspaces
            </h2>
            <Link href="/dashboard/workspaces" className="text-sm text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          {workspaces && workspaces.length > 0 ? (
            <div className="space-y-3">
              {workspaces.slice(0, 4).map((workspace: any) => (
                <Link
                  key={workspace.id}
                  href={`/dashboard/workspaces/${workspace.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">
                      {workspace.icon || '📁'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600">
                        {workspace.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {workspace.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    workspace.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {workspace.isActive ? 'Active' : 'Inactive'}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <FolderIcon className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No workspaces yet</p>
              <Link
                href="/dashboard/workspaces"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Create your first workspace
              </Link>
            </div>
          )}
        </Card>

        {/* Recent Agents */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <SparklesIcon className="h-5 w-5 text-purple-500" />
              Recent Agents
            </h2>
            <Link href="/dashboard/agents" className="text-sm text-primary-600 hover:text-primary-700">
              View all →
            </Link>
          </div>
          {agents && agents.length > 0 ? (
            <div className="space-y-3">
              {agents.slice(0, 4).map((agent: any) => (
                <Link
                  key={agent.id}
                  href={`/dashboard/agents/${agent.id}`}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition group"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                      <SparklesIcon className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600">
                        {agent.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        {agent.description || 'No description'}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    agent.isActive 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {agent.model}
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
        </Card>
      </div>

      {/* Recent Conversations */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <ClockIcon className="h-5 w-5 text-green-500" />
            Recent Activity
          </h2>
          <Link href="/dashboard/conversations" className="text-sm text-primary-600 hover:text-primary-700">
            View all →
          </Link>
        </div>
        {conversations && conversations.length > 0 ? (
          <div className="space-y-3">
            {conversations.slice(0, 5).map((conversation: any) => (
              <Link
                key={conversation.id}
                href={`/dashboard/conversations/${conversation.id}`}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition group"
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <ChatBubbleLeftRightIcon className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 truncate">
                      {conversation.agent?.name || 'Unknown Agent'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {conversation.messages?.length || 0} messages • {new Date(conversation.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ChatBubbleLeftRightIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">No conversations yet</p>
            <Link
              href="/dashboard/conversations"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              Start your first conversation
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
