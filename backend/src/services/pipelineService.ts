import { FFmpegService } from './ffmpegService';
import { providerManager } from '../core/managers/ProviderManager';
import { AnalysisResult, PipelineContext } from '../core/types';
import { logger } from '../utils/logger';
import fs from 'fs/promises';
import path from 'path';

export class PipelineService {
  private ffmpegService = new FFmpegService();

  constructor() {
    // Initialize providers on startup asynchronously
    providerManager.initializeAll().catch(err => {
      logger.error('Failed to initialize providers', err);
    });
  }

  async processVideo(videoPath: string): Promise<AnalysisResult> {
    const tempDir = path.join(process.cwd(), 'temp', path.basename(videoPath, path.extname(videoPath)));
    await fs.mkdir(tempDir, { recursive: true });

    try {
      logger.info(`Starting pipeline for ${videoPath}`);
      
      // Step 1: Extract Audio and Frames (single FFmpeg execution)
      const { audioPath, framePaths, metadata } = await this.ffmpegService.processMedia(videoPath, tempDir);

      // Step 2: Orchestrate AI Providers
      const context: PipelineContext = {
        videoPath,
        audioPath,
        framePaths,
        metadata,
        state: {}
      };

      const result = await providerManager.runPipeline(context);
      
      return result;

    } catch (error) {
      logger.error('Pipeline processing failed', error);
      throw error;
    } finally {
      // Async Cleanup
      this.cleanup(tempDir);
    }
  }

  private async cleanup(directory: string) {
    try {
      await fs.rm(directory, { recursive: true, force: true });
      logger.info(`Cleaned up temporary directory: ${directory}`);
    } catch (error) {
      logger.error(`Failed to clean up directory ${directory}`, error);
    }
  }
}
