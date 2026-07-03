import { Router } from 'express';
import { analyzeVideo } from '../controllers/analyzeController';
import { uploadMiddleware } from '../middleware/uploadMiddleware';

const router = Router();

// POST /api/analyze
router.post('/', uploadMiddleware.single('video'), analyzeVideo);

export default router;
