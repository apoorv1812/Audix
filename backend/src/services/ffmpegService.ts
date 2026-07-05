import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';

export interface ProcessMediaResult {
  audioPath: string;
  framePaths: string[];
}

export class FFmpegService {
  async processMedia(videoPath: string, outputDir: string): Promise<ProcessMediaResult> {
    const fileName = path.basename(videoPath, path.extname(videoPath));
    const audioPath = path.join(outputDir, `${fileName}.mp3`);
    
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(videoPath, (err, metadata) => {
        if (err) {
          logger.error(`Error probing video ${videoPath}`, err);
          return reject(err);
        }

        const duration = metadata.format.duration || 15;
        const timestamps = [
          duration * 0.10,
          duration * 0.35,
          duration * 0.65,
          duration * 0.90
        ];

        const framePaths = timestamps.map((_, i) => path.join(outputDir, `frame-${i + 1}.jpg`));
        
        const command = ffmpeg(videoPath);

        // Output 1: Audio
        command
          .output(audioPath)
          .noVideo()
          .audioCodec('libmp3lame')
          .audioChannels(1)
          .audioBitrate('64k')
          .audioFilter('silenceremove=start_periods=1:start_duration=1:start_threshold=-50dB,loudnorm');

        // Outputs 2-5: Frames
        timestamps.forEach((t, i) => {
          command
            .output(framePaths[i])
            .outputOptions([
              `-ss ${t.toFixed(3)}`,
              '-vframes 1',
              '-vf scale=-1:720',
              '-q:v 5'
            ]);
        });

        command
          .on('end', () => {
            logger.info(`Extracted audio and frames to ${outputDir} in one pass`);
            resolve({ audioPath, framePaths });
          })
          .on('error', (err) => {
            logger.error(`Error processing media from ${videoPath}`, err);
            reject(err);
          })
          .run();
      });
    });
  }
}
