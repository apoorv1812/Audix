import { config } from '../config/env';
import { MovieResult } from '../types';
import { logger } from '../utils/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export class MovieRecognitionProvider {
  async recognize(framePaths: string[], transcriptText?: string): Promise<MovieResult> {
    if (!config.providers.gemini) {
      logger.warn('Gemini API key is not configured.');
      return { status: 'NOT_CONFIGURED', message: 'Configure your AI provider.' };
    }

    try {
      const genAI = new GoogleGenerativeAI(config.providers.gemini);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

      // Convert images to generative parts
      const imageParts = framePaths.map(path => {
        const data = fs.readFileSync(path).toString('base64');
        return {
          inlineData: {
            data,
            mimeType: 'image/jpeg'
          }
        };
      });

      const prompt = `
You are a highly accurate Movie/TV recognition AI. 
I have provided extracted frames from a video clip ${transcriptText ? `and the transcript: "${transcriptText}"` : ''}.
Your task is to identify the movie, TV show, or anime.
Even if you are not completely sure, make your best guess.
Return ONLY a valid JSON response matching this schema:
{
  "status": "SUCCESS",
  "confidence": <number between 0-100>,
  "title": "<title>",
  "type": "<Movie | TV Show | Anime | Web Series | Documentary>"
}

If the frames are clearly just a random personal video with no recognizable media, return:
{
  "status": "UNIDENTIFIED",
  "confidence": 0
}

Return ONLY valid JSON. No markdown formatting blocks around it. Do not hallucinate titles for personal videos.`;

      logger.info('Calling Gemini API for Movie Recognition');
      const result = await model.generateContent([prompt, ...imageParts]);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);
      
      if (!match) {
        logger.error('No JSON object found in Gemini response', text);
        return { status: 'UNIDENTIFIED', confidence: 0 };
      }

      try {
        const parsed = JSON.parse(match[0]) as MovieResult;
        return parsed;
      } catch (parseError) {
        logger.error('Failed to parse Gemini response', parseError);
        return { status: 'UNIDENTIFIED', confidence: 0 };
      }

    } catch (error: any) {
      logger.error('Error in MovieRecognitionProvider', error);
      return { status: 'ERROR', message: error.message };
    }
  }
}
