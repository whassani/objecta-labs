'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toolsApi } from '@/lib/api'
import { 
  PlusIcon, 
  WrenchScrewdriverIcon,
  TrashIcon,
  PencilIcon,
  BeakerIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  CheckIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import CreateToolModal from '@/components/tools/CreateToolModal'
import TestToolModal from '@/components/tools/TestToolModal'
import ToolTemplatesModal from '@/components/tools/ToolTemplatesModal'
import ImportToolsModal from '@/components/tools/ImportToolsModal'
import AnalyticsDashboard from '@/components/tools/AnalyticsDashboard'

const actionTypeColors: any = {
  read: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  write: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  update: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  delete: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
}

export default function ToolsPage() {
  const queryClient = useQueryClient()
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTool, setEditingTool] = useState<any>(null)
  const [testingTool, setTestingTool] = useState<any>(null)
  const [selectedTools, setSelectedTools] = useState<string[]>([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [activeView, setActiveView] = useState<'tools' | 'analytics'>('tools')

  const { data: tools, isLoading } = useQuery({
    queryKey: ['tools'],
    queryFn: () => toolsApi.getAll().then(res => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => toolsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tool deleted successfully')
    },
    onError: () => {
      toast.error('Failed to delete tool')
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name?: string }) => toolsApi.duplicate(id, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tool duplicated successfully')
    },
    onError: () => {
      toast.error('Failed to duplicate tool')
    },
  })

  const bulkEnableMutation = useMutation({
    mutationFn: (ids: string[]) => toolsApi.bulkEnable(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tools enabled successfully')
      setSelectedTools([])
      setShowBulkActions(false)
    },
  })

  const bulkDisableMutation = useMutation({
    mutationFn: (ids: string[]) => toolsApi.bulkDisable(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tools disabled successfully')
      setSelectedTools([])
      setShowBulkActions(false)
    },
  })

  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => toolsApi.bulkDelete(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tools deleted successfully')
      setSelectedTools([])
      setShowBulkActions(false)
    },
  })

  const exportMutation = useMutation({
    mutationFn: (ids?: string[]) => toolsApi.export(ids),
    onSuccess: (response) => {
      const data = JSON.stringify(response.data, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `tools-export-${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Tools exported successfully')
      setSelectedTools([])
    },
  })

  const handleToggleSelect = (id: string) => {
    setSelectedTools(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedTools.length === tools?.length) {
      setSelectedTools([])
    } else {
      setSelectedTools(tools?.map((t: any) => t.id) || [])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tools & Actions</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Configure tools that agents can use to perform actions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setActiveView('tools')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                activeView === 'tools'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Tools
            </button>
            <button
              onClick={() => setActiveView('analytics')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition ${
                activeView === 'analytics'
                  ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Analytics
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons - Only show in tools view */}
      {activeView === 'tools' && (
        <div className="flex gap-2 justify-end">{selectedTools.length > 0 && (
            <div className="flex items-center gap-2 mr-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {selectedTools.length} selected
              </span>
            </div>
          )}
          <button
            onClick={() => setShowTemplates(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Templates
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
            Import
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Tool
          </button>
        </div>
      )}

      {/* Content based on active view */}
      {activeView === 'analytics' ? (
        <AnalyticsDashboard />
      ) : (
        <>
      {/* Bulk Actions Bar */}
      {selectedTools.length > 0 && (
        <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-primary-900 dark:text-primary-100">
              Bulk Actions
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => bulkEnableMutation.mutate(selectedTools)}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-green-600 text-white rounded-md hover:bg-green-700 transition"
              >
                Enable
              </button>
              <button
                onClick={() => bulkDisableMutation.mutate(selectedTools)}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-yellow-600 text-white rounded-md hover:bg-yellow-700 transition"
              >
                Disable
              </button>
              <button
                onClick={() => exportMutation.mutate(selectedTools)}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                <ArrowUpTrayIcon className="h-4 w-4 mr-1" />
                Export
              </button>
              <button
                onClick={() => {
                  if (confirm(`Delete ${selectedTools.length} tools?`)) {
                    bulkDeleteMutation.mutate(selectedTools)
                  }
                }}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 transition"
              >
                Delete
              </button>
              <button
                onClick={() => setSelectedTools([])}
                className="inline-flex items-center px-3 py-1.5 text-sm bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tools List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : tools && tools.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={selectedTools.length === tools.length}
              onChange={handleSelectAll}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-600 dark:text-gray-400">
              Select all
            </span>
          </div>
          {tools.map((tool: any) => (
            <div
              key={tool.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border p-6 transition ${
                selectedTools.includes(tool.id)
                  ? 'border-primary-500 dark:border-primary-500'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-700'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <input
                    type="checkbox"
                    checked={selectedTools.includes(tool.id)}
                    onChange={() => handleToggleSelect(tool.id)}
                    className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                    <WrenchScrewdriverIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tool.name}
                      </h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${actionTypeColors[tool.actionType]}`}>
                        {tool.actionType}
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {tool.toolType}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {tool.description}
                    </p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                      <span>Rate limit: {tool.rateLimit}/min</span>
                      {tool.requiresApproval && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                          Requires approval
                        </span>
                      )}
                      <span className={tool.isEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                        {tool.isEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => duplicateMutation.mutate({ id: tool.id })}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Duplicate"
                  >
                    <DocumentDuplicateIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setTestingTool(tool)}
                    className="p-1 text-gray-400 hover:text-green-600"
                    title="Test Tool"
                  >
                    <BeakerIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setEditingTool(tool)}
                    className="p-1 text-gray-400 hover:text-primary-600"
                    title="Edit"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this tool?')) {
                        deleteMutation.mutate(tool.id)
                      }
                    }}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Delete"
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <WrenchScrewdriverIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No tools</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Get started by creating your first tool.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Tool
            </button>
          </div>
        </div>
      )}

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <WrenchScrewdriverIcon className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300">
                About Tools & Actions
              </h3>
              <div className="mt-2 text-sm text-blue-700 dark:text-blue-400">
                <p>
                  Tools enable your agents to perform actions like making API calls, performing calculations,
                  and executing custom logic. Test tools before assigning them to agents.
                </p>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      {/* Modals */}
      <CreateToolModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      {editingTool && (
        <CreateToolModal
          isOpen={!!editingTool}
          onClose={() => setEditingTool(null)}
          tool={editingTool}
        />
      )}

      {testingTool && (
        <TestToolModal
          isOpen={!!testingTool}
          onClose={() => setTestingTool(null)}
          tool={testingTool}
        />
      )}

      <ToolTemplatesModal
        isOpen={showTemplates}
        onClose={() => setShowTemplates(false)}
      />

      <ImportToolsModal
        isOpen={showImport}
        onClose={() => setShowImport(false)}
      />
    </div>
  )
}
