import { config } from '../config/env';
import { TranscriptResult } from '../types';
import { logger } from '../utils/logger';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';

export class SpeechRecognitionProvider {
  async transcribe(audioFilePath: string): Promise<TranscriptResult> {
    if (!config.providers.gemini) {
      logger.warn('Gemini API key is not configured for SpeechRecognition.');
      return { status: 'NOT_CONFIGURED', message: 'Configure your AI provider.' };
    }
    
    try {
      const genAI = new GoogleGenerativeAI(config.providers.gemini);
      const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });

      let audioData;
      try {
        audioData = fs.readFileSync(audioFilePath).toString('base64');
      } catch (err) {
        logger.error('Failed to read audio file for SpeechRecognitionProvider', err);
        return { status: 'ERROR', message: 'Could not read audio file.' };
      }

      const audioPart = {
        inlineData: {
          data: audioData,
          mimeType: 'audio/mp3'
        }
      };

      const prompt = `
You are a highly accurate Speech Recognition AI.
Listen to the provided audio clip and transcribe the speech. Also detect the primary language.
Return ONLY a valid JSON object matching this schema:
{
  "status": "SUCCESS",
  "confidence": <number 0-100>,
  "dialogue": "<the transcription with timestamps if possible, or just text>",
  "language": "<detected language>"
}

If there is no speech, or it is unintelligible, return:
{
  "status": "UNIDENTIFIED",
  "confidence": 0
}

Return ONLY valid JSON. No markdown blocks.`;

      logger.info('Calling Gemini API for Speech Recognition');
      const result = await model.generateContent([prompt, audioPart]);
      const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

      try {
        const parsed = JSON.parse(responseText) as TranscriptResult;
        return parsed;
      } catch (parseError) {
        logger.error('Failed to parse Gemini response for speech', parseError);
        return { status: 'UNIDENTIFIED', confidence: 0 };
      }

    } catch (error: any) {
      logger.error('Error in SpeechRecognitionProvider', error);
      return { status: 'ERROR', message: error.message };
    }
  }
}
