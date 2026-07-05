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
  private initPromise: Promise<void> | null = null;

  constructor(ttlHours: number = 24) {
    this.ttlMs = ttlHours * 60 * 60 * 1000;
    this.cacheDir = path.join(process.cwd(), '.cache');
  }

  private async ensureDir() {
    if (this.initPromise) return this.initPromise;
    this.initPromise = fs.promises.mkdir(this.cacheDir, { recursive: true }).then(() => {});
    return this.initPromise;
  }

  private getFilePath(key: string): string {
    const safeKey = key.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    return path.join(this.cacheDir, `${safeKey}.json`);
  }

  async get<T>(key: string): Promise<T | null> {
    await this.ensureDir();
    const filePath = this.getFilePath(key);
    
    try {
      await fs.promises.access(filePath);
    } catch {
      logger.info(`Cache miss for key: ${key}`);
      return null;
    }

    try {
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const item: CacheItem<T> = JSON.parse(content);

      if (Date.now() - item.timestamp > this.ttlMs) {
        logger.info(`Cache expired for key: ${key}`);
        await fs.promises.rm(filePath, { force: true });
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
    await this.ensureDir();
    const filePath = this.getFilePath(key);
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now()
    };
    try {
      await fs.promises.writeFile(filePath, JSON.stringify(item), 'utf-8');
    } catch (error) {
      logger.error(`Error writing cache for key: ${key}`, error);
    }
  }
}
