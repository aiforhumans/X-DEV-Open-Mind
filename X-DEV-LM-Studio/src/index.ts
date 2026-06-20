import { createServer, type IncomingMessage, type Server, type ServerResponse } from "http";
import path from "path";
import { LMStudioClient, tool, type ChatLike, type ChatMessage, type ChatMessageInput, type FileHandle, type LLMActionOpts, type LLMPredictionOpts, type LLMRespondOpts, type Tool } from "@lmstudio/sdk";
import { z } from "zod";

export type ModelDomain = "llm" | "embedding";

export interface ModelConfig {
  name: string;
  domain?: ModelDomain;
  path?: string;
  contextLength?: number;
  gpuOffload?: number;
  keepModelInMemory?: boolean;
  tryMmap?: boolean;
  loadOptions?: Record<string, unknown>;
}

export interface InferenceOptions {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
}

export interface ApiMessageInput {
  role?: "system" | "user" | "assistant";
  content?: string;
  images?: string[];
}

export interface CompleteRequest {
  model?: string;
  prompt: string;
  options?: LLMPredictionOpts;
  stream?: boolean;
}

export interface RespondRequest {
  model?: string;
  messages: ApiMessageInput[];
  options?: LLMRespondOpts;
  stream?: boolean;
}

export interface ActRequest {
  model?: string;
  messages: ApiMessageInput[];
  options?: LLMActionOpts;
  toolNames?: BuiltinToolName[];
  stream?: boolean;
}

export interface EmbedRequest {
  model?: string;
  input: string | string[];
}

export interface FileRequest {
  path?: string;
  base64?: string;
  fileName?: string;
}

export interface RetrieveRequest {
  query: string;
  files: FileRequest[];
}

export interface ParseDocumentRequest {
  file: FileRequest;
}

export interface BackendOptions {
  host?: string;
  port?: number;
  apiUrl?: string;
  clientIdentifier?: string;
  clientPasskey?: string;
  verboseErrorMessages?: boolean;
  client?: LMStudioClient;
}

export interface JsonError {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

type SerializableMessage = {
  role: string;
  content: string;
  toolCalls?: unknown[];
  toolResults?: unknown[];
  hasFiles?: boolean;
};

const BUILTIN_TOOL_NAMES = [
  "list_downloaded_models",
  "list_loaded_models",
  "prepare_file",
  "prepare_image",
  "parse_document",
  "retrieve_documents",
] as const;

export type BuiltinToolName = (typeof BUILTIN_TOOL_NAMES)[number];

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function normalizeBaseUrl(apiUrl: string): string {
  if (apiUrl.startsWith("ws://") || apiUrl.startsWith("wss://")) {
    return apiUrl;
  }
  if (apiUrl.startsWith("http://")) {
    return `ws://${apiUrl.slice("http://".length)}`;
  }
  if (apiUrl.startsWith("https://")) {
    return `wss://${apiUrl.slice("https://".length)}`;
  }
  return `ws://${apiUrl.replace(/^\/+/, "")}`;
}

function jsonResponse(res: ServerResponse, statusCode: number, body: unknown): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

function textResponse(res: ServerResponse, statusCode: number, body: string): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/plain; charset=utf-8");
  res.end(body);
}

function htmlResponse(res: ServerResponse, statusCode: number, body: string): void {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.end(body);
}

function getUiHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>LM Studio UI</title>
    <style>
      :root {
        color-scheme: dark;
        --bg: #0b1020;
        --surface: #101934;
        --surface-2: #141f3f;
        --text: #e7ecff;
        --muted: #9db0e4;
        --accent: #5a8cff;
        --ok: #14c38e;
        --error: #ff6b6b;
        --border: #2a3a66;
      }
      * {
        box-sizing: border-box;
      }
      body {
        margin: 0;
        font-family: Inter, Segoe UI, Arial, sans-serif;
        background: radial-gradient(circle at top, #13214a, var(--bg));
        color: var(--text);
        min-height: 100vh;
      }
      .wrap {
        width: min(920px, calc(100% - 24px));
        margin: 24px auto;
      }
      .panel {
        background: color-mix(in srgb, var(--surface), transparent 10%);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 16px;
        margin-bottom: 14px;
      }
      h1 {
        margin: 0 0 8px;
        font-size: 1.35rem;
      }
      .muted {
        color: var(--muted);
        margin: 0;
      }
      .row {
        display: grid;
        grid-template-columns: 1fr auto auto;
        gap: 10px;
      }
      input,
      select,
      textarea,
      button {
        font: inherit;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--surface-2);
        color: var(--text);
      }
      input,
      select,
      textarea {
        padding: 10px 12px;
        width: 100%;
      }
      textarea {
        min-height: 140px;
        resize: vertical;
      }
      button {
        padding: 10px 14px;
        cursor: pointer;
      }
      button.primary {
        border-color: #3a64d8;
        background: linear-gradient(180deg, #4f7efb, #3f63d1);
      }
      .status {
        margin-top: 10px;
        font-size: 0.95rem;
      }
      .status.ok {
        color: var(--ok);
      }
      .status.error {
        color: var(--error);
      }
      .actions {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }
      .result {
        white-space: pre-wrap;
        line-height: 1.5;
        background: #0d1530;
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 12px;
        min-height: 80px;
      }
      .tabs {
        display: flex;
        gap: 8px;
        margin-bottom: 14px;
        border-bottom: 1px solid var(--border);
      }
      .tab-button {
        padding: 10px 14px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--muted);
        cursor: pointer;
      }
      .tab-button.active {
        color: var(--accent);
        border-bottom-color: var(--accent);
      }
      .tab-content {
        display: none;
      }
      .tab-content.active {
        display: block;
      }
      .slider-group {
        margin-top: 12px;
      }
      .slider-label {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 4px;
        font-size: 0.9rem;
      }
      input[type="range"] {
        width: 100%;
        padding: 0;
      }
      .model-status {
        display: grid;
        gap: 8px;
        margin-top: 10px;
      }
      .model-item {
        padding: 8px 12px;
        border: 1px solid var(--border);
        border-radius: 8px;
        background: var(--surface);
      }
      .model-item.loaded {
        border-color: var(--ok);
      }
      .model-item.empty {
        color: var(--muted);
      }
      .spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid var(--muted);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        vertical-align: -2px;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }
      .toast-container {
        position: fixed;
        top: 16px;
        right: 16px;
        display: grid;
        gap: 8px;
        z-index: 1000;
        pointer-events: none;
      }
      .toast {
        pointer-events: auto;
        padding: 10px 12px;
        border-radius: 8px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
      }
      .toast.success {
        border-color: var(--ok);
      }
      .toast.error {
        border-color: var(--error);
      }
    </style>
  </head>
  <body>
    <main class="wrap">
      <section class="panel">
        <h1>LM Studio Local UI</h1>
        <p class="muted">Load a local model and send prompts through this backend.</p>
        <div id="health" class="status muted">Checking backend health...</div>
      </section>

      <div class="tabs">
        <button class="tab-button active" data-tab="settingsTab">Settings</button>
        <button class="tab-button" data-tab="playgroundTab">Playground</button>
      </div>

      <div id="settingsTab" class="tab-content active">
        <section class="panel">
          <h1>Model</h1>
          <div class="row">
            <select id="modelSelect"></select>
            <button id="refreshBtn">Refresh</button>
            <button id="loadBtn" class="primary">Load selected</button>
          </div>
          <div id="modelStatus" class="status muted"></div>
        </section>

        <section class="panel">
          <h1>Prompt</h1>
          <textarea id="promptInput" placeholder="Ask your local model..."></textarea>
          <div class="actions" style="margin-top: 10px">
            <button id="sendBtn" class="primary">Send</button>
            <button id="clearBtn">Clear</button>
          </div>
          <div id="result" class="result" style="margin-top: 10px"></div>
        </section>
      </div>

      <div id="playgroundTab" class="tab-content">
        <section class="panel">
          <h1>Model Status</h1>
          <div class="model-status">
            <div id="playgroundLlmStatus" class="model-item empty">LLM: None loaded</div>
            <div id="playgroundEmbeddingStatus" class="model-item empty">Embedding: None loaded</div>
          </div>
        </section>

        <section class="panel">
          <h1>Interactive Playground</h1>
          <div class="row">
            <select id="playgroundModelSelect"></select>
            <button id="playgroundRefreshBtn">Refresh</button>
            <button id="playgroundLoadBtn" class="primary">Load selected</button>
          </div>
          <textarea id="playgroundPrompt" placeholder="Enter a prompt to test the model..." style="margin-top: 12px"></textarea>
          <div class="slider-group">
            <div class="slider-label">
              <span>Temperature</span>
              <span id="temperatureValue">0.7</span>
            </div>
            <input id="temperature" type="range" min="0" max="2" step="0.1" value="0.7" />
          </div>
          <div class="slider-group">
            <div class="slider-label">
              <span>Max tokens</span>
              <span id="maxTokensValue">512</span>
            </div>
            <input id="maxTokens" type="range" min="1" max="4096" step="1" value="512" />
          </div>
          <div class="actions" style="margin-top: 16px">
            <button id="playgroundSendBtn" class="primary">Send</button>
            <button id="playgroundCopyBtn">Copy</button>
          </div>
          <div id="playgroundResult" class="result" style="margin-top: 10px"></div>
          <div id="playgroundStats" class="status muted"></div>
        </section>
      </div>
    </main>

    <div id="toastContainer" class="toast-container"></div>

    <script>
      const healthEl = document.getElementById("health");
      const modelSelect = document.getElementById("modelSelect");
      const modelStatus = document.getElementById("modelStatus");
      const resultEl = document.getElementById("result");
      const promptInput = document.getElementById("promptInput");
      const refreshBtn = document.getElementById("refreshBtn");
      const loadBtn = document.getElementById("loadBtn");
      const sendBtn = document.getElementById("sendBtn");
      const clearBtn = document.getElementById("clearBtn");
      const playgroundModelSelect = document.getElementById("playgroundModelSelect");
      const playgroundRefreshBtn = document.getElementById("playgroundRefreshBtn");
      const playgroundLoadBtn = document.getElementById("playgroundLoadBtn");
      const playgroundPrompt = document.getElementById("playgroundPrompt");
      const playgroundSendBtn = document.getElementById("playgroundSendBtn");
      const playgroundCopyBtn = document.getElementById("playgroundCopyBtn");
      const playgroundResult = document.getElementById("playgroundResult");
      const playgroundStats = document.getElementById("playgroundStats");
      const playgroundLlmStatus = document.getElementById("playgroundLlmStatus");
      const playgroundEmbeddingStatus = document.getElementById("playgroundEmbeddingStatus");
      const temperatureInput = document.getElementById("temperature");
      const maxTokensInput = document.getElementById("maxTokens");
      const temperatureValue = document.getElementById("temperatureValue");
      const maxTokensValue = document.getElementById("maxTokensValue");
      const toastContainer = document.getElementById("toastContainer");

      function setStatus(el, text, type) {
        el.textContent = text;
        el.className = "status " + (type || "muted");
      }

      function showToast(message, type) {
        const toast = document.createElement("div");
        toast.className = "toast " + (type || "muted");
        toast.textContent = message;
        toastContainer.appendChild(toast);
        window.setTimeout(function () {
          toast.remove();
        }, 3000);
      }

      function setBusy(button, busy, label) {
        if (busy) {
          button.dataset.label = button.textContent;
          button.disabled = true;
          button.innerHTML = '<span class="spinner"></span> ' + label;
          return;
        }
        button.disabled = false;
        if (button.dataset.label) {
          button.textContent = button.dataset.label;
        }
      }

      function pickModelKey(model) {
        if (typeof model === "string") return model;
        if (!model || typeof model !== "object") return "";
        return (
          model.identifier ||
          model.modelKey ||
          model.path ||
          model.name ||
          model.id ||
          ""
        );
      }

      function getErrorMessage(payload) {
        if (payload && payload.error && payload.error.message) {
          return payload.error.message;
        }
        return typeof payload === "string" ? payload : "Request failed.";
      }

      async function requestJson(url, options) {
        const response = await fetch(url, options);
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(getErrorMessage(payload));
        }
        return payload;
      }

      function extractStatsText(stats) {
        if (!stats || typeof stats !== "object") {
          return "";
        }

        const parts = [];
        if (typeof stats.inputTokens === "number") parts.push("input: " + stats.inputTokens);
        if (typeof stats.outputTokens === "number") parts.push("output: " + stats.outputTokens);
        if (typeof stats.completionTokens === "number") parts.push("completion: " + stats.completionTokens);
        if (typeof stats.totalTokens === "number") parts.push("total: " + stats.totalTokens);
        return parts.join(" | ");
      }

      function populateModelSelects(models, loadedKey) {
        const selects = [modelSelect, playgroundModelSelect];
        for (const select of selects) {
          select.innerHTML = "";
          for (const model of models) {
            const key = pickModelKey(model);
            if (!key) continue;
            const option = document.createElement("option");
            option.value = key;
            option.textContent = key;
            option.selected = key === loadedKey;
            select.append(option);
          }

          if (!select.value && loadedKey) {
            const fallback = document.createElement("option");
            fallback.value = loadedKey;
            fallback.textContent = loadedKey;
            fallback.selected = true;
            select.append(fallback);
          }
        }
      }

      async function refreshModels() {
        setStatus(modelStatus, "Loading model list...", "muted");
        try {
          const [downloaded, loaded] = await Promise.all([
            requestJson("/v1/models?domain=llm"),
            requestJson("/v1/models/loaded?domain=llm"),
          ]);

          const models = Array.isArray(downloaded.data) ? downloaded.data : [];
          const loadedModels = Array.isArray(loaded.data) ? loaded.data : [];
          const loadedKey = pickModelKey(loadedModels[0]) || "";

          populateModelSelects(models, loadedKey);

          if (modelSelect.options.length === 0) {
            setStatus(modelStatus, "No downloaded models found in LM Studio.", "error");
            return;
          }

          if (loadedKey) {
            setStatus(modelStatus, "Loaded model: " + loadedKey, "ok");
          } else {
            setStatus(modelStatus, "No model is currently loaded.", "muted");
          }
        } catch (error) {
          setStatus(modelStatus, error.message, "error");
        }
      }

      async function refreshPlaygroundStatus() {
        try {
          const [llmLoaded, embeddingLoaded] = await Promise.all([
            requestJson("/v1/models/loaded?domain=llm"),
            requestJson("/v1/models/loaded?domain=embedding"),
          ]);

          const llm = Array.isArray(llmLoaded.data) && llmLoaded.data.length > 0 ? pickModelKey(llmLoaded.data[0]) : "";
          const embedding = Array.isArray(embeddingLoaded.data) && embeddingLoaded.data.length > 0 ? pickModelKey(embeddingLoaded.data[0]) : "";

          playgroundLlmStatus.textContent = llm ? "LLM: " + llm : "LLM: None loaded";
          playgroundLlmStatus.className = "model-item " + (llm ? "loaded" : "empty");
          playgroundEmbeddingStatus.textContent = embedding ? "Embedding: " + embedding : "Embedding: None loaded";
          playgroundEmbeddingStatus.className = "model-item " + (embedding ? "loaded" : "empty");
        } catch {
          playgroundLlmStatus.textContent = "LLM: unavailable";
          playgroundEmbeddingStatus.textContent = "Embedding: unavailable";
        }
      }

      async function loadSelectedModel() {
        const model = modelSelect.value;
        if (!model) {
          setStatus(modelStatus, "Select a model first.", "error");
          showToast("Select a model first.", "error");
          return;
        }
        setStatus(modelStatus, "Loading " + model + "...", "muted");
        setBusy(loadBtn, true, "Loading");
        try {
          await requestJson("/v1/models/load", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: model, domain: "llm" }),
          });
          setStatus(modelStatus, "Loaded model: " + model, "ok");
          showToast("Loaded model: " + model, "success");
          await refreshPlaygroundStatus();
        } catch (error) {
          setStatus(modelStatus, error.message, "error");
          showToast(error.message, "error");
        } finally {
          setBusy(loadBtn, false);
        }
      }

      async function sendPrompt() {
        const prompt = promptInput.value.trim();
        if (!prompt) {
          resultEl.textContent = "Type a prompt first.";
          showToast("Type a prompt first.", "error");
          return;
        }
        resultEl.textContent = "Generating...";
        setBusy(sendBtn, true, "Sending");
        try {
          const payload = await requestJson("/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [{ role: "user", content: prompt }],
              model: modelSelect.value || undefined,
            }),
          });
          resultEl.textContent = payload.content || JSON.stringify(payload, null, 2);
          showToast("Response received.", "success");
        } catch (error) {
          resultEl.textContent = "Error: " + error.message;
          showToast(error.message, "error");
        } finally {
          setBusy(sendBtn, false);
        }
      }

      async function loadPlaygroundModel() {
        const model = playgroundModelSelect.value;
        if (!model) {
          showToast("Select a model first.", "error");
          return;
        }

        setBusy(playgroundLoadBtn, true, "Loading");
        try {
          await requestJson("/v1/models/load", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: model, domain: "llm" }),
          });
          showToast("Loaded model: " + model, "success");
          await refreshModels();
          await refreshPlaygroundStatus();
        } catch (error) {
          showToast(error.message, "error");
        } finally {
          setBusy(playgroundLoadBtn, false);
        }
      }

      async function sendPlaygroundPrompt() {
        const prompt = playgroundPrompt.value.trim();
        if (!prompt) {
          showToast("Enter a prompt first.", "error");
          return;
        }

        const temperature = Number(temperatureInput.value);
        const maxTokens = Number(maxTokensInput.value);

        playgroundResult.innerHTML = '<span class="spinner"></span> Generating...';
        playgroundStats.textContent = "";
        setBusy(playgroundSendBtn, true, "Sending");

        try {
          const payload = await requestJson("/v1/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: prompt,
              model: playgroundModelSelect.value || undefined,
              options: {
                temperature: temperature,
                maxTokens: maxTokens,
              },
            }),
          });

          playgroundResult.textContent = payload.content || JSON.stringify(payload, null, 2);
          playgroundStats.textContent = extractStatsText(payload.stats);
          showToast("Playground response received.", "success");
        } catch (error) {
          playgroundResult.textContent = "Error: " + error.message;
          showToast(error.message, "error");
        } finally {
          setBusy(playgroundSendBtn, false);
        }
      }

      async function copyPlaygroundResult() {
        const text = playgroundResult.textContent.trim();
        if (!text) {
          showToast("Nothing to copy.", "error");
          return;
        }

        try {
          await navigator.clipboard.writeText(text);
          showToast("Copied to clipboard.", "success");
        } catch {
          showToast("Copy failed.", "error");
        }
      }

      function updateTemperatureValue() {
        temperatureValue.textContent = temperatureInput.value;
      }

      function updateMaxTokensValue() {
        maxTokensValue.textContent = maxTokensInput.value;
      }

      async function init() {
        try {
          const health = await requestJson("/health");
          setStatus(healthEl, health.ok ? "Backend healthy (" + (health.baseUrl || "") + ")" : "Backend unhealthy", health.ok ? "ok" : "error");
        } catch (error) {
          setStatus(healthEl, "Health check failed: " + error.message, "error");
        }
        await refreshModels();
        await refreshPlaygroundStatus();
      }

      document.querySelectorAll(".tab-button").forEach(function (button) {
        button.addEventListener("click", function () {
          const tabId = button.getAttribute("data-tab");
          document.querySelectorAll(".tab-button").forEach(function (other) {
            other.classList.remove("active");
          });
          document.querySelectorAll(".tab-content").forEach(function (tab) {
            tab.classList.remove("active");
          });
          button.classList.add("active");
          document.getElementById(tabId).classList.add("active");
          if (tabId === "playgroundTab") {
            void refreshPlaygroundStatus();
          }
        });
      });

      refreshBtn.addEventListener("click", refreshModels);
      loadBtn.addEventListener("click", loadSelectedModel);
      sendBtn.addEventListener("click", sendPrompt);
      clearBtn.addEventListener("click", () => {
        promptInput.value = "";
        resultEl.textContent = "";
      });
      playgroundRefreshBtn.addEventListener("click", function () {
        void refreshModels();
        void refreshPlaygroundStatus();
      });
      playgroundLoadBtn.addEventListener("click", function () {
        void loadPlaygroundModel();
      });
      playgroundSendBtn.addEventListener("click", function () {
        void sendPlaygroundPrompt();
      });
      playgroundCopyBtn.addEventListener("click", function () {
        void copyPlaygroundResult();
      });
      temperatureInput.addEventListener("input", updateTemperatureValue);
      maxTokensInput.addEventListener("input", updateMaxTokensValue);
      void init();
      void updateTemperatureValue();
      void updateMaxTokensValue();
      window.setInterval(function () {
        void refreshPlaygroundStatus();
      }, 5000);
    </script>
  </body>
</html>`;
}

export async function readJsonBody(req: IncomingMessage, limitBytes = 10 * 1024 * 1024): Promise<unknown> {
  const chunks: Buffer[] = [];
  let size = 0;

  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += buffer.length;
    if (size > limitBytes) {
      throw new ApiError(413, "payload_too_large", "Request body is too large.");
    }
    chunks.push(buffer);
  }

  if (chunks.length === 0) {
    return {};
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw) as unknown;
  } catch {
    throw new ApiError(400, "invalid_json", "Request body must be valid JSON.");
  }
}

export function getString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new ApiError(400, "invalid_request", `Field "${field}" must be a non-empty string.`);
  }
  return value;
}

export function getOptionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

export function getOptionalBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

export function getOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

export function toSerializableError(error: unknown): JsonError {
  if (error instanceof ApiError) {
    return {
      error: {
        message: error.message,
        code: error.code,
        details: error.details,
      },
    };
  }

  if (error instanceof Error) {
    return {
      error: {
        message: error.message,
        code: "internal_error",
      },
    };
  }

  return {
    error: {
      message: "Unknown error",
      code: "internal_error",
      details: error,
    },
  };
}

export async function prepareImages(client: LMStudioClient, imagePaths: unknown): Promise<FileHandle[]> {
  if (!Array.isArray(imagePaths)) {
    return [];
  }

  const paths = imagePaths.map((value) => getString(value, "images"));
  return Promise.all(paths.map((imagePath) => client.files.prepareImage(path.resolve(imagePath))));
}

export function serializeFileHandle(file: FileHandle, absolutePath?: string): Record<string, unknown> {
  return {
    identifier: file.identifier,
    name: file.name,
    type: file.type,
    sizeBytes: file.sizeBytes,
    isImage: file.isImage(),
    absolutePath,
  };
}

export function serializeMessage(message: ChatMessage): SerializableMessage {
  const role = message.getRole();
  const content = message.getText();
  return {
    role,
    content,
    toolCalls: message.getToolCallRequests(),
    toolResults: message.getToolCallResults(),
    hasFiles: message.hasFiles(),
  };
}

export async function normalizeChatMessages(messages: ApiMessageInput[], client: LMStudioClient): Promise<ChatMessageInput[]> {
  return Promise.all(
    messages.map(async (message) => {
      const images = await prepareImages(client, message.images);
      return {
        role: message.role ?? "user",
        content: message.content ?? "",
        images,
      };
    })
  );
}

export function pickBuiltInTools(toolNames: BuiltinToolName[], backend: LMStudioServer): Tool[] {
  const tools: Tool[] = [];
  const emptyParameters = {} as Record<string, { parse(input: any): any }>;

  for (const name of toolNames) {
    switch (name) {
      case "list_downloaded_models":
        tools.push(
          tool({
            name,
            description: "List downloaded LM Studio models.",
            parameters: emptyParameters,
            implementation: async () => backend.listModels(),
          })
        );
        break;
      case "list_loaded_models":
        tools.push(
          tool({
            name,
            description: "List currently loaded LM Studio models.",
            parameters: {
              domain: z.enum(["llm", "embedding"]).optional(),
            },
            implementation: async ({ domain }) => backend.listLoadedModels(domain),
          })
        );
        break;
      case "prepare_file":
        tools.push(
          tool({
            name,
            description: "Prepare a local file for retrieval or document parsing.",
            parameters: {
              path: z.string(),
            },
            implementation: async ({ path: filePath }) => backend.prepareFile(filePath),
          })
        );
        break;
      case "prepare_image":
        tools.push(
          tool({
            name,
            description: "Prepare a local image for vision models.",
            parameters: {
              path: z.string(),
            },
            implementation: async ({ path: imagePath }) => backend.prepareImage(imagePath),
          })
        );
        break;
      case "parse_document":
        tools.push(
          tool({
            name,
            description: "Parse a document into text and metadata.",
            parameters: {
              path: z.string(),
            },
            implementation: async ({ path: documentPath }) => backend.parseDocument({ path: documentPath }),
          })
        );
        break;
      case "retrieve_documents":
        tools.push(
          tool({
            name,
            description: "Retrieve relevant document passages from local files.",
            parameters: {
              query: z.string(),
              files: z.array(z.string()),
            },
            implementation: async ({ query, files }) =>
              backend.retrieveDocuments({
                query,
                files: files.map((filePath) => ({ path: filePath })),
              }),
          })
        );
        break;
      default:
        throw new ApiError(400, "unknown_tool", `Unknown built-in tool "${name}".`);
    }
  }

  return tools;
}

export class LMStudioServer {
  private readonly client: LMStudioClient;
  private readonly baseUrl: string;
  private readonly currentModels: Record<ModelDomain, string | null> = {
    llm: null,
    embedding: null,
  };
  private server: Server | null = null;

  constructor(apiUrl = "http://localhost:1234", options: BackendOptions = {}) {
    this.baseUrl = normalizeBaseUrl(options.apiUrl ?? apiUrl);
    this.client =
      options.client ??
      new LMStudioClient({
        baseUrl: this.baseUrl,
        clientIdentifier: options.clientIdentifier,
        clientPasskey: options.clientPasskey,
        verboseErrorMessages: options.verboseErrorMessages,
      });
  }

  async loadModel(config: ModelConfig): Promise<void> {
    await this.loadModelByDomain(config.domain ?? "llm", config);
  }

  async unloadModel(identifier?: string, domain: ModelDomain = "llm"): Promise<void> {
    if (identifier) {
      await this.getNamespace(domain).unload(identifier);
      if (this.currentModels[domain] === identifier) {
        this.currentModels[domain] = null;
      }
      return;
    }

    const loaded = await this.getNamespace(domain).listLoaded();
    if (loaded.length === 0) {
      this.currentModels[domain] = null;
      return;
    }

    await this.getNamespace(domain).unload(loaded[0].identifier);
    this.currentModels[domain] = null;
  }

  async infer(prompt: string, options?: InferenceOptions): Promise<string> {
    const model = await this.client.llm.model();
    const prediction = model.complete(prompt, this.mapPredictionOptions(options));
    const result = await prediction.result();
    return result.content;
  }

  async listModels(domain?: ModelDomain): Promise<unknown[]> {
    if (domain === "llm") {
      return this.client.system.listDownloadedModels("llm");
    }
    if (domain === "embedding") {
      return this.client.system.listDownloadedModels("embedding");
    }
    return this.client.system.listDownloadedModels();
  }

  async listLoadedModels(domain: ModelDomain = "llm"): Promise<unknown[]> {
    return this.getNamespace(domain).listLoaded();
  }

  getCurrentModel(): string | null {
    return this.currentModels.llm;
  }

  async prepareFile(filePath: string): Promise<Record<string, unknown>> {
    const file = await this.client.files.prepareFile(path.resolve(filePath));
    return serializeFileHandle(file, await file.getFilePath());
  }

  async prepareImage(imagePath: string): Promise<Record<string, unknown>> {
    const file = await this.client.files.prepareImage(path.resolve(imagePath));
    return serializeFileHandle(file, await file.getFilePath());
  }

  async parseDocument(file: FileRequest): Promise<Record<string, unknown>> {
    const handle = await this.prepareDocumentHandle(file);
    const result = await this.client.files.parseDocument(handle);
    return result as unknown as Record<string, unknown>;
  }

  async retrieveDocuments(request: RetrieveRequest): Promise<Record<string, unknown>> {
    const handles = await Promise.all(request.files.map((file) => this.prepareDocumentHandle(file)));
    const result = await this.client.files.retrieve(request.query, handles);
    return result as unknown as Record<string, unknown>;
  }

  async start(port = 3000, host = "127.0.0.1"): Promise<Server> {
    if (this.server) {
      return this.server;
    }

    this.server = createServer((req, res) => {
      void this.handleRequest(req, res);
    });

    await new Promise<void>((resolve, reject) => {
      const onError = (error: Error): void => {
        this.server?.off("error", onError);
        reject(error);
      };

      this.server?.once("error", onError);
      this.server?.listen(port, host, () => {
        this.server?.off("error", onError);
        resolve();
      });
    });

    return this.server;
  }

  async stop(): Promise<void> {
    if (!this.server) {
      return;
    }

    const server = this.server;
    this.server = null;

    await new Promise<void>((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      if (!req.url || !req.method) {
        throw new ApiError(400, "invalid_request", "Request URL and method are required.");
      }

      const url = new URL(req.url, "http://localhost");
      const method = req.method.toUpperCase();
      const body = method === "GET" || method === "HEAD" ? {} : await readJsonBody(req);

      if (method === "GET" && (url.pathname === "/health" || url.pathname === "/api/health")) {
        jsonResponse(res, 200, await this.getHealth());
        return;
      }

      if (method === "GET" && (url.pathname === "/v1/models" || url.pathname === "/api/models")) {
        jsonResponse(res, 200, { data: await this.listModels(this.readDomain(url)) });
        return;
      }

      if (method === "GET" && (url.pathname === "/api/models/loaded" || url.pathname === "/v1/models/loaded")) {
        jsonResponse(res, 200, { data: await this.listLoadedModels(this.readDomain(url) ?? "llm") });
        return;
      }

      if (method === "POST" && (url.pathname === "/api/models/load" || url.pathname === "/v1/models/load")) {
        await this.loadModel(this.readModelConfig(body));
        jsonResponse(res, 200, { ok: true });
        return;
      }

      if (method === "POST" && (url.pathname === "/api/models/unload" || url.pathname === "/v1/models/unload")) {
        const domain = this.readDomain(url) ?? this.readDomainFromBody(body) ?? "llm";
        const identifier = getOptionalString(isRecord(body) ? body.identifier : undefined);
        await this.unloadModel(identifier, domain);
        jsonResponse(res, 200, { ok: true });
        return;
      }

      if (method === "POST" && (url.pathname === "/v1/completions" || url.pathname === "/api/llm/complete")) {
        const request = this.readCompleteRequest(body);
        if (request.stream || this.readStreamFlag(url)) {
          await this.streamComplete(res, request);
          return;
        }
        jsonResponse(res, 200, await this.complete(request));
        return;
      }

      if (method === "POST" && (url.pathname === "/v1/chat/completions" || url.pathname === "/api/llm/respond")) {
        const request = this.readRespondRequest(body);
        if (request.stream || this.readStreamFlag(url)) {
          await this.streamRespond(res, request);
          return;
        }
        jsonResponse(res, 200, await this.respond(request));
        return;
      }

      if (method === "POST" && (url.pathname === "/api/llm/act" || url.pathname === "/v1/llm/act")) {
        const request = this.readActRequest(body);
        if (request.stream || this.readStreamFlag(url)) {
          await this.streamAct(res, request);
          return;
        }
        jsonResponse(res, 200, await this.act(request));
        return;
      }

      if (method === "POST" && (url.pathname === "/v1/embeddings" || url.pathname === "/api/embedding/embed")) {
        jsonResponse(res, 200, await this.embed(this.readEmbedRequest(body)));
        return;
      }

      if (method === "POST" && (url.pathname === "/api/embedding/tokenize" || url.pathname === "/api/embedding/count-tokens")) {
        jsonResponse(res, 200, await this.embeddingTokens(url.pathname, body));
        return;
      }

      if (method === "POST" && (url.pathname === "/api/files/prepare-file" || url.pathname === "/api/files/prepare-image")) {
        jsonResponse(res, 200, await this.prepareFileEndpoint(url.pathname, body));
        return;
      }

      if (method === "POST" && (url.pathname === "/api/files/parse-document" || url.pathname === "/api/files/retrieve")) {
        jsonResponse(res, 200, await this.documentEndpoint(url.pathname, body));
        return;
      }

      if (method === "GET" && url.pathname === "/") {
        htmlResponse(res, 200, getUiHtml());
        return;
      }

      throw new ApiError(404, "not_found", `No route matches ${method} ${url.pathname}.`);
    } catch (error) {
      jsonResponse(res, error instanceof ApiError ? error.statusCode : 500, toSerializableError(error));
    }
  }

  private async getHealth(): Promise<Record<string, unknown>> {
    return {
      ok: true,
      baseUrl: this.baseUrl,
    };
  }

  private readDomain(url: URL): ModelDomain | undefined {
    const domain = url.searchParams.get("domain");
    return domain === "llm" || domain === "embedding" ? domain : undefined;
  }

  private readDomainFromBody(body: unknown): ModelDomain | undefined {
    if (!isRecord(body)) {
      return undefined;
    }
    const domain = body.domain;
    return domain === "llm" || domain === "embedding" ? domain : undefined;
  }

  private readStreamFlag(url: URL): boolean {
    const value = url.searchParams.get("stream");
    return value === "1" || value === "true";
  }

  private readModelConfig(body: unknown): ModelConfig {
    if (!isRecord(body)) {
      throw new ApiError(400, "invalid_request", "Model configuration must be an object.");
    }

    return {
      name: getString(body.name ?? body.model ?? body.modelKey, "name"),
      domain: this.readDomainFromBody(body),
      path: getOptionalString(body.path),
      contextLength: getOptionalNumber(body.contextLength),
      gpuOffload: getOptionalNumber(body.gpuOffload),
      keepModelInMemory: getOptionalBoolean(body.keepModelInMemory),
      tryMmap: getOptionalBoolean(body.tryMmap),
      loadOptions: isRecord(body.loadOptions) ? body.loadOptions : undefined,
    };
  }

  private readCompleteRequest(body: unknown): CompleteRequest {
    if (!isRecord(body)) {
      throw new ApiError(400, "invalid_request", "Completion request must be an object.");
    }

    return {
      model: getOptionalString(body.model ?? body.modelKey),
      prompt: getString(body.prompt, "prompt"),
      options: isRecord(body.options) ? (body.options as LLMPredictionOpts) : undefined,
      stream: getOptionalBoolean(body.stream),
    };
  }

  private readRespondRequest(body: unknown): RespondRequest {
    if (!isRecord(body)) {
      throw new ApiError(400, "invalid_request", "Chat request must be an object.");
    }

    if (!Array.isArray(body.messages)) {
      throw new ApiError(400, "invalid_request", "Field \"messages\" must be an array.");
    }

    return {
      model: getOptionalString(body.model ?? body.modelKey),
      messages: body.messages.map((message) => this.readMessageInput(message)),
      options: isRecord(body.options) ? (body.options as LLMRespondOpts) : undefined,
      stream: getOptionalBoolean(body.stream),
    };
  }

  private readActRequest(body: unknown): ActRequest {
    if (!isRecord(body)) {
      throw new ApiError(400, "invalid_request", "Act request must be an object.");
    }

    if (!Array.isArray(body.messages)) {
      throw new ApiError(400, "invalid_request", "Field \"messages\" must be an array.");
    }

    const toolNames = Array.isArray(body.toolNames)
      ? body.toolNames.filter((toolName): toolName is BuiltinToolName => BUILTIN_TOOL_NAMES.includes(toolName as BuiltinToolName))
      : undefined;

    if (Array.isArray(body.toolNames) && (!toolNames || toolNames.length !== body.toolNames.length)) {
      throw new ApiError(400, "invalid_request", "One or more tool names are invalid.");
    }

    return {
      model: getOptionalString(body.model ?? body.modelKey),
      messages: body.messages.map((message) => this.readMessageInput(message)),
      options: isRecord(body.options) ? (body.options as LLMActionOpts) : undefined,
      toolNames,
      stream: getOptionalBoolean(body.stream),
    };
  }

  private readEmbedRequest(body: unknown): EmbedRequest {
    if (!isRecord(body)) {
      throw new ApiError(400, "invalid_request", "Embedding request must be an object.");
    }

    const input = body.input;
    if (typeof input !== "string" && !Array.isArray(input)) {
      throw new ApiError(400, "invalid_request", "Field \"input\" must be a string or string array.");
    }

    if (Array.isArray(input) && input.some((value) => typeof value !== "string")) {
      throw new ApiError(400, "invalid_request", "Field \"input\" must contain only strings.");
    }

    return {
      model: getOptionalString(body.model ?? body.modelKey),
      input: input as string | string[],
    };
  }

  private readMessageInput(message: unknown): ApiMessageInput {
    if (!isRecord(message)) {
      throw new ApiError(400, "invalid_request", "Each message must be an object.");
    }

    const role = message.role;
    if (role !== undefined && role !== "system" && role !== "user" && role !== "assistant") {
      throw new ApiError(400, "invalid_request", "Message role must be system, user, or assistant.");
    }

    const images = message.images;
    if (images !== undefined && !Array.isArray(images)) {
      throw new ApiError(400, "invalid_request", "Message images must be an array of paths.");
    }

    return {
      role,
      content: getOptionalString(message.content),
      images: Array.isArray(images) ? images.map((value) => getString(value, "images")) : undefined,
    };
  }

  private async loadModelByDomain(domain: ModelDomain, config: ModelConfig): Promise<void> {
    const modelKey = config.path ?? config.name;
    const loadOptions = this.buildLoadOptions(domain, config);
    await this.getNamespace(domain).load(modelKey, loadOptions);
    this.currentModels[domain] = modelKey;
  }

  private buildLoadOptions(domain: ModelDomain, config: ModelConfig): Record<string, unknown> {
    const options: Record<string, unknown> = { ...(config.loadOptions ?? {}) };
    if (config.contextLength !== undefined) {
      options.contextLength = config.contextLength;
    }
    if (config.keepModelInMemory !== undefined) {
      options.keepModelInMemory = config.keepModelInMemory;
    }
    if (config.tryMmap !== undefined) {
      options.tryMmap = config.tryMmap;
    }
    if (config.gpuOffload !== undefined && domain === "llm") {
      options.gpu = { ratio: config.gpuOffload };
    }
    return options;
  }

  private getNamespace(domain: ModelDomain) {
    return domain === "embedding" ? this.client.embedding : this.client.llm;
  }

  private mapPredictionOptions(options?: InferenceOptions): LLMPredictionOpts | undefined {
    if (!options) {
      return undefined;
    }

    return {
      temperature: options.temperature,
      topPSampling: options.topP,
      topKSampling: options.topK,
      maxTokens: options.maxTokens,
    };
  }

  private async prepareDocumentHandle(file: FileRequest): Promise<FileHandle> {
    if (typeof file.path === "string" && file.path.trim()) {
      return this.client.files.prepareFile(path.resolve(file.path));
    }

    if (typeof file.base64 === "string" && file.base64.trim()) {
      const fileName = getString(file.fileName, "fileName");
      return this.client.files.prepareFileBase64(fileName, file.base64);
    }

    throw new ApiError(400, "invalid_request", "A file requires either a path or base64 content.");
  }

  private async complete(request: CompleteRequest): Promise<Record<string, unknown>> {
    const model = await this.resolveLlmModel(request.model);
    const prediction = model.complete(request.prompt, request.options);
    const result = await prediction.result();
    return {
      model: model.identifier,
      content: result.content,
      stats: result.stats,
    };
  }

  private async respond(request: RespondRequest): Promise<Record<string, unknown>> {
    const model = await this.resolveLlmModel(request.model);
    const messages = await normalizeChatMessages(request.messages, this.client);
    const prediction = model.respond(messages as ChatLike, request.options);
    const result = await prediction.result();
    return {
      model: model.identifier,
      content: result.content,
      stats: result.stats,
    };
  }

  private async act(request: ActRequest): Promise<Record<string, unknown>> {
    const model = await this.resolveLlmModel(request.model);
    const messages = await normalizeChatMessages(request.messages, this.client);
    const collectedMessages: SerializableMessage[] = [];
    const tools = pickBuiltInTools(request.toolNames ?? [], this);

    const result = await model.act(messages as ChatLike, tools, {
      ...(request.options ?? {}),
      onMessage: (message) => {
        collectedMessages.push(serializeMessage(message));
        request.options?.onMessage?.(message);
      },
    });

    return {
      model: model.identifier,
      rounds: result.rounds,
      totalExecutionTimeSeconds: result.totalExecutionTimeSeconds,
      messages: collectedMessages,
    };
  }

  private async embed(request: EmbedRequest): Promise<Record<string, unknown>> {
    const model = await this.resolveEmbeddingModel(request.model);
    const result = Array.isArray(request.input) ? await model.embed(request.input) : await model.embed(request.input);
    return {
      model: model.identifier,
      result,
    };
  }

  private async embeddingTokens(pathname: string, body: unknown): Promise<Record<string, unknown>> {
    if (!isRecord(body)) {
      throw new ApiError(400, "invalid_request", "Embedding request must be an object.");
    }

    const model = await this.resolveEmbeddingModel(getOptionalString(body.model ?? body.modelKey));
    const input = getString(body.input, "input");
    if (pathname.endsWith("tokenize")) {
      return {
        model: model.identifier,
        tokens: await model.tokenize(input),
      };
    }

    return {
      model: model.identifier,
      tokenCount: await model.countTokens(input),
    };
  }

  private async prepareFileEndpoint(pathname: string, body: unknown): Promise<Record<string, unknown>> {
    if (!isRecord(body)) {
      throw new ApiError(400, "invalid_request", "File request must be an object.");
    }

    const request = this.readFileRequest(body);
    if (pathname.endsWith("prepare-image")) {
      return this.prepareImageFromRequest(request);
    }
    return this.prepareFileFromRequest(request);
  }

  private async documentEndpoint(pathname: string, body: unknown): Promise<Record<string, unknown>> {
    if (pathname.endsWith("parse-document")) {
      return this.parseDocument(this.readParseDocumentRequest(body).file);
    }
    return this.retrieveDocuments(this.readRetrieveRequest(body));
  }

  private readFileRequest(body: unknown): FileRequest {
    if (!isRecord(body)) {
      throw new ApiError(400, "invalid_request", "File request must be an object.");
    }

    return {
      path: getOptionalString(body.path),
      base64: getOptionalString(body.base64),
      fileName: getOptionalString(body.fileName),
    };
  }

  private readParseDocumentRequest(body: unknown): ParseDocumentRequest {
    if (!isRecord(body)) {
      throw new ApiError(400, "invalid_request", "Parse document request must be an object.");
    }

    return {
      file: this.readFileRequest(body.file ?? body),
    };
  }

  private readRetrieveRequest(body: unknown): RetrieveRequest {
    if (!isRecord(body)) {
      throw new ApiError(400, "invalid_request", "Retrieve request must be an object.");
    }

    if (!Array.isArray(body.files)) {
      throw new ApiError(400, "invalid_request", "Field \"files\" must be an array.");
    }

    return {
      query: getString(body.query, "query"),
      files: body.files.map((file) => this.readFileRequest(isRecord(file) ? file : { path: file as string })),
    };
  }

  private async prepareFileFromRequest(file: FileRequest): Promise<Record<string, unknown>> {
    if (file.path) {
      return this.prepareFile(file.path);
    }
    if (file.base64 && file.fileName) {
      const handle = await this.client.files.prepareFileBase64(file.fileName, file.base64);
      return serializeFileHandle(handle, await handle.getFilePath());
    }
    throw new ApiError(400, "invalid_request", "A file requires either a path or base64 content.");
  }

  private async prepareImageFromRequest(file: FileRequest): Promise<Record<string, unknown>> {
    if (file.path) {
      return this.prepareImage(file.path);
    }
    if (file.base64 && file.fileName) {
      const handle = await this.client.files.prepareImageBase64(file.fileName, file.base64);
      return serializeFileHandle(handle, await handle.getFilePath());
    }
    throw new ApiError(400, "invalid_request", "An image requires either a path or base64 content.");
  }

  private async resolveLlmModel(modelKey?: string) {
    if (modelKey) {
      return this.client.llm.model(modelKey);
    }
    return this.client.llm.model();
  }

  private async resolveEmbeddingModel(modelKey?: string) {
    if (modelKey) {
      return this.client.embedding.model(modelKey);
    }
    return this.client.embedding.model();
  }

  private async streamComplete(res: ServerResponse, request: CompleteRequest): Promise<void> {
    const model = await this.resolveLlmModel(request.model);
    const prediction = model.complete(request.prompt, request.options);

    this.startStream(res);
    try {
      for await (const fragment of prediction) {
        this.writeStreamEvent(res, "fragment", fragment);
      }
      this.writeStreamEvent(res, "result", await prediction.result());
      this.endStream(res);
    } catch (error) {
      this.writeStreamEvent(res, "error", toSerializableError(error));
      this.endStream(res);
    }
  }

  private async streamRespond(res: ServerResponse, request: RespondRequest): Promise<void> {
    const model = await this.resolveLlmModel(request.model);
    const messages = await normalizeChatMessages(request.messages, this.client);
    const prediction = model.respond(messages as ChatLike, request.options);

    this.startStream(res);
    try {
      for await (const fragment of prediction) {
        this.writeStreamEvent(res, "fragment", fragment);
      }
      this.writeStreamEvent(res, "result", await prediction.result());
      this.endStream(res);
    } catch (error) {
      this.writeStreamEvent(res, "error", toSerializableError(error));
      this.endStream(res);
    }
  }

  private async streamAct(res: ServerResponse, request: ActRequest): Promise<void> {
    const model = await this.resolveLlmModel(request.model);
    const messages = await normalizeChatMessages(request.messages, this.client);
    const tools = pickBuiltInTools(request.toolNames ?? [], this);
    const collectedMessages: SerializableMessage[] = [];

    this.startStream(res);
    try {
      const result = await model.act(messages as ChatLike, tools, {
        ...(request.options ?? {}),
        onMessage: (message) => {
          const serializable = serializeMessage(message);
          collectedMessages.push(serializable);
          this.writeStreamEvent(res, "message", serializable);
          request.options?.onMessage?.(message);
        },
        onRoundStart: (roundIndex) => {
          this.writeStreamEvent(res, "roundStart", { roundIndex });
          request.options?.onRoundStart?.(roundIndex);
        },
        onRoundEnd: (roundIndex) => {
          this.writeStreamEvent(res, "roundEnd", { roundIndex });
          request.options?.onRoundEnd?.(roundIndex);
        },
        onPredictionFragment: (fragment) => {
          this.writeStreamEvent(res, "fragment", fragment);
          request.options?.onPredictionFragment?.(fragment);
        },
      });

      this.writeStreamEvent(res, "result", {
        model: model.identifier,
        rounds: result.rounds,
        totalExecutionTimeSeconds: result.totalExecutionTimeSeconds,
        messages: collectedMessages,
      });
      this.endStream(res);
    } catch (error) {
      this.writeStreamEvent(res, "error", toSerializableError(error));
      this.endStream(res);
    }
  }

  private startStream(res: ServerResponse): void {
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
  }

  private writeStreamEvent(res: ServerResponse, event: string, data: unknown): void {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  private endStream(res: ServerResponse): void {
    res.end();
  }
}

export default LMStudioServer;

if (require.main === module) {
  const port = Number(process.env.PORT ?? "3000");
  const host = process.env.HOST ?? "127.0.0.1";
  const apiUrl = process.env.LM_STUDIO_BASE_URL ?? process.env.LM_STUDIO_URL ?? "http://localhost:1234";
  const clientIdentifier = process.env.CLIENT_IDENTIFIER;
  const clientPasskey = process.env.CLIENT_PASSKEY;

  const server = new LMStudioServer(apiUrl, {
    clientIdentifier,
    clientPasskey,
    verboseErrorMessages: process.env.VERBOSE_ERRORS === "true",
  });
  void server.start(port, host).then(() => {
    console.log(`LM Studio backend listening on http://${host}:${port}`);
    console.log(`Connecting to LM Studio at ${apiUrl}`);
  });
}
