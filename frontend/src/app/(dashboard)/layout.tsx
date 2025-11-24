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
    // Ensure we're fully client-side
    if (typeof window === 'undefined') return
    
    console.log('=== DASHBOARD LAYOUT MOUNTED ===')
    
    // Small delay to ensure localStorage is accessible
    const timer = setTimeout(() => {
      try {
        // Check all localStorage keys
        console.log('All localStorage keys:', Object.keys(localStorage))
        
        const storedData = localStorage.getItem('auth-storage')
        console.log('auth-storage exists:', storedData ? 'YES' : 'NO')
        
        if (storedData) {
          const parsed = JSON.parse(storedData)
          const tokenValue = parsed?.state?.token
          console.log('Token from auth-storage:', tokenValue ? 'EXISTS' : 'MISSING')
          
          if (tokenValue) {
            console.log('✅ TOKEN FOUND - Setting state')
            setToken(tokenValue)
          } else {
            console.log('❌ NO TOKEN in auth-storage')
          }
        } else {
          console.log('❌ auth-storage NOT FOUND')
        }
      } catch (e) {
        console.error('Error reading localStorage:', e)
      }
      
      setIsLoading(false)
    }, 100)
    
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!isLoading) {
      if (!token) {
        console.log('❌ No token in state, redirecting to login')
        window.location.href = '/login'
      } else {
        console.log('✅ Token exists in state, staying on dashboard')
      }
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
