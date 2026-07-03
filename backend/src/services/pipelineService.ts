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

  async processVideo(videoPath: string): Promise<AnalysisResult> {
    const startTime = Date.now();
    const tempDir = path.join(process.cwd(), 'temp', path.basename(videoPath, path.extname(videoPath)));
    
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const result: AnalysisResult = {
      song: null,
      movie: null,
      transcript: null,
      summary: null,
      technicalDetails: {
        processingTimeMs: 0,
        extractedFrames: 0,
        audioDurationSeconds: 0,
        apiProvidersUsed: []
      }
    };

    try {
      logger.info(`Starting pipeline for ${videoPath}`);
      
      // Step 1: Extract Audio and Frames (in parallel)
      const [audioPath, framePaths] = await Promise.all([
        this.ffmpegService.extractAudio(videoPath, tempDir),
        this.ffmpegService.extractFrames(videoPath, tempDir, 5)
      ]);

      result.technicalDetails.extractedFrames = framePaths.length;

      // Step 2: Speech and Song recognition (parallel)
      const [song, transcript] = await Promise.all([
        this.safeExecute(() => this.songProvider.recognize(audioPath), 'SongRecognitionProvider', result),
        this.safeExecute(() => this.speechProvider.transcribe(audioPath), 'SpeechRecognitionProvider', result)
      ]);

      result.song = song;
      result.transcript = transcript;

      // Step 3: Movie recognition (requires transcript if available)
      const transcriptText = transcript?.status === 'SUCCESS' ? transcript.dialogue : undefined;
      const movie = await this.safeExecute(
        () => this.movieProvider.recognize(framePaths, transcriptText), 
        'MovieRecognitionProvider', 
        result
      );
      
      // Step 3.5: Fetch Movie Metadata
      if (movie && movie.status === 'SUCCESS' && movie.title && movie.type) {
        const metadata = await this.safeExecute(
          () => this.movieMetadataProvider.fetchMetadata(movie.title!, movie.type!),
          'MovieMetadataProvider',
          result
        );
        if (metadata) {
          movie.metadata = metadata;
        }
      }

      result.movie = movie;

      // Step 4: Generate Summary
      const summary = await this.safeExecute(
        () => this.summaryProvider.generateSummary(result.song, result.movie, result.transcript),
        'SummaryProvider',
        result
      );
      
      result.summary = summary;

      // Cleanup
      this.cleanup(tempDir);

    } catch (error) {
      logger.error('Pipeline processing failed', error);
      this.cleanup(tempDir);
      throw error;
    }

    result.technicalDetails.processingTimeMs = Date.now() - startTime;
    return result;
  }

  private async safeExecute<T>(fn: () => Promise<T>, providerName: string, result: AnalysisResult): Promise<T | null> {
    try {
      const res = await fn();
      result.technicalDetails.apiProvidersUsed.push(providerName);
      return res;
    } catch (error: any) {
      logger.warn(`Provider ${providerName} failed: ${error.message}`);
      return null; // Return null if the provider throws an unhandled error. Providers should preferably return an ERROR status object.
    }
  }

  private cleanup(directory: string) {
    try {
      if (fs.existsSync(directory)) {
        fs.rmSync(directory, { recursive: true, force: true });
        logger.info(`Cleaned up temporary directory: ${directory}`);
      }
    } catch (error) {
      logger.error(`Failed to clean up directory ${directory}`, error);
    }
  }
}
