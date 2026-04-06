import express from 'express';
import path from 'path';
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

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const OLLAMA_HOST = 'https://ollama.com';

app.post('/api/ollama/chat/completions', async (req, res) => {
  try {
    if (!OLLAMA_API_KEY) {
      res.status(500).json({ error: 'OLLAMA_API_KEY not configured' });
      return;
    }

    const { model, messages, stream = false, ...rest } = req.body;
    console.log('Ollama Cloud request:', { model, stream });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OLLAMA_API_KEY}`,
        },
        body: JSON.stringify({
          model: model || 'nemotron-3-super:cloud',
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

      response.body?.pipe(res);
    } else {
      const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OLLAMA_API_KEY}`,
        },
        body: JSON.stringify({
          model: model || 'nemotron-3-super:cloud',
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
        model: model || 'nemotron-3-super:cloud',
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
    console.error('Ollama Cloud error:', err.message);
    res.status(502).json({ error: 'Failed to reach Ollama Cloud', details: err.message });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NeonRunner running on http://localhost:${PORT}`);
});
