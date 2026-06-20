import React from "react";
import "./ModelStatus.css";

interface ModelStatusProps {
  llm: string | null;
  embedding: string | null;
  loading?: boolean;
}

export const ModelStatus: React.FC<ModelStatusProps> = ({ 
  llm, 
  embedding, 
  loading 
}) => (
  <div className="model-status">
    <h3>🤖 Loaded Models</h3>
    <div className="model-item">
      <span className="model-label">LLM:</span>
      <span className="model-value">
        {loading ? "Checking..." : (llm ? `✓ ${llm}` : "None loaded")}
      </span>
    </div>
    <div className="model-item">
      <span className="model-label">Embedding:</span>
      <span className="model-value">
        {loading ? "Checking..." : (embedding ? `✓ ${embedding}` : "None loaded")}
      </span>
    </div>
  </div>
);
