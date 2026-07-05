import { SongResult } from '../types';
import { combinedRecognitionService } from '../services/CombinedRecognitionService';
import { logger } from '../utils/logger';

export class SongRecognitionProvider {
  async recognize(audioFilePath: string, framePaths: string[]): Promise<SongResult> {
    try {
      const combined = await combinedRecognitionService.recognize(audioFilePath, framePaths);
      return combined.song;
    } catch (error: any) {
      logger.error('Error in SongRecognitionProvider', error);
      return { status: 'ERROR', message: error.message };
    }
  }
}
