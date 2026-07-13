import { Request, Response } from 'express';
import { PipelineService } from '../services/pipelineService';
import { logger } from '../utils/logger';
import crypto from 'crypto';
import fs from 'fs';
import { processingManager } from '../core/managers/ProcessingManager';
import { analysisRepository, AnalysisRecord } from '../core/repositories/AnalysisRepository';

const pipelineService = new PipelineService();

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
  const startTime = Date.now();
  
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    const videoPath = req.file.path;
    logger.info(`Received video for analysis: ${req.file.originalname}`);

    const fileHash = await hashFile(videoPath);
    logger.info(`Video hash: ${fileHash}`);

    const cachedRecord = await analysisRepository.findByHash(fileHash);

    if (cachedRecord) {
      logger.info(`Cache hit for video: ${req.file.originalname}`);
      
      // Async cleanup
      try { await fs.promises.unlink(videoPath); } catch (err) {}

      return res.status(200).json({
        success: true,
        message: 'Video analyzed successfully (from cache).',
        data: cachedRecord.result
      });
    }

    // Execute via ProcessingManager to prevent duplicate work and limit concurrency
    const result = await processingManager.executeJob(fileHash, async () => {
      return await pipelineService.processVideo(videoPath);
    });

    const processingDurationMs = Date.now() - startTime;

    // Save to repository
    const record: AnalysisRecord = {
      hash: fileHash,
      result,
      createdAt: new Date(),
      processingDurationMs
    };
    await analysisRepository.save(record);

    // Async cleanup
    try { await fs.promises.unlink(videoPath); } catch (err) {}

    return res.status(200).json({
      success: true,
      message: 'Video analyzed successfully.',
      data: result,
      meta: {
        processingDurationMs
      }
    });

  } catch (error: any) {
    logger.error('Error in analyzeController', error);
    
    // Async cleanup if failed
    if (req.file) {
      try { await fs.promises.unlink(req.file.path); } catch (e) {}
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during processing.'
    });
  }
};
