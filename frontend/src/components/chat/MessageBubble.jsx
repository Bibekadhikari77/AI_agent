import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  User, Bot, Mic, Terminal, FileText,
  ExternalLink, Download, AlertCircle, Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { downloadGeneratedFile } from '../../utils/downloadFile'
import './MessageBubble.css'

const TYPE_ICONS = {
  voice: Mic,
  command: Terminal,
  file: FileText,
  error: AlertCircle,
  text: null
}

const ACTION_LABELS = {
  open_url: '🌐 Opened URL',
  generate_excel: '📊 Generated Excel',
  generate_pdf: '📄 Generated PDF',
  generate_docx: '📝 Generated Word Doc',
  search_web: '🔍 Web Search',
  notify: '🔔 Notification',
  remember: '🧠 Stored in Memory',
  schedule: '⏰ Scheduled'
}

export default function MessageBubble({ message, isNew }) {
  const isUser = message.role === 'user'
  const TypeIcon = TYPE_ICONS[message.type]

  return (
    <motion.div
      className={`message-wrap ${isUser ? 'user' : 'assistant'}`}
      initial={isNew ? { opacity: 0, y: 16, scale: 0.97 } : false}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      {/* Avatar */}
      <div className={`msg-avatar ${isUser ? 'user-avatar' : 'bot-avatar'}`}>
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>

      <div className="msg-content-wrap">
        {/* Type indicator */}
        {TypeIcon && (
          <div className="msg-type-tag">
            <TypeIcon size={10} />
            <span>{message.type}</span>
          </div>
        )}

        {/* Bubble */}
        <div className={`msg-bubble ${isUser ? 'user-bubble' : 'bot-bubble'} ${message.type === 'error' ? 'error-bubble' : ''}`}>
          {isUser ? (
            <p className="msg-text">{message.content}</p>
          ) : (
            <div className="msg-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Action badge */}
          {message.action?.action && (
            <div className="action-badge">
              <span>{ACTION_LABELS[message.action.action] || `⚡ ${message.action.action}`}</span>
              {message.action.parameters?.url && (
                <a
                  href={message.action.parameters.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="action-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink size={11} />
                  <span>{message.action.parameters.app || 'Open'}</span>
                </a>
              )}
            </div>
          )}

          {/* File download */}
          {message.file && (
            <button
              type="button"
              className="file-download-btn"
              onClick={() => downloadGeneratedFile(message.file.downloadUrl, message.file.filename)}
            >
              <Download size={13} />
              <span>Download {message.file.filename}</span>
            </button>
          )}
        </div>

        {/* Timestamp */}
        <div className="msg-footer">
          <Clock size={9} />
          <span>
            {message.timestamp
              ? formatDistanceToNow(new Date(message.timestamp), { addSuffix: true })
              : 'just now'}
          </span>
          {message.metadata?.processingTime && (
            <span className="msg-timing">{message.metadata.processingTime}ms</span>
          )}
        </div>
      </div>
    </motion.div>
  )
}

// Typing indicator
export function TypingIndicator() {
  return (
    <motion.div
      className="message-wrap assistant"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="msg-avatar bot-avatar">
        <Bot size={14} />
      </div>
      <div className="typing-bubble">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </motion.div>
  )
}
