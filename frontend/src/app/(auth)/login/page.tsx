'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import toast from 'react-hot-toast'
import { SparklesIcon } from '@heroicons/react/24/outline'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const { setUser, setToken } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const response = await authApi.login(data)
      const { user, token } = response.data
      
      console.log('=== LOGIN SUCCESS ===')
      console.log('Received token:', token ? 'YES' : 'NO')
      console.log('User data:', user)
      
      // Set token first (which also sets localStorage)
      setToken(token)
      // Then set user
      setUser(user)
      
      // Wait a bit for Zustand to persist
      await new Promise(resolve => setTimeout(resolve, 100))
      
      // Verify localStorage after setting
      const authStorage = localStorage.getItem('auth-storage')
      const directToken = localStorage.getItem('token')
      console.log('After setting - auth-storage exists:', authStorage ? 'YES' : 'NO')
      console.log('After setting - direct token exists:', directToken ? 'YES' : 'NO')
      
      if (authStorage) {
        const parsed = JSON.parse(authStorage)
        console.log('Token in auth-storage:', parsed?.state?.token ? 'EXISTS' : 'MISSING')
      }
      
      toast.success('Welcome back!')
      
      // BLOCKING ALERT - You MUST click OK to continue
      alert('LOGIN COMPLETE! localStorage saved. Click OK to TRY navigate to dashboard.')
      
      console.log('User clicked OK, attempting navigation...')
      
      try {
        console.log('Calling window.location.href...')
        window.location.href = '/dashboard'
        console.log('Navigation call completed (page should be loading...)')
      } catch (navError: any) {
        console.error('Navigation error:', navError)
        alert('NAVIGATION ERROR: ' + navError.message)
      }
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.response?.data?.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2">
            <SparklesIcon className="h-10 w-10 text-primary-600" />
            <span className="text-3xl font-bold text-gray-900 dark:text-white">Objecta Labs</span>
          </Link>
          <p className="mt-2 text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-600" />
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
