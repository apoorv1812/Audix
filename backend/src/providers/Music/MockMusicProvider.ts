import { IProvider } from '../../core/interfaces/IProvider';
import { PipelineContext, SongResult, ProviderStatus } from '../../core/types';
import { logger } from '../../utils/logger';

export class MockMusicProvider implements IProvider<SongResult> {
  name = 'MockMusicProvider';
  private _status: ProviderStatus = 'PENDING';
  private apiKey: string | undefined;

  async initialize(): Promise<void> {
    this.apiKey = process.env.SONG_PROVIDER_API_KEY;
    if (!this.apiKey) {
      this._status = 'NOT_CONFIGURED';
    } else {
      this._status = 'SUCCESS';
    }
  }

  async analyze(context: PipelineContext): Promise<SongResult> {
    const startTime = Date.now();
    logger.info(`[${this.name}] Starting analysis`);

    if (this._status === 'NOT_CONFIGURED') {
      logger.warn(`[${this.name}] Provider not configured. Missing SONG_PROVIDER_API_KEY.`);
      return { status: 'NOT_CONFIGURED', message: 'API key not found' };
    }

    try {
      // Since the user asked us to NOT generate fake music results
      // and only use the interface, we will return UNIDENTIFIED for the mock if we reach here
      // Real implementation would make an HTTP call to AudD or ACRCloud
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const duration = Date.now() - startTime;
      logger.info(`[${this.name}] Finished analysis in ${duration}ms with status: UNIDENTIFIED`);
      
      return { 
        status: 'UNIDENTIFIED',
        confidence: 0,
        provider: this.name 
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`[${this.name}] Error after ${duration}ms`, error);
      return { status: 'ERROR', message: error.message };
    }
  }

  async cleanup(): Promise<void> {}

  async healthCheck(): Promise<boolean> {
    return this._status !== 'NOT_CONFIGURED';
  }

  status(): ProviderStatus {
    return this._status;
  }

  timeout(): number {
    return 30000;
  }
}
