import multer from 'multer';
import path from 'path';
import fs from 'fs';
import os from 'os';

const tempDir = path.join(os.tmpdir(), 'audix-uploads');

if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, tempDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['.mp4', '.mov', '.avi', '.mkv', '.webm'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Unsupported file type.'));
  }
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter
});
