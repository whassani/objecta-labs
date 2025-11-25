'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'
import { useMutation } from '@tanstack/react-query'
import { knowledgeBaseApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface SemanticSearchModalProps {
  isOpen: boolean
  onClose: () => void
}

interface SearchResult {
  chunkId: string
  documentId: string
  content: string
  score: number
  metadata: {
    documentTitle: string
    contentType: string
    chunkIndex: number
  }
}

export default function SemanticSearchModal({ isOpen, onClose }: SemanticSearchModalProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [limit, setLimit] = useState(5)
  const [threshold, setThreshold] = useState(0.7)
  const [searchMode, setSearchMode] = useState<'semantic' | 'hybrid'>('semantic')
  const [semanticWeight, setSemanticWeight] = useState(0.7)

  const searchMutation = useMutation({
    mutationFn: ({ query, limit, threshold, mode }: { query: string; limit: number; threshold: number; mode: string }) =>
      mode === 'hybrid'
        ? knowledgeBaseApi.hybridSearch(query, limit, semanticWeight, threshold)
        : knowledgeBaseApi.searchDocuments(query, limit, threshold),
    onSuccess: (response) => {
      setResults(response.data)
      if (response.data.length === 0) {
        toast.success('No results found')
      } else {
        toast.success(`Found ${response.data.length} results`)
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Search failed')
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!query.trim()) {
      toast.error('Please enter a search query')
      return
    }
    searchMutation.mutate({ query, limit, threshold, mode: searchMode })
  }

  const handleClose = () => {
    setQuery('')
    setResults([])
    onClose()
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-3xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SparklesIcon className="h-6 w-6 text-indigo-600" />
              <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
                Semantic Search
              </Dialog.Title>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Search across all your documents using natural language. Powered by Ollama embeddings.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="query" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Query
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="e.g., How do I configure the API?"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Search Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Mode
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setSearchMode('semantic')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                    searchMode === 'semantic'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Semantic Only
                </button>
                <button
                  type="button"
                  onClick={() => setSearchMode('hybrid')}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition ${
                    searchMode === 'hybrid'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Hybrid (Keyword + Semantic)
                </button>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="limit" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Results
                </label>
                <input
                  type="number"
                  id="limit"
                  value={limit}
                  onChange={(e) => setLimit(parseInt(e.target.value))}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label htmlFor="threshold" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Similarity Threshold
                </label>
                <input
                  type="number"
                  id="threshold"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Hybrid Options */}
            {searchMode === 'hybrid' && (
              <div>
                <label htmlFor="semanticWeight" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Semantic Weight (vs Keyword)
                </label>
                <input
                  type="range"
                  id="semanticWeight"
                  value={semanticWeight}
                  onChange={(e) => setSemanticWeight(parseFloat(e.target.value))}
                  min="0"
                  max="1"
                  step="0.1"
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span>Keyword: {((1 - semanticWeight) * 100).toFixed(0)}%</span>
                  <span>Semantic: {(semanticWeight * 100).toFixed(0)}%</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={searchMutation.isPending}
              className="w-full px-4 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
            >
              {searchMutation.isPending ? 'Searching...' : 'Search'}
            </button>
          </form>

          {/* Search Results */}
          {results.length > 0 && (
            <div className="mt-6 space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Results ({results.length})
              </h3>
              {results.map((result, index) => (
                <div
                  key={result.chunkId}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                        {result.metadata.documentTitle}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Chunk {result.metadata.chunkIndex + 1} • Similarity: {(result.score * 100).toFixed(1)}%
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                      #{index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                    {result.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* No Results */}
          {!searchMutation.isPending && searchMutation.isSuccess && results.length === 0 && (
            <div className="mt-6 text-center py-8">
              <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                No results found. Try adjusting your search query or lowering the similarity threshold.
              </p>
            </div>
          )}
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
