import { QueryClient } from '@tanstack/react-query'

/**
 * Optimized React Query configuration for performance
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Caching
      staleTime: 30000, // Data fresh for 30 seconds
      gcTime: 5 * 60 * 1000, // Cache for 5 minutes (renamed from cacheTime)
      
      // Refetching
      refetchOnWindowFocus: false, // Don't refetch on window focus
      refetchOnMount: true, // Refetch on component mount
      refetchOnReconnect: true, // Refetch on reconnect
      
      // Retries
      retry: 1, // Retry failed requests once
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Performance
      structuralSharing: true, // Enable structural sharing
      notifyOnChangeProps: 'all', // Optimize re-renders
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
})

/**
 * Query key factories for consistent cache management
 */
export const queryKeys = {
  // Tools
  tools: {
    all: ['tools'] as const,
    lists: () => [...queryKeys.tools.all, 'list'] as const,
    list: (agentId?: string) => [...queryKeys.tools.lists(), { agentId }] as const,
    details: () => [...queryKeys.tools.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.tools.details(), id] as const,
  },
  
  // Analytics
  analytics: {
    all: ['analytics'] as const,
    orgStats: (startDate?: string, endDate?: string) => 
      [...queryKeys.analytics.all, 'org-stats', { startDate, endDate }] as const,
    toolsMetrics: (limit?: number) => 
      [...queryKeys.analytics.all, 'tools-metrics', { limit }] as const,
    timeSeries: (toolId?: string, days?: number) => 
      [...queryKeys.analytics.all, 'time-series', { toolId, days }] as const,
    errorBreakdown: (toolId?: string, days?: number) => 
      [...queryKeys.analytics.all, 'error-breakdown', { toolId, days }] as const,
  },
  
  // Test History
  testHistory: {
    all: ['test-history'] as const,
    tool: (toolId: string, limit?: number) => 
      [...queryKeys.testHistory.all, toolId, { limit }] as const,
    recent: (limit?: number) => 
      [...queryKeys.testHistory.all, 'recent', { limit }] as const,
    execution: (executionId: string) => 
      [...queryKeys.testHistory.all, 'execution', executionId] as const,
    stats: (toolId: string) => 
      [...queryKeys.testHistory.all, 'stats', toolId] as const,
  },
  
  // Environments
  environments: {
    all: ['environments'] as const,
    tool: (toolId: string) => 
      [...queryKeys.environments.all, toolId] as const,
  },
  
  // Versions
  versions: {
    all: ['versions'] as const,
    tool: (toolId: string, limit?: number) => 
      [...queryKeys.versions.all, toolId, { limit }] as const,
    history: (toolId: string) => 
      [...queryKeys.versions.all, 'history', toolId] as const,
    version: (toolId: string, version: number) => 
      [...queryKeys.versions.all, toolId, version] as const,
  },
  
  // Templates
  templates: {
    all: ['templates'] as const,
  },
}

/**
 * Cache invalidation helpers
 */
export const invalidateQueries = {
  tools: () => queryClient.invalidateQueries({ queryKey: queryKeys.tools.all }),
  analytics: () => queryClient.invalidateQueries({ queryKey: queryKeys.analytics.all }),
  testHistory: (toolId?: string) => {
    if (toolId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.testHistory.tool(toolId) })
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.testHistory.all })
    }
  },
  environments: (toolId?: string) => {
    if (toolId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.environments.tool(toolId) })
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.environments.all })
    }
  },
  versions: (toolId?: string) => {
    if (toolId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.versions.tool(toolId) })
    } else {
      queryClient.invalidateQueries({ queryKey: queryKeys.versions.all })
    }
  },
}

/**
 * Prefetch helpers for optimistic loading
 */
export const prefetchQueries = {
  tools: async () => {
    await queryClient.prefetchQuery({
      queryKey: queryKeys.tools.lists(),
      queryFn: () => import('@/lib/api').then(m => m.toolsApi.getAll().then(res => res.data)),
    })
  },
  analytics: async () => {
    await Promise.all([
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.orgStats(),
        queryFn: () => import('@/lib/api').then(m => m.toolsApi.getOrganizationStats().then(res => res.data)),
      }),
      queryClient.prefetchQuery({
        queryKey: queryKeys.analytics.toolsMetrics(),
        queryFn: () => import('@/lib/api').then(m => m.toolsApi.getToolsMetrics().then(res => res.data)),
      }),
    ])
  },
}
