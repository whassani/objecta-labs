'use client'

import { Fragment, useEffect, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, DocumentTextIcon, TagIcon, CalendarIcon, HashtagIcon } from '@heroicons/react/24/outline'
import { api } from '@/lib/api'
import ReactMarkdown from 'react-markdown'

interface DocumentViewModalProps {
  documentId: string
  isOpen: boolean
  onClose: () => void
}

export default function DocumentViewModal({ documentId, isOpen, onClose }: DocumentViewModalProps) {
  const [document, setDocument] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'content' | 'chunks' | 'metadata'>('content')

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocument()
    }
  }, [isOpen, documentId])

  const loadDocument = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/knowledge-base/documents/${documentId}`)
      setDocument(response.data)
    } catch (error) {
      console.error('Failed to load document:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100 dark:bg-green-900/20'
      case 'processing': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'
      case 'failed': return 'text-red-600 bg-red-100 dark:bg-red-900/20'
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700'
    }
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25 dark:bg-opacity-50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl transition-all">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : document ? (
                  <>
                    {/* Header */}
                    <div className="flex items-start justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <DocumentTextIcon className="w-6 h-6 text-blue-600" />
                          <Dialog.Title className="text-2xl font-bold text-gray-900 dark:text-white">
                            {document.title}
                          </Dialog.Title>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {formatDate(document.createdAt)}
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(document.processingStatus)}`}>
                            {document.processingStatus}
                          </span>
                          {document.category && (
                            <div className="flex items-center gap-1">
                              <TagIcon className="w-4 h-4" />
                              {document.category}
                            </div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <XMarkIcon className="w-6 h-6" />
                      </button>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700 px-6">
                      <nav className="-mb-px flex space-x-8">
                        <button
                          onClick={() => setActiveTab('content')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                            activeTab === 'content'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Content
                        </button>
                        <button
                          onClick={() => setActiveTab('chunks')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                            activeTab === 'chunks'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Chunks ({document.chunkCount || 0})
                        </button>
                        <button
                          onClick={() => setActiveTab('metadata')}
                          className={`py-4 px-1 border-b-2 font-medium text-sm transition ${
                            activeTab === 'metadata'
                              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          Metadata
                        </button>
                      </nav>
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                      {activeTab === 'content' && (
                        <div className="prose dark:prose-invert max-w-none">
                          {document.contentType === 'text/markdown' ? (
                            <ReactMarkdown>{document.content}</ReactMarkdown>
                          ) : (
                            <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                              {document.content}
                            </pre>
                          )}
                        </div>
                      )}

                      {activeTab === 'chunks' && (
                        <div className="space-y-4">
                          {document.chunks?.map((chunk: any, index: number) => (
                            <div
                              key={chunk.id}
                              className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <HashtagIcon className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                  Chunk {index + 1}
                                </span>
                              </div>
                              <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
                                {chunk.content}
                              </p>
                            </div>
                          )) || (
                            <p className="text-center text-gray-500 py-8">
                              No chunks available
                            </p>
                          )}
                        </div>
                      )}

                      {activeTab === 'metadata' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Document ID
                              </label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100 font-mono">
                                {document.id}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Content Type
                              </label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                {document.contentType}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Created At
                              </label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                {formatDate(document.createdAt)}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Updated At
                              </label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                {formatDate(document.updatedAt)}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Chunk Count
                              </label>
                              <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                                {document.chunkCount || 0}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Processing Status
                              </label>
                              <p className="mt-1">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(document.processingStatus)}`}>
                                  {document.processingStatus}
                                </span>
                              </p>
                            </div>
                          </div>

                          {document.url && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Source URL
                              </label>
                              <p className="mt-1">
                                <a
                                  href={document.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 break-all"
                                >
                                  {document.url}
                                </a>
                              </p>
                            </div>
                          )}

                          {document.tags && document.tags.length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Tags
                              </label>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {document.tags.map((tag: string) => (
                                  <span
                                    key={tag}
                                    className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {document.metadata && Object.keys(document.metadata).length > 0 && (
                            <div>
                              <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                Additional Metadata
                              </label>
                              <pre className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded text-xs text-gray-900 dark:text-gray-100 overflow-x-auto">
                                {JSON.stringify(document.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end">
                      <button
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-center">
                    <p className="text-gray-500">Document not found</p>
                  </div>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
