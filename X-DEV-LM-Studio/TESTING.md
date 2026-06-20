# LM Studio Testing Guide

## Test suite

The LM Studio package now uses Vitest for a mock-driven backend suite focused on LLM behavior:

- request parsing and validation
- prompt/model option mapping
- completion, chat, act, and embedding flows
- SSE streaming behavior
- file, document, and token endpoints
- built-in tool wiring

## Commands

```bash
npm test -w X-DEV-LM-Studio
npm run test:coverage -w X-DEV-LM-Studio
npm run build -w X-DEV-LM-Studio
```

## Notes

- Tests run in a Node environment.
- The backend client is injected in tests, so the suite does not require a live LM Studio instance.
- React/example UI files are out of scope for this backend pass.
