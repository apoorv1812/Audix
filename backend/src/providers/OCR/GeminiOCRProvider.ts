import { IProvider } from '../../core/interfaces/IProvider';
import { PipelineContext, OCRResult, ProviderStatus } from '../../core/types';
import { geminiConfig } from '../../config/gemini';
import { logger } from '../../utils/logger';
import fs from 'fs/promises';

export class GeminiOCRProvider implements IProvider<OCRResult> {
  name = 'GeminiOCRProvider';
  private _status: ProviderStatus = 'PENDING';

  async initialize(): Promise<void> {
    const model = geminiConfig.getOCRModel();
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
      return { 
        status: 'NOT_CONFIGURED',
        provider: this.name,
        processingTime: Date.now() - startTime,
        reason: 'Gemini API not configured'
      };
    }

    try {
      const model = geminiConfig.getOCRModel();
      if (!model) throw new Error('OCR Model not initialized');

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
Provide a confidence score for your extraction.
Return ONLY valid JSON matching this schema exactly:
{
  "status": "SUCCESS" | "UNIDENTIFIED",
  "confidence": <number 0-100>,
  "text": "<extracted text or empty string>"
}
If absolutely no text is visible, set status to "UNIDENTIFIED".
`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const text = result.response.text();
      
      let parsed: OCRResult;
      try {
        parsed = JSON.parse(text) as OCRResult;
      } catch (e) {
        throw new Error(`Failed to parse JSON response: ${text}`);
      }
      
      const duration = Date.now() - startTime;
      logger.info(`[${this.name}] Finished analysis in ${duration}ms with status: ${parsed.status}`);
      
      return {
        ...parsed,
        provider: this.name,
        processingTime: duration,
        model: 'gemini-1.5-flash'
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      logger.error(`[${this.name}] Error after ${duration}ms`, error);
      return { 
        status: 'ERROR', 
        provider: this.name,
        error: error.message || String(error),
        reason: 'Exception during Gemini API call or parsing',
        processingTime: duration 
      };
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
