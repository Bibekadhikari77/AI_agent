import { create } from 'zustand'
import api from '../utils/api'
import toast from 'react-hot-toast'

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  loading: false,
  sending: false,

  fetchConversations: async () => {
    try {
      const { data } = await api.get('/agent/conversations')
      set({ conversations: data.conversations })
    } catch (err) {
      console.error('Failed to fetch conversations:', err)
    }
  },

  loadConversation: async (id) => {
    set({ loading: true })
    try {
      const { data } = await api.get(`/agent/conversations/${id}`)
      set({
        activeConversation: data.conversation,
        messages: data.conversation.messages,
        loading: false
      })
    } catch (err) {
      toast.error('Failed to load conversation')
      set({ loading: false })
    }
  },

  newConversation: () => {
    set({ activeConversation: null, messages: [] })
  },

  sendMessage: async (content, source = 'text') => {
    const { activeConversation, messages } = get()
    set({ sending: true })

    // Optimistic user message
    const tempUserMsg = { role: 'user', content, type: source, _id: `temp_${Date.now()}`, timestamp: new Date() }
    set({ messages: [...messages, tempUserMsg] })

    try {
      const { data } = await api.post('/agent/chat', {
        message: content,
        conversationId: activeConversation?._id,
        source
      })

      const assistantMsg = {
        role: 'assistant',
        content: data.response,
        type: data.action ? 'command' : 'text',
        _id: `resp_${Date.now()}`,
        timestamp: new Date(),
        action: data.action,
        file: data.file
      }

      set(s => ({
        messages: [...s.messages, assistantMsg],
        activeConversation: { _id: data.conversationId, title: content.slice(0, 60) },
        sending: false
      }))

      // If action has a URL, handle it
      if (data.action?.action === 'open_url') {
        window.open(data.action.parameters.url, '_blank', 'noopener,noreferrer')
      }

      // Refresh conversation list
      get().fetchConversations()

      return { success: true, data }
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: `⚠️ Error: ${err.response?.data?.error || 'Failed to process request'}`,
        type: 'error',
        _id: `err_${Date.now()}`,
        timestamp: new Date()
      }
      set(s => ({ messages: [...s.messages, errorMsg], sending: false }))
      return { success: false }
    }
  },

  sendVoiceMessage: async (audioBlob) => {
    const { activeConversation } = get()
    set({ sending: true })

    const formData = new FormData()
    formData.append('audio', audioBlob, 'recording.webm')
    if (activeConversation?._id) formData.append('conversationId', activeConversation._id)

    try {
      const { data } = await api.post('/agent/voice', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const userMsg = {
        role: 'user',
        content: data.transcript || '🎤 Voice message',
        type: 'voice',
        _id: `voice_${Date.now()}`,
        timestamp: new Date()
      }

      const assistantMsg = {
        role: 'assistant',
        content: data.response,
        type: data.action ? 'command' : 'text',
        _id: `resp_${Date.now()}`,
        timestamp: new Date(),
        action: data.action,
        file: data.file
      }

      set(s => ({
        messages: [...s.messages, userMsg, assistantMsg],
        sending: false
      }))

      if (data.action?.action === 'open_url') {
        window.open(data.action.parameters.url, '_blank', 'noopener,noreferrer')
      }

      get().fetchConversations()
      return { success: true, data }
    } catch (err) {
      set({ sending: false })
      toast.error('Voice processing failed')
      return { success: false }
    }
  },

  deleteConversation: async (id) => {
    try {
      await api.delete(`/agent/conversations/${id}`)
      set(s => ({
        conversations: s.conversations.filter(c => c._id !== id),
        activeConversation: s.activeConversation?._id === id ? null : s.activeConversation,
        messages: s.activeConversation?._id === id ? [] : s.messages
      }))
      toast.success('Conversation deleted')
    } catch (err) {
      toast.error('Failed to delete conversation')
    }
  }
}))

export default useChatStore
