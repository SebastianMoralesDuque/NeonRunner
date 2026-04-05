import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Debug: log all requests
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    console.log('Request:', req.method, req.path);
  }
  next();
});

// Proxy /api/ollama/* to localhost:11434/v1/* - MUST be before static files
app.use('/api/ollama', async (req, res) => {
  console.log('Ollama proxy:', req.method, req.originalUrl, '-> OLLAMA_HOST:', process.env.OLLAMA_HOST);
  try {
    const targetPath = req.path.replace(/^\/api\/ollama/, '/v1');
    const ollamaHost = process.env.OLLAMA_HOST || '10.0.0.188';
    const queryString = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
    const url = `http://${ollamaHost}:11434${targetPath}${queryString}`;
    
    const response = await fetch(url, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(Object.entries(req.headers).filter(([k]) => k !== 'host' && k !== 'connection' && k !== 'content-length')),
      },
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.text();
    res.status(response.status).set('Content-Type', response.headers.get('Content-Type') || 'application/json').send(data);
  } catch (err: any) {
    console.error('Ollama proxy error:', err.message);
    res.status(502).json({ error: 'Failed to reach Ollama server' });
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
