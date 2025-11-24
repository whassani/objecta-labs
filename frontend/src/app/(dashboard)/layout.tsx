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
  const token = useAuthStore((state) => state.token)
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    // Wait for Zustand to hydrate from localStorage
    const unsubscribe = useAuthStore.persist.onFinishHydration(() => {
      setIsHydrated(true)
    })
    
    // Check if already hydrated
    if (useAuthStore.persist.hasHydrated()) {
      setIsHydrated(true)
    }
    
    return unsubscribe
  }, [])

  useEffect(() => {
    if (isHydrated) {
      console.log('Dashboard layout - Token:', token ? 'exists' : 'missing')
      if (!token) {
        console.log('No token, redirecting to login')
        router.push('/login')
      }
    }
  }, [isHydrated, token, router])

  // Show loading while hydrating
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!token) {
    return null
  }

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
}
