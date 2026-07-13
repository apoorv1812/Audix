import { IProvider } from '../../core/interfaces/IProvider';
import { PipelineContext, MovieMetadataResult, ProviderStatus } from '../../core/types';
import { logger } from '../../utils/logger';

export class TVMazeMetadataProvider implements IProvider<MovieMetadataResult> {
  name = 'TVMazeMetadataProvider';
  private _status: ProviderStatus = 'SUCCESS';

  async initialize(): Promise<void> {}

  async analyze(context: PipelineContext): Promise<MovieMetadataResult> {
    const startTime = Date.now();
    logger.info(`[${this.name}] Starting analysis`);

    if (!context.state.movie || context.state.movie.status !== 'SUCCESS' || !context.state.movie.title) {
      return { status: 'UNIDENTIFIED', message: 'No valid movie title provided' };
    }

    const title = context.state.movie.title;
    const type = context.state.movie.type;

    if (type !== 'TV Show') {
      return {
        status: 'UNSUPPORTED_PROVIDER',
        message: 'Current metadata provider supports TV shows only.'
      };
    }

    try {
      const query = encodeURIComponent(title);
      const url = `https://api.tvmaze.com/singlesearch/shows?q=${query}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`[${this.name}] TVMaze returned 404 for ${title}`);
          return { status: 'UNIDENTIFIED' };
        }
        logger.error(`[${this.name}] API error: ${response.status} ${response.statusText}`);
        return { status: 'PROVIDER_UNAVAILABLE' };
      }

      const data = await response.json();
      
      const result: MovieMetadataResult = {
        status: 'SUCCESS',
        imdbRating: data.rating?.average?.toString(),
        genre: data.genres?.join(', '),
        runtime: data.runtime?.toString() ? `${data.runtime}m` : undefined,
        releaseYear: data.premiered ? data.premiered.substring(0, 4) : undefined,
        poster: data.image?.original || data.image?.medium,
        network: data.network?.name || data.webChannel?.name,
        officialUrl: data.officialSite,
        providerName: 'TVMaze'
      };

      const duration = Date.now() - startTime;
      logger.info(`[${this.name}] Finished analysis in ${duration}ms with status: ${result.status}`);
      
      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`[${this.name}] Error after ${duration}ms`, error);
      return { status: 'PROVIDER_UNAVAILABLE', message: error.message };
    }
  }

  async cleanup(): Promise<void> {}

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch('https://api.tvmaze.com/search/shows?q=test');
      return res.ok;
    } catch {
      return false;
    }
  }

  status(): ProviderStatus {
    return this._status;
  }

  timeout(): number {
    return 10000; // 10 seconds for TVMaze is enough
  }
}
