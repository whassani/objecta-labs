'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { workspacesApi } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'

export default function WorkspaceSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const workspaceId = params.id as string

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    isActive: true,
  })

  const [isEditing, setIsEditing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { data: workspace, isLoading } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspacesApi.getOne(workspaceId).then(res => {
      const data = res.data
      setFormData({
        name: data.name,
        description: data.description || '',
        icon: data.icon || '📁',
        isActive: data.isActive,
      })
      return data
    }),
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => workspacesApi.update(workspaceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspace', workspaceId] })
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      setIsEditing(false)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => workspacesApi.delete(workspaceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] })
      router.push('/dashboard/workspaces')
    },
  })

  const handleSave = () => {
    updateMutation.mutate(formData)
  }

  const handleCancel = () => {
    if (workspace) {
      setFormData({
        name: workspace.name,
        description: workspace.description || '',
        icon: workspace.icon || '📁',
        isActive: workspace.isActive,
      })
    }
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteMutation.mutate()
  }

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
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/dashboard/workspaces/${workspaceId}`)}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Workspace
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900">Workspace Settings</h1>
        <p className="text-gray-600 mt-2">
          Manage your workspace configuration and preferences
        </p>
      </div>

      {/* General Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">General</h2>
            <p className="text-sm text-gray-600 mt-1">
              Basic information about your workspace
            </p>
          </div>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={updateMutation.isPending}
              >
                <XMarkIcon className="h-5 w-5 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateMutation.isPending || !formData.name}
              >
                <CheckIcon className="h-5 w-5 mr-2" />
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Workspace Name
            </label>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Marketing Team"
              />
            ) : (
              <p className="text-gray-900">{workspace.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            {isEditing ? (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What is this workspace for?"
                rows={3}
              />
            ) : (
              <p className="text-gray-900">{workspace.description || 'No description'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Icon (Emoji)
            </label>
            {isEditing ? (
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="📁"
                maxLength={2}
                className="w-32"
              />
            ) : (
              <p className="text-2xl">{workspace.icon || '📁'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex items-center gap-3">
              {isEditing ? (
                <>
                  <Switch
                    checked={formData.isActive}
                    onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  />
                  <span className="text-sm text-gray-700">
                    {formData.isActive ? 'Active' : 'Inactive'}
                  </span>
                </>
              ) : (
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  workspace.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {workspace.isActive ? 'Active' : 'Inactive'}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Inactive workspaces are hidden from the main list
            </p>
          </div>
        </div>
      </Card>

      {/* Template Information (Read-only) */}
      {workspace.settings?.presets && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Template Information</h2>
          <p className="text-sm text-gray-600 mb-4">
            This workspace was created from a template with the following presets:
          </p>
          <div className="space-y-2 text-sm">
            {workspace.settings.presets.agents && (
              <div>
                <span className="font-medium text-gray-900">Agents:</span>{' '}
                <span className="text-gray-700">{workspace.settings.presets.agents.join(', ')}</span>
              </div>
            )}
            {workspace.settings.presets.workflows && (
              <div>
                <span className="font-medium text-gray-900">Workflows:</span>{' '}
                <span className="text-gray-700">{workspace.settings.presets.workflows.join(', ')}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Metadata */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Metadata</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Workspace ID:</span>
            <span className="text-gray-900 font-mono text-xs">{workspace.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="text-gray-900">{new Date(workspace.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Updated:</span>
            <span className="text-gray-900">{new Date(workspace.updatedAt).toLocaleString()}</span>
          </div>
        </div>
      </Card>

      {/* Danger Zone */}
      <Card className="p-6 border-red-200">
        <h2 className="text-xl font-bold text-red-900 mb-2">Danger Zone</h2>
        <p className="text-sm text-gray-600 mb-4">
          Once you delete a workspace, there is no going back. Please be certain.
        </p>

        {!showDeleteConfirm ? (
          <Button
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <TrashIcon className="h-5 w-5 mr-2" />
            Delete Workspace
          </Button>
        ) : (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm font-medium text-red-900 mb-3">
              Are you absolutely sure? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <TrashIcon className="h-5 w-5 mr-2" />
                {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete Workspace'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
