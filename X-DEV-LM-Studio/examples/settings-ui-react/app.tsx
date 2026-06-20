import React from "react";
import SettingsUI from "./settingsUI";
import "./app.css";

/**
 * Main App Component
 * Demonstrates the LM Studio Settings Testing UI
 */
const App: React.FC = () => {
  return (
    <div className="app-container">
      <SettingsUI />

      {/* Footer with version info */}
      <footer className="app-footer">
        <div className="footer-content">
          <p>
            LM Studio Settings Tester v1.0 • Built for{" "}
            <strong>X-DEV-Open-Mind</strong>
          </p>
          <p>
            <small>
              Powered by LM Studio SDK • Documentation:{" "}
              <a href="https://github.com/aiforhumans/X-DEV-Open-Mind" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </small>
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;
