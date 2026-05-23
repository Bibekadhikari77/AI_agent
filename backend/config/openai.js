const OpenAI = require('openai');
const logger = require('../utils/logger');

let openaiClient = null;

const getOpenAIClient = () => {
  if (!openaiClient) {
    if (!process.env.OPENAI_API_KEY) {
      logger.warn('⚠️  OPENAI_API_KEY not set — AI features will be limited');
      return null;
    }
    openaiClient = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    logger.info('✅ OpenAI client initialized');
  }
  return openaiClient;
};

module.exports = { getOpenAIClient };
