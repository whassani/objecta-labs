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
      console.error('🚨 API 401 ERROR!', {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
        response: error.response?.data
      })
      // Clear auth store on 401
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
}

// Tools API
export const toolsApi = {
  getAll: () => api.get('/tools'),
  getOne: (id: string) => api.get(`/tools/${id}`),
  create: (data: any) => api.post('/tools', data),
  update: (id: string, data: any) => api.put(`/tools/${id}`, data),
  delete: (id: string) => api.delete(`/tools/${id}`),
}

// Conversations API
export const conversationsApi = {
  getAll: (agentId?: string) => api.get('/conversations', { params: { agentId } }),
  getOne: (id: string) => api.get(`/conversations/${id}`),
  create: (data: any) => api.post('/conversations', data),
  sendMessage: (id: string, content: string) => api.post(`/conversations/${id}/messages`, { content }),
  delete: (id: string) => api.delete(`/conversations/${id}`),
}
