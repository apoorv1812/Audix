import { IProvider } from '../interfaces/IProvider';
import { PipelineContext, AnalysisResult } from '../types';
import { logger } from '../../utils/logger';

// Providers
import { GeminiMovieProvider } from '../../providers/Movie/GeminiMovieProvider';
import { GeminiSpeechProvider } from '../../providers/Speech/GeminiSpeechProvider';
import { GeminiOCRProvider } from '../../providers/OCR/GeminiOCRProvider';
import { MockMusicProvider } from '../../providers/Music/MockMusicProvider';
import { TVMazeMetadataProvider } from '../../providers/Metadata/TVMazeMetadataProvider';
import { GeminiSummaryProvider } from '../../providers/Summary/GeminiSummaryProvider';

export class ProviderManager {
  private tier1: IProvider<any>[] = [];
  private tier2: IProvider<any>[] = [];
  private tier3: IProvider<any>[] = [];

  constructor() {
    this.registerProviders();
  }

  private registerProviders() {
    // Tier 1 (Parallel)
    this.tier1.push(new GeminiMovieProvider());
    this.tier1.push(new GeminiSpeechProvider());
    this.tier1.push(new GeminiOCRProvider());
    this.tier1.push(new MockMusicProvider());

    // Tier 2 (Depends on Tier 1)
    this.tier2.push(new TVMazeMetadataProvider());

    // Tier 3 (Depends on Tier 1 & 2)
    this.tier3.push(new GeminiSummaryProvider());
  }

  async initializeAll(): Promise<void> {
    const allProviders = [...this.tier1, ...this.tier2, ...this.tier3];
    await Promise.all(allProviders.map(p => p.initialize()));
    logger.info(`Initialized ${allProviders.length} providers`);
  }

  private async executeWithTimeout<T>(provider: IProvider<T>, context: PipelineContext): Promise<T> {
    let timeoutHandle: NodeJS.Timeout;
    
    const timeoutPromise = new Promise<T>((resolve) => {
      timeoutHandle = setTimeout(() => {
        logger.warn(`[${provider.name}] Execution timed out after ${provider.timeout()}ms`);
        resolve({ status: 'TIMEOUT' } as any as T);
      }, provider.timeout());
    });

    try {
      const result = await Promise.race([
        provider.analyze(context),
        timeoutPromise
      ]);
      clearTimeout(timeoutHandle!);
      return result;
    } catch (error) {
      clearTimeout(timeoutHandle!);
      logger.error(`[${provider.name}] Unexpected error`, error);
      return { status: 'ERROR' } as any as T;
    }
  }

  async runPipeline(context: PipelineContext): Promise<AnalysisResult> {
    logger.info('--- Starting Tier 1 (Parallel) ---');
    
    const [movie, speech, ocr, music] = await Promise.all([
      this.executeWithTimeout(this.tier1[0], context), // Movie
      this.executeWithTimeout(this.tier1[1], context), // Speech
      this.executeWithTimeout(this.tier1[2], context), // OCR
      this.executeWithTimeout(this.tier1[3], context)  // Music
    ]);

    context.state.movie = movie as any;
    context.state.speech = speech as any;
    context.state.ocr = ocr as any;
    context.state.music = music as any;

    logger.info('--- Starting Tier 2 (Metadata) ---');
    const metadataProvider = this.tier2[0];
    const movieMetadata = await this.executeWithTimeout(metadataProvider, context);
    context.state.movieMetadata = movieMetadata as any;
    
    if (context.state.movie) {
      context.state.movie.metadata = movieMetadata as any;
    }

    logger.info('--- Starting Tier 3 (Summary) ---');
    const summaryProvider = this.tier3[0];
    const summary = await this.executeWithTimeout(summaryProvider, context);

    logger.info('--- Pipeline Execution Complete ---');

    return {
      movie: context.state.movie || null,
      speech: context.state.speech || null,
      ocr: context.state.ocr || null,
      song: context.state.music || null,
      summary: summary as any || null
    };
  }

  getHealthStatuses() {
    const allProviders = [...this.tier1, ...this.tier2, ...this.tier3];
    return allProviders.map(p => ({
      name: p.name,
      status: p.status()
    }));
  }
}

export const providerManager = new ProviderManager();
