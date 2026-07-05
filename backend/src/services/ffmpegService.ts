import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
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
        
        const command = ffmpeg();

        // 1. Add inputs with fast-seek (-ss BEFORE -i) for each frame
        timestamps.forEach(t => {
          command.input(videoPath).inputOptions([`-ss ${t.toFixed(3)}`]);
        });
        
        // 2. Add one final input for the full audio extraction
        command.input(videoPath);
        const audioInputIndex = timestamps.length;

        // 3. Map frame inputs to outputs
        timestamps.forEach((t, i) => {
          command
            .output(framePaths[i])
            .outputOptions([
              `-map ${i}:v:0`, // take video stream from this specific input
              '-vframes 1',
              '-vf scale=-1:720',
              '-q:v 5'
            ]);
        });

        // 4. Map final input to audio output
        command
          .output(audioPath)
          .outputOptions([
            `-map ${audioInputIndex}:a:0?`, // ? means optional (won't crash if no audio)
            '-c:a libmp3lame',
            '-ac 1',
            '-b:a 64k'
            // Removed silenceremove and loudnorm as they force full stream buffering and cause massive delays
          ]);

        command
          .on('end', () => {
            logger.info(`Extracted audio and frames to ${outputDir} instantly using fast-seek multi-input`);
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
