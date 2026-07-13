import { Request, Response } from 'express';
import { providerManager } from '../core/managers/ProviderManager';
import { processingManager } from '../core/managers/ProcessingManager';

// We can read version from package.json in a real app
const VERSION = '1.0.0-enterprise';

export const getHealth = async (req: Request, res: Response) => {
  // Simple health check for enterprise requirements
  // In a real app we'd probe FFMPEG, Gemini API, TVMaze, etc.
  const providerStatuses = providerManager.getHealthStatuses();
  
  const allConfigured = providerStatuses.every(p => p.status !== 'NOT_CONFIGURED');
  
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    providersHealthy: allConfigured
  });
};

export const getStatus = async (req: Request, res: Response) => {
  res.status(200).json({
    queue: processingManager.getMetrics(),
    providers: providerManager.getHealthStatuses()
  });
};

export const getVersion = async (req: Request, res: Response) => {
  res.status(200).json({
    version: VERSION
  });
};
