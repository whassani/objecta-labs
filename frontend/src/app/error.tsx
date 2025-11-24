'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('❌ APP ERROR:', error)
    alert(`❌ APPLICATION ERROR!\n\n${error.name}: ${error.message}\n\nStack:\n${error.stack?.substring(0, 300)}`)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong!</h2>
        <p className="text-gray-700 mb-4">{error.message}</p>
        <pre className="bg-red-100 p-4 rounded text-left text-xs overflow-auto max-w-2xl">
          {error.stack}
        </pre>
        <button
          onClick={() => reset()}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
