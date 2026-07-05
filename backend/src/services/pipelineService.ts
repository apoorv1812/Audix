import { FFmpegService } from './ffmpegService';
import { SongRecognitionProvider } from '../providers/SongRecognitionProvider';
import { MovieRecognitionProvider } from '../providers/MovieRecognitionProvider';
import { MovieMetadataProvider } from '../providers/MovieMetadataProvider';
import { SpeechRecognitionProvider } from '../providers/SpeechRecognitionProvider';
import { SummaryProvider } from '../providers/SummaryProvider';
import { AnalysisResult } from '../types';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class PipelineService {
  private ffmpegService = new FFmpegService();
  private songProvider = new SongRecognitionProvider();
  private movieProvider = new MovieRecognitionProvider();
  private movieMetadataProvider = new MovieMetadataProvider();
  private speechProvider = new SpeechRecognitionProvider();
  private summaryProvider = new SummaryProvider();

  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise<T>((resolve) => {
      timeoutHandle = setTimeout(() => resolve(fallback), timeoutMs);
    });

    return Promise.race([
      promise.then(result => {
        clearTimeout(timeoutHandle);
        return result;
      }),
      timeoutPromise
    ]);
  }

  async processVideo(videoPath: string): Promise<AnalysisResult> {
    const tempDir = path.join(process.cwd(), 'temp', path.basename(videoPath, path.extname(videoPath)));
    
    await fs.promises.mkdir(tempDir, { recursive: true });

    const result: AnalysisResult = {
      song: null,
      movie: null,
      transcript: null,
      summary: null
    };

    try {
      logger.info(`Starting pipeline for ${videoPath}`);
      
      // Step 1: Extract Audio and Frames (single FFmpeg execution)
      const { audioPath, framePaths } = await this.ffmpegService.processMedia(videoPath, tempDir);

      // Step 2: Speech, Movie, and Song recognition (in parallel with strict 15s timeout)
      const timeoutFallback = { status: 'TIMEOUT' as any };

      const [speech, movie, song] = await Promise.all([
        this.withTimeout(this.safeExecute(() => this.speechProvider.transcribe(audioPath, framePaths), 'SpeechRecognitionProvider'), 15000, timeoutFallback),
        this.withTimeout(this.safeExecute(() => this.movieProvider.recognize(audioPath, framePaths), 'MovieRecognitionProvider'), 15000, timeoutFallback),
        this.withTimeout(this.safeExecute(() => this.songProvider.recognize(audioPath, framePaths), 'SongRecognitionProvider'), 15000, timeoutFallback)
      ]);

      result.transcript = speech as any;
      result.movie = movie as any;
      result.song = song as any;

      // Step 3: Fetch Movie Metadata
      if (result.movie && result.movie.status === 'SUCCESS' && result.movie.title && result.movie.type) {
        const metadata = await this.withTimeout(
          this.safeExecute(() => this.movieMetadataProvider.fetchMetadata(result.movie!.title!, result.movie!.type!), 'MovieMetadataProvider'),
          15000,
          timeoutFallback
        );
        if (metadata && metadata.status !== 'TIMEOUT') {
          result.movie.metadata = metadata;
        }
      }

      // Step 4: Generate Summary
      const summary = await this.withTimeout(
        this.safeExecute(() => this.summaryProvider.generateSummary(result.song, result.movie, result.transcript), 'SummaryProvider'),
        15000,
        timeoutFallback
      );
      result.summary = summary as any;

    } catch (error) {
      logger.error('Pipeline processing failed', error);
      throw error;
    } finally {
      // Async Cleanup
      this.cleanup(tempDir);
    }

    logger.info(`Pipeline completed successfully`);
    return result;
  }

  private async safeExecute<T>(fn: () => Promise<T>, providerName: string): Promise<T | null> {
    try {
      const res = await fn();
      return res;
    } catch (error: any) {
      logger.warn(`Provider ${providerName} failed: ${error.message}`);
      return null;
    }
  }

  private async cleanup(directory: string) {
    try {
      await fs.promises.rm(directory, { recursive: true, force: true });
      logger.info(`Cleaned up temporary directory: ${directory}`);
    } catch (error) {
      logger.error(`Failed to clean up directory ${directory}`, error);
    }
  }
}
