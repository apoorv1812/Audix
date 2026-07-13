import { AnalysisResult } from '../types';

export interface AnalysisRecord {
  hash: string;
  result: AnalysisResult;
  createdAt: Date;
  processingDurationMs: number;
}

export class AnalysisRepository {
  // In-memory store (prepares for future PostgreSQL migration)
  private store: Map<string, AnalysisRecord> = new Map();
  private readonly TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

  async save(record: AnalysisRecord): Promise<void> {
    this.store.set(record.hash, record);
    
    // Simple TTL mechanism
    setTimeout(() => {
      this.store.delete(record.hash);
    }, this.TTL_MS);
  }

  async findByHash(hash: string): Promise<AnalysisRecord | null> {
    const record = this.store.get(hash);
    if (!record) return null;

    // Check TTL manually just in case timeout hasn't fired
    if (Date.now() - record.createdAt.getTime() > this.TTL_MS) {
      this.store.delete(hash);
      return null;
    }

    return record;
  }
}

export const analysisRepository = new AnalysisRepository();
