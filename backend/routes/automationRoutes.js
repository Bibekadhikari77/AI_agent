const express = require('express');
const router = express.Router();
const { openUrl, getSupportedApps, getLogs, sendNotification } = require('../controllers/automationController');
const { protect } = require('../middleware/auth');

router.post('/open-url', protect, openUrl);
router.get('/apps', protect, getSupportedApps);
router.get('/logs', protect, getLogs);
router.post('/notify', protect, sendNotification);

module.exports = router;
