import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import Ollama from 'ollama';

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

const ollamaClient = new Ollama({
  host: 'https://ollama.com',
  headers: {
    Authorization: 'Bearer ' + (process.env.OLLAMA_API_KEY || ''),
  },
});

app.post('/api/ollama/chat/completions', async (req, res) => {
  try {
    const ollamaApiKey = process.env.OLLAMA_API_KEY;
    if (!ollamaApiKey) {
      res.status(500).json({ error: 'OLLAMA_API_KEY not configured' });
      return;
    }

    const { model, messages, stream = false, ...rest } = req.body;
    console.log('Ollama Cloud request:', { model, stream });

    const response = await ollamaClient.chat({
      model: model || 'nemotron-3-super:cloud',
      messages: messages as { role: string; content: string }[],
      stream,
      ...rest,
    });

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const streamResponse = await ollamaClient.chat({
        model: model || 'nemotron-3-super:cloud',
        messages: messages as { role: string; content: string }[],
        stream: true,
        ...rest,
      });

      for await (const part of streamResponse) {
        const openAIPart = {
          choices: [{ delta: { content: part.message.content }, index: 0 }],
          model,
        };
        res.write(`data: ${JSON.stringify(openAIPart)}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const openAIResponse = {
        choices: [{ message: { role: 'assistant', content: response.message.content } }],
        model,
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
