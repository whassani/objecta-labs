'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toolsApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface CreateToolModalProps {
  isOpen: boolean
  onClose: () => void
  agentId?: string
}

const toolTypes = [
  { value: 'http-api', label: 'HTTP API', description: 'Make REST API calls' },
  { value: 'calculator', label: 'Calculator', description: 'Perform calculations' },
  { value: 'database', label: 'Database', description: 'Query databases' },
  { value: 'custom', label: 'Custom', description: 'Custom code execution' },
]

const actionTypes = [
  { value: 'read', label: 'Read', description: 'Read data only' },
  { value: 'write', label: 'Write', description: 'Create new data' },
  { value: 'update', label: 'Update', description: 'Modify existing data' },
  { value: 'delete', label: 'Delete', description: 'Remove data' },
]

const authTypes = [
  { value: 'none', label: 'None' },
  { value: 'bearer', label: 'Bearer Token' },
  { value: 'basic', label: 'Basic Auth' },
  { value: 'api-key', label: 'API Key' },
]

export default function CreateToolModal({ isOpen, onClose, agentId }: CreateToolModalProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    toolType: 'http-api',
    actionType: 'read',
    isEnabled: true,
    requiresApproval: false,
    rateLimit: 60,
    agentId: agentId || '',
    config: {
      url: '',
      method: 'GET',
      headers: {},
      auth: {
        type: 'none',
        credentials: {
          token: '',
          apiKey: '',
          headerName: 'X-API-Key',
        },
      },
    },
    schema: {},
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => toolsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tool created successfully')
      onClose()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to create tool')
    },
  })

  const resetForm = () => {
    setStep(1)
    setFormData({
      name: '',
      description: '',
      toolType: 'http-api',
      actionType: 'read',
      isEnabled: true,
      requiresApproval: false,
      rateLimit: 60,
      agentId: agentId || '',
      config: {
        url: '',
        method: 'GET',
        headers: {},
        auth: {
          type: 'none',
          credentials: {
            token: '',
            apiKey: '',
            headerName: 'X-API-Key',
          },
        },
      },
      schema: {},
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    createMutation.mutate(formData)
  }

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tool Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                placeholder="e.g., Get Weather Data"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Description *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                placeholder="Describe what this tool does..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tool Type *
              </label>
              <select
                value={formData.toolType}
                onChange={(e) => setFormData({ ...formData, toolType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              >
                {toolTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Action Type *
              </label>
              <select
                value={formData.actionType}
                onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
              >
                {actionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Configuration</h3>

            {formData.toolType === 'http-api' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    API URL *
                  </label>
                  <input
                    type="url"
                    value={formData.config.url}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, url: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    placeholder="https://api.example.com/endpoint"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    HTTP Method
                  </label>
                  <select
                    value={formData.config.method}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, method: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Authentication Type
                  </label>
                  <select
                    value={formData.config.auth.type}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: {
                        ...formData.config,
                        auth: { ...formData.config.auth, type: e.target.value }
                      }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                  >
                    {authTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {formData.config.auth.type === 'bearer' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bearer Token
                    </label>
                    <input
                      type="password"
                      value={formData.config.auth.credentials.token || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        config: {
                          ...formData.config,
                          auth: {
                            ...formData.config.auth,
                            credentials: { token: e.target.value }
                          }
                        }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                      placeholder="Enter bearer token"
                    />
                  </div>
                )}

                {formData.config.auth.type === 'api-key' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Header Name
                      </label>
                      <input
                        type="text"
                        value={formData.config.auth.credentials.headerName || 'X-API-Key'}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            auth: {
                              ...formData.config.auth,
                              credentials: {
                                ...formData.config.auth.credentials,
                                headerName: e.target.value
                              }
                            }
                          }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        placeholder="X-API-Key"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        API Key
                      </label>
                      <input
                        type="password"
                        value={formData.config.auth.credentials.apiKey || ''}
                        onChange={(e) => setFormData({
                          ...formData,
                          config: {
                            ...formData.config,
                            auth: {
                              ...formData.config.auth,
                              credentials: {
                                ...formData.config.auth.credentials,
                                apiKey: e.target.value
                              }
                            }
                          }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                        placeholder="Enter API key"
                      />
                    </div>
                  </>
                )}
              </>
            )}

            {formData.toolType === 'calculator' && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Calculator tool requires no additional configuration. It will safely evaluate mathematical expressions.
                </p>
              </div>
            )}
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Settings</h3>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Rate Limit (requests per minute)
              </label>
              <input
                type="number"
                value={formData.rateLimit}
                onChange={(e) => setFormData({ ...formData, rateLimit: parseInt(e.target.value) })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                min="1"
                max="1000"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="isEnabled"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isEnabled" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Enable tool immediately
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="requiresApproval"
                checked={formData.requiresApproval}
                onChange={(e) => setFormData({ ...formData, requiresApproval: e.target.checked })}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="requiresApproval" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Require approval before execution
              </label>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white dark:bg-gray-800 text-gray-400 hover:text-gray-500"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="w-full mt-3 sm:mt-0">
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-6">
                      Create New Tool
                    </Dialog.Title>

                    {/* Progress Steps */}
                    <div className="mb-8">
                      <div className="flex items-center justify-between">
                        {[1, 2, 3].map((s) => (
                          <div key={s} className="flex items-center">
                            <div
                              className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                step >= s
                                  ? 'bg-primary-600 text-white'
                                  : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                              }`}
                            >
                              {s}
                            </div>
                            {s < 3 && (
                              <div
                                className={`w-16 h-1 mx-2 ${
                                  step > s ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-700'
                                }`}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">Basic Info</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Configuration</span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">Settings</span>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit}>
                      {renderStepContent()}

                      <div className="mt-6 flex justify-between">
                        <button
                          type="button"
                          onClick={() => setStep(Math.max(1, step - 1))}
                          disabled={step === 1}
                          className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                          Previous
                        </button>

                        <div className="flex space-x-3">
                          <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
                          >
                            Cancel
                          </button>

                          {step < 3 ? (
                            <button
                              type="button"
                              onClick={() => setStep(step + 1)}
                              className="inline-flex justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              type="submit"
                              disabled={createMutation.isPending}
                              className="inline-flex justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
                            >
                              {createMutation.isPending ? 'Creating...' : 'Create Tool'}
                            </button>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
