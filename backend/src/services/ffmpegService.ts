import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

export class FFmpegService {
  /**
   * Extracts audio from a video file.
   * Returns the path to the extracted audio file.
   */
  async extractAudio(videoPath: string, outputDir: string): Promise<string> {
    const fileName = path.basename(videoPath, path.extname(videoPath));
    const outputPath = path.join(outputDir, `${fileName}.mp3`);

    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .output(outputPath)
        .noVideo()
        .audioCodec('libmp3lame')
        .on('end', () => {
          logger.info(`Audio extracted to ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          logger.error(`Error extracting audio from ${videoPath}`, err);
          reject(err);
        })
        .run();
    });
  }

  /**
   * Extracts a specific number of frames from a video file.
   * Returns an array of paths to the extracted frame images.
   */
  async extractFrames(videoPath: string, outputDir: string, count: number = 5): Promise<string[]> {
    return new Promise((resolve, reject) => {
      ffmpeg(videoPath)
        .screenshots({
          count,
          folder: outputDir,
          filename: 'frame-%i.jpg',
        })
        .on('end', () => {
          logger.info(`Extracted ${count} frames to ${outputDir}`);
          // Reconstruct paths based on the fluent-ffmpeg pattern
          const framePaths = Array.from({ length: count }, (_, i) => 
            path.join(outputDir, `frame-${i + 1}.jpg`)
          );
          resolve(framePaths);
        })
        .on('error', (err) => {
          logger.error(`Error extracting frames from ${videoPath}`, err);
          reject(err);
        });
    });
  }
}
