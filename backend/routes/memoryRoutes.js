const express = require('express');
const router = express.Router();
const { getMemories, createMemory, updateMemory, deleteMemory, clearMemories } = require('../controllers/memoryController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMemories);
router.post('/', protect, createMemory);
router.put('/:id', protect, updateMemory);
router.delete('/clear', protect, clearMemories);
router.delete('/:id', protect, deleteMemory);

module.exports = router;
