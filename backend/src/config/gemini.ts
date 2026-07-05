import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './env';
import { logger } from '../utils/logger';

// Instantiate once to reuse connections
let genAIInstance: GoogleGenerativeAI | null = null;
let modelInstance: any = null;

export const getGeminiModel = () => {
  if (!config.providers.gemini) {
    logger.warn('Gemini API key is not configured.');
    return null;
  }
  
  if (!genAIInstance) {
    genAIInstance = new GoogleGenerativeAI(config.providers.gemini);
    modelInstance = genAIInstance.getGenerativeModel({ model: 'gemini-3.5-flash' });
    logger.info('Initialized global Gemini client');
  }
  
  return modelInstance;
};
