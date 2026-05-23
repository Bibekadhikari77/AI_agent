import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, Loader2, Youtube, Mail, MessageCircle, Facebook, FileSpreadsheet, FileText } from 'lucide-react'
import VoiceButton from '../agent/VoiceButton'
import useChatStore from '../../store/chatStore'
import './ChatInput.css'

const QUICK_COMMANDS = [
  { label: 'YouTube', icon: Youtube, cmd: 'Open YouTube', color: '#FF0000' },
  { label: 'Gmail', icon: Mail, cmd: 'Open Gmail', color: '#EA4335' },
  { label: 'WhatsApp', icon: MessageCircle, cmd: 'Open WhatsApp', color: '#25D366' },
  { label: 'Facebook', icon: Facebook, cmd: 'Open Facebook', color: '#1877F2' },
  { label: 'Excel', icon: FileSpreadsheet, cmd: 'Generate an Excel sheet with monthly sales data for 2024', color: '#217346' },
  { label: 'PDF', icon: FileText, cmd: 'Generate a PDF report about our project progress', color: '#E44D26' },
]

export default function ChatInput() {
  const [text, setText] = useState('')
  const [rows, setRows] = useState(1)
  const textareaRef = useRef(null)
  const { sendMessage, sending } = useChatStore()

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const scrollHeight = textareaRef.current.scrollHeight
      const newRows = Math.min(Math.ceil(scrollHeight / 22), 6)
      setRows(newRows)
      textareaRef.current.style.height = `${scrollHeight}px`
    }
  }, [text])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setText('')
    setRows(1)
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    await sendMessage(trimmed, 'text')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleQuickCommand = (cmd) => {
    setText(cmd)
    textareaRef.current?.focus()
  }

  return (
    <div className="chat-input-container">
      {/* Quick Commands */}
      <div className="quick-commands">
        {QUICK_COMMANDS.map(({ label, icon: Icon, cmd, color }) => (
          <button
            key={label}
            className="quick-cmd-btn"
            onClick={() => handleQuickCommand(cmd)}
            style={{ '--cmd-color': color }}
            id={`quick-cmd-${label.toLowerCase()}`}
          >
            <Icon size={13} style={{ color }} />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Input Area */}
      <form className="chat-input-form" onSubmit={handleSubmit}>
        <div className="chat-input-inner glass">
          <textarea
            ref={textareaRef}
            id="chat-message-input"
            className="chat-textarea"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask ARIA anything... (Shift+Enter for new line)"
            rows={rows}
            disabled={sending}
          />

          <div className="chat-input-actions">
            <VoiceButton />

            <motion.button
              id="send-message-btn"
              type="submit"
              className={`send-btn ${text.trim() && !sending ? 'active' : ''}`}
              disabled={!text.trim() || sending}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
            >
              {sending ? (
                <Loader2 size={17} className="spinning" />
              ) : (
                <Send size={17} />
              )}
            </motion.button>
          </div>
        </div>

        <p className="chat-hint">
          Press <kbd>Enter</kbd> to send · <kbd>Shift+Enter</kbd> for new line · 
          🎤 Voice · 📊 Excel · 📄 PDF · 🌐 Open any website
        </p>
      </form>
    </div>
  )
}
