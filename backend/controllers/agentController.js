const { processAgentMessage, transcribeAudio } = require('../services/agentService');
const { generateExcel, generatePDF, generateDOCX } = require('../services/fileService');
const Conversation = require('../models/Conversation');
const logger = require('../utils/logger');
const path = require('path');

// ─── POST /api/agent/chat ─────────────────────────────────────────────────
const chat = async (req, res) => {
  try {
    const { message, conversationId, source = 'text' } = req.body;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation
    let conversation;
    if (conversationId) {
      conversation = await Conversation.findOne({
        _id: conversationId,
        user: req.user.id
      });
    }

    if (!conversation) {
      conversation = new Conversation({ user: req.user.id, messages: [] });
    }

    // Emit thinking indicator via socket
    const io = req.app.get('io');
    io?.sendToUser?.(req.user.id, 'agent:thinking', { status: true });

    // Process with AI agent
    const result = await processAgentMessage({
      userId: req.user.id,
      message,
      conversationHistory: conversation.messages,
      source
    });

    // Handle file generation actions
    let fileResult = null;
    if (result.action) {
      const { action, parameters } = result.action;
      
      try {
        if (action === 'generate_excel') {
          io?.sendToUser?.(req.user.id, 'file:generating', { type: 'excel', status: 'generating' });
          fileResult = await generateExcel({ userId: req.user.id, ...parameters });
          io?.sendToUser?.(req.user.id, 'file:generating', { type: 'excel', status: 'done', filename: fileResult.filename });
        } else if (action === 'generate_pdf') {
          io?.sendToUser?.(req.user.id, 'file:generating', { type: 'pdf', status: 'generating' });
          fileResult = await generatePDF({ userId: req.user.id, ...parameters });
          io?.sendToUser?.(req.user.id, 'file:generating', { type: 'pdf', status: 'done', filename: fileResult.filename });
        } else if (action === 'generate_docx') {
          io?.sendToUser?.(req.user.id, 'file:generating', { type: 'docx', status: 'generating' });
          fileResult = await generateDOCX({ userId: req.user.id, ...parameters });
          io?.sendToUser?.(req.user.id, 'file:generating', { type: 'docx', status: 'done', filename: fileResult.filename });
        }
      } catch (fileErr) {
        logger.error(`File generation error: ${fileErr.message}`);
      }
    }

    // Save messages to conversation
    conversation.messages.push({
      role: 'user',
      content: message,
      type: source,
      metadata: { voiceTranscript: source === 'voice' ? message : undefined }
    });

    conversation.messages.push({
      role: 'assistant',
      content: result.response,
      type: result.action ? 'command' : 'text',
      metadata: {
        commandExecuted: result.action?.action,
        fileGenerated: fileResult?.filename,
        tokens: result.tokens,
        model: process.env.OPENAI_MODEL || 'gpt-4o',
        processingTime: result.processingTime
      }
    });

    conversation.totalTokens += result.tokens || 0;
    await conversation.save();

    // Turn off thinking indicator
    io?.sendToUser?.(req.user.id, 'agent:thinking', { status: false });

    res.json({
      success: true,
      response: result.response,
      action: result.action,
      file: fileResult ? {
        filename: fileResult.filename,
        fileId: fileResult.fileId,
        downloadUrl: `/api/files/download/id/${fileResult.fileId}`
      } : null,
      conversationId: conversation._id,
      intent: result.intent,
      processingTime: result.processingTime
    });
  } catch (err) {
    logger.error(`Agent chat error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/agent/voice ────────────────────────────────────────────────
const voiceChat = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Audio file is required' });
    }

    const fs = require('fs');
    const audioBuffer = fs.readFileSync(req.file.path);
    
    let transcript;
    try {
      transcript = await transcribeAudio(audioBuffer, req.file.mimetype);
    } catch (transcribeErr) {
      // Fallback: use text from body if provided
      transcript = req.body.fallbackText || 'Voice transcription failed';
    }

    // Clean up temp file
    fs.unlinkSync(req.file.path);

    // Process as regular chat with voice source
    req.body.message = transcript;
    req.body.source = 'voice';
    
    return chat(req, res);
  } catch (err) {
    logger.error(`Voice chat error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/agent/conversations ────────────────────────────────────────
const getConversations = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const conversations = await Conversation.find({ user: req.user.id, isArchived: false })
      .select('title messageCount totalTokens createdAt updatedAt isPinned')
      .sort({ isPinned: -1, updatedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await Conversation.countDocuments({ user: req.user.id, isArchived: false });

    res.json({ success: true, conversations, total, page: Number(page), totalPages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/agent/conversations/:id ────────────────────────────────────
const getConversation = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      user: req.user.id
    }).lean();

    if (!conversation) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ success: true, conversation });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /api/agent/conversations/:id ─────────────────────────────────
const deleteConversation = async (req, res) => {
  try {
    await Conversation.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/agent/stats ─────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const AutomationLog = require('../models/AutomationLog');
    const GeneratedFile = require('../models/GeneratedFile');

    const [convCount, autoCount, fileCount, recentAutos] = await Promise.all([
      Conversation.countDocuments({ user: req.user.id }),
      AutomationLog.countDocuments({ user: req.user.id }),
      GeneratedFile.countDocuments({ user: req.user.id }),
      AutomationLog.find({ user: req.user.id }).sort({ executedAt: -1 }).limit(5).lean()
    ]);

    res.json({
      success: true,
      stats: {
        conversations: convCount,
        automations: autoCount,
        filesGenerated: fileCount,
        recentActivity: recentAutos
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { chat, voiceChat, getConversations, getConversation, deleteConversation, getStats };
