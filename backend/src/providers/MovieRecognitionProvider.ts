import { MovieResult } from '../types';
import { combinedRecognitionService } from '../services/CombinedRecognitionService';
import { logger } from '../utils/logger';

export class MovieRecognitionProvider {
  async recognize(audioFilePath: string, framePaths: string[]): Promise<MovieResult> {
    try {
      const combined = await combinedRecognitionService.recognize(audioFilePath, framePaths);
      return combined.movie;
    } catch (error: any) {
      logger.error('Error in MovieRecognitionProvider', error);
      return { status: 'ERROR', message: error.message };
    }
  }
}
