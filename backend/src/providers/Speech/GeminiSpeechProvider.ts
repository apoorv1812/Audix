import { IProvider } from '../../core/interfaces/IProvider';
import { PipelineContext, TranscriptResult, ProviderStatus } from '../../core/types';
import { getGeminiModel } from '../../config/gemini';
import { logger } from '../../utils/logger';
import fs from 'fs/promises';

export class GeminiSpeechProvider implements IProvider<TranscriptResult> {
  name = 'GeminiSpeechProvider';
  private _status: ProviderStatus = 'PENDING';

  async initialize(): Promise<void> {
    const model = getGeminiModel();
    if (!model) {
      this._status = 'NOT_CONFIGURED';
    } else {
      this._status = 'SUCCESS';
    }
  }

  async analyze(context: PipelineContext): Promise<TranscriptResult> {
    const startTime = Date.now();
    logger.info(`[${this.name}] Starting analysis`);

    if (this._status === 'NOT_CONFIGURED') {
      logger.warn(`[${this.name}] Provider not configured`);
      return { status: 'NOT_CONFIGURED' };
    }

    try {
      const model = getGeminiModel();
      if (!model) throw new Error('Model not initialized');

      let audioPart;
      try {
        const audioData = await fs.readFile(context.audioPath, { encoding: 'base64' });
        audioPart = { inlineData: { data: audioData, mimeType: 'audio/mp3' } };
      } catch (err) {
        logger.warn(`[${this.name}] Could not read audio file: ${context.audioPath}`);
        return { status: 'UNIDENTIFIED', message: 'No audio found' };
      }

      const prompt = `
You are a highly accurate Audio Transcription AI.
Listen to the provided audio.
Transcribe the speech and detect the language. Do NOT provide any movie details or song details.
Return ONLY valid JSON matching this schema exactly:
{
  "status": "SUCCESS" | "UNIDENTIFIED",
  "confidence": <number 0-100>,
  "dialogue": "<transcription>",
  "language": "<detected language>",
  "speakerCount": <estimated number of speakers>
}
If there is no speech, set status to "UNIDENTIFIED".
`;

      const result = await model.generateContent([prompt, audioPart]);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error('Invalid JSON response');
      }

      const parsed = JSON.parse(match[0]) as TranscriptResult;
      
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
