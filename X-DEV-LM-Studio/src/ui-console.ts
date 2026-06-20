export function buildUiHtml(): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>X-DEV LM Studio Console</title>
    <style>
      :root { color-scheme: dark; --bg:#09111f; --card:#111a33; --card2:#15213f; --text:#e9eeff; --muted:#9badda; --border:#26365f; --accent:#5f8cff; --good:#16c58f; --warn:#f5b74d; --bad:#ff6b6b; }
      * { box-sizing: border-box; }
      body { margin: 0; font-family: Inter, Segoe UI, Arial, sans-serif; background: radial-gradient(circle at top, #182a59 0, var(--bg) 60%); color: var(--text); }
      .app { width: min(1440px, calc(100% - 24px)); margin: 16px auto 28px; display: grid; gap: 14px; }
      .card { background: rgba(17, 26, 51, 0.92); border: 1px solid var(--border); border-radius: 16px; padding: 16px; box-shadow: 0 18px 45px rgba(0,0,0,.26); }
      .hero { display: grid; grid-template-columns: 1fr auto; gap: 16px; }
      .badge-stack { display: grid; gap: 8px; min-width: 240px; }
      .badge { padding: 10px 12px; border-radius: 999px; border: 1px solid var(--border); background: var(--card2); }
      .badge.good { border-color: color-mix(in srgb, var(--good), transparent 35%); }
      .badge.warn { border-color: color-mix(in srgb, var(--warn), transparent 35%); }
      .badge.bad { border-color: color-mix(in srgb, var(--bad), transparent 35%); }
      .tabs { display: flex; flex-wrap: wrap; gap: 8px; }
      .tab-button, button { border: 1px solid var(--border); border-radius: 10px; background: var(--card2); color: var(--text); padding: 10px 14px; cursor: pointer; font: inherit; }
      .tab-button.active { border-color: color-mix(in srgb, var(--accent), transparent 20%); background: linear-gradient(180deg, rgba(95,140,255,.35), rgba(95,140,255,.18)); }
      button.primary { border-color: color-mix(in srgb, var(--accent), transparent 10%); background: linear-gradient(180deg, rgba(95,140,255,.95), rgba(71,108,221,.95)); }
      button:disabled { opacity: .65; cursor: not-allowed; }
      .tab-panel { display: none; }
      .tab-panel.active { display: grid; gap: 14px; }
      .grid { display: grid; gap: 14px; }
      .two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .field { display: grid; gap: 6px; }
      input, textarea, select { width: 100%; border: 1px solid var(--border); border-radius: 10px; background: #0d1530; color: var(--text); padding: 10px 12px; font: inherit; }
      textarea { min-height: 120px; resize: vertical; }
      .wide { min-height: 180px; }
      .tiny { min-height: 84px; }
      .actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
      .muted { color: var(--muted); }
      .output, .message-list { border: 1px solid var(--border); border-radius: 12px; background: #0b1327; }
      .output { padding: 12px; min-height: 120px; white-space: pre-wrap; word-break: break-word; }
      .message-list { min-height: 220px; max-height: 360px; overflow: auto; padding: 10px; display: grid; gap: 10px; }
      .message { border: 1px solid var(--border); border-left-width: 4px; border-radius: 12px; padding: 10px 12px; background: rgba(17,26,51,.92); }
      .message.user { border-left-color: var(--accent); }
      .message.assistant { border-left-color: var(--good); }
      .message.system { border-left-color: var(--warn); }
      .message-head { display: flex; justify-content: space-between; gap: 10px; margin-bottom: 8px; font-size: .85rem; }
      .role-pill { padding: 4px 8px; border-radius: 999px; background: var(--card2); border: 1px solid var(--border); text-transform: uppercase; letter-spacing: .08em; }
      .message-body { margin: 0; white-space: pre-wrap; word-break: break-word; }
      .model-card, .segment { border: 1px solid var(--border); border-radius: 14px; background: rgba(15,23,48,.85); padding: 14px; }
      .model-head, .segment-head { display: flex; justify-content: space-between; gap: 10px; align-items: center; flex-wrap: wrap; }
      .tool-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px; }
      .tool-grid label { display: flex; align-items: center; gap: 8px; border: 1px solid var(--border); border-radius: 10px; background: #0d1530; padding: 10px 12px; }
      .act-row { display: grid; grid-template-columns: 120px 1fr auto; gap: 10px; }
      .act-row textarea { min-height: 88px; }
      .toast-host { position: fixed; top: 16px; right: 16px; display: grid; gap: 8px; z-index: 1000; pointer-events: none; }
      .toast { pointer-events: auto; padding: 10px 12px; border-radius: 10px; border: 1px solid var(--border); background: rgba(17,26,51,.96); box-shadow: 0 18px 45px rgba(0,0,0,.26); }
      .toast.good { border-color: color-mix(in srgb, var(--good), transparent 35%); }
      .toast.bad { border-color: color-mix(in srgb, var(--bad), transparent 35%); }
      .spinner { display: inline-block; width: 14px; height: 14px; border-radius: 50%; border: 2px solid rgba(255,255,255,.35); border-top-color: white; animation: spin .8s linear infinite; vertical-align: -2px; }
      @keyframes spin { to { transform: rotate(360deg); } }
      @media (max-width: 1000px) { .hero, .two, .three, .act-row { grid-template-columns: 1fr; } .badge-stack { min-width: 0; } }
    </style>
  </head>
  <body>
    <main class="app">
      <section class="card hero">
        <div>
          <p class="muted" style="letter-spacing:.18em;text-transform:uppercase;margin:0 0 8px">X-DEV LM Studio</p>
          <h1 style="margin:0 0 8px">Browser console for the backend API</h1>
          <p class="muted" style="margin:0">Chat, completions, embeddings, act/tool-calling, file helpers, and model management stay on the existing routes.</p>
        </div>
        <div class="badge-stack">
          <div id="healthBadge" class="badge">Checking backend...</div>
          <div id="llmBadge" class="badge">LLM: unknown</div>
          <div id="embeddingBadge" class="badge">Embedding: unknown</div>
        </div>
      </section>

      <section class="card grid two">
        <div class="model-card">
          <div class="model-head"><h2 style="margin:0">LLM model</h2><button id="llmRefreshBtn">Refresh</button></div>
          <select id="llmModelSelect"></select>
          <div class="actions"><button id="llmLoadBtn" class="primary">Load</button><button id="llmUnloadBtn">Unload</button></div>
          <div id="llmStatus" class="muted">Refreshing...</div>
        </div>
        <div class="model-card">
          <div class="model-head"><h2 style="margin:0">Embedding model</h2><button id="embeddingRefreshBtn">Refresh</button></div>
          <select id="embeddingModelSelect"></select>
          <div class="actions"><button id="embeddingLoadBtn" class="primary">Load</button><button id="embeddingUnloadBtn">Unload</button></div>
          <div id="embeddingStatus" class="muted">Refreshing...</div>
        </div>
      </section>

      <nav class="tabs" aria-label="Console sections">
        <button class="tab-button active" data-tab="chatTab">Chat</button>
        <button class="tab-button" data-tab="completionTab">Completions</button>
        <button class="tab-button" data-tab="embeddingTab">Embeddings</button>
        <button class="tab-button" data-tab="actTab">Act</button>
        <button class="tab-button" data-tab="filesTab">Files</button>
      </nav>

      <section id="chatTab" class="tab-panel active">
        <div class="card grid">
          <div class="field"><label for="chatSystemInput">System message</label><textarea id="chatSystemInput" placeholder="Set the system prompt."></textarea></div>
          <div class="field"><label>Conversation history</label><div id="chatHistory" class="message-list"></div></div>
          <div class="field"><label for="chatInput">User message</label><textarea id="chatInput" class="wide" placeholder="Ask the selected LLM model."></textarea></div>
          <div class="actions"><button id="chatSendBtn" class="primary">Send chat</button><button id="chatClearBtn">Clear history</button><label class="muted"><input id="chatStreamToggle" type="checkbox" checked /> Stream</label></div>
          <div id="chatMeta" class="muted"></div>
        </div>
      </section>

      <section id="completionTab" class="tab-panel">
        <div class="card grid">
          <div class="field"><label for="completionPrompt">Prompt</label><textarea id="completionPrompt" class="wide" placeholder="Write a completion prompt."></textarea></div>
          <div class="grid three">
            <div class="field"><label for="completionTemperature">Temperature</label><input id="completionTemperature" type="number" min="0" max="2" step="0.1" value="0.7" /></div>
            <div class="field"><label for="completionTopP">Top P</label><input id="completionTopP" type="number" min="0" max="1" step="0.05" value="1" /></div>
            <div class="field"><label for="completionMaxTokens">Max tokens</label><input id="completionMaxTokens" type="number" min="1" step="1" value="512" /></div>
          </div>
          <div class="actions"><button id="completionSendBtn" class="primary">Run completion</button><button id="completionClearBtn">Clear</button><label class="muted"><input id="completionStreamToggle" type="checkbox" checked /> Stream</label></div>
          <pre id="completionOutput" class="output"></pre>
          <div id="completionMeta" class="muted"></div>
        </div>
      </section>

      <section id="embeddingTab" class="tab-panel">
        <div class="card grid">
          <div class="field"><label for="embeddingInput">Input</label><textarea id="embeddingInput" class="wide" placeholder="Enter text or multiple lines."></textarea></div>
          <div class="actions"><label class="muted"><input id="embeddingBatchToggle" type="checkbox" /> Treat lines as batch inputs</label></div>
          <div class="actions"><button id="embedBtn" class="primary">Embed</button><button id="tokenizeBtn">Tokenize</button><button id="countTokensBtn">Count tokens</button><button id="embeddingClearBtn">Clear</button></div>
          <pre id="embeddingOutput" class="output"></pre>
        </div>
      </section>

      <section id="actTab" class="tab-panel">
        <div class="card grid">
          <div class="segment">
            <div class="segment-head"><h2 style="margin:0">Messages</h2><div class="actions"><button id="actAddRowBtn">Add message</button><button id="actResetBtn">Reset</button><label class="muted"><input id="actStreamToggle" type="checkbox" checked /> Stream</label></div></div>
            <div id="actMessages" class="grid" style="margin-top:12px"></div>
          </div>
          <div class="segment">
            <div class="segment-head"><h2 style="margin:0">Tools</h2><div class="muted">Built-in tool names passed to /api/llm/act</div></div>
            <div id="toolGrid" class="tool-grid" style="margin-top:12px"></div>
          </div>
          <div class="actions"><button id="actSendBtn" class="primary">Run act</button></div>
          <div class="field"><label>Stream log</label><pre id="actLog" class="output"></pre></div>
          <div class="field"><label>Final result</label><pre id="actOutput" class="output"></pre></div>
        </div>
      </section>

      <section id="filesTab" class="tab-panel">
        <div class="card grid">
          <div class="grid two">
            <section class="segment grid">
              <div class="segment-head"><h2 style="margin:0">Prepare file / image</h2><div class="muted">POST /api/files/prepare-file or /api/files/prepare-image</div></div>
              <div class="field"><label for="filePathInput">Path</label><input id="filePathInput" placeholder="C:\\path\\to\\file.txt" /></div>
              <div class="field"><label for="fileBase64Input">Base64</label><textarea id="fileBase64Input" class="tiny"></textarea></div>
              <div class="field"><label for="fileNameInput">File name for base64</label><input id="fileNameInput" placeholder="file.txt" /></div>
              <div class="actions"><button id="prepareFileBtn" class="primary">Prepare file</button><button id="prepareImageBtn" class="primary">Prepare image</button></div>
            </section>
            <section class="segment grid">
              <div class="segment-head"><h2 style="margin:0">Parse document</h2><div class="muted">POST /api/files/parse-document</div></div>
              <div class="field"><label for="documentPathInput">Path</label><input id="documentPathInput" placeholder="C:\\path\\to\\document.pdf" /></div>
              <div class="field"><label for="documentBase64Input">Base64</label><textarea id="documentBase64Input" class="tiny"></textarea></div>
              <div class="field"><label for="documentFileNameInput">File name</label><input id="documentFileNameInput" placeholder="document.pdf" /></div>
              <div class="actions"><button id="parseDocumentBtn" class="primary">Parse document</button></div>
            </section>
          </div>
          <section class="segment grid">
            <div class="segment-head"><h2 style="margin:0">Retrieve</h2><div class="muted">POST /api/files/retrieve</div></div>
            <div class="field"><label for="retrieveQueryInput">Query</label><input id="retrieveQueryInput" placeholder="What are you looking for?" /></div>
            <div class="field"><label for="retrieveFilesInput">File paths (one per line)</label><textarea id="retrieveFilesInput" class="tiny" placeholder="C:\\path\\to\\document1.md&#10;C:\\path\\to\\document2.md"></textarea></div>
            <div class="actions"><button id="retrieveBtn" class="primary">Retrieve</button><button id="filesClearBtn">Clear</button></div>
          </section>
          <pre id="filesOutput" class="output"></pre>
        </div>
      </section>
    </main>
    <div id="toastHost" class="toast-host"></div>
    <script>
      const el = (id) => document.getElementById(id);
      const state = { chat: [] };
      const toolDefs = [
        ["list_downloaded_models", "List downloaded models"],
        ["list_loaded_models", "List loaded models"],
        ["prepare_file", "Prepare file"],
        ["prepare_image", "Prepare image"],
        ["parse_document", "Parse document"],
        ["retrieve_documents", "Retrieve documents"],
      ];
      const healthBadge = el("healthBadge"), llmBadge = el("llmBadge"), embeddingBadge = el("embeddingBadge");
      const llmModelSelect = el("llmModelSelect"), embeddingModelSelect = el("embeddingModelSelect");
      const llmStatus = el("llmStatus"), embeddingStatus = el("embeddingStatus");
      const llmRefreshBtn = el("llmRefreshBtn"), llmLoadBtn = el("llmLoadBtn"), llmUnloadBtn = el("llmUnloadBtn");
      const embeddingRefreshBtn = el("embeddingRefreshBtn"), embeddingLoadBtn = el("embeddingLoadBtn"), embeddingUnloadBtn = el("embeddingUnloadBtn");
      const chatSystemInput = el("chatSystemInput"), chatHistory = el("chatHistory"), chatInput = el("chatInput"), chatSendBtn = el("chatSendBtn"), chatClearBtn = el("chatClearBtn"), chatStreamToggle = el("chatStreamToggle"), chatMeta = el("chatMeta");
      const completionPrompt = el("completionPrompt"), completionTemperature = el("completionTemperature"), completionTopP = el("completionTopP"), completionMaxTokens = el("completionMaxTokens"), completionStreamToggle = el("completionStreamToggle"), completionSendBtn = el("completionSendBtn"), completionClearBtn = el("completionClearBtn"), completionOutput = el("completionOutput"), completionMeta = el("completionMeta");
      const embeddingInput = el("embeddingInput"), embeddingBatchToggle = el("embeddingBatchToggle"), embedBtn = el("embedBtn"), tokenizeBtn = el("tokenizeBtn"), countTokensBtn = el("countTokensBtn"), embeddingClearBtn = el("embeddingClearBtn"), embeddingOutput = el("embeddingOutput");
      const actMessages = el("actMessages"), toolGrid = el("toolGrid"), actAddRowBtn = el("actAddRowBtn"), actResetBtn = el("actResetBtn"), actStreamToggle = el("actStreamToggle"), actSendBtn = el("actSendBtn"), actLog = el("actLog"), actOutput = el("actOutput");
      const filePathInput = el("filePathInput"), fileBase64Input = el("fileBase64Input"), fileNameInput = el("fileNameInput"), prepareFileBtn = el("prepareFileBtn"), prepareImageBtn = el("prepareImageBtn");
      const documentPathInput = el("documentPathInput"), documentBase64Input = el("documentBase64Input"), documentFileNameInput = el("documentFileNameInput"), parseDocumentBtn = el("parseDocumentBtn");
      const retrieveQueryInput = el("retrieveQueryInput"), retrieveFilesInput = el("retrieveFilesInput"), retrieveBtn = el("retrieveBtn"), filesClearBtn = el("filesClearBtn"), filesOutput = el("filesOutput");
      const toastHost = el("toastHost"), tabButtons = Array.from(document.querySelectorAll(".tab-button")), tabPanels = Array.from(document.querySelectorAll(".tab-panel"));

      const text = (value) => value === undefined || value === null ? "" : String(value);
      const modelKey = (model) => typeof model === "string" ? model : (model && typeof model === "object" ? text(model.identifier || model.modelKey || model.name || model.path || model.id || "") : "");
      const num = (value) => { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : undefined; };
      const msg = (payload) => payload && typeof payload === "object" && payload.error && typeof payload.error.message === "string" ? payload.error.message : (typeof payload === "string" ? payload : "Request failed.");
      const fragment = (value) => typeof value === "string" ? value : (value && typeof value === "object" ? text(value.content || value.text || value.delta || "") : "");
      function busy(button, on, label) { if (on) { button.dataset.label = button.textContent || ""; button.disabled = true; button.innerHTML = '<span class="spinner"></span> ' + label; return; } button.disabled = false; if (button.dataset.label !== undefined) button.textContent = button.dataset.label; }
      function badge(node, textValue, cls) { node.textContent = textValue; node.className = "badge " + (cls || ""); }
      function toast(message, cls) { const n = document.createElement("div"); n.className = "toast " + (cls || ""); n.textContent = message; toastHost.appendChild(n); window.setTimeout(() => n.remove(), 3000); }
      function stats(data) { if (!data || typeof data !== "object") return ""; const parts = []; if (typeof data.inputTokens === "number") parts.push("input " + data.inputTokens); if (typeof data.outputTokens === "number") parts.push("output " + data.outputTokens); if (typeof data.completionTokens === "number") parts.push("completion " + data.completionTokens); if (typeof data.totalTokens === "number") parts.push("total " + data.totalTokens); return parts.join(" · "); }

      async function json(url, options) { const res = await fetch(url, options); const raw = await res.text(); let body = {}; if (raw) { try { body = JSON.parse(raw); } catch { body = raw; } } if (!res.ok) throw new Error(msg(body)); return body; }
      async function stream(url, body, onEvent) {
        const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
        if (!res.ok) { throw new Error(msg(await res.text())); }
        if (!res.body) return res.json();
        const reader = res.body.getReader(); const decoder = new TextDecoder(); let buffer = ""; let final = {};
        const consume = (block) => {
          if (!block.trim()) return;
          let event = "message"; const dataLines = [];
          block.split(/\n/).forEach((line) => { if (line.startsWith("event:")) event = line.slice(6).trim(); else if (line.startsWith("data:")) dataLines.push(line.slice(5).trimStart()); });
          const raw = dataLines.join("\n"); let data = raw; if (raw) { try { data = JSON.parse(raw); } catch { data = raw; } }
          onEvent(event, data); if (event === "result") final = data; if (event === "error") throw new Error(msg(data));
        };
        while (true) { const chunk = await reader.read(); buffer += decoder.decode(chunk.value || new Uint8Array(), { stream: !chunk.done }).replace(/\r\n/g, "\n"); let split = buffer.indexOf("\n\n"); while (split >= 0) { consume(buffer.slice(0, split)); buffer = buffer.slice(split + 2); split = buffer.indexOf("\n\n"); } if (chunk.done) break; }
        if (buffer.trim()) consume(buffer);
        return final || {};
      }
      function fillSelect(select, models, loadedKey) { select.innerHTML = ""; if (!models.length) { const option = document.createElement("option"); option.value = ""; option.textContent = "No downloaded models"; select.appendChild(option); return; } models.forEach((model) => { const key = modelKey(model); if (!key) return; const option = document.createElement("option"); option.value = key; option.textContent = key; if (key === loadedKey) option.selected = true; select.appendChild(option); }); if (!select.value && loadedKey) { const fallback = document.createElement("option"); fallback.value = loadedKey; fallback.textContent = loadedKey; fallback.selected = true; select.appendChild(fallback); } }
      async function refreshDomain(domain) { const isLlm = domain === "llm"; const select = isLlm ? llmModelSelect : embeddingModelSelect; const status = isLlm ? llmStatus : embeddingStatus; const b = isLlm ? llmBadge : embeddingBadge; const label = isLlm ? "LLM" : "Embedding"; badge(b, label + ": refreshing...", "warn"); status.textContent = "Loading models..."; try { const [downloaded, loaded] = await Promise.all([json("/v1/models?domain=" + domain), json("/v1/models/loaded?domain=" + domain)]); const available = Array.isArray(downloaded.data) ? downloaded.data : []; const loadedModels = Array.isArray(loaded.data) ? loaded.data : []; const loadedKey = modelKey(loadedModels[0]); fillSelect(select, available, loadedKey); badge(b, loadedKey ? label + ": loaded " + loadedKey : label + ": not loaded", loadedKey ? "good" : "warn"); status.textContent = available.length + " downloaded, " + loadedModels.length + " loaded"; } catch (error) { select.innerHTML = '<option value="">Unavailable</option>'; badge(b, label + ": unavailable", "bad"); status.textContent = error.message; } }
      async function refreshAllModels() { await Promise.allSettled([refreshDomain("llm"), refreshDomain("embedding")]); }
      async function refreshHealth() { try { const health = await json("/health"); badge(healthBadge, health.ok ? "Backend healthy · " + text(health.baseUrl || "") : "Backend unhealthy", health.ok ? "good" : "bad"); } catch (error) { badge(healthBadge, "Health check failed", "bad"); toast(error.message, "bad"); } }
      async function loadModel(domain) { const isLlm = domain === "llm"; const select = isLlm ? llmModelSelect : embeddingModelSelect; const button = isLlm ? llmLoadBtn : embeddingLoadBtn; const value = select.value.trim(); if (!value) return toast("Choose a " + (isLlm ? "LLM" : "embedding") + " model first.", "bad"); busy(button, true, "Loading"); try { await json("/v1/models/load", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: value, domain: domain }) }); toast("Loaded " + value, "good"); await refreshAllModels(); } catch (error) { toast(error.message, "bad"); } finally { busy(button, false); } }
      async function unloadModel(domain) { const isLlm = domain === "llm"; const select = isLlm ? llmModelSelect : embeddingModelSelect; const button = isLlm ? llmUnloadBtn : embeddingUnloadBtn; const value = select.value.trim(); busy(button, true, "Unloading"); try { await json("/v1/models/unload", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(value ? { identifier: value, domain: domain } : { domain: domain }) }); toast("Unloaded " + (value || domain), "good"); await refreshAllModels(); } catch (error) { toast(error.message, "bad"); } finally { busy(button, false); } }

      function renderChat() { chatHistory.replaceChildren(); if (!state.chat.length) { const empty = document.createElement("div"); empty.className = "muted"; empty.textContent = "Conversation history appears here."; chatHistory.appendChild(empty); return; } state.chat.forEach((item) => { const node = document.createElement("article"); node.className = "message " + item.role + (item.pending ? " pending" : ""); const head = document.createElement("div"); head.className = "message-head"; const role = document.createElement("span"); role.className = "role-pill"; role.textContent = item.role; const meta = document.createElement("span"); meta.className = "muted"; meta.textContent = item.pending ? "streaming..." : ""; head.append(role, meta); const body = document.createElement("pre"); body.className = "message-body"; body.textContent = item.content || ""; node.append(head, body); chatHistory.appendChild(node); }); chatHistory.scrollTop = chatHistory.scrollHeight; }
      function chatPayload() { const messages = []; const system = chatSystemInput.value.trim(); if (system) messages.push({ role: "system", content: system }); state.chat.filter((item) => !item.pending).forEach((item) => messages.push({ role: item.role, content: item.content })); return messages; }
      async function sendChat() { const user = chatInput.value.trim(); if (!user) return toast("Enter a chat message first.", "bad"); state.chat.push({ role: "user", content: user, pending: false }); const assistant = { role: "assistant", content: "", pending: true }; state.chat.push(assistant); renderChat(); chatInput.value = ""; chatMeta.textContent = ""; const payload = { model: llmModelSelect.value || undefined, messages: chatPayload() }; busy(chatSendBtn, true, chatStreamToggle.checked ? "Streaming" : "Sending"); try { if (chatStreamToggle.checked) { await stream("/v1/chat/completions", { ...payload, stream: true }, (event, data) => { if (event === "fragment") { assistant.content += fragment(data); renderChat(); } else if (event === "result") { if (data && typeof data === "object" && typeof data.content === "string") assistant.content = data.content; assistant.pending = false; chatMeta.textContent = stats(data && typeof data === "object" ? data.stats : undefined); renderChat(); } else if (event === "error") { assistant.content = "Error: " + msg(data); assistant.pending = false; renderChat(); } }); assistant.pending = false; renderChat(); } else { const result = await json("/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); assistant.content = result.content || JSON.stringify(result, null, 2); assistant.pending = false; chatMeta.textContent = stats(result.stats); renderChat(); } toast("Chat response received.", "good"); } catch (error) { assistant.content = "Error: " + error.message; assistant.pending = false; renderChat(); toast(error.message, "bad"); } finally { busy(chatSendBtn, false); } }
      async function runCompletion() { const prompt = completionPrompt.value.trim(); if (!prompt) return toast("Enter a prompt first.", "bad"); completionOutput.textContent = ""; completionMeta.textContent = ""; const payload = { model: llmModelSelect.value || undefined, prompt, options: { temperature: num(completionTemperature.value), topP: num(completionTopP.value), maxTokens: num(completionMaxTokens.value) } }; busy(completionSendBtn, true, completionStreamToggle.checked ? "Streaming" : "Sending"); try { if (completionStreamToggle.checked) { await stream("/v1/completions", { ...payload, stream: true }, (event, data) => { if (event === "fragment") completionOutput.textContent += fragment(data); else if (event === "result") { if (data && typeof data === "object" && typeof data.content === "string") completionOutput.textContent = data.content; completionMeta.textContent = stats(data && typeof data === "object" ? data.stats : undefined); } else if (event === "error") completionOutput.textContent = "Error: " + msg(data); }); } else { const result = await json("/v1/completions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); completionOutput.textContent = result.content || JSON.stringify(result, null, 2); completionMeta.textContent = stats(result.stats); } toast("Completion received.", "good"); } catch (error) { completionOutput.textContent = "Error: " + error.message; toast(error.message, "bad"); } finally { busy(completionSendBtn, false); } }
      function embeddingValue() { const textValue = embeddingInput.value.trim(); return embeddingBatchToggle.checked ? (textValue ? textValue.split(/\r?\n/).map((line) => line.trim()).filter(Boolean) : []) : textValue; }
      async function runEmbedding() { const input = embeddingValue(); if (Array.isArray(input) ? !input.length : !input) return toast("Enter text first.", "bad"); busy(embedBtn, true, "Embedding"); try { const result = await json("/v1/embeddings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: embeddingModelSelect.value || undefined, input }) }); embeddingOutput.textContent = JSON.stringify(result, null, 2); toast("Embedding response received.", "good"); } catch (error) { embeddingOutput.textContent = "Error: " + error.message; toast(error.message, "bad"); } finally { busy(embedBtn, false); } }
      async function runTokenEndpoint(url, button) { const input = embeddingInput.value.trim(); if (!input) return toast("Enter text first.", "bad"); busy(button, true, "Running"); try { const result = await json(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: embeddingModelSelect.value || undefined, input }) }); embeddingOutput.textContent = JSON.stringify(result, null, 2); toast("Token request completed.", "good"); } catch (error) { embeddingOutput.textContent = "Error: " + error.message; toast(error.message, "bad"); } finally { busy(button, false); } }
      function addActRow(role, content) { const row = document.createElement("div"); row.className = "act-row"; const select = document.createElement("select"); ["system", "user", "assistant"].forEach((name) => { const option = document.createElement("option"); option.value = name; option.textContent = name; if (name === role) option.selected = true; select.appendChild(option); }); const textarea = document.createElement("textarea"); textarea.value = content || ""; textarea.placeholder = "Message content"; const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Remove"; remove.addEventListener("click", () => { row.remove(); if (!actMessages.querySelector(".act-row")) addActRow("user", ""); }); row.append(select, textarea, remove); actMessages.appendChild(row); }
      function resetActRows() { actMessages.replaceChildren(); addActRow("user", ""); actLog.textContent = ""; actOutput.textContent = ""; }
      function actMessagesValue() { return Array.from(actMessages.querySelectorAll(".act-row")).map((row) => ({ role: row.querySelector("select").value, content: row.querySelector("textarea").value.trim() })).filter((item) => item.content); }
      function toolsValue() { return Array.from(toolGrid.querySelectorAll("input[type='checkbox']")).filter((input) => input.checked).map((input) => input.value); }
      function renderTools() { toolGrid.replaceChildren(); toolDefs.forEach(([name, label]) => { const node = document.createElement("label"); const box = document.createElement("input"); box.type = "checkbox"; box.value = name; box.checked = true; node.append(box, document.createTextNode(label)); toolGrid.appendChild(node); }); }
      async function runAct() { const messages = actMessagesValue(); if (!messages.length) return toast("Add at least one act message.", "bad"); const payload = { model: llmModelSelect.value || undefined, messages, toolNames: toolsValue() }; actLog.textContent = ""; actOutput.textContent = ""; busy(actSendBtn, true, actStreamToggle.checked ? "Streaming" : "Running"); try { if (actStreamToggle.checked) { await stream("/api/llm/act", { ...payload, stream: true }, (event, data) => { actLog.textContent += event + ": " + (typeof data === "string" ? data : JSON.stringify(data)) + "\n"; if (event === "result") actOutput.textContent = JSON.stringify(data, null, 2); else if (event === "error") actOutput.textContent = "Error: " + msg(data); }); } else { const result = await json("/api/llm/act", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) }); actOutput.textContent = JSON.stringify(result, null, 2); } toast("Act result received.", "good"); } catch (error) { actOutput.textContent = "Error: " + error.message; toast(error.message, "bad"); } finally { busy(actSendBtn, false); } }
      function fileRequest(pathInput, base64Input, fileNameInput) { const path = pathInput.value.trim(); const base64 = base64Input.value.trim(); const fileName = fileNameInput ? fileNameInput.value.trim() : ""; if (path) return { path }; if (base64) return fileName ? { base64, fileName } : { base64 }; return {}; }
      async function runFileEndpoint(url, button, body) { busy(button, true, "Running"); try { const result = await json(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); filesOutput.textContent = JSON.stringify(result, null, 2); toast("Request completed.", "good"); } catch (error) { filesOutput.textContent = "Error: " + error.message; toast(error.message, "bad"); } finally { busy(button, false); } }
      async function prepareFile(pathname) { const body = fileRequest(filePathInput, fileBase64Input, fileNameInput); if (!body.path && !body.base64) return toast("Provide a path or base64 content.", "bad"); if (body.base64 && !body.fileName) return toast("File name is required for base64 content.", "bad"); await runFileEndpoint(pathname, pathname.indexOf("image") >= 0 ? prepareImageBtn : prepareFileBtn, body); }
      async function parseDocument() { const body = fileRequest(documentPathInput, documentBase64Input, documentFileNameInput); if (!body.path && !body.base64) return toast("Provide a path or base64 content for the document.", "bad"); if (body.base64 && !body.fileName) return toast("Document file name is required for base64 content.", "bad"); await runFileEndpoint("/api/files/parse-document", parseDocumentBtn, { file: body }); }
      async function retrieveDocuments() { const query = retrieveQueryInput.value.trim(); const files = retrieveFilesInput.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean).map((path) => ({ path })); if (!query || !files.length) return toast("Provide a query and at least one file path.", "bad"); await runFileEndpoint("/api/files/retrieve", retrieveBtn, { query, files }); }
      function clearFiles() { filePathInput.value = ""; fileBase64Input.value = ""; fileNameInput.value = ""; documentPathInput.value = ""; documentBase64Input.value = ""; documentFileNameInput.value = ""; retrieveQueryInput.value = ""; retrieveFilesInput.value = ""; filesOutput.textContent = ""; }
      function switchTab(tabId) { tabButtons.forEach((button) => button.classList.toggle("active", button.dataset.tab === tabId)); tabPanels.forEach((panel) => panel.classList.toggle("active", panel.id === tabId)); }
      async function init() { renderTools(); resetActRows(); renderChat(); await Promise.allSettled([refreshHealth(), refreshAllModels()]); }

      tabButtons.forEach((button) => button.addEventListener("click", () => switchTab(button.dataset.tab)));
      llmRefreshBtn.addEventListener("click", () => void refreshDomain("llm"));
      embeddingRefreshBtn.addEventListener("click", () => void refreshDomain("embedding"));
      llmLoadBtn.addEventListener("click", () => void loadModel("llm"));
      embeddingLoadBtn.addEventListener("click", () => void loadModel("embedding"));
      llmUnloadBtn.addEventListener("click", () => void unloadModel("llm"));
      embeddingUnloadBtn.addEventListener("click", () => void unloadModel("embedding"));
      chatSendBtn.addEventListener("click", () => void sendChat());
      chatClearBtn.addEventListener("click", () => { state.chat = []; renderChat(); chatMeta.textContent = ""; });
      completionSendBtn.addEventListener("click", () => void runCompletion());
      completionClearBtn.addEventListener("click", () => { completionPrompt.value = ""; completionOutput.textContent = ""; completionMeta.textContent = ""; });
      embedBtn.addEventListener("click", () => void runEmbedding());
      tokenizeBtn.addEventListener("click", () => void runTokenEndpoint("/api/embedding/tokenize", tokenizeBtn));
      countTokensBtn.addEventListener("click", () => void runTokenEndpoint("/api/embedding/count-tokens", countTokensBtn));
      embeddingClearBtn.addEventListener("click", () => { embeddingInput.value = ""; embeddingOutput.textContent = ""; });
      actAddRowBtn.addEventListener("click", () => addActRow("user", ""));
      actResetBtn.addEventListener("click", () => resetActRows());
      actSendBtn.addEventListener("click", () => void runAct());
      prepareFileBtn.addEventListener("click", () => void prepareFile("/api/files/prepare-file"));
      prepareImageBtn.addEventListener("click", () => void prepareFile("/api/files/prepare-image"));
      parseDocumentBtn.addEventListener("click", () => void parseDocument());
      retrieveBtn.addEventListener("click", () => void retrieveDocuments());
      filesClearBtn.addEventListener("click", () => clearFiles());
      window.addEventListener("load", () => void init());
      window.setInterval(() => { void refreshHealth(); void refreshAllModels(); }, 15000);
    </script>
  </body>
</html>`;
}

export default buildUiHtml;
