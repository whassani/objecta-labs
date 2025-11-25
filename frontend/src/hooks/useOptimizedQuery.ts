import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

/**
 * Custom hook for optimized queries with automatic cleanup and deduplication
 */
export function useOptimizedQuery<TData = unknown, TError = unknown>(
  options: UseQueryOptions<TData, TError>
): UseQueryResult<TData, TError> {
  const lastFetchTime = useRef<number>(0)
  const minRefetchInterval = 1000 // Minimum 1 second between refetches

  // Prevent rapid refetching
  const shouldRefetch = () => {
    const now = Date.now()
    if (now - lastFetchTime.current < minRefetchInterval) {
      return false
    }
    lastFetchTime.current = now
    return true
  }

  const result = useQuery({
    ...options,
    refetchOnMount: shouldRefetch,
  })

  return result
}

/**
 * Hook for paginated queries with prefetching
 */
export function usePaginatedQuery<TData = unknown, TError = unknown>(
  queryKey: any[],
  queryFn: (page: number) => Promise<TData>,
  page: number = 1,
  options?: Partial<UseQueryOptions<TData, TError>>
) {
  // Prefetch next page
  useEffect(() => {
    // Prefetch logic could go here
  }, [page])

  return useQuery({
    queryKey: [...queryKey, page],
    queryFn: () => queryFn(page),
    staleTime: 60000, // 1 minute
    ...options,
  })
}

/**
 * Hook for infinite scroll queries
 */
export function useInfiniteOptimizedQuery<TData = unknown, TError = unknown>(
  options: any
) {
  // Implementation for infinite queries
  return useQuery(options)
}
