'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { useQuery } from '@tanstack/react-query'
import { knowledgeBaseApi } from '@/lib/api'

interface SourcePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  documentId: string
  chunkId: string
  documentTitle: string
  score: number
}

export default function SourcePreviewModal({
  isOpen,
  onClose,
  documentId,
  chunkId,
  documentTitle,
  score,
}: SourcePreviewModalProps) {
  const { data: chunk, isLoading } = useQuery({
    queryKey: ['chunk', documentId, chunkId],
    queryFn: () => knowledgeBaseApi.getChunkContent(documentId, chunkId).then(res => res.data),
    enabled: isOpen,
  })

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DocumentTextIcon className="h-6 w-6 text-indigo-600" />
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                Source Preview
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Document Info */}
          <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {documentTitle}
              </span>
              <span className="text-sm text-indigo-600 dark:text-indigo-400">
                {(score * 100).toFixed(1)}% match
              </span>
            </div>
            {chunk && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Chunk {chunk.chunkIndex + 1}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="mb-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : chunk ? (
              <div className="prose dark:prose-invert max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-900 p-4 rounded border border-gray-200 dark:border-gray-600 max-h-96 overflow-y-auto">
                  {chunk.content}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Unable to load chunk content
              </div>
            )}
          </div>

          {/* Metadata */}
          {chunk?.metadata && Object.keys(chunk.metadata).length > 0 && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded">
              <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                Metadata
              </div>
              <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-x-auto">
                {JSON.stringify(chunk.metadata, null, 2)}
              </pre>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
