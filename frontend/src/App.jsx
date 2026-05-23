import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'
import useSocketStore from './store/socketStore'
import Layout from './components/ui/Layout'
import ChatPage from './pages/ChatPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import FilesPage from './pages/FilesPage'
import MemoryPage from './pages/MemoryPage'
import AutomationPage from './pages/AutomationPage'
import SettingsPage from './pages/SettingsPage'
import DashboardPage from './pages/DashboardPage'

// Protected route wrapper
const Protected = ({ children }) => {
  const token = useAuthStore(s => s.token)
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  const { token, initAuth } = useAuthStore()
  const { connect, disconnect } = useSocketStore()

  useEffect(() => {
    initAuth()
  }, [])

  useEffect(() => {
    if (token) {
      connect()
    } else {
      disconnect()
    }
    return () => disconnect()
  }, [token])

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={token ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route path="/" element={<Protected><Layout /></Protected>}>
        <Route index element={<Navigate to="/chat" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="chat/:conversationId" element={<ChatPage />} />
        <Route path="files" element={<FilesPage />} />
        <Route path="memory" element={<MemoryPage />} />
        <Route path="automation" element={<AutomationPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}
