import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  organizationId: string
  role: string
}

interface AuthState {
  user: User | null
  token: string | null
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setUser: (user) => {
        console.log('Setting user:', user)
        set({ user })
      },
      setToken: (token) => {
        console.log('Setting token:', token ? 'Token exists' : 'No token')
        if (token) {
          localStorage.setItem('token', token)
        } else {
          localStorage.removeItem('token')
        }
        set({ token })
      },
      logout: () => {
        localStorage.removeItem('token')
        set({ user: null, token: null })
      },
    }),
    {
      name: 'auth-storage',
      // Force immediate persistence
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
)

interface UIState {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
}))
