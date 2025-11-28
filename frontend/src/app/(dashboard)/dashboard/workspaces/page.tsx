'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspacesApi } from '@/lib/api'
import Link from 'next/link'
import { 
  PlusIcon, 
  FolderIcon,
  Cog6ToothIcon,
  TrashIcon,
  PencilIcon,
  SparklesIcon,
  UsersIcon,
  ChartBarIcon,
  RocketLaunchIcon,
  AcademicCapIcon,
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

// Workspace Templates
const WORKSPACE_TEMPLATES = [
  {
    id: 'blank',
    name: 'Blank Workspace',
    description: 'Start from scratch with an empty workspace',
    icon: '📁',
    color: 'gray',
    iconComponent: FolderIcon,
  },
  {
    id: 'marketing',
    name: 'Marketing Team',
    description: 'Content generation, social media, campaigns',
    icon: '📢',
    color: 'purple',
    iconComponent: SparklesIcon,
    presets: {
      agents: ['Content Generator', 'Social Media Assistant'],
      workflows: ['Campaign Automation'],
    }
  },
  {
    id: 'sales',
    name: 'Sales Operations',
    description: 'Lead qualification, email outreach, CRM automation',
    icon: '💼',
    color: 'blue',
    iconComponent: BriefcaseIcon,
    presets: {
      agents: ['Lead Qualifier', 'Email Assistant'],
      workflows: ['Follow-up Automation'],
    }
  },
  {
    id: 'support',
    name: 'Customer Support',
    description: 'Help desk automation, ticket routing, FAQ',
    icon: '💬',
    color: 'green',
    iconComponent: ChatBubbleLeftRightIcon,
    presets: {
      agents: ['Support Bot', 'FAQ Assistant'],
      workflows: ['Ticket Routing'],
    }
  },
  {
    id: 'hr',
    name: 'Human Resources',
    description: 'Resume screening, onboarding, employee support',
    icon: '👥',
    color: 'pink',
    iconComponent: UsersIcon,
    presets: {
      agents: ['Resume Screener', 'Onboarding Assistant'],
      workflows: ['Candidate Pipeline'],
    }
  },
  {
    id: 'analytics',
    name: 'Data & Analytics',
    description: 'Report generation, data analysis, insights',
    icon: '📊',
    color: 'orange',
    iconComponent: ChartBarIcon,
    presets: {
      agents: ['Data Analyst', 'Report Generator'],
      workflows: ['Weekly Reports'],
    }
  },
  {
    id: 'product',
    name: 'Product Development',
    description: 'Feature planning, user research, roadmaps',
    icon: '🚀',
    color: 'indigo',
    iconComponent: RocketLaunchIcon,
    presets: {
      agents: ['Product Assistant', 'User Research Bot'],
      workflows: ['Feature Planning'],
    }
  },
  {
    id: 'education',
    name: 'Education & Training',
    description: 'Course creation, tutoring, assessment',
    icon: '🎓',
    color: 'teal',
    iconComponent: AcademicCapIcon,
    presets: {
      agents: ['Tutor Bot', 'Quiz Generator'],
      workflows: ['Course Automation'],
    }
  },
  {
    id: 'ecommerce',
    name: 'E-Commerce',
    description: 'Product descriptions, customer service, inventory',
    icon: '🛍️',
    color: 'red',
    iconComponent: ShoppingBagIcon,
    presets: {
      agents: ['Product Description Writer', 'Order Assistant'],
      workflows: ['Order Processing'],
    }
  },
];

const COLOR_CLASSES = {
  gray: 'bg-gray-100 text-gray-800 border-gray-200',
  purple: 'bg-purple-100 text-purple-800 border-purple-200',
  blue: 'bg-blue-100 text-blue-800 border-blue-200',
  green: 'bg-green-100 text-green-800 border-green-200',
  pink: 'bg-pink-100 text-pink-800 border-pink-200',
  orange: 'bg-orange-100 text-orange-800 border-orange-200',
  indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  teal: 'bg-teal-100 text-teal-800 border-teal-200',
  red: 'bg-red-100 text-red-800 border-red-200',
};

export default function WorkspacesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '📁',
  })

  const queryClient = useQueryClient()

  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesApi.getAll().then(res => res.data),
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => workspacesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setShowCreateModal(false)
      setShowTemplates(false)
      setFormData({ name: '', description: '', icon: '📁' })
      setSelectedTemplate(null)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => workspacesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
    },
  })

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template)
    setFormData({
      name: template.id === 'blank' ? '' : template.name,
      description: template.description,
      icon: template.icon,
    })
    setShowTemplates(false)
    setShowCreateModal(true)
  }

  const handleCreate = () => {
    createMutation.mutate({
      ...formData,
      settings: selectedTemplate?.presets || {},
    })
  }

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this workspace? This action cannot be undone.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workspaces</h1>
          <p className="mt-2 text-gray-600">
            Organize your agents, workflows, and resources by team or project
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowTemplates(true)}
          >
            <SparklesIcon className="h-5 w-5 mr-2" />
            Browse Templates
          </Button>
          <Button onClick={() => {
            setSelectedTemplate(null)
            setFormData({ name: '', description: '', icon: '📁' })
            setShowCreateModal(true)
          }}>
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Workspace
          </Button>
        </div>
      </div>

      {/* Stats */}
      {workspaces && workspaces.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Workspaces</p>
                <p className="text-2xl font-bold text-gray-900">{workspaces.length}</p>
              </div>
              <FolderIcon className="h-8 w-8 text-blue-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Workspaces</p>
                <p className="text-2xl font-bold text-gray-900">
                  {workspaces.filter((w: any) => w.isActive).length}
                </p>
              </div>
              <SparklesIcon className="h-8 w-8 text-green-600" />
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Team Members</p>
                <p className="text-2xl font-bold text-gray-900">
                  {/* This would come from API */}
                  -
                </p>
              </div>
              <UsersIcon className="h-8 w-8 text-purple-600" />
            </div>
          </Card>
        </div>
      )}

      {/* Workspaces Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-full" />
            </div>
          ))}
        </div>
      ) : workspaces && workspaces.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {workspaces.map((workspace: any) => (
            <Link
              key={workspace.id}
              href={`/dashboard/workspaces/${workspace.id}`}
              className="group relative bg-white rounded-lg border border-gray-200 p-6 hover:border-blue-300 hover:shadow-md transition-all"
            >
              {/* Delete Button */}
              <button
                onClick={(e) => handleDelete(workspace.id, e)}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded"
              >
                <TrashIcon className="h-4 w-4 text-red-600" />
              </button>

              {/* Icon */}
              <div className="flex items-center gap-4 mb-4">
                <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center text-2xl">
                  {workspace.icon || '📁'}
                </div>
                {workspace.isActive === false && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {workspace.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                {workspace.description || 'No description'}
              </p>

              {/* Footer */}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Created {new Date(workspace.createdAt).toLocaleDateString()}</span>
                <div className="flex items-center gap-1">
                  <Cog6ToothIcon className="h-4 w-4" />
                  <span>Manage</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg border border-gray-200">
          <FolderIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No workspaces yet</h3>
          <p className="text-sm text-gray-600 mb-6">
            Create your first workspace to organize your AI agents and workflows
          </p>
          <div className="flex justify-center gap-3">
            <Button variant="outline" onClick={() => setShowTemplates(true)}>
              <SparklesIcon className="h-5 w-5 mr-2" />
              Browse Templates
            </Button>
            <Button onClick={() => setShowCreateModal(true)}>
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Workspace
            </Button>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Choose a Template</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Start with a pre-configured workspace or build your own
                </p>
              </div>
              <button
                onClick={() => setShowTemplates(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {WORKSPACE_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`text-left p-4 rounded-lg border-2 hover:shadow-md transition-all ${
                    COLOR_CLASSES[template.color as keyof typeof COLOR_CLASSES]
                  }`}
                >
                  <div className="text-3xl mb-3">{template.icon}</div>
                  <h3 className="font-semibold text-gray-900 mb-1">{template.name}</h3>
                  <p className="text-xs text-gray-600 mb-3">{template.description}</p>
                  
                  {template.presets && (
                    <div className="text-xs text-gray-500">
                      <p className="font-medium mb-1">Includes:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {template.presets.agents && (
                          <li>{template.presets.agents.length} pre-built agents</li>
                        )}
                        {template.presets.workflows && (
                          <li>{template.presets.workflows.length} workflow templates</li>
                        )}
                      </ul>
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={() => setShowTemplates(false)}>
                Cancel
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {selectedTemplate ? `Create ${selectedTemplate.name}` : 'Create Workspace'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Workspace Name
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Marketing Team"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="What is this workspace for?"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (Emoji)
                </label>
                <Input
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  placeholder="📁"
                  maxLength={2}
                />
              </div>

              {selectedTemplate?.presets && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm font-medium text-blue-900 mb-2">
                    This workspace will include:
                  </p>
                  <ul className="text-xs text-blue-800 space-y-1">
                    {selectedTemplate.presets.agents && (
                      <li>• {selectedTemplate.presets.agents.join(', ')}</li>
                    )}
                    {selectedTemplate.presets.workflows && (
                      <li>• {selectedTemplate.presets.workflows.join(', ')}</li>
                    )}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false)
                  setSelectedTemplate(null)
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={!formData.name || createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Create Workspace'}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
