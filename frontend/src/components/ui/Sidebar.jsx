import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare, LayoutDashboard, Files, Brain,
  Zap, Settings, LogOut, ChevronLeft, ChevronRight,
  Bot, Plus
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import useChatStore from '../../store/chatStore'
import useSocketStore from '../../store/socketStore'
import ConversationList from '../chat/ConversationList'
import './Sidebar.css'

const NAV_ITEMS = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/chat', icon: MessageSquare, label: 'Chat' },
  { path: '/files', icon: Files, label: 'Files' },
  { path: '/memory', icon: Brain, label: 'Memory' },
  { path: '/automation', icon: Zap, label: 'Automation' },
  { path: '/settings', icon: Settings, label: 'Settings' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const { user, logout } = useAuthStore()
  const { newConversation } = useChatStore()
  const { connected } = useSocketStore()
  const navigate = useNavigate()

  const handleNewChat = () => {
    newConversation()
    navigate('/chat')
  }

  return (
    <motion.aside
      className={`sidebar ${collapsed ? 'collapsed' : ''}`}
      animate={{ width: collapsed ? 64 : 280 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      {/* Header */}
      <div className="sidebar-header">
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              className="sidebar-logo"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <div className="logo-icon">
                <Bot size={20} />
              </div>
              <div className="logo-text">
                <span className="logo-name gradient-text">ARIA</span>
                <span className="logo-sub">AI Desktop Agent</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {collapsed && (
          <div className="logo-icon-only">
            <Bot size={20} />
          </div>
        )}

        <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* New Chat Button */}
      <div className="sidebar-new-chat">
        <button className="new-chat-btn btn btn-primary" onClick={handleNewChat}>
          <Plus size={16} />
          {!collapsed && <span>New Chat</span>}
        </button>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="nav-label"
                >
                  {label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        ))}
      </nav>

      {/* Conversation list (only when expanded and on chat page) */}
      {!collapsed && (
        <div className="sidebar-conversations">
          <ConversationList />
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        {/* Connection status */}
        <div className={`connection-status ${connected ? 'connected' : 'disconnected'}`}>
          <span className="status-dot" />
          {!collapsed && <span>{connected ? 'Connected' : 'Offline'}</span>}
        </div>

        {/* User */}
        <div className="user-info">
          <div className="user-avatar">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          {!collapsed && (
            <div className="user-details">
              <span className="user-name truncate">{user?.name}</span>
              <span className="user-email truncate text-sm">{user?.email}</span>
            </div>
          )}
          <button className="logout-btn" onClick={logout} title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </motion.aside>
  )
}
