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
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [hasRun, setHasRun] = useState(false)

  useEffect(() => {
    // Prevent double execution - use a flag outside component
    if (typeof window !== 'undefined') {
      if ((window as any).__dashboardMounted) {
        console.log('⚠️ DASHBOARD LAYOUT MOUNTING AGAIN! Ignoring second mount.')
        return
      }
      (window as any).__dashboardMounted = true
    }
    
    setHasRun(true)
    
    // Ensure we're fully client-side
    if (typeof window === 'undefined') return
    
    console.log('=== DASHBOARD LAYOUT MOUNTED (FIRST TIME) ===')
    
    try {
      // Read immediately (no delay)
      const storedData = localStorage.getItem('auth-storage')
      console.log('auth-storage exists:', storedData ? 'YES' : 'NO')
      
      // BLOCKING ALERT
      alert(`DASHBOARD CHECK!\nauth-storage exists: ${storedData ? 'YES' : 'NO'}\nCheck console now!`)
      
      if (storedData) {
        const parsed = JSON.parse(storedData)
        const tokenValue = parsed?.state?.token
        console.log('Token from auth-storage:', tokenValue ? 'EXISTS' : 'MISSING')
        
        if (tokenValue) {
          console.log('✅ TOKEN FOUND - Setting state')
          alert('✅ TOKEN FOUND! Setting state and loading dashboard...')
          setToken(tokenValue)
          setIsLoading(false)
          console.log('✅ State set - token:', tokenValue.substring(0, 20) + '...')
          console.log('✅ isLoading set to false')
        } else {
          console.log('❌ NO TOKEN in auth-storage')
          alert('❌ NO TOKEN in auth-storage! Will show redirect message.')
          setShouldRedirect(true)
          setIsLoading(false)
        }
      } else {
        console.log('❌ auth-storage NOT FOUND')
        alert('❌ auth-storage NOT FOUND! Will show redirect message.')
        setShouldRedirect(true)
        setIsLoading(false)
      }
    } catch (e: any) {
      console.error('Error reading localStorage:', e)
      const errorMsg = e?.message || String(e)
      alert(`❌ ERROR!\n\nType: ${e?.name || 'Unknown'}\nMessage: ${errorMsg}\n\nStack:\n${e?.stack?.substring(0, 200) || 'No stack'}`)
      setShouldRedirect(true)
      setIsLoading(false)
    }
  }, [hasRun])

  useEffect(() => {
    if (shouldRedirect) {
      console.log('❌ Should redirect to login...')
      // DISABLED for debugging - show alert instead of redirect
      alert('Would redirect to login. Staying here for debugging.')
      // DO NOT REDIRECT - just stay on page
      // window.location.href = '/login'
    }
  }, [shouldRedirect])

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
