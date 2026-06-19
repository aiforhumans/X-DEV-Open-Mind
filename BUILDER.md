# X-DEV Auto Builder/Installer

Complete automated build and installation system for X-DEV projects (LM Studio + Obsidian Plugin).

## Quick Start

### Option 1: Using NPM (Recommended)
```bash
# Install all dependencies and build both projects
npm run install:all
npm run build:all

# Start development
npm run dev:lm          # Watch LM Studio only
npm run dev:obsidian   # Watch Obsidian Plugin only
npm run dev:all        # Watch both (in parallel)

# Start the LM Studio server
npm start
```

### Option 2: PowerShell (Windows)
```powershell
# Install and build everything
.\install-and-build.ps1

# Install, build, and watch for changes
.\install-and-build.ps1 -watch

# Install, build, and start LM Studio
.\install-and-build.ps1 -start

# Build specific project
.\install-and-build.ps1 -project lm-studio
.\install-and-build.ps1 -project obsidian
```

### Option 3: Bash (macOS/Linux)
```bash
# Make script executable
chmod +x install-and-build.sh

# Install and build everything
./install-and-build.sh

# Install, build, and watch for changes
./install-and-build.sh --watch

# Install, build, and start LM Studio
./install-and-build.sh --start

# Build specific project
./install-and-build.sh --project lm-studio
./install-and-build.sh --project obsidian
```

## Available Commands

### NPM Commands
| Command | Description |
|---------|-------------|
| `npm run install:all` | Install dependencies for all projects |
| `npm run build:all` | Build both LM Studio and Obsidian Plugin |
| `npm run build:lm` | Build LM Studio only |
| `npm run build:obsidian` | Build Obsidian Plugin only |
| `npm run dev:all` | Watch both projects for changes |
| `npm run dev:lm` | Watch LM Studio for changes |
| `npm run dev:obsidian` | Watch Obsidian Plugin for changes |
| `npm start` | Run the LM Studio server |
| `npm run clean` | Remove all build artifacts and node_modules |

## Project Structure

```
X-DEV-Open-Mind/
├── X-DEV-LM-Studio/        # Local LLM Server
│   ├── src/
│   ├── dist/               # Compiled output
│   ├── package.json
│   └── tsconfig.json
├── X-DEV-Obsidian/         # Obsidian Plugin
│   ├── src/
│   ├── main.js             # Built plugin
│   ├── package.json
│   ├── esbuild.config.mjs
│   └── tsconfig.json
├── install-and-build.ps1   # PowerShell auto-builder
├── install-and-build.sh    # Bash auto-builder
├── package.json            # Root workspace config
└── README.md               # This file
```

## Features

✅ **Automatic Dependency Installation** - Checks and installs node_modules if missing
✅ **Smart Caching** - Skips reinstalls if dependencies already present
✅ **Cross-Platform** - PowerShell for Windows, Bash for Unix-like systems
✅ **Parallel Building** - Build both projects simultaneously
✅ **Watch Mode** - Automatic recompilation on file changes
✅ **Error Handling** - Exits on build failures with clear error messages
✅ **Color Output** - Visual feedback with colored console output
✅ **NPM Workspaces** - Simplified command structure

## Usage Examples

### Development Workflow
```bash
# Build once
npm run build:all

# Start watching for changes
npm run dev:all

# In another terminal, start the server
npm start
```

### Quick Test
```powershell
# Windows - One command to setup and build
.\install-and-build.ps1

# Then start the server
npm start
```

### Obsidian Plugin Development
```bash
# Build Obsidian plugin only
npm run build:obsidian

# Watch for changes
npm run dev:obsidian
```

### Clean Build
```bash
# Remove everything and start fresh
npm run clean
npm run install:all
npm run build:all
```

## LM Studio Server Usage

After building and starting the server:

```typescript
import LMStudioServer from "./src/index";

const server = new LMStudioServer();
await server.loadModel({ name: "llama-3.2-1b-instruct" });
const result = await server.infer("What is the meaning of life?");
console.log(result);
```

## Troubleshooting

### Dependencies not installing
```bash
# Clean and reinstall
npm run clean
npm run install:all
```

### Build failures
```bash
# Check if TypeScript is complaining
npm run build:lm    # Check LM Studio
npm run build:obsidian  # Check Obsidian
```

### Port already in use (when running start)
- The LM Studio server runs on default port
- Check what's using the port and stop it

## Requirements

- **Node.js** 18+
- **npm** 8+
- **Git** (for version control)

## License

MIT
