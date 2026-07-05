import { Request, Response } from 'express';
import { PipelineService } from '../services/pipelineService';
import { logger } from '../utils/logger';
import { Cache } from '../utils/cache';
import crypto from 'crypto';
import fs from 'fs';

const pipelineService = new PipelineService();
const analysisCache = new Cache(24);

const hashFile = async (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('error', err => reject(err));
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end', () => resolve(hash.digest('hex')));
  });
};

export const analyzeVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    const videoPath = req.file.path;
    logger.info(`Received video for analysis: ${req.file.originalname}`);

    // Estimate upload time
    let uploadTimeMs = 0;
    try {
      const stats = await fs.promises.stat(videoPath);
      uploadTimeMs = Math.max(0, Date.now() - stats.birthtimeMs);
    } catch {}

    const fileHash = await hashFile(videoPath);
    logger.info(`Video hash: ${fileHash}`);

    const cachedResult = await analysisCache.get(fileHash);
    let result;

    if (cachedResult) {
      logger.info(`Cache hit for video: ${req.file.originalname}`);
      result = cachedResult;
    } else {
      result = await pipelineService.processVideo(videoPath, uploadTimeMs);
      await analysisCache.set(fileHash, result);
    }

    // Async cleanup
    try {
      await fs.promises.unlink(videoPath);
    } catch (err) {
      logger.warn(`Failed to delete original video: ${videoPath}`);
    }

    return res.status(200).json({
      success: true,
      message: 'Video analyzed successfully.',
      data: result
    });
  } catch (error: any) {
    logger.error('Error in analyzeController', error);
    
    // Async cleanup if failed
    if (req.file) {
      try {
        await fs.promises.unlink(req.file.path);
      } catch (e) {}
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during processing.'
    });
  }
};
