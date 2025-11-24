'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldRedirect, setShouldRedirect] = useState(false)

  useEffect(() => {
    // Just use Zustand directly - it handles hydration
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      const state = useAuthStore.getState()
      console.log('Zustand hydrated, token exists:', state.token ? 'YES' : 'NO')
      
      if (state.token) {
        setToken(state.token)
        setIsLoading(false)
      } else {
        setShouldRedirect(true)
        setIsLoading(false)
      }
    })
    
    // Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      const state = useAuthStore.getState()
      console.log('Already hydrated, token exists:', state.token ? 'YES' : 'NO')
      
      if (state.token) {
        setToken(state.token)
      } else {
        setShouldRedirect(true)
      }
      setIsLoading(false)
    }
    
    return unsubscribe
  }, [])

  useEffect(() => {
    if (shouldRedirect) {
      console.log('❌ No token, redirecting to login...')
      router.push('/login')
    }
  }, [shouldRedirect, router])

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  // If we should redirect, show nothing
  if (shouldRedirect) {
    return null
  }

  // If no token after loading, show nothing (will redirect)
  if (!token) {
    return null
  }

  console.log('🎉 Rendering dashboard with token:', token?.substring(0, 20))

  try {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar />
        <div className="lg:pl-64">
          <Header />
          <main className="py-6">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    )
  } catch (renderError: any) {
    console.error('❌ RENDER ERROR:', renderError)
    alert('❌ RENDER ERROR: ' + renderError.message)
    return <div>Render Error: {renderError.message}</div>
  }
}
