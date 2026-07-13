import { FFmpegService } from './ffmpegService';
import { providerManager } from '../core/managers/ProviderManager';
import { AnalysisResult, PipelineContext } from '../core/types';
import { debugManager, DebugRun } from '../core/managers/DebugManager';
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

  async processVideo(videoPath: string): Promise<{ result: AnalysisResult, pipelineTimes: any }> {
    const pipelineStartTime = Date.now();
    const tempDir = path.join(process.cwd(), 'temp', path.basename(videoPath, path.extname(videoPath)));
    await fs.mkdir(tempDir, { recursive: true });

    let errors: any[] = [];
    const pipelineTimes: any = {
      upload: 0, // Recorded by controller
      ffmpeg: 0,
      movie: 0,
      speech: 0,
      ocr: 0,
      music: 0,
      metadata: 0,
      summary: 0,
      totalPipeline: 0
    };

    let audioPath = '';
    let framePaths: string[] = [];
    let metadata: any = {};
    let finalResult: AnalysisResult | null = null;

    try {
      logger.info(`Starting pipeline for ${videoPath}`);
      
      // Step 1: Extract Audio and Frames (single FFmpeg execution)
      const extractRes = await this.ffmpegService.processMedia(videoPath, tempDir);
      audioPath = extractRes.audioPath;
      framePaths = extractRes.framePaths;
      metadata = extractRes.metadata;
      pipelineTimes.ffmpeg = metadata.processingTimeMs || 0;

      // Step 2: Orchestrate AI Providers
      const context: PipelineContext = {
        videoPath,
        audioPath,
        framePaths,
        metadata,
        state: {}
      };

      finalResult = await providerManager.runPipeline(context);
      
      pipelineTimes.movie = finalResult.movie?.processingTime || 0;
      pipelineTimes.speech = finalResult.transcript?.processingTime || 0;
      pipelineTimes.ocr = finalResult.ocr?.processingTime || 0;
      pipelineTimes.music = finalResult.song?.processingTime || 0;
      pipelineTimes.metadata = finalResult.movie?.metadata?.processingTime || 0;
      pipelineTimes.summary = finalResult.summary?.processingTime || 0;

    } catch (error: any) {
      errors.push({ cause: 'Pipeline Execution', exception: error.message || String(error) });
      logger.error('Pipeline processing failed', error);
      throw error;
    } finally {
      pipelineTimes.totalPipeline = Date.now() - pipelineStartTime;

      if (process.env.DEBUG_AI === 'true') {
        const debugRun: DebugRun = {
          timestamp: new Date(),
          uploadedFilename: path.basename(videoPath),
          videoMetadata: metadata,
          extractedAudioPath: audioPath,
          extractedFramePaths: framePaths,
          providerOutputs: finalResult || {},
          pipelineTimings: pipelineTimes,
          temporaryDirectory: tempDir,
          cacheHit: false,
          errors
        };
        debugManager.setLatestRun(debugRun);
        logger.info(`[DEBUG_AI=true] Preserved temp directory ${tempDir} and saved debug run.`);
      } else {
        // Async Cleanup only if not debugging
        this.cleanup(tempDir);
      }
    }

    return { result: finalResult!, pipelineTimes };
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
