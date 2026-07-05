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

  async processVideo(videoPath: string, uploadTimeMs: number = 0): Promise<AnalysisResult> {
    const pipelineStartTime = performance.now();
    const tempDir = path.join(process.cwd(), 'temp', path.basename(videoPath, path.extname(videoPath)));
    
    await fs.promises.mkdir(tempDir, { recursive: true });

    const result: AnalysisResult = {
      song: null,
      movie: null,
      transcript: null,
      summary: null,
      technicalDetails: {
        processingTimeMs: 0,
        extractedFrames: 0,
        audioDurationSeconds: 0,
        apiProvidersUsed: [],
        pipelineTimes: {
          Upload: uploadTimeMs
        }
      }
    };

    const times = result.technicalDetails.pipelineTimes!;

    try {
      logger.info(`Starting pipeline for ${videoPath}`);
      
      // Step 1: Extract Audio and Frames (single FFmpeg execution)
      const ffmpegStart = performance.now();
      const { audioPath, framePaths } = await this.ffmpegService.processMedia(videoPath, tempDir);
      times.FFmpeg = Math.round(performance.now() - ffmpegStart);
      result.technicalDetails.extractedFrames = framePaths.length;

      // Step 2: Speech, Movie, and Song recognition (in parallel with strict 15s timeout)
      const recognitionStart = performance.now();
      const timeoutFallback = { status: 'TIMEOUT' as any };

      const [speech, movie, song] = await Promise.all([
        this.withTimeout(this.safeExecute(() => this.speechProvider.transcribe(audioPath, framePaths), 'SpeechRecognitionProvider', result), 15000, timeoutFallback),
        this.withTimeout(this.safeExecute(() => this.movieProvider.recognize(audioPath, framePaths), 'MovieRecognitionProvider', result), 15000, timeoutFallback),
        this.withTimeout(this.safeExecute(() => this.songProvider.recognize(audioPath, framePaths), 'SongRecognitionProvider', result), 15000, timeoutFallback)
      ]);

      const recognitionTime = Math.round(performance.now() - recognitionStart);
      times.Speech = recognitionTime; // They run in parallel via CombinedService
      times.Movie = recognitionTime;
      times.Music = recognitionTime;

      result.transcript = speech as any;
      result.movie = movie as any;
      result.song = song as any;

      // Step 3: Fetch Movie Metadata
      const metadataStart = performance.now();
      if (result.movie && result.movie.status === 'SUCCESS' && result.movie.title && result.movie.type) {
        const metadata = await this.withTimeout(
          this.safeExecute(() => this.movieMetadataProvider.fetchMetadata(result.movie!.title!, result.movie!.type!), 'MovieMetadataProvider', result),
          15000,
          timeoutFallback
        );
        if (metadata && metadata.status !== 'TIMEOUT') {
          result.movie.metadata = metadata;
        }
      }
      times.Metadata = Math.round(performance.now() - metadataStart);

      // Step 4: Generate Summary
      const summaryStart = performance.now();
      const summary = await this.withTimeout(
        this.safeExecute(() => this.summaryProvider.generateSummary(result.song, result.movie, result.transcript), 'SummaryProvider', result),
        15000,
        timeoutFallback
      );
      times.Summary = Math.round(performance.now() - summaryStart);
      result.summary = summary as any;

    } catch (error) {
      logger.error('Pipeline processing failed', error);
      throw error;
    } finally {
      // Async Cleanup
      this.cleanup(tempDir);
    }

    const totalTimeMs = Math.round(performance.now() - pipelineStartTime + uploadTimeMs);
    result.technicalDetails.processingTimeMs = totalTimeMs;
    times.Total = totalTimeMs;

    logger.info(`Pipeline completed in ${totalTimeMs}ms`);
    return result;
  }

  private async safeExecute<T>(fn: () => Promise<T>, providerName: string, result: AnalysisResult): Promise<T | null> {
    try {
      const res = await fn();
      if (!result.technicalDetails.apiProvidersUsed.includes(providerName)) {
        result.technicalDetails.apiProvidersUsed.push(providerName);
      }
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
