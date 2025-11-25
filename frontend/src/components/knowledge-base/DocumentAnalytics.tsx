'use client'

import { useQuery } from '@tanstack/react-query'
import { knowledgeBaseApi } from '@/lib/api'
import { ChartBarIcon, DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline'

export default function DocumentAnalytics() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['documentStats'],
    queryFn: () => knowledgeBaseApi.getDocumentStats(10).then(res => res.data),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!stats || stats.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ChartBarIcon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Document Usage
          </h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No usage data available yet. Documents will appear here once they're used in conversations.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-6">
        <ChartBarIcon className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Most Used Documents
        </h3>
      </div>

      <div className="space-y-4">
        {stats.map((doc: any, index: number) => (
          <div
            key={doc.documentId}
            className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            {/* Rank */}
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                #{index + 1}
              </span>
            </div>

            {/* Document Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <DocumentTextIcon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {doc.documentTitle}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                <span>Used {doc.timesUsed} times</span>
                <span>•</span>
                <span>Avg score: {(doc.avgScore * 100).toFixed(0)}%</span>
              </div>
            </div>

            {/* Last Used */}
            <div className="flex-shrink-0 text-right">
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                <ClockIcon className="h-3 w-3" />
                <span>
                  {new Date(doc.lastUsed).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Usage Bar */}
            <div className="flex-shrink-0 w-24">
              <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all"
                  style={{
                    width: `${Math.min((doc.timesUsed / (stats[0]?.timesUsed || 1)) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {stats.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <ChartBarIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No usage data available yet</p>
        </div>
      )}
    </div>
  )
}
