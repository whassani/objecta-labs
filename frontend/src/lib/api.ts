import axios from 'axios'
import { useAuthStore } from './store'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  // For admin endpoints, use admin_token; otherwise use regular token
  let token;
  
  if (typeof window !== 'undefined' && config.url?.includes('/admin/')) {
    // Admin endpoint - use admin_token first, fallback to store token
    token = localStorage.getItem('admin_token') || useAuthStore.getState().token;
  } else {
    // Regular endpoint - use token from Zustand store
    token = useAuthStore.getState().token;
  }
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Check if it's an admin request
      const isAdminRequest = error.config?.url?.includes('/admin/');
      const hasAdminToken = typeof window !== 'undefined' && localStorage.getItem('admin_token');
      
      if (isAdminRequest || hasAdminToken) {
        // Admin auth error - clear admin tokens and redirect to admin login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('admin_token');
          localStorage.removeItem('admin_user');
        }
        window.location.href = '/admin/login';
      } else {
        // Regular user auth error - clear auth and redirect to user login
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
)

// Auth API
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  getProfile: () => api.get('/auth/me'),
}

// Organizations API
export const organizationsApi = {
  getCurrent: () => api.get('/organizations/current'),
  update: (data: any) => api.put('/organizations/current', data),
}

// Workspaces API
export const workspacesApi = {
  getAll: () => api.get('/workspaces'),
  getOne: (id: string) => api.get(`/workspaces/${id}`),
  create: (data: any) => api.post('/workspaces', data),
  update: (id: string, data: any) => api.put(`/workspaces/${id}`, data),
  delete: (id: string) => api.delete(`/workspaces/${id}`),
}

// Agents API
export const agentsApi = {
  getAll: (workspaceId?: string) => api.get('/agents', { params: { workspaceId } }),
  getOne: (id: string) => api.get(`/agents/${id}`),
  create: (data: any) => api.post('/agents', data),
  update: (id: string, data: any) => api.put(`/agents/${id}`, data),
  delete: (id: string) => api.delete(`/agents/${id}`),
}

// Knowledge Base API
export const knowledgeBaseApi = {
  getDataSources: () => api.get('/knowledge-base/data-sources'),
  getDataSource: (id: string) => api.get(`/knowledge-base/data-sources/${id}`),
  createDataSource: (data: any) => api.post('/knowledge-base/data-sources', data),
  updateDataSource: (id: string, data: any) => api.put(`/knowledge-base/data-sources/${id}`, data),
  deleteDataSource: (id: string) => api.delete(`/knowledge-base/data-sources/${id}`),
  syncDataSource: (id: string) => api.post(`/knowledge-base/data-sources/${id}/sync`),
  
  // Sync API (New!)
  getSupportedSources: () => api.get('/knowledge-base/sync/supported-sources'),
  testConnection: (sourceType: string, credentials: any, config: any) => 
    api.post('/knowledge-base/sync/test-connection', { sourceType, credentials, config }),
  triggerSync: (id: string) => api.post(`/knowledge-base/sync/data-sources/${id}`),
  triggerOrganizationSync: () => api.post('/knowledge-base/sync/organization'),
  getAdapterSchema: (sourceType: string) => api.get(`/knowledge-base/sync/adapters/${sourceType}/schema`),
  
  // Documents API
  getDocuments: (dataSourceId?: string) => api.get('/knowledge-base/documents', { params: { dataSourceId } }),
  getDocument: (id: string) => api.get(`/knowledge-base/documents/${id}`),
  uploadDocument: (file: File, title?: string, dataSourceId?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    if (title) formData.append('title', title)
    if (dataSourceId) formData.append('dataSourceId', dataSourceId)
    
    return api.post('/knowledge-base/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  deleteDocument: (id: string) => api.delete(`/knowledge-base/documents/${id}`),
  getDocumentChunks: (id: string) => api.get(`/knowledge-base/documents/${id}/chunks`),
  indexDocument: (id: string) => api.post(`/knowledge-base/documents/${id}/index`),
  
  // Semantic Search API
  searchDocuments: (query: string, limit?: number, threshold?: number) => 
    api.post('/knowledge-base/search', { query }, { params: { limit, threshold } }),
  hybridSearch: (query: string, limit?: number, semanticWeight?: number, threshold?: number) =>
    api.post('/knowledge-base/search/hybrid', { query }, { params: { limit, semanticWeight, threshold } }),
  getVectorStoreInfo: () => api.get('/knowledge-base/vector-store/info'),
  
  // Analytics API
  getDocumentStats: (limit?: number) => api.get('/knowledge-base/analytics/document-stats', { params: { limit } }),
  
  // Search History API
  getPopularQueries: (limit?: number) => api.get('/knowledge-base/search/popular', { params: { limit } }),
  getRecentSearches: (limit?: number) => api.get('/knowledge-base/search/recent', { params: { limit } }),
  getSearchStats: () => api.get('/knowledge-base/search/stats'),
  
  // Bulk Operations API
  reindexAllDocuments: () => api.post('/knowledge-base/documents/reindex-all'),
  
  // Chunk API
  getChunkContent: (documentId: string, chunkId: string) => 
    api.get(`/knowledge-base/documents/${documentId}/chunk/${chunkId}`),
  
  // Document Management API
  updateDocumentTags: (documentId: string, tags: string[]) =>
    api.put(`/knowledge-base/documents/${documentId}/tags`, { tags }),
}

// Tools API
export const toolsApi = {
  getAll: (agentId?: string) => api.get('/tools', { params: { agentId } }),
  getOne: (id: string) => api.get(`/tools/${id}`),
  create: (data: any) => api.post('/tools', data),
  update: (id: string, data: any) => api.put(`/tools/${id}`, data),
  delete: (id: string) => api.delete(`/tools/${id}`),
  execute: (id: string, input: any) => api.post(`/tools/${id}/execute`, { input }),
  test: (id: string, input: any) => api.post(`/tools/${id}/test`, { input }),
  
  // Phase 1: Tool Management Features
  duplicate: (id: string, name?: string) => api.post(`/tools/${id}/duplicate`, { name }),
  bulkEnable: (ids: string[]) => api.post('/tools/bulk/enable', { ids }),
  bulkDisable: (ids: string[]) => api.post('/tools/bulk/disable', { ids }),
  bulkDelete: (ids: string[]) => api.post('/tools/bulk/delete', { ids }),
  export: (ids?: string[]) => api.post('/tools/export', { ids }),
  import: (tools: any[]) => api.post('/tools/import', { tools }),
  getTemplates: () => api.get('/tools/templates/list'),
  
  // Phase 2: Testing & Debugging Features
  getTestHistory: (toolId: string, limit?: number) => api.get(`/tools/${toolId}/test-history`, { params: { limit } }),
  getRecentTests: (limit?: number) => api.get('/tools/test-history/recent', { params: { limit } }),
  getTestExecution: (executionId: string) => api.get(`/tools/test-history/${executionId}`),
  getTestStats: (toolId: string) => api.get(`/tools/${toolId}/test-stats`),
  
  // Phase 3: Advanced Configuration
  // Environments
  getEnvironments: (toolId: string) => api.get(`/tools/${toolId}/environments`),
  createEnvironment: (toolId: string, data: any) => api.post(`/tools/${toolId}/environments`, data),
  updateEnvironment: (toolId: string, envId: string, data: any) => api.put(`/tools/${toolId}/environments/${envId}`, data),
  activateEnvironment: (toolId: string, envId: string) => api.post(`/tools/${toolId}/environments/${envId}/activate`),
  deleteEnvironment: (toolId: string, envId: string) => api.delete(`/tools/${toolId}/environments/${envId}`),
  
  // Versioning
  getVersions: (toolId: string, limit?: number) => api.get(`/tools/${toolId}/versions`, { params: { limit } }),
  getVersionHistory: (toolId: string) => api.get(`/tools/${toolId}/versions/history`),
  getVersion: (toolId: string, version: number) => api.get(`/tools/${toolId}/versions/${version}`),
  restoreVersion: (toolId: string, version: number) => api.post(`/tools/${toolId}/versions/${version}/restore`),
  compareVersions: (toolId: string, v1: number, v2: number) => api.get(`/tools/${toolId}/versions/${v1}/compare/${v2}`),
  
  // Phase 4: Analytics & Monitoring
  getOrganizationStats: (startDate?: string, endDate?: string) => api.get('/tools/analytics/organization-stats', { params: { startDate, endDate } }),
  getToolsMetrics: (limit?: number) => api.get('/tools/analytics/tools-metrics', { params: { limit } }),
  getTimeSeriesData: (toolId?: string, days?: number) => api.get('/tools/analytics/time-series', { params: { toolId, days } }),
  getErrorBreakdown: (toolId?: string, days?: number) => api.get('/tools/analytics/error-breakdown', { params: { toolId, days } }),
  getPerformancePercentiles: (toolId: string) => api.get(`/tools/${toolId}/analytics/performance`),
  getRateLimitStats: (toolId: string) => api.get(`/tools/${toolId}/analytics/rate-limit`),
}

// Conversations API
export const conversationsApi = {
  getAll: (agentId?: string) => api.get('/conversations', { params: { agentId } }),
  getOne: (id: string) => api.get(`/conversations/${id}`),
  create: (data: any) => api.post('/conversations', data),
  sendMessage: (id: string, content: string) => api.post(`/conversations/${id}/messages`, { content }),
  delete: (id: string) => api.delete(`/conversations/${id}`),
  
  // Streaming endpoint
  streamMessage: async (
    id: string, 
    content: string, 
    onToken: (data: any) => void, 
    onComplete: () => void, 
    onError: (error: any) => void
  ) => {
    const token = useAuthStore.getState().token
    
    // Use POST with SSE (note: API has /api prefix)
    const response = await fetch(`${API_URL}/api/conversations/${id}/messages/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    })

    if (!response.ok) {
      throw new Error('Failed to start streaming')
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('No reader available')
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        
        if (done) {
          onComplete()
          break
        }

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onToken(data)
              
              if (data.type === 'done' || data.type === 'error') {
                onComplete()
                return
              }
            } catch (error) {
              console.error('Error parsing SSE data:', error)
            }
          }
        }
      }
    } catch (error) {
      console.error('Streaming error:', error)
      onError(error)
    }
  },
}

// Workflows API
export const workflowsApi = {
  getAll: (params?: any) => api.get('/workflows', { params }),
  getOne: (id: string) => api.get(`/workflows/${id}`),
  create: (data: any) => api.post('/workflows', data),
  update: (id: string, data: any) => api.put(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
  duplicate: (id: string, data?: any) => api.post(`/workflows/${id}/duplicate`, data),
  activate: (id: string) => api.put(`/workflows/${id}/activate`),
  deactivate: (id: string) => api.put(`/workflows/${id}/deactivate`),
  execute: (id: string, data?: any) => api.post(`/workflows/${id}/execute`, data),
  
  // Executions
  getExecutions: (workflowId: string, params?: any) => api.get(`/workflows/${workflowId}/executions`, { params }),
  getExecution: (executionId: string) => api.get(`/workflows/executions/${executionId}`),
  cancelExecution: (executionId: string) => api.post(`/workflows/executions/${executionId}/cancel`),
  
  // Templates
  getTemplates: (params?: any) => api.get('/workflow-templates', { params }),
  getTemplate: (id: string) => api.get(`/workflow-templates/${id}`),
  deployTemplate: (id: string, data?: any) => api.post(`/workflow-templates/${id}/deploy`, data),
}
