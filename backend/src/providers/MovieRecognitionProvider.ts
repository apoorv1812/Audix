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
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' }); // Use flash for speed, or pro

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
If you are confident (confidence > 80) that you know what it is, return a JSON response matching this schema:
{
  "status": "SUCCESS",
  "confidence": <number between 80-100>,
  "title": "<title>",
  "type": "<Movie | TV Show | Anime | Web Series | Documentary>"
}

If you are NOT confident, or if this is just a random non-movie video, you MUST return:
{
  "status": "UNIDENTIFIED",
  "confidence": 0
}

Return ONLY valid JSON. No markdown formatting blocks around it. Do not guess or hallucinate.`;

      logger.info('Calling Gemini API for Movie Recognition');
      const result = await model.generateContent([prompt, ...imageParts]);
      const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsed = JSON.parse(responseText) as MovieResult;
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
