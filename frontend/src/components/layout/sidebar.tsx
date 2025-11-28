'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  HomeIcon, 
  SparklesIcon, 
  BookOpenIcon, 
  WrenchScrewdriverIcon,
  ChatBubbleLeftRightIcon,
  FolderIcon,
  Cog6ToothIcon,
  BoltIcon,
  CpuChipIcon,
  QueueListIcon,
  CreditCardIcon,
  BellIcon,
  UsersIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  RocketLaunchIcon,
} from '@heroicons/react/24/outline'
import clsx from 'clsx'

// Grouped navigation with sections
const navigationGroups = [
  {
    name: 'Main',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
      { name: 'Getting Started', href: '/dashboard/getting-started', icon: RocketLaunchIcon, badge: 'New' },
    ],
  },
  {
    name: 'AI & Automation',
    items: [
      { name: 'Workspaces', href: '/dashboard/workspaces', icon: FolderIcon },
      { name: 'Agents', href: '/dashboard/agents', icon: SparklesIcon },
      { name: 'Workflows', href: '/dashboard/workflows', icon: BoltIcon },
      { name: 'Conversations', href: '/dashboard/conversations', icon: ChatBubbleLeftRightIcon },
    ],
  },
  {
    name: 'Resources',
    items: [
      { name: 'Knowledge Base', href: '/dashboard/knowledge-base', icon: BookOpenIcon },
      { name: 'Tools & Actions', href: '/dashboard/tools', icon: WrenchScrewdriverIcon },
      { name: 'Fine-Tuning', href: '/dashboard/fine-tuning', icon: CpuChipIcon },
      { name: 'Background Jobs', href: '/dashboard/jobs', icon: QueueListIcon },
    ],
  },
  {
    name: 'Management',
    items: [
      { name: 'Analytics', href: '/dashboard/analytics', icon: ChartBarIcon },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsedGroups, setCollapsedGroups] = useState<string[]>([])

  const toggleGroup = (groupName: string) => {
    setCollapsedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    )
  }

  return (
    <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 border-r border-gray-200 dark:border-gray-700 px-6 pb-20">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center border-b border-gray-200 dark:border-gray-700">
          <Link href="/dashboard" className="flex items-center space-x-2 group">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 group-hover:from-primary-600 group-hover:to-primary-700 transition-all">
              <SparklesIcon className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
              Objecta Labs
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-3">
            {navigationGroups.map((group) => {
              const isCollapsed = collapsedGroups.includes(group.name)
              
              return (
                <li key={group.name}>
                  {/* Group Header */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => toggleGroup(group.name)}
                      className="flex items-center gap-x-2 px-2 py-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-primary-600 dark:hover:text-primary-400 transition-colors rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                      {isCollapsed ? (
                        <ChevronRightIcon className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDownIcon className="h-3.5 w-3.5" />
                      )}
                      {group.name}
                    </button>
                  </div>

                  {/* Group Items */}
                  {!isCollapsed && (
                    <ul role="list" className="-mx-2 space-y-1">
                      {group.items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                          <li key={item.name}>
                            <Link
                              href={item.href}
                              className={clsx(
                                isActive
                                  ? 'bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/30 dark:to-primary-900/20 text-primary-700 dark:text-primary-300 shadow-sm border-l-2 border-primary-600'
                                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white border-l-2 border-transparent hover:border-gray-300 dark:hover:border-gray-600',
                                'group flex items-center justify-between gap-x-3 rounded-r-md pl-3 pr-3 py-2.5 text-sm font-medium transition-all duration-150'
                              )}
                            >
                              <div className="flex items-center gap-x-3">
                                <item.icon
                                  className={clsx(
                                    isActive
                                      ? 'text-primary-600 dark:text-primary-400'
                                      : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 group-hover:scale-110',
                                    'h-5 w-5 shrink-0 transition-transform'
                                  )}
                                  aria-hidden="true"
                                />
                                <span className={clsx(
                                  isActive ? 'font-semibold' : 'font-medium'
                                )}>
                                  {item.name}
                                </span>
                              </div>
                              {item.badge && (
                                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-primary-500 to-primary-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
                                  {item.badge}
                                </span>
                              )}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </div>
  )
}
