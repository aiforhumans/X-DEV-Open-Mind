import React, { useState, useRef, useEffect } from "react";
import { LoadingSpinner } from "./LoadingSpinner";
import "./Playground.css";

interface PlaygroundProps {
  apiUrl: string;
  modelName?: string;
  onShowToast?: (message: string, type: "success" | "error") => void;
}

export const Playground: React.FC<PlaygroundProps> = ({ 
  apiUrl, 
  modelName,
  onShowToast
}) => {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(512);
  const [tokenCount, setTokenCount] = useState(0);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (responseRef.current) {
      responseRef.current.scrollTop = responseRef.current.scrollHeight;
    }
  }, [response]);

  const sendPrompt = async () => {
    if (!prompt.trim() || !modelName) {
      onShowToast?.("Please enter a prompt and ensure a model is loaded", "error");
      return;
    }
    
    setLoading(true);
    setResponse("");
    setTokenCount(0);

    try {
      const res = await fetch(`${apiUrl}/v1/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: modelName,
          prompt,
          temperature,
          max_tokens: maxTokens,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();
      const text = data.choices?.[0]?.text || "No response";
      setResponse(text);
      setTokenCount(data.usage?.completion_tokens || 0);
      onShowToast?.(`✓ Generated ${data.usage?.completion_tokens || 0} tokens`, "success");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setResponse(`❌ Error: ${errorMsg}`);
      onShowToast?.(`Failed to generate response: ${errorMsg}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(response);
    onShowToast?.("Copied to clipboard!", "success");
  };

  const clearAll = () => {
    setPrompt("");
    setResponse("");
    setTokenCount(0);
  };

  return (
    <div className="playground">
      <div className="playground-section">
        <h3>📝 Prompt</h3>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here..."
          disabled={loading}
          className="playground-textarea"
        />
      </div>

      <div className="playground-controls">
        <div className="control-group">
          <label>Temperature: <span className="value">{temperature.toFixed(1)}</span></label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(Number(e.target.value))}
            disabled={loading}
          />
        </div>

        <div className="control-group">
          <label>Max Tokens: <span className="value">{maxTokens}</span></label>
          <input
            type="range"
            min="64"
            max="2048"
            step="64"
            value={maxTokens}
            onChange={(e) => setMaxTokens(Number(e.target.value))}
            disabled={loading}
          />
        </div>

        <div className="control-buttons">
          <button 
            onClick={sendPrompt} 
            disabled={loading || !prompt.trim() || !modelName}
            className="btn btn-primary"
          >
            {loading ? "Generating..." : "🚀 Send"}
          </button>
          <button 
            onClick={clearAll}
            disabled={loading}
            className="btn btn-secondary"
          >
            🔄 Clear
          </button>
        </div>
      </div>

      <div className="playground-section">
        <div className="output-header">
          <h3>💬 Response</h3>
          {tokenCount > 0 && (
            <span className="token-count">{tokenCount} tokens</span>
          )}
        </div>
        <div ref={responseRef} className="playground-output">
          {loading ? (
            <LoadingSpinner message="Generating response..." size="small" />
          ) : response ? (
            response
          ) : (
            <span className="placeholder">Response will appear here...</span>
          )}
        </div>
        {response && !loading && (
          <div className="output-actions">
            <button 
              className="btn-small btn-secondary"
              onClick={copyToClipboard}
            >
              📋 Copy
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
