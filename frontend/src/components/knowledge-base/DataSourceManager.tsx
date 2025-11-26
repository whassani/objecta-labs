'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  FolderSync, 
  Database, 
  Plus, 
  RefreshCw, 
  Settings,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Github,
  Globe,
  FileText,
  Cloud
} from 'lucide-react'
import { api } from '@/lib/api'

interface DataSource {
  id: string
  name: string
  description?: string
  sourceType: string
  syncFrequency: string
  lastSyncedAt?: string
  status: string
  errorMessage?: string
  isEnabled: boolean
  config?: any
}

interface SupportedSource {
  type: string
  name: string
  schema: any
}

interface CreateDataSourceModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface EditDataSourceModalProps {
  isOpen: boolean
  dataSource: DataSource
  onClose: () => void
  onSuccess: () => void
}

function EditDataSourceModal({ isOpen, onClose, onSuccess, dataSource }: EditDataSourceModalProps) {
  const [formData, setFormData] = useState({
    name: dataSource.name,
    description: dataSource.description || '',
    syncFrequency: dataSource.syncFrequency,
    isEnabled: dataSource.isEnabled,
  })
  const [updating, setUpdating] = useState(false)

  const handleUpdate = async () => {
    setUpdating(true)
    try {
      await api.put(`/knowledge-base/data-sources/${dataSource.id}`, formData)
      alert('✅ Data source updated successfully!')
      onSuccess()
    } catch (error: any) {
      alert('❌ Failed to update: ' + (error.response?.data?.message || error.message))
    } finally {
      setUpdating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full">
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            Edit Data Source
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Sync Frequency
              </label>
              <select
                value={formData.syncFrequency}
                onChange={(e) => setFormData({ ...formData, syncFrequency: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="manual">Manual</option>
                <option value="hourly">Hourly</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isEnabled"
                checked={formData.isEnabled}
                onChange={(e) => setFormData({ ...formData, isEnabled: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <label htmlFor="isEnabled" className="text-sm text-gray-700 dark:text-gray-300">
                Enabled
              </label>
            </div>

            {/* Read-only fields */}
            <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Configuration (Read-only)
                </h4>
                <span className="text-xs text-gray-500">Cannot be edited</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-500">
                  Source Type
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 capitalize">
                  {dataSource.sourceType.replace('-', ' ')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-500">
                  Auth Type
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500">
                  API Key
                </div>
              </div>

              {dataSource.config && Object.keys(dataSource.config).length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-500">
                    Configuration
                  </label>
                  <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500">
                    <div className="space-y-1 text-xs font-mono">
                      {Object.entries(dataSource.config).map(([key, value]) => (
                        <div key={key} className="flex">
                          <span className="font-semibold min-w-[100px]">{key}:</span>
                          <span className="truncate">{String(value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1 text-gray-500 dark:text-gray-500">
                  Credentials
                </label>
                <div className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-500 text-sm">
                  ••••••••••••••• (Hidden for security)
                </div>
              </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>💡 Tip:</strong> To change source type, credentials, or configuration, delete this data source and create a new one.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={updating || !formData.name}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {updating ? 'Updating...' : 'Update'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function CreateDataSourceModal({ isOpen, onClose, onSuccess }: CreateDataSourceModalProps) {
  const [step, setStep] = useState<'select' | 'configure'>('select')
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    // GitHub
    githubToken: '',
    githubOwner: '',
    githubRepo: '',
    githubBranch: 'main',
    githubPath: '',
    // Confluence
    confluenceUrl: '',
    confluenceUsername: '',
    confluenceApiToken: '',
    confluenceSpaceKey: '',
    // Notion
    notionToken: '',
    // Google Drive
    googleAccessToken: '',
    googleRefreshToken: '',
    googleClientId: '',
    googleClientSecret: '',
    googleFolderId: '',
  })
  const [testing, setTesting] = useState(false)
  const [creating, setCreating] = useState(false)

  const sources = [
    { type: 'github', name: 'GitHub', icon: '🐙', description: 'Sync markdown files and documentation' },
    { type: 'confluence', name: 'Confluence', icon: '🌐', description: 'Import wiki pages and spaces' },
    { type: 'notion', name: 'Notion', icon: '📝', description: 'Connect pages and databases' },
    { type: 'google-drive', name: 'Google Drive', icon: '☁️', description: 'Sync docs, PDFs, and files' },
  ]

  const handleSelectType = (type: string) => {
    setSelectedType(type)
    setStep('configure')
  }

  const handleTestConnection = async () => {
    if (!selectedType) return

    setTesting(true)
    try {
      const credentials: any = {}
      const config: any = {}

      if (selectedType === 'github') {
        credentials.accessToken = formData.githubToken
        config.owner = formData.githubOwner
        config.repo = formData.githubRepo
        config.branch = formData.githubBranch || 'main'
        if (formData.githubPath) config.path = formData.githubPath
      } else if (selectedType === 'confluence') {
        credentials.baseUrl = formData.confluenceUrl
        credentials.username = formData.confluenceUsername
        credentials.apiToken = formData.confluenceApiToken
        if (formData.confluenceSpaceKey) config.spaceKey = formData.confluenceSpaceKey
      } else if (selectedType === 'notion') {
        credentials.integrationToken = formData.notionToken
      }

      const response = await api.post('/knowledge-base/sync/test-connection', {
        sourceType: selectedType,
        credentials,
        config,
      })

      if (response.data.success) {
        alert('✅ Connection successful!')
      } else {
        alert('❌ Connection failed')
      }
    } catch (error: any) {
      alert('❌ Connection failed: ' + (error.response?.data?.message || error.message))
    } finally {
      setTesting(false)
    }
  }

  const handleCreate = async () => {
    if (!selectedType) return

    setCreating(true)
    try {
      const credentials: any = {}
      const config: any = {}

      if (selectedType === 'github') {
        credentials.accessToken = formData.githubToken
        config.owner = formData.githubOwner
        config.repo = formData.githubRepo
        config.branch = formData.githubBranch || 'main'
        config.fileExtensions = ['.md', '.txt', '.mdx']
        if (formData.githubPath) config.path = formData.githubPath
      } else if (selectedType === 'confluence') {
        credentials.baseUrl = formData.confluenceUrl
        credentials.username = formData.confluenceUsername
        credentials.apiToken = formData.confluenceApiToken
        if (formData.confluenceSpaceKey) config.spaceKey = formData.confluenceSpaceKey
      } else if (selectedType === 'notion') {
        credentials.integrationToken = formData.notionToken
      }

      await api.post('/knowledge-base/data-sources', {
        sourceType: selectedType,
        name: formData.name,
        description: formData.description,
        authType: 'api_key',
        credentials,
        config,
        syncFrequency: 'manual',
      })

      alert('✅ Data source created successfully!')
      onSuccess()
    } catch (error: any) {
      alert('❌ Failed to create: ' + (error.response?.data?.message || error.message))
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">
            {step === 'select' ? 'Select Data Source' : `Configure ${selectedType}`}
          </h3>

          {step === 'select' ? (
            <>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Choose a platform to sync content from:
              </p>
              <div className="grid grid-cols-2 gap-4">
                {sources.map((source) => (
                  <button
                    key={source.type}
                    onClick={() => handleSelectType(source.type)}
                    className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors text-left"
                  >
                    <div className="text-3xl mb-2">{source.icon}</div>
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {source.name}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {source.description}
                    </p>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                {/* Common Fields */}
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="My GitHub Docs"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    placeholder="Documentation repository"
                  />
                </div>

                {/* GitHub Fields */}
                {selectedType === 'github' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Personal Access Token *
                      </label>
                      <input
                        type="password"
                        value={formData.githubToken}
                        onChange={(e) => setFormData({ ...formData, githubToken: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="ghp_xxxxxxxxxxxx"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Get token from: https://github.com/settings/tokens
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Owner *
                        </label>
                        <input
                          type="text"
                          value={formData.githubOwner}
                          onChange={(e) => setFormData({ ...formData, githubOwner: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="username or org"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Repository *
                        </label>
                        <input
                          type="text"
                          value={formData.githubRepo}
                          onChange={(e) => setFormData({ ...formData, githubRepo: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="repo-name"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Branch
                        </label>
                        <input
                          type="text"
                          value={formData.githubBranch}
                          onChange={(e) => setFormData({ ...formData, githubBranch: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="main"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                          Path (optional)
                        </label>
                        <input
                          type="text"
                          value={formData.githubPath}
                          onChange={(e) => setFormData({ ...formData, githubPath: e.target.value })}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="docs/"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Confluence Fields */}
                {selectedType === 'confluence' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Confluence URL *
                      </label>
                      <input
                        type="text"
                        value={formData.confluenceUrl}
                        onChange={(e) => setFormData({ ...formData, confluenceUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="https://your-domain.atlassian.net"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Username (Email) *
                      </label>
                      <input
                        type="email"
                        value={formData.confluenceUsername}
                        onChange={(e) => setFormData({ ...formData, confluenceUsername: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="your-email@example.com"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        API Token *
                      </label>
                      <input
                        type="password"
                        value={formData.confluenceApiToken}
                        onChange={(e) => setFormData({ ...formData, confluenceApiToken: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="API token"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Get token from: Atlassian Account Settings → Security → API tokens
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Space Key (optional)
                      </label>
                      <input
                        type="text"
                        value={formData.confluenceSpaceKey}
                        onChange={(e) => setFormData({ ...formData, confluenceSpaceKey: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="MYSPACE"
                      />
                    </div>
                  </>
                )}

                {/* Notion Fields */}
                {selectedType === 'notion' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                        Integration Token *
                      </label>
                      <input
                        type="password"
                        value={formData.notionToken}
                        onChange={(e) => setFormData({ ...formData, notionToken: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="secret_xxxxxxxxxxxx"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Create integration at: https://www.notion.so/my-integrations
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep('select')}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
                >
                  Back
                </button>
                <button
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {testing ? 'Testing...' : 'Test Connection'}
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating || !formData.name}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </>
          )}

          <button
            onClick={onClose}
            className="mt-4 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

export function DataSourceManager() {
  const [dataSources, setDataSources] = useState<DataSource[]>([])
  const [supportedSources, setSupportedSources] = useState<SupportedSource[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingSource, setEditingSource] = useState<DataSource | null>(null)
  const [selectedSourceType, setSelectedSourceType] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState<string | null>(null)

  useEffect(() => {
    loadDataSources()
    loadSupportedSources()
  }, [])

  const loadDataSources = async () => {
    try {
      const response = await api.get('/knowledge-base/data-sources')
      setDataSources(response.data)
    } catch (error) {
      console.error('Failed to load data sources:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSupportedSources = async () => {
    try {
      const response = await api.get('/knowledge-base/sync/supported-sources')
      setSupportedSources(response.data)
    } catch (error) {
      console.error('Failed to load supported sources:', error)
    }
  }

  const syncDataSource = async (id: string) => {
    setSyncing(id)
    try {
      const response = await api.post(`/knowledge-base/sync/data-sources/${id}`)
      console.log('Sync result:', response.data)
      
      // Reload to get updated status
      await loadDataSources()
      
      // Show success notification
      alert(`Sync completed!\n\nProcessed: ${response.data.documentsProcessed}\nAdded: ${response.data.documentsAdded}\nUpdated: ${response.data.documentsUpdated}\nDeleted: ${response.data.documentsDeleted}`)
    } catch (error: any) {
      console.error('Sync failed:', error)
      alert('Sync failed: ' + (error.response?.data?.message || error.message))
    } finally {
      setSyncing(null)
    }
  }

  const deleteDataSource = async (id: string) => {
    if (!confirm('Are you sure? This will also delete all synced documents.')) {
      return
    }

    try {
      await api.delete(`/knowledge-base/data-sources/${id}`)
      await loadDataSources()
    } catch (error) {
      console.error('Failed to delete data source:', error)
      alert('Failed to delete data source')
    }
  }

  const getSourceIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'github':
        return <Github className="w-5 h-5" />
      case 'confluence':
        return <Globe className="w-5 h-5" />
      case 'notion':
        return <FileText className="w-5 h-5" />
      case 'google-drive':
        return <Cloud className="w-5 h-5" />
      default:
        return <Database className="w-5 h-5" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'syncing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'paused':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const formatDate = (date?: string) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <FolderSync className="w-8 h-8 text-blue-500" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Data Sources
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Sync content from external platforms
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Data Source</span>
        </button>
      </div>

      {/* Data Sources List */}
      {dataSources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Database className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No data sources yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect external platforms to automatically sync content
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Data Source</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {dataSources.map((source) => (
            <motion.div
              key={source.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 space-y-4"
            >
              {/* Source Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    {getSourceIcon(source.sourceType)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {source.name}
                    </h3>
                    <p className="text-xs text-gray-500 capitalize">
                      {source.sourceType.replace('-', ' ')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(source.status)}
                </div>
              </div>

              {/* Description */}
              {source.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {source.description}
                </p>
              )}

              {/* Status Info */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Status:</span>
                  <span className={`font-medium capitalize ${
                    source.status === 'active' ? 'text-green-600' :
                    source.status === 'error' ? 'text-red-600' :
                    source.status === 'syncing' ? 'text-blue-600' :
                    'text-gray-600'
                  }`}>
                    {source.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Frequency:</span>
                  <span className="font-medium text-gray-900 dark:text-white capitalize">
                    {source.syncFrequency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Last Synced:</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">
                    {formatDate(source.lastSyncedAt)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {source.errorMessage && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                  {source.errorMessage}
                </div>
              )}

              {/* Actions */}
              <div className="flex space-x-2 pt-4 border-t dark:border-gray-700">
                <button
                  onClick={() => syncDataSource(source.id)}
                  disabled={syncing === source.id}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing === source.id ? 'animate-spin' : ''}`} />
                  <span className="text-sm font-medium">Sync</span>
                </button>
                <button
                  onClick={() => {
                    setEditingSource(source)
                    setShowEditModal(true)
                  }}
                  className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  title="Edit settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteDataSource(source.id)}
                  className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateDataSourceModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false)
            setSelectedSourceType(null)
          }}
          onSuccess={() => {
            loadDataSources()
            setShowCreateModal(false)
            setSelectedSourceType(null)
          }}
        />
      )}

      {/* Edit Modal */}
      {showEditModal && editingSource && (
        <EditDataSourceModal
          isOpen={showEditModal}
          dataSource={editingSource}
          onClose={() => {
            setShowEditModal(false)
            setEditingSource(null)
          }}
          onSuccess={() => {
            loadDataSources()
            setShowEditModal(false)
            setEditingSource(null)
          }}
        />
      )}
    </div>
  )
}
