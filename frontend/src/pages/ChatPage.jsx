import { useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Bot, Sparkles, Zap, FileText, Globe } from 'lucide-react'
import MessageBubble, { TypingIndicator } from '../components/chat/MessageBubble'
import ChatInput from '../components/chat/ChatInput'
import useChatStore from '../store/chatStore'
import useSocketStore from '../store/socketStore'
import './ChatPage.css'

const WELCOME_SUGGESTIONS = [
  { text: 'Open YouTube', icon: Globe, color: '#FF0000' },
  { text: 'Open Gmail', icon: Globe, color: '#EA4335' },
  { text: 'Generate a sales Excel report', icon: FileText, color: '#217346' },
  { text: 'Create a project PDF document', icon: FileText, color: '#E44D26' },
  { text: 'What can you help me with?', icon: Sparkles, color: '#6C63FF' },
  { text: 'Open WhatsApp Web', icon: Globe, color: '#25D366' },
]

export default function ChatPage() {
  const { conversationId } = useParams()
  const { messages, loading, sending, loadConversation, sendMessage, activeConversation } = useChatStore()
  const { agentThinking } = useSocketStore()
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId)
    }
  }, [conversationId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, agentThinking])

  const isWelcome = messages.length === 0 && !loading

  return (
    <div className="chat-page">
      {/* Messages area */}
      <div className="messages-area" id="messages-container">
        {isWelcome ? (
          <div className="welcome-screen">
            <div className="welcome-hero">
              <div className="aria-orb">
                <div className="orb-glow" />
                <Bot size={40} className="orb-icon" />
              </div>
              <h2 className="welcome-title">
                Hello, I'm <span className="gradient-text">ARIA</span>
              </h2>
              <p className="welcome-sub">
                Your Adaptive Reasoning & Intelligence Agent. I can open apps, generate files,
                answer questions, and automate your desktop — just ask!
              </p>
            </div>

            <div className="capability-grid">
              {[
                { icon: Globe, title: 'Open Any App', desc: 'YouTube, Gmail, WhatsApp, Facebook & more', color: '#6C63FF' },
                { icon: FileText, title: 'Generate Files', desc: 'Excel, PDF, Word documents on demand', color: '#00D4FF' },
                { icon: Zap, title: 'Automation', desc: 'Desktop control & task scheduling', color: '#FFB830' },
                { icon: Sparkles, title: 'Smart Memory', desc: 'Remembers your preferences & history', color: '#00E5A0' },
              ].map(({ icon: Icon, title, desc, color }) => (
                <div className="capability-card" key={title} style={{ '--card-color': color }}>
                  <div className="cap-icon" style={{ background: `${color}20`, color }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="cap-title">{title}</h4>
                    <p className="cap-desc">{desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="suggestions">
              <p className="suggestions-label">Try asking:</p>
              <div className="suggestions-grid">
                {WELCOME_SUGGESTIONS.map(({ text, icon: Icon, color }) => (
                  <button
                    key={text}
                    className="suggestion-btn"
                    onClick={() => sendMessage(text)}
                    style={{ '--sug-color': color }}
                  >
                    <Icon size={13} style={{ color }} />
                    <span>{text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="messages-list">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg._id || i}
                  message={msg}
                  isNew={i === messages.length - 1 && msg.role === 'assistant'}
                />
              ))}
              {(agentThinking || sending) && <TypingIndicator key="typing" />}
            </AnimatePresence>
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput />
    </div>
  )
}
