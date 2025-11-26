'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowPathIcon,
  CircleStackIcon,
  DocumentTextIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  CloudArrowUpIcon,
  FunnelIcon,
  LinkIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import { DataSourceManager } from '@/components/knowledge-base/DataSourceManager'
import DocumentUploadModal from '@/components/knowledge-base/DocumentUploadModal'
import SemanticSearchModal from '@/components/knowledge-base/SemanticSearchModal'
import DocumentAnalytics from '@/components/knowledge-base/DocumentAnalytics'
import SearchHistory from '@/components/knowledge-base/SearchHistory'
import DocumentViewModal from '@/components/knowledge-base/DocumentViewModal'

type TabType = 'sync' | 'documents' | 'analytics' | 'search'

export default function KnowledgeBasePage() {
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('sync')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20

  // Fetch documents
  const { data: documents, isLoading: documentsLoading } = useQuery({
    queryKey: ['documents'],
    queryFn: () => api.get('/knowledge-base/documents').then(res => res.data),
  })

  // Fetch data sources
  const { data: dataSources } = useQuery({
    queryKey: ['dataSources'],
    queryFn: () => api.get('/knowledge-base/data-sources').then(res => res.data),
  })

  // Delete document mutation
  const deleteDocumentMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/knowledge-base/documents/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  // Re-embed document mutation
  const reembedDocumentMutation = useMutation({
    mutationFn: (id: string) => api.post(`/knowledge-base/documents/${id}/index`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] })
    },
  })

  // Deduplicate documents by title and data source (in case of sync duplicates)
  const deduplicatedDocuments = documents?.reduce((acc: any[], doc: any) => {
    // Create a unique key based on title and data source
    const key = `${doc.title}-${doc.dataSourceId || 'manual'}-${doc.url || ''}`
    
    // Check if we already have a document with this key
    const existingIndex = acc.findIndex((d: any) => 
      `${d.title}-${d.dataSourceId || 'manual'}-${d.url || ''}` === key
    )
    
    if (existingIndex === -1) {
      // New document, add it
      acc.push(doc)
    } else {
      // Duplicate found - keep the one with more chunks or newer date
      const existing = acc[existingIndex]
      if ((doc.chunkCount || 0) > (existing.chunkCount || 0) || 
          new Date(doc.createdAt) > new Date(existing.createdAt)) {
        acc[existingIndex] = doc
      }
    }
    
    return acc
  }, []) || []

  // Filter documents
  const filteredDocuments = deduplicatedDocuments.filter((doc: any) => {
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory
    const matchesSearch = !searchQuery || 
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.content?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  // Paginate
  const totalPages = Math.ceil(filteredDocuments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedDocuments = filteredDocuments.slice(startIndex, startIndex + itemsPerPage)

  // Reset page when filters change
  const resetPage = () => setCurrentPage(1)

  // Get unique categories
  const categories: string[] = ['all', ...Array.from(new Set(documents?.map((d: any) => d.category).filter(Boolean) || [])) as string[]]

  const handleDeleteDocument = (id: string, title: string) => {
    if (confirm(`Delete "${title}"? This will also remove all associated vectors.`)) {
      deleteDocumentMutation.mutate(id)
    }
  }

  const handleReembedDocument = (id: string, title: string) => {
    if (confirm(`Re-embed "${title}"? This will regenerate embeddings for all chunks.`)) {
      reembedDocumentMutation.mutate(id)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'processing': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700'
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getDataSourceInfo = (dataSourceId: string) => {
    const source = dataSources?.find((ds: any) => ds.id === dataSourceId)
    if (!source) return null
    
    return {
      name: source.name,
      type: source.sourceType,
      icon: getSourceTypeIcon(source.sourceType),
    }
  }

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'github': return '🐙'
      case 'confluence': return '🌐'
      case 'notion': return '📝'
      case 'google-drive': return '☁️'
      default: return '🔗'
    }
  }

  // Helper to extract directory path from full path
  const getDirectoryPath = (fullPath: string | undefined) => {
    if (!fullPath) return null
    const parts = fullPath.split('/')
    if (parts.length <= 1) return null
    return parts.slice(0, -1).join('/') + '/'
  }

  // Helper to get display name with path context
  const getDocumentDisplayInfo = (doc: any, allDocs: any[]) => {
    const title = doc.title
    const sourcePath = doc.sourcePath || doc.metadata?.path
    
    // Check if there are other documents with the same title
    const duplicates = allDocs.filter((d: any) => d.title === title && d.id !== doc.id)
    
    if (duplicates.length === 0) {
      // No duplicates, just show title
      return { displayName: title, pathContext: null, showPath: false }
    }
    
    // There are duplicates, show path context
    const dirPath = getDirectoryPath(sourcePath)
    return {
      displayName: title,
      pathContext: dirPath || sourcePath || 'root',
      showPath: true,
      fullPath: sourcePath
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Knowledge Base
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Manage documents, data sources, and semantic search
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowSearchModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            <span>Search</span>
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <CloudArrowUpIcon className="w-5 h-5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('sync')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'sync'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ArrowPathIcon className="w-5 h-5" />
            Data Sources
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'documents'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <DocumentTextIcon className="w-5 h-5" />
            Documents ({documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'analytics'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <ChartBarIcon className="w-5 h-5" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition ${
              activeTab === 'search'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
            Search History
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {/* Data Sources Tab */}
        {activeTab === 'sync' && (
          <motion.div
            key="sync"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DataSourceManager />
          </motion.div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <motion.div
            key="documents"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Filters & Stats */}
            <div className="flex items-center justify-between gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search documents..."
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); resetPage(); }}
                    className="flex-1 bg-transparent border-none focus:outline-none text-gray-900 dark:text-white placeholder-gray-400"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <FunnelIcon className="w-5 h-5 text-gray-400" />
                  <select
                    value={selectedCategory}
                    onChange={(e) => { setSelectedCategory(e.target.value); resetPage(); }}
                    className="px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {categories.map((cat) => (
                      <option key={String(cat)} value={String(cat)}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {filteredDocuments.length} documents
                </span>
                <div className="flex gap-1 border border-gray-300 dark:border-gray-600 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 rounded ${viewMode === 'list' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    title="List view"
                  >
                    <ListBulletIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 rounded ${viewMode === 'grid' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    title="Grid view"
                  >
                    <Squares2X2Icon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Documents Grid */}
            {documentsLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : paginatedDocuments.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <CircleStackIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery || selectedCategory !== 'all' ? 'No documents found' : 'No documents yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery || selectedCategory !== 'all' 
                    ? 'Try adjusting your filters'
                    : 'Upload documents or sync from external sources'}
                </p>
                {!searchQuery && selectedCategory === 'all' && (
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlusIcon className="w-5 h-5" />
                    Upload Document
                  </button>
                )}
              </div>
            ) : (
              <>
                {/* Grid View */}
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedDocuments.map((doc: any) => {
                      const displayInfo = getDocumentDisplayInfo(doc, deduplicatedDocuments)
                      return (
                  <motion.div
                    key={doc.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
                          {displayInfo.displayName}
                        </h3>
                        {displayInfo.showPath && displayInfo.pathContext && (
                          <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mb-1" title={displayInfo.fullPath}>
                            <span>📁</span>
                            <span className="truncate">{displayInfo.pathContext}</span>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(doc.createdAt)}
                        </p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc.processingStatus)}`}>
                        {doc.processingStatus}
                      </span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {doc.category && (
                        <div>
                          <span className="inline-block px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                            {doc.category}
                          </span>
                        </div>
                      )}

                      {/* Source Information */}
                      {doc.dataSourceId && (() => {
                        const sourceInfo = getDataSourceInfo(doc.dataSourceId)
                        return sourceInfo ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <span className="flex-shrink-0">{sourceInfo.icon}</span>
                            <span className="truncate">
                              Synced from <span className="font-medium text-blue-600 dark:text-blue-400">
                                {sourceInfo.name}
                              </span>
                              <span className="text-gray-500 dark:text-gray-500">
                                {' '}({sourceInfo.type})
                              </span>
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <LinkIcon className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">From data source</span>
                          </div>
                        )
                      })()}

                      {doc.url && !doc.dataSourceId && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <LinkIcon className="w-3 h-3 flex-shrink-0" />
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {new URL(doc.url).hostname}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                      <span>{doc.chunkCount || 0} chunks</span>
                      {doc.contentType && (
                        <span className="text-xs">{doc.contentType}</span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDocumentId(doc.id)
                          setShowViewModal(true)
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors text-sm"
                      >
                        <EyeIcon className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleReembedDocument(doc.id, doc.title)}
                        className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                        title="Re-embed document"
                      >
                        <SparklesIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDocument(doc.id, doc.title)}
                        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                        title="Delete document"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                )
                    })}
                  </div>
                )}

                {/* List View */}
                {viewMode === 'list' && (
                  <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                      <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Document
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Source
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Chunks
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {paginatedDocuments.map((doc: any) => {
                          const sourceInfo = doc.dataSourceId ? getDataSourceInfo(doc.dataSourceId) : null
                          const displayInfo = getDocumentDisplayInfo(doc, deduplicatedDocuments)
                          return (
                            <tr key={doc.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-start gap-3">
                                  <DocumentTextIcon className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                                  <div className="min-w-0">
                                    <div className="font-medium text-gray-900 dark:text-white truncate">
                                      {displayInfo.displayName}
                                    </div>
                                    {displayInfo.showPath && displayInfo.pathContext && (
                                      <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 mt-1" title={displayInfo.fullPath}>
                                        <span>📁</span>
                                        <span className="truncate">{displayInfo.pathContext}</span>
                                      </div>
                                    )}
                                    {doc.category && (
                                      <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded">
                                        {doc.category}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                {sourceInfo ? (
                                  <div className="flex items-center gap-2 text-sm">
                                    <span>{sourceInfo.icon}</span>
                                    <div className="min-w-0">
                                      <div className="font-medium text-gray-900 dark:text-white truncate">
                                        {sourceInfo.name}
                                      </div>
                                      <div className="text-xs text-gray-500 dark:text-gray-400">
                                        {sourceInfo.type}
                                      </div>
                                    </div>
                                  </div>
                                ) : doc.url ? (
                                  <a 
                                    href={doc.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 truncate block"
                                  >
                                    {(() => {
                                      try {
                                        return new URL(doc.url).hostname
                                      } catch {
                                        return doc.url
                                      }
                                    })()}
                                  </a>
                                ) : (
                                  <span className="text-sm text-gray-500 dark:text-gray-400">Manual upload</span>
                                )}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(doc.processingStatus)}`}>
                                  {doc.processingStatus}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                {doc.chunkCount || 0}
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(doc.createdAt)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setSelectedDocumentId(doc.id)
                                      setShowViewModal(true)
                                    }}
                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition-colors"
                                    title="View document"
                                  >
                                    <EyeIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleReembedDocument(doc.id, doc.title)}
                                    className="p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded transition-colors"
                                    title="Re-embed document"
                                  >
                                    <SparklesIcon className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id, doc.title)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition-colors"
                                    title="Delete document"
                                  >
                                    <TrashIcon className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(startIndex + itemsPerPage, filteredDocuments.length)}</span> of{' '}
                      <span className="font-medium">{filteredDocuments.length}</span> documents
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeftIcon className="w-5 h-5" />
                      </button>
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRightIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <DocumentAnalytics />
          </motion.div>
        )}

        {/* Search History Tab */}
        {activeTab === 'search' && (
          <motion.div
            key="search"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            <SearchHistory />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      {showUploadModal && (
        <DocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
        />
      )}

      {showSearchModal && (
        <SemanticSearchModal
          isOpen={showSearchModal}
          onClose={() => setShowSearchModal(false)}
        />
      )}

      {showViewModal && selectedDocumentId && (
        <DocumentViewModal
          documentId={selectedDocumentId}
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setSelectedDocumentId(null)
          }}
        />
      )}
    </div>
  )
}
