'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('❌ DASHBOARD ERROR:', error)
    alert(`❌ DASHBOARD ERROR!\n\nType: ${error.name}\nMessage: ${error.message}\n\nStack:\n${error.stack?.substring(0, 300)}`)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 dark:bg-red-950">
      <div className="text-center p-8 max-w-4xl">
        <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Dashboard Error!</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">{error.message}</p>
        <pre className="bg-red-100 dark:bg-red-900 p-4 rounded text-left text-xs overflow-auto">
          {error.stack}
        </pre>
        <div className="mt-4 space-x-4">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  )
}
