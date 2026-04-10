# NeonRunner - Ollama Cloud Integration

## Overview

This project uses **Ollama Cloud** to power the AI features (specifically, a decision log that generates content when the player dies). Instead of running a local Ollama instance (which requires GPU resources), we connect directly to Ollama's cloud service.

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Browser   │────▶│  Express.js  │────▶│  Ollama Cloud   │
│  (Frontend) │     │   (Proxy)    │     │  https://       │
│             │◀────│              │◀────│  ollama.com     │
└─────────────┘     └──────────────┘     └─────────────────┘
      3000             :3000                   API
                   (same server)          (external)
```

## Key Changes

### 1. Server Proxy (`server.ts`)

The Express server acts as a proxy, transforming requests from OpenAI format to Ollama Cloud format:

```typescript
// POST /api/ollama/chat/completions
// ────────────────────────────────
// Input (OpenAI format from frontend):
{
  "model": "nemotron-3-super:cloud",
  "messages": [
    { "role": "system", "content": "..." },
    { "role": "user", "content": "..." }
  ],
  "stream": false
}

// Output (Ollama Cloud format):
{
  "model": "nemotron-3-super:cloud",
  "messages": [...],
  "stream": true/false
}
```

The proxy:
- Receives requests at `/api/ollama/chat/completions` (OpenAI-compatible format)
- Forwards to `https://ollama.com/api/chat` (Ollama Cloud native format)
- Adds `Authorization: Bearer <OLLAMA_API_KEY>` header
- Transforms response back to OpenAI format for the frontend
- Supports streaming responses

### 2. Environment Variables

| Variable | Description |
|----------|-------------|
| `OLLAMA_API_KEY` | API key from ollama.com (required) |

### 3. No Local Ollama Required

Using Ollama Cloud means:
- No GPU required on the VPS
- No local Ollama container running
- No `OLLAMA_HOST` configuration
- Cloud models run on Ollama's servers

## Setup

### 1. Get Ollama API Key

```bash
# Option 1: Using CLI
ollama signin

# Option 2: Online
# Go to https://ollama.com/account and create an API key
```

### 2. Configure in Coolify

Add the environment variable in your Coolify project:

```
OLLAMA_API_KEY=your_api_key_here
```

### 3. Verify

Test the endpoint:
```bash
curl -X POST https://neonrunner.sebastianmorales.sbs/api/ollama/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"nemotron-3-super:cloud","messages":[{"role":"user","content":"hi"}],"stream":false}'
```

## Supported Models

Ollama Cloud supports various models. The default model used is `nemotron-3-super:cloud`.

Check available models:
```bash
curl https://ollama.com/api/tags
```

## Files Modified

- `server.ts` - Express proxy to Ollama Cloud
- `docker-compose.yml` - Added `OLLAMA_API_KEY` environment variable, removed `OLLAMA_HOST` and `extra_hosts`

## Previous vs Current Architecture

### Before (Local Ollama)
```
Browser ──▶ Express ──▶ OLLAMA_HOST:11434 (local/container)
```

### After (Ollama Cloud)
```
Browser ──▶ Express ──▶ https://ollama.com/api/chat
                              └──▶ API Key required
```

## Troubleshooting

### "OLLAMA_API_KEY not configured"
The environment variable is not set in Coolify. Add `OLLAMA_API_KEY` to your project's environment variables.

### "Failed to reach Ollama Cloud" / `response.body?.pipe is not a function`
- **Node 22 streaming bug**: `fetch()` returns a web `ReadableStream` that does not support `.pipe()` directly with Express. Use `Readable.fromWeb()` instead:
  ```typescript
  import { Readable } from 'stream';
  // ❌ Broken in Node 22
  response.body?.pipe(res);
  // ✅ Fixed
  Readable.fromWeb(response.body as any).pipe(res);
  ```
- If the error message is a generic "Failed to reach Ollama Cloud", also check:
  - Internet connectivity from the server
  - `OLLAMA_API_KEY` is correct
  - Ollama Cloud status at https://status.ollama.com

### Container restarting
Check logs in Coolify dashboard or via:
```bash
docker logs <container_name>
```
