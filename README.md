# X-DEV Open Mind: Local LLM Development Platform

**Status:** Production-ready backend + Obsidian plugin. The backend now serves a tabbed browser console for chat, completions, embeddings, act/tool-calling, files, and model management.

A complete development platform for building local LLM applications using LM Studio and Obsidian integration.

## 📁 Project Structure

```
X-DEV-Open-Mind/
├── X-DEV-LM-Studio/             # Local LLM HTTP server
│   ├── src/
│   │   ├── index.ts             # Main HTTP backend (40KB)
│   │   ├── settingsIntegration.ts  # Settings examples (10KB)
│   │   └── __tests__/           # Unit tests for validators
│   ├── examples/
│   │   └── settings-ui-react/   # React UI prototype (not in build)
│   ├── dist/                    # Compiled JavaScript (production)
│   ├── README.md                # Backend documentation
│   ├── TESTING.md               # Testing guide
│   └── package.json
│
├── X-DEV-Obsidian/              # Obsidian plugin for LLM integration
│   ├── src/main.ts              # Plugin source code
│   ├── manifest.json            # Obsidian plugin manifest
│   ├── main.js                  # Built plugin bundle (production)
│   └── package.json
│
├── DOC/                         # Architecture & findings documentation
│   ├── README.md                # Overview of documentation
│   ├── ARCHITECTURE.md          # System design & data flow
│   ├── LOGIC_AND_FUNCTIONS.md   # Detailed function analysis
│   ├── FINDINGS.md              # Implementation issues & recommendations
│   └── BUILD_AND_TEST_REPORT.md # Verification status & build results
│
├── start.bat                    # 🚀 MAIN LAUNCHER (runs LM Studio tests)
├── setup.bat                    # Install dependencies & build
├── stop-all.bat                 # Stop all running processes
├── clean-build.bat              # Full clean rebuild
├── QUICK_START.md               # User-friendly setup guide
├── TROUBLESHOOTING.md           # Common issues & fixes
├── package.json (root)          # Workspace scripts
└── README.md                    # This file
```

**Windows Users: Run `start.bat` for tests, or `npm start` for the server.**

## 🚀 Quick Start (Windows)

### ⚠️ Authentication Issue?

If you see: **"Failed to authenticate: The LM Studio API token provided was not recognized"**

👉 See **[AUTHENTICATION_FIX.md](./AUTHENTICATION_FIX.md)** for the 2-minute solution

### Prerequisites

- **Windows 10/11**
- **Node.js 20+** and **npm 8+** (download from https://nodejs.org/)
- **LM Studio** (download from https://lmstudio.ai/)
- **Obsidian** (download from https://obsidian.md/)

### Installation & Launch (One Command!)

**First time:**
```batch
setup.bat
```

This installs dependencies and builds everything.

**Every time after:**
```batch
start.bat
```

This runs the LM Studio backend test suite automatically.

✨ That's it! The console will stay open showing test output.

### For macOS/Linux Users

```bash
# Install dependencies
npm install

# Build both projects
npm run build:all

# Run the backend test suite
npm test

# Start the backend server
npm start -w X-DEV-LM-Studio

# Launch Obsidian separately and configure the plugin
```

### Verify Build Success

```bash
npm run build:all

# Expected: Both projects compile with 0 errors
# X-DEV-LM-Studio: ✅ index.js + settingsIntegration.js
# X-DEV-Obsidian: ✅ main.js (1009 KB)
```

### Need Help?

See **[QUICK_START.md](./QUICK_START.md)** for detailed setup instructions and screenshots.

## 📦 Components

### X-DEV-LM-Studio Backend

**Production-ready HTTP server** wrapping LM Studio SDK with a built-in tabbed browser console.

**Features:**
- 📊 Live model status display
- 🔔 Toast notifications for user feedback
- ⚡ Loading spinners on operations
- 🧭 Tabbed console served at `/`
- Health checks and model management
- Chat, completions, embeddings, and act endpoints
- Server-sent event streaming
- File preparation and document parsing
- Built-in HTML browser console at `/`

**Build Status:** ✅ Compiles cleanly
- Only backend files included (React UI excluded)
- Separate TypeScript config: `tsconfig.backend.json`
- No React/DOM dependencies required

**Key Files:**
- `src/index.ts` (42 KB) - Main backend
- `src/settingsIntegration.ts` (10 KB) - Settings helpers
- `src/__tests__/backend.test.ts` - Validator tests

**Usage:**

```bash
# Build
npm run build -w X-DEV-LM-Studio

# Run
npm start -w X-DEV-LM-Studio
# Server listens on http://localhost:3000

# Try it
curl http://localhost:3000/health
curl http://localhost:3000/v1/models
```

**API Routes:**
- `GET /health` - Server status
- `GET /v1/models` - List downloaded models
- `POST /v1/models/load` - Load a model
- `POST /v1/chat/completions` - Chat inference
- `POST /v1/embeddings` - Embedding generation
- `GET /` - Built-in web UI

See [X-DEV-LM-Studio/README.md](./X-DEV-LM-Studio/README.md) for full API documentation.

### X-DEV-Obsidian Plugin

**Production-ready Obsidian plugin** for local LLM integration.

**Features:**
- Connect to LM Studio from Obsidian
- Ask prompts with modal input
- Summarize active notes
- Configurable models and parameters
- Settings tab for endpoint, temperature, max tokens
- Auto-connect on startup option

**Build Status:** ✅ Compiles cleanly (1009 KB bundle)

**Installation:**
1. Build: `npm run build -w X-DEV-Obsidian`
2. Copy `X-DEV-Obsidian/main.js` and `manifest.json` to:
   - `~/.obsidian/plugins/x-dev-obsidian/`
3. Enable in Obsidian: Settings → Community Plugins → X-DEV Obsidian

**Commands:**
- Ribbon icon: "Ask LM Studio"
- Command: "Connect to LM Studio"
- Command: "Ask LM Studio"
- Command: "Summarize active note"

See [X-DEV-Obsidian/README.md](./X-DEV-Obsidian/README.md) for plugin details.

### React Settings UI (Prototype)

**NOT included in production builds.** Located in `X-DEV-LM-Studio/examples/settings-ui-react/`.

Demonstrates settings configuration but requires:
- React dependencies (not installed by default)
- Separate frontend build configuration
- Integration with a bundler (Vite, webpack, etc.)

**Status:** Example/prototype code. See [examples README](./X-DEV-LM-Studio/examples/settings-ui-react/README.md) for details.

## 🛠️ Development

### Build System

- **Root workspace:** `npm` with two workspaces
- **LM Studio:** TypeScript + Node.js (backend only)
- **Obsidian:** TypeScript + esbuild (with plugin build)
- **Separate configs:** `tsconfig.backend.json` excludes React/tests

### Scripts

```bash
# Root level
npm install              # Install all dependencies
npm run build:all        # Build both projects (parallel)
npm run build:lm         # Build LM Studio only
npm run build:obsidian   # Build Obsidian only
npm run dev:all          # Dev watch mode (parallel)

# LM Studio
npm run build -w X-DEV-LM-Studio      # Build backend
npm run dev -w X-DEV-LM-Studio        # Watch mode
npm test                              # Run backend tests
npm start -w X-DEV-LM-Studio          # Run server

# Obsidian
npm run build -w X-DEV-Obsidian       # Build plugin
npm run dev -w X-DEV-Obsidian         # Watch mode
```

### Testing

See [X-DEV-LM-Studio/TESTING.md](./X-DEV-LM-Studio/TESTING.md) for testing guide.

**Current test coverage:**
- Backend request validators (24 tests)
- Settings validation (hand-written runner)

## 📖 Documentation

### Getting Started & Troubleshooting

- **[AUTHENTICATION_FIX.md](./AUTHENTICATION_FIX.md)** - ⚠️ Fix auth errors (2-minute solution!)
- **[QUICK_START.md](./QUICK_START.md)** - User-friendly setup guide
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues & fixes
- **[FIX_LM_STUDIO_AUTH.md](./FIX_LM_STUDIO_AUTH.md)** - Quick reference guide
- **[LM_STUDIO_AUTH_GUIDE.md](./LM_STUDIO_AUTH_GUIDE.md)** - Detailed auth documentation

### Project-Specific Docs

- [X-DEV-LM-Studio/README.md](./X-DEV-LM-Studio/README.md) - Backend API & usage
- [X-DEV-LM-Studio/TESTING.md](./X-DEV-LM-Studio/TESTING.md) - Test setup & strategy
- [X-DEV-Obsidian/README.md](./X-DEV-Obsidian/README.md) - Plugin docs
- [X-DEV-LM-Studio/examples/settings-ui-react/README.md](./X-DEV-LM-Studio/examples/settings-ui-react/README.md) - React UI info

## ✅ Verification Status

### Build Results

| Project | Status | Output |
|---------|--------|--------|
| X-DEV-LM-Studio | ✅ PASS | `index.js` + `settingsIntegration.js` |
| X-DEV-Obsidian | ✅ PASS | `main.js` (1009 KB) |

### Dependencies

- Root: `npm install` ✅
- Obsidian: `npm run build` ✅
- LM Studio: `npm run build` ✅

### Known Issues Fixed

✅ **Phase 1 Stabilization Complete:**
- Fixed build by separating backend-only TypeScript config
- Updated SDK usage in `settingsIntegration.ts`
- Fixed React UI route mismatch (`/models` → `/v1/models`)

## 🎯 Roadmap

### Phase 2: UX Improvements (✅ Complete)

- ✅ Interactive Playground for model testing
- ✅ Live model status display
- ✅ Toast notifications for feedback
- ✅ Loading spinners on operations
- ✅ Authentication fix documentation

### Phase 3: Testing & Docs (In Progress)

- ✅ Move React UI to examples
- ✅ Add backend test suite
- ✅ Update root documentation

### Phase 4: Future

- Extract backend helpers to separate module
- Add Jest/Vitest test runner
- Add end-to-end API tests
- Consider CORS support for remote clients
- Optional: Build proper frontend for settings UI

## 📝 Configuration

### LM Studio Backend

Default binding: `127.0.0.1:3000`

Environment variables (future):
- `LM_STUDIO_URL` - LM Studio API URL (default: `http://localhost:1234`)
- `BACKEND_PORT` - Backend listen port (default: `3000`)

### Obsidian Plugin

Settings available in Obsidian:
- **LM Studio URL** - WebSocket/HTTP endpoint
- **Model Name** - Model identifier to use
- **System Prompt** - Custom system prompt
- **Temperature** - Sampling temperature (0-2)
- **Max Tokens** - Max generation length
- **Auto Connect** - Connect on startup

## 📄 License

MIT

## 👤 Author

X-DEV

---

**Last Updated:** 2026-06-20  
**Documentation Status:** Current with Phase 1 & 3 completions
