'use client'

import { Fragment, useState } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toolsApi } from '@/lib/api'
import toast from 'react-hot-toast'

interface ImportToolsModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ImportToolsModal({ isOpen, onClose }: ImportToolsModalProps) {
  const queryClient = useQueryClient()
  const [jsonContent, setJsonContent] = useState('')
  const [file, setFile] = useState<File | null>(null)

  const importMutation = useMutation({
    mutationFn: (tools: any[]) => toolsApi.import(tools),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['tools'] })
      toast.success(`Successfully imported ${response.data.length} tools`)
      onClose()
      setJsonContent('')
      setFile(null)
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to import tools')
    },
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        setJsonContent(content)
      }
      reader.readAsText(selectedFile)
    }
  }

  const handleImport = () => {
    try {
      const tools = JSON.parse(jsonContent)
      if (!Array.isArray(tools)) {
        toast.error('Invalid format: Expected an array of tools')
        return
      }
      importMutation.mutate(tools)
    } catch (error) {
      toast.error('Invalid JSON format')
    }
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
              <Dialog.Panel className="w-full max-w-3xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900 dark:text-white">
                    Import Tools
                  </Dialog.Title>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* File Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload JSON File
                    </label>
                    <div className="flex items-center justify-center w-full">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <ArrowUpTrayIcon className="w-10 h-10 mb-3 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">Click to upload</span> or drag and drop
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            JSON file with tool configurations
                          </p>
                        </div>
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleFileChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {file && (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Selected: {file.name}
                      </p>
                    )}
                  </div>

                  {/* Or Paste JSON */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Or Paste JSON
                    </label>
                    <textarea
                      value={jsonContent}
                      onChange={(e) => setJsonContent(e.target.value)}
                      rows={12}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                      placeholder='[
  {
    "name": "Tool Name",
    "description": "Tool description",
    "toolType": "http-api",
    "actionType": "read",
    "config": { ... }
  }
]'
                    />
                  </div>

                  {/* Info */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <strong>Note:</strong> The JSON should contain an array of tool configurations. 
                      You can export existing tools and modify them, or create new configurations from scratch.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleImport}
                    disabled={!jsonContent || importMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 disabled:opacity-50"
                  >
                    {importMutation.isPending ? 'Importing...' : 'Import Tools'}
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
