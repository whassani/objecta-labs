'use client'

import { useState, Fragment } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { organizationsApi, api } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Tab } from '@headlessui/react'
import clsx from 'clsx'
import { 
  SparklesIcon, 
  CreditCardIcon, 
  DocumentTextIcon, 
  ArrowDownTrayIcon 
} from '@heroicons/react/24/outline'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const queryClient = useQueryClient()
  
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showAnthropicKey, setShowAnthropicKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [showCohereKey, setShowCohereKey] = useState(false)
  const [showMistralKey, setShowMistralKey] = useState(false)
  const [showHuggingFaceKey, setShowHuggingFaceKey] = useState(false)
  const [openAIKey, setOpenAIKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [cohereKey, setCohereKey] = useState('')
  const [mistralKey, setMistralKey] = useState('')
  const [huggingFaceKey, setHuggingFaceKey] = useState('')
  const [ollamaUrl, setOllamaUrl] = useState('')
  
  const { data: organization } = useQuery({
    queryKey: ['organization'],
    queryFn: () => organizationsApi.getCurrent().then(res => res.data),
  })

  // Fetch current LLM settings
  const { data: llmSettings, isLoading: settingsLoading } = useQuery({
    queryKey: ['llm-settings'],
    queryFn: async () => {
      const response = await api.get('/settings/llm')
      return response.data
    },
  })

  // Save LLM settings mutation
  const saveLLMSettings = useMutation({
    mutationFn: async (settings: any) => {
      const response = await api.post('/settings/llm', settings)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['llm-settings'] })
      alert('LLM settings saved successfully!')
    },
    onError: (error: any) => {
      alert(`Error saving settings: ${error.response?.data?.message || error.message}`)
    },
  })

  const handleSaveLLMSettings = () => {
    saveLLMSettings.mutate({
      openaiApiKey: openAIKey || undefined,
      anthropicApiKey: anthropicKey || undefined,
      geminiApiKey: geminiKey || undefined,
      cohereApiKey: cohereKey || undefined,
      mistralApiKey: mistralKey || undefined,
      huggingfaceApiKey: huggingFaceKey || undefined,
      ollamaUrl: ollamaUrl || undefined,
    })
  }

  const tabs = [
    { name: 'Profile', id: 'profile' },
    { name: 'Organization', id: 'organization' },
    { name: 'API Keys', id: 'api-keys' },
    { name: 'Billing', id: 'billing' },
    { name: 'Team', id: 'team' },
    { name: 'Notifications', id: 'notifications' },
    { name: 'Permissions', id: 'permissions' },
    { name: 'Appearance', id: 'appearance' },
  ]

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Manage your account preferences and configuration
        </p>
      </div>

      {/* Tabs */}
      <Tab.Group>
        <Tab.List className="flex space-x-1 border-b border-gray-200 dark:border-gray-700 mb-8">
          {tabs.map((tab) => (
            <Tab key={tab.id} as={Fragment}>
              {({ selected }) => (
                <button
                  className={clsx(
                    'px-4 py-3 text-sm font-medium transition-all',
                    'border-b-2 -mb-px',
                    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
                    selected
                      ? 'border-primary-600 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
                  )}
                >
                  {tab.name}
                </button>
              )}
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels>
          {/* Profile Tab */}
          <Tab.Panel className="space-y-6">{renderProfileTab()}</Tab.Panel>

          {/* Organization Tab */}
          <Tab.Panel className="space-y-6">{renderOrganizationTab()}</Tab.Panel>

          {/* API Keys Tab */}
          <Tab.Panel className="space-y-6">{renderApiKeysTab()}</Tab.Panel>

          {/* Billing Tab */}
          <Tab.Panel className="space-y-6">{renderBillingTab()}</Tab.Panel>

          {/* Team Tab */}
          <Tab.Panel className="space-y-6">{renderTeamTab()}</Tab.Panel>

          {/* Notifications Tab */}
          <Tab.Panel className="space-y-6">{renderNotificationsTab()}</Tab.Panel>

          {/* Permissions Tab */}
          <Tab.Panel className="space-y-6">{renderPermissionsTab()}</Tab.Panel>

          {/* Appearance Tab */}
          <Tab.Panel className="space-y-6">{renderAppearanceTab()}</Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )

  function renderProfileTab() {
    return (
      <div className="space-y-6">

        {/* Profile Information */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Your account details and preferences</p>
          </div>
          <div className="px-6 py-5 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={`${user?.firstName || ''} ${user?.lastName || ''}`}
                  disabled
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
                <button className="px-4 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Edit
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
              <div className="flex items-center gap-3">
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
                <button className="px-4 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Password</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Update your password to keep your account secure</p>
          </div>
          <div className="px-6 py-5">
            <button className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition">
              Change Password
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderOrganizationTab() {
    return (
      <div className="space-y-6">
        {/* Organization Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Organization Details</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your organization information</p>
          </div>
          <div className="px-6 py-5 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Organization Name</label>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={organization?.name || ''}
                  disabled
                  className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white text-sm"
                />
                <button className="px-4 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                  Edit
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Plan</label>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 capitalize">
                  {organization?.plan || 'Free'}
                </span>
                <button className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition">
                  Upgrade Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderApiKeysTab() {
    return (
      <div className="space-y-6">

        {/* LLM API Keys Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">LLM Provider API Keys</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Configure API keys for different LLM providers to use in your agents
            </p>
          </div>
          <div className="px-6 py-5">

        <div className="space-y-6">
          {/* OpenAI */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">OpenAI</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Use GPT-4, GPT-3.5, and other OpenAI models
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showOpenAIKey ? "text" : "password"}
                      value={openAIKey}
                      onChange={(e) => setOpenAIKey(e.target.value)}
                      placeholder={llmSettings?.hasOpenAIKey ? "••••••••••••••••" : "sk-..."}
                      className="w-full px-3 py-2 pr-10 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowOpenAIKey(!showOpenAIKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showOpenAIKey ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">OpenAI Platform</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Anthropic (Claude) */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Anthropic (Claude)</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Use Claude 3 Opus, Sonnet, and Haiku models
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showAnthropicKey ? "text" : "password"}
                      value={anthropicKey}
                      onChange={(e) => setAnthropicKey(e.target.value)}
                      placeholder={llmSettings?.hasAnthropicKey ? "••••••••••••••••" : "sk-ant-..."}
                      className="w-full px-3 py-2 pr-10 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowAnthropicKey(!showAnthropicKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showAnthropicKey ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your API key from <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Anthropic Console</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Google Gemini */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5zm0 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm-1-9h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Google Gemini</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Use Gemini Pro, Gemini Ultra, and other Google AI models
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showGeminiKey ? "text" : "password"}
                      value={geminiKey}
                      onChange={(e) => setGeminiKey(e.target.value)}
                      placeholder={llmSettings?.hasGeminiKey ? "••••••••••••••••" : "AIza..."}
                      className="w-full px-3 py-2 pr-10 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowGeminiKey(!showGeminiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showGeminiKey ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Google AI Studio</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cohere */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Cohere</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Use Command, Command Light, and embedding models
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showCohereKey ? "text" : "password"}
                      value={cohereKey}
                      onChange={(e) => setCohereKey(e.target.value)}
                      placeholder={llmSettings?.hasCohereKey ? "••••••••••••••••" : "co-..."}
                      className="w-full px-3 py-2 pr-10 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCohereKey(!showCohereKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showCohereKey ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your API key from <a href="https://dashboard.cohere.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Cohere Dashboard</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Mistral AI */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Mistral AI</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Use Mistral Large, Mistral Medium, and other European models
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showMistralKey ? "text" : "password"}
                      value={mistralKey}
                      onChange={(e) => setMistralKey(e.target.value)}
                      placeholder={llmSettings?.hasMistralKey ? "••••••••••••••••" : "mst-..."}
                      className="w-full px-3 py-2 pr-10 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowMistralKey(!showMistralKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showMistralKey ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your API key from <a href="https://console.mistral.ai/api-keys" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">Mistral Console</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* HuggingFace */}
          <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-amber-100 dark:bg-amber-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">HuggingFace</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Access thousands of open-source models via Inference API
                </p>
                <div className="space-y-2">
                  <div className="relative">
                    <input
                      type={showHuggingFaceKey ? "text" : "password"}
                      value={huggingFaceKey}
                      onChange={(e) => setHuggingFaceKey(e.target.value)}
                      placeholder={llmSettings?.hasHuggingFaceKey ? "••••••••••••••••" : "hf_..."}
                      className="w-full px-3 py-2 pr-10 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowHuggingFaceKey(!showHuggingFaceKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showHuggingFaceKey ? "👁️" : "👁️‍🗨️"}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Get your API key from <a href="https://huggingface.co/settings/tokens" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">HuggingFace Settings</a>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ollama (Local) */}
          <div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Ollama (Local Models)</h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                  Run models locally with Ollama - no API key required
                </p>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={ollamaUrl}
                    onChange={(e) => setOllamaUrl(e.target.value)}
                    placeholder={llmSettings?.ollamaUrl || "http://localhost:11434"}
                    className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">ollama.ai</a> and enter your Ollama server URL
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  setOpenAIKey('')
                  setAnthropicKey('')
                  setGeminiKey('')
                  setCohereKey('')
                  setMistralKey('')
                  setHuggingFaceKey('')
                  setOllamaUrl('')
                }}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLLMSettings}
                disabled={saveLLMSettings.isPending}
                className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition disabled:opacity-50"
              >
                {saveLLMSettings.isPending ? 'Saving...' : 'Save API Keys'}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  function renderBillingTab() {
    // Fetch subscription
    const { data: subscription } = useQuery({
      queryKey: ['subscription'],
      queryFn: async () => {
        const response = await api.get('/billing/subscription');
        return response.data;
      },
    });

    // Fetch invoices
    const { data: invoices = [] } = useQuery({
      queryKey: ['invoices'],
      queryFn: async () => {
        const response = await api.get('/billing/invoices');
        return response.data;
      },
    });

    const formatCurrency = (amount: number, currency: string = 'usd') => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
      }).format(amount / 100);
    };

    const formatDate = (timestamp: number) => {
      return new Date(timestamp * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    };

    return (
      <div className="space-y-6">
        {/* Current Subscription */}
        <div className="bg-gradient-to-r from-primary-50 to-purple-50 dark:from-primary-900/20 dark:to-purple-900/20 rounded-xl border border-primary-200 dark:border-primary-800 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-600 rounded-lg">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {organization?.plan === 'pro' ? 'Pro Plan' : organization?.plan === 'enterprise' ? 'Enterprise Plan' : 'Free Plan'}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {organization?.plan === 'free' 
                    ? 'Upgrade to unlock more features' 
                    : `Next billing: ${subscription?.next_billing_date ? formatDate(subscription.next_billing_date) : 'N/A'}`
                  }
                </p>
              </div>
            </div>
            {organization?.plan !== 'enterprise' && (
              <button 
                onClick={() => window.location.href = '/dashboard/billing'}
                className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition"
              >
                {organization?.plan === 'free' ? 'Upgrade Plan' : 'Manage Plan'}
              </button>
            )}
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Payment Method</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage your payment methods</p>
            </div>
            <button className="px-4 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              Add Card
            </button>
          </div>
          <div className="px-6 py-5">
            <div className="flex items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <CreditCardIcon className="w-6 h-6 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Visa •••• 4242
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Expires 12/2025
                </p>
              </div>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                Default
              </span>
            </div>
          </div>
        </div>

        {/* Recent Invoices */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Recent Invoices</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Your billing history</p>
            </div>
            <button 
              onClick={() => window.location.href = '/dashboard/billing'}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
            >
              View all →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Invoice
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Download
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {invoices.slice(0, 5).map((invoice: any) => (
                  <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <DocumentTextIcon className="w-5 h-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {invoice.number || invoice.id}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(invoice.created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(invoice.amount, invoice.currency)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {invoice.invoice_pdf && (
                        <a
                          href={invoice.invoice_pdf}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-primary-600 hover:text-primary-700 dark:text-primary-400"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No invoices yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  function renderTeamTab() {
    return (
      <div className="space-y-6">
        {/* Team Members */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Team Members</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage who has access to your organization</p>
            </div>
            <button className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition">
              Invite Member
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {/* Example team member */}
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-xs font-bold">
                        {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {user?.firstName} {user?.lastName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {user?.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                      Owner
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                      •••
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Invitations */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Pending Invitations</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Invitations waiting to be accepted</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
              No pending invitations
            </p>
          </div>
        </div>
      </div>
    )
  }

  function renderNotificationsTab() {
    return (
      <div className="space-y-6">
        {/* Email Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Email Notifications</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Choose what updates you want to receive via email</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Workflow completions</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when your workflows finish running</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Agent responses</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Get notified about agent conversations</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Team invitations</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Get notified when you're invited to a team</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Knowledge base updates</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Get notified about knowledge base changes</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* In-App Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">In-App Notifications</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Control notifications that appear in the app</p>
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Show desktop notifications</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Display browser notifications when the app is in background</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Play notification sound</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Play a sound when you receive a notification</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Email Digest */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Email Digest</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Receive a summary of your activity</p>
          </div>
          <div className="px-6 py-5">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent">
              <option value="never">Never</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>
    )
  }

  function renderPermissionsTab() {
    return (
      <div className="space-y-6">
        {/* Roles Overview */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Roles & Permissions</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Manage role-based access control for your organization</p>
          </div>
          <div className="px-6 py-5">
            <div className="space-y-4">
              {/* Owner Role */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Owner</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Full access to all resources and settings</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                    Admin
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Manage users
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Manage billing
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Create/edit agents
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Delete resources
                  </div>
                </div>
              </div>

              {/* Admin Role */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Admin</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage team and resources, no billing access</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                    Admin
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Manage users
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Manage billing
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Create/edit agents
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Delete resources
                  </div>
                </div>
              </div>

              {/* Member Role */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Member</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Standard user with basic permissions</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    Standard
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Manage users
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Manage billing
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Use agents
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Delete resources
                  </div>
                </div>
              </div>

              {/* Viewer Role */}
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Viewer</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Read-only access to resources</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                    Read-only
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Manage users
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Manage billing
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                    <svg className="w-3.5 h-3.5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    View resources
                  </div>
                  <div className="flex items-center gap-1.5 text-gray-400 dark:text-gray-600">
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    Delete resources
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Permissions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Advanced Settings</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Fine-grained permission controls</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              For detailed permission management and custom roles, visit the full permissions page.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard/permissions'}
              className="px-4 py-2.5 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Advanced Permissions →
            </button>
          </div>
        </div>
      </div>
    )
  }

  function renderAppearanceTab() {
    return (
      <div className="space-y-6">
        {/* Theme */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Theme</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Customize how the interface looks</p>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-3 gap-4">
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-primary-600 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <div className="w-full h-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Light</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <div className="w-full h-20 bg-gray-900 border border-gray-700 rounded"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">Dark</span>
              </button>
              <button className="flex flex-col items-center gap-2 p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                <div className="w-full h-20 bg-gradient-to-r from-white to-gray-900 border border-gray-300 rounded"></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">System</span>
              </button>
            </div>
          </div>
        </div>

        {/* Language */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Language</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Choose your preferred language</p>
          </div>
          <div className="px-6 py-5">
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent">
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="fr">Français</option>
              <option value="de">Deutsch</option>
            </select>
          </div>
        </div>

        {/* Timezone */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">Timezone</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Set your local timezone</p>
          </div>
          <div className="px-6 py-5">
            <select className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-600 focus:border-transparent">
              <option value="UTC">UTC</option>
              <option value="America/New_York">Eastern Time (ET)</option>
              <option value="America/Chicago">Central Time (CT)</option>
              <option value="America/Denver">Mountain Time (MT)</option>
              <option value="America/Los_Angeles">Pacific Time (PT)</option>
              <option value="Europe/London">London (GMT)</option>
              <option value="Europe/Paris">Paris (CET)</option>
            </select>
          </div>
        </div>
      </div>
    )
  }
}
