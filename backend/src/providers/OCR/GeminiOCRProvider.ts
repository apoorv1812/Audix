import { IProvider } from '../../core/interfaces/IProvider';
import { PipelineContext, OCRResult, ProviderStatus } from '../../core/types';
import { getGeminiModel } from '../../config/gemini';
import { logger } from '../../utils/logger';
import fs from 'fs/promises';

export class GeminiOCRProvider implements IProvider<OCRResult> {
  name = 'GeminiOCRProvider';
  private _status: ProviderStatus = 'PENDING';

  async initialize(): Promise<void> {
    const model = getGeminiModel();
    if (!model) {
      this._status = 'NOT_CONFIGURED';
    } else {
      this._status = 'SUCCESS';
    }
  }

  async analyze(context: PipelineContext): Promise<OCRResult> {
    const startTime = Date.now();
    logger.info(`[${this.name}] Starting analysis`);

    if (this._status === 'NOT_CONFIGURED') {
      logger.warn(`[${this.name}] Provider not configured`);
      return { status: 'NOT_CONFIGURED' };
    }

    try {
      const model = getGeminiModel();
      if (!model) throw new Error('Model not initialized');

      const imageParts = await Promise.all(
        context.framePaths.map(async (path) => ({
          inlineData: {
            data: await fs.readFile(path, { encoding: 'base64' }),
            mimeType: 'image/jpeg'
          }
        }))
      );

      const prompt = `
You are an Optical Character Recognition (OCR) AI.
Extract all visible text from the provided video frames.
Return ONLY valid JSON matching this schema exactly:
{
  "status": "SUCCESS" | "UNIDENTIFIED",
  "confidence": <number 0-100>,
  "text": "<extracted text or empty string>"
}
If no text is visible, set status to "UNIDENTIFIED".
`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error('Invalid JSON response');
      }

      const parsed = JSON.parse(match[0]) as OCRResult;
      
      const duration = Date.now() - startTime;
      logger.info(`[${this.name}] Finished analysis in ${duration}ms with status: ${parsed.status}`);
      
      return parsed;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`[${this.name}] Error after ${duration}ms`, error);
      return { status: 'ERROR', message: error.message };
    }
  }

  async cleanup(): Promise<void> {}

  async healthCheck(): Promise<boolean> {
    return this._status !== 'NOT_CONFIGURED';
  }

  status(): ProviderStatus {
    return this._status;
  }

  timeout(): number {
    return 30000;
  }
}
