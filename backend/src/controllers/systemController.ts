import { Request, Response } from 'express';
import { providerManager } from '../core/managers/ProviderManager';
import { processingManager } from '../core/managers/ProcessingManager';
import { geminiConfig } from '../config/gemini';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import path from 'path';

const execPromise = util.promisify(exec);
const VERSION = '1.0.0-enterprise';

export const getHealth = async (req: Request, res: Response) => {
  const healthDetails: any = {
    ffmpeg: 'UNCHECKED',
    gemini: 'UNCHECKED',
    tempDir: 'UNCHECKED',
    envVars: 'UNCHECKED',
    providers: 'UNCHECKED'
  };

  try {
    // 1. FFmpeg
    try {
      await execPromise('ffmpeg -version');
      healthDetails.ffmpeg = 'OK';
    } catch {
      healthDetails.ffmpeg = 'FAILED';
    }

    // 2. Gemini API
    try {
      const model = geminiConfig.getTextModel();
      if (!model) throw new Error('Not Configured');
      // Light check
      healthDetails.gemini = 'CONFIGURED';
    } catch {
      healthDetails.gemini = 'FAILED';
    }

    // 3. Temp Directory
    try {
      const tempPath = path.join(process.cwd(), 'temp');
      await fs.mkdir(tempPath, { recursive: true });
      await fs.access(tempPath, fs.constants.W_OK);
      healthDetails.tempDir = 'OK';
    } catch {
      healthDetails.tempDir = 'FAILED';
    }

    // 4. Environment Variables
    healthDetails.envVars = process.env.GEMINI_API_KEY ? 'OK' : 'MISSING_KEYS';

    // 5. Providers
    const providerStatuses = providerManager.getHealthStatuses();
    healthDetails.providers = providerStatuses.every(p => p.status !== 'NOT_CONFIGURED') ? 'OK' : 'SOME_UNCONFIGURED';

    const isHealthy = healthDetails.ffmpeg === 'OK' && healthDetails.tempDir === 'OK';

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'UP' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      details: healthDetails,
      providersHealthy: healthDetails.providers === 'OK'
    });
  } catch (err: any) {
    res.status(500).json({
      status: 'DOWN',
      timestamp: new Date().toISOString(),
      error: err.message
    });
  }
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
