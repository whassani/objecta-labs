import Link from 'next/link'
import { ArrowRightIcon, SparklesIcon, RocketLaunchIcon, ShieldCheckIcon } from '@heroicons/react/24/outline'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <SparklesIcon className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900 dark:text-white">AgentForge</span>
          </div>
          <div className="flex items-center space-x-4">
            <Link 
              href="/login" 
              className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              Login
            </Link>
            <Link 
              href="/register" 
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
            >
              Get Started
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            Build Powerful AI Agents
            <span className="block text-primary-600">in Minutes</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
            Create, deploy, and manage AI agents that can execute actions, access your knowledge base, 
            and automate complex workflows.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link 
              href="/register" 
              className="px-8 py-4 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition flex items-center space-x-2 text-lg font-semibold"
            >
              <span>Start Free Trial</span>
              <ArrowRightIcon className="h-5 w-5" />
            </Link>
            <Link 
              href="/demo" 
              className="px-8 py-4 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-primary-600 hover:text-primary-600 transition text-lg font-semibold"
            >
              View Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <RocketLaunchIcon className="h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Quick Setup
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Create and deploy AI agents in minutes with our intuitive interface. No coding required.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <SparklesIcon className="h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Smart Actions
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Agents can read, write, update, and delete data across your systems automatically.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
            <ShieldCheckIcon className="h-12 w-12 text-primary-600 mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              Enterprise Security
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Multi-tenant architecture with role-based access control and encryption.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 text-center text-gray-600 dark:text-gray-400">
        <p>© 2024 AgentForge. All rights reserved.</p>
      </footer>
    </div>
  )
}
