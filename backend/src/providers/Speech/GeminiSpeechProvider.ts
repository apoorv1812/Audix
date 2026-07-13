import { IProvider } from '../../core/interfaces/IProvider';
import { PipelineContext, TranscriptResult, ProviderStatus } from '../../core/types';
import { geminiConfig } from '../../config/gemini';
import { logger } from '../../utils/logger';
import fs from 'fs/promises';

export class GeminiSpeechProvider implements IProvider<TranscriptResult> {
  name = 'GeminiSpeechProvider';
  private _status: ProviderStatus = 'PENDING';

  async initialize(): Promise<void> {
    const model = geminiConfig.getTextModel();
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
      return { 
        status: 'NOT_CONFIGURED',
        provider: this.name,
        processingTime: Date.now() - startTime,
        reason: 'Gemini API not configured'
      };
    }

    try {
      const model = geminiConfig.getTextModel();
      if (!model) throw new Error('Text Model not initialized');

      let audioPart;
      try {
        const audioData = await fs.readFile(context.audioPath, { encoding: 'base64' });
        audioPart = { inlineData: { data: audioData, mimeType: 'audio/mp3' } };
      } catch (err) {
        logger.warn(`[${this.name}] Could not read audio file: ${context.audioPath}`);
        return { 
          status: 'ERROR', 
          provider: this.name,
          processingTime: Date.now() - startTime,
          reason: 'No audio found' 
        };
      }

      const prompt = `
You are a highly accurate Audio Transcription AI.
Listen to the provided audio.
Transcribe the speech and detect the language. Do NOT provide any movie details or song details.
Provide a natural confidence score based on the clarity of the speech.
Return ONLY valid JSON matching this schema exactly:
{
  "status": "SUCCESS" | "UNIDENTIFIED",
  "confidence": <number 0-100>,
  "dialogue": "<transcription>",
  "language": "<detected language>",
  "speakerCount": <estimated number of speakers>
}
If there is absolutely no speech, set status to "UNIDENTIFIED".
`;

      const result = await model.generateContent([prompt, audioPart]);
      const text = result.response.text();
      
      let parsed: TranscriptResult;
      try {
        parsed = JSON.parse(text) as TranscriptResult;
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
