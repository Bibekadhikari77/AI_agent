import { useLocation } from 'react-router-dom'
import { Wifi, WifiOff, Bell } from 'lucide-react'
import useSocketStore from '../../store/socketStore'
import './Header.css'

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', sub: 'Overview & stats' },
  '/chat': { title: 'AI Chat', sub: 'Talk to ARIA' },
  '/files': { title: 'Files', sub: 'Generated documents' },
  '/memory': { title: 'Memory', sub: 'Agent knowledge base' },
  '/automation': { title: 'Automation', sub: 'App control & logs' },
  '/settings': { title: 'Settings', sub: 'Preferences & API keys' },
}

export default function Header() {
  const { pathname } = useLocation()
  const { connected, agentThinking, notifications } = useSocketStore()
  const pageKey = Object.keys(PAGE_TITLES).find(k => pathname.startsWith(k)) || '/chat'
  const { title, sub } = PAGE_TITLES[pageKey] || PAGE_TITLES['/chat']
  const unread = notifications.length

  return (
    <header className="header">
      <div className="header-left">
        <h1 className="header-title">{title}</h1>
        <span className="header-sub">{sub}</span>
        {agentThinking && (
          <div className="thinking-indicator">
            <div className="thinking-dots">
              <span /><span /><span />
            </div>
            <span>ARIA is thinking...</span>
          </div>
        )}
      </div>

      <div className="header-right">
        <div className={`connection-badge ${connected ? 'online' : 'offline'}`}>
          {connected ? <Wifi size={13} /> : <WifiOff size={13} />}
          <span>{connected ? 'Live' : 'Offline'}</span>
        </div>

        <button className="header-btn" id="notifications-btn">
          <Bell size={17} />
          {unread > 0 && (
            <span className="notif-badge">{unread > 9 ? '9+' : unread}</span>
          )}
        </button>
      </div>
    </header>
  )
}
