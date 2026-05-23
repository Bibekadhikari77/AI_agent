const mongoose = require('mongoose');

const automationLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['browser_open', 'file_generate', 'system_command', 'schedule', 'search', 'notification'],
    required: true
  },
  command: {
    type: String,
    required: true
  },
  parameters: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  result: {
    success: { type: Boolean, default: false },
    output: String,
    error: String,
    duration: Number  // ms
  },
  source: {
    type: String,
    enum: ['voice', 'text', 'schedule', 'api'],
    default: 'text'
  },
  executedAt: { type: Date, default: Date.now }
}, { timestamps: true });

automationLogSchema.index({ user: 1, executedAt: -1 });
automationLogSchema.index({ user: 1, type: 1 });

module.exports = mongoose.model('AutomationLog', automationLogSchema);
