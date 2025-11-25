'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PlayIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useMutation } from '@tanstack/react-query'
import { toolsApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface TestToolModalProps {
  isOpen: boolean
  onClose: () => void
  tool: any
}

export default function TestToolModal({ isOpen, onClose, tool }: TestToolModalProps) {
  const [input, setInput] = useState('')
  const [result, setResult] = useState<any>(null)

  const testMutation = useMutation({
    mutationFn: (data: any) => toolsApi.test(tool.id, data),
    onSuccess: (response) => {
      setResult(response.data)
      if (response.data.success) {
        toast.success('Tool executed successfully')
      } else {
        toast.error('Tool execution failed')
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to test tool')
      setResult({
        success: false,
        error: error?.response?.data?.message || 'Unknown error',
        executionTime: 0,
      })
    },
  })

  const handleTest = () => {
    let parsedInput: any = {}
    
    try {
      if (input.trim()) {
        parsedInput = JSON.parse(input)
      }
    } catch (e) {
      // If not valid JSON, treat as string input
      if (tool.toolType === 'calculator') {
        parsedInput = { expression: input }
      } else {
        parsedInput = { input: input }
      }
    }

    testMutation.mutate({ input: parsedInput })
  }

  const getPlaceholder = () => {
    switch (tool.toolType) {
      case 'calculator':
        return '2 + 2 * 3\n\nor JSON:\n{\n  "expression": "2 + 2 * 3"\n}'
      case 'http-api':
        return '{\n  "params": {\n    "city": "London"\n  }\n}'
      default:
        return '{\n  "key": "value"\n}'
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
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
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white mb-2">
                      Test Tool: {tool?.name}
                    </Dialog.Title>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                      {tool?.description}
                    </p>

                    <div className="space-y-4">
                      {/* Input Section */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Input {tool.toolType === 'calculator' ? '(expression or JSON)' : '(JSON)'}
                        </label>
                        <textarea
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          rows={6}
                          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white sm:text-sm font-mono"
                          placeholder={getPlaceholder()}
                        />
                      </div>

                      {/* Test Button */}
                      <button
                        onClick={handleTest}
                        disabled={testMutation.isPending}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
                      >
                        <PlayIcon className="h-5 w-5 mr-2" />
                        {testMutation.isPending ? 'Testing...' : 'Test Tool'}
                      </button>

                      {/* Result Section */}
                      {result && (
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Result
                            </label>
                            <div className="flex items-center space-x-2">
                              {result.success ? (
                                <>
                                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                                  <span className="text-sm text-green-600 dark:text-green-400">Success</span>
                                </>
                              ) : (
                                <>
                                  <XCircleIcon className="h-5 w-5 text-red-500" />
                                  <span className="text-sm text-red-600 dark:text-red-400">Failed</span>
                                </>
                              )}
                              <span className="text-sm text-gray-500 dark:text-gray-400">
                                ({result.executionTime}ms)
                              </span>
                            </div>
                          </div>

                          <div className={`rounded-lg p-4 ${
                            result.success
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          }`}>
                            <pre className="text-sm text-gray-900 dark:text-gray-100 overflow-x-auto">
                              {JSON.stringify(result.success ? result.result : { error: result.error }, null, 2)}
                            </pre>
                          </div>

                          {/* Metadata */}
                          <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Tool ID:</span>
                              <span className="ml-2 text-gray-900 dark:text-gray-100 font-mono">{result.toolId}</span>
                            </div>
                            <div>
                              <span className="text-gray-500 dark:text-gray-400">Tool Name:</span>
                              <span className="ml-2 text-gray-900 dark:text-gray-100">{result.toolName}</span>
                            </div>
                            {result.timestamp && (
                              <div className="col-span-2">
                                <span className="text-gray-500 dark:text-gray-400">Timestamp:</span>
                                <span className="ml-2 text-gray-900 dark:text-gray-100">
                                  {new Date(result.timestamp).toLocaleString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Quick Examples */}
                    {tool.toolType === 'calculator' && (
                      <div className="mt-6 rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                          Quick Examples:
                        </h4>
                        <div className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                          <button
                            onClick={() => setInput('2 + 2')}
                            className="block hover:underline"
                          >
                            → 2 + 2
                          </button>
                          <button
                            onClick={() => setInput('(15 * 23) + 100')}
                            className="block hover:underline"
                          >
                            → (15 * 23) + 100
                          </button>
                          <button
                            onClick={() => setInput('100 / 4 - 10')}
                            className="block hover:underline"
                          >
                            → 100 / 4 - 10
                          </button>
                        </div>
                      </div>
                    )}

                    {tool.toolType === 'http-api' && (
                      <div className="mt-6 rounded-md bg-blue-50 dark:bg-blue-900/20 p-4">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300 mb-2">
                          API Configuration:
                        </h4>
                        <div className="space-y-1 text-sm text-blue-700 dark:text-blue-400">
                          <div><strong>URL:</strong> {tool.config?.url || 'Not configured'}</div>
                          <div><strong>Method:</strong> {tool.config?.method || 'GET'}</div>
                          <div><strong>Auth:</strong> {tool.config?.auth?.type || 'none'}</div>
                        </div>
                      </div>
                    )}
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
