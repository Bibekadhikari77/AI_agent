const GeneratedFile = require('../models/GeneratedFile');
const { generateExcel, generatePDF, generateDOCX } = require('../services/fileService');
const logger = require('../utils/logger');
const fs = require('fs');

const sendGeneratedFile = async (req, res, file) => {
  if (!file) return res.status(404).json({ error: 'File not found' });
  if (!fs.existsSync(file.filePath)) return res.status(404).json({ error: 'File no longer exists on disk' });

  file.downloadCount += 1;
  await file.save();

  return res.download(file.filePath, file.filename);
};

// ─── GET /api/files ───────────────────────────────────────────────────────
const getFiles = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const filter = { user: req.user.id };
    if (type) filter.fileType = type;

    const files = await GeneratedFile.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await GeneratedFile.countDocuments(filter);
    res.json({ success: true, files, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/files/download/:filename ───────────────────────────────────
const downloadFile = async (req, res) => {
  try {
    const file = await GeneratedFile.findOne({
      filename: req.params.filename,
      user: req.user.id
    });

    return sendGeneratedFile(req, res, file);
  } catch (err) {
    logger.error(`Download file error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/files/download/id/:id ──────────────────────────────────────
const downloadFileById = async (req, res) => {
  try {
    const file = await GeneratedFile.findOne({
      _id: req.params.id,
      user: req.user.id
    });

    return sendGeneratedFile(req, res, file);
  } catch (err) {
    logger.error(`Download file by ID error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/files/generate/excel ──────────────────────────────────────
const generateExcelEndpoint = async (req, res) => {
  try {
    const { filename, title, headers, data, sheetName } = req.body;
    const result = await generateExcel({ userId: req.user.id, filename, title, headers, data, sheetName });
    res.json({
      success: true,
      file: { ...result, downloadUrl: `/api/files/download/id/${result.fileId}` }
    });
  } catch (err) {
    logger.error(`Excel generation endpoint error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/files/generate/pdf ────────────────────────────────────────
const generatePDFEndpoint = async (req, res) => {
  try {
    const { filename, title, content, sections } = req.body;
    const result = await generatePDF({ userId: req.user.id, filename, title, content, sections });
    res.json({
      success: true,
      file: { ...result, downloadUrl: `/api/files/download/id/${result.fileId}` }
    });
  } catch (err) {
    logger.error(`PDF generation endpoint error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/files/generate/docx ───────────────────────────────────────
const generateDOCXEndpoint = async (req, res) => {
  try {
    const { filename, title, content, sections } = req.body;
    const result = await generateDOCX({ userId: req.user.id, filename, title, content, sections });
    res.json({
      success: true,
      file: { ...result, downloadUrl: `/api/files/download/id/${result.fileId}` }
    });
  } catch (err) {
    logger.error(`DOCX generation endpoint error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// ─── DELETE /api/files/:id ────────────────────────────────────────────────
const deleteFile = async (req, res) => {
  try {
    const file = await GeneratedFile.findOne({ _id: req.params.id, user: req.user.id });
    if (!file) return res.status(404).json({ error: 'File not found' });

    if (fs.existsSync(file.filePath)) {
      fs.unlinkSync(file.filePath);
    }
    await file.deleteOne();

    res.json({ success: true, message: 'File deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { getFiles, downloadFile, downloadFileById, generateExcelEndpoint, generatePDFEndpoint, generateDOCXEndpoint, deleteFile };
