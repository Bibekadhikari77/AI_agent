const Memory = require('../models/Memory');
const logger = require('../utils/logger');

// ─── GET /api/memory ──────────────────────────────────────────────────────
const getMemories = async (req, res) => {
  try {
    const { type, tags, search } = req.query;
    const filter = { user: req.user.id };
    if (type) filter.type = type;
    if (tags) filter.tags = { $in: tags.split(',') };
    if (search) filter.$or = [
      { key: { $regex: search, $options: 'i' } },
      { value: { $regex: search, $options: 'i' } }
    ];

    const memories = await Memory.find(filter)
      .sort({ accessCount: -1, updatedAt: -1 })
      .lean();

    res.json({ success: true, memories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/memory ─────────────────────────────────────────────────────
const createMemory = async (req, res) => {
  try {
    const { key, value, type = 'fact', tags = [], expiresAt } = req.body;
    if (!key || value === undefined) return res.status(400).json({ error: 'Key and value are required' });

    const memory = await Memory.findOneAndUpdate(
      { user: req.user.id, key },
      { user: req.user.id, key, value, type, tags, expiresAt: expiresAt || null, lastAccessed: new Date() },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({ success: true, memory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── PUT /api/memory/:id ──────────────────────────────────────────────────
const updateMemory = async (req, res) => {
  try {
    const memory = await Memory.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!memory) return res.status(404).json({ error: 'Memory not found' });
    res.json({ success: true, memory });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /api/memory/:id ───────────────────────────────────────────────
const deleteMemory = async (req, res) => {
  try {
    await Memory.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.json({ success: true, message: 'Memory deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /api/memory/clear ─────────────────────────────────────────────
const clearMemories = async (req, res) => {
  try {
    const { type } = req.body;
    const filter = { user: req.user.id };
    if (type) filter.type = type;
    const result = await Memory.deleteMany(filter);
    res.json({ success: true, deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getMemories, createMemory, updateMemory, deleteMemory, clearMemories };
