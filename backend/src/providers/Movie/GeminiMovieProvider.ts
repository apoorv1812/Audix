import { IProvider } from '../../core/interfaces/IProvider';
import { PipelineContext, MovieResult, ProviderStatus } from '../../core/types';
import { geminiConfig } from '../../config/gemini';
import { logger } from '../../utils/logger';
import fs from 'fs/promises';

export class GeminiMovieProvider implements IProvider<MovieResult> {
  name = 'GeminiMovieProvider';
  private _status: ProviderStatus = 'PENDING';

  async initialize(): Promise<void> {
    const model = geminiConfig.getVisionModel();
    if (!model) {
      this._status = 'NOT_CONFIGURED';
    } else {
      this._status = 'SUCCESS';
    }
  }

  async analyze(context: PipelineContext): Promise<MovieResult> {
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
      const model = geminiConfig.getVisionModel();
      if (!model) throw new Error('Vision Model not initialized');

      // Movie recognition only analyzes images (4 optimized frames)
      const imageParts = await Promise.all(
        context.framePaths.map(async (path) => ({
          inlineData: {
            data: await fs.readFile(path, { encoding: 'base64' }),
            mimeType: 'image/jpeg'
          }
        }))
      );

      const prompt = `
You are a highly accurate Visual Recognition AI.
Analyze the provided video frames. 
Determine if these frames belong to a recognizable Movie, TV Show, Anime, Web Series, or Documentary.
DO NOT use any external knowledge about audio or transcripts. Just look at the visual information.
Estimate your confidence naturally based on how recognizable the frames are.
Return ONLY valid JSON matching this schema exactly:
{
  "status": "SUCCESS" | "UNIDENTIFIED",
  "confidence": <number 0-100>,
  "title": "<movie/TV show title guess>",
  "type": "Movie" | "TV Show" | "Anime" | "Web Series" | "Documentary"
}
If you truly cannot identify any recognizable media, set status to "UNIDENTIFIED". Do not invent titles.
`;

      const result = await model.generateContent([prompt, ...imageParts]);
      const text = result.response.text();
      
      let parsed: MovieResult;
      try {
        parsed = JSON.parse(text) as MovieResult;
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
    return 30000; // 30 seconds
  }
}
