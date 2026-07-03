import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env';

const router = Router();

router.get('/', async (req, res) => {
  try {
    if (!config.providers.gemini) {
      return res.json({ success: false, error: "GEMINI API KEY IS MISSING" });
    }
    
    const genAI = new GoogleGenerativeAI(config.providers.gemini);
    const modelName = req.query.model ? String(req.query.model) : 'gemini-1.5-flash';
    const model = genAI.getGenerativeModel({ model: modelName });
    
    // Instead of generateContent, fetch the list of models this API key can access
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${config.providers.gemini}`);
    const data = await response.json();
    
    return res.json({ success: true, models: data });
  } catch (error: any) {
    return res.json({ success: false, error: error.message, fullError: error });
  }
});

export default router;
