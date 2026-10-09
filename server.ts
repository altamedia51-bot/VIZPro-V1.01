import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Gemini on server
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Server translation endpoint for lyrics & subtitles
app.post('/api/translate', async (req, res) => {
  try {
    const { lines, targetLang = 'id' } = req.body;
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      return res.status(400).json({ error: 'Lines array is required' });
    }

    if (!ai) {
      return res.status(503).json({ error: 'Gemini API not configured on server' });
    }

    const langNameMap: Record<string, string> = {
      id: 'Indonesian (Bahasa Indonesia)',
      en: 'English',
      ja: 'Japanese',
      ko: 'Korean',
      zh: 'Mandarin Chinese',
      ar: 'Arabic',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      ru: 'Russian',
      pt: 'Portuguese',
      jv: 'Javanese',
      su: 'Sundanese',
      th: 'Thai',
    };
    const targetLanguageName = langNameMap[targetLang] || targetLang;

    // Use gemini-3.8-flash for high quality translation
    const prompt = `You are a professional music lyric and subtitle translator.
Translate the following array of lyric lines into ${targetLanguageName}.
Requirements:
1. Maintain emotional poetic tone, rhythm, and song context.
2. Keep musical lyrical phrasing natural and smooth.
3. Maintain exactly ${lines.length} lines.
4. Each translated line MUST correspond 1-to-1 to the original line index.
5. Return ONLY a valid JSON array of strings containing the translated lines in the exact same order.

Original lines:
${JSON.stringify(lines)}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text || '[]';
    let translations: string[] = [];
    try {
      translations = JSON.parse(outputText);
    } catch {
      const match = outputText.match(/\[[\s\S]*\]/);
      if (match) {
        translations = JSON.parse(match[0]);
      }
    }

    if (!Array.isArray(translations) || translations.length === 0) {
      throw new Error('Failed to parse translation response from model');
    }

    while (translations.length < lines.length) {
      translations.push(lines[translations.length]);
    }
    if (translations.length > lines.length) {
      translations = translations.slice(0, lines.length);
    }

    return res.json({ translations });
  } catch (error: any) {
    console.error('Translation server error:', error);
    return res.status(500).json({ error: error.message || 'Translation failed' });
  }
});

async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
