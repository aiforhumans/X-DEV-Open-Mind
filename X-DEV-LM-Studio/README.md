# X-DEV LM Studio

Local LM Studio backend with HTTP endpoints for model loading, completions, chat, tool calls, embeddings, and document/file operations.

## Features

- Load and unload LLM or embedding models
- OpenAI-style `completions`, `chat/completions`, and `embeddings` routes
- LM Studio document APIs for file prep, parsing, and retrieval
- Built-in tool support for model and document workflows
- Streaming responses via SSE

## Install

```bash
npm install
npm run build
```

## Run

```bash
npm start
```

Then open `http://127.0.0.1:3000` for the built-in UI.

Environment variables:

- `PORT` - HTTP port, default `3000`
- `HOST` - bind host, default `127.0.0.1`
- `LM_STUDIO_BASE_URL` - LM Studio websocket base URL

## Endpoints

- `GET /health`
- `GET /` (Web UI)
- `GET /v1/models`
- `GET /v1/models/loaded`
- `POST /v1/models/load`
- `POST /v1/models/unload`
- `POST /v1/completions`
- `POST /v1/chat/completions`
- `POST /api/llm/act`
- `POST /v1/embeddings`
- `POST /api/files/prepare-file`
- `POST /api/files/prepare-image`
- `POST /api/files/parse-document`
- `POST /api/files/retrieve`

## Library usage

```ts
import LMStudioServer from "./src";

const server = new LMStudioServer("http://localhost:1234");
await server.loadModel({ name: "llama-3.2-1b-instruct" });
const text = await server.infer("Say hello in one sentence.");
```
