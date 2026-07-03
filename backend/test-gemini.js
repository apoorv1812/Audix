require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function run() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `
You are a highly accurate Movie/TV recognition AI. 
I have provided extracted frames from a video clip.
Your task is to identify the movie, TV show, or anime.
If you are confident (confidence > 80) that you know what it is, return a JSON response matching this schema:
{
  "status": "SUCCESS",
  "confidence": <number between 80-100>,
  "title": "<title>",
  "type": "<Movie | TV Show | Anime | Web Series | Documentary>"
}

If you are NOT confident, or if this is just a random non-movie video, you MUST return:
{
  "status": "UNIDENTIFIED",
  "confidence": 0
}

Return ONLY valid JSON. No markdown formatting blocks around it. Do not guess or hallucinate.`;

  console.log("Calling Gemini API...");
  try {
    const result = await model.generateContent([prompt, "Assume I provided a picture of Iron Man here."]);
    console.log("RAW RESPONSE:", result.response.text());
  } catch(e) {
    console.error("ERROR:", e);
  }
}

run();
