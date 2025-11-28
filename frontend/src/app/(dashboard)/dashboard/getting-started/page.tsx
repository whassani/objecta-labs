'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { workspacesApi, agentsApi } from '@/lib/api'
import Link from 'next/link'
import { 
  CheckCircleIcon,
  FolderIcon,
  SparklesIcon,
  DocumentTextIcon,
  WrenchIcon,
  ArrowRightIcon,
  PlayIcon
} from '@heroicons/react/24/outline'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function GettingStartedPage() {
  const router = useRouter()
  
  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesApi.getAll().then(res => res.data),
  })

  const { data: agents } = useQuery({
    queryKey: ['agents'],
    queryFn: () => agentsApi.getAll().then(res => res.data),
  })

  const hasWorkspaces = workspaces && workspaces.length > 0
  const hasAgents = agents && agents.length > 0

  const steps = [
    {
      number: 1,
      title: 'Create a Workspace',
      description: 'Organize your AI agents by team, project, or use case',
      icon: FolderIcon,
      completed: hasWorkspaces,
      action: 'Create Workspace',
      href: '/dashboard/workspaces',
      examples: ['Marketing Team', 'Sales Operations', 'Customer Support'],
      color: 'blue'
    },
    {
      number: 2,
      title: 'Create AI Agents',
      description: 'Build intelligent agents to automate tasks and answer questions',
      icon: SparklesIcon,
      completed: hasAgents,
      action: hasWorkspaces ? 'Create Agent' : 'Create Workspace First',
      href: hasWorkspaces ? '/dashboard/agents/new' : '/dashboard/workspaces',
      examples: ['Content Writer', 'Data Analyzer', 'Customer Support Bot'],
      color: 'purple',
      disabled: !hasWorkspaces
    },
    {
      number: 3,
      title: 'Upload Documents (Optional)',
      description: 'Add knowledge base documents for your agents to reference',
      icon: DocumentTextIcon,
      completed: false,
      action: 'Upload Documents',
      href: '/dashboard/knowledge-base',
      examples: ['Product docs', 'FAQs', 'Company policies'],
      color: 'green'
    },
    {
      number: 4,
      title: 'Create Workflows (Optional)',
      description: 'Automate complex multi-step processes',
      icon: WrenchIcon,
      completed: false,
      action: 'Create Workflow',
      href: '/dashboard/workflows',
      examples: ['Lead qualification', 'Content generation', 'Data processing'],
      color: 'orange'
    },
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Welcome! Let's Get You Started 🚀
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Follow these simple steps to build your first AI-powered solution
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Your Progress
          </h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {steps.filter(s => s.completed).length} of {steps.length} completed
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(steps.filter(s => s.completed).length / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Steps */}
      <div className="space-y-6">
        {steps.map((step) => (
          <Card
            key={step.number}
            className={`p-6 ${step.disabled ? 'opacity-60' : ''} ${
              step.completed ? 'border-green-300 bg-green-50 dark:bg-green-900/10' : ''
            }`}
          >
            <div className="flex items-start gap-6">
              {/* Step Number/Icon */}
              <div className="flex-shrink-0">
                {step.completed ? (
                  <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                ) : (
                  <div className={`w-16 h-16 rounded-full bg-${step.color}-100 dark:bg-${step.color}-900/20 flex items-center justify-center`}>
                    <step.icon className={`h-8 w-8 text-${step.color}-600`} />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className={`text-sm font-semibold px-2 py-1 rounded bg-${step.color}-100 dark:bg-${step.color}-900/20 text-${step.color}-700 dark:text-${step.color}-400`}>
                    Step {step.number}
                  </span>
                  {step.completed && (
                    <span className="text-sm font-semibold text-green-600">
                      ✓ Completed
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {step.description}
                </p>

                {/* Examples */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Examples:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {step.examples.map((example) => (
                      <span
                        key={example}
                        className="text-xs px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {example}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <Link href={step.href}>
                  <Button
                    disabled={step.disabled}
                    className={step.completed ? 'bg-green-600 hover:bg-green-700' : ''}
                  >
                    {step.completed ? (
                      <>
                        View {step.title} <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </>
                    ) : (
                      <>
                        {step.action} <ArrowRightIcon className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Start Guide */}
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/10 dark:to-purple-900/10 border-blue-200">
        <div className="flex items-start gap-4">
          <PlayIcon className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" />
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Quick Start: Your First AI Agent in 3 Minutes
            </h3>
            <ol className="space-y-2 text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">1.</span>
                <span>Create a workspace (e.g., "Marketing Team")</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">2.</span>
                <span>Click "Create Agent" from the workspace page</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">3.</span>
                <span>Give it a name and prompt (e.g., "Help write marketing emails")</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-semibold text-blue-600">4.</span>
                <span>Start chatting with your agent!</span>
              </li>
            </ol>
            <div className="mt-4">
              <Link href={hasWorkspaces ? '/dashboard/workspaces' : '/dashboard/workspaces'}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  {hasWorkspaces ? 'Go to Workspaces' : 'Create Your First Workspace'}
                  <ArrowRightIcon className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </Card>

      {/* Help Section */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Need Help?
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4">
            <div className="text-4xl mb-2">📚</div>
            <h4 className="font-semibold mb-1">Documentation</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Read our complete guides
            </p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">💬</div>
            <h4 className="font-semibold mb-1">Community</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Join our Discord server
            </p>
          </div>
          <div className="text-center p-4">
            <div className="text-4xl mb-2">🎥</div>
            <h4 className="font-semibold mb-1">Video Tutorials</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Watch step-by-step guides
            </p>
          </div>
        </div>
      </Card>
    </div>
  )
}
