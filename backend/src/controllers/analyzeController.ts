import { Request, Response } from 'express';
import { PipelineService } from '../services/pipelineService';
import { logger } from '../utils/logger';
import fs from 'fs';

const pipelineService = new PipelineService();

export const analyzeVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    const videoPath = req.file.path;
    logger.info(`Received video for analysis: ${req.file.originalname}`);

    const result = await pipelineService.processVideo(videoPath);

    // Clean up the uploaded original video after processing is complete
    if (fs.existsSync(videoPath)) {
      fs.unlinkSync(videoPath);
    }

    return res.status(200).json({
      success: true,
      message: 'Video analyzed successfully.',
      data: result
    });
  } catch (error: any) {
    logger.error('Error in analyzeController', error);
    
    // Clean up if it failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during processing.'
    });
  }
};
