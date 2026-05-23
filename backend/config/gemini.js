const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

let geminiClient = null;

const getGeminiClient = () => {
  if (!geminiClient) {
    if (!process.env.GEMINI_API_KEY) {
      logger.warn('⚠️  GEMINI_API_KEY not set — Gemini features will be limited');
      return null;
    }
    geminiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    logger.info('✅ Gemini client initialized');
  }
  return geminiClient;
};

module.exports = { getGeminiClient };
