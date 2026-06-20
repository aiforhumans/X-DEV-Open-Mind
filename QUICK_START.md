# X-DEV Open Mind - Quick Start Guide

## Installation & Launch (Windows)

### Prerequisites
- **Windows 10/11**
- **Node.js 20+** and **npm** (download from https://nodejs.org/)
- **Obsidian** (download from https://obsidian.md/)
- **LM Studio** running locally (download from https://lmstudio.ai/)

> 💡 **Tip:** Don't have Node.js? Download the LTS version (Node.js 20 or later) from nodejs.org

---

## Getting Started

### 1️⃣ Clone or Download the Repository

```bash
git clone https://github.com/aiforhumans/X-DEV-Open-Mind.git
cd X-DEV-Open-Mind
```

Or download as ZIP and extract it.

### 2️⃣ First Time Setup

**Windows Only:**
```batch
setup.bat
```

This will:
- Check for Node.js ✓
- Install all dependencies (npm install) ✓
- Build both projects ✓
- Show "SETUP COMPLETE!"

> Takes 2-5 minutes on first run

### 3️⃣ Start the System

**Windows Only:**
```batch
start.bat
```

You should see:
```
============================================================================
  X-DEV Open Mind - Launcher
  Starting Backend Server + Obsidian Plugin
============================================================================

[1/5] Checking Node.js and npm...
✓ Node.js v20.x.x found
✓ npm 10.x.x found

[2/5] Checking dependencies...
✓ Dependencies ready

[3/5] Checking builds...
✓ Projects built

[4/5] Starting LM Studio backend server...
✓ Backend server starting on http://localhost:3000

[5/5] Launching Obsidian...
✓ Obsidian launching...

============================================================================
✓ Launcher complete!
============================================================================

Backend Server:
  URL: http://localhost:3000
  Logs: Displayed below

Obsidian Plugin:
  Settings: Plugin settings in Obsidian (Settings > Community Plugins > X-DEV)
  LM Studio URL: http://localhost:1234

To stop: Close this window or press Ctrl+C

============================================================================
```

### 4️⃣ Configure Obsidian Plugin

1. Open **Obsidian**
2. Go to **Settings → Community Plugins**
3. Find and enable **X-DEV Obsidian**
4. Click **X-DEV Obsidian** settings:
   - **LM Studio URL:** `http://localhost:1234`
   - **Model Name:** (e.g., `llama-2-7b-chat`)
   - Check **Auto Connect** if desired
5. Click **Connect to LM Studio** to test

### 5️⃣ Verify Everything Works

1. **Backend Server:** Visit http://localhost:3000 in your browser
   - Should show a simple HTML interface
   - Try the `/health` endpoint - should return `{"status": "ok"}`

2. **Obsidian Plugin:**
   - Use command palette: `Cmd/Ctrl + P`
   - Type "Ask LM Studio"
   - Type a prompt and hit Enter
   - You should get a response from your LM Studio model

---

## Common Commands

| File | What It Does |
|------|-------------|
| `start.bat` | **Use this!** Launches everything (backend + Obsidian) |
| `setup.bat` | Install dependencies and build projects (run once) |
| `stop-all.bat` | Kill all running processes (Node.js, Obsidian) |
| `clean-build.bat` | Full clean rebuild (if something breaks) |

---

## Folder Shortcuts

**Create a desktop shortcut to launch instantly:**

1. Right-click on desktop → **New → Shortcut**
2. Paste this path:
   ```
   C:\X-DEV-Open-Mind\start.bat
   ```
   (Replace `C:\X-DEV-Open-Mind` with your actual folder path)
3. Name it: `X-DEV Start`
4. Click Finish
5. Right-click the shortcut → **Properties → Advanced** → Check **Run as administrator** (optional)

Now double-click to launch!

---

## What's Running

After you run `start.bat`:

| Component | Running On | What It Does |
|-----------|-----------|-------------|
| **Backend Server** | `http://localhost:3000` | Provides chat, completions, embeddings APIs |
| **LM Studio** | `http://localhost:1234` | Local LLM inference (must be running separately) |
| **Obsidian Plugin** | In your Obsidian vault | Integrates with backend to ask questions |

---

## Using the Backend API

The backend provides several endpoints:

```bash
# Check if server is running
curl http://localhost:3000/health

# Get available models
curl http://localhost:3000/v1/models

# Chat completion (example)
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "llama-2-7b-chat",
    "messages": [
      {"role": "user", "content": "What is the meaning of life?"}
    ]
  }'
```

See [X-DEV-LM-Studio/README.md](./X-DEV-LM-Studio/README.md) for full API documentation.

---

## Next Steps

1. ✅ Run `start.bat`
2. ✅ Open Obsidian and configure the plugin
3. ✅ Try asking questions in Obsidian
4. ✅ Explore the API at http://localhost:3000
5. ✅ Check backend logs in the console

---

## Need Help?

See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for common issues and solutions.
