const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['fact', 'preference', 'task', 'context', 'automation', 'shortcut'],
    required: true
  },
  key: {
    type: String,
    required: true,
    trim: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  tags: [{ type: String, lowercase: true, trim: true }],
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 1.0
  },
  accessCount: { type: Number, default: 0 },
  lastAccessed: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null }
}, { timestamps: true });

// Compound index for user + key lookups
memorySchema.index({ user: 1, key: 1, type: 1 });
memorySchema.index({ user: 1, tags: 1 });
memorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0, sparse: true });

// Increment access count on retrieval
memorySchema.methods.recordAccess = function() {
  this.accessCount += 1;
  this.lastAccessed = new Date();
  return this.save();
};

module.exports = mongoose.model('Memory', memorySchema);
