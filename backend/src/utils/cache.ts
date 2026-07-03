import fs from 'fs';
import path from 'path';
import { logger } from './logger';

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

export class Cache {
  private cacheDir: string;
  private ttlMs: number;

  constructor(ttlHours: number = 24) {
    this.ttlMs = ttlHours * 60 * 60 * 1000;
    this.cacheDir = path.join(process.cwd(), '.cache');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    const filePath = this.getFilePath(key);
    if (!fs.existsSync(filePath)) {
      logger.info(`Cache miss for key: ${key}`);
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const item: CacheItem<T> = JSON.parse(content);

      if (Date.now() - item.timestamp > this.ttlMs) {
        logger.info(`Cache expired for key: ${key}`);
        fs.unlinkSync(filePath);
        return null;
      }

      logger.info(`Cache hit for key: ${key}`);
      return item.data;
    } catch (error) {
      logger.error(`Error reading cache for key: ${key}`, error);
      return null;
    }
  }

  async set<T>(key: string, data: T): Promise<void> {
    const filePath = this.getFilePath(key);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now()
    };
    try {
      fs.writeFileSync(filePath, JSON.stringify(item), 'utf-8');
    } catch (error) {
      logger.error(`Error writing cache for key: ${key}`, error);
    }
  }
}
