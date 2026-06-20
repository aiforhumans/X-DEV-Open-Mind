import React, { useState, useEffect } from "react";
import "./settingsUI.css";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ToastContainer, type ToastType } from "./components/Toast";
import { ModelStatus } from "./components/ModelStatus";
import { Playground } from "./components/Playground";
import { useModelStatus } from "./hooks/useModelStatus";

interface ModelConfig {
  name: string;
  domain?: "llm" | "embedding";
  path?: string;
  contextLength?: number;
  gpuOffload?: number;
  keepModelInMemory?: boolean;
  tryMmap?: boolean;
}

interface InferenceOptions {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxTokens?: number;
}

interface BackendSettings {
  host: string;
  port: number;
  apiUrl: string;
  clientIdentifier: string;
  clientPasskey: string;
  verboseErrorMessages: boolean;
}

interface TestResult {
  id: string;
  name: string;
  status: "pending" | "running" | "success" | "error";
  message: string;
  timestamp: number;
}

const defaultBackendUrl =
  typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
const defaultBackendHost =
  typeof window !== "undefined" ? window.location.hostname : "localhost";
const defaultBackendPort =
  typeof window !== "undefined" && window.location.port
    ? Number(window.location.port)
    : 3000;

const SettingsUI: React.FC = () => {
  // Model Config State
  const [modelName, setModelName] = useState("");
  const [modelDomain, setModelDomain] = useState<"llm" | "embedding">("llm");
  const [modelPath, setModelPath] = useState("");
  const [contextLength, setContextLength] = useState(2048);
  const [gpuOffload, setGpuOffload] = useState(100);
  const [keepModelInMemory, setKeepModelInMemory] = useState(true);
  const [tryMmap, setTryMmap] = useState(true);

  // Inference Options State
  const [temperature, setTemperature] = useState(0.7);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(40);
  const [maxTokens, setMaxTokens] = useState(512);

  // Backend Settings State
  const [host, setHost] = useState(defaultBackendHost);
  const [port, setPort] = useState(defaultBackendPort);
  const [apiUrl, setApiUrl] = useState(defaultBackendUrl);
  const [clientIdentifier, setClientIdentifier] = useState("");
  const [clientPasskey, setClientPasskey] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [verboseErrors, setVerboseErrors] = useState(false);

  // UI State
  const [activeTab, setActiveTab] = useState<"model" | "inference" | "backend" | "playground">("model");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);
  const [testLoading, setTestLoading] = useState(false);

  // Model Status Hook
  const { status: modelStatus, loading: statusLoading } = useModelStatus(apiUrl);

  // Auto-calculate API URL
  useEffect(() => {
    setApiUrl(`http://${host}:${port}`);
  }, [host, port]);

  const addTestResult = (name: string, status: "success" | "error", message: string) => {
    const result: TestResult = {
      id: `${Date.now()}-${Math.random()}`,
      name,
      status,
      message,
      timestamp: Date.now(),
    };
    setTestResults((prev) => [result, ...prev.slice(0, 9)]);
  };

  const showToast = (message: string, type: ToastType = "info") => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const testModelConfig = async () => {
    try {
      const config: ModelConfig = {
        name: modelName || "test-model",
        domain: modelDomain,
        path: modelPath,
        contextLength,
        gpuOffload,
        keepModelInMemory,
        tryMmap,
      };
      addTestResult("Model Config", "success", JSON.stringify(config, null, 2));
    } catch (error) {
      addTestResult("Model Config", "error", `Failed: ${error}`);
    }
  };

  const testInferenceOptions = async () => {
    try {
      const options: InferenceOptions = {
        temperature,
        topP,
        topK,
        maxTokens,
      };

      // Validate ranges
      if (temperature < 0 || temperature > 2)
        throw new Error("Temperature must be between 0 and 2");
      if (topP < 0 || topP > 1) throw new Error("topP must be between 0 and 1");
      if (topK < 1) throw new Error("topK must be >= 1");
      if (maxTokens < 1) throw new Error("maxTokens must be >= 1");

      addTestResult("Inference Options", "success", JSON.stringify(options, null, 2));
    } catch (error) {
      addTestResult("Inference Options", "error", `Validation error: ${error}`);
    }
  };

  const testBackendConnection = async () => {
    setTestLoading(true);
    try {
      const headers: Record<string, string> = {};
      if (clientIdentifier) headers["X-Client-ID"] = clientIdentifier;
      if (apiToken) headers["Authorization"] = `Bearer ${apiToken}`;
      
      const response = await fetch(`${apiUrl}/v1/models`, {
        headers,
      });
      if (response.ok) {
        addTestResult("Backend Connection", "success", "Connected successfully");
        showToast("✅ Connected to backend successfully!", "success");
      } else {
        addTestResult("Backend Connection", "error", `HTTP ${response.status}`);
        showToast(`❌ Connection failed: HTTP ${response.status}`, "error");
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      addTestResult("Backend Connection", "error", `Connection failed: ${errorMsg}`);
      showToast(`❌ Connection failed: ${errorMsg}`, "error");
    } finally {
      setTestLoading(false);
    }
  };

  const testAllSettings = async () => {
    await testModelConfig();
    await testInferenceOptions();
    await testBackendConnection();
  };

  const exportSettings = () => {
    const settings = {
      model: {
        name: modelName,
        domain: modelDomain,
        path: modelPath,
        contextLength,
        gpuOffload,
        keepModelInMemory,
        tryMmap,
      },
      inference: {
        temperature,
        topP,
        topK,
        maxTokens,
      },
      backend: {
        host,
        port,
        apiUrl,
        clientIdentifier,
        clientPasskey,
        apiToken,
        verboseErrors,
      },
      exportedAt: new Date().toISOString(),
    };
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lm-studio-settings-${Date.now()}.json`;
    link.click();
  };

  const importSettings = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const settings = JSON.parse(e.target?.result as string);
        if (settings.model) {
          setModelName(settings.model.name || "");
          setModelDomain(settings.model.domain || "llm");
          setModelPath(settings.model.path || "");
          setContextLength(settings.model.contextLength || 2048);
          setGpuOffload(settings.model.gpuOffload || 100);
          setKeepModelInMemory(settings.model.keepModelInMemory ?? true);
          setTryMmap(settings.model.tryMmap ?? true);
        }
        if (settings.inference) {
          setTemperature(settings.inference.temperature || 0.7);
          setTopP(settings.inference.topP || 0.9);
          setTopK(settings.inference.topK || 40);
          setMaxTokens(settings.inference.maxTokens || 512);
        }
        if (settings.backend) {
          setHost(settings.backend.host || defaultBackendHost);
          setPort(settings.backend.port || defaultBackendPort);
          setClientIdentifier(settings.backend.clientIdentifier || "");
          setClientPasskey(settings.backend.clientPasskey || "");
          setApiToken(settings.backend.apiToken || "");
          setVerboseErrors(settings.backend.verboseErrors ?? false);
        }
        addTestResult("Settings Import", "success", "Settings imported successfully");
      } catch (error) {
        addTestResult("Settings Import", "error", `Import failed: ${error}`);
      }
    };
    reader.readAsText(file);
  };

  const resetSettings = () => {
    setModelName("");
    setModelDomain("llm");
    setModelPath("");
    setContextLength(2048);
    setGpuOffload(100);
    setKeepModelInMemory(true);
    setTryMmap(true);
    setTemperature(0.7);
    setTopP(0.9);
    setTopK(40);
    setMaxTokens(512);
    setHost(defaultBackendHost);
    setPort(defaultBackendPort);
    setClientIdentifier("");
    setVerboseErrors(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="settings-ui">
      <ToastContainer toasts={toasts} onClose={removeToast} />
      <header className="settings-header">
        <h1>🎛️ LM Studio Settings Tester</h1>
        <p>Configure and test all LM Studio settings in one place</p>
      </header>

      <div className="settings-container">
        <div className="settings-panel">
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button
              className={`tab-btn ${activeTab === "model" ? "active" : ""}`}
              onClick={() => setActiveTab("model")}
            >
              Model Config
            </button>
            <button
              className={`tab-btn ${activeTab === "inference" ? "active" : ""}`}
              onClick={() => setActiveTab("inference")}
            >
              Inference Options
            </button>
            <button
              className={`tab-btn ${activeTab === "backend" ? "active" : ""}`}
              onClick={() => setActiveTab("backend")}
            >
              Backend Settings
            </button>
            <button
              className={`tab-btn ${activeTab === "playground" ? "active" : ""}`}
              onClick={() => setActiveTab("playground")}
            >
              🚀 Playground
            </button>
          </div>

          {/* Model Configuration Tab */}
          {activeTab === "model" && (
            <div className="tab-content">
              <h2>Model Configuration</h2>
              <div className="form-group">
                <label>Model Name</label>
                <input
                  type="text"
                  placeholder="e.g., model-name"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Model Domain</label>
                <select value={modelDomain} onChange={(e) => setModelDomain(e.target.value as any)}>
                  <option value="llm">LLM (Language Model)</option>
                  <option value="embedding">Embedding</option>
                </select>
              </div>

              <div className="form-group">
                <label>Model Path</label>
                <input
                  type="text"
                  placeholder="e.g., /path/to/model.gguf"
                  value={modelPath}
                  onChange={(e) => setModelPath(e.target.value)}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Context Length</label>
                  <div className="input-range-group">
                    <input
                      type="number"
                      min="512"
                      max="32768"
                      step="512"
                      value={contextLength}
                      onChange={(e) => setContextLength(Number(e.target.value))}
                    />
                    <input
                      type="range"
                      min="512"
                      max="32768"
                      step="512"
                      value={contextLength}
                      onChange={(e) => setContextLength(Number(e.target.value))}
                    />
                  </div>
                  <span className="value-display">{contextLength} tokens</span>
                </div>

                <div className="form-group">
                  <label>GPU Offload %</label>
                  <div className="input-range-group">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={gpuOffload}
                      onChange={(e) => setGpuOffload(Number(e.target.value))}
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={gpuOffload}
                      onChange={(e) => setGpuOffload(Number(e.target.value))}
                    />
                  </div>
                  <span className="value-display">{gpuOffload}%</span>
                </div>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={keepModelInMemory}
                    onChange={(e) => setKeepModelInMemory(e.target.checked)}
                  />
                  Keep Model in Memory
                </label>
                <p className="help-text">Prevents model unloading after inference</p>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={tryMmap}
                    onChange={(e) => setTryMmap(e.target.checked)}
                  />
                  Try Memory Mapping
                </label>
                <p className="help-text">Improves performance with memory-mapped file I/O</p>
              </div>

              <button className="btn btn-primary" onClick={testModelConfig}>
                ✓ Test Model Config
              </button>
            </div>
          )}

          {/* Inference Options Tab */}
          {activeTab === "inference" && (
            <div className="tab-content">
              <h2>Inference Options</h2>

              <div className="form-group">
                <label>Temperature</label>
                <div className="input-range-group">
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                  />
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(Number(e.target.value))}
                  />
                </div>
                <span className="value-display">{temperature}</span>
                <p className="help-text">Controls randomness: 0 = deterministic, 2 = chaotic</p>
              </div>

              <div className="form-group">
                <label>Top P (Nucleus Sampling)</label>
                <div className="input-range-group">
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(Number(e.target.value))}
                  />
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={topP}
                    onChange={(e) => setTopP(Number(e.target.value))}
                  />
                </div>
                <span className="value-display">{topP}</span>
                <p className="help-text">Filters tokens to top P probability mass</p>
              </div>

              <div className="form-group">
                <label>Top K</label>
                <div className="input-range-group">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                  />
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={topK}
                    onChange={(e) => setTopK(Number(e.target.value))}
                  />
                </div>
                <span className="value-display">{topK}</span>
                <p className="help-text">Samples from top K most likely tokens</p>
              </div>

              <div className="form-group">
                <label>Max Tokens</label>
                <div className="input-range-group">
                  <input
                    type="number"
                    min="1"
                    max="4096"
                    step="100"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                  />
                  <input
                    type="range"
                    min="1"
                    max="4096"
                    step="100"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Number(e.target.value))}
                  />
                </div>
                <span className="value-display">{maxTokens}</span>
                <p className="help-text">Maximum tokens to generate in response</p>
              </div>

              <button className="btn btn-primary" onClick={testInferenceOptions}>
                ✓ Test Inference Options
              </button>
            </div>
          )}

          {/* Backend Settings Tab */}
          {activeTab === "backend" && (
            <div className="tab-content">
              <h2>Backend Settings</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Host</label>
                  <input
                    type="text"
                    placeholder="localhost"
                    value={host}
                    onChange={(e) => setHost(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>Port</label>
                  <input
                    type="number"
                    min="1"
                    max="65535"
                    value={port}
                    onChange={(e) => setPort(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>API URL (Auto-calculated)</label>
                <input type="text" disabled value={apiUrl} />
              </div>

              <div className="form-group">
                <label>Client Identifier</label>
                <input
                  type="text"
                  placeholder="Optional client ID"
                  value={clientIdentifier}
                  onChange={(e) => setClientIdentifier(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Client Passkey</label>
                <input
                  type="password"
                  placeholder="Optional authentication passkey"
                  value={clientPasskey}
                  onChange={(e) => setClientPasskey(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>LM Studio API Token</label>
                <input
                  type="password"
                  placeholder="Optional LM Studio API token"
                  value={apiToken}
                  onChange={(e) => setApiToken(e.target.value)}
                />
                <p className="help-text">Get your token from LM Studio settings. Required for authenticated LM Studio instances.</p>
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={verboseErrors}
                    onChange={(e) => setVerboseErrors(e.target.checked)}
                  />
                  Verbose Error Messages
                </label>
                <p className="help-text">Show detailed error information in logs</p>
              </div>

              <button 
               className="btn btn-primary" 
               onClick={testBackendConnection}
               disabled={testLoading}
              >
               {testLoading ? "Testing..." : "🔗 Test Backend Connection"}
              </button>
              {testLoading && <LoadingSpinner message="Connecting..." size="small" />}
            </div>
          )}

          {/* Playground Tab */}
          {activeTab === "playground" && (
           <div className="tab-content">
             <h2>💬 Model Playground</h2>
             <ModelStatus 
               llm={modelStatus.llm} 
               embedding={modelStatus.embedding} 
               loading={statusLoading}
             />
             <Playground 
               apiUrl={apiUrl} 
               modelName={modelStatus.llm || undefined}
               onShowToast={showToast}
             />
           </div>
          )}

          {/* Action Buttons */}
          <div className="action-buttons">
            <button className="btn btn-success" onClick={testAllSettings}>
              🧪 Test All Settings
            </button>
            <button className="btn btn-secondary" onClick={exportSettings}>
              ⬇️ Export Settings
            </button>
            <label className="btn btn-secondary">
              ⬆️ Import Settings
              <input
                type="file"
                accept=".json"
                onChange={importSettings}
                style={{ display: "none" }}
              />
            </label>
            <button className="btn btn-warning" onClick={resetSettings}>
              ↻ Reset All
            </button>
          </div>
        </div>

        {/* Test Results Panel */}
        <div className="results-panel">
          <div className="results-header">
            <h3>Test Results ({testResults.length})</h3>
            {testResults.length > 0 && (
              <button className="btn-small btn-danger" onClick={clearResults}>
                Clear
              </button>
            )}
          </div>

          <div className="results-list">
            {testResults.length === 0 ? (
              <div className="empty-state">
                <p>No tests run yet. Run a test to see results here.</p>
              </div>
            ) : (
              testResults.map((result) => (
                <div
                  key={result.id}
                  className={`result-item result-${result.status}`}
                  onClick={() => setExpandedResult(expandedResult === result.id ? null : result.id)}
                >
                  <div className="result-header">
                    <div className="result-status">
                      {result.status === "success" && "✓"}
                      {result.status === "error" && "✗"}
                      {result.status === "running" && "⟳"}
                    </div>
                    <div className="result-title">{result.name}</div>
                    <div className="result-time">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                  </div>

                  {expandedResult === result.id && (
                    <div className="result-details">
                      <pre>{result.message}</pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsUI;
