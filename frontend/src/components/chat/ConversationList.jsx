import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { MessageSquare, Pin, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import useChatStore from '../../store/chatStore'
import './ConversationList.css'

export default function ConversationList() {
  const { conversations, fetchConversations, loadConversation, deleteConversation, activeConversation } = useChatStore()
  const navigate = useNavigate()
  const { conversationId } = useParams()

  useEffect(() => {
    fetchConversations()
  }, [])

  const handleClick = (id) => {
    loadConversation(id)
    navigate(`/chat/${id}`)
  }

  if (conversations.length === 0) {
    return (
      <div className="conv-empty">
        <MessageSquare size={24} />
        <p>No conversations yet</p>
        <span>Start chatting with ARIA!</span>
      </div>
    )
  }

  return (
    <div className="conv-list">
      <div className="conv-list-header">
        <span>Recent Chats</span>
        <span className="conv-count">{conversations.length}</span>
      </div>
      <div className="conv-items">
        {conversations.map((conv, i) => (
          <motion.div
            key={conv._id}
            className={`conv-item ${activeConversation?._id === conv._id ? 'active' : ''}`}
            onClick={() => handleClick(conv._id)}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <div className="conv-item-icon">
              {conv.isPinned ? <Pin size={12} /> : <MessageSquare size={12} />}
            </div>
            <div className="conv-item-content">
              <span className="conv-title truncate">{conv.title}</span>
              <span className="conv-meta">
                {conv.messageCount} msgs · {formatDistanceToNow(new Date(conv.updatedAt), { addSuffix: true })}
              </span>
            </div>
            <button
              className="conv-delete-btn"
              onClick={(e) => { e.stopPropagation(); deleteConversation(conv._id) }}
              title="Delete"
            >
              <Trash2 size={11} />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
