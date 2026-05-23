const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Conversation = require('../models/Conversation');

// Alias: GET /api/chat/history → same as agent conversations
router.get('/history', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ user: req.user.id, isArchived: false })
      .select('title messageCount updatedAt')
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();
    res.json({ success: true, conversations });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/chat/:id/pin
router.patch('/:id/pin', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      [{ $set: { isPinned: { $not: '$isPinned' } } }],
      { new: true }
    );
    if (!conv) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, isPinned: conv.isPinned });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/chat/:id/archive
router.patch('/:id/archive', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { isArchived: true },
      { new: true }
    );
    if (!conv) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true, message: 'Conversation archived' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
