import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download, Trash2, FileSpreadsheet, FileText, File, Search, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import api from '../utils/api'
import { downloadGeneratedFile } from '../utils/downloadFile'
import toast from 'react-hot-toast'

const FILE_ICONS = {
  xlsx: { icon: FileSpreadsheet, color: '#217346' },
  pdf: { icon: FileText, color: '#FF5722' },
  docx: { icon: FileText, color: '#2B579A' },
  default: { icon: File, color: '#6C63FF' }
}

const formatBytes = (b) => {
  if (!b) return '—'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(1)} MB`
}

export default function FilesPage() {
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const fetchFiles = async () => {
    setLoading(true)
    try {
      const params = {}
      if (filter !== 'all') params.type = filter
      const { data } = await api.get('/files', { params })
      setFiles(data.files)
    } catch (err) {
      toast.error('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchFiles() }, [filter])

  const handleDelete = async (id) => {
    if (!confirm('Delete this file?')) return
    try {
      await api.delete(`/files/${id}`)
      setFiles(f => f.filter(x => x._id !== id))
      toast.success('File deleted')
    } catch {
      toast.error('Failed to delete file')
    }
  }

  const filtered = files.filter(f =>
    f.filename.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            className="input"
            style={{ paddingLeft: 36 }}
            placeholder="Search files..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            id="files-search"
          />
        </div>
        {/* Filter */}
        {['all', 'xlsx', 'pdf', 'docx'].map(t => (
          <button
            key={t}
            className={`btn ${filter === t ? 'btn-primary' : 'btn-ghost'}`}
            style={{ height: 36, fontSize: 12 }}
            onClick={() => setFilter(t)}
          >
            {t === 'all' ? 'All' : t.toUpperCase()}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <File size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', marginBottom: 8 }}>No files yet</p>
          <p style={{ fontSize: 13 }}>Ask ARIA to generate Excel, PDF, or Word documents</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
          {filtered.map((file, i) => {
            const ft = FILE_ICONS[file.fileType] || FILE_ICONS.default
            const Icon = ft.icon
            return (
              <motion.div
                key={file._id}
                className="card"
                style={{ padding: 16, cursor: 'default' }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: `${ft.color}18`, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    color: ft.color, flexShrink: 0
                  }}>
                    <Icon size={20} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }} className="truncate">{file.filename}</p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="badge badge-primary">{file.fileType?.toUpperCase()}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{formatBytes(file.fileSize)}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                      {formatDistanceToNow(new Date(file.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    style={{ flex: 1, height: 34, fontSize: 12 }}
                    onClick={() => downloadGeneratedFile(`/api/files/download/id/${file._id}`, file.filename)}
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    className="btn btn-danger"
                    style={{ height: 34, width: 34, padding: 0 }}
                    onClick={() => handleDelete(file._id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
