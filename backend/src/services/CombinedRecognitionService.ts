import { getGeminiModel } from '../config/gemini';
import { logger } from '../utils/logger';
import { TranscriptResult, MovieResult, SongResult } from '../types';
import fs from 'fs';

export interface CombinedResult {
  transcript: TranscriptResult;
  movie: MovieResult;
  song: SongResult;
}

class CombinedRecognitionService {
  private promise: Promise<CombinedResult> | null = null;

  async recognize(audioFilePath: string, framePaths: string[]): Promise<CombinedResult> {
    if (this.promise) {
      return this.promise;
    }

    this.promise = this._recognize(audioFilePath, framePaths);
    try {
      const result = await this.promise;
      return result;
    } finally {
      this.promise = null; // reset for next request
    }
  }

  private async _recognize(audioFilePath: string, framePaths: string[]): Promise<CombinedResult> {
    const model = getGeminiModel();
    if (!model) {
      return this.getErrorResult('Configure your AI provider.', 'NOT_CONFIGURED');
    }

    try {
      // Read audio safely
      let audioPart;
      try {
        const audioData = await fs.promises.readFile(audioFilePath, { encoding: 'base64' });
        audioPart = { inlineData: { data: audioData, mimeType: 'audio/mp3' } };
      } catch (err) {
        logger.warn(`Could not read audio file: ${audioFilePath}. Assuming no audio.`);
      }

      // Read images
      const imageParts = await Promise.all(
        framePaths.map(async (path) => ({
          inlineData: {
            data: await fs.promises.readFile(path, { encoding: 'base64' }),
            mimeType: 'image/jpeg'
          }
        }))
      );

      const prompt = `
You are a highly accurate Video Understanding AI.
Analyze the provided video frames and audio (if any).
Extract the following information and return it in a single JSON object matching this schema EXACTLY:
{
  "transcript": {
    "status": "SUCCESS" | "UNIDENTIFIED",
    "confidence": <number 0-100>,
    "dialogue": "<transcription>",
    "language": "<detected language>"
  },
  "movie": {
    "status": "SUCCESS" | "UNIDENTIFIED",
    "confidence": <number 0-100>,
    "title": "<movie/TV show title guess>",
    "type": "Movie" | "TV Show" | "Anime" | "Web Series" | "Documentary",
    "sceneDescription": "<brief description of the scene>",
    "objects": ["<object1>", "<object2>"],
    "ocr": "<any text visible in frames>"
  },
  "song": {
    "status": "SUCCESS" | "UNIDENTIFIED",
    "confidence": <number 0-100>,
    "title": "<song title>",
    "artist": "<artist name>",
    "album": "<album name>"
  }
}

Rules:
- If a section cannot be identified, set its status to "UNIDENTIFIED" and confidence to 0.
- Return ONLY valid JSON without any markdown formatting. Do not hallucinate titles for personal videos.
`;

      logger.info('Calling Gemini API for Combined Recognition (Request #1)');
      const parts: any[] = [prompt];
      if (audioPart) parts.push(audioPart);
      parts.push(...imageParts);

      const result = await model.generateContent(parts);
      const text = result.response.text();
      const match = text.match(/\{[\s\S]*\}/);

      if (!match) {
        logger.error('No JSON object found in Gemini combined response');
        return this.getErrorResult('Invalid JSON response', 'UNIDENTIFIED');
      }

      const parsed = JSON.parse(match[0]) as CombinedResult;
      
      // Ensure missing fields have fallbacks
      if (!parsed.transcript) parsed.transcript = { status: 'UNIDENTIFIED', confidence: 0 };
      if (!parsed.movie) parsed.movie = { status: 'UNIDENTIFIED', confidence: 0 };
      if (!parsed.song) parsed.song = { status: 'UNIDENTIFIED', confidence: 0 };

      return parsed;
    } catch (error: any) {
      logger.error('Error in CombinedRecognitionService', error);
      return this.getErrorResult(error.message, 'ERROR');
    }
  }

  private getErrorResult(message: string, status: any): CombinedResult {
    return {
      transcript: { status, message, confidence: 0 },
      movie: { status, message, confidence: 0 },
      song: { status, message, confidence: 0 }
    };
  }
}

export const combinedRecognitionService = new CombinedRecognitionService();
