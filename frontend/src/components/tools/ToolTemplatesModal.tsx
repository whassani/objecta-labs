'use client'

import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toolsApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface ToolTemplatesModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ToolTemplatesModal({ isOpen, onClose }: ToolTemplatesModalProps) {
  const queryClient = useQueryClient()

  const { data: templates, isLoading } = useQuery({
    queryKey: ['tool-templates'],
    queryFn: () => toolsApi.getTemplates().then(res => res.data),
    enabled: isOpen,
  })

  const createFromTemplateMutation = useMutation({
    mutationFn: (template: any) => toolsApi.create(template),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success('Tool created from template')
      onClose()
    },
    onError: () => {
      toast.error('Failed to create tool from template')
    },
  })

  const actionTypeColors: any = {
    read: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    write: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  }

  return (
    <Transition appear show={isOpen} as={Fragment}>
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
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">
                    Tool Templates
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="animate-pulse">
                        <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {templates?.map((template: any, index: number) => (
                      <div
                        key={index}
                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-300 dark:hover:border-primary-700 transition"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                              <WrenchScrewdriverIcon className="h-5 w-5 text-primary-600" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                                  {template.name}
                                </h4>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionTypeColors[template.actionType]}`}>
                                  {template.actionType}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {template.description}
                              </p>
                              {template.config?.url && (
                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                  URL: {template.config.url}
                                </p>
                              )}
                            </div>
                          </div>
                          <button
                            onClick={() => createFromTemplateMutation.mutate(template)}
                            disabled={createFromTemplateMutation.isPending}
                            className="ml-4 px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 disabled:opacity-50 transition"
                          >
                            Use Template
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  )
}
