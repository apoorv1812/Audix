import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { logger } from './utils/logger';
import analyzeRoutes from './routes/analyze';
import debugRoutes from './routes/debug';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/analyze', analyzeRoutes);
app.use('/api/debug', debugRoutes);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(config.port, () => {
  logger.info(`Audix Backend Server running on port ${config.port}`);
});
