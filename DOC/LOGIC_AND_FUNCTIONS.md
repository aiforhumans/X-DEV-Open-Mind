# Logic and Function Analysis

## X-DEV-LM-Studio/src/index.ts

### Types and Interfaces

- `ModelDomain`
  - Restricts model operations to `"llm"` or `"embedding"`.

- `ModelConfig`
  - Describes model load inputs: model name/path, domain, context length, GPU offload, memory behavior, mmap, and raw load options.

- `InferenceOptions`
  - Friendly wrapper for temperature, top-p, top-k, and max tokens.
  - Later mapped to LM Studio SDK prediction option names.

- `ApiMessageInput`
  - API-facing chat message shape.
  - Supports optional role, content, and local image paths.

- Request interfaces
  - `CompleteRequest`, `RespondRequest`, `ActRequest`, `EmbedRequest`, `FileRequest`, `RetrieveRequest`, and `ParseDocumentRequest` define route-specific input contracts.

- `BackendOptions`
  - Additional LM Studio client options such as client identifier, passkey, and verbose error behavior.

### Error and Response Helpers

- `ApiError`
  - Custom error with HTTP status, machine-readable code, message, and optional details.
  - Used for predictable API responses.

- `isRecord(value)`
  - Type guard for plain object-like request bodies.
  - Prevents array/null confusion before reading fields.

- `normalizeBaseUrl(apiUrl)`
  - Converts HTTP(S) URLs to websocket URLs for the LM Studio SDK.
  - Adds `ws://` to bare values.

- `jsonResponse`, `textResponse`, `htmlResponse`
  - Small response writers that set content type, status, and response body.
  - `textResponse` currently appears unused.

- `toSerializableError(error)`
  - Converts `ApiError`, normal `Error`, and unknown values into a stable JSON error envelope.

### Request Parsing Helpers

- `readJsonBody(req, limitBytes)`
  - Reads request body chunks with a 10 MB default limit.
  - Returns `{}` for empty bodies.
  - Throws `payload_too_large` or `invalid_json` errors when needed.

- `getString(value, field)`
  - Requires a non-empty string.

- `getOptionalString(value)`
  - Returns trimmed string-ish values only when non-empty.

- `getOptionalBoolean(value)`
  - Accepts only actual booleans.

- `getOptionalNumber(value)`
  - Accepts only finite numbers.

### File and Message Helpers

- `prepareImages(client, imagePaths)`
  - Accepts an unknown image path list.
  - Validates that paths are strings.
  - Prepares each local image with `client.files.prepareImage`.

- `serializeFileHandle(file, absolutePath)`
  - Converts an LM Studio file handle into plain JSON.

- `serializeMessage(message)`
  - Converts a chat message into role, text content, tool call metadata, tool results, and file presence.

- `normalizeChatMessages(messages, client)`
  - Converts API message inputs to LM Studio chat message inputs.
  - Prepares image files before calling the model.

### Built-In Tool Logic

- `BUILTIN_TOOL_NAMES`
  - Defines allowed built-in tool identifiers.

- `pickBuiltInTools(toolNames, backend)`
  - Converts selected tool names into LM Studio SDK tools.
  - Supported tools:
    - `list_downloaded_models`
    - `list_loaded_models`
    - `prepare_file`
    - `prepare_image`
    - `parse_document`
    - `retrieve_documents`
  - Tool implementations delegate back to public methods on `LMStudioServer`.

## LMStudioServer Class

### Constructor

```ts
constructor(apiUrl = "http://localhost:1234", options: BackendOptions = {})
```

Logic:

1. Normalize LM Studio URL to a websocket base URL.
2. Create `LMStudioClient`.
3. Preserve current loaded model identifiers in memory.

### Public Model Methods

- `loadModel(config)`
  - Loads either an LLM or embedding model depending on `config.domain`.
  - Defaults to LLM.

- `unloadModel(identifier, domain)`
  - If an identifier is provided, unloads that model.
  - If no identifier is provided, unloads the first loaded model in the domain.
  - Clears the in-memory current model pointer when appropriate.

- `infer(prompt, options)`
  - Convenience method for text completion against the active LLM.
  - Maps friendly inference option names to SDK prediction option names.
  - Returns only generated content, not stats.

- `listModels(domain)`
  - Lists downloaded models.
  - If no domain is provided, lists all downloaded models.

- `listLoadedModels(domain)`
  - Lists currently loaded models for the requested domain.

- `getCurrentModel()`
  - Returns the tracked current LLM model key, not necessarily a full live SDK model object.

### Public File and Document Methods

- `prepareFile(filePath)`
  - Resolves local path to absolute path.
  - Calls LM Studio file preparation.
  - Returns serialized handle metadata.

- `prepareImage(imagePath)`
  - Same as `prepareFile`, but uses image preparation.

- `parseDocument(file)`
  - Accepts path or base64 file request.
  - Prepares a file handle and delegates parsing to LM Studio.

- `retrieveDocuments(request)`
  - Prepares all requested files.
  - Calls LM Studio retrieval with query and handles.

### Server Lifecycle

- `start(port, host)`
  - Creates a Node HTTP server once.
  - Reuses the existing server if called repeatedly.
  - Binds to `127.0.0.1:3000` by default.

- `stop()`
  - Closes and clears the server reference.
  - No-ops when no server is running.

### Route Dispatcher

- `handleRequest(req, res)`
  - Central router.
  - Reads JSON body for non-GET/HEAD requests.
  - Routes by method and pathname.
  - Returns JSON errors for all thrown failures.

Main route groups:

- `GET /health`, `GET /api/health`
- `GET /v1/models`, `GET /api/models`
- `GET /v1/models/loaded`, `GET /api/models/loaded`
- `POST /v1/models/load`, `POST /api/models/load`
- `POST /v1/models/unload`, `POST /api/models/unload`
- `POST /v1/completions`, `POST /api/llm/complete`
- `POST /v1/chat/completions`, `POST /api/llm/respond`
- `POST /v1/llm/act`, `POST /api/llm/act`
- `POST /v1/embeddings`, `POST /api/embedding/embed`
- `POST /api/embedding/tokenize`
- `POST /api/embedding/count-tokens`
- `POST /api/files/prepare-file`
- `POST /api/files/prepare-image`
- `POST /api/files/parse-document`
- `POST /api/files/retrieve`
- `GET /`

### Private Request Readers

- `readDomain(url)`
  - Reads `domain` query parameter.

- `readDomainFromBody(body)`
  - Reads `domain` from JSON body.

- `readStreamFlag(url)`
  - Treats `?stream=1` and `?stream=true` as streaming requests.

- `readModelConfig(body)`
  - Requires model name through `name`, `model`, or `modelKey`.
  - Reads load configuration values.

- `readCompleteRequest(body)`
  - Requires `prompt`.
  - Reads optional model, SDK options, and stream flag.

- `readRespondRequest(body)`
  - Requires `messages` array.
  - Converts each message with `readMessageInput`.

- `readActRequest(body)`
  - Requires `messages` array.
  - Validates optional built-in tool names.

- `readEmbedRequest(body)`
  - Requires `input` as string or string array.

- `readMessageInput(message)`
  - Validates role, optional content, and optional image path array.

- `readFileRequest(body)`
  - Reads path/base64/fileName fields.

- `readParseDocumentRequest(body)`
  - Accepts either `{ file: ... }` or direct file fields.

- `readRetrieveRequest(body)`
  - Requires query and files array.
  - Allows file entries to be objects or path strings.

### Private Model Execution Methods

- `loadModelByDomain(domain, config)`
  - Selects model key from `path` or `name`.
  - Builds load options.
  - Calls `llm.load` or `embedding.load`.

- `buildLoadOptions(domain, config)`
  - Starts with raw `loadOptions`.
  - Adds context length, keep-in-memory, mmap.
  - Adds GPU ratio only for LLM domain.

- `getNamespace(domain)`
  - Returns `client.llm` or `client.embedding`.

- `mapPredictionOptions(options)`
  - Maps:
    - `topP` to `topPSampling`
    - `topK` to `topKSampling`
    - `temperature` and `maxTokens` directly

- `prepareDocumentHandle(file)`
  - Supports local path or base64 + fileName.

- `complete(request)`
  - Resolves an LLM model.
  - Calls `model.complete`.
  - Returns model identifier, content, and stats.

- `respond(request)`
  - Resolves an LLM model.
  - Normalizes chat messages and images.
  - Calls `model.respond`.
  - Returns model identifier, content, and stats.

- `act(request)`
  - Resolves an LLM model.
  - Normalizes chat messages.
  - Builds selected built-in tools.
  - Captures emitted messages through `onMessage`.
  - Returns model identifier, rounds, execution time, and collected messages.

- `embed(request)`
  - Resolves embedding model.
  - Embeds string or string array.

- `embeddingTokens(pathname, body)`
  - Uses embedding model for tokenize or count-tokens operation.

- `prepareFileEndpoint(pathname, body)`
  - Dispatches to file or image preparation.

- `documentEndpoint(pathname, body)`
  - Dispatches to parse-document or retrieve.

- `resolveLlmModel(modelKey)`
  - Uses explicit model when provided, otherwise the active/default LM Studio LLM model.

- `resolveEmbeddingModel(modelKey)`
  - Same idea for embedding models.

### Streaming Methods

- `streamComplete(res, request)`
  - Starts SSE.
  - Writes `fragment` events for prediction chunks.
  - Writes final `result` event.
  - Writes `error` event if generation fails.

- `streamRespond(res, request)`
  - Same pattern for chat responses.

- `streamAct(res, request)`
  - Streams action rounds, messages, prediction fragments, and final result.

- `startStream(res)`
  - Sets `text/event-stream`, disables cache, and flushes headers.

- `writeStreamEvent(res, event, data)`
  - Writes standard SSE event/data blocks.

- `endStream(res)`
  - Ends the response.

## X-DEV-LM-Studio/src/settingsUI.tsx

This is a React settings tester UI.

Main state groups:

- Model settings: name, domain, path, context length, GPU offload, memory flags.
- Inference settings: temperature, top-p, top-k, max tokens.
- Backend settings: host, port, API URL, client identifier, passkey, verbose errors.
- UI state: active tab, test result list, expanded result.

Important functions:

- `useEffect([host, port])`
  - Recalculates `apiUrl` as `http://host:port`.

- `addTestResult(name, status, message)`
  - Prepends a result and keeps only the latest 10.

- `testModelConfig()`
  - Builds a config object and records success.
  - Does not actually call LM Studio.

- `testInferenceOptions()`
  - Validates temperature, top-p, top-k, and max token ranges.

- `testBackendConnection()`
  - Fetches `${apiUrl}/models`.
  - This does not match the Node backend route names, which are `/v1/models` and `/api/models`.

- `testAllSettings()`
  - Runs model, inference, and backend checks.

- `exportSettings()`
  - Builds a JSON blob and triggers browser download.
  - Does not export the client passkey.

- `importSettings(event)`
  - Reads JSON from uploaded file.
  - Updates state groups if corresponding sections exist.

- `resetSettings()`
  - Restores hard-coded defaults.

- `clearResults()`
  - Clears result history.

## X-DEV-LM-Studio/src/settingsIntegration.ts

This file is an example/helper module for using UI settings with LM Studio.

Important exports:

- `ExportedSettings`
  - Shared settings shape.

- `loadModelWithSettings(settings)`
  - Creates `LMStudioClient`.
  - Loads an LLM model with configured model options.
  - Current code uses constructor/load option names that fail TypeScript against the installed SDK.

- `generateWithSettings(model, prompt, settings)`
  - Calls `model.predict`.
  - Backend code uses `model.complete`; this indicates API drift or mixed examples.

- `chatWithSettings(model, messages, settings)`
  - Calls `model.respond`.

- `createEmbeddingsWithSettings(settings, texts)`
  - Loads embedding model and embeds each text.

- `validateSettings(settings)`
  - Validates required model name, context lower bound, inference ranges, host, and port.

- `createDefaultSettings(overrides)`
  - Builds default settings and shallow-merges nested override objects.

- `batchProcessWithSettings(model, prompts, settings)`
  - Runs generation sequentially.
  - Captures per-prompt success/error status.

- `completeWorkflow()`
  - Demonstrates create, validate, load, generate, and batch process.

- `SettingsManager`
  - Holds settings in memory.
  - Supports get/update/validate/export/import/load/generate/chat/reset.

## X-DEV-LM-Studio/src/settingsUI.test.ts

This is a hand-rolled test runner, not a Jest/Vitest test suite.

Covered logic:

- Default settings validation.
- Invalid model name, temperature, top-p, top-k, max tokens, context length, and port.
- Valid boundary values.
- SettingsManager defaults, custom settings, updates, validation, export/import, reset.
- Settings creation with overrides.
- Edge cases such as empty inference options and special characters.
- Export/import round trip.

Current issues:

- There is no npm script that runs this test successfully.
- It is included in `tsconfig` and contributes to compile failure.
- One test creates a partial backend override that TypeScript rejects because `port` is required in `ExportedSettings.backend`.

## X-DEV-Obsidian/src/main.ts

### Settings

- `XDevLlmSettings`
  - Stores LM Studio base URL, model name, system prompt, temperature, max tokens, and auto-connect.

- `DEFAULT_SETTINGS`
  - Defaults to `ws://127.0.0.1:1234`.
  - Uses a concise Obsidian assistant system prompt.
  - Temperature default is `0.4`.
  - Max tokens default is `512`.

### LmStudioService

- Constructor
  - Stores normalized base URL.

- `respond(prompt, settings)`
  - Lazily creates LM Studio client.
  - Resolves explicit model or default active model.
  - Creates a chat with system and user messages.
  - Calls `model.respond` with temperature and max tokens.
  - Converts max tokens `0` to `false`, allowing unlimited/SDK default behavior.

- `getClient()`
  - Lazy client creation.
  - Reuses client after first call.

### Utility Functions

- `normalizeBaseUrl(raw)`
  - Trims trailing slashes.
  - Converts HTTP(S) to WS(S).
  - Leaves already-websocket URLs unchanged.

- `getMarkdownText(view)`
  - Returns selected text if present.
  - Otherwise returns the whole active editor text.

### PromptModal

- Constructor
  - Stores title, placeholder, and submit callback.

- `onOpen()`
  - Builds modal DOM.
  - Adds textarea.
  - Adds Cancel and Run buttons.
  - Validates non-empty prompt before calling submit.

### XDevLlmPlugin

- `onload()`
  - Loads settings.
  - Creates service.
  - Adds ribbon icon.
  - Registers connect, ask, and summarize commands.
  - Adds settings tab.
  - Shows ready notice when auto-connect is enabled.

- `onunload()`
  - Clears service reference.

- `loadSettings()`
  - Merges stored plugin data into defaults.

- `saveSettings()`
  - Persists settings.
  - Recreates service so URL changes take effect.

- `openPromptModal()`
  - Opens prompt modal.
  - Sends submitted prompt to LM Studio.
  - Shows the first 250 characters in an Obsidian notice.

- `summarizeActiveNote()`
  - Requires active markdown view.
  - Reads selected text or full note.
  - Sends a summarization prompt.
  - Shows the first 250 characters in a notice.

- `getService()`
  - Lazily recreates service if missing.

### XDevLlmSettingTab

- `display()`
  - Clears settings UI.
  - Adds settings controls for:
    - LM Studio base URL.
    - Model name.
    - System prompt.
    - Temperature.
    - Max tokens.
    - Auto connect.
  - Saves settings on each change.

## Root Scripts

- `build-help.js`
  - Prints categorized command reference.

- `install-and-build.ps1`
  - Windows installer/builder.
  - Installs dependencies when `node_modules` is absent.
  - Builds selected workspace(s).
  - Optional watch/start modes.

- `install-and-build.sh`
  - Bash installer/builder.
  - Installs dependencies when missing.
  - Builds projects directly and in parallel.
  - Optional watch/start modes.
