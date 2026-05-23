const mongoose = require('mongoose');

const generatedFileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  filename: {
    type: String,
    required: true
  },
  originalName: String,
  fileType: {
    type: String,
    enum: ['pdf', 'docx', 'xlsx', 'csv', 'txt', 'json'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: Number,
  prompt: String,  // The user prompt that generated this file
  metadata: {
    pages: Number,
    rows: Number,
    sheets: Number,
    wordCount: Number
  },
  downloadCount: { type: Number, default: 0 },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)  // 7 days
  }
}, { timestamps: true });

generatedFileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
generatedFileSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('GeneratedFile', generatedFileSchema);
