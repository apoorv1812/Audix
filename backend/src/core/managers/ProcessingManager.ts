import { logger } from '../../utils/logger';

interface ActiveJob {
  hash: string;
  promise: Promise<any>;
}

export class ProcessingManager {
  private activeJobs: Map<string, ActiveJob> = new Map();
  private readonly MAX_CONCURRENT_JOBS = 5;

  async executeJob<T>(hash: string, jobFn: () => Promise<T>): Promise<T> {
    // 1. Prevent duplicate processing
    if (this.activeJobs.has(hash)) {
      logger.info(`[Queue] Joining existing job for hash: ${hash}`);
      return this.activeJobs.get(hash)!.promise;
    }

    // 2. Concurrency limit
    if (this.activeJobs.size >= this.MAX_CONCURRENT_JOBS) {
      logger.warn(`[Queue] Max concurrency reached (${this.MAX_CONCURRENT_JOBS}). Rejecting new job.`);
      throw new Error('Server is currently at maximum capacity. Please try again later.');
    }

    // 3. Track and execute
    logger.info(`[Queue] Starting new job for hash: ${hash}. Active jobs: ${this.activeJobs.size + 1}`);
    
    const promise = jobFn().finally(() => {
      this.activeJobs.delete(hash);
      logger.info(`[Queue] Finished job for hash: ${hash}. Active jobs: ${this.activeJobs.size}`);
    });

    this.activeJobs.set(hash, { hash, promise });

    return promise;
  }

  getMetrics() {
    return {
      activeJobs: this.activeJobs.size,
      maxConcurrency: this.MAX_CONCURRENT_JOBS
    };
  }
}

export const processingManager = new ProcessingManager();
