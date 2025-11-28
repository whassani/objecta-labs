'use client'

import { useQuery } from '@tanstack/react-query'
import { workspacesApi } from '@/lib/api'

interface WorkspaceSelectorProps {
  value: string
  onChange: (workspaceId: string) => void
  label?: string
  placeholder?: string
  includeNone?: boolean
  className?: string
}

export function WorkspaceSelector({
  value,
  onChange,
  label = 'Workspace',
  placeholder = 'Select a workspace',
  includeNone = true,
  className = '',
}: WorkspaceSelectorProps) {
  const { data: workspaces, isLoading } = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => workspacesApi.getAll().then(res => res.data),
  })

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={isLoading}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-600 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {includeNone && (
          <option value="">Organization-wide (no workspace)</option>
        )}
        {isLoading ? (
          <option disabled>Loading workspaces...</option>
        ) : (
          workspaces?.map((workspace: any) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.icon} {workspace.name}
            </option>
          ))
        )}
      </select>
      {!isLoading && workspaces && workspaces.length === 0 && (
        <p className="mt-1 text-xs text-gray-500">
          No workspaces available. Create one first.
        </p>
      )}
    </div>
  )
}
