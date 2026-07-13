import { Request, Response } from 'express';
import { debugManager } from '../core/managers/DebugManager';

export const getLatestDebugRun = (req: Request, res: Response) => {
  const latestRun = debugManager.getLatestRun();
  
  if (!latestRun) {
    return res.status(404).json({
      success: false,
      message: 'No debug runs found. Please process a video first.'
    });
  }

  // If DEBUG_AI is not strictly true, we might not want to expose sensitive paths/data, 
  // but since it's an explicit debug endpoint as requested, we return the data.
  return res.status(200).json({
    success: true,
    data: latestRun
  });
};
