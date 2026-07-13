import { IProvider } from '../../core/interfaces/IProvider';
import { PipelineContext, SongResult, ProviderStatus } from '../../core/types';
import { logger } from '../../utils/logger';

export class MockMusicProvider implements IProvider<SongResult> {
  name = 'MockMusicProvider';
  private _status: ProviderStatus = 'SUCCESS';

  async initialize(): Promise<void> {}

  async analyze(context: PipelineContext): Promise<SongResult> {
    const startTime = Date.now();
    logger.info(`[${this.name}] Starting analysis`);

    const duration = Date.now() - startTime;
    logger.info(`[${this.name}] Finished analysis in ${duration}ms with status: NOT_SUPPORTED`);
    
    return { 
      status: 'NOT_SUPPORTED',
      provider: this.name,
      processingTime: duration,
      reason: 'Gemini does not reliably perform fingerprint-based music recognition. A dedicated provider is required.'
    };
  }

  async cleanup(): Promise<void> {}

  async healthCheck(): Promise<boolean> {
    return true;
  }

  status(): ProviderStatus {
    return this._status;
  }

  timeout(): number {
    return 5000;
  }
}
