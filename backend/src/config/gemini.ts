import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from './env';
import { logger } from '../utils/logger';

class GeminiConfig {
  private genAIInstance: GoogleGenerativeAI | null = null;
  // Use the latest stable model supported by the SDK
  private readonly defaultModel = 'gemini-1.5-flash';

  private getInstance(): GoogleGenerativeAI | null {
    if (!config.providers.gemini) {
      logger.warn('Gemini API key is not configured.');
      return null;
    }
    if (!this.genAIInstance) {
      this.genAIInstance = new GoogleGenerativeAI(config.providers.gemini);
      logger.info('Initialized global Gemini client');
    }
    return this.genAIInstance;
  }

  private getModelWithConfig(modelName: string) {
    const instance = this.getInstance();
    if (!instance) return null;
    return instance.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json'
      }
    });
  }

  getVisionModel() {
    return this.getModelWithConfig(this.defaultModel);
  }

  getTextModel() {
    return this.getModelWithConfig(this.defaultModel);
  }

  getOCRModel() {
    return this.getModelWithConfig(this.defaultModel);
  }
}

export const geminiConfig = new GeminiConfig();
// Provide a backward-compatible getGeminiModel for any unmigrated usages (if needed)
export const getGeminiModel = () => geminiConfig.getTextModel();
