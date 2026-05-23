import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Brain, Plus, Trash2, Search, Edit3, Save, X } from 'lucide-react'
import api from '../utils/api'
import toast from 'react-hot-toast'

const TYPE_COLORS = {
  fact: '#6C63FF', preference: '#00D4FF', task: '#FFB830',
  context: '#00E5A0', automation: '#FF6B6B', shortcut: '#FF9F43'
}

export default function MemoryPage() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ key: '', value: '', type: 'fact', tags: '' })

  const fetch = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/memory', { params: search ? { search } : {} })
      setMemories(data.memories)
    } catch { toast.error('Failed to load memories') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  const handleAdd = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean)
      }
      const { data } = await api.post('/memory', payload)
      setMemories(m => [data.memory, ...m])
      setForm({ key: '', value: '', type: 'fact', tags: '' })
      setShowAdd(false)
      toast.success('Memory saved!')
    } catch { toast.error('Failed to save memory') }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/memory/${id}`)
      setMemories(m => m.filter(x => x._id !== id))
      toast.success('Memory deleted')
    } catch { toast.error('Failed to delete') }
  }

  const filtered = memories.filter(m =>
    m.key.toLowerCase().includes(search.toLowerCase()) ||
    JSON.stringify(m.value).toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search memories..."
            value={search} onChange={e => setSearch(e.target.value)} id="memory-search" />
        </div>
        <button className="btn btn-primary" style={{ height: 38, fontSize: 13 }}
          onClick={() => setShowAdd(!showAdd)} id="add-memory-btn">
          <Plus size={15} /> Add Memory
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <motion.div className="card" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <form onSubmit={handleAdd} id="add-memory-form"
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Key</label>
              <input className="input" placeholder="e.g. preferred_language" value={form.key}
                onChange={e => setForm(f => ({ ...f, key: e.target.value }))} required id="memory-key" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Type</label>
              <select className="input" value={form.type}
                onChange={e => setForm(f => ({ ...f, type: e.target.value }))} id="memory-type"
                style={{ background: 'var(--glass-bg)' }}>
                {['fact', 'preference', 'task', 'context', 'automation', 'shortcut'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Value</label>
              <input className="input" placeholder="What to remember..." value={form.value}
                onChange={e => setForm(f => ({ ...f, value: e.target.value }))} required id="memory-value" />
            </div>
            <div>
              <label style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Tags (comma-separated)</label>
              <input className="input" placeholder="work, important, personal" value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} id="memory-tags" />
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1, height: 40 }}>
                <Save size={14} /> Save
              </button>
              <button type="button" className="btn btn-ghost" style={{ height: 40, width: 40, padding: 0 }}
                onClick={() => setShowAdd(false)}>
                <X size={14} />
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Memory Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <Brain size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>No memories stored</p>
          <p style={{ fontSize: 13 }}>ARIA will remember things as you chat, or add them manually</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {filtered.map((mem, i) => {
            const color = TYPE_COLORS[mem.type] || '#6C63FF'
            return (
              <motion.div
                key={mem._id}
                className="card"
                style={{ padding: 14, borderLeft: `3px solid ${color}` }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <span className="badge" style={{ background: `${color}20`, color, border: `1px solid ${color}40`, marginBottom: 4 }}>
                      {mem.type}
                    </span>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{mem.key}</p>
                  </div>
                  <button className="btn btn-danger" style={{ width: 28, height: 28, padding: 0, flexShrink: 0 }}
                    onClick={() => handleDelete(mem._id)}>
                    <Trash2 size={11} />
                  </button>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-word' }}>
                  {typeof mem.value === 'object' ? JSON.stringify(mem.value) : String(mem.value)}
                </p>
                {mem.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
                    {mem.tags.map(tag => (
                      <span key={tag} style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--glass-bg)',
                        border: '1px solid var(--glass-border)', padding: '1px 6px', borderRadius: 99 }}>#{tag}</span>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                  Accessed {mem.accessCount} times
                </p>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
