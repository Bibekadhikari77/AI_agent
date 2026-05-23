import { create } from 'zustand'
import { io } from 'socket.io-client'
import useAuthStore from './authStore'
import toast from 'react-hot-toast'

const useSocketStore = create((set, get) => ({
  socket: null,
  connected: false,
  agentThinking: false,
  voiceStatus: 'idle', // idle | listening | processing
  fileGenerating: null,
  notifications: [],

  connect: () => {
    const { socket } = get()
    if (socket?.connected) return

    const newSocket = io('/', {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    })

    newSocket.on('connect', () => {
      set({ connected: true })
      const user = useAuthStore.getState().user
      if (user) {
        newSocket.emit('authenticate', { userId: user._id })
      }
    })

    newSocket.on('disconnect', () => set({ connected: false }))

    newSocket.on('agent:thinking', ({ status }) => {
      set({ agentThinking: status })
    })

    newSocket.on('voice:listening', () => set({ voiceStatus: 'listening' }))
    newSocket.on('voice:processing', () => set({ voiceStatus: 'processing' }))

    newSocket.on('file:generating', (data) => {
      set({ fileGenerating: data })
      if (data.status === 'done') {
        setTimeout(() => set({ fileGenerating: null }), 2000)
        toast.success(`${data.type?.toUpperCase()} file ready: ${data.filename}`)
      }
    })

    newSocket.on('notification', (data) => {
      const { type = 'info', title, body } = data
      const toastFn = type === 'success' ? toast.success
        : type === 'error' ? toast.error
        : type === 'warning' ? toast
        : toast
      toastFn(`${title}: ${body}`)
      set(s => ({ notifications: [data, ...s.notifications].slice(0, 50) }))
    })

    set({ socket: newSocket })
  },

  disconnect: () => {
    const { socket } = get()
    if (socket) {
      socket.disconnect()
      set({ socket: null, connected: false })
    }
  },

  resetVoiceStatus: () => set({ voiceStatus: 'idle' })
}))

export default useSocketStore
