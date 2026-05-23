const express = require('express');
const router = express.Router();
const { getFiles, downloadFile, downloadFileById, generateExcelEndpoint, generatePDFEndpoint, generateDOCXEndpoint, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getFiles);
router.get('/download/id/:id', protect, downloadFileById);
router.get('/download/:filename', protect, downloadFile);
router.post('/generate/excel', protect, generateExcelEndpoint);
router.post('/generate/pdf', protect, generatePDFEndpoint);
router.post('/generate/docx', protect, generateDOCXEndpoint);
router.delete('/:id', protect, deleteFile);

module.exports = router;
