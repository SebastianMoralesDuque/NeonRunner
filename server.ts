import express from 'express';
import path from 'path';
import { Readable } from 'stream';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ verify: (req, res, buf) => {
  (req as any).rawBody = buf;
} }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log('Request:', req.method, req.path);
  }
  next();
});

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://10.0.2.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'granite4.1:3b';

app.post('/api/ollama/chat/completions', async (req, res) => {
  try {
    const { model, messages, stream = false, ...rest } = req.body;
    console.log('Ollama request:', { model: model || OLLAMA_MODEL, stream });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || OLLAMA_MODEL,
          messages,
          stream: true,
          ...rest,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Ollama API error:', response.status, error);
        res.status(response.status).json({ error: 'Ollama API error', details: error });
        return;
      }

      if (response.body) {
        Readable.fromWeb(response.body as any).pipe(res);
      } else {
        res.end();
      }
    } else {
      const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model || OLLAMA_MODEL,
          messages,
          stream: false,
          ...rest,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Ollama API error:', response.status, error);
        res.status(response.status).json({ error: 'Ollama API error', details: error });
        return;
      }

      const data = await response.json();

      const openAIResponse = {
        id: 'ollama-' + Date.now(),
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: model || OLLAMA_MODEL,
        choices: [{
          index: 0,
          message: {
            role: 'assistant',
            content: data.message?.content || '',
          },
          finish_reason: 'stop',
        }],
      };

      res.json(openAIResponse);
    }
  } catch (err: any) {
    console.error('Ollama error:', err.message);
    res.status(502).json({ error: 'Failed to reach Ollama', details: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NeonRunner running on http://localhost:${PORT}`);
});
