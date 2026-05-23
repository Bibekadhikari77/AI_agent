const AutomationLog = require('../models/AutomationLog');
const logger = require('../utils/logger');

// URL mappings for known apps
const APP_URLS = {
  youtube: 'https://www.youtube.com',
  gmail: 'https://mail.google.com',
  whatsapp: 'https://web.whatsapp.com',
  facebook: 'https://www.facebook.com',
  twitter: 'https://www.twitter.com',
  instagram: 'https://www.instagram.com',
  linkedin: 'https://www.linkedin.com',
  github: 'https://www.github.com',
  google: 'https://www.google.com',
  netflix: 'https://www.netflix.com',
  spotify: 'https://open.spotify.com',
  reddit: 'https://www.reddit.com',
  amazon: 'https://www.amazon.com',
  drive: 'https://drive.google.com',
  docs: 'https://docs.google.com',
  sheets: 'https://sheets.google.com',
  meet: 'https://meet.google.com',
  zoom: 'https://zoom.us',
  slack: 'https://slack.com',
  notion: 'https://notion.so',
  figma: 'https://figma.com',
  chatgpt: 'https://chat.openai.com',
  claude: 'https://claude.ai'
};

// ─── POST /api/automation/open-url ────────────────────────────────────────
const openUrl = async (req, res) => {
  try {
    const { url, app } = req.body;

    // Resolve app name to URL if needed
    let targetUrl = url;
    if (!targetUrl && app) {
      const appKey = app.toLowerCase().replace(/\s+/g, '');
      targetUrl = APP_URLS[appKey] || `https://www.${appKey}.com`;
    }

    if (!targetUrl) return res.status(400).json({ error: 'URL or app name required' });

    // Ensure URL has protocol
    if (!targetUrl.startsWith('http')) targetUrl = 'https://' + targetUrl;

    // Log automation
    await AutomationLog.create({
      user: req.user.id,
      type: 'browser_open',
      command: `open ${app || targetUrl}`,
      parameters: { url: targetUrl, app },
      result: { success: true },
      source: req.body.source || 'text'
    });

    res.json({
      success: true,
      url: targetUrl,
      app: app || new URL(targetUrl).hostname,
      message: `Opening ${app || targetUrl}...`
    });
  } catch (err) {
    logger.error(`Open URL error: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

// ─── GET /api/automation/apps ─────────────────────────────────────────────
const getSupportedApps = async (req, res) => {
  res.json({
    success: true,
    apps: Object.keys(APP_URLS).map(key => ({
      name: key.charAt(0).toUpperCase() + key.slice(1),
      key,
      url: APP_URLS[key]
    }))
  });
};

// ─── GET /api/automation/logs ─────────────────────────────────────────────
const getLogs = async (req, res) => {
  try {
    const { type, limit = 50, page = 1 } = req.query;
    const filter = { user: req.user.id };
    if (type) filter.type = type;

    const logs = await AutomationLog.find(filter)
      .sort({ executedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const total = await AutomationLog.countDocuments(filter);
    res.json({ success: true, logs, total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── POST /api/automation/notify ──────────────────────────────────────────
const sendNotification = async (req, res) => {
  try {
    const { title, body, type = 'info' } = req.body;

    // Emit via socket for real-time notification
    const io = req.app.get('io');
    io?.sendToUser?.(req.user.id, 'notification', { title, body, type, timestamp: new Date() });

    await AutomationLog.create({
      user: req.user.id,
      type: 'notification',
      command: `notify: ${title}`,
      parameters: { title, body, type },
      result: { success: true }
    });

    res.json({ success: true, message: 'Notification sent' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { openUrl, getSupportedApps, getLogs, sendNotification };
