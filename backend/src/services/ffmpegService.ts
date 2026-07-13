import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { logger } from '../utils/logger';

export interface ProcessMediaResult {
  audioPath: string;
  framePaths: string[];
  metadata: {
    duration: number;
    format: string;
    bitrate: number;
  };
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
        const format = metadata.format.format_name || 'unknown';
        const bitrate = metadata.format.bit_rate || 0;

        const timestamps = [
          duration * 0.10,
          duration * 0.35,
          duration * 0.65,
          duration * 0.90
        ];

        const framePaths = timestamps.map((_, i) => path.join(outputDir, `frame-${i + 1}.jpg`));
        
        const command = ffmpeg(videoPath);

        // Output 1: Audio (Mono, 64kbps, normalize volume if possible, trim silence requires complex filters which we avoid for latency, but we keep it simple as requested)
        command
          .output(audioPath)
          .noVideo()
          .audioCodec('libmp3lame')
          .audioChannels(1)
          .audioBitrate('64k');

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
            logger.info(`Extracted audio and frames to ${outputDir} in one pass safely`);
            resolve({ 
              audioPath, 
              framePaths,
              metadata: {
                duration,
                format,
                bitrate
              }
            });
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
