import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Zap, Globe, Bell, ExternalLink, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '../utils/api'
import toast from 'react-hot-toast'

const TYPE_COLORS = {
  browser_open: '#6C63FF', file_generate: '#217346',
  notification: '#FFB830', search: '#00D4FF',
  system_command: '#FF6B6B', schedule: '#00E5A0'
}

export default function AutomationPage() {
  const [logs, setLogs] = useState([])
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/automation/logs', { params: { limit: 50 } }),
      api.get('/automation/apps')
    ]).then(([logsRes, appsRes]) => {
      setLogs(logsRes.data.logs)
      setApps(appsRes.data.apps.slice(0, 20))
    }).catch(() => toast.error('Failed to load automation data'))
      .finally(() => setLoading(false))
  }, [])

  const handleOpenApp = async (app) => {
    try {
      const { data } = await api.post('/automation/open-url', { url: app.url, app: app.name })
      window.open(data.url, '_blank', 'noopener,noreferrer')
      toast.success(`Opening ${app.name}!`)
      const { data: logsData } = await api.get('/automation/logs', { params: { limit: 50 } })
      setLogs(logsData.logs)
    } catch { toast.error('Failed to open app') }
  }

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Globe size={16} /> Quick App Launch
        </h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {apps.map(app => (
            <motion.button key={app.key} className="btn btn-ghost"
              style={{ fontSize: 12, height: 34 }} onClick={() => handleOpenApp(app)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              id={`open-${app.key}-btn`}>
              <ExternalLink size={12} />{app.name}
            </motion.button>
          ))}
        </div>
      </div>

      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} /> Automation History
        </h3>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
            <div className="spinner" />
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
            <Zap size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
            <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>No automations yet</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {logs.map((log, i) => {
              const color = TYPE_COLORS[log.type] || '#6C63FF'
              return (
                <motion.div key={log._id} className="card"
                  style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}>
                  {log.result?.success
                    ? <CheckCircle size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    : <XCircle size={16} style={{ color: 'var(--error)', flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{log.command}</p>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                      {log.parameters?.url || log.type}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className="badge" style={{ background: `${color}20`, color, border: `1px solid ${color}40` }}>
                      {log.type?.replace('_', ' ')}
                    </span>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                      {formatDistanceToNow(new Date(log.executedAt), { addSuffix: true })}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
