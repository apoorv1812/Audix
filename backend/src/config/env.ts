import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

export const config = {
  port: process.env.PORT || 3001,
  providers: {
    gemini: process.env.GEMINI_API_KEY || '',
    song: process.env.SONG_PROVIDER_API_KEY || '',
    movie: process.env.MOVIE_PROVIDER_API_KEY || '',
    speech: process.env.SPEECH_PROVIDER_API_KEY || '',
    vision: process.env.VISION_PROVIDER_API_KEY || '',
    summary: process.env.SUMMARY_PROVIDER_API_KEY || '',
  }
};
