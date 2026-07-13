import { IProvider } from '../../core/interfaces/IProvider';
import { PipelineContext, SummaryResult, ProviderStatus } from '../../core/types';
import { getGeminiModel } from '../../config/gemini';
import { logger } from '../../utils/logger';

export class GeminiSummaryProvider implements IProvider<SummaryResult> {
  name = 'GeminiSummaryProvider';
  private _status: ProviderStatus = 'PENDING';

  async initialize(): Promise<void> {
    const model = getGeminiModel();
    if (!model) {
      this._status = 'NOT_CONFIGURED';
    } else {
      this._status = 'SUCCESS';
    }
  }

  async analyze(context: PipelineContext): Promise<SummaryResult> {
    const startTime = Date.now();
    logger.info(`[${this.name}] Starting analysis`);

    if (this._status === 'NOT_CONFIGURED') {
      logger.warn(`[${this.name}] Provider not configured`);
      return { status: 'NOT_CONFIGURED' };
    }

    try {
      const model = getGeminiModel();
      if (!model) throw new Error('Model not initialized');

      const { movie, music, speech, ocr, movieMetadata } = context.state;

      const prompt = `
You are an intelligent Video Understanding AI summarizing the context of a video.
I have used other AI providers to extract the following metadata from the video:
- Visual Context (Movie/TV): ${movie && movie.status === 'SUCCESS' ? `${movie.title} (Confidence: ${movie.confidence}%)` : 'Not identified'}
- Background Music: ${music && music.status === 'SUCCESS' ? `${music.title} by ${music.artist}` : 'Not identified'}
- Dialogue/Transcript: ${speech && speech.status === 'SUCCESS' ? speech.dialogue : 'No dialogue detected'}
- Extracted Text (OCR): ${ocr && ocr.status === 'SUCCESS' ? ocr.text : 'No text visible'}
- Metadata: ${movieMetadata && movieMetadata.status === 'SUCCESS' ? `${movieMetadata.genre}, ${movieMetadata.releaseYear}, ${movieMetadata.network}` : 'N/A'}

Based on this information, generate an intelligent, cohesive scene explanation or summary (around 3-4 sentences). 
If most metadata is missing, just state what was found or that the video's contents could not be identified accurately.
Do not invent facts.

Return ONLY a valid JSON object matching this schema exactly:
{
  "status": "SUCCESS",
  "text": "<your summary text>"
}
`;

      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        throw new Error('Invalid JSON response');
      }

      const parsed = JSON.parse(match[0]) as SummaryResult;
      
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
