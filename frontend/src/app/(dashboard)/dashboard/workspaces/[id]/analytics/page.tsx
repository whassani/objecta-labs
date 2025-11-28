'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { workspacesApi } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { 
  ArrowLeftIcon,
  ChartBarIcon,
  UserGroupIcon,
  ClockIcon,
  SparklesIcon,
  DocumentTextIcon,
  WrenchIcon
} from '@heroicons/react/24/outline'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const TIME_RANGES = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
]

export default function WorkspaceAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const workspaceId = params.id as string
  const [timeRange, setTimeRange] = useState(30)

  const { data: workspace } = useQuery({
    queryKey: ['workspace', workspaceId],
    queryFn: () => workspacesApi.getOne(workspaceId).then(res => res.data),
  })

  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['workspace-stats', workspaceId],
    queryFn: () => workspacesApi.getStats(workspaceId).then(res => res.data),
  })

  const { data: activity } = useQuery({
    queryKey: ['workspace-activity', workspaceId, timeRange],
    queryFn: () => workspacesApi.getActivity(workspaceId, timeRange).then(res => res.data),
  })

  const { data: activityByType } = useQuery({
    queryKey: ['workspace-activity-by-type', workspaceId, timeRange],
    queryFn: () => workspacesApi.getActivityByType(workspaceId, timeRange).then(res => res.data),
  })

  const { data: dailyActivity } = useQuery({
    queryKey: ['workspace-daily-activity', workspaceId, timeRange],
    queryFn: () => workspacesApi.getDailyActivity(workspaceId, timeRange).then(res => res.data),
  })

  const { data: mostActiveUsers } = useQuery({
    queryKey: ['workspace-most-active-users', workspaceId, timeRange],
    queryFn: () => workspacesApi.getMostActiveUsers(workspaceId, timeRange).then(res => res.data),
  })

  const formatActivityType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="max-w-7xl space-y-6">
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

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600 mt-2">
              Insights and metrics for {workspace?.name}
            </p>
          </div>
          <div className="flex gap-2">
            {TIME_RANGES.map(range => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'outline'}
                onClick={() => setTimeRange(range.value)}
                size="sm"
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Agents</p>
              <p className="text-3xl font-bold text-gray-900">
                {loadingStats ? '...' : stats?.agents || 0}
              </p>
            </div>
            <SparklesIcon className="h-12 w-12 text-purple-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Workflow Executions</p>
              <p className="text-3xl font-bold text-gray-900">
                {loadingStats ? '...' : stats?.workflowExecutions || 0}
              </p>
            </div>
            <WrenchIcon className="h-12 w-12 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Documents</p>
              <p className="text-3xl font-bold text-gray-900">
                {loadingStats ? '...' : stats?.documents || 0}
              </p>
            </div>
            <DocumentTextIcon className="h-12 w-12 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Members</p>
              <p className="text-3xl font-bold text-gray-900">
                {loadingStats ? '...' : stats?.members || 0}
              </p>
            </div>
            <UserGroupIcon className="h-12 w-12 text-orange-600" />
          </div>
        </Card>
      </div>

      {/* Activity by Type */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <ChartBarIcon className="h-6 w-6" />
          Activity by Type
        </h2>

        {activityByType && activityByType.length > 0 ? (
          <div className="space-y-3">
            {activityByType.map((item: any) => {
              const total = activityByType.reduce((sum: number, i: any) => sum + i.count, 0)
              const percentage = total > 0 ? (item.count / total) * 100 : 0

              return (
                <div key={item.type} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-700">
                      {formatActivityType(item.type)}
                    </span>
                    <span className="text-gray-600">{item.count} events</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">No activity data yet</p>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity Timeline */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <ClockIcon className="h-6 w-6" />
            Recent Activity
          </h2>

          {activity && activity.length > 0 ? (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activity.slice(0, 20).map((item: any) => (
                <div key={item.id} className="flex gap-3 pb-3 border-b border-gray-100 last:border-0">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 rounded-full bg-blue-600" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {formatActivityType(item.type)}
                    </p>
                    {item.user && (
                      <p className="text-xs text-gray-600">
                        by {item.user.firstName || item.user.email}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">No recent activity</p>
          )}
        </Card>

        {/* Most Active Users */}
        <Card className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <UserGroupIcon className="h-6 w-6" />
            Most Active Users
          </h2>

          {mostActiveUsers && mostActiveUsers.length > 0 ? (
            <div className="space-y-3">
              {mostActiveUsers.map((user: any, index: number) => (
                <div key={user.userId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-blue-700">
                        #{index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {user.firstName && user.lastName
                          ? `${user.firstName} ${user.lastName}`
                          : user.email}
                      </p>
                      <p className="text-xs text-gray-600">{user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">{user.activityCount}</p>
                    <p className="text-xs text-gray-600">activities</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-600 py-8">No user activity yet</p>
          )}
        </Card>
      </div>

      {/* Daily Activity Chart */}
      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Daily Activity Trend</h2>

        {dailyActivity && dailyActivity.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-end gap-1 h-48">
              {dailyActivity.map((day: any) => {
                const maxCount = Math.max(...dailyActivity.map((d: any) => d.count))
                const height = maxCount > 0 ? (day.count / maxCount) * 100 : 0

                return (
                  <div
                    key={day.date}
                    className="flex-1 bg-blue-600 rounded-t hover:bg-blue-700 transition-colors cursor-pointer relative group"
                    style={{ height: `${height}%`, minHeight: day.count > 0 ? '4px' : '0' }}
                    title={`${new Date(day.date).toLocaleDateString()}: ${day.count} activities`}
                  >
                    <div className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      {new Date(day.date).toLocaleDateString()}: {day.count}
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex justify-between text-xs text-gray-600 mt-2">
              <span>{dailyActivity[0] && new Date(dailyActivity[0].date).toLocaleDateString()}</span>
              <span>{dailyActivity[dailyActivity.length - 1] && new Date(dailyActivity[dailyActivity.length - 1].date).toLocaleDateString()}</span>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-600 py-8">No daily activity data yet</p>
        )}
      </Card>
    </div>
  )
}
