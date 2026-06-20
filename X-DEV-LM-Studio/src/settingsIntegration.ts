/**
 * Integration Examples
 * Shows how to use LM Studio Settings UI with the backend
 */

import { LMStudioClient } from "@lmstudio/sdk";

// Helper: Convert host/port to websocket base URL (matching backend normalization)
function normalizeBaseUrl(host: string, port: number): string {
  return `ws://${host}:${port}`;
}

// Type definitions matching the Settings UI
export interface ExportedSettings {
  model: {
    name: string;
    domain?: "llm" | "embedding";
    path?: string;
    contextLength?: number;
    gpuRatio?: number;
    keepInMemory?: boolean;
    mmap?: boolean;
  };
  inference: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
  };
  backend: {
    host: string;
    port: number;
    clientIdentifier?: string;
  };
  exportedAt: string;
}

/**
 * Example 1: Load Model with Settings
 */
export async function loadModelWithSettings(settings: ExportedSettings) {
  const baseUrl = normalizeBaseUrl(settings.backend.host, settings.backend.port);
  const client = new LMStudioClient({ baseUrl });

  // Load the model with configured settings
  const modelKey = settings.model.path || settings.model.name;
  const domain = settings.model.domain || "llm";
  const namespace = domain === "llm" ? client.llm : client.embedding;

  const loadOptions: Record<string, unknown> = {};
  if (settings.model.contextLength !== undefined)
    loadOptions.contextLength = settings.model.contextLength;
  if (settings.model.keepInMemory !== undefined)
    loadOptions.keepInMemory = settings.model.keepInMemory;
  if (settings.model.mmap !== undefined)
    loadOptions.mmap = settings.model.mmap;
  if (domain === "llm" && settings.model.gpuRatio !== undefined)
    loadOptions.gpuRatio = settings.model.gpuRatio;

  const model = await namespace.load(modelKey, loadOptions);
  return model;
}

/**
 * Example 2: Generate Text with Inference Settings
 */
export async function generateWithSettings(
  model: any,
  prompt: string,
  settings: ExportedSettings
) {
  const predictionOptions: Record<string, unknown> = {};
  if (settings.inference.temperature !== undefined)
    predictionOptions.temperature = settings.inference.temperature;
  if (settings.inference.topP !== undefined)
    predictionOptions.topPSampling = settings.inference.topP;
  if (settings.inference.topK !== undefined)
    predictionOptions.topKSampling = settings.inference.topK;
  if (settings.inference.maxTokens !== undefined)
    predictionOptions.maxTokens = settings.inference.maxTokens;

  const response = await model.complete(prompt, predictionOptions);
  return response;
}

/**
 * Example 3: Chat with Settings
 */
export async function chatWithSettings(
  model: any,
  messages: { role: string; content: string }[],
  settings: ExportedSettings
) {
  const predictionOptions: Record<string, unknown> = {};
  if (settings.inference.temperature !== undefined)
    predictionOptions.temperature = settings.inference.temperature;
  if (settings.inference.topP !== undefined)
    predictionOptions.topPSampling = settings.inference.topP;
  if (settings.inference.topK !== undefined)
    predictionOptions.topKSampling = settings.inference.topK;
  if (settings.inference.maxTokens !== undefined)
    predictionOptions.maxTokens = settings.inference.maxTokens;

  const response = await model.respond(messages, predictionOptions);
  return response;
}

/**
 * Example 4: Create Embeddings with Settings
 */
export async function createEmbeddingsWithSettings(
  settings: ExportedSettings,
  texts: string[]
) {
  const baseUrl = normalizeBaseUrl(settings.backend.host, settings.backend.port);
  const client = new LMStudioClient({ baseUrl });

  // Load embedding model
  const modelKey = settings.model.path || settings.model.name;
  const loadOptions: Record<string, unknown> = {};
  if (settings.model.contextLength !== undefined)
    loadOptions.contextLength = settings.model.contextLength;
  if (settings.model.keepInMemory !== undefined)
    loadOptions.keepInMemory = settings.model.keepInMemory;
  if (settings.model.mmap !== undefined)
    loadOptions.mmap = settings.model.mmap;

  const model = await client.embedding.load(modelKey, loadOptions);

  // Create embeddings
  const embeddings = await Promise.all(texts.map((text) => model.embed(text)));

  return embeddings;
}

/**
 * Example 5: Validate Settings
 */
export function validateSettings(settings: ExportedSettings): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate model settings
  if (!settings.model.name) errors.push("Model name is required");
  if (settings.model.contextLength && settings.model.contextLength < 512)
    errors.push("Context length must be at least 512");

  // Validate inference settings
  if (settings.inference.temperature !== undefined) {
    if (settings.inference.temperature < 0 || settings.inference.temperature > 2)
      errors.push("Temperature must be between 0 and 2");
  }

  if (settings.inference.topP !== undefined) {
    if (settings.inference.topP < 0 || settings.inference.topP > 1)
      errors.push("TopP must be between 0 and 1");
  }

  if (settings.inference.topK !== undefined) {
    if (settings.inference.topK < 1) errors.push("TopK must be at least 1");
  }

  if (settings.inference.maxTokens !== undefined) {
    if (settings.inference.maxTokens < 1) errors.push("MaxTokens must be at least 1");
  }

  // Validate backend settings
  if (!settings.backend.host) errors.push("Backend host is required");
  if (!settings.backend.port || settings.backend.port < 1 || settings.backend.port > 65535)
    errors.push("Backend port must be between 1 and 65535");

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Example 6: Create Default Settings
 */
export function createDefaultSettings(
  overrides?: Partial<ExportedSettings>
): ExportedSettings {
  const defaults: ExportedSettings = {
    model: {
      name: "default-model",
      domain: "llm",
      contextLength: 2048,
      gpuRatio: 100,
      keepInMemory: true,
      mmap: true,
    },
    inference: {
      temperature: 0.7,
      topP: 0.9,
      topK: 40,
      maxTokens: 512,
    },
    backend: {
      host: "localhost",
      port: 1234,
      clientIdentifier: undefined,
    },
    exportedAt: new Date().toISOString(),
  };

  return {
    ...defaults,
    ...overrides,
    model: { ...defaults.model, ...overrides?.model },
    inference: { ...defaults.inference, ...overrides?.inference },
    backend: { ...defaults.backend, ...overrides?.backend },
  };
}

/**
 * Example 7: Batch Processing with Settings
 */
export async function batchProcessWithSettings(
  model: any,
  prompts: string[],
  settings: ExportedSettings
) {
  const results = [];

  for (const prompt of prompts) {
    try {
      const response = await generateWithSettings(model, prompt, settings);
      results.push({ prompt, response, status: "success" });
    } catch (error) {
      results.push({ prompt, response: null, status: "error", error });
    }
  }

  return results;
}

/**
 * Example 8: Complete Workflow
 */
export async function completeWorkflow() {
  // 1. Create settings (or load from export)
  const settings = createDefaultSettings({
    model: {
      name: "model-identifier",
      contextLength: 4096,
      gpuRatio: 100,
    },
  });

  // 2. Validate settings
  const validation = validateSettings(settings);
  if (!validation.isValid) {
    console.error("Settings validation failed:", validation.errors);
    throw new Error("Invalid settings");
  }

  // 3. Load model
  const model = await loadModelWithSettings(settings);
  console.log("Model loaded successfully");

  // 4. Generate text
  const prompt = "What is artificial intelligence?";
  const response = await generateWithSettings(model, prompt, settings);
  console.log("Generated response:", response);

  // 5. Process batch
  const prompts = [
    "What is machine learning?",
    "Explain neural networks",
    "What is deep learning?",
  ];
  const batchResults = await batchProcessWithSettings(model, prompts, settings);
  console.log("Batch results:", batchResults);

  return {
    model,
    response,
    batchResults,
  };
}

/**
 * Example 9: Settings Manager Class
 */
export class SettingsManager {
  private settings: ExportedSettings;

  constructor(settings?: ExportedSettings) {
    this.settings = settings || createDefaultSettings();
  }

  getSettings(): ExportedSettings {
    return this.settings;
  }

  updateSettings(updates: Partial<ExportedSettings>) {
    this.settings = {
      ...this.settings,
      ...updates,
      model: { ...this.settings.model, ...updates.model },
      inference: { ...this.settings.inference, ...updates.inference },
      backend: { ...this.settings.backend, ...updates.backend },
    };
  }

  validateSettings(): boolean {
    const validation = validateSettings(this.settings);
    return validation.isValid;
  }

  exportSettings(): string {
    return JSON.stringify(this.settings, null, 2);
  }

  importSettings(jsonString: string) {
    try {
      const imported = JSON.parse(jsonString);
      this.settings = imported;
      return true;
    } catch (error) {
      console.error("Failed to import settings:", error);
      return false;
    }
  }

  async loadModel() {
    return loadModelWithSettings(this.settings);
  }

  async generate(model: any, prompt: string) {
    return generateWithSettings(model, prompt, this.settings);
  }

  async chat(model: any, messages: { role: string; content: string }[]) {
    return chatWithSettings(model, messages, this.settings);
  }

  resetToDefaults() {
    this.settings = createDefaultSettings();
  }
}

// Export for use in other modules
export default {
  loadModelWithSettings,
  generateWithSettings,
  chatWithSettings,
  createEmbeddingsWithSettings,
  validateSettings,
  createDefaultSettings,
  batchProcessWithSettings,
  completeWorkflow,
  SettingsManager,
};
