const express = require('express');
const router = express.Router();
const { chat, voiceChat, getConversations, getConversation, deleteConversation, getStats } = require('../controllers/agentController');
const { protect } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.post('/chat', protect, chat);
router.post('/voice', protect, upload.single('audio'), voiceChat);
router.get('/conversations', protect, getConversations);
router.get('/conversations/:id', protect, getConversation);
router.delete('/conversations/:id', protect, deleteConversation);
router.get('/stats', protect, getStats);

module.exports = router;
