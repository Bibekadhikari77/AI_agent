import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { MessageSquare, Zap, Files, Brain, TrendingUp, Clock, Bot } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../utils/api'
import './DashboardPage.css'

// Sample chart data fallback
const SAMPLE_ACTIVITY = [
  { day: 'Mon', messages: 12, files: 2, automations: 5 },
  { day: 'Tue', messages: 18, files: 3, automations: 8 },
  { day: 'Wed', messages: 9, files: 1, automations: 4 },
  { day: 'Thu', messages: 24, files: 5, automations: 12 },
  { day: 'Fri', messages: 15, files: 2, automations: 6 },
  { day: 'Sat', messages: 8, files: 0, automations: 3 },
  { day: 'Sun', messages: 20, files: 4, automations: 9 },
]

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/agent/stats')
      .then(({ data }) => setStats(data.stats))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const statCards = [
    { label: 'Conversations', value: stats?.conversations ?? '—', icon: MessageSquare, color: '#6C63FF', change: '+12%' },
    { label: 'Automations Run', value: stats?.automations ?? '—', icon: Zap, color: '#FFB830', change: '+8%' },
    { label: 'Files Generated', value: stats?.filesGenerated ?? '—', icon: Files, color: '#00D4FF', change: '+24%' },
    { label: 'Memory Items', value: '—', icon: Brain, color: '#00E5A0', change: 'active' },
  ]

  return (
    <div className="dashboard-page">
      {/* Stat Cards */}
      <div className="stat-grid">
        {statCards.map(({ label, value, icon: Icon, color, change }, i) => (
          <motion.div
            key={label}
            className="stat-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            style={{ '--card-accent': color }}
          >
            <div className="stat-icon" style={{ background: `${color}15`, color }}>
              <Icon size={22} />
            </div>
            <div className="stat-info">
              <span className="stat-value">{loading ? <div className="skeleton" /> : value}</span>
              <span className="stat-label">{label}</span>
            </div>
            <div className="stat-change">{change}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart + Recent Activity */}
      <div className="dashboard-grid">
        {/* Activity Chart */}
        <motion.div
          className="card dashboard-chart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <TrendingUp size={16} />
            <h3>Weekly Activity</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={SAMPLE_ACTIVITY}>
              <defs>
                <linearGradient id="msgGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="autoGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary)'
                }}
              />
              <Area type="monotone" dataKey="messages" stroke="#6C63FF" fill="url(#msgGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="automations" stroke="#00D4FF" fill="url(#autoGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="chart-legend">
            <span className="legend-dot" style={{ background: '#6C63FF' }} /> Messages
            <span className="legend-dot" style={{ background: '#00D4FF', marginLeft: 12 }} /> Automations
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          className="card dashboard-activity"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="card-header">
            <Clock size={16} />
            <h3>Recent Automations</h3>
          </div>
          {stats?.recentActivity?.length > 0 ? (
            <div className="activity-list">
              {stats.recentActivity.map((log, i) => (
                <div key={i} className="activity-item">
                  <div className={`activity-dot ${log.result?.success ? 'success' : 'error'}`} />
                  <div className="activity-content">
                    <span className="activity-cmd truncate">{log.command}</span>
                    <span className="activity-type badge badge-info">{log.type}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="activity-empty">
              <Bot size={32} />
              <p>No automations yet</p>
              <span>Chat with ARIA to get started!</span>
            </div>
          )}
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <div className="card-header">
          <Zap size={16} />
          <h3>Quick Actions</h3>
        </div>
        <div className="quick-actions-grid">
          {[
            { label: 'Open YouTube', cmd: 'Open YouTube', color: '#FF0000' },
            { label: 'Open Gmail', cmd: 'Open Gmail', color: '#EA4335' },
            { label: 'Generate Excel Report', cmd: 'Generate a monthly sales Excel report', color: '#217346' },
            { label: 'Create PDF Doc', cmd: 'Create a PDF project summary document', color: '#FF5722' },
            { label: 'Open WhatsApp', cmd: 'Open WhatsApp', color: '#25D366' },
            { label: 'Open Facebook', cmd: 'Open Facebook', color: '#1877F2' },
          ].map(({ label, cmd, color }) => (
            <a
              key={label}
              href={`/chat`}
              className="quick-action-btn"
              style={{ '--qa-color': color }}
              onClick={() => {
                // Store command for chat page
                sessionStorage.setItem('quickCmd', cmd)
              }}
            >
              <span style={{ color }} className="qa-dot" />
              {label}
            </a>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
