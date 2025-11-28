'use client'

import { useQuery } from '@tanstack/react-query'
import { workspacesApi, agentsApi } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeftIcon, 
  Cog6ToothIcon,
  PlusIcon,
  UsersIcon,
  SparklesIcon,
  DocumentTextIcon,
  WrenchIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function WorkspaceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspacesApi.getOne(workspaceId).then(res => res.data),
  })

  const { data: allAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.getAll().then(res => res.data),
  })
  
  // Filter agents by workspace
  const agents = allAgents?.filter((agent: any) => agent.workspaceId === workspaceId)

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    )
  }

  if (!workspace) {
    return (
      <div className="text-center py-16">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Workspace not found</h3>
        <p className="text-sm text-gray-600 mb-6">
          This workspace doesn't exist or you don't have access to it.
        </p>
        <Button onClick={() => router.push('/dashboard/workspaces')}>
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Workspaces
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push('/dashboard/workspaces')}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center text-4xl">
              {workspace.icon || '📁'}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{workspace.name}</h1>
              <p className="text-gray-600 mt-1">{workspace.description || 'No description'}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={workspace.isActive ? 'default' : 'secondary'}>
                  {workspace.isActive ? 'Active' : 'Inactive'}
                </Badge>
                <span className="text-xs text-gray-500">
                  Created {new Date(workspace.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <Link href={`/dashboard/workspaces/${workspaceId}/settings`}>
            <Button variant="outline">
              <Cog6ToothIcon className="h-5 w-5 mr-2" />
              Settings
            </Button>
          </Link>
        </div>
      </div>

      {/* Template Info */}
      {workspace.settings?.presets && (
        <Card className="p-4 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <SparklesIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-1">Created from Template</h3>
              <p className="text-sm text-blue-800 mb-2">
                This workspace was created with pre-configured resources:
              </p>
              <div className="space-y-1 text-sm text-blue-700">
                {workspace.settings.presets.agents && (
                  <div>• {workspace.settings.presets.agents.length} agent(s): {workspace.settings.presets.agents.join(', ')}</div>
                )}
                {workspace.settings.presets.workflows && (
                  <div>• {workspace.settings.presets.workflows.length} workflow(s): {workspace.settings.presets.workflows.join(', ')}</div>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href={`/dashboard/workspaces/${workspaceId}/members`}>
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <UsersIcon className="h-12 w-12 text-orange-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Members</h3>
                <p className="text-sm text-gray-600">Manage workspace members</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href={`/dashboard/workspaces/${workspaceId}/analytics`}>
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <ChartBarIcon className="h-12 w-12 text-blue-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">View workspace insights</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link href={`/dashboard/workspaces/${workspaceId}/settings`}>
          <Card className="p-6 hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-center gap-4">
              <Cog6ToothIcon className="h-12 w-12 text-gray-600" />
              <div>
                <h3 className="font-semibold text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600">Configure workspace</p>
              </div>
            </div>
          </Card>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Agents</p>
              <p className="text-2xl font-bold text-gray-900">{agents?.length || 0}</p>
            </div>
            <SparklesIcon className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Workflows</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <WrenchIcon className="h-8 w-8 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Documents</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
            </div>
            <DocumentTextIcon className="h-8 w-8 text-green-600" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-2xl font-bold text-gray-900">1</p>
            </div>
            <UsersIcon className="h-8 w-8 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Agents Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Agents</h2>
          <Link href={`/dashboard/agents?workspace=${workspaceId}`}>
            <Button>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Agent
            </Button>
          </Link>
        </div>

        {agents && agents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents.map((agent: any) => (
              <Link key={agent.id} href={`/dashboard/agents/${agent.id}`}>
                <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                  <h3 className="font-semibold text-gray-900 mb-1">{agent.name}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                    {agent.description || 'No description'}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{agent.model}</span>
                    <Badge variant="secondary">
                      {agent.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <Card className="p-8 text-center">
            <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No agents yet</h3>
            <p className="text-sm text-gray-600 mb-4">
              Create your first AI agent to get started
            </p>
            <Link href={`/dashboard/agents?workspace=${workspaceId}`}>
              <Button>
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Agent
              </Button>
            </Link>
          </Card>
        )}
      </div>

      {/* Workflows Section (Placeholder) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Workflows</h2>
          <Link href={`/dashboard/workflows?workspace=${workspaceId}`}>
            <Button variant="outline">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Workflow
            </Button>
          </Link>
        </div>

        <Card className="p-8 text-center">
          <WrenchIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No workflows yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Create automated workflows for this workspace
          </p>
          <Link href={`/dashboard/workflows?workspace=${workspaceId}`}>
            <Button variant="outline">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Workflow
            </Button>
          </Link>
        </Card>
      </div>

      {/* Knowledge Base Section (Placeholder) */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Knowledge Base</h2>
          <Link href={`/dashboard/knowledge-base?workspace=${workspaceId}`}>
            <Button variant="outline">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Documents
            </Button>
          </Link>
        </div>

        <Card className="p-8 text-center">
          <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents yet</h3>
          <p className="text-sm text-gray-600 mb-4">
            Upload documents to create a knowledge base for your agents
          </p>
          <Link href={`/dashboard/knowledge-base?workspace=${workspaceId}`}>
            <Button variant="outline">
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Documents
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  )
}
