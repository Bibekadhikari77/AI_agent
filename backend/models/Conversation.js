const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'voice', 'command', 'file', 'automation', 'error'],
    default: 'text'
  },
  metadata: {
    commandExecuted: String,
    fileGenerated: String,
    automationTarget: String,
    voiceTranscript: String,
    tokens: Number,
    model: String,
    processingTime: Number
  },
  timestamp: { type: Date, default: Date.now }
});

const conversationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    default: 'New Conversation',
    maxlength: 200
  },
  messages: [messageSchema],
  context: {
    summary: String,
    keywords: [String],
    lastTopic: String
  },
  isArchived: { type: Boolean, default: false },
  isPinned: { type: Boolean, default: false },
  totalTokens: { type: Number, default: 0 },
  messageCount: { type: Number, default: 0 }
}, { timestamps: true });

// Auto-generate title from first user message
conversationSchema.pre('save', function(next) {
  if (this.isNew && this.messages.length > 0) {
    const firstMsg = this.messages.find(m => m.role === 'user');
    if (firstMsg && this.title === 'New Conversation') {
      this.title = firstMsg.content.substring(0, 60) + (firstMsg.content.length > 60 ? '...' : '');
    }
  }
  this.messageCount = this.messages.length;
  next();
});

module.exports = mongoose.model('Conversation', conversationSchema);
