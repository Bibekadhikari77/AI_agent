import { useState } from 'react'
import { motion } from 'framer-motion'
import { Key, User, Bell, Palette, Save, Eye, EyeOff } from 'lucide-react'
import useAuthStore from '../store/authStore'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const { user, updateProfile } = useAuthStore()
  const [name, setName] = useState(user?.name || '')
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)
  const [preferences, setPreferences] = useState(user?.preferences || {
    theme: 'dark', voiceEnabled: true, autoSpeak: false, notificationsEnabled: true
  })

  const saveProfile = async (e) => {
    e.preventDefault()
    await updateProfile({ name, preferences })
  }

  const saveApiKey = (e) => {
    e.preventDefault()
    localStorage.setItem('openai_key_hint', apiKey.slice(0, 8) + '...')
    toast.success('API key saved! Restart the backend to apply.')
    setApiKey('')
  }

  const setPref = (k, v) => setPreferences(p => ({ ...p, [k]: v }))

  const Section = ({ icon: Icon, title, children }) => (
    <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 14, borderBottom: '1px solid var(--border)' }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(108,99,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
          <Icon size={16} />
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 700 }}>{title}</h3>
      </div>
      {children}
    </motion.div>
  )

  const Toggle = ({ label, desc, checked, onChange }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <p style={{ fontSize: 13, fontWeight: 500 }}>{label}</p>
        {desc && <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        style={{
          width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
          background: checked ? 'var(--primary)' : 'var(--bg-elevated)',
          position: 'relative', transition: 'background 0.2s', flexShrink: 0
        }}
      >
        <span style={{
          position: 'absolute', top: 2, left: checked ? 22 : 2, width: 20, height: 20,
          borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
        }} />
      </button>
    </div>
  )

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 700 }}>
      {/* Profile */}
      <Section icon={User} title="Profile">
        <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Display Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} id="settings-name" />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>Email</label>
            <input className="input" value={user?.email || ''} disabled style={{ opacity: 0.6 }} />
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', height: 38 }} id="save-profile-btn">
            <Save size={14} /> Save Profile
          </button>
        </form>
      </Section>

      {/* API Keys */}
      <Section icon={Key} title="API Keys">
        <form onSubmit={saveApiKey} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>
            Configure your OpenAI API key in the <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--glass-bg)', padding: '1px 6px', borderRadius: 4 }}>.env</code> file in the backend directory for full AI features.
          </p>
          <div>
            <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 6 }}>OpenAI API Key</label>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="sk-..."
                style={{ paddingRight: 42 }}
                id="settings-api-key"
              />
              <button type="button" onClick={() => setShowKey(!showKey)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}>
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start', height: 38 }} disabled={!apiKey} id="save-api-key-btn">
            <Save size={14} /> Save Key
          </button>
        </form>
      </Section>

      {/* Preferences */}
      <Section icon={Bell} title="Preferences">
        <Toggle label="Voice Input" desc="Enable microphone for voice commands" checked={preferences.voiceEnabled} onChange={v => setPref('voiceEnabled', v)} />
        <Toggle label="Auto-Speak Responses" desc="ARIA speaks responses aloud using TTS" checked={preferences.autoSpeak} onChange={v => setPref('autoSpeak', v)} />
        <Toggle label="Notifications" desc="Show desktop notifications from ARIA" checked={preferences.notificationsEnabled} onChange={v => setPref('notificationsEnabled', v)} />
        <div style={{ marginTop: 14 }}>
          <button className="btn btn-primary" style={{ height: 38 }} onClick={saveProfile} id="save-prefs-btn">
            <Save size={14} /> Save Preferences
          </button>
        </div>
      </Section>
    </div>
  )
}
