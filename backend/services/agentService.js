const { getOpenAIClient } = require('../config/openai');
const { getGeminiClient } = require('../config/gemini');
const Memory = require('../models/Memory');
const AutomationLog = require('../models/AutomationLog');
const logger = require('../utils/logger');

// ─── SYSTEM PROMPT ──────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are ARIA (Adaptive Reasoning & Intelligence Agent), a powerful AI desktop assistant.
You help users with:
- Opening websites and applications (YouTube, WhatsApp, Gmail, Facebook, etc.)
- Generating files (Excel spreadsheets, PDF documents, Word documents)
- Searching the web and answering questions
- Managing tasks, notes, and reminders
- Controlling desktop applications
- Analyzing data and providing insights

When the user asks you to perform an ACTION (not just answer a question), respond with a JSON object in this exact format:

{
  "type": "action",
  "action": "<action_type>",
  "parameters": { ... },
  "message": "<friendly confirmation message to the user>",
  "followUp": "<optional follow-up question or tip>"
}

Action types and their parameters:
- "open_url": { "url": "https://...", "app": "YouTube|Gmail|WhatsApp|Facebook|etc" }
- "search_web": { "query": "search terms", "engine": "google|youtube|bing" }
- "generate_excel": { "filename": "name.xlsx", "title": "Sheet Title", "data": [[...]], "headers": [...] }
- "generate_pdf": { "filename": "name.pdf", "title": "Document Title", "content": "...", "sections": [{...}] }
- "generate_docx": { "filename": "name.docx", "title": "Doc Title", "content": "...", "sections": [{...}] }
- "notify": { "title": "Notification", "body": "Message", "type": "info|success|warning|error" }
- "remember": { "key": "fact_name", "value": "...", "type": "fact|preference|task" }
- "schedule": { "task": "description", "time": "ISO datetime or cron", "action": {...} }
- "system_info": { "request": "cpu|memory|disk|battery|network" }

For conversational responses (questions, explanations), respond ONLY with plain text — no JSON.

Always be helpful, concise, and proactive. Remember previous context from the conversation.
If the user says "open YouTube", respond with the open_url action immediately.
If the user wants a file, generate it with appropriate content.`;

const KNOWN_APP_URLS = {
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

const buildOpenUrlAction = (message) => {
  const text = String(message || '').trim();
  if (!text) return null;

  const lower = text.toLowerCase();

  // If a URL is already present, open it.
  const urlMatch = text.match(/https?:\/\/[^\s]+/i);
  if (urlMatch) {
    const url = urlMatch[0];
    return {
      type: 'action',
      action: 'open_url',
      parameters: { url, app: new URL(url).hostname },
      message: `Opening ${url}...`
    };
  }

  // Common "open X" style commands.
  const openLike = /\b(open|launch|go to|visit|navigate to|take me to|show me)\b/i.test(lower);
  if (!openLike) return null;

  // Try to resolve a known app first.
  for (const [key, url] of Object.entries(KNOWN_APP_URLS)) {
    if (lower.includes(key)) {
      return {
        type: 'action',
        action: 'open_url',
        parameters: { url, app: key.charAt(0).toUpperCase() + key.slice(1) },
        message: `Opening ${key.charAt(0).toUpperCase() + key.slice(1)}...`
      };
    }
  }

  // Fallback: extract "open <thing>" and try https://<thing>
  const m = lower.match(/\b(open|launch|go to|visit|navigate to|take me to|show me)\s+(.+)$/i);
  const target = m?.[2]?.trim();
  if (!target) return null;

  const cleaned = target.replace(/[.]+$/g, '');
  const url = cleaned.includes('.') ? `https://${cleaned}` : `https://www.${cleaned}.com`;
  return {
    type: 'action',
    action: 'open_url',
    parameters: { url, app: cleaned },
    message: `Opening ${cleaned}...`
  };
};

// ─── Intent Classification ────────────────────────────────────────────────
const ACTION_KEYWORDS = {
  open_url: ['open', 'launch', 'go to', 'visit', 'navigate to', 'show me', 'take me to'],
  generate_excel: ['excel', 'spreadsheet', 'xlsx', 'table', 'sheet', 'generate excel', 'create excel'],
  generate_pdf: ['pdf', 'generate pdf', 'create pdf', 'export pdf', 'save as pdf'],
  generate_docx: ['word document', 'docx', 'doc file', 'generate word', 'create document'],
  search_web: ['search', 'find', 'look up', 'google', 'search for'],
  notify: ['notify me', 'remind me', 'alert me', 'set reminder'],
  schedule: ['schedule', 'set alarm', 'remind at', 'every day', 'every hour']
};

const classifyIntent = (text) => {
  const lower = text.toLowerCase();
  for (const [action, keywords] of Object.entries(ACTION_KEYWORDS)) {
    if (keywords.some(kw => lower.includes(kw))) return action;
  }
  return 'conversation';
};

// ─── Build Context from Memory ────────────────────────────────────────────
const buildMemoryContext = async (userId) => {
  try {
    const memories = await Memory.find({ user: userId })
      .sort({ accessCount: -1, lastAccessed: -1 })
      .limit(20)
      .lean();

    if (memories.length === 0) return '';

    const memStr = memories.map(m => `[${m.type}] ${m.key}: ${JSON.stringify(m.value)}`).join('\n');
    return `\n\nUser Memory Context:\n${memStr}\n`;
  } catch (err) {
    logger.error(`Memory context error: ${err.message}`);
    return '';
  }
};

// ─── Main AI Processing Function ──────────────────────────────────────────
const processAgentMessage = async ({ userId, message, conversationHistory = [], source = 'text' }) => {
  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const openai = provider === 'openai' ? getOpenAIClient() : null;
  const gemini = provider === 'gemini' ? getGeminiClient() : null;
  const startTime = Date.now();

  const intent = classifyIntent(message);
  logger.info(`[Agent] User: ${userId} | Provider: ${provider} | Intent: ${intent} | Source: ${source}`);

  // Deterministic "open_url" so voice/text commands open reliably.
  if (intent === 'open_url') {
    const action = buildOpenUrlAction(message);
    if (action) {
      return {
        response: action.message,
        action,
        intent,
        tokens: 0,
        processingTime: Date.now() - startTime,
        source
      };
    }
  }

  // Build memory context
  const memoryContext = await buildMemoryContext(userId);

  // Build system prompt with memory
  const systemPrompt = SYSTEM_PROMPT + memoryContext;

  // Build messages array
  const messages = [
    { role: 'system', content: systemPrompt },
    // Include last 10 messages for context
    ...conversationHistory.slice(-10).map(m => ({ role: m.role, content: m.content })),
    { role: 'user', content: message }
  ];

  let responseText = '';
  let parsedAction = null;
  let tokens = 0;

  if (provider === 'gemini' && !gemini) {
    // Fallback without Gemini API key
    responseText = handleFallbackResponse(message, intent);
  } else if (provider === 'openai' && !openai) {
    // Fallback without API key
    responseText = handleFallbackResponse(message, intent);
  } else {
    try {
      if (provider === 'gemini') {
        const contents = [
          ...conversationHistory
            .filter(m => m.role !== 'system')
            .slice(-10)
            .map(m => ({
              role: m.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: m.content }]
            })),
          { role: 'user', parts: [{ text: message }] }
        ];

        const resp = await gemini.models.generateContent({
          model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          contents,
          config: {
            systemInstruction: systemPrompt,
            temperature: 0.7,
            maxOutputTokens: 2000
          }
        });

        responseText = typeof resp.text === 'function' ? resp.text() : resp.text;
      } else {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages,
          temperature: 0.7,
          max_tokens: 2000,
          response_format: intent !== 'conversation' ? undefined : undefined
        });

        responseText = completion.choices[0].message.content;
        tokens = completion.usage?.total_tokens || 0;
      }

      // Try to parse as JSON action
      try {
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.type === 'action') {
            parsedAction = parsed;
            responseText = parsed.message || responseText;
          }
        }
      } catch (_) {
        // Not JSON — plain text response
      }
    } catch (err) {
      logger.error(`${provider === 'gemini' ? 'Gemini' : 'OpenAI'} API error: ${err.message}`);
      responseText = `I encountered an error processing your request: ${err.message}. Please check your API key/quota.`;
    }
  }

  const processingTime = Date.now() - startTime;

  // Log automation actions
  if (parsedAction) {
    try {
      await AutomationLog.create({
        user: userId,
        type: mapActionToLogType(parsedAction.action),
        command: message,
        parameters: parsedAction.parameters || {},
        result: { success: true, duration: processingTime },
        source
      });

      // Auto-save memories if asked
      if (parsedAction.action === 'remember' && parsedAction.parameters) {
        await Memory.findOneAndUpdate(
          { user: userId, key: parsedAction.parameters.key },
          {
            user: userId,
            type: parsedAction.parameters.type || 'fact',
            key: parsedAction.parameters.key,
            value: parsedAction.parameters.value,
            lastAccessed: new Date()
          },
          { upsert: true, new: true }
        );
      }
    } catch (logErr) {
      logger.error(`Automation log error: ${logErr.message}`);
    }
  }

  return {
    response: responseText,
    action: parsedAction,
    intent,
    tokens,
    processingTime,
    source
  };
};

// ─── Fallback Response (no API key) ──────────────────────────────────────
const handleFallbackResponse = (message, intent) => {
  const lower = message.toLowerCase();

  const provider = (process.env.AI_PROVIDER || 'openai').toLowerCase();
  const missingKeyMsg = provider === 'gemini'
    ? 'no Gemini API key configured'
    : 'no OpenAI API key configured';

  if (intent === 'open_url') {
    const action = buildOpenUrlAction(message);
    if (action) return JSON.stringify(action);
  }

  if (lower.includes('youtube')) {
    return JSON.stringify({
      type: 'action',
      action: 'open_url',
      parameters: { url: 'https://www.youtube.com', app: 'YouTube' },
      message: 'Opening YouTube for you! 🎬'
    });
  }
  if (lower.includes('gmail')) {
    return JSON.stringify({
      type: 'action',
      action: 'open_url',
      parameters: { url: 'https://mail.google.com', app: 'Gmail' },
      message: 'Opening Gmail! 📧'
    });
  }
  if (lower.includes('whatsapp')) {
    return JSON.stringify({
      type: 'action',
      action: 'open_url',
      parameters: { url: 'https://web.whatsapp.com', app: 'WhatsApp' },
      message: 'Opening WhatsApp Web! 💬'
    });
  }
  if (lower.includes('facebook')) {
    return JSON.stringify({
      type: 'action',
      action: 'open_url',
      parameters: { url: 'https://www.facebook.com', app: 'Facebook' },
      message: 'Opening Facebook! 👥'
    });
  }

  return `Hello! I'm ARIA, your AI Desktop Assistant. I'm running in demo mode (${missingKeyMsg}). 
  
You can still test:
• **Voice commands** — click the mic button
• **URL opening** — try "open YouTube" or "open Gmail"  
• **File generation** — try "generate an Excel sheet with sales data"
• **Chat** — I'll respond with sample responses

To enable full AI features, set your API key in the .env file.`;
};

const mapActionToLogType = (action) => {
  const map = {
    open_url: 'browser_open',
    search_web: 'search',
    generate_excel: 'file_generate',
    generate_pdf: 'file_generate',
    generate_docx: 'file_generate',
    notify: 'notification',
    schedule: 'schedule',
    remember: 'system_command'
  };
  return map[action] || 'system_command';
};

// ─── Voice Transcription ─────────────────────────────────────────────────
const transcribeAudio = async (audioBuffer, mimeType = 'audio/webm') => {
  const openai = getOpenAIClient();
  if (!openai) throw new Error('OpenAI not configured');

  const { Readable } = require('stream');
  const stream = Readable.from(audioBuffer);
  stream.path = 'audio.webm';

  const transcription = await openai.audio.transcriptions.create({
    file: stream,
    model: 'whisper-1',
    language: 'en'
  });

  return transcription.text;
};

module.exports = { processAgentMessage, transcribeAudio, classifyIntent };
