import { MovieMetadataResult } from '../types';
import { logger } from '../utils/logger';
import { Cache } from '../utils/cache';

export class TVMazeMetadataProvider {
  private cache = new Cache(24); // 24 hours TTL

  async fetchMetadata(title: string, type: string): Promise<MovieMetadataResult> {
    if (type !== 'TV Show') {
      return {
        status: 'UNSUPPORTED_PROVIDER',
        message: 'Current metadata provider supports TV shows only.'
      };
    }

    const cacheKey = `tvmaze_${title}`;
    const cachedData = await this.cache.get<MovieMetadataResult>(cacheKey);

    if (cachedData) {
      return cachedData;
    }

    const startTime = Date.now();
    logger.info(`Sending TVMaze request for ${title}`);

    try {
      const query = encodeURIComponent(title);
      const url = `https://api.tvmaze.com/singlesearch/shows?q=${query}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 404) {
          logger.warn(`TVMaze returned 404 for ${title}`);
          return { status: 'UNIDENTIFIED' };
        }
        logger.error(`TVMaze API error: ${response.status} ${response.statusText}`);
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
        synopsis: data.summary ? data.summary.replace(/<[^>]+>/g, '') : undefined, // Strip HTML
        providerName: 'TVMaze'
      };

      const responseTime = Date.now() - startTime;
      logger.info(`TVMaze response time: ${responseTime}ms`);

      await this.cache.set(cacheKey, result);
      return result;

    } catch (error) {
      logger.error('Failed to fetch from TVMaze', error);
      return { status: 'PROVIDER_UNAVAILABLE' };
    }
  }
}
