import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'
import toast from 'react-hot-toast'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,

      initAuth: async () => {
        const token = get().token
        if (!token) return
        try {
          const { data } = await api.get('/auth/me')
          set({ user: data.user })
        } catch {
          set({ user: null, token: null })
        }
      },

      login: async (email, password) => {
        set({ loading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          set({ token: data.token, user: data.user, loading: false })
          toast.success(`Welcome back, ${data.user.name}! 👋`)
          return { success: true }
        } catch (err) {
          set({ loading: false })
          const msg = err.response?.data?.error || 'Login failed'
          toast.error(msg)
          return { success: false, error: msg }
        }
      },

      register: async (name, email, password) => {
        set({ loading: true })
        try {
          const { data } = await api.post('/auth/register', { name, email, password })
          set({ token: data.token, user: data.user, loading: false })
          toast.success(`Welcome to ARIA, ${data.user.name}! 🚀`)
          return { success: true }
        } catch (err) {
          set({ loading: false })
          const msg = err.response?.data?.error || 'Registration failed'
          toast.error(msg)
          return { success: false, error: msg }
        }
      },

      logout: () => {
        set({ user: null, token: null })
        toast.success('Logged out successfully')
      },

      updateProfile: async (updates) => {
        try {
          const { data } = await api.put('/auth/profile', updates)
          set({ user: data.user })
          toast.success('Profile updated')
          return { success: true }
        } catch (err) {
          toast.error(err.response?.data?.error || 'Update failed')
          return { success: false }
        }
      }
    }),
    {
      name: 'aria-auth',
      partialize: (state) => ({ token: state.token, user: state.user })
    }
  )
)

export default useAuthStore
