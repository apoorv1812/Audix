import { MovieMetadataResult } from '../types';
import { logger } from '../utils/logger';
import { TVMazeMetadataProvider } from './TVMazeMetadataProvider';

export class MovieMetadataProvider {
  private tvmazeProvider = new TVMazeMetadataProvider();
  
  async fetchMetadata(title: string, type: string): Promise<MovieMetadataResult> {
    logger.info(`Delegating metadata fetch for ${title} (${type})`);
    
    // In a full implementation, we might check config to decide which provider to use.
    // For now, we route directly to TVMaze as our configured active provider.
    return await this.tvmazeProvider.fetchMetadata(title, type);
  }
}

