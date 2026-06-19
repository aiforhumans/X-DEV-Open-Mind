# Local-Mind: Local LLM Development Platform

A complete development platform for building local LLM applications using LM Studio and Obsidian integration.

## 📁 Project Structure

```
Local-Mind/
├── X-DEV-LM-Studio/        # Local LLM server & agent framework
│   ├── src/                # TypeScript source code
│   ├── dist/               # Compiled JavaScript
│   ├── package.json        # Dependencies & scripts
│   └── README.md           # Project-specific documentation
│
├── X-DEV-Obsidian/         # Obsidian plugin for LLM integration
│   ├── src/                # Plugin source code
│   ├── main.js             # Built plugin bundle
│   ├── manifest.json       # Obsidian plugin manifest
│   ├── package.json        # Dependencies & scripts
│   └── README.md           # Plugin documentation
│
└── Obsidian/               # Obsidian vault (if present)
```

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ installed
- npm 8+
- LM Studio running locally (http://localhost:1234)
- Obsidian (for plugin usage)

### Setup

1. **Install dependencies for LM Studio server:**
   ```bash
   cd X-DEV-LM-Studio
   npm install
   npm run build
   ```

2. **Install dependencies for Obsidian plugin:**
   ```bash
   cd X-DEV-Obsidian
   npm install
   npm run build
   ```

## 📦 Components

### X-DEV-LM-Studio
Local LLM server and framework for TypeScript applications.

**Features:**
- Model loading and management
- Text inference with configurable parameters
- Full TypeScript support
- Compatible with LM Studio SDK

**Commands:**
```bash
npm run build      # Compile TypeScript to JavaScript
npm run dev        # Watch mode for development
npm start          # Run the server
```

**Usage Example:**
```typescript
import LMStudioServer from "./src/index";

const server = new LMStudioServer();
await server.loadModel({ name: "llama-3.2-1b-instruct" });
const result = await server.infer("What is the meaning of life?");
console.log(result);
```

### X-DEV-Obsidian
Obsidian plugin enabling local LLM integration within your Obsidian vault.

**Features:**
- Connect to LM Studio from within Obsidian
- Configurable connection settings
- Auto-connect on startup option
- Plugin settings panel

**Commands:**
```bash
npm run dev        # Watch mode for development
npm run build      # Build for production
npm run lint       # Lint code
```

**Installation:**
1. Build the plugin: `npm run build`
2. Copy `main.js` and `manifest.json` to `~/.obsidian/plugins/x-dev-obsidian-llm/`
3. Enable the plugin in Obsidian settings

## 🛠️ Development Workflow

### Both Projects Use:
- **TypeScript** for type safety
- **npm** for package management
- **esbuild** (Obsidian) / **tsc** (LM Studio) for building

### Development Mode
```bash
# LM Studio - watch TypeScript changes
cd X-DEV-LM-Studio && npm run dev

# Obsidian - watch and hot-reload
cd X-DEV-Obsidian && npm run dev
```

### Production Build
```bash
# Build both projects
cd X-DEV-LM-Studio && npm run build
cd X-DEV-Obsidian && npm run build
```

## 🔗 Integration

The Obsidian plugin connects to the LM Studio server:

1. **Configuration**: Set LM Studio URL in Obsidian plugin settings
2. **Connection**: Plugin communicates with LM Studio API
3. **Inference**: Send prompts from Obsidian to local models

## 📝 Configuration

### LM Studio Server
- API URL: `http://localhost:1234` (default)
- Configure in Obsidian plugin settings

### Obsidian Plugin
- **lmStudioUrl**: URL of LM Studio API (default: `http://localhost:1234`)
- **autoConnect**: Auto-connect on Obsidian startup (default: `true`)

## 📚 Documentation

- [X-DEV-LM-Studio README](./X-DEV-LM-Studio/README.md)
- [X-DEV-Obsidian README](./X-DEV-Obsidian/README.md)

## 🧪 Testing & Verification

Both projects build without errors:
```bash
✓ X-DEV-LM-Studio built successfully
✓ X-DEV-Obsidian built successfully
```

## 🎯 Next Steps

1. **Expand LM Studio Server**:
   - Add real API calls to LM Studio
   - Implement agent framework
   - Add model listing and management

2. **Enhance Obsidian Plugin**:
   - Add UI for model selection
   - Implement prompt templates
   - Add conversation history management

3. **Integration**:
   - Connect plugin to server APIs
   - Add streaming responses
   - Implement error handling

## 📄 License

MIT

## 👤 Author

X-DEV
