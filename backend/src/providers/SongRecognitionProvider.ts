import { config } from '../config/env';
import { SongResult } from '../types';
import { logger } from '../utils/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export class SongRecognitionProvider {
  async recognize(audioFilePath: string): Promise<SongResult> {
    if (!config.providers.gemini) {
      logger.warn('Gemini API key is not configured for SongRecognition.');
      return { status: 'NOT_CONFIGURED', message: 'Configure your AI provider.' };
    }
    
    try {
      const genAI = new GoogleGenerativeAI(config.providers.gemini);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

      let audioData;
      try {
        audioData = fs.readFileSync(audioFilePath).toString('base64');
      } catch (err) {
        logger.error('Failed to read audio file for SongRecognitionProvider', err);
        return { status: 'ERROR', message: 'Could not read audio file.' };
      }

      const audioPart = {
        inlineData: {
          data: audioData,
          mimeType: 'audio/mp3'
        }
      };

      const prompt = `
You are a highly accurate Music Recognition AI.
Listen to the provided audio clip and identify the song.
Return ONLY a valid JSON object matching this schema:
{
  "status": "SUCCESS",
  "confidence": <number 0-100>,
  "title": "<song title>",
  "artist": "<artist name>",
  "album": "<album name>"
}

If you are unsure about the song, make your best guess.
Never fabricate artist names if it's completely unrecognizable.
Return ONLY valid JSON. No markdown blocks.`;

      logger.info('Calling Gemini API for Music Recognition');
      const result = await model.generateContent([prompt, audioPart]);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        logger.error('No JSON object found in Gemini response', text);
        return { status: 'UNIDENTIFIED', confidence: 0 };
      }

      try {
        const parsed = JSON.parse(match[0]) as SongResult;
        if (parsed.confidence === undefined || parsed.confidence < 20) {
          logger.info(`Song recognition confidence (${parsed.confidence}) below 20% threshold. Marking UNIDENTIFIED.`);
          return { status: 'UNIDENTIFIED', confidence: parsed.confidence };
        }
        return parsed;
      } catch (parseError) {
        logger.error('Failed to parse Gemini response for song', parseError);
        return { status: 'UNIDENTIFIED', confidence: 0 };
      }

    } catch (error: any) {
      logger.error('Error in SongRecognitionProvider', error);
      return { status: 'ERROR', message: error.message };
    }
  }
}

