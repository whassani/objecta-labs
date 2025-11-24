'use client'

import { useEffect, useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Read directly from localStorage on client
    console.log('=== DASHBOARD LAYOUT MOUNTED ===')
    
    // Check all localStorage keys
    console.log('All localStorage keys:', Object.keys(localStorage))
    
    const storedData = localStorage.getItem('auth-storage')
    console.log('auth-storage raw data:', storedData)
    
    const directToken = localStorage.getItem('token')
    console.log('Direct token key:', directToken)
    
    if (storedData) {
      try {
        const parsed = JSON.parse(storedData)
        console.log('Parsed auth-storage:', parsed)
        const tokenValue = parsed?.state?.token
        console.log('Token from parsed data:', tokenValue ? 'EXISTS' : 'MISSING')
        setToken(tokenValue)
      } catch (e) {
        console.error('Failed to parse auth-storage:', e)
      }
    } else {
      console.log('NO auth-storage found in localStorage')
    }
    
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (!isLoading && !token) {
      console.log('No token found, redirecting to login')
      window.location.href = '/login'
    }
  }, [isLoading, token])

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
