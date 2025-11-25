'use client'

import { useQuery } from '@tanstack/react-query'
import { knowledgeBaseApi } from '@/lib/api'
import { ClockIcon, FireIcon, ChartBarIcon } from '@heroicons/react/24/outline'

export default function SearchHistory() {
  const { data: popularQueries } = useQuery({
    queryKey: ['popularQueries'],
    queryFn: () => knowledgeBaseApi.getPopularQueries(5).then(res => res.data),
    refetchInterval: 60000, // Refresh every minute
  })

  const { data: recentSearches } = useQuery({
    queryKey: ['recentSearches'],
    queryFn: () => knowledgeBaseApi.getRecentSearches(5).then(res => res.data),
    refetchInterval: 30000,
  })

  const { data: searchStats } = useQuery({
    queryKey: ['searchStats'],
    queryFn: () => knowledgeBaseApi.getSearchStats().then(res => res.data),
    refetchInterval: 60000,
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Popular Queries */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <FireIcon className="h-5 w-5 text-orange-600 dark:text-orange-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Popular Queries
          </h3>
        </div>

        {popularQueries && popularQueries.length > 0 ? (
          <div className="space-y-3">
            {popularQueries.map((query: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {query.query}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Searched {query.count} times • Avg {query.avgResults.toFixed(1)} results
                  </p>
                </div>
                <div className="ml-3 flex-shrink-0">
                  <span className="px-2 py-1 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400 rounded-full">
                    #{index + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No search history yet
          </p>
        )}
      </div>

      {/* Recent Searches */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClockIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Searches
          </h3>
        </div>

        {recentSearches && recentSearches.length > 0 ? (
          <div className="space-y-3">
            {recentSearches.map((search: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {search.query}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {search.resultsCount} results • {new Date(search.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No recent searches
          </p>
        )}
      </div>

      {/* Search Stats */}
      {searchStats && (
        <div className="md:col-span-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <ChartBarIcon className="h-6 w-6" />
            <h3 className="text-lg font-semibold">Search Statistics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="text-2xl font-bold">{searchStats.totalSearches}</div>
              <div className="text-sm opacity-90">Total Searches</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{searchStats.uniqueQueries}</div>
              <div className="text-sm opacity-90">Unique Queries</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{searchStats.avgResultsPerSearch.toFixed(1)}</div>
              <div className="text-sm opacity-90">Avg Results</div>
            </div>
            <div>
              <div className="text-2xl font-bold">{(searchStats.avgScore * 100).toFixed(0)}%</div>
              <div className="text-sm opacity-90">Avg Score</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
