import { config } from '../config/env';
import { SummaryResult, SongResult, MovieResult, TranscriptResult } from '../types';
import { logger } from '../utils/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';

export class SummaryProvider {
  async generateSummary(
    song: SongResult | null, 
    movie: MovieResult | null, 
    transcript: TranscriptResult | null
  ): Promise<SummaryResult> {
    if (!config.providers.gemini) {
      logger.warn('Gemini API key is not configured for SummaryProvider.');
      return { status: 'NOT_CONFIGURED', message: 'Configure your AI provider.' };
    }
    
    try {
      const genAI = new GoogleGenerativeAI(config.providers.gemini);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      const prompt = `
You are an intelligent Video Understanding AI summarizing the context of a video.
I have used other AI providers to extract the following metadata from the video:
- Movie/Visual Context: ${movie && movie.status === 'SUCCESS' ? `${movie.title} (Confidence: ${movie.confidence}%)` : 'Not identified'}
- Background Music: ${song && song.status === 'SUCCESS' ? `${song.title} by ${song.artist}` : 'Not identified'}
- Dialogue/Transcript: ${transcript && transcript.status === 'SUCCESS' ? transcript.dialogue : 'No dialogue detected'}

Based on this information, generate an intelligent, cohesive scene explanation or summary (around 3-4 sentences). 
If most metadata is missing, just state what was found or that the video's contents could not be identified accurately.
Do not invent facts.

Return ONLY a valid JSON object matching this schema:
{
  "status": "SUCCESS",
  "text": "<your summary text>"
}

No markdown blocks.`;

      logger.info('Calling Gemini API for Summary Generation');
      const result = await model.generateContent(prompt);
      const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsed = JSON.parse(responseText) as SummaryResult;
        return parsed;
      } catch (parseError) {
        logger.error('Failed to parse Gemini response for summary', parseError);
        return { status: 'UNIDENTIFIED', confidence: 0 };
      }

    } catch (error: any) {
      logger.error('Error in SummaryProvider', error);
      return { status: 'ERROR', message: error.message };
    }
  }
}
