import { TranscriptResult } from '../types';
import { combinedRecognitionService } from '../services/CombinedRecognitionService';
import { logger } from '../utils/logger';

export class SpeechRecognitionProvider {
  async transcribe(audioFilePath: string, framePaths: string[]): Promise<TranscriptResult> {
    try {
      const combined = await combinedRecognitionService.recognize(audioFilePath, framePaths);
      return combined.transcript;
    } catch (error: any) {
      logger.error('Error in SpeechRecognitionProvider', error);
      return { status: 'ERROR', message: error.message };
    }
  }
}
