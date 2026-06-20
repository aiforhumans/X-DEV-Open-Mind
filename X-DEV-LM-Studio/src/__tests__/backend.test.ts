import path from "node:path";
import { Readable } from "node:stream";
import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiError,
  LMStudioServer,
  getOptionalBoolean,
  getOptionalNumber,
  getOptionalString,
  getString,
  normalizeBaseUrl,
  normalizeChatMessages,
  pickBuiltInTools,
  readJsonBody,
  serializeFileHandle,
  serializeMessage,
  toSerializableError,
  loadRuntimeEnvironment,
} from "../index";

type MockMessage = {
  getRole: () => string;
  getText: () => string;
  getToolCallRequests: () => unknown[];
  getToolCallResults: () => unknown[];
  hasFiles: () => boolean;
};

type MockClient = {
  llm: {
    model: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    unload: ReturnType<typeof vi.fn>;
    listLoaded: ReturnType<typeof vi.fn>;
  };
  embedding: {
    model: ReturnType<typeof vi.fn>;
    load: ReturnType<typeof vi.fn>;
    unload: ReturnType<typeof vi.fn>;
    listLoaded: ReturnType<typeof vi.fn>;
  };
  system: {
    listDownloadedModels: ReturnType<typeof vi.fn>;
  };
  files: {
    prepareFile: ReturnType<typeof vi.fn>;
    prepareImage: ReturnType<typeof vi.fn>;
    prepareFileBase64: ReturnType<typeof vi.fn>;
    prepareImageBase64: ReturnType<typeof vi.fn>;
    parseDocument: ReturnType<typeof vi.fn>;
    retrieve: ReturnType<typeof vi.fn>;
  };
};

type MockHandle = {
  identifier: string;
  name: string;
  type: string;
  sizeBytes: number;
  isImage: () => boolean;
  getFilePath: () => Promise<string>;
};

type MockPrediction = AsyncIterable<unknown> & {
  result: ReturnType<typeof vi.fn>;
};

let mockClient: MockClient;
let completePrediction: MockPrediction;
let respondPrediction: MockPrediction;
let embedResult: unknown;
let actResult: { rounds: number; totalExecutionTimeSeconds: number };
let tokenResult: string[];
let countTokensResult: number;
let toolMock: ReturnType<typeof vi.fn>;

vi.mock("@lmstudio/sdk", () => ({
  LMStudioClient: vi.fn().mockImplementation(() => mockClient),
  tool: (...args: unknown[]) => toolMock(...args),
}));

function createPrediction(result: unknown, fragments: unknown[] = []): MockPrediction {
  return {
    async *[Symbol.asyncIterator]() {
      for (const fragment of fragments) {
        yield fragment;
      }
    },
    result: vi.fn(async () => result),
  };
}

function createHandle(identifier: string, absolutePath: string, image = false): MockHandle {
  return {
    identifier,
    name: path.basename(absolutePath),
    type: image ? "image/png" : "text/plain",
    sizeBytes: 12,
    isImage: () => image,
    getFilePath: async () => absolutePath,
  };
}

function createLlmModel(identifier: string) {
  return {
    identifier,
    complete: vi.fn(() => completePrediction),
    respond: vi.fn(() => respondPrediction),
    act: vi.fn(async (_messages, _tools, options) => {
      const message: MockMessage = {
        getRole: () => "assistant",
        getText: () => "tool result",
        getToolCallRequests: () => [{ name: "list_loaded_models" }],
        getToolCallResults: () => [{ name: "list_loaded_models", result: ["llm-model"] }],
        hasFiles: () => false,
      };

      options?.onRoundStart?.(0);
      options?.onPredictionFragment?.("fragment-a");
      options?.onMessage?.(message as never);
      options?.onRoundEnd?.(0);

      return actResult;
    }),
  };
}

function createEmbeddingModel(identifier: string) {
  return {
    identifier,
    embed: vi.fn(async () => embedResult),
    tokenize: vi.fn(async () => tokenResult),
    countTokens: vi.fn(async () => countTokensResult),
  };
}

function createClient(): MockClient {
  const defaultLlmModel = createLlmModel("llm-model");
  const defaultEmbeddingModel = createEmbeddingModel("embedding-model");

  return {
    llm: {
      model: vi.fn(async (modelKey?: string) => (modelKey ? createLlmModel(modelKey) : defaultLlmModel)),
      load: vi.fn(async () => undefined),
      unload: vi.fn(async () => undefined),
      listLoaded: vi.fn(async () => [{ identifier: "llm-model" }]),
    },
    embedding: {
      model: vi.fn(async (modelKey?: string) =>
        modelKey ? createEmbeddingModel(modelKey) : defaultEmbeddingModel
      ),
      load: vi.fn(async () => undefined),
      unload: vi.fn(async () => undefined),
      listLoaded: vi.fn(async () => [{ identifier: "embedding-model" }]),
    },
    system: {
      listDownloadedModels: vi.fn(async (domain?: string) =>
        domain ? [{ identifier: `${domain}-model` }] : [{ identifier: "llm-model" }, { identifier: "embedding-model" }]
      ),
    },
    files: {
      prepareFile: vi.fn(async (filePath: string) => createHandle(`file:${filePath}`, filePath, false)),
      prepareImage: vi.fn(async (imagePath: string) => createHandle(`image:${imagePath}`, imagePath, true)),
      prepareFileBase64: vi.fn(async (fileName: string) =>
        createHandle(`base64:${fileName}`, path.resolve(fileName), false)
      ),
      prepareImageBase64: vi.fn(async (fileName: string) =>
        createHandle(`image-base64:${fileName}`, path.resolve(fileName), true)
      ),
      parseDocument: vi.fn(async (handle: MockHandle) => ({ parsedFrom: handle.identifier })),
      retrieve: vi.fn(async (query: string, handles: MockHandle[]) => ({
        query,
        handles: handles.map((handle) => handle.identifier),
      })),
    },
  };
}

function createRequest(method: string, url: string, body?: unknown) {
  const chunks = body === undefined ? [] : [Buffer.from(JSON.stringify(body))];
  const request = Readable.from(chunks) as unknown as NodeJS.ReadableStream & {
    method?: string;
    url?: string;
  };
  request.method = method;
  request.url = url;
  return request;
}

function createResponse() {
  const headers: Record<string, string> = {};
  const chunks: string[] = [];
  return {
    statusCode: 0,
    headers,
    chunks,
    setHeader: vi.fn((name: string, value: string) => {
      headers[name.toLowerCase()] = value;
    }),
    write: vi.fn((chunk: string) => {
      chunks.push(chunk);
      return true;
    }),
    end: vi.fn((chunk?: string) => {
      if (chunk) {
        chunks.push(chunk);
      }
    }),
    flushHeaders: vi.fn(),
    get body() {
      return chunks.join("");
    },
  } as unknown as NodeJS.WriteStream & {
    statusCode: number;
    headers: Record<string, string>;
    chunks: string[];
    body: string;
  };
}

function createServer() {
  return new LMStudioServer("http://localhost:1234", { client: mockClient as never });
}

beforeEach(() => {
  mockClient = createClient();
  completePrediction = createPrediction(
    { content: "completion response", stats: { tokens: 12 } },
    ["chunk-1", "chunk-2"]
  );
  respondPrediction = createPrediction(
    { content: "chat response", stats: { tokens: 14 } },
    ["chat-1"]
  );
  embedResult = { data: [[0.1, 0.2, 0.3]] };
  actResult = { rounds: 2, totalExecutionTimeSeconds: 0.5 };
  tokenResult = ["token-a", "token-b"];
  countTokensResult = 2;
  toolMock = vi.fn((definition: { name: string }) => ({ kind: "tool", name: definition.name }));
});

describe("helper utilities", () => {
  it("normalizes LM Studio base URLs", () => {
    expect(normalizeBaseUrl("http://localhost:1234")).toBe("ws://localhost:1234");
    expect(normalizeBaseUrl("https://example.com")).toBe("wss://example.com");
    expect(normalizeBaseUrl("localhost:1234")).toBe("ws://localhost:1234");
  });

  it("validates required and optional values", () => {
    expect(getString("  prompt  ", "prompt")).toBe("  prompt  ");
    expect(getOptionalString("  model  ")).toBe("  model  ");
    expect(getOptionalString("")).toBeUndefined();
    expect(getOptionalBoolean(true)).toBe(true);
    expect(getOptionalBoolean("true")).toBeUndefined();
    expect(getOptionalNumber(42)).toBe(42);
    expect(getOptionalNumber(Number.NaN)).toBeUndefined();
  });

  it("serializes errors consistently", () => {
    const apiError = new ApiError(400, "invalid_request", "bad request", { field: "prompt" });
    expect(toSerializableError(apiError)).toEqual({
      error: {
        message: "bad request",
        code: "invalid_request",
        details: { field: "prompt" },
      },
    });
    expect(toSerializableError(new Error("boom"))).toEqual({
      error: {
        message: "boom",
        code: "internal_error",
      },
    });
  });

  it("loads environment files and maps legacy LM Studio variables", () => {
    const envKeys = [
      "LM_STUDIO_API_URL",
      "LM_STUDIO_API_TOKEN",
      "LM_STUDIO_CLIENT_IDENTIFIER",
      "LM_STUDIO_CLIENT_PASSKEY",
      "LM_STUDIO_BASE_URL",
      "LM_STUDIO_URL",
      "CLIENT_PASSKEY",
      "BACKEND_HOST",
      "HOST",
      "BACKEND_PORT",
      "PORT",
    ] as const;
    const previousEnv = new Map(envKeys.map((key) => [key, process.env[key]]));
    const existsSpy = vi.spyOn(fs, "existsSync").mockReturnValue(true);
    const readSpy = vi.spyOn(fs, "readFileSync").mockReturnValue(
      [
        "# sample env",
        "LM_STUDIO_API_URL=http://example.com",
        "LM_STUDIO_API_TOKEN=token-123",
        "BACKEND_HOST=0.0.0.0",
        "BACKEND_PORT=4321",
      ].join("\n")
    );

    try {
      for (const key of envKeys) {
        delete process.env[key];
      }

      loadRuntimeEnvironment();

      expect(process.env.LM_STUDIO_BASE_URL).toBe("http://example.com");
      expect(process.env.CLIENT_PASSKEY).toBe("token-123");
      expect(process.env.CLIENT_IDENTIFIER).toBe("x-dev-open-mind");
      expect(process.env.HOST).toBe("0.0.0.0");
      expect(process.env.PORT).toBe("4321");
    } finally {
      existsSpy.mockRestore();
      readSpy.mockRestore();
      for (const [key, value] of previousEnv.entries()) {
        if (value === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = value;
        }
      }
    }
  });

  it("reads JSON request bodies and rejects oversized payloads", async () => {
    const request = createRequest("POST", "/v1/completions", { prompt: "hello" });
    await expect(readJsonBody(request as never)).resolves.toEqual({ prompt: "hello" });

    const tooLarge = createRequest("POST", "/v1/completions", { prompt: "hello" });
    await expect(readJsonBody(tooLarge as never, 1)).rejects.toMatchObject({
      statusCode: 413,
      code: "payload_too_large",
    });
  });

  it("serializes file handles and chat messages", () => {
    const file = createHandle("file:1", "C:/tmp/file.txt");
    expect(serializeFileHandle(file as never, "C:/tmp/file.txt")).toEqual({
      identifier: "file:1",
      name: "file.txt",
      type: "text/plain",
      sizeBytes: 12,
      isImage: false,
      absolutePath: "C:/tmp/file.txt",
    });

    const message = serializeMessage({
      getRole: () => "assistant",
      getText: () => "done",
      getToolCallRequests: () => [{ name: "list_models" }],
      getToolCallResults: () => [{ name: "list_models", result: [] }],
      hasFiles: () => true,
    } as never);

    expect(message).toEqual({
      role: "assistant",
      content: "done",
      toolCalls: [{ name: "list_models" }],
      toolResults: [{ name: "list_models", result: [] }],
      hasFiles: true,
    });
  });

  it("builds chat messages with default roles and image handles", async () => {
    const messages = await normalizeChatMessages(
      [
        { content: "Look at this", images: ["./cat.png"] },
        { role: "assistant", content: "Already here" },
      ],
      mockClient as never
    );

    expect(messages[0]).toEqual({
      role: "user",
      content: "Look at this",
      images: [expect.objectContaining({ identifier: expect.stringContaining("image:") })],
    });
    expect(mockClient.files.prepareImage).toHaveBeenCalledWith(path.resolve("./cat.png"));
    expect(messages[1]).toEqual({
      role: "assistant",
      content: "Already here",
      images: [],
    });
  });

  it("selects built-in tools for model workflows", async () => {
    const backend = createServer();
    const tools = pickBuiltInTools(
      ["list_downloaded_models", "prepare_file", "retrieve_documents"],
      backend
    );

    expect(tools).toHaveLength(3);
    expect(toolMock).toHaveBeenCalledTimes(3);

    await (toolMock.mock.calls[0][0] as { implementation: () => Promise<unknown> }).implementation();
    expect(mockClient.system.listDownloadedModels).toHaveBeenCalled();

    expect(() => pickBuiltInTools(["list_downloaded_models", "unknown_tool" as never], backend)).toThrow(
      expect.objectContaining({
        statusCode: 400,
        code: "unknown_tool",
      })
    );
  });

  it("rejects invalid request bodies for parsed routes", () => {
    const server = createServer();

    expect(() => (server as any).readRespondRequest({ messages: "nope" })).toThrow(
      expect.objectContaining({
        statusCode: 400,
        code: "invalid_request",
      })
    );
    expect(() => (server as any).readEmbedRequest({ input: 123 })).toThrow(
      expect.objectContaining({
        statusCode: 400,
        code: "invalid_request",
      })
    );
    expect(() => (server as any).readActRequest({ messages: [], toolNames: ["not-real"] })).toThrow(
      expect.objectContaining({
        statusCode: 400,
        code: "invalid_request",
      })
    );
  });
});

describe("prompt and model behavior", () => {
  it("maps inference options when generating text", async () => {
    const server = createServer();
    expect((server as any).mapPredictionOptions({
      temperature: 0.4,
      topP: 0.8,
      topK: 20,
      maxTokens: 256,
    })).toEqual({
      temperature: 0.4,
      topPSampling: 0.8,
      topKSampling: 20,
      maxTokens: 256,
    });

    const result = await server.infer("Say hello", {
      temperature: 0.4,
      topP: 0.8,
      topK: 20,
      maxTokens: 256,
    });

    expect(result).toBe("completion response");
    expect(mockClient.llm.model).toHaveBeenCalledWith();
  });

  it("loads models with merged load options and domain-specific GPU settings", async () => {
    const server = createServer();
    expect((server as any).buildLoadOptions("llm", {
      name: "llm-instruct",
      contextLength: 8192,
      gpuOffload: 42,
      keepModelInMemory: true,
      tryMmap: false,
      loadOptions: { custom: "value" },
    })).toEqual({
      custom: "value",
      contextLength: 8192,
      keepModelInMemory: true,
      tryMmap: false,
      gpu: { ratio: 42 },
    });

    await server.loadModel({
      name: "llm-instruct",
      domain: "llm",
      contextLength: 8192,
      gpuOffload: 42,
      keepModelInMemory: true,
      tryMmap: false,
      loadOptions: { custom: "value" },
    });

    expect(mockClient.llm.load).toHaveBeenCalledWith("llm-instruct", {
      custom: "value",
      contextLength: 8192,
      keepModelInMemory: true,
      tryMmap: false,
      gpu: { ratio: 42 },
    });
    expect(server.getCurrentModel()).toBe("llm-instruct");
  });

  it("unloads the selected model and clears the current model cache", async () => {
    const server = createServer();
    await server.loadModel({ name: "llm-instruct" });
    expect(server.getCurrentModel()).toBe("llm-instruct");

    await server.unloadModel("llm-instruct");
    expect(mockClient.llm.unload).toHaveBeenCalledWith("llm-instruct");
    expect(server.getCurrentModel()).toBeNull();
  });

  it("unloads the first loaded model when no identifier is provided", async () => {
    const server = createServer();

    await server.unloadModel(undefined, "embedding");
    expect(mockClient.embedding.listLoaded).toHaveBeenCalled();
    expect(mockClient.embedding.unload).toHaveBeenCalledWith("embedding-model");
  });

  it("lists models and loaded models by domain", async () => {
    const server = createServer();

    await expect(server.listModels()).resolves.toEqual([
      { identifier: "llm-model" },
      { identifier: "embedding-model" },
    ]);
    await expect(server.listModels("llm")).resolves.toEqual([{ identifier: "llm-model" }]);
    await expect(server.listModels("embedding")).resolves.toEqual([{ identifier: "embedding-model" }]);
    await expect(server.listLoadedModels()).resolves.toEqual([{ identifier: "llm-model" }]);
    await expect(server.listLoadedModels("embedding")).resolves.toEqual([{ identifier: "embedding-model" }]);
  });

  it("resolves model keys explicitly for llm and embedding flows", async () => {
    const server = createServer();

    await expect((server as any).resolveLlmModel("alt-llm")).resolves.toMatchObject({
      identifier: "alt-llm",
    });
    await expect((server as any).resolveEmbeddingModel("alt-embed")).resolves.toMatchObject({
      identifier: "alt-embed",
    });
  });

  it("prepares files, images, documents, and retrieval requests", async () => {
    const server = createServer();

    await expect(server.prepareFile("notes.txt")).resolves.toMatchObject({
      identifier: expect.stringContaining("file:"),
      absolutePath: path.resolve("notes.txt"),
    });
    await expect(server.prepareImage("cat.png")).resolves.toMatchObject({
      identifier: expect.stringContaining("image:"),
      absolutePath: path.resolve("cat.png"),
      isImage: true,
    });

    await expect(server.parseDocument({ path: "notes.txt" })).resolves.toEqual({
      parsedFrom: expect.stringContaining("file:"),
    });

    await expect(
      server.retrieveDocuments({
        query: "find the important bits",
        files: [{ path: "notes.txt" }, { path: "other.txt" }],
      })
    ).resolves.toEqual({
      query: "find the important bits",
      handles: [expect.stringContaining("file:"), expect.stringContaining("file:")],
    });
  });
});

describe("request parsing and HTTP dispatch", () => {
  it("parses completion, chat, act, embed, and file requests", () => {
    const server = createServer();

    expect((server as any).readCompleteRequest({
      modelKey: "llm-1",
      prompt: "Write a haiku",
      stream: true,
      options: { temperature: 0.3 },
    })).toEqual({
      model: "llm-1",
      prompt: "Write a haiku",
      options: { temperature: 0.3 },
      stream: true,
    });

    expect((server as any).readRespondRequest({
      model: "chat-1",
      messages: [{ role: "user", content: "hi", images: ["a.png"] }],
      stream: false,
    })).toEqual({
      model: "chat-1",
      messages: [{ role: "user", content: "hi", images: ["a.png"] }],
      options: undefined,
      stream: false,
    });

    expect((server as any).readActRequest({
      messages: [{ content: "use tools" }],
      toolNames: ["list_loaded_models", "prepare_file"],
    })).toEqual({
      model: undefined,
      messages: [{ role: undefined, content: "use tools", images: undefined }],
      options: undefined,
      toolNames: ["list_loaded_models", "prepare_file"],
      stream: undefined,
    });

    expect((server as any).readEmbedRequest({
      model: "embed-1",
      input: ["one", "two"],
    })).toEqual({
      model: "embed-1",
      input: ["one", "two"],
    });

    expect((server as any).readFileRequest({
      path: "notes.txt",
      base64: "ZGF0YQ==",
      fileName: "notes.txt",
    })).toEqual({
      path: "notes.txt",
      base64: "ZGF0YQ==",
      fileName: "notes.txt",
    });
  });

  it("serves the browser console UI at /", async () => {
    const server = createServer();
    const res = createResponse();

    await (server as any).handleRequest(createRequest("GET", "/"), res);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("text/html; charset=utf-8");
    expect(res.body).toContain("X-DEV LM Studio Console");
    expect(res.body).toContain("System message");
    expect(res.body).toContain("Conversation history");
    expect(res.body).toContain("Completions");
    expect(res.body).toContain("Embeddings");
    expect(res.body).toContain("Act");
    expect(res.body).toContain("Files");
  });

  it("streams completion responses as SSE events", async () => {
    const server = createServer();
    const req = createRequest("POST", "/v1/completions?stream=true", {
      prompt: "Tell me a joke",
      model: "llm-model",
    });
    const res = createResponse();

    await (server as any).handleRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("text/event-stream; charset=utf-8");
    expect(res.body).toContain("event: fragment");
    expect(res.body).toContain("event: result");
    expect(res.body).toContain("completion response");
  });

  it("streams chat responses as SSE events", async () => {
    const server = createServer();
    const req = createRequest("POST", "/v1/chat/completions", {
      messages: [
        { role: "system", content: "Be brief" },
        { role: "user", content: "Hello" },
      ],
      model: "llm-model",
      stream: true,
    });
    const res = createResponse();

    await (server as any).handleRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.headers["content-type"]).toBe("text/event-stream; charset=utf-8");
    expect(res.body).toContain("event: fragment");
    expect(res.body).toContain("event: result");
    expect(res.body).toContain("chat response");
  });

  it("streams act responses with round and message events", async () => {
    const server = createServer();
    const req = createRequest("POST", "/api/llm/act?stream=true", {
      messages: [{ role: "user", content: "Plan the steps" }],
      toolNames: ["list_loaded_models"],
    });
    const res = createResponse();

    await (server as any).handleRequest(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toContain("event: roundStart");
    expect(res.body).toContain("event: message");
    expect(res.body).toContain("event: roundEnd");
    expect(res.body).toContain("event: result");
    expect(res.body).toContain("tool result");
  });

  it("dispatches JSON completion, chat, embedding, token, and file endpoints", async () => {
    const server = createServer();

    const completionRes = createResponse();
    await (server as any).handleRequest(
      createRequest("POST", "/v1/completions", { prompt: "Summarize this" }),
      completionRes
    );
    expect(JSON.parse(completionRes.body)).toEqual({
      model: "llm-model",
      content: "completion response",
      stats: { tokens: 12 },
    });

    const chatRes = createResponse();
    await (server as any).handleRequest(
      createRequest("POST", "/v1/chat/completions", {
        messages: [
          { role: "system", content: "You are helpful." },
          { content: "Hello", images: ["./cat.png"] },
        ],
      }),
      chatRes
    );
    expect(JSON.parse(chatRes.body)).toEqual({
      model: "llm-model",
      content: "chat response",
      stats: { tokens: 14 },
    });
    expect(mockClient.files.prepareImage).toHaveBeenCalledWith(path.resolve("./cat.png"));

    const embeddingRes = createResponse();
    await (server as any).handleRequest(
      createRequest("POST", "/v1/embeddings", { input: "embed me" }),
      embeddingRes
    );
    expect(JSON.parse(embeddingRes.body)).toEqual({
      model: "embedding-model",
      result: { data: [[0.1, 0.2, 0.3]] },
    });

    const tokenizeRes = createResponse();
    await (server as any).handleRequest(
      createRequest("POST", "/api/embedding/tokenize", { input: "embed me" }),
      tokenizeRes
    );
    expect(JSON.parse(tokenizeRes.body)).toEqual({
      model: "embedding-model",
      tokens: ["token-a", "token-b"],
    });

    const countTokensRes = createResponse();
    await (server as any).handleRequest(
      createRequest("POST", "/api/embedding/count-tokens", { input: "embed me" }),
      countTokensRes
    );
    expect(JSON.parse(countTokensRes.body)).toEqual({
      model: "embedding-model",
      tokenCount: 2,
    });

    const fileRes = createResponse();
    await (server as any).handleRequest(
      createRequest("POST", "/api/files/prepare-file", { path: "notes.txt" }),
      fileRes
    );
    expect(JSON.parse(fileRes.body)).toMatchObject({
      identifier: expect.stringContaining("file:"),
      absolutePath: path.resolve("notes.txt"),
    });

    const retrieveRes = createResponse();
    await (server as any).handleRequest(
      createRequest("POST", "/api/files/retrieve", {
        query: "important",
        files: ["notes.txt", { path: "other.txt" }],
      }),
      retrieveRes
    );
    expect(JSON.parse(retrieveRes.body)).toEqual({
      query: "important",
      handles: [expect.stringContaining("file:"), expect.stringContaining("file:")],
    });

    const loadRes = createResponse();
    await (server as any).handleRequest(
      createRequest("POST", "/v1/models/load", {
        name: "embedding-model",
        domain: "embedding",
        contextLength: 2048,
      }),
      loadRes
    );
    expect(JSON.parse(loadRes.body)).toEqual({ ok: true });
    expect(mockClient.embedding.load).toHaveBeenCalledWith("embedding-model", { contextLength: 2048 });

    const unloadRes = createResponse();
    await (server as any).handleRequest(
      createRequest("POST", "/v1/models/unload", {
        identifier: "embedding-model",
        domain: "embedding",
      }),
      unloadRes
    );
    expect(JSON.parse(unloadRes.body)).toEqual({ ok: true });
    expect(mockClient.embedding.unload).toHaveBeenCalledWith("embedding-model");

    const parseDocumentRes = createResponse();
    await (server as any).handleRequest(
      createRequest("POST", "/api/files/parse-document", {
        file: { path: "notes.txt" },
      }),
      parseDocumentRes
    );
    expect(JSON.parse(parseDocumentRes.body)).toEqual({
      parsedFrom: expect.stringContaining("file:"),
    });
  });

  it("returns a structured error for invalid routes", async () => {
    const server = createServer();
    const res = createResponse();
    await (server as any).handleRequest(createRequest("GET", "/missing"), res);

    expect(res.statusCode).toBe(404);
    expect(JSON.parse(res.body)).toEqual({
      error: {
        message: "No route matches GET /missing.",
        code: "not_found",
      },
    });
  });
});
