'use client'

import { Fragment, useState, useEffect } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toolsApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface CreateToolModalProps {
  isOpen: boolean
  onClose: () => void
  agentId?: string
  tool?: any // If provided, we're editing instead of creating
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

export default function CreateToolModal({ isOpen, onClose, agentId, tool }: CreateToolModalProps) {
  const queryClient = useQueryClient()
  const [step, setStep] = useState(1)
  const [canSubmit, setCanSubmit] = useState(false)
  const isEditMode = !!tool
  const totalSteps = 4 // Updated to 4 steps including Advanced Configuration
  
  const getInitialFormData = () => {
    if (tool) {
      return {
        name: tool.name || '',
        description: tool.description || '',
        toolType: tool.toolType || 'http-api',
        actionType: tool.actionType || 'read',
        isEnabled: tool.isEnabled ?? true,
        requiresApproval: tool.requiresApproval ?? false,
        rateLimit: tool.rateLimit || 60,
        agentId: tool.agentId || agentId || '',
        config: tool.config || {
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
        schema: tool.schema || {},
      }
    }
    return {
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
    }
  }
  
  const [formData, setFormData] = useState<any>(getInitialFormData())

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

  const updateMutation = useMutation({
    mutationFn: (data: any) => toolsApi.update(tool?.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tool updated successfully')
      onClose()
      resetForm()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update tool')
    },
  })

  const resetForm = () => {
    setStep(1)
    setFormData(getInitialFormData())
  }
  
  // Reset form data when modal opens or tool prop changes
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData())
      setStep(1)
      setCanSubmit(false)
    }
  }, [isOpen, tool])
  
  // Enable submission only when on final step
  useEffect(() => {
    if (step === totalSteps) {
      // Add a small delay to prevent immediate submission
      const timer = setTimeout(() => {
        setCanSubmit(true)
      }, 100)
      return () => clearTimeout(timer)
    } else {
      setCanSubmit(false)
    }
  }, [step, totalSteps])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Only submit if we're on the final step AND submission is allowed
    if (step !== totalSteps || !canSubmit) {
      return
    }
    
    if (isEditMode) {
      // For updates, exclude fields that shouldn't be changed
      const { toolType, actionType, agentId, ...updateData } = formData
      updateMutation.mutate(updateData)
    } else {
      createMutation.mutate(formData)
    }
  }
  
  const handleNext = () => {
    setCanSubmit(false) // Prevent submission when navigating
    setStep(step + 1)
  }
  
  const handlePrevious = () => {
    setStep(Math.max(1, step - 1))
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
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Tool Type *
              </label>
              <select
                value={formData.toolType}
                onChange={(e) => setFormData({ ...formData, toolType: e.target.value })}
                disabled={isEditMode}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {toolTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
              {isEditMode && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Tool type cannot be changed after creation
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Action Type *
              </label>
              <select
                value={formData.actionType}
                onChange={(e) => setFormData({ ...formData, actionType: e.target.value })}
                disabled={isEditMode}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label} - {type.description}
                  </option>
                ))}
              </select>
              {isEditMode && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Action type cannot be changed after creation
                </p>
              )}
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
                    type="text"
                    value={formData.config.url}
                    onChange={(e) => setFormData({
                      ...formData,
                      config: { ...formData.config, url: e.target.value }
                    })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm"
                    placeholder="https://api.example.com/endpoint"
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

      case 4:
        return (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Advanced Configuration</h3>

            {/* Retry Configuration */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Auto-Retry</h4>
                <input
                  type="checkbox"
                  checked={formData.retryConfig?.enabled || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    retryConfig: {
                      enabled: e.target.checked,
                      maxRetries: formData.retryConfig?.maxRetries || 3,
                      retryDelay: formData.retryConfig?.retryDelay || 1000,
                      retryOn: formData.retryConfig?.retryOn || ['5xx', 'network'],
                      backoffMultiplier: formData.retryConfig?.backoffMultiplier || 2,
                    }
                  })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              
              {formData.retryConfig?.enabled && (
                <div className="space-y-3 mt-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Max Retries</label>
                      <input
                        type="number"
                        value={formData.retryConfig?.maxRetries || 3}
                        onChange={(e) => setFormData({
                          ...formData,
                          retryConfig: { ...formData.retryConfig, maxRetries: parseInt(e.target.value) }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        min="1"
                        max="10"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Retry Delay (ms)</label>
                      <input
                        type="number"
                        value={formData.retryConfig?.retryDelay || 1000}
                        onChange={(e) => setFormData({
                          ...formData,
                          retryConfig: { ...formData.retryConfig, retryDelay: parseInt(e.target.value) }
                        })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                        min="100"
                        step="100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Retry On (comma-separated)</label>
                    <input
                      type="text"
                      value={formData.retryConfig?.retryOn?.join(', ') || '5xx, network'}
                      onChange={(e) => setFormData({
                        ...formData,
                        retryConfig: { 
                          ...formData.retryConfig, 
                          retryOn: e.target.value.split(',').map(s => s.trim()) 
                        }
                      })}
                      placeholder="5xx, network, ETIMEDOUT"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">e.g., 5xx, 429, network, ETIMEDOUT</p>
                  </div>
                </div>
              )}
            </div>

            {/* Response Transformation */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Response Transformation</h4>
                <input
                  type="checkbox"
                  checked={formData.responseTransform?.enabled || false}
                  onChange={(e) => setFormData({
                    ...formData,
                    responseTransform: {
                      enabled: e.target.checked,
                      type: formData.responseTransform?.type || 'jsonpath',
                      expression: formData.responseTransform?.expression || '$.data',
                    }
                  })}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
              </div>
              
              {formData.responseTransform?.enabled && (
                <div className="space-y-3 mt-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Type</label>
                    <select
                      value={formData.responseTransform?.type || 'jsonpath'}
                      onChange={(e) => setFormData({
                        ...formData,
                        responseTransform: { ...formData.responseTransform, type: e.target.value as any }
                      })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                    >
                      <option value="jsonpath">JSONPath</option>
                      <option value="javascript">JavaScript</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">Expression</label>
                    <textarea
                      value={formData.responseTransform?.expression || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        responseTransform: { ...formData.responseTransform, expression: e.target.value }
                      })}
                      rows={3}
                      placeholder={formData.responseTransform?.type === 'jsonpath' ? '$.data[*].id' : 'return data.map(item => item.id);'}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm font-mono"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      {formData.responseTransform?.type === 'jsonpath' 
                        ? 'e.g., $.data[*], $.results[?(@.active)]' 
                        : 'e.g., return data.filter(x => x.value > 10);'}
                    </p>
                  </div>
                </div>
              )}
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
                      {isEditMode ? 'Edit Tool' : 'Create New Tool'}
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

                    <form onSubmit={handleSubmit} onKeyDown={(e) => {
                      // Prevent form submission on Enter key unless on final step
                      if (e.key === 'Enter' && step !== 3) {
                        e.preventDefault()
                      }
                    }}>
                      {renderStepContent()}

                      <div className="mt-6 flex justify-between">
                        <button
                          type="button"
                          onClick={handlePrevious}
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

                          {step < totalSteps ? (
                            <button
                              type="button"
                              onClick={handleNext}
                              className="inline-flex justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700"
                            >
                              Next
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSubmit}
                              disabled={createMutation.isPending || updateMutation.isPending || !canSubmit}
                              className="inline-flex justify-center rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 disabled:opacity-50"
                            >
                              {isEditMode
                                ? (updateMutation.isPending ? 'Updating...' : 'Update Tool')
                                : (createMutation.isPending ? 'Creating...' : 'Create Tool')
                              }
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
