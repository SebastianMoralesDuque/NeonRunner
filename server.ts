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

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Debug: log all requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log('Request:', req.method, req.path);
  }
  next();
});

// Proxy /api/ollama/* to Ollama Cloud API - MUST be before static files
app.use('/api/ollama', async (req, res) => {
  try {
    const ollamaApiKey = process.env.OLLAMA_API_KEY;
    if (!ollamaApiKey) {
      res.status(500).json({ error: 'OLLAMA_API_KEY not configured' });
      return;
    }
    
    const targetPath = req.originalUrl.replace(/^\/api\/ollama/, '/api');
    const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const url = `https://ollama.com${targetPath}${queryString}`;
    console.log('Ollama Cloud proxy:', req.method, req.originalUrl, '-> URL:', url);
    console.log('Body:', (req as any).rawBody ? (req as any).rawBody.toString() : 'none');
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ollamaApiKey}`,
        ...Object.fromEntries(Object.entries(req.headers).filter(([k]) => k !== 'host' && k !== 'connection' && k !== 'content-length')),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? (req as any).rawBody || JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.status(response.status).set('Content-Type', response.headers.get('Content-Type') || 'application/json').send(data);
  } catch (err: any) {
    console.error('Ollama Cloud proxy error:', err.message);
    res.status(502).json({ error: 'Failed to reach Ollama Cloud', details: err.message });
  }
});

// Serve static files from dist
app.use(express.static(path.join(__dirname, 'dist')));

// Catch-all: serve index.html for SPA routing
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`NeonRunner running on http://localhost:${PORT}`);
});
