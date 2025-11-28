'use client'

import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { 
  SparklesIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

export function UserMenu() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  // Get initials from user name
  const getInitials = () => {
    if (!user) return 'U'
    const firstName = user.firstName || ''
    const lastName = user.lastName || ''
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
  }

  return (
    <div className="hidden lg:block fixed bottom-0 left-0 z-50 w-64 p-4 bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-t border-r border-gray-200 dark:border-gray-700">
      <Menu as="div" className="relative">
        <Menu.Button className="flex items-center gap-3 w-full px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
            {getInitials()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {user?.email}
            </p>
          </div>
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
          </svg>
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 bottom-full mb-2 w-full lg:w-64 origin-bottom-left rounded-lg bg-white dark:bg-gray-800 shadow-lg ring-1 ring-gray-200 dark:ring-gray-700 focus:outline-none overflow-hidden">
            {/* Menu Items */}
            <div className="py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => router.push('/dashboard/settings')}
                    className={clsx(
                      active ? 'bg-gray-100 dark:bg-gray-700' : '',
                      'flex w-full items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300'
                    )}
                  >
                    Settings
                  </button>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => router.push('/dashboard/settings?tab=appearance')}
                    className={clsx(
                      active ? 'bg-gray-100 dark:bg-gray-700' : '',
                      'flex w-full items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300'
                    )}
                  >
                    Language
                  </button>
                )}
              </Menu.Item>

              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => router.push('/dashboard/billing')}
                    className={clsx(
                      active ? 'bg-gray-100 dark:bg-gray-700' : '',
                      'flex w-full items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-300'
                    )}
                  >
                    <span>Upgrade plan</span>
                    <SparklesIcon className="w-4 h-4 text-amber-500" />
                  </button>
                )}
              </Menu.Item>
            </div>

            {/* Logout */}
            <div className="border-t border-gray-200 dark:border-gray-700 py-1">
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={handleLogout}
                    className={clsx(
                      active ? 'bg-gray-100 dark:bg-gray-700' : '',
                      'flex w-full items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300'
                    )}
                  >
                    Log out
                  </button>
                )}
              </Menu.Item>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}
