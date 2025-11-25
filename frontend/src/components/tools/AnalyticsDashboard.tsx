'use client'

import { useQuery } from '@tanstack/react-query'
import { toolsApi } from '@/lib/api'
import { 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'

export default function AnalyticsDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['organization-stats'],
    queryFn: () => toolsApi.getOrganizationStats().then(res => res.data),
    refetchInterval: 60000, // Refresh every minute
  })

  const { data: toolsMetrics } = useQuery({
    queryKey: ['tools-metrics'],
    queryFn: () => toolsApi.getToolsMetrics(10).then(res => res.data),
    refetchInterval: 60000,
  })

  const { data: timeSeriesData } = useQuery({
    queryKey: ['time-series', 7],
    queryFn: () => toolsApi.getTimeSeriesData(undefined, 7).then(res => res.data),
    refetchInterval: 300000, // Refresh every 5 minutes
  })

  const { data: errorBreakdown } = useQuery({
    queryKey: ['error-breakdown'],
    queryFn: () => toolsApi.getErrorBreakdown().then(res => res.data),
    refetchInterval: 60000,
  })

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Executions"
          value={stats?.totalExecutions || 0}
          icon={ChartBarIcon}
          color="blue"
        />
        <StatsCard
          title="Success Rate"
          value={`${(stats?.successRate || 0).toFixed(1)}%`}
          icon={CheckCircleIcon}
          color="green"
        />
        <StatsCard
          title="Avg Response Time"
          value={`${Math.round(stats?.avgExecutionTime || 0)}ms`}
          icon={ClockIcon}
          color="purple"
        />
        <StatsCard
          title="Total Retries"
          value={stats?.totalRetries || 0}
          icon={ArrowTrendingUpIcon}
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Executions Over Time */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Last 7 Days Activity
          </h3>
          <div className="space-y-2">
            {timeSeriesData?.map((day: any) => (
              <div key={day.date} className="flex items-center gap-4">
                <span className="text-xs text-gray-500 w-24">
                  {new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <div className="flex-1 flex gap-1">
                  <div 
                    className="h-8 bg-green-500 rounded"
                    style={{ width: `${(day.successes / Math.max(1, day.executions)) * 100}%` }}
                    title={`${day.successes} successes`}
                  />
                  <div 
                    className="h-8 bg-red-500 rounded"
                    style={{ width: `${(day.failures / Math.max(1, day.executions)) * 100}%` }}
                    title={`${day.failures} failures`}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                  {day.executions}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Error Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Error Breakdown (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {errorBreakdown?.slice(0, 5).map((error: any) => (
              <div key={error.errorType}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 dark:text-gray-300">{error.errorType}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{error.count}</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${error.percentage}%` }}
                  />
                </div>
              </div>
            ))}
            {!errorBreakdown || errorBreakdown.length === 0 && (
              <div className="text-center py-4">
                <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-gray-400" />
                <p className="text-sm text-gray-500 mt-2">No errors in the last 30 days</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Top Tools Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Top Tools by Usage
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tool Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Executions
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Response
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Errors
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {toolsMetrics?.map((tool: any) => (
                <tr key={tool.toolId} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">
                    {tool.toolName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {tool.executions}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      tool.successRate >= 95 ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                      tool.successRate >= 80 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                      'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      {tool.successRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                    {Math.round(tool.avgResponseTime)}ms
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {tool.errorCount > 0 ? (
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        {tool.errorCount}
                      </span>
                    ) : (
                      <span className="text-gray-400">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

interface StatsCardProps {
  title: string
  value: string | number
  icon: any
  color: 'blue' | 'green' | 'purple' | 'yellow'
}

function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    purple: 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    yellow: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400',
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  )
}
