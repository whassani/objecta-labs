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
  // Get token from Zustand store instead of direct localStorage
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
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
}
