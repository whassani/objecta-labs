'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { knowledgeBaseApi } from '@/lib/api'
import { 
  PlusIcon, 
  ArrowPathIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  DocumentTextIcon,
  CloudArrowUpIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'
import { Dialog } from '@headlessui/react'
import DocumentUploadModal from '@/components/knowledge-base/DocumentUploadModal'
import SemanticSearchModal from '@/components/knowledge-base/SemanticSearchModal'
import DocumentAnalytics from '@/components/knowledge-base/DocumentAnalytics'
import SearchHistory from '@/components/knowledge-base/SearchHistory'

const sourceIcons: any = {
  github: '🐙',
  confluence: '📘',
  notion: '📝',
  jira: '📊',
  slack: '💬',
  google_drive: '📁',
  file: '📄',
}

export default function KnowledgeBasePage() {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState<'sources' | 'documents' | 'analytics'>('sources')

  const { data: dataSources, isLoading } = useQuery({
    queryKey: ['dataSources'],
    queryFn: () => knowledgeBaseApi.getDataSources().then(res => res.data),
  })

  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => knowledgeBaseApi.getDocuments().then(res => res.data),
  })

  const syncMutation = useMutation({
    mutationFn: (id: string) => knowledgeBaseApi.syncDataSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
      toast.success('Sync started')
    },
    onError: () => {
      toast.error('Failed to start sync')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => knowledgeBaseApi.deleteDataSource(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dataSources'] })
      toast.success('Data source deleted')
    },
    onError: () => {
      toast.error('Failed to delete data source')
    },
  })

  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => knowledgeBaseApi.deleteDocument(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
      toast.success('Document deleted')
    },
    onError: () => {
      toast.error('Failed to delete document')
    },
  })

  const reindexMutation = useMutation({
    mutationFn: () => knowledgeBaseApi.reindexAllDocuments(),
    onSuccess: (response) => {
      toast.success(`Re-indexed ${response.data.successful} documents`)
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
    onError: () => {
      toast.error('Failed to re-index documents')
    },
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
      case 'syncing':
        return <ArrowPathIcon className="h-5 w-5 text-blue-500 animate-spin" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Connect external data sources and upload documents to enhance your agents
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsSearchModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
            Search
          </button>
          {activeTab === 'documents' && (
            <>
              <button
                onClick={() => {
                  if (confirm('Re-index all documents? This may take a few moments.')) {
                    reindexMutation.mutate()
                  }
                }}
                disabled={reindexMutation.isPending}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-5 w-5 mr-2 ${reindexMutation.isPending ? 'animate-spin' : ''}`} />
                {reindexMutation.isPending ? 'Re-indexing...' : 'Re-index All'}
              </button>
              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition"
              >
                <CloudArrowUpIcon className="h-5 w-5 mr-2" />
                Upload Document
              </button>
            </>
          )}
          {activeTab === 'sources' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Data Source
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sources')}
            className={`${
              activeTab === 'sources'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
          >
            Data Sources ({dataSources?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`${
              activeTab === 'documents'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
          >
            <DocumentTextIcon className="h-5 w-5 inline-block mr-1" />
            Documents ({documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`${
              activeTab === 'analytics'
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition`}
          >
            Analytics
          </button>
        </nav>
      </div>

      {/* Data Sources Grid */}
      {activeTab === 'sources' && (isLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-12 w-12 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : dataSources && dataSources.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {dataSources.map((source: any) => (
            <div
              key={source.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-primary-300 dark:hover:border-primary-700 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-12 w-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-2xl">
                    {sourceIcons[source.sourceType] || '📦'}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {source.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                      {source.sourceType.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(source.status)}
                </div>
              </div>

              {source.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {source.description}
                </p>
              )}

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-4 text-gray-500 dark:text-gray-400">
                  <span>Sync: {source.syncFrequency}</span>
                  {source.lastSyncedAt && (
                    <span>
                      Last: {new Date(source.lastSyncedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => syncMutation.mutate(source.id)}
                    disabled={syncMutation.isPending}
                    className="p-1 text-gray-400 hover:text-primary-600 disabled:opacity-50"
                    title="Sync now"
                  >
                    <ArrowPathIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this data source?')) {
                        deleteMutation.mutate(source.id)
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
          <div className="text-6xl mb-4">📚</div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No data sources</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Connect your first data source to get started.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Data Source
            </button>
          </div>
        </div>
      ))}

      {/* Documents Grid */}
      {activeTab === 'documents' && (documentsLoading ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
              <div className="h-16 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg mb-4" />
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full" />
            </div>
          ))}
        </div>
      ) : documents && documents.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {documents.map((doc: any) => (
            <div
              key={doc.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 hover:border-indigo-300 dark:hover:border-indigo-700 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-16 w-16 rounded-lg bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-3xl">
                    {doc.contentType === 'application/pdf' ? '📄' : '📝'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                      {doc.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {doc.chunkCount} chunks
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Status</span>
                  <span className={`px-2 py-1 rounded-full ${
                    doc.processingStatus === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : doc.processingStatus === 'processing'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                      : doc.processingStatus === 'failed'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                  }`}>
                    {doc.processingStatus}
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Created</span>
                  <span className="text-gray-900 dark:text-white">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this document?')) {
                      deleteDocumentMutation.mutate(doc.id)
                    }
                  }}
                  className="p-1 text-gray-400 hover:text-red-600"
                  title="Delete"
                >
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-6xl mb-4">📄</div>
          <h3 className="mt-2 text-sm font-semibold text-gray-900 dark:text-white">No documents</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Upload your first document to get started.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <CloudArrowUpIcon className="h-5 w-5 mr-2" />
              Upload Document
            </button>
          </div>
        </div>
      ))}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <DocumentAnalytics />
          
          {/* Search History */}
          <SearchHistory />
          
          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Documents</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{documents?.length || 0}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Data Sources</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{dataSources?.length || 0}</div>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">RAG-Enabled</div>
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">Active</div>
            </div>
          </div>
        </div>
      )}

      {/* Add Data Source Modal */}
      <AddDataSourceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Upload Document Modal */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
      />

      {/* Semantic Search Modal */}
      <SemanticSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  )
}

function AddDataSourceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const queryClient = useQueryClient()
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const sources = [
    { type: 'github', name: 'GitHub', icon: '🐙', description: 'Code, wikis, issues' },
    { type: 'confluence', name: 'Confluence', icon: '📘', description: 'Pages, spaces' },
    { type: 'notion', name: 'Notion', icon: '📝', description: 'Pages, databases' },
    { type: 'jira', name: 'Jira', icon: '📊', description: 'Issues, comments' },
    { type: 'slack', name: 'Slack', icon: '💬', description: 'Messages, files' },
    { type: 'google_drive', name: 'Google Drive', icon: '📁', description: 'Docs, sheets' },
    { type: 'file', name: 'File Upload', icon: '📄', description: 'PDF, DOCX, TXT' },
  ]

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-2xl w-full rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl">
          <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Connect Data Source
          </Dialog.Title>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Choose a data source to connect to your knowledge base
          </p>

          <div className="grid grid-cols-2 gap-4 mb-6">
            {sources.map((source) => (
              <button
                key={source.type}
                onClick={() => setSelectedType(source.type)}
                className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-primary-500 transition text-left"
              >
                <div className="text-3xl mb-2">{source.icon}</div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{source.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{source.description}</p>
              </button>
            ))}
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              disabled={!selectedType}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
